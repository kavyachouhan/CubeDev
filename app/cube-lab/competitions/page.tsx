"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CompetitionBrowser } from "@/components/competition";

export default function CompetitionsPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="competitions">
        <CompetitionBrowser />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}