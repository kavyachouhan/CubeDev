"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { SimulationConfig } from "@/components/competition";

export default function CompetitionSimulatePage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="competitions">
        <SimulationConfig />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}