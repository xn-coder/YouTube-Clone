
'use client'; 

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage'; // Import Firebase Storage

// These should be loaded from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

export let isFirebasePotentiallyMisconfigured = false;
const configValues = Object.values(firebaseConfig);
if (configValues.some(value => !value || String(value).startsWith("YOUR_") || String(value).includes("YOUR_") || String(value).includes("your-"))) {
  isFirebasePotentiallyMisconfigured = true;
  if (typeof window !== 'undefined') { 
    console.warn(
      "%cFirebase CRITICAL WARNING: Firebase configuration values in `.env.local` (or environment variables) seem to be placeholders, missing, or incorrect. " +
      "Please ensure all `NEXT_PUBLIC_FIREBASE_...` variables are correctly set with your *actual* Firebase project credentials. " +
      "Authentication and other Firebase services WILL NOT WORK correctly until this is fixed. " +
      "Loaded config that caused this warning:", "color: red; font-size: 1.2em; font-weight: bold;", firebaseConfig
    );
  }
}

let app: FirebaseApp;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig as any); 
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("%cFirebase CRITICAL ERROR: Failed to initialize Firebase app. This is critical. Please check your Firebase configuration thoroughly.", "color: red; font-size: 1.2em; font-weight: bold;", error);
  console.error("Attempted to initialize with config:", firebaseConfig);
  app = { name: '[uninitialized]', options: {}, automaticDataCollectionEnabled: false } as unknown as FirebaseApp;
  isFirebasePotentiallyMisconfigured = true; 
}

let authInstance: Auth;
let dbInstance: Firestore;
let storageInstance: FirebaseStorage; // Declare storage instance

if (app && app.name !== '[uninitialized]') {
  try {
    authInstance = getAuth(app);
    if (typeof window !== 'undefined') {
      setPersistence(authInstance, browserLocalPersistence)
        .then(() => {
          if (typeof window !== 'undefined') console.info("%cFirebase Auth persistence set to localStorage.", "color: blue;");
        })
        .catch((error) => {
          if (typeof window !== 'undefined') console.error("Error setting Firebase Auth persistence to localStorage:", error);
        });
    }
    dbInstance = getFirestore(app);
    storageInstance = getStorage(app); // Initialize Firebase Storage
  } catch (error) {
    if (typeof window !== 'undefined') console.error("Firebase Error: Failed to initialize Auth, Firestore, or Storage services after app initialization. This might be due to a misconfiguration that wasn't caught earlier.", error);
    authInstance = {} as Auth; 
    dbInstance = {} as Firestore;
    storageInstance = {} as FirebaseStorage;
    isFirebasePotentiallyMisconfigured = true;
  }
} else {
  authInstance = {} as Auth;
  dbInstance = {} as Firestore;
  storageInstance = {} as FirebaseStorage;
  if (typeof window !== 'undefined' && !isFirebasePotentiallyMisconfigured) { 
      console.error("Firebase CRITICAL ERROR: Firebase app object is not available. Auth, Firestore, and Storage will not work.");
      isFirebasePotentiallyMisconfigured = true;
  }
}

export { app as firebaseApp, authInstance as auth, dbInstance as db, storageInstance as storage };
