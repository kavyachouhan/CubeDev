"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CoachDashboard } from "@/components/coach";
import { useUser } from "@/components/UserProvider";
import { LoadingState } from "@/components/ui/Spinner";

export default function CoachPage() {
  const { user } = useUser();

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
      </CubeLabLayout>
    </ProtectedRoute>
  );
}