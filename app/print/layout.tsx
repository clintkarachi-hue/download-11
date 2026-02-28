
import React from 'react';
import type { Metadata } from 'next'
import { FirebaseClientProvider } from '@/firebase/client-provider';

export const metadata: Metadata = {
  title: 'Print View',
}

export default function PrintLayout({ children }: { children: React.ReactNode }) {
  // This layout ensures the print pages are clean and have no extra elements.
  // It includes the FirebaseClientProvider to ensure data is available for printing.
  // The error listener is disabled to prevent debug overlays on the printed page.
  return (
    <html lang="en">
      <body>
          <FirebaseClientProvider withDataProvider={false} withErrorListener={false}>
            {children}
          </FirebaseClientProvider>
      </body>
    </html>
  );
}
