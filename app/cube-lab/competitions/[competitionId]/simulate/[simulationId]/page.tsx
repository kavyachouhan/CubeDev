"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { SimulationRunner } from "@/components/competition";

export default function SimulationRunnerPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="competitions">
        <SimulationRunner />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}