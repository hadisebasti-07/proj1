'use client';
import {
  Auth, // Import Auth type for type hinting
  signInAnonymously,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  // Assume getAuth and app are initialized elsewhere
} from 'firebase/auth';
import { getFirestore, setDoc, doc, serverTimestamp } from 'firebase/firestore';
import { setDocumentNonBlocking } from './non-blocking-updates';

/** Initiate anonymous sign-in (non-blocking). */
export function initiateAnonymousSignIn(authInstance: Auth): void {
  // CRITICAL: Call signInAnonymously directly. Do NOT use 'await signInAnonymously(...)'.
  signInAnonymously(authInstance);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}

/** Initiate email/password sign-up (non-blocking). */
export function initiateEmailSignUp(
  authInstance: Auth,
  email: string,
  password: string
): void {
  // CRITICAL: Call createUserWithEmailAndPassword directly.
  createUserWithEmailAndPassword(authInstance, email, password)
    .then((userCredential) => {
      // After user is created in Auth, create their document in Firestore.
      const user = userCredential.user;
      const firestore = getFirestore(authInstance.app);
      const userDocRef = doc(firestore, 'users', user.uid);

      const newUser = {
        uid: user.uid,
        email: user.email,
        displayName: user.email?.split('@')[0] || 'New User', // Default name
        photoURL: user.photoURL || '',
        role: 'customer', // Default role for new users
        createdAt: serverTimestamp(),
      };

      // Use the non-blocking function to create the document
      setDocumentNonBlocking(userDocRef, newUser, { merge: false });
    })
    .catch((error) => {
      // The UserAuthForm will handle displaying this error to the user via toast.
      console.error('Error during sign up and user creation:', error);
      // Re-throwing the error allows the calling component's catch block to execute.
      throw error;
    });
}

/** Initiate email/password sign-in (non-blocking). */
export function initiateEmailSignIn(authInstance: Auth, email: string, password: string): void {
  // CRITICAL: Call signInWithEmailAndPassword directly. Do NOT use 'await signInWithEmailAndPassword(...)'.
  signInWithEmailAndPassword(authInstance, email, password);
  // Code continues immediately. Auth state change is handled by onAuthStateChanged listener.
}
