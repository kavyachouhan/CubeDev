"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { EditCustomSetSkeleton } from "@/components/SkeletonLoaders";
import AddCasesModal from "@/components/algorithm/AddCasesModal";
import AddCustomAlgorithmModal from "@/components/algorithm/AddCustomAlgorithmModal";
import CustomAlgorithmCard from "@/components/algorithm/CustomAlgorithmCard";
import ActionBottomSheet from "@/components/ui/ActionBottomSheet";
import {
  ArrowLeft,
  Plus,
  Globe,
  Lock,
  Search,
  BookOpen,
  Code2,
  X,
  ChevronDown,
  Brain,
  Flame,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

type TabType = "all" | "predefined" | "custom";

export default function EditCustomSetPage() {
  const params = useParams();
  const { user } = useUser();
  const setId = params.setId as string;

  const [showAddCases, setShowAddCases] = useState(false);
  const [showAddCustomAlg, setShowAddCustomAlg] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<TabType>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddMenu, setShowAddMenu] = useState(false);

  // Get the custom set with full details
  const setDetails = useQuery(
    api.algorithms.getCustomSetWithDetails,
    setId ? { setId: setId as Id<"customAlgorithmSets"> } : "skip",
  );

  // Get the custom set (for editing)
  const customSet = useQuery(
    api.algorithms.getCustomSetById,
    setId ? { setId: setId as Id<"customAlgorithmSets"> } : "skip",
  );

  // Get all cases for adding
  const allCases = useQuery(api.algorithms.getAllCasesForCustomSets);

  // Mutations
  const updateCustomSet = useMutation(api.algorithms.updateCustomSet);
  const addCaseToSet = useMutation(api.algorithms.addCaseToCustomSet);
  const removeCaseFromSet = useMutation(api.algorithms.removeCaseFromCustomSet);
  const toggleSetVisibility = useMutation(
    api.algorithms.toggleCustomSetVisibility,
  );
  const addCustomAlgorithm = useMutation(
    api.algorithms.addCustomAlgorithmToSet,
  );
  const updateCustomAlgorithm = useMutation(
    api.algorithms.updateCustomAlgorithmInSet,
  );
  const removeCustomAlgorithm = useMutation(
    api.algorithms.removeCustomAlgorithmFromSet,
  );

  const handleStartEdit = () => {
    if (customSet) {
      setEditName(customSet.name);
      setEditDescription(customSet.description || "");
      setIsEditing(true);
    }
  };

  const handleSaveEdit = async () => {
    if (!customSet || !editName.trim()) return;

    try {
      await updateCustomSet({
        setId: customSet._id,
        name: editName.trim(),
        description: editDescription.trim(),
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update set:", error);
    }
  };

  const handleAddCase = async (caseId: Id<"algorithmCases">) => {
    if (!customSet) return;
    try {
      await addCaseToSet({ setId: customSet._id, caseId });
    } catch (error) {
      console.error("Failed to add case:", error);
    }
  };

  const handleRemoveCase = async (caseId: Id<"algorithmCases">) => {
    if (!customSet) return;
    try {
      await removeCaseFromSet({ setId: customSet._id, caseId });
    } catch (error) {
      console.error("Failed to remove case:", error);
    }
  };

  const handleToggleVisibility = async () => {
    if (!customSet) return;
    try {
      await toggleSetVisibility({ setId: customSet._id });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  const handleAddCustomAlgorithm = async (data: {
    name: string;
    notation: string;
    notes?: string;
  }) => {
    if (!customSet) return;
    try {
      await addCustomAlgorithm({
        setId: customSet._id,
        name: data.name,
        notation: data.notation,
        notes: data.notes,
      });
      setShowAddCustomAlg(false);
    } catch (error) {
      console.error("Failed to add custom algorithm:", error);
    }
  };

  const handleUpdateCustomAlgorithm = async (
    algorithmId: string,
    data: { name?: string; notation?: string; notes?: string },
  ) => {
    if (!customSet) return;
    try {
      await updateCustomAlgorithm({
        setId: customSet._id,
        algorithmId,
        ...data,
      });
    } catch (error) {
      console.error("Failed to update custom algorithm:", error);
    }
  };

  const handleRemoveCustomAlgorithm = async (algorithmId: string) => {
    if (!customSet) return;
    try {
      await removeCustomAlgorithm({
        setId: customSet._id,
        algorithmId,
      });
    } catch (error) {
      console.error("Failed to remove custom algorithm:", error);
    }
  };

  // Computed values
  const predefinedCases = setDetails?.predefinedCases || [];
  const customAlgorithms = setDetails?.customAlgorithms || [];
  const totalCount = predefinedCases.length + customAlgorithms.length;

  // Filter and tab logic
  const filteredPredefined = predefinedCases.filter(
    (c) =>
      searchQuery === "" ||
      c.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.setName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.defaultAlgorithm.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const filteredCustom = customAlgorithms.filter(
    (a: any) =>
      searchQuery === "" ||
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.notation.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.notes?.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  if (!user) return null;

  if (
    setDetails === undefined ||
    customSet === undefined ||
    allCases === undefined
  ) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <EditCustomSetSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  if (!setDetails || !customSet) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-[var(--text-muted)]">Custom set not found</p>
              <Link
                href="/cube-lab/algorithm-trainer/custom"
                className="inline-flex items-center gap-2 mt-4 text-[var(--primary)] text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Custom Sets
              </Link>
            </div>
          </div>
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="algorithm-trainer">
        <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto space-y-6">
            {/* Navigation */}
            <Link
              href="/cube-lab/algorithm-trainer/custom"
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors w-fit"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Custom Sets
            </Link>

            {/* Set Header Card */}
            <div className="timer-card">
              {isEditing ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 font-inter">
                      Set Name
                    </label>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-lg sm:text-xl font-bold bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter"
                      autoFocus
                      maxLength={100}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && editName.trim())
                          handleSaveEdit();
                        if (e.key === "Escape") setIsEditing(false);
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[var(--text-muted)] mb-1 font-inter">
                      Description{" "}
                      <span className="font-normal">(optional)</span>
                    </label>
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={2}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2.5 text-[var(--text-secondary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex flex-col-reverse sm:flex-row gap-2 pt-2">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="btn-secondary text-sm py-2"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSaveEdit}
                      disabled={!editName.trim()}
                      className="btn-primary text-sm py-2 disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2"
                    >
                      Save
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {/* Title */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-lg sm:text-2xl font-bold text-[var(--text-primary)] font-statement truncate">
                          {customSet.name}
                        </h1>
                        <button
                          onClick={handleToggleVisibility}
                          className="p-1 hover:bg-[var(--surface-elevated)] rounded-lg transition-colors flex-shrink-0"
                          title={
                            customSet.isPublic ? "Make private" : "Make public"
                          }
                        >
                          {customSet.isPublic ? (
                            <Globe className="w-4 h-4 text-green-500" />
                          ) : (
                            <Lock className="w-4 h-4 text-[var(--text-muted)]" />
                          )}
                        </button>
                      </div>
                      {customSet.description && (
                        <p className="text-sm text-[var(--text-muted)] mb-2">
                          {customSet.description}
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2 flex-shrink-0">
                      <button
                        onClick={handleStartEdit}
                        className="px-3 py-1.5 sm:py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors text-xs sm:text-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Stats row */}
                  <div className="flex flex-wrap gap-3 text-xs text-[var(--text-muted)] mt-1">
                    <span className="inline-flex items-center gap-1">
                      <Code2 className="w-3 h-3" />
                      {totalCount} algorithm{totalCount !== 1 ? "s" : ""}
                    </span>
                    {predefinedCases.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        {predefinedCases.length} predefined
                      </span>
                    )}
                    {customAlgorithms.length > 0 && (
                      <span className="inline-flex items-center gap-1">
                        <Code2 className="w-3 h-3" />
                        {customAlgorithms.length} custom
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Practice Modes */}
            {totalCount > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-3">
                  Practice Modes
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Link
                    href={`/cube-lab/algorithm-trainer/practice?mode=custom&setId=${customSet._id}&type=rec`}
                    className="timer-card hover:border-[var(--primary)] border-2 border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[var(--primary)]/10 rounded-lg flex-shrink-0">
                        <Brain className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] font-statement">
                          Recognition
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          Identify cases quickly
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/cube-lab/algorithm-trainer/practice?mode=custom&setId=${customSet._id}&type=exec`}
                    className="timer-card hover:border-[var(--primary)] border-2 border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-[var(--primary)]/10 rounded-lg flex-shrink-0">
                        <Flame className="w-5 h-5 text-[var(--primary)]" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] font-statement">
                          Execution
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          Speed up your execution
                        </p>
                      </div>
                    </div>
                  </Link>

                  <Link
                    href={`/cube-lab/algorithm-trainer/practice?mode=custom&setId=${customSet._id}&type=blind`}
                    className="timer-card hover:border-[var(--primary)] border-2 border-transparent transition-all cursor-pointer group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2.5 bg-purple-500/10 rounded-lg flex-shrink-0">
                        <EyeOff className="w-5 h-5 text-purple-500" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[var(--text-primary)] font-statement">
                          Blind Recognition
                        </h4>
                        <p className="text-xs text-[var(--text-muted)]">
                          Recall from memory
                        </p>
                      </div>
                    </div>
                  </Link>
                </div>
              </div>
            )}

            {/* Add Algorithms Section */}
            <div className="relative">
              <button
                onClick={() => setShowAddMenu(!showAddMenu)}
                className="inline-flex items-center gap-2 px-4 py-2.5 border border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:text-[var(--primary)] text-[var(--text-muted)] rounded-lg transition-colors w-full justify-center text-sm"
              >
                <Plus className="w-4 h-4" />
                Add Algorithms
                <ChevronDown
                  className={`w-4 h-4 transition-transform ${showAddMenu ? "rotate-180" : ""}`}
                />
              </button>

              {showAddMenu && (
                <ActionBottomSheet
                  isOpen={true}
                  onClose={() => setShowAddMenu(false)}
                  title="Add Algorithms"
                  options={[
                    {
                      label: "Add Custom Algorithm",
                      description:
                        "Write your own algorithm with name and notation",
                      icon: <Code2 className="w-4 h-4 text-[var(--primary)]" />,
                      onClick: () => {
                        setShowAddCustomAlg(true);
                      },
                    },
                    {
                      label: "Add Predefined Cases",
                      description: "Choose from PLL, OLL, F2L, and other sets",
                      icon: (
                        <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                      ),
                      onClick: () => {
                        setShowAddCases(true);
                      },
                    },
                  ]}
                />
              )}
            </div>

            {/* Add Cases Modal */}
            <AddCasesModal
              isOpen={showAddCases}
              onClose={() => setShowAddCases(false)}
              allCases={allCases || []}
              existingCaseIds={customSet?.caseIds || []}
              onAddCase={handleAddCase}
              customSetId={setId}
            />

            {/* Add Custom Algorithm Modal */}
            <AddCustomAlgorithmModal
              isOpen={showAddCustomAlg}
              onClose={() => setShowAddCustomAlg(false)}
              onSubmit={handleAddCustomAlgorithm}
            />

            {/* Search and Filter */}
            {totalCount > 0 && (
              <div className="space-y-3">
                {/* Tabs */}
                <div className="flex gap-1 p-1 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg w-fit">
                  {(
                    [
                      { key: "all", label: "All", count: totalCount },
                      {
                        key: "predefined",
                        label: "Predefined",
                        count: predefinedCases.length,
                      },
                      {
                        key: "custom",
                        label: "Custom",
                        count: customAlgorithms.length,
                      },
                    ] as { key: TabType; label: string; count: number }[]
                  ).map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                        activeTab === tab.key
                          ? "bg-[var(--primary)] text-white"
                          : "text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                      }`}
                    >
                      {tab.label}
                      {tab.count > 0 && (
                        <span className="ml-1 opacity-75">({tab.count})</span>
                      )}
                    </button>
                  ))}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search algorithms, names, or notations..."
                    className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent text-sm transition-all"
                  />
                </div>
              </div>
            )}

            {/* Algorithm List */}
            {totalCount === 0 ? (
              <div className="timer-card text-center py-10">
                <Code2 className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3" />
                <h3 className="text-base font-bold text-[var(--text-primary)] font-statement mb-1">
                  No Algorithms Yet
                </h3>
                <p className="text-sm text-[var(--text-muted)] mb-4 max-w-sm mx-auto">
                  Add your own custom algorithms or choose from predefined sets
                  to get started.
                </p>
                <div className="flex flex-col sm:flex-row gap-2 justify-center">
                  <button
                    onClick={() => setShowAddCustomAlg(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors text-sm"
                  >
                    <Code2 className="w-4 h-4" />
                    Add Custom Algorithm
                  </button>
                  <button
                    onClick={() => setShowAddCases(true)}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
                  >
                    <BookOpen className="w-4 h-4" />
                    Browse Predefined
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Custom Algorithms Section */}
                {(activeTab === "all" || activeTab === "custom") &&
                  filteredCustom.length > 0 && (
                    <div>
                      {activeTab === "all" && (
                        <div className="flex items-center gap-2 mb-3">
                          <Code2 className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Custom Algorithms ({filteredCustom.length})
                          </h3>
                        </div>
                      )}
                      <div className="grid gap-2">
                        {filteredCustom.map((alg: any) => (
                          <CustomAlgorithmCard
                            key={alg.id}
                            algorithm={alg}
                            onUpdate={(data: {
                              name?: string;
                              notation?: string;
                              notes?: string;
                            }) => handleUpdateCustomAlgorithm(alg.id, data)}
                            onRemove={() => handleRemoveCustomAlgorithm(alg.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                {/* Predefined Cases Section */}
                {(activeTab === "all" || activeTab === "predefined") &&
                  filteredPredefined.length > 0 && (
                    <div>
                      {activeTab === "all" && (
                        <div className="flex items-center gap-2 mb-3">
                          <BookOpen className="w-4 h-4 text-[var(--primary)]" />
                          <h3 className="text-sm font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                            Predefined Cases ({filteredPredefined.length})
                          </h3>
                        </div>
                      )}
                      <div className="grid gap-2">
                        {filteredPredefined.map((c: any) => (
                          <div
                            key={c.caseId}
                            className="timer-card relative overflow-hidden"
                          >
                            {/* Remove button */}
                            <button
                              onClick={() => handleRemoveCase(c.caseId)}
                              className="absolute top-3 right-3 sm:hidden p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                              title="Remove from set"
                            >
                              <X className="w-4 h-4" />
                            </button>

                            <div className="flex items-start sm:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0 pr-8 sm:pr-0">
                                <div className="flex flex-wrap items-center gap-2 mb-1">
                                  <Link
                                    href={`/cube-lab/algorithm-trainer/cases/${c.slug || c.caseId}`}
                                    className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors text-sm"
                                  >
                                    {c.caseName}
                                  </Link>
                                  <span className="text-xs px-2 py-0.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded text-[var(--text-muted)]">
                                    {c.setName}
                                  </span>
                                </div>
                                {c.defaultAlgorithm && (
                                  <div className="mt-1 overflow-hidden">
                                    <p className="font-mono text-xs text-[var(--text-secondary)] bg-[var(--surface-elevated)] px-2 py-1 rounded border border-[var(--border)] inline-block max-w-full overflow-x-auto whitespace-nowrap">
                                      {c.defaultAlgorithm}
                                    </p>
                                  </div>
                                )}
                                {c.algorithmCount > 1 && (
                                  <p className="text-xs text-[var(--text-muted)] mt-1">
                                    {c.algorithmCount - 1} alternative algorithm
                                    {c.algorithmCount - 1 !== 1 ? "s" : ""}{" "}
                                    available
                                  </p>
                                )}
                              </div>
                              <button
                                onClick={() => handleRemoveCase(c.caseId)}
                                className="hidden sm:block p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors flex-shrink-0"
                                title="Remove from set"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                {/* No results for search */}
                {searchQuery &&
                  filteredPredefined.length === 0 &&
                  filteredCustom.length === 0 && (
                    <div className="timer-card text-center py-8">
                      <Search className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">
                        No algorithms match &quot;{searchQuery}&quot;
                      </p>
                    </div>
                  )}

                {/* Empty tab states */}
                {activeTab === "custom" && customAlgorithms.length === 0 && (
                  <div className="timer-card text-center py-8">
                    <Code2 className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                      No custom algorithms yet
                    </p>
                    <button
                      onClick={() => setShowAddCustomAlg(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Add Your First Algorithm
                    </button>
                  </div>
                )}

                {activeTab === "predefined" && predefinedCases.length === 0 && (
                  <div className="timer-card text-center py-8">
                    <BookOpen className="w-8 h-8 text-[var(--text-muted)] mx-auto mb-2" />
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                      No predefined cases added
                    </p>
                    <button
                      onClick={() => setShowAddCases(true)}
                      className="inline-flex items-center gap-2 px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors text-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Browse Predefined Cases
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}