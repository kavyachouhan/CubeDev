"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Clock, Users, Trophy, Calendar, ArrowRight } from "lucide-react";
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

export default function PublicRoomsList() {
  const publicRooms = useQuery(api.challengeRooms.getPublicRooms, {
    limit: 10,
  });

  if (publicRooms === undefined) {
    return (
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] font-statement">
            Active Public Rooms
          </h2>
        </div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg animate-pulse"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                  <div className="space-y-2">
                    <div className="h-4 bg-gray-200 rounded w-32" />
                    <div className="h-3 bg-gray-200 rounded w-24" />
                  </div>
                </div>
                <div className="h-8 bg-gray-200 rounded w-20" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!publicRooms || publicRooms.length === 0) {
    return (
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] font-statement">
            Active Public Rooms
          </h2>
        </div>
        <div className="p-8 text-center bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
          <div className="w-16 h-16 bg-[var(--primary)]/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <Trophy className="w-8 h-8 text-[var(--primary)]" />
          </div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-2">
            No Active Rooms
          </h3>
          <p className="text-[var(--text-secondary)] font-inter">
            Be the first to create a public challenge room!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-[var(--text-primary)] font-statement">
          Active Public Rooms
        </h2>
        <span className="px-3 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-sm font-medium rounded-full font-inter">
          {publicRooms.length} room{publicRooms.length !== 1 ? "s" : ""}
        </span>
      </div>

      <div className="space-y-3">
        {publicRooms.map((room) => {
          const event = EVENTS[room.event as keyof typeof EVENTS] || {
            name: room.event,
            icon: "/cube-icons/333.svg",
          };
          const timeRemaining = formatTimeRemaining(room.expiresAt);
          const isExpiring = room.expiresAt - Date.now() < 6 * 60 * 60 * 1000; // less than 6 hours

          return (
            <Link
              key={room._id}
              href={`/cube-lab/challenges/room/${room.roomId}`}
              className="block p-3 md:p-4 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] rounded-lg transition-all duration-300 group"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  {/* Event Icon */}
                  <div className="w-8 h-8 md:w-10 md:h-10 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-1 flex-shrink-0">
                    <Image
                      src={event.icon}
                      alt={event.name}
                      width={24}
                      height={24}
                      className="w-5 h-5 md:w-6 md:h-6 brightness-0 invert"
                    />
                  </div>

                  {/* Room Info */}
                  <div className="min-w-0 flex-1">
                    {/* Room Name */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h3 className="font-semibold text-[var(--text-primary)] font-statement group-hover:text-[var(--primary)] transition-colors text-sm md:text-base truncate">
                        {room.name}
                      </h3>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="px-2 py-1 bg-[var(--primary)]/10 text-[var(--primary)] text-xs font-medium rounded font-inter">
                          {room.format.toUpperCase()}
                        </span>
                        <span className="hidden sm:inline px-2 py-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] text-xs font-medium rounded font-inter">
                          {event.name}
                        </span>
                      </div>
                    </div>

                    {/* Room Stats */}
                    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-xs md:text-sm text-[var(--text-secondary)] font-inter">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Users className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{room.participantCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 md:w-4 md:h-4" />
                          <span>{room.completedCount} done</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3 md:w-4 md:h-4" />
                        <span
                          className={
                            isExpiring ? "text-orange-600 font-medium" : ""
                          }
                        >
                          {timeRemaining} left
                        </span>
                      </div>
                    </div>

                    {/* Room Description */}
                    {room.description && (
                      <p className="hidden md:block text-sm text-[var(--text-secondary)] font-inter line-clamp-1 mt-1">
                        {room.description}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 md:gap-3 flex-shrink-0">
                  {/* Room Creator */}
                  {room.creator && (
                    <div className="hidden lg:block text-right text-sm">
                      <p className="text-[var(--text-muted)] font-inter text-xs">
                        by
                      </p>
                      <p className="font-medium text-[var(--text-secondary)] font-inter">
                        {room.creator.isDeleted
                          ? "Deleted User"
                          : room.creator.name}
                      </p>
                    </div>
                  )}

                  <ArrowRight className="w-4 h-4 md:w-5 md:h-5 text-[var(--text-muted)] group-hover:text-[var(--primary)] transition-colors" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}