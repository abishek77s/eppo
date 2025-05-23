"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // Corrected for App Router

export default function AuthControls() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const handleLogout = async () => {
    await signOut({ redirect: false }); // Set redirect to false to handle it manually
    router.push('/login'); // Redirect to login page after logout
  };

  if (status === "loading") {
    return <div style={{ marginRight: '10px' }}>Loading...</div>;
  }

  if (session) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', marginRight: '10px' }}>
        {/* Responsive user identifier: hide on very small screens, truncate on small, full on larger */}
        <p style={{ marginRight: '10px', color: 'white' }} className="hidden sm:inline truncate max-w-[100px] md:max-w-xs">
          {session.user?.name || session.user?.email}
        </p>
        {/* Simplified identifier for very small screens if needed, or rely on truncation */}
        <p style={{ marginRight: '10px', color: 'white' }} className="sm:hidden truncate max-w-[70px]">
           {session.user?.email?.split('@')[0]} {/* Show only part of email for smallest screens */}
        </p>
        <button 
          onClick={handleLogout}
          style={{ 
            padding: '8px 12px', 
            backgroundColor: '#ff4d4d', 
            color: 'white', 
            border: 'none', 
            borderRadius: '4px', 
            cursor: 'pointer' 
          }}
        >
          Logout
        </button>
      </div>
    );
  }

  return (
    <div style={{ marginRight: '10px' }}>
      <Link href="/login" style={{ marginRight: '10px', color: 'white', textDecoration: 'none' }}>
        Login
      </Link>
      <Link href="/signup" style={{ color: 'white', textDecoration: 'none' }}>
        Sign Up
      </Link>
    </div>
  );
}
