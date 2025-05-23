"use client" // demo.tsx is likely a client component if it interacts with NoticeBoard directly in some ways
import NoticeBoard from "./NoticeBoard"
import { useSession } from "next-auth/react"
import Link from "next/link"

// Sample event data is removed as NoticeBoard now fetches its own data.
// We might keep it for a non-authenticated fallback or pure UI demo if needed,
// but the primary path is through API.

export default function Demo() {
  const { data: session, status } = useSession();

  // The NoticeBoard component now handles its own data fetching based on session.
  // No need to pass `events` prop anymore.
  // Other props like spreadFactor, rotationRange, etc., can still be passed if needed.

  if (status === "loading") {
    return (
      <div className="h-screen w-full flex items-center justify-center">
        <p>Loading session...</p>
      </div>
    );
  }
  
  // If not authenticated, NoticeBoard will show a login prompt or a public view.
  // If authenticated, it will fetch user's event lists and events.

  return (
    <div className="h-screen w-full">
      {/* 
        The `events` prop is removed. NoticeBoard fetches data internally.
        If you had specific initial events for a public/logged-out view, 
        that logic would now need to be inside NoticeBoard or passed differently.
      */}
      <NoticeBoard 
        spreadFactor={70} 
        rotationRange={5} 
        cardSize="medium" 
        // No 'events' prop needed here anymore as it's fetched internally
      />
    </div>
  )
}
