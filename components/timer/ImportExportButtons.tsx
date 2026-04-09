"use client";

import { useState, useEffect } from "react";
import {
  Download,
  Upload,
  ChevronDown,
  ChevronRight,
  Eye,
  EyeOff,
} from "lucide-react";
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

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export default function ImportExportButtons({
  history,
  sessions,
  onImport,
  isImportModalOpen,
  onImportModalOpenChange,
}: ImportExportButtonsProps) {
  const [internalImportModalOpen, setInternalImportModalOpen] = useState(false);
  const [isExpanded, setIsExpanded] = usePersistentBool(
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
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 p-2 text-(--text-muted) hover:text-(--primary) rounded transition-colors"
            title={isExpanded ? "Hide data management" : "Show data management"}
          >
            <h3 className="text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
              Data Management
            </h3>
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
            title={isExpanded ? "Hide data management" : "Show data management"}
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {isExpanded && (
          <div className="space-y-3">
            <div className="text-sm text-(--text-secondary) mb-4">
              Import and export your timer data.
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Export Button */}
              <button
                onClick={handleExport}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-(--surface-elevated) hover:bg-(--surface-elevated)/80 border border-(--border) rounded-lg text-(--text-primary) font-medium transition-colors"
              >
                <Download className="w-4 h-4" />
                Export Data
              </button>

              {/* Import Button */}
              <button
                onClick={() => setImportModalOpen(true)}
                className="flex items-center justify-center gap-2 px-4 py-3 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg font-medium transition-colors"
              >
                <Upload className="w-4 h-4" />
                Import Data
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Import Modal */}
      <ImportModal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        onImport={onImport}
      />
    </>
  );
}
