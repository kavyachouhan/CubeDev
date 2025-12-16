"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CompetitionOverview } from "@/components/competition";

export default function CompetitionDetailPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="competitions">
        <CompetitionOverview />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}