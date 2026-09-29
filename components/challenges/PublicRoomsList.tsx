"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Clock, Users, Trophy, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  Card,
  CardHeader,
  EmptyState,
  EventIcon,
  SkeletonList,
} from "@/components/ui";
import { getTimerEvent } from "@/lib/timer-events";

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
      <Card variant="static">
        <CardHeader as="h2" title="Active public rooms" />
        <SkeletonList rows={3} withAvatar />
      </Card>
    );
  }

  if (!publicRooms || publicRooms.length === 0) {
    return (
      <Card variant="static">
        <CardHeader as="h2" title="Active public rooms" />
        <EmptyState
          icon={<Trophy />}
          title="No active rooms"
          description="Be the first to create a public challenge room!"
        />
      </Card>
    );
  }

  return (
    <Card variant="static">
      <CardHeader
        as="h2"
        title="Active public rooms"
        actions={
          <Badge tone="primary" shape="pill">
            {publicRooms.length} room{publicRooms.length !== 1 ? "s" : ""}
          </Badge>
        }
      />

      <ul className="space-y-2">
        {publicRooms.map((room) => {
          const eventName = getTimerEvent(room.event).name;
          const timeRemaining = formatTimeRemaining(room.expiresAt);
          // Under six hours the countdown is the thing to notice, not decoration.
          const isExpiring = room.expiresAt - Date.now() < 6 * 60 * 60 * 1000;

          return (
            <Card
              as="li"
              key={room._id}
              variant="nested"
              className="p-0! hover:border-(--primary) transition-colors group"
            >
              <Link
                href={`/cube-lab/challenges/room/${room.roomId}`}
                className="flex items-start gap-3 p-3 md:p-4"
              >
                {/* Aligned to the title line, not to the middle of a block
                    that runs to three lines on a phone. */}
                <EventIcon eventId={room.event} size="lg" className="mt-0.5" />

                <div className="min-w-0 flex-1 space-y-1.5">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <h3 className="type-card-title min-w-0 truncate group-hover:text-(--primary) transition-colors">
                      {room.name}
                    </h3>
                    <Badge tone="primary" size="sm">
                      {room.format.toUpperCase()}
                    </Badge>
                    <Badge tone="neutral" size="sm">
                      {eventName}
                    </Badge>
                  </div>

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 type-caption">
                    <span className="flex items-center gap-1">
                      <Users aria-hidden className="w-3.5 h-3.5" />
                      {room.participantCount}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock aria-hidden className="w-3.5 h-3.5" />
                      {room.completedCount} done
                    </span>
                    <span
                      className={`flex items-center gap-1 ${
                        isExpiring ? "text-(--warning) font-medium" : ""
                      }`}
                    >
                      <Calendar aria-hidden className="w-3.5 h-3.5" />
                      {timeRemaining} left
                    </span>
                  </div>

                  {room.description && (
                    <p className="type-caption line-clamp-2">
                      {room.description}
                    </p>
                  )}

                  {room.creator && (
                    <p className="type-caption truncate">
                      by{" "}
                      <span className="text-(--text-secondary)">
                        {room.creator.isDeleted
                          ? "Deleted User"
                          : room.creator.name}
                      </span>
                    </p>
                  )}
                </div>

                <ArrowRight
                  aria-hidden
                  className="w-5 h-5 shrink-0 self-center text-(--text-muted) group-hover:text-(--primary) transition-colors"
                />
              </Link>
            </Card>
          );
        })}
      </ul>
    </Card>
  );
}
