
'use client';

import { useState, useEffect, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Spinner } from '@/components/Spinner';
import { Logo } from '@/components/Logo';
import { auth, db } from '@/lib/firebase'; // Import db
import { createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore'; // Import Firestore functions
import { useAuth } from '@/contexts/AuthContext';

export default function SignupPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);

  const handleSignUp = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsLoading(true);

    const formData = new FormData(event.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    if (!email || !password) {
      toast({
        title: 'Error',
        description: 'Email and password are required.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }
    if (password.length < 6) {
      toast({
        title: 'Error',
        description: 'Password must be at least 6 characters.',
        variant: 'destructive',
      });
      setIsLoading(false);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      if (userCredential.user) {
        await sendEmailVerification(userCredential.user);

        // Create user document in Firestore
        try {
          const userDocRef = doc(db, 'users', userCredential.user.uid);
          await setDoc(userDocRef, {
            uid: userCredential.user.uid,
            email: userCredential.user.email,
            displayName: userCredential.user.displayName || '', // Firebase User obj might not have displayName immediately
            photoURL: userCredential.user.photoURL || '',
            subscribedChannelIds: [], // Initialize with empty subscriptions
            createdAt: new Date().toISOString(),
          });
          console.log("User document created/updated in Firestore for UID:", userCredential.user.uid);
        } catch (firestoreError) {
          console.error("Error creating/updating user document in Firestore:", firestoreError);
          // This error shouldn't block the signup success toast, but should be logged
          // Optionally, you could inform the user that some profile setup failed.
        }

        toast({
          title: 'Success!',
          description: 'Account created. A verification email has been sent. Please check your inbox and then log in.',
        });
        router.push('/login'); 
      } else {
         toast({
          title: 'Account Created',
          description: 'Account created, but failed to send verification email. Please try logging in.',
        });
        router.push('/login');
      }
    } catch (error: any) {
      console.error("Sign up error:", error);
      let errorMessage = 'Sign up failed. Please try again.';
       if (error.code) {
        switch (error.code) {
          case 'auth/email-already-in-use':
            errorMessage = 'This email address is already in use. Please try a different email or log in.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          case 'auth/operation-not-allowed':
            errorMessage = 'Email/password accounts are not enabled.';
            break;
          case 'auth/weak-password':
            errorMessage = 'The password is too weak. Please use a stronger password.';
            break;
          default:
            errorMessage = error.message || 'An unexpected error occurred.';
        }
      }
      toast({
        title: 'Sign Up Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  if (user && !authLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Spinner size="h-12 w-12" />
        <p className="mt-4 text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-6">
      <Logo />
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-2xl">Create Account</CardTitle>
          <CardDescription>Enter your email and password to create an account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignUp}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required minLength={6} />
              <p className="text-xs text-muted-foreground">Password must be at least 6 characters.</p>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Create Account
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
