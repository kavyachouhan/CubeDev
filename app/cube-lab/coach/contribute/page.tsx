"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CoachDashboard } from "@/components/coach";
import { useUser } from "@/components/UserProvider";
import CoachVolunteerModal from "@/components/coach/CoachVolunteerModal";
import { LoadingState } from "@/components/ui/Spinner";

export default function CoachContributePage() {
  const { user } = useUser();
  const router = useRouter();

  const handleCloseModal = () => {
    router.push("/cube-lab/coach");
  };

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="coach">
        <div className="p-4 sm:p-6">
          {user?.convexId ? (
            <CoachDashboard userId={user.convexId as any} />
          ) : (
            <LoadingState className="min-h-100" />
          )}
        </div>

        {/* Volunteer Modal */}
        <CoachVolunteerModal isOpen={true} onClose={handleCloseModal} />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}