
'use client';

import type { User as FirebaseUser } from 'firebase/auth';
import { onAuthStateChanged } from 'firebase/auth';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { auth, isFirebasePotentiallyMisconfigured } from '@/lib/firebase';

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
    if (isFirebasePotentiallyMisconfigured) {
      if (typeof window !== 'undefined') {
        console.warn("AuthProvider: Firebase appears to be misconfigured. User authentication may not work correctly. Please check your .env.local file and Firebase project settings.");
      }
      setLoading(false); // Stop loading, user will remain null or as per last known state if any
      return; // Do not subscribe to onAuthStateChanged if Firebase is likely misconfigured
    }

    if (auth && typeof auth.onAuthStateChanged === 'function') {
      const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
        if (currentUser) {
          console.log('AuthContext: User detected by onAuthStateChanged. UID:', currentUser.uid, 'Email:', currentUser.email);
        } else {
          console.log('AuthContext: No user detected by onAuthStateChanged (user is null).');
        }
        setUser(currentUser);
        setLoading(false);
      });
      // Cleanup subscription on unmount
      return () => unsubscribe();
    } else {
       if (typeof window !== 'undefined') {
        console.error("AuthProvider: Firebase auth service is not available. Cannot track authentication state.");
      }
      setUser(null);
      setLoading(false);
    }
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
