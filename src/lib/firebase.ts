
'use client'; // Ensure this is a client module if it's used by client components

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, type Auth } from 'firebase/auth';
// Changed to namespace import for firestore to access Blob and other functions
import * as firestore from 'firebase/firestore';
// The type Firestore will now be firestore.Firestore

// These should be loaded from .env.local
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Check for placeholder or missing values
export let isFirebasePotentiallyMisconfigured = false;
const configValues = Object.values(firebaseConfig);
if (configValues.some(value => !value || String(value).startsWith("YOUR_") || String(value).includes("YOUR_") || String(value).includes("your-"))) {
  isFirebasePotentiallyMisconfigured = true;
  if (typeof window !== 'undefined') { // Only log in browser console
    console.warn(
      "%cFirebase CRITICAL WARNING: Firebase configuration values in `.env.local` (or environment variables) seem to be placeholders, missing, or incorrect. " +
      "Please ensure all `NEXT_PUBLIC_FIREBASE_...` variables are correctly set with your *actual* Firebase project credentials. " +
      "Authentication and other Firebase services WILL NOT WORK correctly until this is fixed. " +
      "Loaded config that caused this warning:", "color: red; font-size: 1.2em; font-weight: bold;", firebaseConfig
    );
  }
}

// Initialize Firebase
let app: FirebaseApp;
try {
  if (!getApps().length) {
    app = initializeApp(firebaseConfig as any); // Cast to any to allow init even if some keys are undefined
  } else {
    app = getApp();
  }
} catch (error) {
  console.error("%cFirebase CRITICAL ERROR: Failed to initialize Firebase app. This is critical. Please check your Firebase configuration thoroughly.", "color: red; font-size: 1.2em; font-weight: bold;", error);
  console.error("Attempted to initialize with config:", firebaseConfig);
  // Assign a dummy app object to prevent crashes if auth or db are accessed, but they won't work.
  app = { name: '[uninitialized]', options: {}, automaticDataCollectionEnabled: false } as unknown as FirebaseApp;
  isFirebasePotentiallyMisconfigured = true; // Mark as misconfigured if init fails
}

let authInstance: Auth;
let dbInstance: firestore.Firestore; // Use namespaced type
let FirestoreBlobExport: typeof firestore.Blob | undefined = undefined; // Variable to hold the Blob constructor

// Check if firestore.Blob is defined after namespace import
if (firestore && typeof firestore.Blob !== 'undefined') {
  FirestoreBlobExport = firestore.Blob;
} else {
  if (typeof window !== 'undefined') { // Log this only in the browser
    console.error(
      "%cFirebase CRITICAL MODULE ERROR: `firestore.Blob` is undefined after importing `firebase/firestore`. " +
      "This indicates a severe issue with the Firebase SDK module resolution or installation. " +
      "Video upload functionality requiring Firestore Blob will be unavailable. " +
      "Please try deleting node_modules, .next, and reinstalling dependencies (npm install).",
      "color: red; font-size: 1.2em; font-weight: bold;"
    );
  }
}


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
    dbInstance = firestore.getFirestore(app); // Use namespaced getFirestore
  } catch (error) {
    if (typeof window !== 'undefined') console.error("Firebase Error: Failed to initialize Auth or Firestore services after app initialization. This might be due to a misconfiguration that wasn't caught earlier.", error);
    authInstance = {} as Auth; 
    dbInstance = {} as firestore.Firestore;
    isFirebasePotentiallyMisconfigured = true;
  }
} else {
  authInstance = {} as Auth;
  dbInstance = {} as firestore.Firestore;
  if (typeof window !== 'undefined' && !isFirebasePotentiallyMisconfigured) { 
      console.error("Firebase CRITICAL ERROR: Firebase app object is not available. Auth and Firestore will not work.");
      isFirebasePotentiallyMisconfigured = true;
  }
}

export { app as firebaseApp, authInstance as auth, dbInstance as db, FirestoreBlobExport as FirestoreBlob };
