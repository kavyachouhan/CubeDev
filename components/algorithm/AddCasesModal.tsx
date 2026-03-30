"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import {
  Search,
  X,
  Filter,
  ChevronDown,
  ChevronRight,
  Plus,
  Check,
  BookOpen,
  Zap,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface AlgorithmCase {
  _id: Id<"algorithmCases">;
  caseName: string;
  setName: string;
  setId: Id<"algorithmSets">;
  defaultAlgorithm?: string;
  algorithmCount?: number;
  difficulty?: number;
}

interface AddCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCases: AlgorithmCase[];
  existingCaseIds: Id<"algorithmCases">[];
  onAddCase: (caseId: Id<"algorithmCases">) => void;
  onRemoveCase?: (caseId: Id<"algorithmCases">) => void;
  customSetId?: string;
}

export default function AddCasesModal({
  isOpen,
  onClose,
  allCases,
  existingCaseIds,
  onAddCase,
  customSetId,
}: AddCasesModalProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSet, setSelectedSet] = useState<string>("all");
  const [showSetDropdown, setShowSetDropdown] = useState(false);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  // Reset state when modal is opened to ensure a fresh start each time
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedSet("all");
      setShowSetDropdown(false);
      setExpandedGroups(new Set());
      setExpandedCase(null);
      setPendingAdds(new Set());
      setAddingId(null);
    }
  }, [isOpen]);

  // Extract available sets
  const availableSets = useMemo(() => {
    const setMap = new Map<string, string>();
    allCases.forEach((c) => {
      if (!setMap.has(c.setId)) {
        setMap.set(c.setId, c.setName);
      }
    });
    return Array.from(setMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allCases]);

  // Filter cases
  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      const matchesSearch =
        searchQuery === "" ||
        c.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.setName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.defaultAlgorithm || "")
          .toLowerCase()
          .includes(searchQuery.toLowerCase());

      const matchesSet = selectedSet === "all" || c.setId === selectedSet;

      return matchesSearch && matchesSet;
    });
  }, [allCases, searchQuery, selectedSet]);

  // Group cases by set for grouped display when "All Sets" is selected
  const groupedCases = useMemo(() => {
    const groups: Record<string, AlgorithmCase[]> = {};
    filteredCases.forEach((c) => {
      if (!groups[c.setName]) {
        groups[c.setName] = [];
      }
      groups[c.setName].push(c);
    });
    return groups;
  }, [filteredCases]);

  const selectedSetName =
    selectedSet === "all"
      ? "All Sets"
      : availableSets.find((s) => s.id === selectedSet)?.name || "All Sets";

  const isCaseAdded = useCallback(
    (caseId: Id<"algorithmCases">) => {
      return (
        existingCaseIds.includes(caseId) || pendingAdds.has(caseId as string)
      );
    },
    [existingCaseIds, pendingAdds],
  );

  const handleAddCase = async (caseId: Id<"algorithmCases">) => {
    setAddingId(caseId as string);
    try {
      await onAddCase(caseId);
      setPendingAdds((prev) => new Set([...prev, caseId as string]));
    } catch (error) {
      console.error("Failed to add case:", error);
    } finally {
      setAddingId(null);
    }
  };

  const toggleGroup = (setName: string) => {
    setExpandedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(setName)) {
        next.delete(setName);
      } else {
        next.add(setName);
      }
      return next;
    });
  };

  // Calculate counts for stats bar
  const addedCount = filteredCases.filter((c) => isCaseAdded(c._id)).length;
  const availableCount = filteredCases.length - addedCount;

  // Delay mounting of the modal content until after the first render to avoid hydration issues with server-side rendering. This ensures that the portal is only created on the client side and prevents mismatches between server-rendered and client-rendered content.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="timer-card max-w-2xl w-full max-h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 shrink-0">
          <div>
            <h2 className="text-xl font-bold text-(--text-primary) font-statement">
              Add Predefined Cases
            </h2>
            <p className="text-xs text-(--text-muted) mt-1 font-inter">
              Browse algorithm sets and add cases to your custom set
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="space-y-3 mb-4 shrink-0">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by case name or algorithm..."
              className="w-full pl-10 pr-4 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent text-sm transition-all font-inter"
              autoFocus
            />
          </div>

          {/* Set Filter */}
          <div className="relative">
            <button
              onClick={() => setShowSetDropdown(!showSetDropdown)}
              className="w-full flex items-center justify-between px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg hover:border-(--primary)/50 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-(--primary)" />
                <span className="text-sm font-medium text-(--text-primary) font-inter">
                  {selectedSetName}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-(--text-muted) transition-transform ${
                  showSetDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSetDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedSet("all");
                    setShowSetDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-(--surface-elevated) transition-colors font-inter ${
                    selectedSet === "all"
                      ? "text-(--primary) font-medium"
                      : "text-(--text-primary)"
                  }`}
                >
                  All Sets
                </button>
                {availableSets.map((set) => (
                  <button
                    key={set.id}
                    onClick={() => {
                      setSelectedSet(set.id);
                      setShowSetDropdown(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-(--surface-elevated) transition-colors border-t border-(--border)/50 font-inter ${
                      selectedSet === set.id
                        ? "text-(--primary) font-medium"
                        : "text-(--text-primary)"
                    }`}
                  >
                    {set.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-xs text-(--text-muted) mb-3 shrink-0 font-inter">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {filteredCases.length} total
          </span>
          {addedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-green-500">
              <Check className="w-3 h-3" />
              {addedCount} added
            </span>
          )}
          {availableCount > 0 && (
            <span className="inline-flex items-center gap-1">
              <Plus className="w-3 h-3" />
              {availableCount} available
            </span>
          )}
        </div>

        {/* Cases List */}
        <div className="flex-1 overflow-y-auto -mx-4 sm:-mx-6 px-4 sm:px-6 min-h-0">
          {filteredCases.length === 0 ? (
            <div className="text-center py-12">
              <Search className="w-8 h-8 text-(--text-muted) mx-auto mb-3" />
              <p className="text-sm font-medium text-(--text-primary) font-inter">
                No cases found
              </p>
              <p className="text-xs text-(--text-muted) mt-1 font-inter">
                {searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No cases available in this set"}
              </p>
            </div>
          ) : selectedSet !== "all" ? (
            /* Flat list when a set is selected */
            <div className="space-y-2 pb-4">
              {filteredCases.map((c) => (
                <CaseItem
                  key={c._id}
                  caseData={c}
                  isAdded={isCaseAdded(c._id)}
                  isExpanded={expandedCase === (c._id as string)}
                  isAdding={addingId === (c._id as string)}
                  onToggleExpand={() =>
                    setExpandedCase(
                      expandedCase === (c._id as string)
                        ? null
                        : (c._id as string),
                    )
                  }
                  onAdd={() => handleAddCase(c._id)}
                />
              ))}
            </div>
          ) : (
            /* Grouped view */
            <div className="space-y-4 pb-4">
              {Object.entries(groupedCases).map(([setName, cases]) => {
                const isExpanded = expandedGroups.has(setName);
                const addedInGroup = cases.filter((c) =>
                  isCaseAdded(c._id),
                ).length;
                const displayCases = isExpanded ? cases : cases.slice(0, 5);

                return (
                  <div key={setName}>
                    {/* Group header */}
                    <button
                      onClick={() => toggleGroup(setName)}
                      className="w-full flex items-center justify-between py-2 mb-1.5 group"
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight
                          className={`w-4 h-4 text-(--text-muted) transition-transform ${
                            isExpanded ? "rotate-90" : ""
                          }`}
                        />
                        <h3 className="text-sm font-semibold text-(--text-secondary) uppercase tracking-wider font-inter">
                          {setName}
                        </h3>
                        <span className="text-xs text-(--text-muted) font-inter">
                          ({cases.length})
                        </span>
                      </div>
                      {addedInGroup > 0 && (
                        <span className="text-xs text-green-500 font-inter">
                          {addedInGroup} added
                        </span>
                      )}
                    </button>

                    {/* Cases in group */}
                    <div className="space-y-2">
                      {displayCases.map((c) => (
                        <CaseItem
                          key={c._id}
                          caseData={c}
                          isAdded={isCaseAdded(c._id)}
                          isExpanded={expandedCase === (c._id as string)}
                          isAdding={addingId === (c._id as string)}
                          onToggleExpand={() =>
                            setExpandedCase(
                              expandedCase === (c._id as string)
                                ? null
                                : (c._id as string),
                            )
                          }
                          onAdd={() => handleAddCase(c._id)}
                        />
                      ))}
                    </div>

                    {/* Show more / less */}
                    {cases.length > 5 && !isExpanded && (
                      <button
                        onClick={() => toggleGroup(setName)}
                        className="w-full text-xs text-(--primary) hover:text-(--primary-hover) font-medium text-center py-2 mt-1 hover:bg-(--surface-elevated) rounded-lg transition-colors cursor-pointer font-inter"
                      >
                        Show all {cases.length} cases
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 mt-2 border-t border-(--border) shrink-0">
          <p className="text-xs text-(--text-muted) font-inter">
            {addedCount} case{addedCount !== 1 ? "s" : ""} in your set
          </p>
          <button onClick={onClose} className="btn-primary text-sm px-6">
            Done
          </button>
        </div>
      </div>
    </div>,
    document.body,
  );
}


// Case list item component with expandable details and add button
interface CaseItemProps {
  caseData: AlgorithmCase;
  isAdded: boolean;
  isExpanded: boolean;
  isAdding: boolean;
  onToggleExpand: () => void;
  onAdd: () => void;
}

function CaseItem({
  caseData,
  isAdded,
  isExpanded,
  isAdding,
  onToggleExpand,
  onAdd,
}: CaseItemProps) {
  return (
    <div
      className={`rounded-lg border transition-all ${
        isAdded
          ? "border-green-500/30 bg-green-500/5"
          : "border-(--border) bg-(--surface-elevated)"
      }`}
    >
      {/* Main row */}
      <div className="flex items-center gap-3 p-3">
        {/* Expand button + case info */}
        <button
          onClick={onToggleExpand}
          className="flex-1 min-w-0 flex items-start gap-2.5 text-left"
        >
          <ChevronRight
            className={`w-4 h-4 text-(--text-muted) shrink-0 mt-0.5 transition-transform ${
              isExpanded ? "rotate-90" : ""
            }`}
          />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-medium text-(--text-primary) font-inter">
                {caseData.caseName}
              </span>
              <span className="text-xs px-1.5 py-0.5 bg-(--surface) border border-(--border) rounded text-(--text-muted) font-inter">
                {caseData.setName}
              </span>
            </div>
            {/* Algorithm preview */}
            {caseData.defaultAlgorithm && (
              <p className="font-mono text-xs text-(--text-muted) mt-1 truncate">
                {caseData.defaultAlgorithm}
              </p>
            )}
          </div>
        </button>

        {/* Add / Added button */}
        {isAdded ? (
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-green-500 bg-green-500/10 rounded-lg shrink-0 font-inter">
            <Check className="w-3.5 h-3.5" />
            Added
          </span>
        ) : (
          <button
            onClick={onAdd}
            disabled={isAdding}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-(--primary) bg-(--primary)/10 hover:bg-(--primary)/20 rounded-lg transition-colors shrink-0 disabled:opacity-50 font-inter"
          >
            {isAdding ? (
              <span className="w-3.5 h-3.5 border-2 border-(--primary)/30 border-t-(--primary) rounded-full animate-spin" />
            ) : (
              <Plus className="w-3.5 h-3.5" />
            )}
            Add
          </button>
        )}
      </div>

      {/* Expanded details */}
      {isExpanded && (
        <div className="px-3 pb-3 pt-0 border-t border-(--border)/50">
          <div className="pl-6 space-y-2 pt-2.5">
            {/* Algorithm notation */}
            {caseData.defaultAlgorithm && (
              <div>
                <p className="text-xs font-medium text-(--text-muted) mb-1 font-inter">
                  Default Algorithm
                </p>
                <div className="font-mono text-xs text-(--text-secondary) bg-(--surface) px-2.5 py-1.5 rounded border border-(--border) inline-block max-w-full overflow-x-auto whitespace-nowrap">
                  {caseData.defaultAlgorithm}
                </div>
              </div>
            )}

            {/* Info row */}
            <div className="flex flex-wrap items-center gap-3">
              {caseData.algorithmCount != null &&
                caseData.algorithmCount > 0 && (
                  <span className="inline-flex items-center gap-1 text-xs text-(--text-muted) font-inter">
                    <Zap className="w-3 h-3" />
                    {caseData.algorithmCount} algorithm
                    {caseData.algorithmCount !== 1 ? "s" : ""}
                  </span>
                )}
              {caseData.difficulty != null && caseData.difficulty > 0 && (
                <span className="text-xs text-(--text-muted) font-inter">
                  Difficulty: {caseData.difficulty}/10
                </span>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}