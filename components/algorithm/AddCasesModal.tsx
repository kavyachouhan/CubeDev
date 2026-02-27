"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
import { Search, Plus, X, Filter, ChevronDown } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

interface AlgorithmCase {
  _id: Id<"algorithmCases">;
  caseName: string;
  setName: string;
  setId: Id<"algorithmSets">;
}

interface AddCasesModalProps {
  isOpen: boolean;
  onClose: () => void;
  allCases: AlgorithmCase[];
  existingCaseIds: Id<"algorithmCases">[];
  onAddCase: (caseId: Id<"algorithmCases">) => void;
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

  // Extract available sets from all cases
  const availableSets = useMemo(() => {
    const setMap = new Map<string, string>();
    allCases.forEach((c) => {
      if (!setMap.has(c.setId)) {
        setMap.set(c.setId, c.setName);
      }
    });
    return Array.from(setMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allCases]);

  // If a custom set is provided, default to that set
  const filteredCases = useMemo(() => {
    return allCases.filter((c) => {
      // Filter out existing cases
      if (existingCaseIds.includes(c._id)) return false;

      // Filter by search query
      const matchesSearch =
        searchQuery === "" ||
        c.caseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.setName.toLowerCase().includes(searchQuery.toLowerCase());

      // Filter by selected set
      const matchesSet = selectedSet === "all" || c.setId === selectedSet;

      return matchesSearch && matchesSet;
    });
  }, [allCases, existingCaseIds, searchQuery, selectedSet]);

  // Group cases by set name for grouped display
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

  // Handle mounting for portal
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
      {/* Modal */}
      <div
        className="relative w-full max-w-2xl max-h-[80vh] bg-[var(--surface)] border border-[var(--border)] rounded-xl shadow-2xl flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-[var(--border)]">
          <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
            Add Cases
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-[var(--text-muted)]" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 sm:p-6 border-b border-[var(--border)] space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search cases..."
              className="w-full pl-10 pr-4 py-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all"
            />
          </div>

          {/* Set Filter Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowSetDropdown(!showSetDropdown)}
              className="w-full flex items-center justify-between p-2.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {selectedSetName}
                </span>
              </div>
              <ChevronDown
                className={`w-4 h-4 text-[var(--text-muted)] transition-transform ${
                  showSetDropdown ? "rotate-180" : ""
                }`}
              />
            </button>

            {showSetDropdown && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-10 max-h-48 overflow-y-auto">
                <button
                  onClick={() => {
                    setSelectedSet("all");
                    setShowSetDropdown(false);
                  }}
                  className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--surface-elevated)] transition-colors ${
                    selectedSet === "all"
                      ? "text-[var(--primary)] bg-[var(--primary)]/10"
                      : "text-[var(--text-primary)]"
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
                    className={`w-full text-left px-4 py-2.5 text-sm hover:bg-[var(--surface-elevated)] transition-colors border-t border-[var(--border)]/50 ${
                      selectedSet === set.id
                        ? "text-[var(--primary)] bg-[var(--primary)]/10"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {set.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Cases List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {filteredCases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--text-muted)]">
                {searchQuery || selectedSet !== "all"
                  ? "No cases match your filters"
                  : "No cases available"}
              </p>
            </div>
          ) : selectedSet === "all" ? (
            // Grouped view when showing all sets
            <div className="space-y-6">
              {Object.entries(groupedCases).map(([setName, cases]) => {
                const isExpanded = expandedGroups.has(setName);
                const displayedCases = isExpanded ? cases : cases.slice(0, 10);
                const hiddenCount = cases.length - 10;

                return (
                  <div key={setName}>
                    <h3 className="text-sm font-semibold text-[var(--text-muted)] uppercase tracking-wider mb-2">
                      {setName}
                    </h3>
                    <div className="space-y-1">
                      {displayedCases.map((c) => (
                        <div
                          key={c._id}
                          className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--surface-elevated)]/80 transition-colors"
                        >
                          <span className="font-medium text-[var(--text-primary)]">
                            {c.caseName}
                          </span>
                          <button
                            onClick={() => onAddCase(c._id)}
                            className="p-2 hover:bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      {cases.length > 10 && (
                        <button
                          onClick={() => {
                            setExpandedGroups((prev) => {
                              const next = new Set(prev);
                              if (next.has(setName)) {
                                next.delete(setName);
                              } else {
                                next.add(setName);
                              }
                              return next;
                            });
                          }}
                          className="w-full text-xs text-[var(--primary)] hover:text-[var(--primary-hover)] font-medium text-center py-2 hover:bg-[var(--surface-elevated)] rounded-lg transition-colors cursor-pointer"
                        >
                          {isExpanded
                            ? "Show less"
                            : `+${hiddenCount} more cases — tap to show all`}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            // Ungrouped view when a specific set is selected
            <div className="space-y-1">
              {filteredCases.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between p-3 bg-[var(--surface-elevated)] rounded-lg hover:bg-[var(--surface-elevated)]/80 transition-colors"
                >
                  <div>
                    <span className="font-medium text-[var(--text-primary)]">
                      {c.caseName}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] ml-2">
                      {c.setName}
                    </span>
                  </div>
                  <button
                    onClick={() => onAddCase(c._id)}
                    className="p-2 hover:bg-[var(--primary)]/10 text-[var(--primary)] rounded-lg transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-4 sm:px-6 py-3 border-t border-[var(--border)] bg-[var(--surface)]">
          <p className="text-sm text-[var(--text-muted)]">
            {filteredCases.length} cases available
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}