"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ChevronLeft, Plus, Edit2, Trash2, FileText } from "lucide-react";
import { EditAlgorithmModal } from "./modals/EditAlgorithmModal";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";

interface AlgorithmsListViewProps {
  caseId: Id<"algorithmCases">;
  caseName: string;
  onBack: () => void;
}

export function AlgorithmsListView({
  caseId,
  caseName,
  onBack,
}: AlgorithmsListViewProps) {
  const [editingAlgorithm, setEditingAlgorithm] =
    useState<Id<"algorithms"> | null>(null);
  const [showNewAlgModal, setShowNewAlgModal] = useState(false);

  const algorithms = useQuery(api.admin.getAlgorithmsForCaseAdmin, { caseId });
  const deleteAlgMutation = useMutation(api.admin.deleteAlgorithm);

  const algDelete = useConfirmDelete<{
    _id: Id<"algorithms">;
    notation: string;
  }>(async (alg) => {
    await deleteAlgMutation({ algId: alg._id });
  });

  const currentAlg = editingAlgorithm
    ? algorithms?.find((a) => a._id === editingAlgorithm)
    : null;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-2 sm:gap-3 mb-4">
        <button
          onClick={onBack}
          className="p-2 hover:bg-(--surface-elevated) rounded-lg transition-colors shrink-0"
        >
          <ChevronLeft className="w-5 h-5 text-(--text-muted)" />
        </button>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement truncate">
            {caseName}
          </h2>
          <p className="text-xs sm:text-sm text-(--text-muted) font-inter">
            {algorithms?.length || 0} algorithms
          </p>
        </div>
        <button
          onClick={() => setShowNewAlgModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-inter text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Algorithm</span>
        </button>
      </div>

      {/* Algorithms List */}
      {algorithms === undefined ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="timer-card animate-pulse h-20" />
          ))}
        </div>
      ) : algorithms.length > 0 ? (
        <div className="space-y-3">
          {algorithms.map((alg) => (
            <div
              key={alg._id}
              className="timer-card hover:border-(--border-hover) transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    {alg.isDefault && (
                      <span className="px-2 py-0.5 bg-(--primary)/10 text-(--primary) text-xs rounded-full font-inter">
                        Default
                      </span>
                    )}
                    <span className="text-xs text-(--text-muted) font-inter">
                      {alg.moveCount} moves
                    </span>
                    {alg.usageCount > 0 && (
                      <span className="text-xs text-(--text-muted) font-inter">
                        {alg.usageCount} users
                      </span>
                    )}
                    <span className="text-xs text-(--text-muted) font-inter">
                      Pop: {alg.popularity}%
                    </span>
                  </div>
                  <p className="text-sm text-(--text-primary) font-mono break-all">
                    {alg.notation}
                  </p>
                  {alg.fingerTricks && (
                    <p className="text-xs text-(--text-muted) font-inter mt-1 line-clamp-2">
                      {alg.fingerTricks}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() => setEditingAlgorithm(alg._id)}
                    className="p-2 hover:bg-(--surface-elevated) text-(--text-muted) hover:text-(--primary) rounded-lg transition-colors"
                    title="Edit algorithm"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() =>
                      algDelete.request({
                        _id: alg._id,
                        notation: alg.notation,
                      })
                    }
                    className="p-2 hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 rounded-lg transition-colors"
                    title="Delete algorithm"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="timer-card text-center py-8">
          <FileText className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
          <p className="text-(--text-muted) font-inter">
            No algorithms yet
          </p>
        </div>
      )}

      {/* Modals */}
      {showNewAlgModal && (
        <EditAlgorithmModal
          caseId={caseId}
          onClose={() => setShowNewAlgModal(false)}
          isNew
        />
      )}

      {editingAlgorithm && currentAlg && (
        <EditAlgorithmModal
          algorithm={currentAlg}
          caseId={caseId}
          onClose={() => setEditingAlgorithm(null)}
        />
      )}

      <ConfirmDeleteModal
        isOpen={algDelete.isOpen}
        onClose={algDelete.cancel}
        onConfirm={algDelete.confirm}
        isDeleting={algDelete.isDeleting}
        title="Delete Algorithm?"
        description="Are you sure you want to delete this algorithm?"
        itemName={algDelete.target?.notation}
        warning="This will permanently delete this algorithm. Users who have this as their preferred algorithm will be switched to an alternative."
        confirmLabel="Delete Algorithm"
      />
    </div>
  );
}