"use client"; // This page now uses client-side hooks

import Demo from "../demo"
import AuthControls from "@/components/AuthControls";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Page() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return; // Don't do anything while loading
    if (!session) {
      router.push('/login'); // Redirect to login if not authenticated
    }
  }, [session, status, router]);

  if (status === "loading" || !session) {
    // You can render a loading state here or null
    return <p>Loading session or redirecting...</p>; 
  }

  // If session exists, render the page
  return (
    <div>
      {/* Responsive header using Tailwind classes */}
      <header className="flex flex-col sm:flex-row sm:justify-between items-center p-3 bg-gray-800 text-white shadow-md">
        <h1 className="text-lg sm:text-xl font-semibold mb-2 sm:mb-0">Event Notice Board</h1>
        <AuthControls />
      </header>
      <main>
        <Demo />
      </main>
    </div>
  );
}
