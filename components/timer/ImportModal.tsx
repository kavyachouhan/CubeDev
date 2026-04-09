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

const CSTIMER_SESSION_KEY_REGEX = /^session(\d+)$/i;

const CSTIMER_EVENT_MAP: Record<string, string> = {
  "222": "222",
  "333": "333",
  "444": "444",
  "555": "555",
  "666": "666",
  "777": "777",
  "333oh": "333oh",
  "333bf": "333bf",
  "333fm": "333fm",
  "333ft": "333ft",
  "333mbf": "333mbf",
  "444bf": "444bf",
  "555bf": "555bf",
  minx: "minx",
  pyram: "pyram",
  clock: "clock",
  skewb: "skewb",
  sq1: "sq1",
  sqrs: "sq1",
};

function parseDelimitedLine(line: string, delimiter: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      fields.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  fields.push(current.trim());
  return fields;
}

function parseDateValue(input: string): Date | undefined {
  const value = input.trim();
  if (!value) return undefined;

  const numericValue = Number(value);
  if (Number.isFinite(numericValue) && numericValue > 0) {
    if (numericValue > 1_000_000_000_000) {
      return new Date(numericValue);
    }
    if (numericValue > 1_000_000_000) {
      return new Date(numericValue * 1000);
    }
    return new Date(numericValue);
  }

  const parsed = new Date(value);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  return undefined;
}

function parseCsTimerEvent(scrType?: string): string {
  if (!scrType) return "";

  const normalized = scrType.trim().toLowerCase();
  const stripped = normalized.endsWith("wca")
    ? normalized.slice(0, -3)
    : normalized;

  if (CSTIMER_EVENT_MAP[stripped]) {
    return CSTIMER_EVENT_MAP[stripped];
  }

  if (stripped.startsWith("333")) {
    return "333";
  }

  return "";
}

function parseTimeToMs(value: string): {
  time: number;
  penalty: "none" | "+2" | "DNF";
} {
  const raw = value.trim();
  if (!raw) {
    throw new Error("Empty time value");
  }

  const upper = raw.toUpperCase();
  if (upper.includes("DNF")) {
    return { time: 0, penalty: "DNF" };
  }

  let penalty: "none" | "+2" | "DNF" = "none";
  let working = raw;

  if (/\+2\s*$/.test(working)) {
    penalty = "+2";
    working = working.replace(/\+2\s*$/, "").trim();
  } else if (/\+\s*$/.test(working)) {
    penalty = "+2";
    working = working.replace(/\+\s*$/, "").trim();
  }

  if (!working) {
    throw new Error("Missing base time value");
  }

  const colonParts = working.split(":");
  let milliseconds = 0;

  if (colonParts.length > 1) {
    let totalSeconds = 0;
    for (let i = 0; i < colonParts.length; i++) {
      const part = Number(colonParts[i]);
      if (!Number.isFinite(part)) {
        throw new Error("Invalid colon time format");
      }

      const exponent = colonParts.length - i - 1;
      totalSeconds += part * Math.pow(60, exponent);
    }

    milliseconds = Math.round(totalSeconds * 1000);
  } else {
    const numeric = Number(working);
    if (!Number.isFinite(numeric)) {
      throw new Error("Invalid numeric time format");
    }

    if (working.includes(".")) {
      milliseconds = Math.round(numeric * 1000);
    } else if (numeric > 1000) {
      milliseconds = Math.round(numeric);
    } else {
      milliseconds = Math.round(numeric * 1000);
    }
  }

  return { time: Math.max(0, milliseconds), penalty };
}

function parseCsTimerSessionData(parsed: any): Record<string, string> {
  const rawSessionData = parsed?.properties?.sessionData;
  if (!rawSessionData) {
    return {};
  }

  let sessionData = rawSessionData;
  if (typeof sessionData === "string") {
    try {
      sessionData = JSON.parse(sessionData);
    } catch {
      return {};
    }
  }

  if (!sessionData || typeof sessionData !== "object") {
    return {};
  }

  const eventBySessionKey: Record<string, string> = {};
  for (const [sessionNumber, metadata] of Object.entries(
    sessionData as Record<string, any>,
  )) {
    const scrType = metadata?.scrType;
    const mappedEvent = parseCsTimerEvent(
      typeof scrType === "string" ? scrType : undefined,
    );
    if (mappedEvent) {
      eventBySessionKey[`session${sessionNumber}`] = mappedEvent;
    }
  }

  return eventBySessionKey;
}

function getCsTimerSessions(parsed: any): Array<[string, any[]]> {
  return Object.entries(parsed)
    .filter(
      ([key, value]) =>
        CSTIMER_SESSION_KEY_REGEX.test(key) && Array.isArray(value),
    )
    .sort((a, b) => {
      const aMatch = a[0].match(CSTIMER_SESSION_KEY_REGEX);
      const bMatch = b[0].match(CSTIMER_SESSION_KEY_REGEX);
      const aNumber = aMatch ? Number(aMatch[1]) : 0;
      const bNumber = bMatch ? Number(bMatch[1]) : 0;
      return aNumber - bNumber;
    }) as Array<[string, any[]]>;
}

function looksLikeCubeTimeCsv(data: string): {
  matches: boolean;
  solveCount: number;
} {
  const lines = data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return { matches: false, solveCount: 0 };
  }

  const headers = parseDelimitedLine(lines[0], ",").map((field) =>
    field.trim().toLowerCase(),
  );
  const hasRequiredColumns =
    headers.includes("time") &&
    headers.includes("scramble") &&
    headers.includes("date");

  if (!hasRequiredColumns) {
    return { matches: false, solveCount: 0 };
  }

  let solveCount = 0;
  for (let i = 1; i < lines.length; i++) {
    const columns = parseDelimitedLine(lines[i], ",");
    if (columns.length > 0 && columns[0].trim()) {
      solveCount++;
    }
  }

  return { matches: true, solveCount };
}

function looksLikeTwistyTimerText(data: string): {
  matches: boolean;
  solveCount: number;
} {
  const lines = data
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length === 0) {
    return { matches: false, solveCount: 0 };
  }

  let solveCount = 0;
  for (const line of lines) {
    const columns = parseDelimitedLine(line, ";");
    if (columns.length < 3 || columns.length > 4) {
      continue;
    }

    try {
      parseTimeToMs(columns[0]);
      solveCount++;
    } catch {
      continue;
    }
  }

  return {
    matches: solveCount > 0,
    solveCount,
  };
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

      // Check for csTimer/CubeTime csTimer-export format
      const csTimerSessions = getCsTimerSessions(parsed);
      if (csTimerSessions.length > 0) {
        const solveCount = csTimerSessions.reduce(
          (count, [, solves]) => count + solves.length,
          0,
        );
        return {
          isValid: true,
          message: `Found ${solveCount} solves from csTimer/CubeTime JSON format`,
          solveCount,
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
    } catch {
      const cubeTimeCsv = looksLikeCubeTimeCsv(data);
      if (cubeTimeCsv.matches) {
        return {
          isValid: true,
          message: `Found ${cubeTimeCsv.solveCount} solves from CubeTime CSV format`,
          solveCount: cubeTimeCsv.solveCount,
        };
      }

      const twistyTimerText = looksLikeTwistyTimerText(data);
      if (twistyTimerText.matches) {
        return {
          isValid: true,
          message: `Found ${twistyTimerText.solveCount} solves from Twisty Timer text format`,
          solveCount: twistyTimerText.solveCount,
        };
      }

      return {
        isValid: false,
        message: "Invalid JSON, CSV, or Twisty text format",
      };
    }
  };

  // Convert imported data to TimerRecord format
  const convertToTimerRecords = (data: string): TimerRecord[] => {
    const now = new Date();
    let parsed: any = null;

    try {
      parsed = JSON.parse(data);
    } catch {
      parsed = null;
    }

    // csTimer/CubeTime JSON format
    if (parsed) {
      const csTimerSessions = getCsTimerSessions(parsed);
      if (csTimerSessions.length > 0) {
        const eventBySessionKey = parseCsTimerSessionData(parsed);
        const allSolves = csTimerSessions.flatMap(([sessionKey, solves]) =>
          solves.map((solve: any) => ({ solve, sessionKey })),
        );

        return allSolves.map(({ solve, sessionKey }, index) => {
          const penaltyAndTime = Array.isArray(solve?.[0]) ? solve[0] : [0, 0];
          const penalties = Number(penaltyAndTime[0] ?? 0);
          const time = Number(penaltyAndTime[1] ?? 0);
          const scramble = solve?.[1] || "";

          const sourceTimestamp = solve?.[3];
          const timestampDate = parseDateValue(String(sourceTimestamp ?? ""));
          const timestamp =
            timestampDate ||
            new Date(now.getTime() - (allSolves.length - index) * 60000);

          let penalty: "none" | "+2" | "DNF" = "none";
          let finalTime = time;

          if (penalties === -1) {
            penalty = "DNF";
            finalTime = Infinity;
          } else if (penalties === 2 || penalties === 2000) {
            penalty = "+2";
            finalTime = time + 2000;
          }

          return {
            id: `imported-${Date.now()}-${index}`,
            time,
            timestamp,
            scramble,
            penalty,
            finalTime,
            event: eventBySessionKey[sessionKey] || "",
            sessionId: "default",
            notes: solve?.[2] || undefined,
          };
        });
      }
    }

    // cubedesk format
    if (parsed?.sessions && parsed?.solves && Array.isArray(parsed.solves)) {
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
              now.getTime() - (parsed.solves.length - index) * 60000,
          ),
          scramble: solve.scramble || "",
          penalty,
          finalTime,
          event: solve.cube_type || "",
          sessionId: solve.session_id || "default",
        };
      });
    }

    // CubeDev export format
    if (parsed?.solves && Array.isArray(parsed.solves)) {
      return parsed.solves.map((solve: any, index: number) => ({
        id: solve.id || `imported-${Date.now()}-${index}`,
        time: solve.time || 0,
        timestamp: new Date(
          solve.timestamp ||
            now.getTime() - (parsed.solves.length - index) * 60000,
        ),
        scramble: solve.scramble || "",
        penalty: solve.penalty || "none",
        finalTime: solve.finalTime || solve.time || 0,
        event: solve.event || "",
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
          solve.timestamp || now.getTime() - (parsed.length - index) * 60000,
        ),
        scramble: solve.scramble || "",
        penalty: solve.penalty || "none",
        finalTime: solve.finalTime || solve.time || 0,
        event: solve.event || "",
        sessionId: solve.sessionId || "default",
        notes: solve.notes,
        tags: solve.tags,
      }));
    }

    // CubeTime CSV format
    const csvLines = data
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean);
    const csvDetection = looksLikeCubeTimeCsv(data);
    if (csvDetection.matches && csvLines.length > 1) {
      const headers = parseDelimitedLine(csvLines[0], ",").map((field) =>
        field.trim().toLowerCase(),
      );
      const timeIdx = headers.indexOf("time");
      const commentIdx = headers.indexOf("comment");
      const scrambleIdx = headers.indexOf("scramble");
      const dateIdx = headers.indexOf("date");

      const solves = csvLines.slice(1);
      const mappedSolves: Array<TimerRecord | null> = solves.map(
        (line, index): TimerRecord | null => {
          const fields = parseDelimitedLine(line, ",");
          const timeValue = fields[timeIdx] || "";
          if (!timeValue) return null;

          let parsedTime: { time: number; penalty: "none" | "+2" | "DNF" };
          try {
            parsedTime = parseTimeToMs(timeValue);
          } catch {
            return null;
          }

          const dateValue = dateIdx >= 0 ? fields[dateIdx] || "" : "";
          const timestampDate = parseDateValue(dateValue);
          const timestamp =
            timestampDate ||
            new Date(now.getTime() - (solves.length - index) * 60000);

          const penalty = parsedTime.penalty;
          const finalTime =
            penalty === "DNF"
              ? Infinity
              : penalty === "+2"
                ? parsedTime.time + 2000
                : parsedTime.time;

          const notes = commentIdx >= 0 ? fields[commentIdx] || "" : "";

          return {
            id: `imported-${Date.now()}-${index}`,
            time: parsedTime.time,
            timestamp,
            scramble: scrambleIdx >= 0 ? fields[scrambleIdx] || "" : "",
            penalty,
            finalTime,
            event: "",
            sessionId: "default",
            ...(notes ? { notes } : {}),
          };
        },
      );

      return mappedSolves.filter(
        (solve): solve is TimerRecord => solve !== null,
      );
    }

    // Twisty Timer external text format
    const twistyDetection = looksLikeTwistyTimerText(data);
    if (twistyDetection.matches) {
      const lines = data
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean);
      const mappedSolves: Array<TimerRecord | null> = lines.map(
        (line, index): TimerRecord | null => {
          const fields = parseDelimitedLine(line, ";");
          if (fields.length < 3 || fields.length > 4) return null;

          let parsedTime: { time: number; penalty: "none" | "+2" | "DNF" };
          try {
            parsedTime = parseTimeToMs(fields[0]);
          } catch {
            return null;
          }

          const explicitPenaltyField = (fields[3] || "").trim().toUpperCase();
          let penalty = parsedTime.penalty;
          if (explicitPenaltyField === "DNF") {
            penalty = "DNF";
          } else if (
            explicitPenaltyField === "+2" ||
            explicitPenaltyField === "2"
          ) {
            penalty = "+2";
          }

          const timestampDate = parseDateValue(fields[2] || "");
          const timestamp =
            timestampDate ||
            new Date(now.getTime() - (lines.length - index) * 60000);

          const finalTime =
            penalty === "DNF"
              ? Infinity
              : penalty === "+2"
                ? parsedTime.time + 2000
                : parsedTime.time;

          return {
            id: `imported-${Date.now()}-${index}`,
            time: parsedTime.time,
            timestamp,
            scramble: fields[1] || "",
            penalty,
            finalTime,
            event: "",
            sessionId: "default",
          };
        },
      );

      return mappedSolves.filter(
        (solve): solve is TimerRecord => solve !== null,
      );
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
    const importFile = files.find(
      (file) =>
        file.name.endsWith(".txt") ||
        file.name.endsWith(".json") ||
        file.name.endsWith(".csv") ||
        file.type === "text/plain" ||
        file.type === "application/json" ||
        file.type === "text/csv" ||
        file.type === "application/vnd.ms-excel",
    );

    if (importFile) {
      readFileContent(importFile);
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
      <div className="relative bg-(--surface) border border-(--border) rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
            Import Timer Data
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-(--border)">
            <button
              onClick={() => setActiveTab("paste")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "paste"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              Paste Data
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === "file"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary)"
              }`}
            >
              Upload File
            </button>
          </div>

          {activeTab === "paste" ? (
            <>
              <div className="text-sm text-(--text-secondary)">
                Paste your timer data below. Supported formats: csTimer,
                CubeDesk, Twisty Timer, CubeTime, and CubeDev.
              </div>

              {/* Text area */}
              <div>
                <textarea
                  value={importData}
                  onChange={(e) => handleDataChange(e.target.value)}
                  placeholder="Paste your timer data here..."
                  className="w-full h-48 p-3 text-sm bg-(--background) border border-(--border) rounded resize-none focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-mono"
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
              <div className="text-sm text-(--text-secondary)">
                Upload a TXT or JSON file containing your timer data.
              </div>

              {/* File upload area */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isDragOver
                    ? "border-(--primary) bg-(--primary)/5"
                    : "border-(--border) hover:border-(--primary)/50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.json,.csv,text/csv"
                  onChange={handleFileUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="space-y-4">
                  <div className="mx-auto w-12 h-12 bg-(--surface-elevated) rounded-lg flex items-center justify-center">
                    <File className="w-6 h-6 text-(--primary)" />
                  </div>

                  <div>
                    <div className="text-(--text-primary) font-medium mb-2">
                      {isDragOver
                        ? "Drop your file here"
                        : "Choose a file or drag it here"}
                    </div>
                    <div className="text-sm text-(--text-secondary)">
                      Supports .txt, .json, and .csv files
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-(--surface-elevated) hover:bg-(--border) border border-(--border) rounded-lg text-(--text-primary) font-medium transition-colors"
                  >
                    <FolderOpen className="w-4 h-4" />
                    Browse Files
                  </button>
                </div>
              </div>

              {/* File content preview */}
              {importData && (
                <div className="space-y-2">
                  <div className="text-sm font-medium text-(--text-primary)">
                    File Content Preview:
                  </div>
                  <div className="max-h-32 overflow-y-auto p-3 bg-(--background) border border-(--border) rounded text-xs font-mono text-(--text-secondary)">
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
                <span className="text-(--text-secondary)">
                  Importing solves...
                </span>
                <span className="text-(--text-primary)">
                  {importProgress.current} / {importProgress.total}
                </span>
              </div>
              <div className="w-full bg-(--surface-elevated) rounded-full h-2">
                <div
                  className="bg-(--primary) h-2 rounded-full transition-all duration-300"
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
                  ? "bg-(--success)/20 border border-(--success)/30"
                  : "bg-(--error)/20 border border-(--error)/30"
              }`}
            >
              {importResult.success ? (
                <CircleCheck className="w-4 h-4 text-(--success) shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-(--error) shrink-0" />
              )}
              <span
                className={`text-sm ${
                  importResult.success ? "text-(--success)" : "text-(--error)"
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
                  ? "bg-(--success)/20 border border-(--success)/30"
                  : "bg-(--error)/20 border border-(--error)/30"
              }`}
            >
              {validationStatus.isValid ? (
                <CircleCheck className="w-4 h-4 text-(--success) shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-(--error) shrink-0" />
              )}
              <span
                className={`text-sm ${
                  validationStatus.isValid
                    ? "text-(--success)"
                    : "text-(--error)"
                }`}
              >
                {validationStatus.message}
              </span>
            </div>
          )}

          {/* Format help */}
          <div className="bg-(--surface-elevated) rounded-lg p-3">
            <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
              Supported Formats
            </div>
            <div className="space-y-1 text-sm text-(--text-secondary)">
              <div>
                • <strong>csTimer:</strong> Standard csTimer export format
              </div>
              <div>
                • <strong>CubeDesk:</strong> CubeDesk txt format
              </div>
              <div>
                • <strong>Twisty Timer:</strong> External text export format
              </div>
              <div>
                • <strong>CubeTime:</strong> csTimer JSON and CSV exports
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
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-(--primary) hover:bg-(--primary-hover) disabled:bg-(--surface-elevated) disabled:text-(--text-muted) text-white rounded-lg font-medium transition-colors"
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
              className="px-4 py-2 bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border) disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              {importResult?.success ? "Close" : "Cancel"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
