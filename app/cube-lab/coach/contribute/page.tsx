"use client";

import { useRouter } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CoachDashboard } from "@/components/coach";
import { useUser } from "@/components/UserProvider";
import CoachVolunteerModal from "@/components/coach/CoachVolunteerModal";

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
            <div className="flex items-center justify-center min-h-[400px]">
              <div className="animate-spin w-8 h-8 border-3 border-(--primary) border-t-transparent rounded-full" />
            </div>
          )}
        </div>

        {/* Volunteer Modal */}
        <CoachVolunteerModal isOpen={true} onClose={handleCloseModal} />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}