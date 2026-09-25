"use client";

import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Search,
  Filter,
  ChevronRight,
  Plus,
  Check,
  BookOpen,
  Zap,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { SearchInput } from "@/components/ui/Field";
import { SelectMenu } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import { Spinner } from "@/components/ui/Spinner";

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
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [expandedCase, setExpandedCase] = useState<string | null>(null);
  const [pendingAdds, setPendingAdds] = useState<Set<string>>(new Set());
  const [addingId, setAddingId] = useState<string | null>(null);

  // Reset state when modal is opened to ensure a fresh start each time
  useEffect(() => {
    if (isOpen) {
      setSearchQuery("");
      setSelectedSet("all");
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
  return (
    <Modal open={isOpen} onClose={onClose} size="xl" mobile="fullscreen">
      <Modal.Header
        title="Add Predefined Cases"
        description="Browse algorithm sets and add cases to your custom set"
      />
      <Modal.Body className="flex flex-col gap-3">
        {/* Search + Filter */}
        <div className="space-y-3 shrink-0">
          <SearchInput
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Search by case name or algorithm…"
            aria-label="Search cases"
            data-autofocus
          />

          <SelectMenu
            label="Algorithm set"
            value={selectedSet}
            onChange={setSelectedSet}
            searchable={availableSets.length > 8}
            options={[
              { value: "all", label: "All Sets", icon: <Filter /> },
              ...availableSets.map((set) => ({
                value: set.id,
                label: set.name,
                icon: <Filter />,
              })),
            ]}
          />
        </div>

        {/* Stats Bar */}
        <div className="flex items-center gap-4 text-xs text-(--text-muted) shrink-0 font-inter">
          <span className="inline-flex items-center gap-1">
            <BookOpen className="w-3 h-3" />
            {filteredCases.length} total
          </span>
          {addedCount > 0 && (
            <span className="inline-flex items-center gap-1 text-(--success)">
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
        <div className="flex-1 min-h-0">
          {filteredCases.length === 0 ? (
            <EmptyState
              icon={<Search />}
              title="No cases found"
              description={
                searchQuery
                  ? `No results for "${searchQuery}"`
                  : "No cases available in this set"
              }
            />
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
                        <span className="text-xs text-(--success) font-inter">
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
                        className="w-full text-xs text-(--primary) hover:text-(--primary-hover) font-medium text-center py-2 mt-1 hover:bg-(--surface-elevated) rounded-(--radius-control) transition-colors cursor-pointer font-inter"
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

      </Modal.Body>
      <Modal.Footer
        start={
          <p className="type-caption">
            {addedCount} case{addedCount !== 1 ? "s" : ""} in your set
          </p>
        }
      >
        <Button onClick={onClose}>Done</Button>
      </Modal.Footer>
    </Modal>
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
      className={`rounded-(--radius-control) border transition-all ${
        isAdded
          ? "border-(--success)/25 bg-(--success)/5"
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
          <span className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-(--success) bg-(--success)/10 rounded-(--radius-control) shrink-0 font-inter">
            <Check className="w-3.5 h-3.5" />
            Added
          </span>
        ) : (
          <button
            onClick={onAdd}
            disabled={isAdding}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-(--primary) bg-(--primary)/10 hover:bg-(--primary)/20 rounded-(--radius-control) transition-colors shrink-0 disabled:opacity-50 font-inter"
          >
            {isAdding ? <Spinner size="xs" /> : <Plus className="w-3.5 h-3.5" />}
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