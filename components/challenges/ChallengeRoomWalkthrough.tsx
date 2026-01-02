"use client";

import {
  Users,
  Trophy,
  Clock,
  Share2,
  Zap,
  BarChart3,
  Globe,
  Timer,
  Medal,
  HelpCircle,
} from "lucide-react";
import AppWalkthrough, {
  useWalkthrough,
  WalkthroughStep,
} from "@/components/AppWalkthrough";

const CHALLENGE_ROOM_STEPS: WalkthroughStep[] = [
  {
    id: "welcome",
    title: "Welcome to Challenge Rooms!",
    description:
      "Compete with friends and cubers worldwide in timed solving challenges. Create or join rooms to test your skills against others in real-time competitions.",
    icon: <Trophy className="w-6 h-6" />,
  },
  {
    id: "create-room",
    title: "Create Your Own Room",
    description:
      "Click 'Quick Action' → 'Create Room' to set up a challenge. Choose your puzzle event, select Ao5 or Ao12 format, and decide if your room is public or private. Rooms are valid for 48 hours.",
    icon: <Zap className="w-6 h-6" />,
  },
  {
    id: "events",
    title: "Multiple Puzzle Events",
    description:
      "Challenge Rooms support 13 different events: 3x3, 2x2, 4x4, 5x5, 6x6, 7x7, 3x3 OH, 3x3 BLD, Pyraminx, Megaminx, Skewb, Square-1, and Clock.",
    icon: <Timer className="w-6 h-6" />,
  },
  {
    id: "join-room",
    title: "Join a Room",
    description:
      "Use 'Quick Action' → 'Join Room' to enter with a code, or browse Active Public Rooms to jump into open challenges anyone can participate in.",
    icon: <Users className="w-6 h-6" />,
  },
  {
    id: "public-private",
    title: "Public vs Private Rooms",
    description:
      "Public rooms appear in the Active Rooms list for anyone to join. Private rooms require a code - perfect for competing with specific friends.",
    icon: <Globe className="w-6 h-6" />,
  },
  {
    id: "competition-format",
    title: "Competition Formats",
    description:
      "Choose Average of 5 (Ao5) or Average of 12 (Ao12). Everyone solves the same scrambles, and your average determines your final ranking.",
    icon: <Clock className="w-6 h-6" />,
  },
  {
    id: "leaderboard",
    title: "Live Leaderboard",
    description:
      "Track progress in real-time! See who's completed their solves, view averages, and watch rankings update as participants finish.",
    icon: <BarChart3 className="w-6 h-6" />,
  },
  {
    id: "results",
    title: "Detailed Results",
    description:
      "When a room closes after 48 hours, view a comprehensive report with final rankings, podium winners, individual solve times, and competition statistics.",
    icon: <Medal className="w-6 h-6" />,
  },
  {
    id: "share",
    title: "Share & Invite Friends",
    description:
      "Easily share your room link with friends using the share button. Challenge your cubing community and see who comes out on top!",
    icon: <Share2 className="w-6 h-6" />,
  },
  {
    id: "stats",
    title: "Track Your Progress",
    description:
      "Your stats are tracked automatically - rooms won, rooms participated in, and rooms created. Build your competitive record over time!",
    icon: <Trophy className="w-6 h-6" />,
  },
];

export default function ChallengeRoomWalkthrough() {
  const {
    isOpen,
    hasCompleted,
    openWalkthrough,
    closeWalkthrough,
    completeWalkthrough,
  } = useWalkthrough("challenge-rooms");

  return (
    <>
      <AppWalkthrough
        steps={CHALLENGE_ROOM_STEPS}
        isOpen={isOpen}
        onClose={closeWalkthrough}
        onComplete={completeWalkthrough}
        walkthroughId="challenge-rooms"
        title="Challenge Rooms"
        subtitle="Compete with cubers in real-time challenges"
      />

      {/* Floating help button - shown when walkthrough is completed */}
      {hasCompleted && !isOpen && (
        <button
          onClick={openWalkthrough}
          className="fixed bottom-4 right-4 z-50 flex items-center gap-2 px-3 py-2 text-sm font-medium bg-[var(--surface)] hover:bg-[var(--surface-elevated)] border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-lg transition-all shadow-lg"
          title="How to use"
          aria-label="Show walkthrough"
        >
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Help</span>
        </button>
      )}
    </>
  );
}

// Custom hook for challenge room walkthrough
export { useWalkthrough as useChallengeRoomWalkthrough };
