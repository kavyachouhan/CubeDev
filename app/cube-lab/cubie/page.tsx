"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { ChatInterface } from "@/components/cubie";

export default function CubiePage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="cubie">
        <ChatInterface />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}
