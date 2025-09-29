"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ImportModal from "../timer/ImportModal";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  sessionId: string;
  notes?: string;
  tags?: string[];
}

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

export default function DataManagementSection() {
  const { user } = useUser();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Convex mutations
  const createSession = useMutation(api.users.createSession);
  const batchImportSolves = useMutation(api.users.batchImportSolves);

  // Fetch user solves and sessions
  const solves = useQuery(
    api.users.getUserSolves,
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  const sessions = useQuery(
    api.users.getUserSessions,
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  // Map to TimerRecord and Session types
  const timerSolves: TimerRecord[] =
    solves?.map((solve) => ({
      id: solve._id,
      time: solve.time,
      timestamp: new Date(solve.solveDate),
      scramble: solve.scramble,
      penalty: solve.penalty,
      finalTime: solve.finalTime,
      event: solve.event,
      sessionId: solve.sessionId,
      notes: solve.comment,
      tags: solve.tags,
    })) || [];

  const timerSessions: Session[] =
    sessions?.map((session) => ({
      id: session._id,
      name: session.name,
      event: session.event,
      createdAt: new Date(session.createdAt),
      solveCount: session.solveCount,
      convexId: session._id,
    })) || [];

  // Export function
  const handleExport = () => {
    // Prepare data
    const exportData = {
      exportedAt: new Date().toISOString(),
      format: "cubedev-v1",
      sessions: timerSessions.map((session) => ({
        id: session.id,
        name: session.name,
        event: session.event,
        createdAt: session.createdAt.toISOString(),
        solveCount: session.solveCount,
      })),
      solves: timerSolves.map((solve) => ({
        id: solve.id,
        time: solve.time,
        timestamp: solve.timestamp.toISOString(),
        scramble: solve.scramble,
        penalty: solve.penalty,
        finalTime: solve.finalTime,
        event: solve.event,
        sessionId: solve.sessionId,
        notes: solve.notes,
        tags: solve.tags,
      })),
    };

    // Create and download file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubedev-export-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import function - creates new session and imports solves
  const handleImportSolves = async (importedSolves: TimerRecord[]) => {
    if (!user?.convexId || importedSolves.length === 0) {
      throw new Error("No user or no solves to import");
    }

    try {
      // Group solves by event to create separate sessions if needed
      const solvesByEvent = importedSolves.reduce(
        (acc, solve) => {
          if (!acc[solve.event]) {
            acc[solve.event] = [];
          }
          acc[solve.event].push(solve);
          return acc;
        },
        {} as Record<string, TimerRecord[]>
      );

      const importResults = [];

      // Create a session for each event and import solves
      for (const [event, eventSolves] of Object.entries(solvesByEvent)) {
        // Create a new session for this import
        const sessionName = `Import ${new Date().toLocaleDateString()} - ${event}`;
        const sessionId = await createSession({
          userId: user.convexId as any,
          name: sessionName,
          event: event,
          description: `Imported ${eventSolves.length} solves on ${new Date().toLocaleString()}`,
        });

        // Prepare solves for import
        const solvesToImport = eventSolves.map((solve) => ({
          event: solve.event,
          scramble: solve.scramble,
          time: solve.time,
          penalty: solve.penalty,
          finalTime: solve.finalTime,
          timestamp: solve.timestamp.getTime(),
          comment: solve.notes,
          tags: solve.tags,
        }));

        // Import solves in batch
        const result = await batchImportSolves({
          userId: user.convexId as any,
          sessionId: sessionId,
          solves: solvesToImport,
        });

        importResults.push({
          event,
          sessionId,
          sessionName,
          importedCount: result.importedCount,
          totalAttempted: result.totalAttempted,
        });
      }

      console.log("Import completed:", importResults);

      // Show success message
      const totalImported = importResults.reduce(
        (sum, r) => sum + r.importedCount,
        0
      );
      alert(
        `Successfully imported ${totalImported} solves across ${importResults.length} session(s)!`
      );
    } catch (error) {
      console.error("Error importing solves:", error);
      throw error; // Re-throw to let ImportModal handle the error display
    }
  };

  if (!user) return null;

  return (
    <>
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
                Data Management
              </h3>
              <p className="text-sm text-[var(--text-muted)]">
                Import and export your solve data
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Data Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 md:p-4 border border-[var(--border)]">
              <div className="text-lg md:text-2xl font-bold text-[var(--text-primary)]">
                {timerSolves.length.toLocaleString()}
              </div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">
                Total Solves
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 md:p-4 border border-[var(--border)]">
              <div className="text-lg md:text-2xl font-bold text-[var(--text-primary)]">
                {timerSessions.length}
              </div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">
                Sessions
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-lg p-3 md:p-4 border border-[var(--border)] col-span-2 lg:col-span-1">
              <div className="text-lg md:text-2xl font-bold text-[var(--text-primary)]">
                {new Set(timerSolves.map((s) => s.event)).size}
              </div>
              <div className="text-xs md:text-sm text-[var(--text-muted)]">
                Events
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
            {/* Export Button */}
            <button
              onClick={handleExport}
              disabled={timerSolves.length === 0}
              className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
            >
              <Download className="w-4 h-4" />
              Export Data
            </button>

            {/* Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-2 md:py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-medium transition-colors text-sm md:text-base"
            >
              <Upload className="w-4 h-4" />
              Import Data
            </button>
          </div>

          {/* Info Section */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-3 md:p-4 border border-[var(--border)]">
            <div className="flex items-start gap-3">
              <div className="text-xs md:text-sm text-[var(--text-secondary)]">
                <div className="font-medium text-[var(--text-primary)] mb-2">
                  Export includes:
                </div>
                <div className="space-y-1">
                  <div>• All solve times and scrambles</div>
                  <div>• Session information and organization</div>
                  <div>• Notes and tags</div>
                  <div>• Compatible with major timer formats</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSolves}
      />
    </>
  );
}