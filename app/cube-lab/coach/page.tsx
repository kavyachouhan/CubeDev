"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CoachDashboard } from "@/components/coach";
import { useUser } from "@/components/UserProvider";

export default function CoachPage() {
  const { user } = useUser();

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
      </CubeLabLayout>
    </ProtectedRoute>
  );
}