"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { ArrowRight, ExternalLink, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { EventIcon } from "@/components/ui/EventIcon";
import { Modal } from "@/components/ui/Modal";
import { SkeletonList } from "@/components/ui/Skeleton";

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

  return (
    <Modal open={isOpen} onClose={onClose} size="xl" mobile="fullscreen">
      <Modal.Header title="Recent Challenge Rooms" />
      <Modal.Body>
        {!user ? (
          <EmptyState
            icon={<Users />}
            title="Sign in to view your recent rooms"
          />
        ) : recentRooms === undefined ? (
          <SkeletonList rows={5} withAvatar />
        ) : !recentRooms || recentRooms.length === 0 ? (
          <EmptyState
            icon={<Trophy />}
            title="No challenge rooms yet"
            action={
              <Button variant="secondary" onClick={onClose} iconRight={<ArrowRight className="w-4 h-4" />}>
                Create or join your first room
              </Button>
            }
          />
        ) : (
          <div className="space-y-3">
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
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[0.625rem] text-white font-bold"
                        style={{ background: "var(--medal-gold)" }}
                      >
                        1
                      </span>
                      <span className="text-xs font-medium" style={{ color: "var(--medal-gold)" }}>
                        Winner
                      </span>
                    </span>
                  );
                } else if (participation.finalRank <= 3) {
                  return (
                    <span className="inline-flex items-center gap-1.5">
                      <span
                        aria-hidden
                        className="w-4 h-4 rounded-full flex items-center justify-center text-[0.625rem] text-white font-bold"
                        style={{ background: "var(--medal-silver)" }}
                      >
                        {participation.finalRank}
                      </span>
                      <span className="text-xs font-medium text-(--text-secondary)">Top 3</span>
                    </span>
                  );
                } else {
                  return (
                    <span className="text-xs text-(--text-muted)">
                      #{participation.finalRank}
                    </span>
                  );
                }
              };

              return (
                <div
                  key={participation._id}
                  className="p-3 sm:p-4 bg-(--surface-elevated) border border-(--border) rounded-(--radius-control) hover:border-(--border-hover) transition-colors group"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <EventIcon eventId={room.event} src={event.icon} alt={event.name} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="type-label truncate">{room.name}</h4>
                          <Badge tone="primary">{room.format.toUpperCase()}</Badge>
                        </div>
                        <div className="flex items-center gap-2 type-caption flex-wrap">
                          <span>{event.name}</span>
                          <span aria-hidden>·</span>
                          <span>{formatTimeAgo(participation.joinedAt)}</span>
                          {participation.isCompleted ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="text-(--success) font-medium">Completed</span>
                            </>
                          ) : isRoomExpiredAndIncomplete(room, participation) ? (
                            <>
                              <span aria-hidden>·</span>
                              <span className="text-(--error) font-medium">Incomplete</span>
                            </>
                          ) : null}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end">
                      <div className="text-left sm:text-right flex flex-col gap-1">
                        {isRoomExpiredAndIncomplete(room, participation) ? (
                          <span className="text-(--error) text-sm font-medium">Incomplete</span>
                        ) : participation.average ? (
                          <span className="type-time font-semibold text-(--text-primary)">
                            {formatTime(participation.average)}
                          </span>
                        ) : participation.isCompleted ? (
                          <span className="type-caption">DNF</span>
                        ) : (
                          <span className="type-caption">
                            {participation.solvesCompleted}/{participation.totalSolves}
                          </span>
                        )}
                        {!isRoomExpiredAndIncomplete(room, participation) && getRankDisplay()}
                      </div>

                      <Link
                        href={`/cube-lab/challenges/room/${room.roomId}`}
                        aria-label={`Open ${room.name}`}
                        className="icon-btn w-9 h-9 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 focus-visible:opacity-100 pointer-coarse:opacity-100 transition-opacity"
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
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
      </Modal.Footer>
    </Modal>
  );
}