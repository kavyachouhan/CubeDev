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
import {
  ArrowLeft,
  Plus,
  X,
  Check,
  Globe,
  Lock,
  Save,
  Play,
} from "lucide-react";
import Link from "next/link";
import { Id } from "@/convex/_generated/dataModel";

export default function EditCustomSetPage() {
  const params = useParams();
  const { user } = useUser();
  const setId = params.setId as string;

  const [showAddCases, setShowAddCases] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [isEditing, setIsEditing] = useState(false);

  // Get the custom set
  const customSet = useQuery(
    api.algorithms.getCustomSetById,
    setId ? { setId: setId as Id<"customAlgorithmSets"> } : "skip"
  );

  // Get all cases for adding
  const allCases = useQuery(api.algorithms.getAllCasesForCustomSets);

  // Mutations
  const updateCustomSet = useMutation(api.algorithms.updateCustomSet);
  const addCaseToSet = useMutation(api.algorithms.addCaseToCustomSet);
  const removeCaseFromSet = useMutation(api.algorithms.removeCaseFromCustomSet);
  const toggleSetVisibility = useMutation(
    api.algorithms.toggleCustomSetVisibility
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
        description: editDescription.trim() || undefined,
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Failed to update set:", error);
    }
  };

  const handleAddCase = async (caseId: Id<"algorithmCases">) => {
    if (!customSet) return;

    try {
      await addCaseToSet({
        setId: customSet._id,
        caseId,
      });
    } catch (error) {
      console.error("Failed to add case:", error);
    }
  };

  const handleRemoveCase = async (caseId: Id<"algorithmCases">) => {
    if (!customSet) return;

    try {
      await removeCaseFromSet({
        setId: customSet._id,
        caseId,
      });
    } catch (error) {
      console.error("Failed to remove case:", error);
    }
  };

  const handleToggleVisibility = async () => {
    if (!customSet) return;

    try {
      await toggleSetVisibility({
        setId: customSet._id,
      });
    } catch (error) {
      console.error("Failed to toggle visibility:", error);
    }
  };

  // Filter cases that are in the custom set
  const setCases =
    allCases?.filter((c: any) => customSet?.caseIds?.includes(c._id)) || [];

  if (!user) {
    return null;
  }

  if (customSet === undefined || allCases === undefined) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <EditCustomSetSkeleton />
        </CubeLabLayout>
      </ProtectedRoute>
    );
  }

  if (!customSet) {
    return (
      <ProtectedRoute>
        <CubeLabLayout activeSection="algorithm-trainer">
          <div className="h-full flex items-center justify-center">
            <div className="text-center">
              <p className="text-[var(--text-muted)]">Custom set not found</p>
              <Link
                href="/cube-lab/algorithm-trainer/custom"
                className="inline-flex items-center gap-2 mt-4 text-[var(--primary)]"
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
            {/* Header */}
            <div>
              <Link
                href="/cube-lab/algorithm-trainer/custom"
                className="inline-flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Custom Sets
              </Link>

              <div className="timer-card">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full text-2xl font-bold bg-transparent border-b border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--primary)] pb-2"
                    />
                    <textarea
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      placeholder="Add a description..."
                      rows={2}
                      className="w-full bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg px-3 py-2 text-[var(--text-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditing(false)}
                        className="px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={handleSaveEdit}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h1 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                          {customSet.name}
                        </h1>
                        <button
                          onClick={handleToggleVisibility}
                          className="p-1 hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
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
                        <p className="text-[var(--text-muted)]">
                          {customSet.description}
                        </p>
                      )}
                      <p className="text-sm text-[var(--text-muted)] mt-2">
                        {setCases.length} cases
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={handleStartEdit}
                        className="px-4 py-2 border border-[var(--border)] hover:bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg transition-colors"
                      >
                        Edit
                      </button>
                      {setCases.length > 0 && (
                        <Link
                          href={`/cube-lab/algorithm-trainer/practice?mode=custom&setId=${customSet._id}`}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors"
                        >
                          <Play className="w-4 h-4" />
                          Practice
                        </Link>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Add Cases Button */}
            <button
              onClick={() => setShowAddCases(true)}
              className="inline-flex items-center gap-2 px-4 py-2 border border-dashed border-[var(--border)] hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 text-[var(--text-muted)] hover:text-[var(--primary)] rounded-lg transition-colors w-full justify-center"
            >
              <Plus className="w-5 h-5" />
              Add Cases to Set
            </button>

            {/* Add Cases Modal */}
            <AddCasesModal
              isOpen={showAddCases}
              onClose={() => setShowAddCases(false)}
              allCases={allCases || []}
              existingCaseIds={customSet?.caseIds || []}
              onAddCase={handleAddCase}
              customSetId={setId}
            />

            {/* Current Cases */}
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)] font-statement mb-4">
                Cases in This Set ({setCases.length})
              </h3>

              {setCases.length === 0 ? (
                <div className="timer-card text-center py-8">
                  <p className="text-[var(--text-muted)]">
                    No cases added yet. Click "Add Cases to Set" above to get
                    started.
                  </p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {setCases.map((c: any) => (
                    <div
                      key={c._id}
                      className="timer-card flex items-center justify-between"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
                          <Check className="w-4 h-4 text-[var(--primary)]" />
                        </div>
                        <div>
                          <Link
                            href={`/cube-lab/algorithm-trainer/cases/${c.slug || c._id}`}
                            className="font-medium text-[var(--text-primary)] hover:text-[var(--primary)] transition-colors"
                          >
                            {c.caseName}
                          </Link>
                          <p className="text-xs text-[var(--text-muted)]">
                            {c.setName}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveCase(c._id)}
                        className="p-2 hover:bg-red-500/10 text-red-500 rounded-lg transition-colors"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}