"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { ChatInterface } from "@/components/cubie";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function SessionPage() {
  const params = useParams();
  const sessionId = params.sessionId as string;
  const [sessionTitle, setSessionTitle] = useState<string | null>(null);

  // This will be called from ChatInterface when session loads
  useEffect(() => {
    // Listen for session title updates
    const handleSessionTitleUpdate = (event: CustomEvent) => {
      if (event.detail.sessionId === sessionId) {
        setSessionTitle(event.detail.title);
      }
    };

    window.addEventListener(
      "cubie-session-loaded" as any,
      handleSessionTitleUpdate
    );

    return () => {
      window.removeEventListener(
        "cubie-session-loaded" as any,
        handleSessionTitleUpdate
      );
    };
  }, [sessionId]);

  // Update document title when session title changes
  useEffect(() => {
    if (sessionTitle) {
      document.title = `${sessionTitle} | Cubie AI | CubeDev`;
    } else {
      document.title = "Chat Session | Cubie AI | CubeDev";
    }
  }, [sessionTitle]);

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="cubie">
        <ChatInterface initialSessionId={sessionId} />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}
