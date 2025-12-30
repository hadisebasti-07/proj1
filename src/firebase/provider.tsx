'use client';

import React, { createContext, useContext, ReactNode, useMemo, useState, useEffect, useCallback } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, getDoc } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener';
import type { User as UserProfile } from '@/lib/types';

interface FirebaseProviderProps {
  children: ReactNode;
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
}

// Internal state for user authentication and profile
interface UserAuthState {
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  isUserAdmin: boolean;
  userError: Error | null;
}

// Combined state for the Firebase context
export interface FirebaseContextState {
  areServicesAvailable: boolean;
  firebaseApp: FirebaseApp | null;
  firestore: Firestore | null;
  auth: Auth | null;
  // User authentication and profile state
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  isUserAdmin: boolean;
  userError: Error | null;
}

// Return type for useFirebase()
export interface FirebaseServicesAndUser {
  firebaseApp: FirebaseApp;
  firestore: Firestore;
  auth: Auth;
  user: User | null;
  userProfile: UserProfile | null;
  isUserLoading: boolean;
  isUserAdmin: boolean;
  userError: Error | null;
}

// Return type for useUser() - specific to user auth state
export interface UserHookResult { 
  user: User | null;
  isUserLoading: boolean;
  userError: Error | null;
}

// React Context
export const FirebaseContext = createContext<FirebaseContextState | undefined>(undefined);

export const FirebaseProvider: React.FC<FirebaseProviderProps> = ({
  children,
  firebaseApp,
  firestore,
  auth,
}) => {
  const [userAuthState, setUserAuthState] = useState<UserAuthState>({
    user: null,
    userProfile: null,
    isUserLoading: true, // Start loading until first auth event
    isUserAdmin: false,
    userError: null,
  });

  // Effect to subscribe to Firebase auth state changes
  useEffect(() => {
    if (!auth) { 
      setUserAuthState({ user: null, userProfile: null, isUserLoading: false, isUserAdmin: false, userError: new Error("Auth service not provided.") });
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(
      auth,
      (firebaseUser) => { 
        setUserAuthState(prevState => ({ ...prevState, user: firebaseUser, isUserLoading: !!firebaseUser, userError: null }));
      },
      (error) => { 
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, userProfile: null, isUserLoading: false, isUserAdmin: false, userError: error });
      }
    );
    return () => unsubscribeAuth(); 
  }, [auth]);

  // Effect to fetch user profile and admin status
  useEffect(() => {
    if (!userAuthState.user || !firestore) {
      if (!userAuthState.user) {
        // If there's no user, we are done loading.
        setUserAuthState(prevState => ({ ...prevState, isUserLoading: false, userProfile: null, isUserAdmin: false }));
      }
      return;
    }

    const { user } = userAuthState;
    const profileRef = doc(firestore, 'users', user.uid);
    const adminRef = doc(firestore, 'roles_admin', user.uid);

    let profileData: UserProfile | null = null;
    let isAdmin = false;
    
    let profileDone = false;
    let adminDone = false;

    const checkAndFinalizeState = () => {
      // Only set loading to false when both checks are complete.
      if (profileDone && adminDone) {
        setUserAuthState(prevState => ({
          ...prevState,
          userProfile: profileData,
          isUserAdmin: isAdmin,
          isUserLoading: false,
        }));
      }
    };

    const unsubscribeProfile = onSnapshot(profileRef, (snapshot) => {
      profileData = snapshot.exists() ? (snapshot.data() as UserProfile) : null;
      profileDone = true;
      checkAndFinalizeState();
    }, (error) => {
      console.error('Error fetching user profile:', error);
      profileData = null;
      profileDone = true;
      checkAndFinalizeState();
    });

    const unsubscribeAdmin = onSnapshot(adminRef, (snapshot) => {
      isAdmin = snapshot.exists();
      adminDone = true;
      checkAndFinalizeState();
    }, (error) => {
      // Errors are expected if collection/doc doesn't exist or rules deny.
      // We can safely assume user is not an admin.
      isAdmin = false;
      adminDone = true;
      checkAndFinalizeState();
    });

    return () => {
      unsubscribeProfile();
      unsubscribeAdmin();
    };
  }, [userAuthState.user, firestore]);

  // Memoize the context value
  const contextValue = useMemo((): FirebaseContextState => {
    const servicesAvailable = !!(firebaseApp && firestore && auth);
    return {
      areServicesAvailable: servicesAvailable,
      firebaseApp: servicesAvailable ? firebaseApp : null,
      firestore: servicesAvailable ? firestore : null,
      auth: servicesAvailable ? auth : null,
      ...userAuthState,
    };
  }, [firebaseApp, firestore, auth, userAuthState]);

  return (
    <FirebaseContext.Provider value={contextValue}>
      <FirebaseErrorListener />
      {children}
    </FirebaseContext.Provider>
  );
};

export const useFirebase = (): FirebaseServicesAndUser => {
  const context = useContext(FirebaseContext);

  if (context === undefined) {
    throw new Error('useFirebase must be used within a FirebaseProvider.');
  }

  if (!context.areServicesAvailable || !context.firebaseApp || !context.firestore || !context.auth) {
    throw new Error('Firebase core services not available. Check FirebaseProvider props.');
  }

  return {
    firebaseApp: context.firebaseApp,
    firestore: context.firestore,
    auth: context.auth,
    user: context.user,
    userProfile: context.userProfile,
    isUserLoading: context.isUserLoading,
    isUserAdmin: context.isUserAdmin,
    userError: context.userError,
  };
};

/** Hook to access Firebase Auth instance. */
export const useAuth = (): Auth => {
  const { auth } = useFirebase();
  return auth;
};

/** Hook to access Firestore instance. */
export const useFirestore = (): Firestore => {
  const { firestore } = useFirebase();
  return firestore;
};

/** Hook to access Firebase App instance. */
export const useFirebaseApp = (): FirebaseApp => {
  const { firebaseApp } = useFirebase();
  return firebaseApp;
};

export function useMemoFirebase<T>(factory: () => T, deps: React.DependencyList): T {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized === 'object' && memoized !== null) {
    Object.defineProperty(memoized, '__memo', {
      value: true,
      writable: false,
      enumerable: false,
    });
  }
  
  return memoized;
}

export const useUser = (): UserHookResult => { 
  const { user, isUserLoading, userError } = useFirebase(); 
  return { user, isUserLoading, userError };
};
