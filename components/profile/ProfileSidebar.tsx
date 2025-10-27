"use client";

import { MapPin, Calendar, ExternalLink, Trophy, Clock } from "lucide-react";
import Image from "next/image";

interface WCAPersonalRecord {
  event_id: string;
  best: number;
  world_ranking: number;
  continental_ranking: number;
  national_ranking: number;
  // Add average data
  average?: number;
  average_world_ranking?: number;
  average_continental_ranking?: number;
  average_national_ranking?: number;
}

interface ProfileSidebarProps {
  person: {
    name: string;
    wcaId: string;
    avatar?: {
      url: string;
    };
    country: {
      name: string;
      iso2: string;
    };
    gender: string;
    class: string;
    delegate_status?: string;
    teams?: string[];
  };
  wcaId: string;
  cubeDevUser: any;
  personalRecords: WCAPersonalRecord[] | null;
}

function formatTime(centiseconds: number): string {
  if (!centiseconds || centiseconds <= 0) return "--";

  const totalMs = centiseconds * 10;
  const minutes = Math.floor(totalMs / 60000);
  const seconds = Math.floor((totalMs % 60000) / 1000);
  const milliseconds = totalMs % 1000;

  if (minutes > 0) {
    return `${minutes}:${seconds.toString().padStart(2, "0")}.${milliseconds.toString().padStart(3, "0")}`;
  } else {
    return `${seconds}.${milliseconds.toString().padStart(3, "0")}`;
  }
}

const EVENT_NAMES = {
  "333": "3×3 Cube",
  "222": "2×2 Cube",
  "444": "4×4 Cube",
  "555": "5×5 Cube",
  "666": "6×6 Cube",
  "777": "7×7 Cube",
  "333bf": "3×3 BLD",
  "333fm": "3×3 FM",
  "333oh": "3×3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4×4 BLD",
  "555bf": "5×5 BLD",
  "333mbf": "3×3 MBLD",
};

export default function ProfileSidebar({
  person,
  wcaId,
  cubeDevUser,
  personalRecords,
}: ProfileSidebarProps) {
  const joinDate = cubeDevUser
    ? new Date(cubeDevUser._creationTime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
      })
    : null;

  const lastActive = cubeDevUser?.lastLoginAt
    ? new Date(cubeDevUser.lastLoginAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  const getBestEvent = () => {
    if (!personalRecords || personalRecords.length === 0) return null;

    // Find event with best world ranking (considering both single and average)
    const bestRanked = personalRecords.reduce((best, current) => {
      const currentBestRank = Math.min(
        current.world_ranking > 0 ? current.world_ranking : Infinity,
        current.average_world_ranking && current.average_world_ranking > 0
          ? current.average_world_ranking
          : Infinity
      );

      const bestRank = Math.min(
        best.world_ranking > 0 ? best.world_ranking : Infinity,
        best.average_world_ranking && best.average_world_ranking > 0
          ? best.average_world_ranking
          : Infinity
      );

      if (currentBestRank < bestRank) {
        return current;
      }
      return best;
    });

    const bestRank = Math.min(
      bestRanked.world_ranking > 0 ? bestRanked.world_ranking : Infinity,
      bestRanked.average_world_ranking && bestRanked.average_world_ranking > 0
        ? bestRanked.average_world_ranking
        : Infinity
    );

    return isFinite(bestRank)
      ? { ...bestRanked, world_ranking: bestRank }
      : null;
  };

  const bestEvent = getBestEvent();
  const totalEvents = personalRecords?.length || 0;

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="timer-card text-center">
        {/* Avatar */}
        <div className="mb-6">
          <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden bg-[var(--surface-elevated)] border-4 border-[var(--border)]">
            {person.avatar?.url ? (
              <Image
                src={person.avatar.url}
                alt={person.name}
                fill
                className="object-cover"
                sizes="128px"
                priority
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-[var(--text-muted)]">
                {person.name.charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </div>

        {/* Name and WCA ID */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-1">
            {person.name}
          </h1>
          <p className="text-[var(--text-secondary)] font-inter text-lg">
            {wcaId}
          </p>
        </div>

        {/* Country */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="w-4 h-4 text-[var(--text-muted)]" />
          <span className="text-[var(--text-secondary)] font-inter">
            {person.country.name}
          </span>
        </div>

        {/* CubeDev Membership Info */}
        {cubeDevUser && (
          <div className="space-y-2 p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] mb-6">
            {joinDate && (
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <Calendar className="w-3 h-3" />
                <span>Joined {joinDate}</span>
              </div>
            )}
            {lastActive && (
              <div className="flex items-center justify-center gap-2 text-xs text-[var(--text-muted)]">
                <Clock className="w-3 h-3" />
                <span>Last active {lastActive}</span>
              </div>
            )}
          </div>
        )}

        {/* View WCA Profile Link */}
        <div className="mt-6">
          <a
            href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors font-inter font-medium text-sm"
          >
            <ExternalLink className="w-4 h-4" />
            View WCA Profile
          </a>
        </div>
      </div>

      {/* Best Events Card */}
      {personalRecords && personalRecords.length > 0 && (
        <div className="timer-card">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--primary)]" />
            Top Events
          </h3>
          <div className="space-y-3">
            {personalRecords
              .filter(
                (record) =>
                  record.world_ranking > 0 ||
                  (record.average_world_ranking &&
                    record.average_world_ranking > 0)
              )
              .sort((a, b) => {
                const aRank = Math.min(
                  a.world_ranking || Infinity,
                  a.average_world_ranking || Infinity
                );
                const bRank = Math.min(
                  b.world_ranking || Infinity,
                  b.average_world_ranking || Infinity
                );
                return aRank - bRank;
              })
              .slice(0, 5)
              .map((record) => {
                const bestRank = Math.min(
                  record.world_ranking > 0 ? record.world_ranking : Infinity,
                  record.average_world_ranking &&
                    record.average_world_ranking > 0
                    ? record.average_world_ranking
                    : Infinity
                );
                const bestTime =
                  record.world_ranking > 0 &&
                  record.world_ranking <=
                    (record.average_world_ranking || Infinity)
                    ? record.best
                    : record.average;

                return (
                  <div
                    key={record.event_id}
                    className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                        {EVENT_NAMES[
                          record.event_id as keyof typeof EVENT_NAMES
                        ] || record.event_id}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {formatTime(bestTime || 0)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-[var(--primary)]">
                        #{bestRank}
                      </div>
                      <div className="text-xs text-[var(--text-muted)]">WR</div>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}