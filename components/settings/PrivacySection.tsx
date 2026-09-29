"use client";

import { useState, useEffect } from "react";
import { UserPen, Check } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { SettingGroup } from "@/components/ui/SettingGroup";
import { SwitchRow } from "@/components/ui/Switch";
import { useToast } from "@/components/ui/Toast";

export default function PrivacySection() {
  const { user } = useUser();
  const toast = useToast();
  const [hideProfile, setHideProfile] = useState(false);
  const [hideChallengeStats, setHideChallengeStats] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Get current privacy settings
  const currentUser = useQuery(
    api.users.getUserById,
    user?.convexId ? { id: user.convexId } : "skip"
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

    try {
      await updatePrivacy({
        userId: user.convexId as any,
        hideProfile,
        hideChallengeStats,
      });

      toast.success("Privacy settings saved");
    } catch (error) {
      console.error("Failed to update privacy settings:", error);
      toast.error("Couldn't save privacy settings", {
        description: "Please try again.",
      });
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
    <Card variant="static">
      <CardHeader
        title="Privacy Settings"
        description="Control your CubeDev profile visibility and data sharing options"
      />

      <div className="space-y-4">
        <SettingGroup title="Profile visibility" icon={<UserPen />}>
          <div className="divide-y divide-(--border)">
            <SwitchRow
              variant="plain"
              className="py-3"
              label="Hide Profile from Public View"
              description="Hide your CubeDev statistics and activity from public view. Your WCA profile still remains public."
              checked={hideProfile}
              onChange={setHideProfile}
            />
            <SwitchRow
              variant="plain"
              className="py-3"
              label="Hide Challenge Room Statistics"
              description="Hide your challenge room statistics from public view. You'll still appear in leaderboards during active rooms."
              checked={hideChallengeStats}
              onChange={setHideChallengeStats}
            />
          </div>
        </SettingGroup>

        {hasChanges && (
          <div className="flex justify-end pt-2">
            <Button
              onClick={handleSaveSettings}
              loading={isSaving}
              loadingText="Saving…"
              iconLeft={<Check className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Save Privacy Settings
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}