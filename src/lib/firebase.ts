
import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getAuth, type Auth } from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';

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
if (configValues.some(value => !value || String(value).startsWith("YOUR_") || String(value).includes("YOUR"))) {
  isFirebasePotentiallyMisconfigured = true;
  if (typeof window !== 'undefined') { // Only log in browser console
    console.warn(
      "Firebase Warning: One or more Firebase configuration values in `src/lib/firebase.ts` seem to be placeholders or are missing. " +
      "Please ensure all `NEXT_PUBLIC_FIREBASE_...` environment variables are correctly set in your `.env.local` file. " +
      "Authentication and other Firebase services may not work as expected. Loaded config:", firebaseConfig
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
  console.error("Firebase Error: Failed to initialize Firebase app. This is critical. Please check your Firebase configuration thoroughly.", error);
  console.error("Attempted to initialize with config:", firebaseConfig);
  // Assign a dummy app object to prevent crashes if auth or db are accessed, but they won't work.
  app = { name: '[uninitialized]', options: {}, automaticDataCollectionEnabled: false } as unknown as FirebaseApp;
  isFirebasePotentiallyMisconfigured = true; // Mark as misconfigured if init fails
}

let auth: Auth;
let db: Firestore;

if (app && app.name !== '[uninitialized]') {
  try {
    auth = getAuth(app);
    db = getFirestore(app);
  } catch (error) {
    console.error("Firebase Error: Failed to initialize Auth or Firestore services after app initialization. This might be due to a misconfiguration that wasn't caught earlier.", error);
    auth = {} as Auth; // Dummy objects
    db = {} as Firestore;
    isFirebasePotentiallyMisconfigured = true;
  }
} else {
  // If app initialization failed, provide dummy objects to prevent crashes
  auth = {} as Auth;
  db = {} as Firestore;
  if (typeof window !== 'undefined' && !isFirebasePotentiallyMisconfigured) {
      // This case (app uninitialized but not caught by earlier checks) is unlikely but good to flag.
      console.error("Firebase Critical Error: Firebase app object is not available. Auth and Firestore will not work.");
      isFirebasePotentiallyMisconfigured = true;
  }
}

export { app, auth, db };
