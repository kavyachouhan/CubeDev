"use client";

import { useState } from "react";
import { Download, Upload } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CollapsibleCard, useCollapsed } from "@/components/ui/Card";
import ImportModal from "./ImportModal";

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

interface ImportExportButtonsProps {
  history: TimerRecord[];
  sessions: Session[];
  onImport: (solves: TimerRecord[]) => Promise<void>;
  isImportModalOpen?: boolean;
  onImportModalOpenChange?: (isOpen: boolean) => void;
}

export default function ImportExportButtons({
  history,
  sessions,
  onImport,
  isImportModalOpen,
  onImportModalOpenChange,
}: ImportExportButtonsProps) {
  const [internalImportModalOpen, setInternalImportModalOpen] = useState(false);
  const { open: isExpanded, onOpenChange: setIsExpanded } = useCollapsed(
    "cubelab-import-export-expanded",
    false,
  );

  const isImportModalControlled = typeof isImportModalOpen === "boolean";
  const importModalOpen = isImportModalControlled
    ? isImportModalOpen
    : internalImportModalOpen;

  const setImportModalOpen = (open: boolean) => {
    if (!isImportModalControlled) {
      setInternalImportModalOpen(open);
    }
    onImportModalOpenChange?.(open);
  };

  // Export timer data to TXT format
  const handleExport = () => {
    // Map session IDs to their solves
    const sessionSolveMap = new Map<string, TimerRecord[]>();

    history.forEach((solve) => {
      if (!sessionSolveMap.has(solve.sessionId)) {
        sessionSolveMap.set(solve.sessionId, []);
      }
      sessionSolveMap.get(solve.sessionId)!.push(solve);
    });

    // Create export object
    const exportData = {
      exportedAt: new Date().toISOString(),
      format: "cubedev-v1",
      sessions: sessions.map((session) => ({
        id: session.id,
        name: session.name,
        event: session.event,
        createdAt: session.createdAt.toISOString(),
        solveCount: sessionSolveMap.get(session.id)?.length || 0,
      })),
      solves: history.map((solve) => ({
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

    // Create and download the file
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "text/plain;charset=utf-8",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `cubedev-timer-export-${new Date().toISOString().split("T")[0]}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <CollapsibleCard
        title="Data Management"
        open={isExpanded}
        onOpenChange={setIsExpanded}
      >
        <p className="type-body mb-4">Import and export your timer data.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Button
            variant="secondary"
            size="lg"
            onClick={handleExport}
            iconLeft={<Download className="w-4 h-4" />}
          >
            Export Data
          </Button>
          <Button
            size="lg"
            onClick={() => setImportModalOpen(true)}
            iconLeft={<Upload className="w-4 h-4" />}
          >
            Import Data
          </Button>
        </div>
      </CollapsibleCard>

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={onImport}
      />
    </>
  );
}
