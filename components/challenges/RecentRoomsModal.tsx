"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import {
  X,
  Trophy,
  Users,
  ArrowRight,
  ExternalLink,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";

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

function formatTime(ms: number): string {
  if (ms === Number.MAX_SAFE_INTEGER || ms === Infinity) return "DNF";

  const totalMs = Math.round(ms);
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  } else {
    return `${seconds}.${milliseconds.toString().padStart(3, "0")}`;
  }
}

function formatTimeAgo(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `${days}d ago`;
  } else if (hours > 0) {
    return `${hours}h ago`;
  } else {
    const minutes = Math.floor(diff / (1000 * 60));
    return `${minutes}m ago`;
  }
}

function isRoomExpiredAndIncomplete(room: any, participation: any): boolean {
  const isExpired = Date.now() > room.expiresAt || room.status === "expired";
  const hasIncompleteParticipation =
    !participation.isCompleted || participation.solvesCompleted === 0;
  return isExpired && hasIncompleteParticipation;
}

interface RecentRoomsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function RecentRoomsModal({
  isOpen,
  onClose,
}: RecentRoomsModalProps) {
  const { user } = useUser();
  const recentRooms = useQuery(
    api.challengeRooms.getUserRecentRooms,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-0 mb-6">
          <div className="flex items-center gap-3">
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-statement">
              Recent Challenge Rooms
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)] self-start sm:self-auto"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!user ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Users className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-inter">
              Please sign in to view your recent rooms
            </p>
          </div>
        ) : recentRooms === undefined ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg animate-pulse"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="w-8 h-8 bg-[var(--border)] rounded-lg flex-shrink-0" />
                  <div className="space-y-2 flex-1">
                    <div className="h-4 bg-[var(--border)] rounded w-full max-w-32" />
                    <div className="h-3 bg-[var(--border)] rounded w-full max-w-24" />
                  </div>
                </div>
                <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1">
                  <div className="h-6 bg-[var(--border)] rounded w-16" />
                  <div className="h-4 bg-[var(--border)] rounded w-12" />
                </div>
              </div>
            ))}
          </div>
        ) : !recentRooms || recentRooms.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-3">
              <Trophy className="w-6 h-6 text-[var(--text-muted)]" />
            </div>
            <p className="text-[var(--text-secondary)] font-inter mb-3">
              No challenge rooms yet
            </p>
            <button
              onClick={onClose}
              className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline text-sm font-medium"
            >
              Create or join your first room <ArrowRight className="w-3 h-3" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {recentRooms.map(({ participation, room }) => {
              if (!room) return null;

              const event = EVENTS[room.event as keyof typeof EVENTS] || {
                name: room.event,
                icon: "/cube-icons/333.svg",
              };

              const getRankDisplay = () => {
                if (!participation.finalRank) return null;

                if (participation.finalRank === 1) {
                  return (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-yellow-500 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">1</span>
                      </div>
                      <span className="text-xs text-yellow-600 font-medium">
                        Winner
                      </span>
                    </div>
                  );
                } else if (participation.finalRank <= 3) {
                  return (
                    <div className="flex items-center gap-1">
                      <div className="w-4 h-4 bg-gray-400 rounded-full flex items-center justify-center">
                        <span className="text-xs text-white font-bold">
                          {participation.finalRank}
                        </span>
                      </div>
                      <span className="text-xs text-gray-600 font-medium">
                        Top 3
                      </span>
                    </div>
                  );
                } else {
                  return (
                    <span className="text-xs text-[var(--text-muted)]">
                      #{participation.finalRank}
                    </span>
                  );
                }
              };

              return (
                <div
                  key={participation._id}
                  className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:bg-[var(--border)] transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center flex-shrink-0">
                      <Image
                        src={event.icon}
                        alt={event.name}
                        width={24}
                        height={24}
                        className="w-6 h-6 flex-shrink-0 brightness-0 invert"
                      />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-[var(--text-primary)] font-inter truncate">
                            {room.name}
                          </h4>
                          <span className="px-2 py-0.5 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded flex-shrink-0">
                            {room.format.toUpperCase()}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 sm:gap-3 text-xs text-[var(--text-muted)] flex-wrap">
                          <span>{event.name}</span>
                          <span className="hidden sm:inline">•</span>
                          <span>{formatTimeAgo(participation.joinedAt)}</span>
                          {participation.isCompleted ? (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-green-600 font-medium">
                                Completed
                              </span>
                            </>
                          ) : isRoomExpiredAndIncomplete(
                              room,
                              participation
                            ) ? (
                            <>
                              <span className="hidden sm:inline">•</span>
                              <span className="text-red-500 font-medium">
                                Incomplete
                              </span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
                      <div className="text-left sm:text-right flex flex-col gap-1">
                        {isRoomExpiredAndIncomplete(room, participation) ? (
                          <span className="text-red-500 text-sm font-medium">
                            Incomplete
                          </span>
                        ) : participation.average ? (
                          <span className="font-mono font-semibold text-[var(--text-primary)]">
                            {formatTime(participation.average)}
                          </span>
                        ) : participation.isCompleted ? (
                          <span className="text-[var(--text-muted)] text-sm">
                            DNF
                          </span>
                        ) : (
                          <span className="text-[var(--text-muted)] text-sm">
                            {participation.solvesCompleted}/
                            {participation.totalSolves}
                          </span>
                        )}
                        {!isRoomExpiredAndIncomplete(room, participation) &&
                          getRankDisplay()}
                      </div>

                      <Link
                        href={`/cube-lab/challenges/room/${room.roomId}`}
                        className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                        title="View Room"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-6 mt-6 border-t border-[var(--border)]">
          <button onClick={onClose} className="btn-secondary">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}