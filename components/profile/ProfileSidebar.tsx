"use client";

import { useState } from "react";
import {
  MapPin,
  Calendar,
  ExternalLink,
  Clock,
  User,
} from "lucide-react";
import Image from "next/image";
import ProfileShareMenu from "./ProfileShareMenu";
import { canOpenWcaProfile } from "@/lib/identifier-utils";
import { formatMonthYear } from "@/lib/date-utils";

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

export default function ProfileSidebar({
  person,
  wcaId,
  cubeDevUser,
  personalRecords,
}: ProfileSidebarProps) {
  const joinDate = cubeDevUser
    ? formatMonthYear(cubeDevUser.createdAt ?? cubeDevUser._creationTime)
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
          : Infinity,
      );

      const bestRank = Math.min(
        best.world_ranking > 0 ? best.world_ranking : Infinity,
        best.average_world_ranking && best.average_world_ranking > 0
          ? best.average_world_ranking
          : Infinity,
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
        : Infinity,
    );

    return isFinite(bestRank)
      ? { ...bestRanked, world_ranking: bestRank }
      : null;
  };

  const bestEvent = getBestEvent();
  const totalEvents = personalRecords?.length || 0;
  const [imageError, setImageError] = useState(false);

  return (
    <div className="space-y-6">
      {/* Profile Card */}
      <div className="timer-card text-center">
        {/* Avatar */}
        <div className="mb-6">
          <div className="relative mx-auto w-32 h-32 rounded-full overflow-hidden bg-(--surface-elevated) border-4 border-(--border)">
            {person.avatar?.url && !imageError ? (
              <Image
                src={person.avatar.url}
                alt={person.name}
                fill
                className="object-cover"
                sizes="128px"
                priority
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                {imageError ? (
                  <User className="w-12 h-12 text-(--text-muted)" />
                ) : (
                  <span className="text-4xl font-bold text-(--text-muted)">
                    {person.name.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Name and WCA ID */}
        <div className="mb-4">
          <h1 className="text-2xl font-bold text-(--text-primary) font-statement mb-1">
            {person.name}
          </h1>
          <p className="text-(--text-secondary) font-inter text-md">{wcaId}</p>
        </div>

        {/* Country */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <MapPin className="w-4 h-4 text-(--text-muted)" />
          <span className="text-(--text-secondary) font-inter">
            {person.country.name}
          </span>
        </div>

        {/* CubeDev Membership Info */}
        {cubeDevUser && (
          <div className="space-y-1.5 px-3 py-2.5 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border) mb-6">
            {joinDate && (
              <div className="flex items-center justify-center gap-2 text-xs text-(--text-muted)">
                <Calendar className="w-3 h-3" />
                <span>Joined {joinDate}</span>
              </div>
            )}
            {lastActive && (
              <div className="flex items-center justify-center gap-2 text-xs text-(--text-muted)">
                <Clock className="w-3 h-3" />
                <span>Last active {lastActive}</span>
              </div>
            )}
          </div>
        )}

        {/* View WCA Profile Link */}
        <div className="mt-6 flex flex-col gap-3 items-center">
          {canOpenWcaProfile(wcaId) && (
            <a
              href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-(--on-primary) rounded-(--radius-control) hover:bg-(--primary)/90 transition-colors font-inter font-medium text-sm"
            >
              <ExternalLink className="w-4 h-4" />
              View WCA Profile
            </a>
          )}
          <ProfileShareMenu person={person} wcaId={wcaId} />
        </div>
      </div>

    </div>
  );
}
