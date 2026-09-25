"use client";

import { useState, useRef } from "react";
import { useUser } from "@/components/UserProvider";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import { CustomSetsSkeleton } from "@/components/SkeletonLoaders";
import {
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
import { useRouter } from "next/navigation";
import { Id } from "@/convex/_generated/dataModel";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import { Button } from "@/components/ui/Button";
import { Card, CardIcon } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, SearchInput, Textarea } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Menu } from "@/components/ui/Menu";
import { Modal } from "@/components/ui/Modal";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatTile } from "@/components/ui/StatTile";

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
    user?.convexId ? { userId: user.convexId } : "skip",
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

  const setDelete = useConfirmDelete<{
    _id: Id<"customAlgorithmSets">;
    name: string;
  }>(async (set) => {
    await deleteCustomSet({ setId: set._id });
    setOpenMenuId(null);
  });

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
    const predefined = set.validCaseCount ?? (set.caseIds?.length || 0);
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
      set.description?.toLowerCase().includes(searchQuery.toLowerCase()),
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
        <div className="container-responsive py-4 md:py-8">
          <div className="space-y-4 md:space-y-6">
            <PageHeader
              back={{
                href: "/cube-lab/algorithm-trainer",
                label: "Algorithm Trainer",
              }}
              title="Custom Algorithm Sets"
              description="Build your own algorithm collections for focused practice"
              actions={
                <>
                  <Button
                    variant="secondary"
                    onClick={() => setShowImportModal(true)}
                    iconLeft={<Upload className="w-4 h-4" />}
                  >
                    Import
                  </Button>
                  <Button
                    onClick={() => setShowCreateModal(true)}
                    iconLeft={<Plus className="w-4 h-4" />}
                  >
                    New Set
                  </Button>
                </>
              }
            />

            {/* Stats Summary */}
            {customSets.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <StatTile
                  label="Total sets"
                  mono={false}
                  size="lg"
                  tone="primary"
                  value={customSets.length}
                />
                <StatTile
                  label="Total algorithms"
                  mono={false}
                  size="lg"
                  value={customSets.reduce(
                    (acc: number, s: any) => acc + getTotalAlgorithmCount(s),
                    0,
                  )}
                />
                <StatTile
                  className="col-span-2 sm:col-span-1"
                  label="Custom algorithms"
                  mono={false}
                  size="lg"
                  value={customSets.reduce(
                    (acc: number, s: any) => acc + (s.customAlgorithms?.length || 0),
                    0,
                  )}
                />
              </div>
            )}

            {/* Search */}
            {customSets.length > 0 && (
              <SearchInput
                value={searchQuery}
                onChange={setSearchQuery}
                placeholder="Search your sets…"
                aria-label="Search your sets"
              />
            )}

            {/* Custom Sets List */}
            {customSets.length === 0 ? (
              <Card variant="static">
                <EmptyState
                  size="page"
                  icon={<FolderOpen />}
                  title="No custom sets yet"
                  description="Create a custom set to organize algorithms your way. Add predefined cases or write your own algorithms from scratch."
                  action={
                    <Button
                      onClick={() => setShowCreateModal(true)}
                      iconLeft={<Plus className="w-4 h-4" />}
                    >
                      Create your first set
                    </Button>
                  }
                />
              </Card>
            ) : filteredSets && filteredSets.length === 0 ? (
              <Card variant="static">
                <EmptyState
                  icon={<Search />}
                  title={`No sets match "${searchQuery}"`}
                />
              </Card>
            ) : (
              <div className="grid gap-3">
                {filteredSets?.map((set: any) => {
                  const predefinedCount =
                    set.validCaseCount ?? (set.caseIds?.length || 0);
                  const customCount = set.customAlgorithms?.length || 0;
                  const totalAlgs = predefinedCount + customCount;

                  return (
                    <div
                      key={set._id}
                      onClick={() =>
                        router.push(
                          `/cube-lab/algorithm-trainer/custom/${set._id}`,
                        )
                      }
                      className="timer-card block group cursor-pointer relative"
                    >
                      <div
                        className="absolute top-3 right-3 flex items-center gap-1.5 z-10"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {totalAlgs > 0 && (
                          <Button
                            size="sm"
                            onClick={() =>
                              router.push(
                                `/cube-lab/algorithm-trainer/practice?mode=custom&setId=${set._id}&type=rec`,
                              )
                            }
                            iconLeft={<Play className="w-3.5 h-3.5" />}
                          >
                            <span className="hidden sm:inline">Practice</span>
                          </Button>
                        )}

                        <Menu
                          title={`${set.name} actions`}
                          items={[
                            {
                              label: "Export JSON",
                              icon: <Download />,
                              onSelect: () => handleExportSet(set),
                            },
                            {
                              label: "Delete set",
                              icon: <Trash2 />,
                              tone: "danger",
                              onSelect: () =>
                                setDelete.request({ _id: set._id, name: set.name }),
                            },
                          ]}
                          trigger={(props) => (
                            <IconButton
                              {...props}
                              size="sm"
                              aria-label={`Actions for ${set.name}`}
                              icon={<MoreVertical />}
                            />
                          )}
                        />
                      </div>

                      {/* Set Info */}
                      <div className="pr-24 sm:pr-36">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-base font-bold text-(--text-primary) font-statement truncate">
                            {set.name}
                          </h3>
                          {set.isPublic ? (
                            <Globe className="w-3.5 h-3.5 text-(--success) shrink-0" />
                          ) : (
                            <Lock className="w-3.5 h-3.5 text-(--text-muted) shrink-0" />
                          )}
                        </div>
                        {set.description && (
                          <p className="text-sm text-(--text-muted) mb-2 line-clamp-1">
                            {set.description}
                          </p>
                        )}

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-(--text-muted)">
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
                                  className="inline-block px-2 py-0.5 text-xs font-mono bg-(--surface-elevated) border border-(--border) rounded text-(--text-secondary) truncate max-w-40 sm:max-w-50"
                                >
                                  {alg.notation}
                                </span>
                              ))}
                            {customCount > 3 && (
                              <span className="inline-block px-2 py-0.5 text-xs text-(--text-muted)">
                                +{customCount - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Create Modal */}
            <Modal
              open={showCreateModal}
              onClose={() => setShowCreateModal(false)}
              size="md"
              mobile="sheet"
            >
              <Modal.Header title="Create Custom Set" />
              <Modal.Body className="space-y-4">
                <Field label="Set Name" required>
                  <Input
                    value={newSetName}
                    onChange={(e) => setNewSetName(e.target.value)}
                    placeholder="e.g. My Weak OLLs, Speed PLLs"
                    maxLength={100}
                    data-autofocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newSetName.trim()) {
                        handleCreateSet();
                      }
                    }}
                  />
                </Field>
                <Field label="Description" hint="Optional">
                  <Textarea
                    value={newSetDescription}
                    onChange={(e) => setNewSetDescription(e.target.value)}
                    placeholder="What algorithms will this set contain?"
                    rows={2}
                    maxLength={500}
                  />
                </Field>
              </Modal.Body>
              <Modal.Footer>
                <Button variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateSet} disabled={!newSetName.trim()}>
                  Create Set
                </Button>
              </Modal.Footer>
            </Modal>

            {/* Import Modal */}
            <Modal
              open={showImportModal}
              onClose={() => {
                setShowImportModal(false);
                setImportData("");
                setImportError(null);
              }}
              size="md"
              mobile="sheet"
            >
              <Modal.Header
                title="Import Algorithm Set"
                description="Import an algorithm set exported from CubeDev."
              />
              <Modal.Body className="space-y-4">
                <div
                  className={`border-2 border-dashed rounded-(--radius-panel) p-6 text-center transition-colors cursor-pointer ${
                    isDragOver
                      ? "border-(--primary) bg-(--primary)/5"
                      : "border-(--border) hover:border-(--text-muted)"
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
                    aria-label="Choose an algorithm set file"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) handleFileSelect(file);
                    }}
                  />
                  <CardIcon className="mx-auto w-12 h-12 [&_svg]:w-6 [&_svg]:h-6 mb-2">
                    <File />
                  </CardIcon>
                  <p className="type-label">Drop a JSON file here or click to browse</p>
                  <p className="type-caption mt-1">Supports .json files</p>
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex-1 border-t border-(--border)" />
                  <span className="type-caption">or paste JSON</span>
                  <div className="flex-1 border-t border-(--border)" />
                </div>

                <Field label="Set JSON" hideLabel error={importError || undefined}>
                  <Textarea
                    value={importData}
                    onChange={(e) => processImportData(e.target.value)}
                    placeholder='{"name": "My Set", "caseIds": [...], ...}'
                    rows={4}
                    className="type-time text-sm! resize-none"
                  />
                </Field>
              </Modal.Body>
              <Modal.Footer>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setShowImportModal(false);
                    setImportData("");
                    setImportError(null);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImportSet}
                  disabled={!importData.trim() || !!importError}
                >
                  Import
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </div>
        <ConfirmDeleteModal
          isOpen={setDelete.isOpen}
          onClose={setDelete.cancel}
          onConfirm={setDelete.confirm}
          isDeleting={setDelete.isDeleting}
          title="Delete Set?"
          description="Are you sure you want to delete this custom set?"
          itemName={setDelete.target?.name}
          warning="This set and all of its custom algorithms will be permanently deleted."
          confirmLabel="Delete Set"
        />
      </CubeLabLayout>
    </ProtectedRoute>
  );
}