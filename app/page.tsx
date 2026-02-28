"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client-side redirect is more robust for some hosting environments
    router.replace("/login");
  }, [router]);

  return (
    <div className="flex h-screen items-center justify-center bg-background">
      <p className="text-lg font-medium animate-pulse">Loading...</p>
    </div>
  );
}
