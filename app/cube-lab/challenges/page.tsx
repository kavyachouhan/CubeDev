"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { useUser } from "@/components/UserProvider";
import CreateRoomModal from "@/components/challenges/CreateRoomModal";
import JoinRoomModal from "@/components/challenges/JoinRoomModal";
import PublicRoomsList from "@/components/challenges/PublicRoomsList";
import RecentRoomsModal from "@/components/challenges/RecentRoomsModal";
import {
  Plus,
  Users,
  Trophy,
  Calendar,
  ChevronDown,
  History,
} from "lucide-react";

export default function ChallengesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };
    }
  }, [showDropdown]);

  const { user } = useUser();
  const challengeStats = useQuery(
    api.challengeStats.getUserChallengeStats,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="challenges">
        <div className="container-responsive py-4 md:py-8 space-y-6">
          {/* Main Action Section */}
          <div className="timer-card">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0 mb-6">
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
                Challenge Rooms
              </h1>

              {/* Action Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center justify-center gap-2 px-4 py-2.5 sm:py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary)]/90 transition-colors font-inter font-medium w-full sm:w-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span className="sm:inline">Quick Action</span>
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${showDropdown ? "rotate-180" : ""}`}
                  />
                </button>

                {showDropdown && (
                  <div className="absolute top-full left-0 sm:right-0 sm:left-auto mt-2 w-full sm:w-48 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg shadow-lg py-2 z-10">
                    <button
                      onClick={() => {
                        setShowCreateModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left hover:bg-[var(--border)] transition-colors flex items-center gap-3"
                    >
                      <Plus className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-inter text-[var(--text-primary)]">
                        Create Room
                      </span>
                    </button>
                    <button
                      onClick={() => {
                        setShowJoinModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left hover:bg-[var(--border)] transition-colors flex items-center gap-3"
                    >
                      <Users className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-inter text-[var(--text-primary)]">
                        Join Room
                      </span>
                    </button>
                    <div className="border-t border-[var(--border)] my-2"></div>
                    <button
                      onClick={() => {
                        setShowRecentModal(true);
                        setShowDropdown(false);
                      }}
                      className="w-full px-4 py-3 sm:py-2 text-left hover:bg-[var(--border)] transition-colors flex items-center gap-3"
                    >
                      <History className="w-4 h-4 text-[var(--primary)]" />
                      <span className="font-inter text-[var(--text-primary)]">
                        Recent Rooms
                      </span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Challenge Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="p-4 sm:p-5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)]/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                    <Trophy className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] font-inter">
                      Rooms Won
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-statement">
                      {challengeStats?.roomsWon ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)]/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] font-inter">
                      Participated
                    </p>
                    <p className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                      {challengeStats?.roomsParticipated ?? "-"}
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-4 sm:p-5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-elevated)]/80 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                    <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-muted)] font-inter">
                      Rooms Created
                    </p>
                    <p className="text-xl sm:text-2xl font-bold text-[var(--text-primary)] font-statement">
                      {challengeStats?.roomsCreated ?? "-"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Public Rooms List */}
          <PublicRoomsList />

          {/* Modals */}
          {showCreateModal && (
            <CreateRoomModal onClose={() => setShowCreateModal(false)} />
          )}

          {showJoinModal && (
            <JoinRoomModal onClose={() => setShowJoinModal(false)} />
          )}

          {showRecentModal && (
            <RecentRoomsModal
              isOpen={showRecentModal}
              onClose={() => setShowRecentModal(false)}
            />
          )}
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}