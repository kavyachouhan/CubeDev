"use client";

import { useState } from "react";
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

interface RoomLeaderboardProps {
  participants: any[];
  room: {
    roomId: string;
    event: string;
    name: string;
    format: "ao5" | "ao12";
    status?: string;
    expiresAt?: number;
  };
}

export default function RoomLeaderboard({
  participants,
  room,
}: RoomLeaderboardProps) {
  const [selectedParticipant, setSelectedParticipant] = useState<any>(null);

  const completedParticipants = participants
    .filter((p: any) => p.isCompleted)
    .sort((a: any, b: any) => {
      if (a.finalRank && b.finalRank) {
        return a.finalRank - b.finalRank;
      }
      if (a.finalRank && !b.finalRank) return -1;
      if (!a.finalRank && b.finalRank) return 1;
      return 0;
    });

  const inProgressParticipants = participants.filter(
    (p: any) => !p.isCompleted
  );

  return (
    <div className="timer-card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6">
        <div className="flex items-center gap-3">
          <h3 className="text-xl font-bold text-[var(--text-primary)] font-statement">
            Leaderboard
          </h3>
        </div>
        <div className="flex items-center gap-2 text-sm text-[var(--text-muted)] font-inter bg-[var(--surface-elevated)] px-3 py-1.5 rounded-full">
          {participants.length} participant
          {participants.length !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="space-y-4">
        {/* Completed participants */}
        {completedParticipants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-green-500 rounded-full"></div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] font-inter">
                Completed ({completedParticipants.length})
              </h4>
            </div>
            <div className="space-y-2">
              {completedParticipants.map((participant: any, index: number) => (
                <button
                  key={participant._id}
                  onClick={() => setSelectedParticipant(participant)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer ${
                    participant.finalRank === 1
                      ? "bg-yellow-50 border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-700/50"
                      : participant.finalRank === 2
                        ? "bg-gray-50 border-gray-200 dark:bg-gray-900/20 dark:border-gray-700/50"
                        : participant.finalRank === 3
                          ? "bg-orange-50 border-orange-200 dark:bg-orange-900/20 dark:border-orange-700/50"
                          : "bg-[var(--surface-elevated)] border-[var(--border)]"
                  }`}
                >
                  {/* Rank Badge */}
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shadow-lg ${
                      participant.finalRank === 1
                        ? "bg-yellow-500"
                        : participant.finalRank === 2
                          ? "bg-gray-500"
                          : participant.finalRank === 3
                            ? "bg-orange-500"
                            : "bg-slate-500"
                    }`}
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
                          target.nextElementSibling!.textContent =
                            participant.user?.name?.[0] || "?";
                        }}
                      />
                    ) : null}
                    <span
                      className={
                        participant.user?.avatar && !participant.user?.isDeleted
                          ? "hidden"
                          : ""
                      }
                    >
                      {participant.user?.isDeleted
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-[var(--text-primary)] font-inter text-base">
                      {participant.user?.isDeleted
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </div>
                    {participant.user?.wcaId &&
                      !participant.user?.isDeleted && (
                        <div className="text-xs text-[var(--text-muted)] font-inter bg-[var(--surface-elevated)]/50 px-2 py-0.5 rounded-full inline-block mt-1">
                          {participant.user.wcaId}
                        </div>
                      )}
                  </div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-[var(--text-primary)] mb-1">
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

        {/* In Progress Participants */}
        {inProgressParticipants.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
              <h4 className="text-sm font-semibold text-[var(--text-primary)] font-inter">
                In Progress ({inProgressParticipants.length})
              </h4>
            </div>
            <div className="space-y-2">
              {inProgressParticipants.map((participant: any) => (
                <button
                  key={participant._id}
                  onClick={() => setSelectedParticipant(participant)}
                  className="w-full flex items-center gap-3 p-4 rounded-xl border transition-all duration-200 cursor-pointer bg-[var(--surface-elevated)] border-[var(--border)]/50 hover:border-blue-500/30"
                >
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
                          target.nextElementSibling!.textContent =
                            participant.user?.name?.[0] || "?";
                        }}
                      />
                    ) : null}
                    <span
                      className={
                        participant.user?.avatar && !participant.user?.isDeleted
                          ? "hidden"
                          : ""
                      }
                    >
                      {participant.user?.isDeleted
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="font-semibold text-[var(--text-primary)] font-inter text-base">
                      {participant.user?.isDeleted
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </div>
                    {participant.user?.wcaId &&
                      !participant.user?.isDeleted && (
                        <div className="text-xs text-[var(--text-muted)] font-inter bg-[var(--surface-elevated)]/50 px-2 py-0.5 rounded-full inline-block mt-1">
                          {participant.user.wcaId}
                        </div>
                      )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm font-medium font-inter px-3 py-1 rounded-full text-[var(--text-primary)] bg-blue-500/10">
                      {participant.solvesCompleted} / {participant.totalSolves}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {participants.length === 0 && (
          <div className="text-center py-12">
            <h4 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-2">
              No participants yet
            </h4>
            <p className="text-[var(--text-secondary)] font-inter">
              Share the room code to invite others!
            </p>
          </div>
        )}
      </div>

      {/* User Solves Modal */}
      {selectedParticipant && (
        <UserSolvesModal
          participant={selectedParticipant}
          roomDetails={room}
          onClose={() => setSelectedParticipant(null)}
        />
      )}
    </div>
  );
}