"use client";

import {
  ArrowLeft,
  Users,
  Trophy,
  Copy,
  Check,
  Goal,
  Edit3,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface RoomHeaderProps {
  room: any;
  event: any;
  timeRemaining: string;
  isExpired: boolean;
  onShare: () => void;
  onEdit?: () => void;
  copied: boolean;
  canEdit: boolean;
}

export default function RoomHeader({
  room,
  event,
  timeRemaining,
  isExpired,
  onShare,
  onEdit,
  copied,
  canEdit,
}: RoomHeaderProps) {
  return (
    <div className="mb-6 md:mb-8">
      {/* Back Navigation */}
      <div className="flex items-center justify-between mb-4">
        <Link
          href="/cube-lab/challenges"
          className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors font-inter text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Challenges
        </Link>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          {canEdit && onEdit && (
            <button
              onClick={onEdit}
              className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg transition-all duration-200 font-inter text-sm"
              title="Edit room settings"
            >
              <Edit3 className="w-4 h-4" />
              <span className="hidden sm:inline">Edit</span>
            </button>
          )}
          <button
            onClick={onShare}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--primary)] text-white hover:bg-[var(--primary-hover)] rounded-lg transition-all duration-200 font-inter text-sm hover:scale-105"
            title="Share room link"
          >
            {copied ? (
              <Check className="w-4 h-4" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {copied ? "Copied!" : "Share"}
            </span>
          </button>
        </div>
      </div>

      {/* Room Info Card */}
      <div className="timer-card">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            {/* Event Icon */}
            <div className="w-12 h-12 sm:w-16 sm:h-16 bg-[var(--primary)] rounded-xl flex items-center justify-center border border-[var(--primary)]/20">
              <Image
                src={event.icon}
                alt={event.name}
                width={32}
                height={32}
                className="w-6 h-6 sm:w-8 sm:h-8 brightness-0 invert"
              />
            </div>

            {/* Room Details */}
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-statement mb-2 line-clamp-2">
                {room.name}
              </h1>

              {/* Room Metadata */}
              <div className="flex flex-wrap items-center gap-3 text-sm text-[var(--text-secondary)] font-inter mb-3">
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
                  <Goal className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="font-medium">{event.name}</span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
                  <Trophy className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="font-medium">
                    {room.format.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 px-2 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
                  <Users className="w-3.5 h-3.5 text-[var(--primary)]" />
                  <span className="font-medium">
                    {room.participantCount || 0} participants
                  </span>
                </div>
              </div>

              {/* Room Description */}
              {room.description && (
                <p className="text-sm text-[var(--text-secondary)] font-inter line-clamp-2">
                  {room.description}
                </p>
              )}
            </div>
          </div>

          <div className="text-left sm:text-right flex-shrink-0">
            {/* Room Status */}
            <div className="mb-3">
              <div className="flex items-center gap-2 justify-start sm:justify-end mb-1">
                <div
                  className={`text-sm font-semibold px-3 py-1.5 rounded-lg border ${
                    isExpired
                      ? "bg-red-500/20 text-red-400 border-red-500/30"
                      : timeRemaining.includes("h")
                        ? "bg-green-500/20 text-green-400 border-green-500/30"
                        : "bg-orange-500/20 text-orange-400 border-orange-500/30"
                  } font-inter`}
                >
                  {isExpired ? "Expired" : `${timeRemaining} left`}
                </div>
              </div>
            </div>

            {/* Room Creator */}
            <div className="flex items-center gap-2 justify-start sm:justify-end">
              <div className="text-xs text-[var(--text-muted)] font-inter">
                Created by{" "}
                {room.creator?.wcaId ? (
                  <Link
                    href={`/cuber/${room.creator.wcaId}`}
                    className="font-medium text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
                  >
                    {room.creator?.name || "Unknown"}
                  </Link>
                ) : (
                  <span className="font-medium text-[var(--text-secondary)]">
                    {room.creator?.name || "Unknown"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}