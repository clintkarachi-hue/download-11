
"use client";

import { AppHeader } from "@/components/app-header";
import { useUser } from "@/firebase";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

function AppContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

  useEffect(() => {
    // If the user check is done and there's no user, redirect to login.
    if (!isUserLoading && !user) {
      router.push("/login");
    }
  }, [user, isUserLoading, router]);

  // While checking for the user, or if there's no user yet, show a loading screen.
  if (isUserLoading || !user) {
    return (
       <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg font-semibold">Loading...</p>
          <p className="text-muted-foreground">Please wait while we prepare the application.</p>
        </div>
      </div>
    );
  }
  
  // If the user is logged in, provide the data and show the app.
  return (
      <div className="relative flex min-h-screen flex-col">
        <AppHeader />
        <main className="flex-1">
          <div className="container relative p-4 sm:p-6 md:p-8 print:p-0">
            {children}
          </div>
        </main>
      </div>
  )
}


export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppContent>{children}</AppContent>
  );
}
