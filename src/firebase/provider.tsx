'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot } from 'firebase/firestore';
import { Auth, User, onAuthStateChanged } from 'firebase/auth';
import { FirebaseErrorListener } from '@/components/FirebaseErrorListener'
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
        if (firebaseUser) {
           setUserAuthState(prevState => ({ ...prevState, user: firebaseUser, isUserLoading: true, userError: null }));
        } else {
           // If user logs out, reset everything and set loading to false.
           setUserAuthState({ user: null, userProfile: null, isUserLoading: false, isUserAdmin: false, userError: null });
        }
      },
      (error) => { 
        console.error("FirebaseProvider: onAuthStateChanged error:", error);
        setUserAuthState({ user: null, userProfile: null, isUserLoading: false, isUserAdmin: false, userError: error });
      }
    );
    return () => unsubscribeAuth(); 
  }, [auth]); 

  // Effect to subscribe to user's profile and admin status based on auth state
  useEffect(() => {
    // If there's no user, reset user-specific data and stop.
    if (!firestore || !userAuthState.user) {
      if (!userAuthState.user) {
        // This ensures that on logout, loading is confirmed as false.
        setUserAuthState(prevState => ({ ...prevState, isUserLoading: false, isUserAdmin: false, userProfile: null }));
      }
      return;
    }
  
    const { user } = userAuthState;
    const userDocRef = doc(firestore, 'users', user.uid);
    const adminRoleDocRef = doc(firestore, 'roles_admin', user.uid);
  
    // Keep track of whether initial data has been loaded from both snapshots
    let profileLoaded = false;
    let adminLoaded = false;
  
    const checkLoadingComplete = () => {
      if (profileLoaded && adminLoaded) {
        setUserAuthState(prevState => ({ ...prevState, isUserLoading: false }));
      }
    };
  
    const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
      setUserAuthState(prevState => ({
        ...prevState,
        userProfile: doc.exists() ? doc.data() as UserProfile : null
      }));
      profileLoaded = true;
      checkLoadingComplete();
    }, (error) => {
      console.error("Error fetching user profile:", error);
      setUserAuthState(prevState => ({ ...prevState, userError: error }));
      profileLoaded = true;
      checkLoadingComplete();
    });
  
    const unsubscribeAdmin = onSnapshot(adminRoleDocRef, (doc) => {
      setUserAuthState(prevState => ({
        ...prevState,
        isUserAdmin: doc.exists()
      }));
      adminLoaded = true;
      checkLoadingComplete();
    }, (error) => {
      console.error("Error fetching admin status:", error);
      setUserAuthState(prevState => ({ ...prevState, userError: error }));
      adminLoaded = true;
      checkLoadingComplete();
    });
  
    // Cleanup function to unsubscribe from both listeners on component unmount or user change
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
      user: userAuthState.user,
      userProfile: userAuthState.userProfile,
      isUserLoading: userAuthState.isUserLoading,
      isUserAdmin: userAuthState.isUserAdmin,
      userError: userAuthState.userError,
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

type MemoFirebase <T> = T & {__memo?: boolean};

export function useMemoFirebase<T>(factory: () => T, deps: DependencyList): T | (MemoFirebase<T>) {
  const memoized = useMemo(factory, deps);
  
  if(typeof memoized !== 'object' || memoized === null) return memoized;
  (memoized as MemoFirebase<T>).__memo = true;
  
  return memoized;
}

export const useUser = (): UserHookResult => { 
  const { user, isUserLoading, userError } = useFirebase(); 
  return { user, isUserLoading, userError };
};
