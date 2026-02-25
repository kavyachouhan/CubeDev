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
  Search,
  MoreVertical,
  BookOpen,
  Code2,
  Clock,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";

export default function CustomSetsPage() {
  const { user } = useUser();
  const router = useRouter();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [newSetName, setNewSetName] = useState("");
  const [newSetDescription, setNewSetDescription] = useState("");
  const [importData, setImportData] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch user's custom sets
  const customSets = useQuery(
    api.algorithms.getUserCustomSets,
    user?.convexId ? { userId: user.convexId } : "skip"
  );

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
      setOpenMenuId(null);
    } catch (error) {
      console.error("Failed to delete custom set:", error);
    }
  };

  const processImportData = (data: string) => {
    try {
      const parsed = JSON.parse(data);
      if (!parsed.name || !parsed.caseIds || !Array.isArray(parsed.caseIds)) {
        throw new Error("Invalid format: missing name or caseIds");
      }
      setImportData(data);
      setImportError(null);
    } catch {
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
      customAlgorithms: set.customAlgorithms || [],
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

  const getTotalAlgorithmCount = (set: any) => {
    const predefined = set.caseIds?.length || 0;
    const custom = set.customAlgorithms?.length || 0;
    return predefined + custom;
  };

  const getTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 30) return `${days}d ago`;
    return new Date(timestamp).toLocaleDateString();
  };

  // Filter sets by search
  const filteredSets = customSets?.filter(
    (set: any) =>
      searchQuery === "" ||
      set.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      set.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!user) return null;

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
                  <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement mb-1">
                    Custom Algorithm Sets
                  </h1>
                  <p className="text-sm text-[var(--text-muted)]">
                    Build your own algorithm collections for focused practice
                  </p>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => setShowImportModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                  >
                    <Upload className="w-4 h-4" />
                    <span className="hidden sm:inline">Import</span>
                  </button>
                  <button
                    onClick={() => setShowCreateModal(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    New Set
                  </button>
                </div>
              </div>
            </div>

            {/* Stats Summary */}
            {customSets.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="timer-card text-center">
                  <p className="text-2xl font-bold text-[var(--primary)] font-statement">
                    {customSets.length}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">Total Sets</p>
                </div>
                <div className="timer-card text-center">
                  <p className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                    {customSets.reduce(
                      (acc: number, s: any) => acc + getTotalAlgorithmCount(s),
                      0
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Total Algorithms
                  </p>
                </div>
                <div className="timer-card text-center col-span-2 sm:col-span-1">
                  <p className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                    {customSets.reduce(
                      (acc: number, s: any) =>
                        acc + (s.customAlgorithms?.length || 0),
                      0
                    )}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    Custom Algorithms
                  </p>
                </div>
              </div>
            )}

            {/* Search */}
            {customSets.length > 0 && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search your sets..."
                  className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm transition-all"
                />
              </div>
            )}

            {/* Custom Sets List */}
            {customSets.length === 0 ? (
              <div className="timer-card text-center py-12">
                <FolderOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
                <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-2">
                  No Custom Sets Yet
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-6 max-w-sm mx-auto">
                  Create a custom set to organize algorithms your way. Add
                  predefined cases or write your own algorithms from scratch.
                </p>
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors text-sm"
                >
                  <Plus className="w-4 h-4" />
                  Create Your First Set
                </button>
              </div>
            ) : filteredSets && filteredSets.length === 0 ? (
              <div className="timer-card text-center py-8">
                <Search className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-sm text-[var(--text-muted)]">
                  No sets match &quot;{searchQuery}&quot;
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {filteredSets?.map((set: any) => {
                  const totalAlgs = getTotalAlgorithmCount(set);
                  const predefinedCount = set.caseIds?.length || 0;
                  const customCount = set.customAlgorithms?.length || 0;

                  return (
                    <div
                      key={set._id}
                      onClick={() => router.push(`/cube-lab/algorithm-trainer/custom/${set._id}`)}
                      className="timer-card block group cursor-pointer"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                        {/* Set Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-base font-bold text-[var(--text-primary)] font-statement truncate">
                              {set.name}
                            </h3>
                            {set.isPublic ? (
                              <Globe className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0" />
                            )}
                          </div>
                          {set.description && (
                            <p className="text-sm text-[var(--text-muted)] mb-2 line-clamp-1">
                              {set.description}
                            </p>
                          )}

                          {/* Meta Info */}
                          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-[var(--text-muted)]">
                            <span className="inline-flex items-center gap-1">
                              <Code2 className="w-3 h-3" />
                              {totalAlgs} algorithm{totalAlgs !== 1 ? "s" : ""}
                            </span>
                            {predefinedCount > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <BookOpen className="w-3 h-3" />
                                {predefinedCount} predefined
                              </span>
                            )}
                            {customCount > 0 && (
                              <span className="inline-flex items-center gap-1">
                                <Edit2 className="w-3 h-3" />
                                {customCount} custom
                              </span>
                            )}
                            <span className="inline-flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {getTimeAgo(set.updatedAt)}
                            </span>
                          </div>

                          {/* Algorithm Preview */}
                          {customCount > 0 && (
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              {(set.customAlgorithms || [])
                                .slice(0, 3)
                                .map((alg: any) => (
                                  <span
                                    key={alg.id}
                                    className="inline-block px-2 py-0.5 text-xs font-mono bg-[var(--surface-elevated)] border border-[var(--border)] rounded text-[var(--text-secondary)] truncate max-w-[200px]"
                                  >
                                    {alg.notation}
                                  </span>
                                ))}
                              {customCount > 3 && (
                                <span className="inline-block px-2 py-0.5 text-xs text-[var(--text-muted)]">
                                  +{customCount - 3} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div
                          className="flex items-center gap-2 flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {totalAlgs > 0 && (
                            <button
                              onClick={() => router.push(`/cube-lab/algorithm-trainer/practice?mode=custom&setId=${set._id}`)}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors text-sm"
                            >
                              <Play className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">Practice</span>
                            </button>
                          )}

                          {/* More menu */}
                          <div className="relative">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setOpenMenuId(
                                  openMenuId === set._id ? null : set._id
                                );
                              }}
                              className="p-2 hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] rounded-lg transition-colors"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>

                            {openMenuId === set._id && (
                              <>
                                <div
                                  className="fixed inset-0 z-40"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setOpenMenuId(null);
                                  }}
                                />
                                <div className="absolute right-0 top-full mt-1 w-44 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-50 py-1 overflow-hidden">
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleExportSet(set);
                                      setOpenMenuId(null);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
                                  >
                                    <Download className="w-4 h-4" />
                                    Export JSON
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleDeleteSet(set._id);
                                    }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-500/10 transition-colors"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Set
                                  </button>
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Modal */}
            {showCreateModal && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => setShowCreateModal(false)}
              >
                <div
                  className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement mb-4">
                    Create Custom Set
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 font-inter">
                        Set Name
                      </label>
                      <input
                        type="text"
                        value={newSetName}
                        onChange={(e) => setNewSetName(e.target.value)}
                        placeholder="e.g., My Weak OLLs, Speed PLLs"
                        className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm font-inter transition-all"
                        autoFocus
                        maxLength={100}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newSetName.trim()) {
                            handleCreateSet();
                          }
                        }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1 font-inter">
                        Description{" "}
                        <span className="text-[var(--text-muted)] font-normal">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        value={newSetDescription}
                        onChange={(e) => setNewSetDescription(e.target.value)}
                        placeholder="What algorithms will this set contain?"
                        rows={2}
                        className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none text-sm font-inter transition-all"
                        maxLength={500}
                      />
                    </div>
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => setShowCreateModal(false)}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleCreateSet}
                        disabled={!newSetName.trim()}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Create Set
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Import Modal */}
            {showImportModal && (
              <div
                className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={() => {
                  setShowImportModal(false);
                  setImportData("");
                  setImportError(null);
                }}
              >
                <div
                  className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
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

                    <textarea
                      value={importData}
                      onChange={(e) => processImportData(e.target.value)}
                      placeholder='{"name": "My Set", "caseIds": [...], ...}'
                      rows={4}
                      className="w-full px-4 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    />

                    {importError && (
                      <p className="text-sm text-red-500">{importError}</p>
                    )}

                    <p className="text-xs text-[var(--text-muted)]">
                      Import an algorithm set exported from CubeDev.
                    </p>
                    <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4">
                      <button
                        onClick={() => {
                          setShowImportModal(false);
                          setImportData("");
                          setImportError(null);
                        }}
                        className="flex-1 btn-secondary"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleImportSet}
                        disabled={!importData.trim() || !!importError}
                        className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
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
