"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { getWCAOAuthUrl } from "@/lib/wca-config";
import { Loader2 } from "lucide-react";
import Image from "next/image";
import Head from "next/head";
import ChallengeRoom from "@/components/challenges/ChallengeRoom";

interface RoomPageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function RoomPage({ params }: RoomPageProps) {
  const { roomId } = use(params);
  const { user, isLoading } = useUser();

  // Fetch room details for dynamic metadata
  const roomDetails = useQuery(api.challengeRooms.getRoomDetails, { roomId });

  const handleWCASignIn = () => {
    // Store the current URL to redirect back after sign-in
    localStorage.setItem("wca_redirect_url", window.location.href);
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  // Show loading state while checking authentication or fetching room details
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 text-[var(--primary)] animate-spin mx-auto" />
          <p className="text-[var(--text-secondary)] font-inter">
            Loading challenge room...
          </p>
        </div>
      </div>
    );
  }

  // If user is not authenticated, show sign-in prompt
  if (!user) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <div className="max-w-md mx-auto text-center space-y-6 p-8">
          <div className="space-y-3">
            <h1 className="text-3xl font-bold text-[var(--text-primary)] font-statement">
              Join <span className="text-[var(--primary)]">Challenge</span> Room
            </h1>
            <p className="text-[var(--text-secondary)] font-inter text-lg leading-relaxed">
              Sign in with your WCA account to participate in this challenge
              room and compete with other cubers.
            </p>
          </div>

          <button
            onClick={handleWCASignIn}
            className="w-full btn-primary flex items-center justify-center gap-3 font-inter"
          >
            <Image
              src="/wca_logo.png"
              alt="WCA Logo"
              width={24}
              height={24}
              className="w-6 h-6"
            />
            Sign in with WCA
          </button>

          <p className="text-xs text-[var(--text-muted)] font-inter">
            You'll be redirected back to this room after signing in
          </p>
        </div>
      </div>
    );
  }

  // Main room view
  return (
    <div className="min-h-screen bg-[var(--background)]">
      {/* Dynamic metadata */}
      {roomDetails?.room && (
        <Head>
          <title>{roomDetails.room.name} | Challenge Room | CubeDev</title>
          <meta
            name="description"
            content={`Join ${roomDetails.room.name} - a ${roomDetails.room.event.toUpperCase()} ${roomDetails.room.format.toUpperCase()} challenge room. Compete with other speedcubers in real-time.`}
          />
          <meta
            name="robots"
            content={
              roomDetails.room.isPublic ? "index,follow" : "noindex,nofollow"
            }
          />
        </Head>
      )}
      <ChallengeRoom roomId={roomId} />
    </div>
  );
}