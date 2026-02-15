"use client";

import { useState, useRef } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import {
  X,
  Upload,
  FileJson,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ClipboardPaste,
  FileUp,
} from "lucide-react";

interface ImportResult {
  setsCreated: number;
  setsUpdated: number;
  casesCreated: number;
  casesUpdated: number;
  algorithmsCreated: number;
  algorithmsUpdated: number;
  errors: string[];
}

interface ValidationStatus {
  isValid: boolean;
  message: string;
  summary?: {
    sets: number;
    cases: number;
    algorithms: number;
  };
}

interface ImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImportModal({ isOpen, onClose }: ImportModalProps) {
  const [activeTab, setActiveTab] = useState<"paste" | "file">("paste");
  const [importData, setImportData] = useState("");
  const [validationStatus, setValidationStatus] =
    useState<ValidationStatus | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importAlgorithmData = useMutation(api.admin.importAlgorithmData);

  const validateImportData = (data: string): ValidationStatus => {
    if (!data.trim()) {
      return { isValid: false, message: "No data provided" };
    }

    try {
      const parsed = JSON.parse(data);

      // Check for valid structure
      if (!parsed || typeof parsed !== "object") {
        return { isValid: false, message: "Invalid JSON structure" };
      }

      // Count items
      const sets = Array.isArray(parsed.sets) ? parsed.sets.length : 0;
      const cases = Array.isArray(parsed.cases) ? parsed.cases.length : 0;
      const algorithms = Array.isArray(parsed.algorithms)
        ? parsed.algorithms.length
        : 0;

      // Also support direct export format
      if (sets === 0 && cases === 0 && algorithms === 0) {
        // Check if it's a single set
        if (parsed.name && parsed.category) {
          return {
            isValid: true,
            message: "Valid single set data",
            summary: { sets: 1, cases: 0, algorithms: 0 },
          };
        }
        // Check if it's an array of sets
        if (Array.isArray(parsed) && parsed[0]?.name && parsed[0]?.category) {
          return {
            isValid: true,
            message: `Valid data: ${parsed.length} sets`,
            summary: { sets: parsed.length, cases: 0, algorithms: 0 },
          };
        }
        return {
          isValid: false,
          message: "No valid sets, cases, or algorithms found",
        };
      }

      // Validate sets structure
      if (sets > 0) {
        const invalidSets = parsed.sets.filter(
          (s: unknown) =>
            !s ||
            typeof s !== "object" ||
            !("name" in (s as object)) ||
            !("category" in (s as object)),
        );
        if (invalidSets.length > 0) {
          return {
            isValid: false,
            message: `${invalidSets.length} sets missing required fields (name, category)`,
          };
        }
      }

      // Validate cases structure
      if (cases > 0) {
        const invalidCases = parsed.cases.filter(
          (c: unknown) =>
            !c ||
            typeof c !== "object" ||
            !("caseName" in (c as object)) ||
            !("setupMoves" in (c as object)),
        );
        if (invalidCases.length > 0) {
          return {
            isValid: false,
            message: `${invalidCases.length} cases missing required fields (caseName, setupMoves)`,
          };
        }
      }

      // Validate algorithms structure
      if (algorithms > 0) {
        const invalidAlgs = parsed.algorithms.filter(
          (a: unknown) =>
            !a || typeof a !== "object" || !("notation" in (a as object)),
        );
        if (invalidAlgs.length > 0) {
          return {
            isValid: false,
            message: `${invalidAlgs.length} algorithms missing required fields (notation)`,
          };
        }
      }

      return {
        isValid: true,
        message: `Valid data found`,
        summary: { sets, cases, algorithms },
      };
    } catch (error) {
      return { isValid: false, message: "Invalid JSON format" };
    }
  };

  const handleImport = async () => {
    if (!validationStatus?.isValid || !importData) return;

    setIsImporting(true);
    setImportResult(null);

    try {
      const parsed = JSON.parse(importData);

      // Normalize data structure
      let sets: unknown[] = [];
      let cases: unknown[] = [];
      let algorithms: unknown[] = [];

      if (Array.isArray(parsed)) {
        // Array of sets
        sets = parsed;
      } else if (parsed.name && parsed.category) {
        // Single set
        sets = [parsed];
      } else {
        // Standard export format
        sets = parsed.sets || [];
        cases = parsed.cases || [];
        algorithms = parsed.algorithms || [];
      }

      const result = await importAlgorithmData({
        sets: sets as {
          name: string;
          slug?: string;
          category: string;
          description?: string;
          difficulty?: "beginner" | "intermediate" | "advanced";
          puzzleType?: string;
          order?: number;
          isPublished?: boolean;
          caseCount?: number;
        }[],
        cases: cases as {
          setSlug?: string;
          setName?: string;
          caseName: string;
          setupMoves: string;
          solutionMoves?: string;
          visualizerState?: string;
          difficulty?: number;
          frequency?: number;
        }[],
        algorithms: algorithms as {
          caseSlug?: string;
          caseName?: string;
          setSlug?: string;
          setName?: string;
          notation: string;
          moveCount?: number;
          fingerTricks?: string;
          isDefault?: boolean;
        }[],
      });

      setImportResult(result);

      // Clear form after successful import (if no errors)
      if (result.errors.length === 0) {
        setTimeout(() => {
          setImportData("");
          setValidationStatus(null);
          setImportResult(null);
          onClose();
        }, 2000);
      }
    } catch (error) {
      console.error("Import error:", error);
      setImportResult({
        setsCreated: 0,
        setsUpdated: 0,
        casesCreated: 0,
        casesUpdated: 0,
        algorithmsCreated: 0,
        algorithmsUpdated: 0,
        errors: [
          error instanceof Error ? error.message : "Unknown error occurred",
        ],
      });
    } finally {
      setIsImporting(false);
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

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      readFileContent(file);
    }
  };

  const readFileContent = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (content) {
        setImportData(content);
        handleDataChange(content);
        setActiveTab("paste");
      }
    };
    reader.readAsText(file);
  };

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
    const jsonFile = files.find(
      (file) => file.name.endsWith(".json") || file.type === "application/json",
    );

    if (jsonFile) {
      readFileContent(jsonFile);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative timer-card max-w-2xl w-full my-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Import Algorithm Data
          </h3>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Tab Navigation */}
          <div className="flex border-b border-[var(--border)]">
            <button
              onClick={() => setActiveTab("paste")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-inter border-b-2 transition-colors ${
                activeTab === "paste"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <ClipboardPaste className="w-4 h-4" />
              Paste JSON
            </button>
            <button
              onClick={() => setActiveTab("file")}
              className={`flex items-center gap-2 px-4 py-2 text-sm font-inter border-b-2 transition-colors ${
                activeTab === "file"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              }`}
            >
              <FileUp className="w-4 h-4" />
              Upload File
            </button>
          </div>

          {/* Tab Content */}
          {activeTab === "paste" ? (
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] font-inter mb-1.5">
                Paste JSON Data
              </label>
              <textarea
                value={importData}
                onChange={(e) => handleDataChange(e.target.value)}
                rows={10}
                className="w-full px-3 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-mono text-sm resize-y"
                placeholder={`{
  "sets": [...],
  "cases": [...],
  "algorithms": [...]
}`}
              />
            </div>
          ) : (
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                isDragOver
                  ? "border-[var(--primary)] bg-[var(--primary)]/5"
                  : "border-[var(--border)] hover:border-[var(--text-muted)]"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileJson className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-primary)] font-inter font-medium mb-1">
                Drop JSON file here
              </p>
              <p className="text-sm text-[var(--text-muted)] font-inter mb-3">
                or click to browse
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] rounded-lg transition-colors font-inter text-sm"
              >
                <Upload className="w-4 h-4 inline-block mr-2" />
                Choose File
              </button>
            </div>
          )}

          {/* Validation Status */}
          {validationStatus && (
            <div
              className={`flex items-start gap-3 p-3 rounded-lg ${
                validationStatus.isValid
                  ? "bg-[var(--success)]/10 border border-[var(--success)]/20"
                  : "bg-[var(--error)]/10 border border-[var(--error)]/20"
              }`}
            >
              {validationStatus.isValid ? (
                <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-[var(--error)] shrink-0 mt-0.5" />
              )}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-inter ${
                    validationStatus.isValid
                      ? "text-[var(--success)]"
                      : "text-[var(--error)]"
                  }`}
                >
                  {validationStatus.message}
                </p>
                {validationStatus.summary && (
                  <div className="flex flex-wrap gap-4 mt-2 text-xs text-[var(--text-muted)] font-inter">
                    <span>{validationStatus.summary.sets} sets</span>
                    <span>{validationStatus.summary.cases} cases</span>
                    <span>
                      {validationStatus.summary.algorithms} algorithms
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Import Result */}
          {importResult && (
            <div
              className={`p-3 rounded-lg ${
                importResult.errors.length === 0
                  ? "bg-[var(--success)]/10 border border-[var(--success)]/20"
                  : "bg-[var(--warning)]/10 border border-[var(--warning)]/20"
              }`}
            >
              <div className="flex items-start gap-3">
                {importResult.errors.length === 0 ? (
                  <CheckCircle2 className="w-5 h-5 text-[var(--success)] shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-[var(--warning)] shrink-0 mt-0.5" />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-inter text-[var(--text-primary)] font-medium mb-1">
                    Import Complete
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs text-[var(--text-muted)] font-inter">
                    <span>
                      Sets: {importResult.setsCreated} created,{" "}
                      {importResult.setsUpdated} updated
                    </span>
                    <span>
                      Cases: {importResult.casesCreated} created,{" "}
                      {importResult.casesUpdated} updated
                    </span>
                    <span>
                      Algs: {importResult.algorithmsCreated} created,{" "}
                      {importResult.algorithmsUpdated} updated
                    </span>
                  </div>
                  {importResult.errors.length > 0 && (
                    <div className="mt-2">
                      <p className="text-xs text-[var(--error)] font-inter font-medium">
                        Errors ({importResult.errors.length}):
                      </p>
                      <ul className="text-xs text-[var(--error)] font-inter mt-1 space-y-0.5 max-h-20 overflow-y-auto">
                        {importResult.errors.slice(0, 5).map((err, i) => (
                          <li key={i} className="truncate">
                            {err}
                          </li>
                        ))}
                        {importResult.errors.length > 5 && (
                          <li>...and {importResult.errors.length - 5} more</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
            <p className="text-xs text-[var(--text-muted)] font-inter">
              <strong className="text-[var(--text-secondary)]">
                Supported formats:
              </strong>{" "}
              CubeDev export format with sets, cases, and algorithms arrays.
              Existing items will be updated based on matching slug or name.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 border-t border-[var(--border)]">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2.5 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] font-medium rounded-lg transition-colors font-inter text-sm order-2 sm:order-1"
            disabled={isImporting}
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={!validationStatus?.isValid || isImporting}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium rounded-lg transition-colors font-inter text-sm disabled:opacity-50 order-1 sm:order-2"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4" />
                Import Data
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
