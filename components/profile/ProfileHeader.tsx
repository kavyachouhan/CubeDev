"use client";

import Image from "next/image";
import Link from "next/link";
import { ExternalLink, User, Flag, Calendar, Clock } from "lucide-react";

interface ProfileHeaderProps {
  person?: {
    name: string;
    wcaId: string;
    avatar?: {
      url: string;
    };
    country: {
      name: string;
      iso2: string;
    };
  };
  wcaId: string;
  cubeDevUser?: {
    createdAt: string;
    lastActive?: number;
  };
}

export default function ProfileHeader({
  person,
  wcaId,
  cubeDevUser,
}: ProfileHeaderProps) {
  const formatDate = (timestamp: number | string): string => {
    const date =
      typeof timestamp === "string" ? new Date(timestamp) : new Date(timestamp);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getLastActiveText = (lastActive?: number): string => {
    if (!lastActive) return "Never";

    const now = Date.now();
    const diffMs = now - lastActive;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return "Today";
    } else if (diffDays === 1) {
      return "Yesterday";
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else if (diffDays < 30) {
      const weeks = Math.floor(diffDays / 7);
      return `${weeks} week${weeks > 1 ? "s" : ""} ago`;
    } else {
      const months = Math.floor(diffDays / 30);
      return `${months} month${months > 1 ? "s" : ""} ago`;
    }
  };

  return (
    <div className="timer-card mb-8">
      <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
        {/* Avatar */}
        <div className="flex-shrink-0">
          <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl overflow-hidden bg-gradient-to-br from-[var(--primary)] to-[var(--primary)]/70 flex items-center justify-center">
            {person?.avatar?.url ? (
              <Image
                src={person.avatar.url}
                alt={`${person.name}'s avatar`}
                width={128}
                height={128}
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="w-12 h-12 md:w-16 md:h-16 text-white" />
            )}
          </div>
        </div>

        {/* Profile Info */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-[var(--text-primary)] font-statement mb-2">
                {person?.name || "Unknown Cuber"}
              </h1>

              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <Flag className="w-4 h-4" />
                  <span className="font-inter">
                    {person?.country?.name || "Unknown"}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-[var(--text-secondary)]">
                  <span className="font-mono text-[var(--primary)] bg-[var(--primary)]/10 px-2 py-1 rounded border border-[var(--primary)]/20">
                    {wcaId}
                  </span>
                </div>
              </div>

              {/* Member Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <span className="text-[var(--text-muted)] font-inter">
                      Member since:{" "}
                    </span>
                    <span className="text-[var(--text-primary)] font-inter font-medium">
                      {cubeDevUser
                        ? formatDate(cubeDevUser.createdAt)
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  <div>
                    <span className="text-[var(--text-muted)] font-inter">
                      Last active:{" "}
                    </span>
                    <span className="text-[var(--text-primary)] font-inter font-medium">
                      {cubeDevUser
                        ? getLastActiveText(cubeDevUser.lastActive)
                        : "Unknown"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* WCA Link */}
            <div className="flex flex-col gap-3">
              <Link
                href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 hover:bg-[var(--primary)]/20 text-[var(--primary)] border border-[var(--primary)]/30 rounded-lg transition-all duration-200 font-inter text-sm whitespace-nowrap"
              >
                View WCA Profile <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}