"use client";

import { useState } from "react";
import {
  Trophy,
  Calendar,
  Users,
  Crown,
  Medal,
  Award,
  Clock,
  TrendingUp,
} from "lucide-react";
import UserSolvesModal from "./UserSolvesModal";

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

function formatDate(timestamp: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(timestamp));
}

interface RoomClosureReportProps {
  room: any;
  participants: any[];
  event: any;
}

export default function RoomClosureReport({
  room,
  participants,
  event,
}: RoomClosureReportProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  // Sort participants by final rank
  const rankedParticipants = participants
    .filter((p) => p.isCompleted)
    .sort((a, b) => (a.finalRank || Infinity) - (b.finalRank || Infinity));

  const incompleteParticipants = participants.filter((p) => !p.isCompleted);

  // Get podium winners (top 3)
  const podiumWinners = rankedParticipants.slice(0, 3);
  const otherParticipants = rankedParticipants.slice(3);

  // Calculate statistics
  const totalParticipants = participants.length;
  const completedCount = rankedParticipants.length;
  const completionRate =
    totalParticipants > 0 ? (completedCount / totalParticipants) * 100 : 0;

  const getRankColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-500";
      case 2:
        return "bg-gray-400";
      case 3:
        return "bg-orange-500";
      default:
        return "bg-slate-400";
    }
  };

  const getRankBorderColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "border-yellow-200";
      case 2:
        return "border-gray-200";
      case 3:
        return "border-orange-200";
      default:
        return "border-[var(--border)]";
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-yellow-50 dark:bg-yellow-900/10";
      case 2:
        return "bg-gray-50 dark:bg-gray-900/10";
      case 3:
        return "bg-orange-50 dark:bg-orange-900/10";
      default:
        return "bg-[var(--surface-elevated)]";
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-5 h-5" />;
      case 2:
        return <Medal className="w-5 h-5" />;
      case 3:
        return <Award className="w-5 h-5" />;
      default:
        return <Trophy className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="timer-card">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-[var(--primary)] rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] font-statement mb-2">
              Challenge Complete
            </h1>
            <h2 className="text-xl text-[var(--text-secondary)] font-statement mb-4">
              {room.name}
            </h2>
          </div>

          {/* Room Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-[var(--text-secondary)]">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Ended {formatDate(room.expiresAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="timer-card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4">
          Challenge Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <TrendingUp className="w-6 h-6 text-[var(--primary)] mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              {completedCount}
            </div>
            <div className="text-sm text-[var(--text-muted)] font-inter">
              Completed
            </div>
          </div>
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              {Math.round(completionRate)}%
            </div>
            <div className="text-sm text-[var(--text-muted)] font-inter">
              Completion Rate
            </div>
          </div>
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <Trophy className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              {room.format.toUpperCase()}
            </div>
            <div className="text-sm text-[var(--text-muted)] font-inter">
              Format
            </div>
          </div>
          <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg">
            <Users className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              {totalParticipants}
            </div>
            <div className="text-sm text-[var(--text-muted)] font-inter">
              Total Participants
            </div>
          </div>
        </div>
      </div>

      {/* Podium Winners */}
      {podiumWinners.length > 0 && (
        <div className="timer-card">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-6">
            Podium Winners
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {podiumWinners.map((participant) => (
              <button
                key={participant._id}
                onClick={() => setSelectedParticipant(participant)}
                className={`p-6 rounded-xl border transition-all duration-200 hover:scale-105 cursor-pointer ${getRankBgColor(
                  participant.finalRank
                )} ${getRankBorderColor(participant.finalRank)}`}
              >
                <div className="text-center space-y-3">
                  {/* Rank Badge */}
                  <div
                    className={`w-12 h-12 mx-auto rounded-full flex items-center justify-center text-white ${getRankColor(
                      participant.finalRank
                    )}`}
                  >
                    {getRankIcon(participant.finalRank)}
                  </div>

                  {/* User Info */}
                  <div className="space-y-1">
                    <div className="w-12 h-12 rounded-full overflow-hidden flex items-center justify-center bg-[var(--primary)] text-white font-bold text-lg mx-auto">
                      {participant.user?.avatar &&
                      !participant.user?.isDeleted ? (
                        <img
                          src={participant.user.avatar}
                          alt={participant.user.name || "User"}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.style.display = "none";
                            if (target.nextElementSibling) {
                              (
                                target.nextElementSibling as HTMLElement
                              ).style.display = "block";
                            }
                          }}
                        />
                      ) : null}
                      <span
                        className={
                          participant.user?.avatar &&
                          !participant.user?.isDeleted
                            ? "hidden"
                            : ""
                        }
                        style={{
                          display:
                            participant.user?.avatar &&
                            !participant.user?.isDeleted
                              ? "none"
                              : "block",
                        }}
                      >
                        {participant.user?.isDeleted
                          ? "?"
                          : participant.user?.name?.[0] || "?"}
                      </span>
                    </div>
                    <h4 className="font-semibold text-[var(--text-primary)] font-statement">
                      {participant.user?.isDeleted
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </h4>
                    {participant.user?.wcaId &&
                      !participant.user?.isDeleted && (
                        <p className="text-xs text-[var(--text-muted)] font-mono bg-[var(--surface-elevated)] px-2 py-1 rounded-full inline-block">
                          {participant.user.wcaId}
                        </p>
                      )}
                  </div>

                  {/* Results */}
                  <div className="space-y-2">
                    <div className="font-mono text-xl font-bold text-[var(--text-primary)]">
                      {participant.average
                        ? formatTime(participant.average)
                        : "DNF"}
                    </div>
                    <div className="text-sm text-[var(--text-muted)] font-inter">
                      Best:{" "}
                      <span className="font-mono">
                        {participant.bestSingle
                          ? formatTime(participant.bestSingle)
                          : "DNF"}
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Full Leaderboard */}
      <div className="timer-card">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4">
          Complete Results
        </h3>

        {/* Completed Participants */}
        {rankedParticipants.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-[var(--text-primary)] font-inter border-b border-[var(--border)] pb-2">
              Completed ({rankedParticipants.length})
            </h4>
            <div className="space-y-2">
              {rankedParticipants.map((participant) => (
                <button
                  key={participant._id}
                  onClick={() => setSelectedParticipant(participant)}
                  className="w-full flex items-center gap-3 p-4 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] hover:border-[var(--primary)] transition-all duration-200 cursor-pointer"
                >
                  {/* Rank */}
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold text-white ${getRankColor(
                      participant.finalRank
                    )}`}
                  >
                    {participant.finalRank}
                  </div>

                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-[var(--primary)] text-white font-bold text-sm">
                    {participant.user?.avatar &&
                    !participant.user?.isDeleted ? (
                      <img
                        src={participant.user.avatar}
                        alt={participant.user.name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextElementSibling) {
                            (
                              target.nextElementSibling as HTMLElement
                            ).style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <span
                      className={
                        participant.user?.avatar && !participant.user?.isDeleted
                          ? "hidden"
                          : ""
                      }
                      style={{
                        display:
                          participant.user?.avatar &&
                          !participant.user?.isDeleted
                            ? "none"
                            : "block",
                      }}
                    >
                      {participant.user?.isDeleted
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--text-primary)] font-inter">
                      {participant.user?.isDeleted
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </div>
                    {participant.user?.wcaId &&
                      !participant.user?.isDeleted && (
                        <div className="text-xs text-[var(--text-muted)] font-mono">
                          {participant.user.wcaId}
                        </div>
                      )}
                  </div>

                  {/* Results */}
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-[var(--text-primary)]">
                      {participant.average
                        ? formatTime(participant.average)
                        : "DNF"}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-inter">
                      Best:{" "}
                      <span className="font-mono">
                        {participant.bestSingle
                          ? formatTime(participant.bestSingle)
                          : "DNF"}
                      </span>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Incomplete Participants */}
        {incompleteParticipants.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-[var(--text-secondary)] font-inter border-b border-[var(--border)] pb-2">
              Did Not Complete ({incompleteParticipants.length})
            </h4>
            <div className="space-y-2">
              {incompleteParticipants.map((participant) => (
                <button
                  key={participant._id}
                  onClick={() => setSelectedParticipant(participant)}
                  className="w-full flex items-center gap-3 p-4 bg-[var(--surface-elevated)]/60 hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)]/50 transition-all duration-200 cursor-pointer"
                >
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-gray-400 text-white font-bold text-sm">
                    {participant.user?.avatar &&
                    !participant.user?.isDeleted ? (
                      <img
                        src={participant.user.avatar}
                        alt={participant.user.name || "User"}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.style.display = "none";
                          if (target.nextElementSibling) {
                            (
                              target.nextElementSibling as HTMLElement
                            ).style.display = "block";
                          }
                        }}
                      />
                    ) : null}
                    <span
                      className={
                        participant.user?.avatar && !participant.user?.isDeleted
                          ? "hidden"
                          : ""
                      }
                      style={{
                        display:
                          participant.user?.avatar &&
                          !participant.user?.isDeleted
                            ? "none"
                            : "block",
                      }}
                    >
                      {participant.user?.isDeleted
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  </div>

                  {/* Status */}
                  <div className="w-8 h-8 rounded-lg bg-gray-400 flex items-center justify-center">
                    <Users className="w-4 h-4 text-white" />
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-[var(--text-secondary)] font-inter">
                      {participant.user?.isDeleted
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </div>
                    {participant.user?.wcaId &&
                      !participant.user?.isDeleted && (
                        <div className="text-xs text-[var(--text-muted)] font-mono">
                          {participant.user.wcaId}
                        </div>
                      )}
                  </div>

                  {/* Progress */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-[var(--text-secondary)] font-inter">
                      {participant.solvesCompleted || 0} /{" "}
                      {participant.totalSolves || room.scrambles?.length || 5}
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-inter">
                      Incomplete
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* User Solves Modal */}
      {selectedParticipant && (
        <UserSolvesModal
          participant={selectedParticipant}
          roomDetails={{
            roomId: room.roomId,
            event: room.event,
            name: room.name,
            format: room.format,
          }}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  );
}