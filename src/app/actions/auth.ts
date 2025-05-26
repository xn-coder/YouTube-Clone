
'use server';

import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut,
  sendEmailVerification // Import sendEmailVerification
} from 'firebase/auth';
import type { ZodError } from 'zod';

// Re-export or define types for input if needed, or use Zod schemas directly
// For simplicity, we'll use basic types here.
// In a real app, you'd use Zod schemas for validation like in the forms.

export interface AuthFormState {
  message: string;
  errors?: Record<string, string[] | undefined>;
  success: boolean;
}

export async function signUpWithEmail(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  // Basic validation (consider Zod for more complex scenarios)
  if (!email || !password) {
    return { message: 'Email and password are required.', success: false };
  }
  if (password.length < 6) {
    return { message: 'Password must be at least 6 characters.', success: false };
  }

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    // Send verification email
    if (userCredential.user) {
      await sendEmailVerification(userCredential.user);
      return { 
        message: 'Sign up successful! A verification email has been sent. Please check your inbox.', 
        success: true 
      };
    }
    // This case should ideally not be reached if createUserWithEmailAndPassword succeeds
    return { message: 'Sign up successful, but failed to send verification email.', success: true };
  } catch (error: any) {
    console.error("Sign up error:", error);
    // Provide more specific error messages if available
    let errorMessage = 'Sign up failed. Please try again.';
    if (error.code === 'auth/email-already-in-use') {
      errorMessage = 'This email address is already in use. Please try a different email or log in.';
    } else if (error.code === 'auth/weak-password') {
      errorMessage = 'The password is too weak. Please use a stronger password.';
    } else if (error.message) {
      errorMessage = error.message;
    }
    return { message: errorMessage, success: false };
  }
}

export async function signInWithEmail(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Email and password are required.', success: false };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    // Optional: Check if email is verified before considering sign-in fully successful for redirection
    // if (userCredential.user && !userCredential.user.emailVerified) {
    //   return { message: 'Please verify your email address before logging in. A new verification email has been sent.', success: false };
    //   // Optionally, resend verification email here:
    //   // await sendEmailVerification(userCredential.user); 
    // }
    return { message: 'Sign in successful! Redirecting...', success: true };
  } catch (error: any) {
    console.error("Sign in error:", error);
    let errorMessage = 'Sign in failed. Invalid credentials or user not found.';
    if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
    } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. You can immediately restore it by resetting your password or you can try again later.';
    } else if (error.message) {
        errorMessage = error.message;
    }
    return { message: errorMessage, success: false };
  }
}

export async function signOutUser(): Promise<{ success: boolean; message?: string }> {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return { success: false, message: error.message || 'Sign out failed.' };
  }
}
