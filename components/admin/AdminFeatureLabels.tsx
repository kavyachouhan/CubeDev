"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Save, X } from "lucide-react";
import FeatureBadge, { BadgeVariant } from "@/components/FeatureBadge";

type LabelType = BadgeVariant;

interface LabelFormState {
  featureKey: string;
  labelType: LabelType;
  startAt: string;
  endAt: string;
  enabled: boolean;
}

const LABEL_TYPES: { value: LabelType; label: string }[] = [
  { value: "new", label: "New" },
  { value: "updated", label: "Updated" },
  { value: "beta", label: "Beta" },
  { value: "coming-soon", label: "Soon" },
];

function toLocalInputValue(timestamp: number): string {
  const date = new Date(timestamp);
  const offsetMs = date.getTimezoneOffset() * 60000;
  return new Date(timestamp - offsetMs).toISOString().slice(0, 16);
}

function parseLocalInputValue(value: string): number {
  if (!value) return Number.NaN;
  return new Date(value).getTime();
}

function buildFormState(): LabelFormState {
  const now = Date.now();
  const twoWeeks = 14 * 24 * 60 * 60 * 1000;
  return {
    featureKey: "",
    labelType: "new",
    startAt: toLocalInputValue(now),
    endAt: toLocalInputValue(now + twoWeeks),
    enabled: true,
  };
}

export default function AdminFeatureLabels() {
  const labels = useQuery(api.featureLabels.getAllLabels);
  const createLabel = useMutation(api.featureLabels.createLabel);
  const updateLabel = useMutation(api.featureLabels.updateLabel);
  const deleteLabel = useMutation(api.featureLabels.deleteLabel);

  const [editingId, setEditingId] = useState<Id<"featureLabels"> | null>(null);
  const [formState, setFormState] = useState<LabelFormState>(() =>
    buildFormState(),
  );
  const [isSaving, setIsSaving] = useState(false);

  const sortedLabels = useMemo(() => {
    return [...(labels ?? [])].sort((a, b) => b.startAt - a.startAt);
  }, [labels]);

  const startAtMs = parseLocalInputValue(formState.startAt);
  const endAtMs = parseLocalInputValue(formState.endAt);
  const timeRangeValid = Number.isFinite(startAtMs) && Number.isFinite(endAtMs);
  const canSubmit =
    formState.featureKey.trim().length > 0 &&
    timeRangeValid &&
    endAtMs > startAtMs;

  const resetForm = () => {
    setEditingId(null);
    setFormState(buildFormState());
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canSubmit) return;

    setIsSaving(true);
    try {
      const payload = {
        featureKey: formState.featureKey.trim(),
        labelType: formState.labelType,
        startAt: startAtMs,
        endAt: endAtMs,
        enabled: formState.enabled,
      };

      if (editingId) {
        await updateLabel({ id: editingId, ...payload });
      } else {
        await createLabel(payload);
      }

      resetForm();
    } catch (error) {
      console.error("Failed to save label:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleEdit = (label: (typeof sortedLabels)[number]) => {
    setEditingId(label._id);
    setFormState({
      featureKey: label.featureKey,
      labelType: label.labelType as LabelType,
      startAt: toLocalInputValue(label.startAt),
      endAt: toLocalInputValue(label.endAt),
      enabled: label.enabled,
    });
  };

  const handleToggleEnabled = async (label: (typeof sortedLabels)[number]) => {
    try {
      await updateLabel({
        id: label._id,
        featureKey: label.featureKey,
        labelType: label.labelType as LabelType,
        startAt: label.startAt,
        endAt: label.endAt,
        enabled: !label.enabled,
      });
    } catch (error) {
      console.error("Failed to update label:", error);
    }
  };

  const handleDelete = async (label: (typeof sortedLabels)[number]) => {
    const confirmed = window.confirm(
      `Delete label for ${label.featureKey}? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteLabel({ id: label._id });
      if (editingId === label._id) {
        resetForm();
      }
    } catch (error) {
      console.error("Failed to delete label:", error);
    }
  };

  return (
    <div className="min-h-full p-3 sm:p-4 md:p-6 lg:p-8 space-y-6">

      <form
        onSubmit={handleSubmit}
        className="bg-(--surface-elevated) border border-(--border) rounded-xl p-4 sm:p-5 space-y-4"
      >
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-base sm:text-lg font-semibold text-(--text-primary) font-statement">
              {editingId ? "Update Label" : "Create Label"}
            </h2>
            <p className="text-[11px] sm:text-xs text-(--text-muted) font-inter">
              Use section keys like "algorithm-trainer", "coach", or
              "competitions".
            </p>
          </div>
          <div className="flex items-center gap-2">
            {editingId && (
              <button
                type="button"
                onClick={resetForm}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-(--text-muted) border border-(--border) rounded-lg hover:text-(--text-primary) hover:border-(--primary)/40 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
                Cancel
              </button>
            )}
            <button
              type="submit"
              disabled={!canSubmit || isSaving}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-(--primary) rounded-lg hover:bg-(--primary)/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {editingId ? (
                <Save className="w-3.5 h-3.5" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {editingId ? "Save" : "Create"}
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <label className="flex flex-col gap-1 text-xs font-inter text-(--text-muted)">
            Feature Key
            <input
              value={formState.featureKey}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  featureKey: event.target.value,
                }))
              }
              placeholder="algorithm-trainer"
              className="px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:border-(--primary)"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-inter text-(--text-muted)">
            Label Type
            <select
              value={formState.labelType}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  labelType: event.target.value as LabelType,
                }))
              }
              className="px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:border-(--primary)"
            >
              {LABEL_TYPES.map((type) => (
                <option key={type.value} value={type.value}>
                  {type.label}
                </option>
              ))}
            </select>
          </label>

          <label className="flex flex-col gap-1 text-xs font-inter text-(--text-muted)">
            Start Time
            <input
              type="datetime-local"
              value={formState.startAt}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  startAt: event.target.value,
                }))
              }
              className="px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:border-(--primary)"
            />
          </label>

          <label className="flex flex-col gap-1 text-xs font-inter text-(--text-muted)">
            End Time
            <input
              type="datetime-local"
              value={formState.endAt}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  endAt: event.target.value,
                }))
              }
              className="px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-sm text-(--text-primary) focus:outline-none focus:border-(--primary)"
            />
          </label>
        </div>

        <label className="inline-flex items-center gap-2 text-xs font-inter text-(--text-muted)">
          <input
            type="checkbox"
            checked={formState.enabled}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                enabled: event.target.checked,
              }))
            }
            className="w-4 h-4 accent-(--primary)"
          />
          Enabled
        </label>

        {!canSubmit && formState.featureKey.trim().length > 0 && (
          <p className="text-[11px] text-(--error) font-inter">
            End time must be after the start time.
          </p>
        )}
      </form>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-semibold text-(--text-primary) font-statement">
            Configured Labels
          </h2>
          <span className="text-[11px] text-(--text-muted) font-inter">
            {sortedLabels.length} total
          </span>
        </div>

        {sortedLabels.length === 0 ? (
          <div className="bg-(--surface-elevated) border border-(--border) rounded-xl p-6 text-center text-sm text-(--text-muted) font-inter">
            No labels configured yet.
          </div>
        ) : (
          <div className="space-y-2">
            {sortedLabels.map((label) => {
              const now = Date.now();
              const isActive =
                label.enabled && now >= label.startAt && now <= label.endAt;
              const statusLabel = !label.enabled
                ? "Disabled"
                : now < label.startAt
                  ? "Scheduled"
                  : now > label.endAt
                    ? "Expired"
                    : "Active";
              const statusClass = !label.enabled
                ? "text-(--text-muted)"
                : now < label.startAt
                  ? "text-(--warning)"
                  : now > label.endAt
                    ? "text-(--text-muted)"
                    : "text-(--success)";

              return (
                <div
                  key={label._id}
                  className="bg-(--surface-elevated) border border-(--border) rounded-xl p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FeatureBadge
                        variant={label.labelType as BadgeVariant}
                        className="text-[9px]"
                      />
                      <span className="text-sm font-semibold text-(--text-primary) font-statement">
                        {label.featureKey}
                      </span>
                      <span
                        className={`text-[11px] font-semibold font-inter uppercase tracking-wide ${statusClass}`}
                      >
                        {statusLabel}
                      </span>
                    </div>
                    <div className="text-[11px] text-(--text-muted) font-inter">
                      {new Date(label.startAt).toLocaleString()} -{" "}
                      {new Date(label.endAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleToggleEnabled(label)}
                      className="px-3 py-1.5 text-[11px] font-semibold border border-(--border) rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:border-(--primary)/40 transition-colors"
                    >
                      {label.enabled ? "Disable" : "Enable"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleEdit(label)}
                      className="p-2 text-(--text-muted) hover:text-(--primary) hover:bg-(--surface) rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(label)}
                      className="p-2 text-(--text-muted) hover:text-(--error) hover:bg-(--surface) rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}