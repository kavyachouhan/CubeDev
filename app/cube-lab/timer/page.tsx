"use client";

import { useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabTimer from "@/components/CubeLabTimer";
import CubeLabLayout from "@/components/CubeLabLayout";

export default function TimerPage() {
  const [isTimerFocusMode, setIsTimerFocusMode] = useState(false);

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="timer" isTimerFocusMode={isTimerFocusMode}>
        <CubeLabTimer onTimerFocusChange={setIsTimerFocusMode} />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}