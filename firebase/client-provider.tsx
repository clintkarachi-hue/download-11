
'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase';
import { DataProvider } from './data/data-provider';

interface FirebaseClientProviderProps {
  children: ReactNode;
  withDataProvider?: boolean;
  withErrorListener?: boolean;
}

export function FirebaseClientProvider({ children, withDataProvider = true, withErrorListener = true }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Initialize Firebase on the client side, once per component mount.
    return initializeFirebase();
  }, []); // Empty dependency array ensures this runs only once on mount

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      withErrorListener={withErrorListener}
    >
      {withDataProvider ? <DataProvider>{children}</DataProvider> : children}
    </FirebaseProvider>
  );
}
