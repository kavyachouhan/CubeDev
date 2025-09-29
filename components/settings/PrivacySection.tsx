"use client";

import { useState, useEffect } from "react";
import { UserPen, Trophy, Check } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function PrivacySection() {
  const { user } = useUser();
  const [hideProfile, setHideProfile] = useState(false);
  const [hideChallengeStats, setHideChallengeStats] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Get current privacy settings
  const currentUser = useQuery(
    api.users.getUserById,
    user?.convexId ? { id: user.convexId as any } : "skip"
  );

  // Update mutation
  const updatePrivacy = useMutation(api.users.updatePrivacySettings);

  // Sync local state with fetched user settings
  useEffect(() => {
    if (currentUser) {
      setHideProfile(currentUser.hideProfile || false);
      setHideChallengeStats(currentUser.hideChallengeStats || false);
    }
  }, [currentUser]);

  const handleSaveSettings = async () => {
    if (!user?.convexId) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      await updatePrivacy({
        userId: user.convexId as any,
        hideProfile,
        hideChallengeStats,
      });

      setSaveMessage("Privacy settings updated successfully!");
      setTimeout(() => setSaveMessage(""), 3000);
    } catch (error) {
      setSaveMessage("Failed to update privacy settings.");
      setTimeout(() => setSaveMessage(""), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const hasChanges =
    currentUser &&
    (hideProfile !== (currentUser.hideProfile || false) ||
      hideChallengeStats !== (currentUser.hideChallengeStats || false));

  if (!user) return null;

  return (
    <div className="timer-card">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Privacy Settings
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Control your CubeDev profile visibility and data sharing options
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile Visibility */}
        <div className="bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-lg flex-shrink-0">
                <UserPen className="w-4 h-4 text-blue-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-[var(--text-primary)] text-sm md:text-base">
                  Hide Profile from Public View
                </h4>
                <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
                  Hide your CubeDev statistics and activity from public view.
                  Your WCA profile still remains public.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={hideProfile}
                onChange={(e) => setHideProfile(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
          </div>
        </div>

        {/* Challenge Stats Visibility */}
        <div className="bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] p-3 md:p-4">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-lg flex-shrink-0">
                <Trophy className="w-4 h-4 text-purple-500" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-[var(--text-primary)] text-sm md:text-base">
                  Hide Challenge Room Statistics
                </h4>
                <p className="text-xs md:text-sm text-[var(--text-muted)] mt-1">
                  Hide your challenge room statistics from public view. You'll
                  still appear in leaderboards during active rooms.
                </p>
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                checked={hideChallengeStats}
                onChange={(e) => setHideChallengeStats(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-[var(--border)] peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]"></div>
            </label>
          </div>
        </div>

        {/* Save Button */}
        {hasChanges && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm md:text-base w-full sm:w-auto justify-center"
            >
              {isSaving ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSaving ? "Saving..." : "Save Privacy Settings"}
            </button>

            {saveMessage && (
              <div
                className={`text-xs md:text-sm ${saveMessage.includes("success") ? "text-green-500" : "text-red-500"}`}
              >
                {saveMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}