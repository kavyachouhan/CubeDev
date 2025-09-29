"use client";

import { useState, useRef } from "react";
import {
  Upload,
  AlertCircle,
  CircleCheck,
  X,
  File,
  FolderOpen,
} from "lucide-react";

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

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (solves: TimerRecord[]) => Promise<void>;
}

export default function ImportModal({
  isOpen,
  onClose,
  onImport,
}: ImportModalProps) {
  const [importData, setImportData] = useState("");
  const [validationStatus, setValidationStatus] = useState<{
    isValid: boolean;
    message: string;
    solveCount?: number;
  } | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);
  const [activeTab, setActiveTab] = useState<"paste" | "file">("paste");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importProgress, setImportProgress] = useState<{
    current: number;
    total: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Validate import data format
  const validateImportData = (data: string) => {
    if (!data.trim()) {
      return { isValid: false, message: "Please paste your timer data" };
    }

    try {
      // Try to parse JSON
      const parsed = JSON.parse(data);

      // Check for cstimer format
      if (parsed.session1 && Array.isArray(parsed.session1)) {
        const solves = parsed.session1;
        return {
          isValid: true,
          message: `Found ${solves.length} solves from cstimer format`,
          solveCount: solves.length,
        };
      }

      // Check for cubedesk format
      if (parsed.sessions && parsed.solves && Array.isArray(parsed.solves)) {
        return {
          isValid: true,
          message: `Found ${parsed.solves.length} solves from cubedesk format`,
          solveCount: parsed.solves.length,
        };
      }

      // Check for CubeDev format (array of TimerRecord)
      if (Array.isArray(parsed)) {
        return {
          isValid: true,
          message: `Found ${parsed.length} solves from CubeDev format`,
          solveCount: parsed.length,
        };
      }

      // Check for CubeDev export format
      if (parsed.solves && Array.isArray(parsed.solves)) {
        return {
          isValid: true,
          message: `Found ${parsed.solves.length} solves from CubeDev export format`,
          solveCount: parsed.solves.length,
        };
      }

      return { isValid: false, message: "Unrecognized data format" };
    } catch (error) {
      return { isValid: false, message: "Invalid JSON format" };
    }
  };

  // Convert imported data to TimerRecord format
  const convertToTimerRecords = (data: string): TimerRecord[] => {
    const parsed = JSON.parse(data);
    const now = new Date();

    // cstimer format
    if (parsed.session1 && Array.isArray(parsed.session1)) {
      return parsed.session1.map((solve: any, index: number) => {
        const [penalties, time] = solve[0];
        const scramble = solve[1] || "";
        const timestamp = solve[3]
          ? new Date(solve[3] * 1000)
          : new Date(now.getTime() - (parsed.session1.length - index) * 60000);

        let penalty: "none" | "+2" | "DNF" = "none";
        let finalTime = time;

        if (penalties === 2) {
          penalty = "+2";
          finalTime = time + 2000;
        } else if (penalties === -1) {
          penalty = "DNF";
          finalTime = Infinity;
        }

        return {
          id: `imported-${Date.now()}-${index}`,
          time,
          timestamp,
          scramble,
          penalty,
          finalTime,
          event: "333", // Default to 3x3 for cstimer
          sessionId: "default",
          notes: solve[2] || undefined,
        };
      });
    }

    // cubedesk format
    if (parsed.sessions && parsed.solves && Array.isArray(parsed.solves)) {
      return parsed.solves.map((solve: any, index: number) => {
        const time = solve.time * 1000; // cubedesk stores in seconds
        let penalty: "none" | "+2" | "DNF" = "none";
        let finalTime = time;

        if (solve.plus_two) {
          penalty = "+2";
          finalTime = time + 2000;
        } else if (solve.dnf) {
          penalty = "DNF";
          finalTime = Infinity;
        }

        return {
          id: solve.id || `imported-${Date.now()}-${index}`,
          time,
          timestamp: new Date(
            solve.created_at ||
              solve.started_at ||
              now.getTime() - (parsed.solves.length - index) * 60000
          ),
          scramble: solve.scramble || "",
          penalty,
          finalTime,
          event: solve.cube_type || "333",
          sessionId: solve.session_id || "default",
        };
      });
    }

    // CubeDev export format
    if (parsed.solves && Array.isArray(parsed.solves)) {
      return parsed.solves.map((solve: any, index: number) => ({
        id: solve.id || `imported-${Date.now()}-${index}`,
        time: solve.time || 0,
        timestamp: new Date(
          solve.timestamp ||
            now.getTime() - (parsed.solves.length - index) * 60000
        ),
        scramble: solve.scramble || "",
        penalty: solve.penalty || "none",
        finalTime: solve.finalTime || solve.time || 0,
        event: solve.event || "333",
        sessionId: solve.sessionId || "default",
        notes: solve.notes,
        tags: solve.tags,
      }));
    }

    // CubeDev format (array of TimerRecord)
    if (Array.isArray(parsed)) {
      return parsed.map((solve: any, index: number) => ({
        id: solve.id || `imported-${Date.now()}-${index}`,
        time: solve.time || 0,
        timestamp: new Date(
          solve.timestamp || now.getTime() - (parsed.length - index) * 60000
        ),
        scramble: solve.scramble || "",
        penalty: solve.penalty || "none",
        finalTime: solve.finalTime || solve.time || 0,
        event: solve.event || "333",
        sessionId: solve.sessionId || "default",
        notes: solve.notes,
        tags: solve.tags,
      }));
    }

    return [];
  };

  const handleImport = async () => {
    if (!validationStatus?.isValid || !importData) return;

    setIsImporting(true);
    setImportResult(null);
    setImportProgress(null);

    try {
      const solves = convertToTimerRecords(importData);
      console.log(`Converting ${solves.length} solves for import...`);

      setImportProgress({ current: 0, total: solves.length });

      // Call the optimized import function
      await onImport(solves);

      setImportResult({
        success: true,
        message: `Successfully imported ${solves.length} solves!`,
      });

      // Clear form after successful import
      setTimeout(() => {
        setImportData("");
        setValidationStatus(null);
        setImportResult(null);
        setImportProgress(null);
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        success: false,
        message: "Error importing data. Please check the format and try again.",
      });
    } finally {
      setIsImporting(false);
      setImportProgress(null);
    }
  };

  const handleDataChange = (value: string) => {
    setImportData(value);
    if (value.trim()) {
      const status = validateImportData(value);
      setValidationStatus(status);
    } else {
      setValidationStatus(null);
    }
  };

  // Handle file upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
  };

  // Read file content
  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportData(content);
        handleDataChange(content);
        setActiveTab("paste"); // Switch to paste tab to show content
      }
    };
    reader.readAsText(file);
  };

  // Handle drag and drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    const files = Array.from(e.dataTransfer.files);
    const txtFile = files.find(
      (file) =>
        file.name.endsWith(".txt") ||
        file.name.endsWith(".json") ||
        file.type === "text/plain" ||
        file.type === "application/json"
    );

    if (txtFile) {
      readFileContent(txtFile);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Import Timer Data
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "paste"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Paste Data
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "file"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}
            >
              Upload File
            </button>
          </div>

          {activeTab === "paste" ? (
            <>
              <div className="text-sm text-[var(--text-secondary)]">
                Paste your timer data below. Supported formats: csTimer,
                CubeDesk, and CubeDev.
              </div>

              {/* Text area */}
              <div>
                <textarea
                  value={importData}
                  onChange={(e) => handleDataChange(e.target.value)}
                  placeholder="Paste your timer data here..."
                  className="w-full h-48 p-3 text-sm bg-[var(--background)] border border-[var(--border)] rounded resize-none focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-mono"
                  onKeyDown={(e) => {
                    // Prevent spacebar from triggering timer events
                    if (e.key === " ") {
                      e.stopPropagation();
                    }
                  }}
                />
              </div>
            </>
          ) : (
            <>
              <div className="text-sm text-[var(--text-secondary)]">
                Upload a TXT or JSON file containing your timer data.
              </div>

              {/* File upload area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-[var(--primary)] bg-[var(--primary)]/5"
                    : "border-[var(--border)] hover:border-[var(--primary)]/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
                    <File className="w-6 h-6 text-[var(--primary)]" />
                  </div>

                  <div>
                    <div className="text-[var(--text-primary)] font-medium mb-2">
                      {isDragOver
                        ? "Drop your file here"
                        : "Choose a file or drag it here"}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      Supports .txt and .json files
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-medium transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse Files
                  </button>
                </div>
              </div>

              {/* File content preview */}
              {importData && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-[var(--text-primary)]">
                    File Content Preview:
                  </div>
                  <div className="max-h-32 overflow-y-auto p-3 bg-[var(--background)] border border-[var(--border)] rounded text-xs font-mono text-[var(--text-secondary)]">
                    {importData.slice(0, 500)}
                    {importData.length > 500 && "..."}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Import Progress */}
          {importProgress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-secondary)]">
                  Importing solves...
                </span>
                <span className="text-[var(--text-primary)]">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-[var(--surface-elevated)] rounded-full h-2">
                <div
                  className="bg-[var(--primary)] h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${(importProgress.current / importProgress.total) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Import result */}
          {importResult && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                importResult.success
                  ? "bg-[var(--success)]/20 border border-[var(--success)]/30"
                  : "bg-[var(--error)]/20 border border-[var(--error)]/30"
              }`}
            >
              {importResult.success ? (
                <CircleCheck className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  importResult.success
                    ? "text-[var(--success)]"
                    : "text-[var(--error)]"
                }`}
              >
                {importResult.message}
              </span>
            </div>
          )}

          {/* Validation status */}
          {validationStatus && (
            <div
              className={`flex items-center gap-2 p-3 rounded-lg ${
                validationStatus.isValid
                  ? "bg-[var(--success)]/20 border border-[var(--success)]/30"
                  : "bg-[var(--error)]/20 border border-[var(--error)]/30"
              }`}
            >
              {validationStatus.isValid ? (
                <CircleCheck className="w-4 h-4 text-[var(--success)] flex-shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-[var(--error)] flex-shrink-0" />
              )}
              <span
                className={`text-sm ${
                  validationStatus.isValid
                    ? "text-[var(--success)]"
                    : "text-[var(--error)]"
                }`}
              >
                {validationStatus.message}
              </span>
            </div>
          )}

          {/* Format help */}
          <div className="bg-[var(--surface-elevated)] rounded-lg p-3">
            <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide font-inter mb-2">
              Supported Formats
            </div>
            <div className="space-y-1 text-sm text-[var(--text-secondary)]">
              <div>
                • <strong>csTimer:</strong> Standard csTimer export format
              </div>
              <div>
                • <strong>CubeDesk:</strong> CubeDesk txt format
              </div>
              <div>
                • <strong>CubeDev:</strong> Native CubeDev format
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleImport}
              disabled={
                !validationStatus?.isValid ||
                isImporting ||
                importResult?.success
              }
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:bg-[var(--surface-elevated)] disabled:text-[var(--text-muted)] text-white rounded-lg font-medium transition-colors"
            >
              <Upload className="w-4 h-4" />
              {isImporting
                ? "Importing..."
                : importResult?.success
                  ? "Import Complete"
                  : "Import Data"}
            </button>
            <button
              onClick={onClose}
              disabled={isImporting}
              className="px-4 py-2 bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {importResult?.success ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}