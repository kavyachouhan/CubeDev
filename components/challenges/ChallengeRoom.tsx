"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import dynamic from "next/dynamic";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

// Import components
import RoomHeader from "./RoomHeader";
import RoomScrambleDisplay from "./RoomScrambleDisplay";
import RoomProgress from "./RoomProgress";
import RoomLeaderboard from "./RoomLeaderboard";
import RoomJoinCard from "./RoomJoinCard";
import RoomTimer from "./RoomTimer";
import EditRoomModal from "./EditRoomModal";
import RoomClosureReport from "./RoomClosureReport";
import UserSolvesCard from "./UserSolvesCard";

// Dynamically import ScramblePreview
const ScramblePreview = dynamic(
  () => import("@/components/timer/ScramblePreview"),
  {
    loading: () => (
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Scramble Preview
          </h3>
        </div>
        <div className="w-full min-h-[200px] bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
          <div className="text-center">
            <div className="text-4xl mb-2">🧩</div>
            <div className="text-sm text-[var(--text-muted)]">
              Loading preview...
            </div>
          </div>
        </div>
      </div>
    ),
    ssr: false,
  }
);

interface ChallengeRoomProps {
  roomId: string;
}

const EVENTS = {
  "333": { name: "3x3", icon: "/cube-icons/333.svg" },
  "222": { name: "2x2", icon: "/cube-icons/222.svg" },
  "444": { name: "4x4", icon: "/cube-icons/444.svg" },
  "555": { name: "5x5", icon: "/cube-icons/555.svg" },
  "666": { name: "6x6", icon: "/cube-icons/666.svg" },
  "777": { name: "7x7", icon: "/cube-icons/777.svg" },
  "333oh": { name: "3x3 OH", icon: "/cube-icons/333oh.svg" },
  "333bf": { name: "3x3 BLD", icon: "/cube-icons/333bf.svg" },
  pyram: { name: "Pyraminx", icon: "/cube-icons/pyram.svg" },
  minx: { name: "Megaminx", icon: "/cube-icons/minx.svg" },
  skewb: { name: "Skewb", icon: "/cube-icons/skewb.svg" },
  sq1: { name: "Square-1", icon: "/cube-icons/sq1.svg" },
  clock: { name: "Clock", icon: "/cube-icons/clock.svg" },
};

function formatTimeRemaining(expiresAt: number): string {
  const now = Date.now();
  const remaining = expiresAt - now;

  if (remaining <= 0) return "Expired";

  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 24) {
    const days = Math.floor(hours / 24);
    return `${days}d ${hours % 24}h`;
  } else if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else {
    return `${minutes}m`;
  }
}

export default function ChallengeRoom({ roomId }: ChallengeRoomProps) {
  const { user } = useUser();
  const [currentSolveIndex, setCurrentSolveIndex] = useState(0);
  const [copied, setCopied] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [isJoining, setIsJoining] = useState(false);

  // Queries
  const roomDetails = useQuery(api.challengeRooms.getRoomDetails, { roomId });
  const userParticipation = useQuery(
    api.challengeRooms.getUserParticipation,
    user?.convexId ? { userId: user.convexId, roomId } : "skip"
  );

  // Mutations
  const joinRoom = useMutation(api.challengeRooms.joinRoom);
  const submitSolve = useMutation(api.challengeRooms.submitSolve);

  // Update current solve index when userParticipation changes
  useEffect(() => {
    if (userParticipation?.participant) {
      setCurrentSolveIndex(userParticipation.participant.solvesCompleted);
    }
  }, [userParticipation?.participant]);

  // Handle joining room
  const handleJoinRoom = async () => {
    if (!user?.convexId || isJoining) return;

    setIsJoining(true);
    try {
      await joinRoom({ userId: user.convexId, roomId });
    } catch (error) {
      console.error("Failed to join room:", error);
    } finally {
      setIsJoining(false);
    }
  };

  // Handle solve completion
  const handleSolveComplete = async (
    time: number,
    penalty: "none" | "+2" | "DNF"
  ) => {
    if (!user?.convexId || !userParticipation?.participant) return;

    try {
      await submitSolve({
        userId: user.convexId,
        roomId,
        solveNumber: currentSolveIndex + 1,
        time,
        penalty,
      });

      setCurrentSolveIndex((prev) => prev + 1);
    } catch (error) {
      console.error("Failed to submit solve:", error);
    }
  };

  // Handle sharing room
  const handleShareRoom = () => {
    const roomUrl = `${window.location.origin}/cube-lab/challenges/room/${roomId}`;
    navigator.clipboard.writeText(roomUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Handle edit room
  const handleEditRoom = () => {
    setShowEditModal(true);
  };

  // Loading state
  if (!roomDetails) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-[var(--text-secondary)] font-inter">
            Loading challenge room...
          </p>
        </div>
      </div>
    );
  }

  // Room not found
  if (!roomDetails.room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Room Not Found
          </h1>
          <p className="text-[var(--text-secondary)] mb-4">
            The room code "{roomId}" does not exist or has expired.
          </p>
          <Link
            href="/cube-lab/challenges"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Challenges
          </Link>
        </div>
      </div>
    );
  }

  const { room, participants } = roomDetails;
  const event = EVENTS[room.event as keyof typeof EVENTS] || {
    name: room.event,
    icon: "/cube-icons/333.svg",
  };
  const timeRemaining = formatTimeRemaining(room.expiresAt);
  const isExpired = room.isExpired || room.expiresAt < Date.now();
  const userHasJoined = userParticipation?.participant;
  const isCompleted = userHasJoined?.isCompleted || false;
  const canEdit = user?.convexId === room.createdBy;

  // Get current scramble
  const currentScramble =
    userHasJoined && currentSolveIndex < room.scrambles.length
      ? room.scrambles[currentSolveIndex]
      : room.scrambles[0];

  return (
    <div className="container-responsive py-4 md:py-8">
      <RoomHeader
        room={room}
        event={event}
        timeRemaining={timeRemaining}
        isExpired={isExpired}
        onShare={handleShareRoom}
        onEdit={handleEditRoom}
        copied={copied}
        canEdit={canEdit}
      />

      {/* Room Closure Report */}
      {isExpired ? (
        <RoomClosureReport
          room={room}
          participants={participants}
          event={event}
        />
      ) : (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-4 md:gap-6">
          {/* Left Column - Controls & Timer */}
          <div className="xl:col-span-2 space-y-4 md:space-y-6">
            {!userHasJoined && (
              <RoomJoinCard onJoin={handleJoinRoom} isLoading={isJoining} />
            )}

            {userHasJoined && (
              <>
                {/* Show scramble, progress, and timer if not completed */}
                {!isCompleted && (
                  <>
                    <RoomScrambleDisplay scramble={currentScramble} />

                    <RoomProgress
                      userHasJoined={userHasJoined}
                      currentSolveIndex={currentSolveIndex}
                      totalSolves={userHasJoined.totalSolves}
                      isCompleted={isCompleted}
                    />

                    <RoomTimer
                      onSolveComplete={handleSolveComplete}
                      scramble={currentScramble}
                      solveNumber={currentSolveIndex + 1}
                      totalSolves={userHasJoined.totalSolves}
                      isDisabled={isExpired}
                    />
                  </>
                )}

                {/* Show user solves card for completed users or users with progress */}
                {(isCompleted || userParticipation?.solves?.length > 0) && (
                  <UserSolvesCard
                    solves={userParticipation?.solves || []}
                    totalSolves={userHasJoined.totalSolves}
                    format={room.format}
                    currentSolveIndex={currentSolveIndex}
                    isCompleted={isCompleted}
                    bestSingle={userHasJoined.bestSingle}
                    average={userHasJoined.average}
                  />
                )}
              </>
            )}
          </div>

          {/* Right Column - Preview & Leaderboard */}
          <div className="xl:col-span-2 space-y-4 md:space-y-6 order-last xl:order-none">
            {/* Only show scramble preview if user hasn't completed and has joined */}
            {userHasJoined && currentScramble && !isCompleted && (
              <ScramblePreview scramble={currentScramble} event={room.event} />
            )}

            <RoomLeaderboard
              participants={participants}
              room={{
                roomId: room.roomId,
                event: room.event,
                name: room.name,
                format: room.format,
              }}
            />
          </div>
        </div>
      )}

      {/* Edit Room Modal */}
      {showEditModal && (
        <EditRoomModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          room={{
            _id: room._id,
            roomId: room.roomId,
            name: room.name,
            description: room.description || "",
            format: room.format,
            expiresAt: room.expiresAt,
          }}
        />
      )}
    </div>
  );
}