"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChevronLeft,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Layers,
} from "lucide-react";
import { EditCaseModal } from "./modals/EditCaseModal";
import { DeleteConfirmModal } from "./modals/DeleteConfirmModal";
import { AlgorithmsListView } from "./AlgorithmsListView";

interface CasesListViewProps {
  setId: Id<"algorithmSets">;
  setName: string;
  onBack: () => void;
}

export function CasesListView({ setId, setName, onBack }: CasesListViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCase, setEditingCase] = useState<Id<"algorithmCases"> | null>(
    null,
  );
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [deleteCase, setDeleteCase] = useState<Id<"algorithmCases"> | null>(
    null,
  );
  const [viewingAlgorithms, setViewingAlgorithms] = useState<{
    caseId: Id<"algorithmCases">;
    caseName: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const cases = useQuery(api.admin.getCasesForSetAdmin, { setId });
  const deleteCaseMutation = useMutation(api.admin.deleteAlgorithmCase);

  const filteredCases = cases?.filter((c) =>
    c.caseName.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleDeleteCase = async () => {
    if (!deleteCase) return;
    setIsDeleting(true);
    try {
      await deleteCaseMutation({ caseId: deleteCase });
      setDeleteCase(null);
    } catch (error) {
      console.error("Failed to delete case:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const currentCase = editingCase
    ? cases?.find((c) => c._id === editingCase)
    : null;

  if (viewingAlgorithms) {
    return (
      <AlgorithmsListView
        caseId={viewingAlgorithms.caseId}
        caseName={viewingAlgorithms.caseName}
        onBack={() => setViewingAlgorithms(null)}
      />
    );
  }

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
            {setName}
          </h2>
          <p className="text-xs sm:text-sm text-(--text-muted) font-inter">
            {cases?.length || 0} cases
          </p>
        </div>
        <button
          onClick={() => setShowNewCaseModal(true)}
          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-inter text-sm shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Case</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
        <input
          type="text"
          placeholder="Search cases..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent font-inter text-sm"
        />
      </div>

      {/* Cases List */}
      {cases === undefined ? (
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="timer-card animate-pulse h-24" />
          ))}
        </div>
      ) : filteredCases && filteredCases.length > 0 ? (
        <div className="space-y-3">
          {filteredCases.map((caseItem) => (
            <div
              key={caseItem._id}
              className="timer-card hover:border-(--border-hover) transition-colors"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <h4 className="font-semibold text-(--text-primary) font-statement">
                      {caseItem.caseName}
                    </h4>
                    <span className="text-xs px-2 py-0.5 bg-(--surface-elevated) text-(--text-muted) rounded-full font-inter">
                      {caseItem.algorithmCount} algs
                    </span>
                    {caseItem.learnerCount > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-(--primary)/10 text-(--primary) rounded-full font-inter">
                        {caseItem.learnerCount} learners
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-(--text-muted) font-inter font-mono truncate">
                    Setup: {caseItem.setupMoves}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-(--text-muted) font-inter">
                    <span>Difficulty: {caseItem.difficulty}/10</span>
                    <span>Frequency: {"*".repeat(caseItem.frequency)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0 self-end sm:self-start">
                  <button
                    onClick={() =>
                      setViewingAlgorithms({
                        caseId: caseItem._id,
                        caseName: caseItem.caseName,
                      })
                    }
                    className="p-2 hover:bg-(--primary)/10 text-(--text-muted) hover:text-(--primary) rounded-lg transition-colors"
                    title="View algorithms"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setEditingCase(caseItem._id)}
                    className="p-2 hover:bg-(--surface-elevated) text-(--text-muted) hover:text-(--primary) rounded-lg transition-colors"
                    title="Edit case"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setDeleteCase(caseItem._id)}
                    className="p-2 hover:bg-red-500/10 text-(--text-muted) hover:text-red-500 rounded-lg transition-colors"
                    title="Delete case"
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
          <Layers className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
          <p className="text-(--text-muted) font-inter">No cases found</p>
        </div>
      )}

      {/* Modals */}
      {showNewCaseModal && (
        <EditCaseModal
          setId={setId}
          onClose={() => setShowNewCaseModal(false)}
          isNew
        />
      )}

      {editingCase && currentCase && (
        <EditCaseModal
          caseItem={currentCase}
          setId={setId}
          onClose={() => setEditingCase(null)}
        />
      )}

      {deleteCase && (
        <DeleteConfirmModal
          title="Delete Case"
          message="This will permanently delete this case and all its algorithms. User progress will also be removed. This action cannot be undone."
          onConfirm={handleDeleteCase}
          onCancel={() => setDeleteCase(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
