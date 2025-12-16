"use client";

import { useState, useRef } from "react";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CustomSetsSkeleton } from "@/components/SkeletonLoaders";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Edit2,
  FolderOpen,
  Download,
  Upload,
  Globe,
  Lock,
  Play,
  File,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function CustomSetsPage() {
  const { user } = useUser();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [importData, setImportData] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's custom sets
  const customSets = useQuery(
    api.algorithms.getUserCustomSets,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

  // Get all cases for selection
  const allCases = useQuery(api.algorithms.getAllCasesForCustomSets);

  // Mutations
  const createCustomSet = useMutation(api.algorithms.createCustomSet);
  const deleteCustomSet = useMutation(api.algorithms.deleteCustomSet);
  const importCustomSet = useMutation(api.algorithms.importCustomSet);

  const handleCreateSet = async () => {
    if (!user || !newSetName.trim()) return;

    try {
      await createCustomSet({
        userId: user.convexId as Id<"users">,
        name: newSetName.trim(),
        description: newSetDescription.trim() || undefined,
        caseIds: [],
        isPublic: false,
      });
      setNewSetName("");
      setNewSetDescription("");
      setShowCreateModal(false);
    } catch (error) {
      console.error("Failed to create custom set:", error);
    }
  };

  const handleDeleteSet = async (setId: Id<"customAlgorithmSets">) => {
    if (!confirm("Are you sure you want to delete this custom set?")) return;

    try {
      await deleteCustomSet({ setId });
    } catch (error) {
      console.error("Failed to delete custom set:", error);
    }
  };

  const processImportData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      // Basic validation
      if (!parsed.name || !parsed.caseIds || !Array.isArray(parsed.caseIds)) {
        throw new Error("Invalid format: missing name or caseIds");
      }
      setImportData(data);
      setImportError(null);
    } catch (error) {
      setImportError("Invalid JSON format. Please check the data structure.");
      setImportData(data);
    }
  };

  const handleFileSelect = (file: File) => {
    if (!file.name.endsWith(".json")) {
      setImportError("Please select a JSON file");
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      processImportData(content);
    };
    reader.onerror = () => {
      setImportError("Failed to read file");
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleImportSet = async () => {
    if (!user || !importData.trim()) return;

    try {
      const parsed = JSON.parse(importData);
      await importCustomSet({
        userId: user.convexId as Id<"users">,
        data: parsed,
      });
      setImportData("");
      setImportError(null);
      setShowImportModal(false);
    } catch (error) {
      console.error("Failed to import custom set:", error);
      setImportError("Failed to import. Please check the data format.");
    }
  };

  const handleExportSet = (set: any) => {
    const exportData = {
      name: set.name,
      description: set.description,
      caseIds: set.caseIds,
      exportedAt: new Date().toISOString(),
      version: "1.0",
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${set.name.toLowerCase().replace(/\s+/g, "-")}-algorithms.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return null;
  }

  if (customSets === undefined) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <CustomSetsSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Header */}
            <div>
              <Link
                href="/cube-lab/algorithm-trainer"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors w-fit mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Algorithm Trainer
              </Link>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement mb-2">
                    Custom Algorithm Sets
                  </h1>
                  <p className="text-[var(--text-muted)]">
                    Create personal collections for focused practice
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    Import
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Set
                  </button>
                </div>
              </div>
            </div>

            {/* Custom Sets List */}
            {customSets.length === 0 ? (
              <div className="timer-card text-center py-12">
                <FolderOpen className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[var(--text-primary)] font-statement mb-2">
                  No Custom Sets Yet
                </h3>
                <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
                  Create a custom set to group specific algorithm cases together
                  for focused practice sessions.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Set
                </button>
              </div>
            ) : (
              <div className="grid gap-4">
                {customSets.map((set: any) => (
                  <div key={set._id} className="timer-card">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement">
                            {set.name}
                          </h3>
                          {set.isPublic ? (
                            <Globe className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </div>
                        {set.description && (
                          <p className="text-sm text-[var(--text-muted)] mb-2">
                            {set.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                          <span>{set.caseIds?.length || 0} cases</span>
                          <span>
                            Created{" "}
                            {new Date(set.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {set.caseIds?.length > 0 && (
                          <Link
                            href={`/cube-lab/algorithm-trainer/practice?mode=custom&setId=${set._id}`}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors text-sm"
                          >
                            <Play className="w-4 h-4" />
                            Practice
                          </Link>
                        )}
                        <Link
                          href={`/cube-lab/algorithm-trainer/custom/${set._id}`}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
                        >
                          <Edit2 className="w-4 h-4" />
                        </Link>
                        <button
                          onClick={() => handleExportSet(set)}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteSet(set._id)}
                          className="inline-flex items-center gap-2 px-3 py-2 border border-red-500/20 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors text-sm"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement mb-4">
                    Create Custom Set
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        Set Name *
                      </label>
                      <input
                        type="text"
                        value={newSetName}
                        onChange={(e) => setNewSetName(e.target.value)}
                        placeholder="e.g., My Weak Cases"
                        className="w-full px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                        Description (optional)
                      </label>
                      <textarea
                        value={newSetDescription}
                        onChange={(e) => setNewSetDescription(e.target.value)}
                        placeholder="Add a description..."
                        rows={3}
                        className="w-full px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                      />
                    </div>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateSet}
                        disabled={!newSetName.trim()}
                        className="flex-1 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                <div className="bg-[var(--surface)] rounded-lg max-w-md w-full p-6">
                  <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement mb-4">
                    Import Algorithm Set
                  </h2>
                  <div className="space-y-4">
                    {/* File Drop Zone */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                        isDragOver
                          ? "border-[var(--primary)] bg-[var(--primary)]/5"
                          : "border-[var(--border)] hover:border-[var(--text-muted)]"
                      }`}
                      onDragOver={(e) => {
                        e.preventDefault();
                        setIsDragOver(true);
                      }}
                      onDragLeave={() => setIsDragOver(false)}
                      onDrop={handleDrop}
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept=".json"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileSelect(file);
                        }}
                      />
                      <File className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-secondary)]">
                        Drop a JSON file here or click to browse
                      </p>
                      <p className="text-xs text-[var(--text-muted)] mt-1">
                        Supports .json files
                      </p>
                    </div>

                    <div className="relative flex items-center gap-4">
                      <div className="flex-1 border-t border-[var(--border)]" />
                      <span className="text-xs text-[var(--text-muted)]">
                        or paste JSON
                      </span>
                      <div className="flex-1 border-t border-[var(--border)]" />
                    </div>

                    <div>
                      <textarea
                        value={importData}
                        onChange={(e) => processImportData(e.target.value)}
                        placeholder='{"name": "My Set", "caseIds": [...], ...}'
                        rows={5}
                        className="w-full px-4 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                      />
                    </div>

                    {importError && (
                      <p className="text-sm text-red-500">{importError}</p>
                    )}

                    <p className="text-xs text-[var(--text-muted)]">
                      Import an algorithm set exported from CubeDev.
                    </p>
                    <div className="flex gap-3 pt-2">
                      <button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportData("");
                          setImportError(null);
                        }}
                        className="flex-1 px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImportSet}
                        disabled={!importData.trim() || !!importError}
                        className="flex-1 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Import
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}