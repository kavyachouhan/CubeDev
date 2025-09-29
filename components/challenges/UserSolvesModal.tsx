"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Trophy,
  Clock,
  ExternalLink,
  Award,
  Target,
  Calendar,
  Timer,
  Activity,
} from "lucide-react";
import Link from "next/link";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

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


// Map of event IDs to display names
const eventNames: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  minx: "Megaminx",
  skewb: "Skewb",
  clock: "Clock",
  sq1: "Square-1",
  "333bld": "3x3 BLD",
  "444bld": "4x4 BLD",
  "555bld": "5x5 BLD",
  "333mbld": "3x3 MBLD",
  "333fm": "3x3 FM",
};

interface UserSolvesModalProps {
  participant: {
    _id: string;
    userId: string;
    roomId: string;
    user?: {
      name?: string;
      wcaId?: string;
      avatar?: string;
      isDeleted?: boolean;
    };
    finalRank?: number;
    isCompleted: boolean;
    average?: number;
    bestSingle?: number;
    solvesCompleted: number;
    totalSolves: number;
  };
  roomDetails: {
    event: string;
    roomId: string;
    name: string;
    format: "ao5" | "ao12";
  };
  onClose: () => void;
}

export default function UserSolvesModal({
  participant,
  roomDetails,
  onClose,
}: UserSolvesModalProps) {
  const [selectedSolve, setSelectedSolve] = useState<any | null>(null);
  const [mounted, setMounted] = useState(false);

  // Fetch user's solves for this room
  const userSolves = useQuery(api.challengeRooms.getUserParticipation, {
    userId: participant.userId as any,
    roomId: roomDetails.roomId,
  });

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  // Get solves data
  const individualSolves = userSolves?.solves || [];

  const getRankDisplay = (rank: number) => {
    if (rank === 1)
      return { text: "1st", color: "text-yellow-500", icon: Trophy };
    if (rank === 2) return { text: "2nd", color: "text-gray-400", icon: Award };
    if (rank === 3)
      return { text: "3rd", color: "text-orange-500", icon: Award };
    return {
      text: `${rank}th`,
      color: "text-[var(--text-secondary)]",
      icon: Award,
    };
  };

  const rankDisplay = getRankDisplay(participant.finalRank || 0);

  // Get room event from roomDetails
  const roomEvent = roomDetails.event;
  const eventName = eventNames[roomEvent] || "3x3";

  // Calculate statistics from solves
  const validSolves = individualSolves.filter(
    (solve) => solve.penalty !== "DNF"
  );
  const avgTime =
    validSolves.length > 0
      ? validSolves.reduce((sum, solve) => sum + solve.finalTime, 0) /
        validSolves.length
      : 0;

  const modalContent = (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      {/* Modal Background */}
      <div
        className="bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--border)]">
          <div className="flex items-center gap-4">
            <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
              Performance Details
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)]">
          {/* User Profile Section */}
          <div className="p-6 border-b border-[var(--border)]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-6">
              {/* User Info */}
              <div className="flex items-center gap-4 flex-1">
                <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center bg-[var(--primary)] text-white font-bold text-lg">
                  {participant.user?.avatar && !participant.user?.isDeleted ? (
                    <img
                      src={participant.user.avatar}
                      alt={participant.user.name || "User"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span>
                      {participant.user?.isDeleted
                        ? "?"
                        : participant.user?.name?.[0] || "?"}
                    </span>
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
                      {participant.user?.isDeleted
                        ? "Deleted User"
                        : participant.user?.name || "Anonymous"}
                    </h3>
                    {participant.user?.wcaId &&
                      !participant.user?.isDeleted && (
                        <Link
                          href={`/cuber/${participant.user.wcaId}`}
                          className="inline-flex items-center gap-1 text-sm text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors"
                          title="View cuber's profile"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {participant.user?.wcaId && (
                      <span className="px-2 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full font-mono text-xs text-[var(--text-secondary)]">
                        {participant.user.wcaId}
                      </span>
                    )}
                    {participant.finalRank && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-full">
                        <rankDisplay.icon
                          className={`w-3 h-3 ${rankDisplay.color}`}
                        />
                        <span
                          className={`text-xs font-semibold ${rankDisplay.color}`}
                        >
                          {rankDisplay.text}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistics Cards */}
          {participant.isCompleted && (
            <div className="p-6 border-b border-[var(--border)]">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-[var(--primary)]" />
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                      Final Average
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold text-[var(--text-primary)]">
                    {participant.average && participant.average !== Infinity
                      ? formatTime(participant.average)
                      : "DNF"}
                  </div>
                </div>

                <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                      Best Single
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold text-green-500">
                    {participant.bestSingle &&
                    participant.bestSingle !== Infinity
                      ? formatTime(participant.bestSingle)
                      : "--"}
                  </div>
                </div>

                <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Timer className="w-4 h-4 text-blue-500" />
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                      Completed
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold text-blue-500">
                    {participant.solvesCompleted} / {participant.totalSolves}
                  </div>
                </div>

                <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-purple-500" />
                    <span className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter">
                      Session Avg
                    </span>
                  </div>
                  <div className="text-xl font-mono font-bold text-purple-500">
                    {avgTime > 0 ? formatTime(avgTime) : "--"}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Individual Solves */}
          <div className="p-6">
            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg">
              <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                <h4 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
                  Individual Solves
                </h4>
                <div className="text-sm text-[var(--text-muted)] font-inter">
                  {individualSolves.length} of {participant.totalSolves} solves
                </div>
              </div>

              <div className="p-4">
                {individualSolves.length > 0 ? (
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {individualSolves.map((solve) => (
                      <div
                        key={solve._id}
                        className="bg-[var(--surface-elevated)] rounded border border-[var(--border)] p-3 hover:bg-[var(--surface-elevated)]/80 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          {/* Solve number and time */}
                          <div
                            className="flex items-center gap-3 cursor-pointer flex-1"
                            onClick={() =>
                              setSelectedSolve(
                                selectedSolve?._id === solve._id ? null : solve
                              )
                            }
                          >
                            <span className="text-sm text-[var(--text-muted)] font-inter">
                              #{solve.solveNumber}
                            </span>
                            <span
                              className={`font-mono text-lg font-semibold ${
                                solve.penalty === "+2"
                                  ? "text-yellow-400"
                                  : solve.penalty === "DNF"
                                    ? "text-red-400"
                                    : "text-[var(--text-primary)]"
                              }`}
                            >
                              {formatTime(solve.finalTime)}
                              {solve.penalty === "+2" && "+"}
                            </span>
                            <span className="text-xs text-[var(--text-muted)] font-inter">
                              {new Date(solve.solveDate).toLocaleTimeString()}
                            </span>
                          </div>

                          {/* Penalty indicators */}
                          <div className="flex items-center gap-1 ml-2">
                            {solve.penalty === "+2" && (
                              <span className="px-2 py-1 text-xs rounded font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                                +2
                              </span>
                            )}
                            {solve.penalty === "DNF" && (
                              <span className="px-2 py-1 text-xs rounded font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                                DNF
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Expanded Details */}
                        {selectedSolve?._id === solve._id && (
                          <div className="mt-3 pt-3 border-t border-[var(--border)]">
                            <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                              <h5 className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-3">
                                Time Breakdown
                              </h5>
                              <div className="space-y-2 text-sm font-mono">
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-secondary)]">
                                    Raw Time:
                                  </span>
                                  <span className="text-[var(--text-primary)]">
                                    {formatTime(solve.time)}
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-[var(--text-secondary)]">
                                    Penalty:
                                  </span>
                                  <span
                                    className={
                                      solve.penalty === "+2"
                                        ? "text-yellow-400"
                                        : solve.penalty === "DNF"
                                          ? "text-red-400"
                                          : "text-[var(--text-primary)]"
                                    }
                                  >
                                    {solve.penalty === "none"
                                      ? "None"
                                      : solve.penalty}
                                  </span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-[var(--border)]">
                                  <span className="text-[var(--text-secondary)] font-semibold">
                                    Final Time:
                                  </span>
                                  <span className="text-[var(--text-primary)] font-semibold">
                                    {formatTime(solve.finalTime)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Comment */}
                            {solve.comment && (
                              <div className="mt-3 bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                                <h5 className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
                                  Comment
                                </h5>
                                <p className="text-sm text-[var(--text-secondary)]">
                                  {solve.comment}
                                </p>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-[var(--text-muted)]">
                    <Clock className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)] opacity-50" />
                    <p className="text-lg font-medium mb-2">
                      No solves recorded yet
                    </p>
                    <p className="text-sm">
                      This participant hasn't submitted any solves for this
                      challenge.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Render modal in portal
  return createPortal(modalContent, document.body);
}