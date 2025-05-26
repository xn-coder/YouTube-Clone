
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
import { auth } from '@/lib/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useAuth } from '@/contexts/AuthContext';

export default function LoginPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // If user is already logged in and auth is not loading, redirect them
    if (user && !authLoading) {
      router.push('/');
    }
  }, [user, authLoading, router]);


  const handleSignIn = async (event: FormEvent<HTMLFormElement>) => {
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

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      // Firebase onAuthStateChanged will handle the user context update.
      // We can check for email verification here if desired.
      if (userCredential.user && !userCredential.user.emailVerified) {
        toast({
          title: 'Verification Required',
          description: 'Please verify your email address before logging in. A new verification email might have been sent.',
          variant: 'destructive',
        });
        // Optionally, resend verification: await sendEmailVerification(userCredential.user);
        setIsLoading(false);
        // Note: Firebase might still sign the user in locally.
        // Depending on UX, you might sign them out here or let them proceed to a restricted area.
        // For now, we'll let AuthContext handle the user state.
        return; 
      }

      toast({
        title: 'Success',
        description: 'Sign in successful! Redirecting...',
      });
      // router.push('/'); // AuthContext effect will handle this
    } catch (error: any) {
      console.error("Sign in error:", error);
      let errorMessage = 'Sign in failed. Please try again.';
      if (error.code) {
        switch (error.code) {
          case 'auth/user-not-found':
          case 'auth/wrong-password':
          case 'auth/invalid-credential':
            errorMessage = 'Invalid email or password. Please try again.';
            break;
          case 'auth/too-many-requests':
            errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
            break;
          case 'auth/invalid-email':
            errorMessage = 'The email address is not valid.';
            break;
          default:
            errorMessage = error.message || 'An unexpected error occurred.';
        }
      }
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Prevent rendering form if already logged in and redirecting
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
          <CardTitle className="text-2xl">Sign In</CardTitle>
          <CardDescription>Enter your email and password to access your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSignIn}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" name="email" type="email" placeholder="m@example.com" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading || authLoading}>
              {isLoading ? <Spinner className="mr-2" /> : null}
              Sign In
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don&apos;t have an account?{' '}
              <Link href="/signup" className="font-medium text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
