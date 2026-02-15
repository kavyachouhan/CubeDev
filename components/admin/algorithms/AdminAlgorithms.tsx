"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { useCachedQuery } from "@/lib/hooks/useAdminCache";
import { ADMIN_CACHE_KEYS, ADMIN_CACHE_TTLS } from "@/lib/admin-cache";
import { Search, Plus, BookOpen, Upload } from "lucide-react";

import { CollapsibleCard } from "./shared";
import { AlgorithmAnalytics } from "./AlgorithmAnalytics";
import { AlgorithmSetCard } from "./AlgorithmSetCard";
import { CasesListView } from "./CasesListView";
import { EditSetModal } from "./modals/EditSetModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { ImportModal } from "./modals/ImportModal";

export default function AdminAlgorithms() {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingSet, setEditingSet] = useState<Id<"algorithmSets"> | null>(
    null,
  );
  const [showNewSetModal, setShowNewSetModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [deleteSet, setDeleteSet] = useState<Id<"algorithmSets"> | null>(null);
  const [viewingCases, setViewingCases] = useState<{
    setId: Id<"algorithmSets">;
    setName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data: sets } = useCachedQuery(
    api.admin.getAllSetsForAdmin,
    {},
    {
      cacheKey: ADMIN_CACHE_KEYS.algorithmSets,
      ttl: ADMIN_CACHE_TTLS.algorithms,
    },
  );
  const deleteSetMutation = useMutation(api.admin.deleteAlgorithmSet);

  const filteredSets = sets?.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteSet = async () => {
    if (!deleteSet) return;
    setIsDeleting(true);
    try {
      await deleteSetMutation({ setId: deleteSet });
      setDeleteSet(null);
    } catch (error) {
      console.error("Failed to delete set:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentSet = editingSet
    ? sets?.find((s) => s._id === editingSet)
    : null;

  // If viewing a specific set's cases
  if (viewingCases) {
    return (
      <div className="min-h-full p-3 sm:p-4 md:p-6 lg:p-8">
        <CasesListView
          setId={viewingCases.setId}
          setName={viewingCases.setName}
          onBack={() => setViewingCases(null)}
        />
      </div>
    );
  }

  return (
    <div className="min-h-full p-3 sm:p-4 md:p-6 lg:p-8 space-y-4 sm:space-y-6">
      {/* Analytics */}
      <CollapsibleCard
        title="Analytics"
        storageKey="admin-algorithms-analytics"
        defaultOpen={true}
      >
        <AlgorithmAnalytics />
      </CollapsibleCard>

      {/* Algorithm Sets */}
      <CollapsibleCard
        title={`Algorithm Sets${sets ? ` (${sets.length})` : ""}`}
        storageKey="admin-algorithms-sets"
        defaultOpen={true}
        headerExtra={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[var(--surface-elevated)] hover:bg-[var(--border)] border border-[var(--border)] rounded-lg text-[var(--text-secondary)] transition-colors font-inter"
            >
              <Upload className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Import</span>
            </button>
            <button
              onClick={() => setShowNewSetModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-inter"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Set</span>
            </button>
          </div>
        }
      >
        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
          <input
            type="text"
            placeholder="Search sets by name or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter text-sm"
          />
        </div>

        {/* Sets Grid */}
        {sets === undefined ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="timer-card animate-pulse h-48" />
            ))}
          </div>
        ) : filteredSets && filteredSets.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
            {filteredSets.map((set) => (
              <AlgorithmSetCard
                key={set._id}
                set={set}
                onEdit={() => setEditingSet(set._id)}
                onDelete={() => setDeleteSet(set._id)}
                onViewCases={() =>
                  setViewingCases({ setId: set._id, setName: set.name })
                }
              />
            ))}
          </div>
        ) : (
          <div className="timer-card text-center py-8">
            <BookOpen className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
            <p className="text-[var(--text-muted)] font-inter">
              No algorithm sets found
            </p>
          </div>
        )}
      </CollapsibleCard>

      {/* Modals */}
      {showNewSetModal && (
        <EditSetModal onClose={() => setShowNewSetModal(false)} isNew />
      )}

      {editingSet && currentSet && (
        <EditSetModal set={currentSet} onClose={() => setEditingSet(null)} />
      )}

      {deleteSet && (
        <DeleteConfirmModal
          title="Delete Algorithm Set"
          message="This will permanently delete this set, all its cases, algorithms, and user progress. This action cannot be undone."
          onConfirm={handleDeleteSet}
          onCancel={() => setDeleteSet(null)}
          isDeleting={isDeleting}
        />
      )}

      <ImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />
    </div>
  );
}
