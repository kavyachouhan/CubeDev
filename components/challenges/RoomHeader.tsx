"use client";

import { Users, Trophy, Goal, Edit3 } from "lucide-react";
import Link from "next/link";
import {
  Badge,
  BackLink,
  Button,
  Card,
  EventIcon,
} from "@/components/ui";
import RoomShareMenu from "./RoomShareMenu";

interface RoomHeaderProps {
  room: any;
  event: any;
  timeRemaining: string;
  isExpired: boolean;
  onEdit?: () => void;
  canEdit: boolean;
}

export default function RoomHeader({
  room,
  event,
  timeRemaining,
  isExpired,
  onEdit,
  canEdit,
}: RoomHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <BackLink href="/cube-lab/challenges">Back to Challenges</BackLink>

        {/* Labels drop below `sm`: two labelled buttons crowd the back link. */}
        <div className="flex items-center gap-2 shrink-0">
          {canEdit && onEdit && (
            <Button
              size="sm"
              variant="secondary"
              onClick={onEdit}
              aria-label="Edit room settings"
              iconLeft={<Edit3 className="w-4 h-4" />}
            >
              <span className="hidden sm:inline">Edit</span>
            </Button>
          )}
          <RoomShareMenu
            roomId={room.roomId}
            roomName={room.name}
            eventName={event.name}
            format={room.format}
          />
        </div>
      </div>

      {/* Room Info Card */}
      <Card>
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between lg:gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <EventIcon
              eventId={room.event}
              size="lg"
              src={event.icon}
              alt={event.name}
              className="mt-0.5"
            />

            <div className="min-w-0 flex-1 space-y-2">
              <h1 className="type-page-title wrap-break-word">{room.name}</h1>

              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral" size="sm" icon={<Goal />}>
                  {event.name}
                </Badge>
                <Badge tone="neutral" size="sm" icon={<Trophy />}>
                  {room.format.toUpperCase()}
                </Badge>
                <Badge tone="neutral" size="sm" icon={<Users />}>
                  {room.participantCount || 0} participants
                </Badge>
              </div>

              {room.description && (
                <p className="type-caption line-clamp-2">{room.description}</p>
              )}
            </div>
          </div>

          {/* Status and byline share a baseline instead of stacking ragged. */}
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 lg:flex-col lg:items-end lg:shrink-0">
            <Badge
              shape="pill"
              tone={
                isExpired
                  ? "danger"
                  : timeRemaining.includes("h")
                    ? "success"
                    : "warning"
              }
            >
              {isExpired ? "Expired" : `${timeRemaining} left`}
            </Badge>

            <p className="type-caption min-w-0 truncate">
              Created by{" "}
              {room.creator?.isDeleted ? (
                <span className="font-medium text-(--text-secondary)">
                  Deleted User
                </span>
              ) : room.creator?.wcaId ? (
                <Link
                  href={`/cuber/${room.creator.wcaId}`}
                  className="font-medium text-(--text-secondary) hover:text-(--primary) transition-colors"
                >
                  {room.creator?.name || "Unknown"}
                </Link>
              ) : (
                <span className="font-medium text-(--text-secondary)">
                  {room.creator?.name || "Unknown"}
                </span>
              )}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
