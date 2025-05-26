
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, isFirebasePotentiallyMisconfigured } from '@/lib/firebase'; // Import isFirebasePotentiallyMisconfigured

interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  // You can add more auth-related functions here if needed, e.g., for profile updates
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Log the config being used by Firebase on the client for diagnostics
    if (typeof window !== 'undefined') {
      console.log("%cAuthContext: Initializing with Firebase config:", "color: blue; font-weight: bold;", {
        apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
        authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
        projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
        appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
      });

      if (isFirebasePotentiallyMisconfigured) { // Check the flag here
        console.warn(
          "%cAuthContext: Firebase appears to be misconfigured according to `isFirebasePotentiallyMisconfigured` flag from `firebase.ts`. " +
          "User authentication and session persistence will likely fail. " +
          "Please meticulously check your `.env.local` file, ensure all `NEXT_PUBLIC_FIREBASE_...` variables are correct with your *actual* Firebase project credentials, and that the development server has been restarted after any changes.",
          "color: red; font-size: 1.1em; font-weight: bold;"
        );
        setLoading(false);
        setUser(null); // Ensure user is null if misconfigured
        return; // Stop further Firebase auth setup if misconfigured
      }
    }

    // This check is important for cases where auth object might be unexpectedly null or malformed
    // even if isFirebasePotentiallyMisconfigured was false (e.g., other SDK issues).
    if (!auth || typeof auth.onAuthStateChanged !== 'function') {
       if (typeof window !== 'undefined') {
        console.error(
          "%cAuthContext: Firebase auth service is not available or `onAuthStateChanged` is not a function. " +
          "This usually indicates a severe Firebase initialization issue. Cannot track authentication state.",
          "color: red; font-size: 1.1em; font-weight: bold;"
        );
      }
      setUser(null);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        console.log('%cAuthContext: User detected by onAuthStateChanged. UID:', 'color: green;', currentUser.uid, 'Email:', currentUser.email);
      } else {
        console.log('%cAuthContext: No user detected by onAuthStateChanged (user is null).', 'color: orange;');
      }
      setUser(currentUser);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []); // Empty dependency array means this effect runs once on mount and cleans up on unmount

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
