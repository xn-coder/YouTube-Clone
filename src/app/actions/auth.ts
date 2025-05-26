
'use server';

import { auth } from '@/lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut 
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
    await createUserWithEmailAndPassword(auth, email, password);
    return { message: 'Sign up successful! Redirecting...', success: true };
  } catch (error: any) {
    console.error("Sign up error:", error);
    return { message: error.message || 'Sign up failed. Please try again.', success: false };
  }
}

export async function signInWithEmail(prevState: AuthFormState, formData: FormData): Promise<AuthFormState> {
  const email = formData.get('email') as string;
  const password = formData.get('password') as string;

  if (!email || !password) {
    return { message: 'Email and password are required.', success: false };
  }

  try {
    await signInWithEmailAndPassword(auth, email, password);
    return { message: 'Sign in successful! Redirecting...', success: true };
  } catch (error: any) {
    console.error("Sign in error:", error);
    return { message: error.message || 'Sign in failed. Invalid credentials or user not found.', success: false };
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
