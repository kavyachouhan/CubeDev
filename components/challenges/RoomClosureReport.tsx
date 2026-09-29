"use client";

import { useState } from "react";
import {
  Trophy,
  Calendar,
  Users,
  Clock,
  TrendingUp,
} from "lucide-react";
import { medalRowStyle } from "@/components/ui/medal";
import { RankBadge } from "@/components/ui/RankBadge";
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



  return (
    <div className="space-y-6">
      {/* Report Header */}
      <div className="timer-card">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-(--primary) rounded-full flex items-center justify-center mx-auto">
            <Trophy className="w-8 h-8 text-(--on-primary)" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-(--text-primary) font-statement mb-2">
              Challenge Complete
            </h1>
            <h2 className="text-xl text-(--text-secondary) font-statement mb-4">
              {room.name}
            </h2>
          </div>

          {/* Room Info */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-(--text-secondary)">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>Ended {formatDate(room.expiresAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Statistics Overview */}
      <div className="timer-card">
        <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4">
          Challenge Statistics
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-(--surface-elevated) rounded-(--radius-control)">
            <TrendingUp className="w-6 h-6 text-(--primary) mx-auto mb-2" />
            <div className="text-2xl font-bold text-(--text-primary) font-statement">
              {completedCount}
            </div>
            <div className="text-sm text-(--text-muted) font-inter">
              Completed
            </div>
          </div>
          <div className="text-center p-3 bg-(--surface-elevated) rounded-(--radius-control)">
            <Clock className="w-6 h-6 text-(--primary) mx-auto mb-2" />
            <div className="text-2xl font-bold text-(--text-primary) font-statement">
              {Math.round(completionRate)}%
            </div>
            <div className="text-sm text-(--text-muted) font-inter">
              Completion Rate
            </div>
          </div>
          <div className="text-center p-3 bg-(--surface-elevated) rounded-(--radius-control)">
            <Trophy className="w-6 h-6 text-(--warning) mx-auto mb-2" />
            <div className="text-2xl font-bold text-(--text-primary) font-statement">
              {room.format.toUpperCase()}
            </div>
            <div className="text-sm text-(--text-muted) font-inter">
              Format
            </div>
          </div>
          <div className="text-center p-3 bg-(--surface-elevated) rounded-(--radius-control)">
            <Users className="w-6 h-6 text-(--success) mx-auto mb-2" />
            <div className="text-2xl font-bold text-(--text-primary) font-statement">
              {totalParticipants}
            </div>
            <div className="text-sm text-(--text-muted) font-inter">
              Total Participants
            </div>
          </div>
        </div>
      </div>

      {/* Podium Winners */}
      {podiumWinners.length > 0 && (
        <div className="timer-card">
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-6">
            Podium Winners
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {podiumWinners.map((participant) => (
              <button
                key={participant._id}
                onClick={() => setSelectedParticipant(participant)}
                className="p-6 rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) transition-colors duration-200 cursor-pointer"
                style={medalRowStyle(participant.finalRank)}
              >
                <div className="text-center space-y-3">
                  {/* User Info */}
                  <div className="space-y-1">
                    <div className="relative w-14 h-14 mx-auto">
                      <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-(--primary) text-(--on-primary) font-bold text-lg">
                      {participant.user?.avatar &&
                      !(
                        participant.user?.isDeleted ||
                        participant.wasDeletedWhenJoined
                      ) ? (
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
                          !(
                            participant.user?.isDeleted ||
                            participant.wasDeletedWhenJoined
                          )
                            ? "hidden"
                            : ""
                        }
                        style={{
                          display:
                            participant.user?.avatar &&
                            !(
                              participant.user?.isDeleted ||
                              participant.wasDeletedWhenJoined
                            )
                              ? "none"
                              : "block",
                        }}
                      >
                        {participant.user?.isDeleted ||
                        participant.wasDeletedWhenJoined
                          ? "?"
                          : participant.user?.name?.[0] || "?"}
                      </span>
                      </div>
                      {/* The position rides on the avatar; no separate disc,
                          which read as a second, broken avatar when unranked. */}
                      <RankBadge
                        rank={participant.finalRank}
                        size="md"
                        className="absolute -bottom-1 -right-1 ring-2 ring-(--surface)"
                      />
                    </div>
                    <h4 className="font-semibold text-(--text-primary) font-statement">
                      {participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </h4>
                    {participant.user?.wcaId &&
                      !(
                        participant.user?.isDeleted ||
                        participant.wasDeletedWhenJoined
                      ) && (
                        <p className="text-xs text-(--text-muted) font-mono bg-(--surface-elevated) px-2 py-1 rounded-full inline-block">
                          {participant.user.wcaId}
                        </p>
                      )}
                  </div>

                  {/* Results */}
                  <div className="space-y-2">
                    <div className="font-mono text-xl font-bold text-(--text-primary)">
                      {participant.average
                        ? formatTime(participant.average)
                        : "DNF"}
                    </div>
                    <div className="text-sm text-(--text-muted) font-inter">
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
        <h3 className="text-lg font-semibold text-(--text-primary) font-statement mb-4">
          Complete Results
        </h3>

        {/* Completed Participants */}
        {rankedParticipants.length > 0 && (
          <div className="space-y-3 mb-6">
            <h4 className="text-sm font-medium text-(--text-primary) font-inter border-b border-(--border) pb-2">
              Completed ({rankedParticipants.length})
            </h4>
            <div className="space-y-2">
              {rankedParticipants.map((participant) => (
                <button
                  key={participant._id}
                  onClick={() => setSelectedParticipant(participant)}
                  className="w-full flex items-center gap-3 p-4 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 rounded-(--radius-control) border border-(--border) hover:border-(--primary) transition-all duration-200 cursor-pointer"
                >
                  {/* Rank */}
                  <RankBadge rank={participant.finalRank} size="lg" />

                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-(--primary) text-(--on-primary) font-bold text-sm">
                    {participant.user?.avatar &&
                    !(
                      participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                    ) ? (
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
                        !(
                          participant.user?.isDeleted ||
                          participant.wasDeletedWhenJoined
                        )
                          ? "hidden"
                          : ""
                      }
                      style={{
                        display:
                          participant.user?.avatar &&
                          !(
                            participant.user?.isDeleted ||
                            participant.wasDeletedWhenJoined
                          )
                            ? "none"
                            : "block",
                      }}
                    >
                      {participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-(--text-primary) font-inter">
                      {participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </div>
                    {participant.user?.wcaId &&
                      !(
                        participant.user?.isDeleted ||
                        participant.wasDeletedWhenJoined
                      ) && (
                        <div className="text-xs text-(--text-muted) font-mono">
                          {participant.user.wcaId}
                        </div>
                      )}
                  </div>

                  {/* Results */}
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-(--text-primary)">
                      {participant.average
                        ? formatTime(participant.average)
                        : "DNF"}
                    </div>
                    <div className="text-xs text-(--text-muted) font-inter">
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
            <h4 className="text-sm font-medium text-(--text-secondary) font-inter border-b border-(--border) pb-2">
              Did Not Complete ({incompleteParticipants.length})
            </h4>
            <div className="space-y-2">
              {incompleteParticipants.map((participant) => (
                <button
                  key={participant._id}
                  onClick={() => setSelectedParticipant(participant)}
                  className="w-full flex items-center gap-3 p-4 bg-(--surface-elevated)/60 hover:bg-(--surface-elevated)/80 rounded-(--radius-control) border border-(--border)/50 transition-all duration-200 cursor-pointer"
                >
                  {/* User Avatar */}
                  <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center bg-(--text-muted) text-(--on-primary) font-bold text-sm">
                    {participant.user?.avatar &&
                    !(
                      participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                    ) ? (
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
                        !(
                          participant.user?.isDeleted ||
                          participant.wasDeletedWhenJoined
                        )
                          ? "hidden"
                          : ""
                      }
                      style={{
                        display:
                          participant.user?.avatar &&
                          !(
                            participant.user?.isDeleted ||
                            participant.wasDeletedWhenJoined
                          )
                            ? "none"
                            : "block",
                      }}
                    >
                      {participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex-1 text-left">
                    <div className="font-semibold text-(--text-secondary) font-inter">
                      {participant.user?.isDeleted ||
                      participant.wasDeletedWhenJoined
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </div>
                    {participant.user?.wcaId &&
                      !(
                        participant.user?.isDeleted ||
                        participant.wasDeletedWhenJoined
                      ) && (
                        <div className="text-xs text-(--text-muted) font-mono">
                          {participant.user.wcaId}
                        </div>
                      )}
                  </div>

                  {/* Progress */}
                  <div className="text-right">
                    <div className="text-sm font-medium text-(--text-secondary) font-inter">
                      {participant.solvesCompleted || 0} /{" "}
                      {participant.totalSolves || room.scrambles?.length || 5}
                    </div>
                    <div className="text-xs text-(--text-muted) font-inter">
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