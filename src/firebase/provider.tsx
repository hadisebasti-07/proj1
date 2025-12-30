'use client';

import React, { DependencyList, createContext, useContext, ReactNode, useMemo, useState, useEffect } from 'react';
import { FirebaseApp } from 'firebase/app';
import { Firestore, doc, onSnapshot, collection, query, getDocs, limit } from 'firebase/firestore';
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
    if (!firestore || !userAuthState.user) {
      if (!userAuthState.user) {
        setUserAuthState(prevState => ({ ...prevState, isUserLoading: false, isUserAdmin: false, userProfile: null }));
      }
      return;
    }

    const { user } = userAuthState;
    const userDocRef = doc(firestore, 'users', user.uid);
    
    // Check admin status by attempting a query only admins can make.
    const checkAdminStatus = async () => {
      const usersQuery = query(collection(firestore, 'users'), limit(1));
      try {
        await getDocs(usersQuery);
        // If the query succeeds, the user is an admin.
        setUserAuthState(prevState => ({ ...prevState, isUserAdmin: true }));
      } catch (error) {
        // If it fails, they are not an admin. This is expected for non-admins.
        setUserAuthState(prevState => ({ ...prevState, isUserAdmin: false }));
      }
    };
  
    // Subscribe to the user's profile document
    const unsubscribeProfile = onSnapshot(userDocRef, (doc) => {
      const profileData = doc.exists() ? doc.data() as UserProfile : null;
      // After getting the profile, check admin status.
      checkAdminStatus().finally(() => {
        // Only set loading to false after both checks are complete.
        setUserAuthState(prevState => ({
          ...prevState,
          userProfile: profileData,
          isUserLoading: false 
        }));
      });
    }, (error) => {
      console.error("Error fetching user profile:", error);
      // Still check admin status even if profile fails, then stop loading.
      checkAdminStatus().finally(() => {
        setUserAuthState(prevState => ({ ...prevState, userError: error, isUserLoading: false }));
      });
    });
  
    return () => {
      unsubscribeProfile();
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
