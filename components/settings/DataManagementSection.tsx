"use client";

import { useState, useCallback } from "react";
import { Download, Upload } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { StatTile } from "@/components/ui/StatTile";
import { useToast } from "@/components/ui/Toast";
import { useQuery, useMutation, useConvex } from "convex/react";
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
  const toast = useToast();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Convex client for paginated fetching
  const convex = useConvex();

  // Convex mutations
  const createSession = useMutation(api.users.createSession);
  const batchImportSolves = useMutation(api.users.batchImportSolves);

  // Fetch user solves (paginated - first page for display)
  const solvesResult = useQuery(
    api.users.getUserSolves,
    user?.convexId ? { userId: user.convexId as any, limit: 1000 } : "skip"
  );

  // Get solve count to show user how many solves they have
  const solveCount = useQuery(
    api.users.getUserSolveCount,
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  const sessions = useQuery(
    api.users.getUserSessions,
    user?.convexId ? { userId: user.convexId as any } : "skip"
  );

  // Use allSolvesLoaded if available (for export), otherwise use first page
  const solvesData = solvesResult?.solves ?? [];

  // Map to TimerRecord and Session types
  const timerSolves: TimerRecord[] =
    solvesData.map((solve: any) => ({
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

  // Export function - progressively loads all solves before exporting
  const handleExport = useCallback(async () => {
    if (!user?.convexId) return;

    setIsExporting(true);

    try {
      // Progressively fetch all solves using pagination
      const allSolves: any[] = [];
      let cursor: string | null = null;
      let isDone = false;

      while (!isDone) {
        const result: {
          solves: any[];
          cursor: string | null;
          isDone: boolean;
        } = await convex.query(api.users.getUserSolves, {
          userId: user.convexId as any,
          limit: 2000,
          cursor: cursor ?? undefined,
        });

        allSolves.push(...result.solves);
        cursor = result.cursor;
        isDone = result.isDone;
      }

      // Convert to export format
      const exportSolves = allSolves.map((solve: any) => ({
        id: solve._id,
        time: solve.time,
        timestamp: new Date(solve.solveDate).toISOString(),
        scramble: solve.scramble,
        penalty: solve.penalty,
        finalTime: solve.finalTime,
        event: solve.event,
        sessionId: solve.sessionId,
        notes: solve.comment,
        tags: solve.tags,
      }));

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
        solves: exportSolves,
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
    } catch (error) {
      console.error("Failed to export data:", error);
    } finally {
      setIsExporting(false);
    }
  }, [user?.convexId, convex, timerSessions]);

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

        // Chunk to the per-mutation cap; there is no overall import size limit
        const IMPORT_BATCH_SIZE = 2000;
        let importedCount = 0;
        let totalAttempted = 0;
        for (let i = 0; i < solvesToImport.length; i += IMPORT_BATCH_SIZE) {
          const chunk = solvesToImport.slice(i, i + IMPORT_BATCH_SIZE);
          const result = await batchImportSolves({
            userId: user.convexId as any,
            sessionId: sessionId,
            solves: chunk,
          });
          importedCount += result.importedCount;
          totalAttempted += result.totalAttempted;
        }

        importResults.push({
          event,
          sessionId,
          sessionName,
          importedCount,
          totalAttempted,
        });
      }

      console.log("Import completed:", importResults);

      // Show success message
      const totalImported = importResults.reduce(
        (sum, r) => sum + r.importedCount,
        0
      );
      toast.success(`Imported ${totalImported} solves`, {
        description: `Across ${importResults.length} session${importResults.length === 1 ? "" : "s"}.`,
      });
    } catch (error) {
      console.error("Error importing solves:", error);
      throw error; // Re-throw to let ImportModal handle the error display
    }
  };

  if (!user) return null;

  return (
    <>
      <Card variant="static">
        <CardHeader
          title="Data Management"
          description="Import and export your solve data"
        />

        <div className="space-y-5">
          <div className="grid grid-cols-3 gap-3">
            <StatTile
              size="sm"
              label="Solves"
              value={(solveCount ?? timerSolves.length).toLocaleString()}
            />
            <StatTile size="sm" label="Sessions" value={timerSessions.length} />
            <StatTile
              size="sm"
              label="Events"
              value={new Set(timerSolves.map((s) => s.event)).size}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Button
              variant="secondary"
              onClick={handleExport}
              disabled={(solveCount ?? timerSolves.length) === 0}
              loading={isExporting}
              loadingText="Exporting…"
              iconLeft={<Download className="w-4 h-4" />}
            >
              Export Data
            </Button>
            <Button
              onClick={() => setIsImportModalOpen(true)}
              iconLeft={<Upload className="w-4 h-4" />}
            >
              Import Data
            </Button>
          </div>

          <div className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-3 md:p-4">
            <p className="type-label mb-2">Export includes</p>
            <ul className="list-disc pl-4 space-y-1 text-sm text-(--text-secondary) font-inter">
              <li>All solve times and scrambles</li>
              <li>Session information and organization</li>
              <li>Notes and tags</li>
              <li>Compatible with major timer formats</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Import Modal */}
      <ImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onImport={handleImportSolves}
      />
    </>
  );
}
