"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { useUser } from "@/components/UserProvider";
import CreateRoomModal from "@/components/challenges/CreateRoomModal";
import JoinRoomModal from "@/components/challenges/JoinRoomModal";
import PublicRoomsList from "@/components/challenges/PublicRoomsList";
import RecentRoomsModal from "@/components/challenges/RecentRoomsModal";
import ChallengeRoomWalkthrough from "@/components/challenges/ChallengeRoomWalkthrough";
import { Plus, Users, Trophy, Calendar, ChevronDown, History } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Menu } from "@/components/ui/Menu";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";

export default function ChallengesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [showRecentModal, setShowRecentModal] = useState(false);

  const { user } = useUser();
  const challengeStats = useQuery(
    api.challengeStats.getUserChallengeStats,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="challenges">
        <div className="container-responsive py-4 md:py-8 space-y-4 md:space-y-6">
          <PageHeader
            title="Challenge Rooms"
            description="Compete on the same scrambles with other cubers."
            hideTitleOnMobile
            actions={
              <Menu
                title="Quick action"
                items={[
                  {
                    label: "Create room",
                    icon: <Plus />,
                    onSelect: () => setShowCreateModal(true),
                  },
                  {
                    label: "Join room",
                    icon: <Users />,
                    onSelect: () => setShowJoinModal(true),
                  },
                  { type: "separator" },
                  {
                    label: "Recent rooms",
                    icon: <History />,
                    onSelect: () => setShowRecentModal(true),
                  },
                ]}
                trigger={(props) => (
                  <Button
                    {...props}
                    iconLeft={<Plus className="w-4 h-4" />}
                    iconRight={
                      <ChevronDown
                        className={`w-4 h-4 transition-transform ${
                          props["aria-expanded"] ? "rotate-180" : ""
                        }`}
                      />
                    }
                  >
                    Quick Action
                  </Button>
                )}
              />
            }
          />

          <Card variant="static">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              {[
                { label: "Rooms won", value: challengeStats?.roomsWon, icon: <Trophy /> },
                { label: "Participated", value: challengeStats?.roomsParticipated, icon: <Users /> },
                { label: "Rooms created", value: challengeStats?.roomsCreated, icon: <Calendar /> },
              ].map((stat) => (
                <StatTile
                  key={stat.label}
                  label={stat.label}
                  icon={stat.icon}
                  mono={false}
                  size="lg"
                  value={stat.value ?? "—"}
                />
              ))}
            </div>
          </Card>

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

          {/* Walkthrough */}
          <ChallengeRoomWalkthrough />
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}