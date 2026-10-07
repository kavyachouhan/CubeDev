"use client";

import { useState, useMemo, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  X,
  Clock,
  Target,
  Pencil,
  Trash2,
  Smile,
  Laugh,
  Meh,
  Frown,
  BatteryWarning,
  BookOpen,
  Timer,
  Zap,
  Video,
  Film,
  Image,
  ExternalLink,
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronUp,
  Play,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardIcon } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { StatTile } from "@/components/ui/StatTile";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { IconButton } from "@/components/ui/IconButton";
import { Lightbox } from "@/components/ui/Lightbox";
import { Modal } from "@/components/ui/Modal";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import {
  isVideoFile,
  isVideoUrl,
  extractFileIdFromUrl,
  getFileDownloadUrl,
} from "@/lib/appwrite-storage";

interface JournalEntry {
  _id: Id<"coachJournalEntries">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  entryDate: number;
  solveCount?: number;
  sessionAverage?: number;
  bestSingle?: number;
  practiceMinutes?: number;
  customAverage?: number;
  customSolveCount?: number;
  mood: "great" | "good" | "okay" | "frustrated" | "tired";
  wentWell?: string;
  challenges?: string;
  notes?: string;
  focusAreas?: string[];
  completedTaskIndices?: number[];
  mediaUrls?: string[];
  mediaFileIds?: string[];
  mediaTypes?: string[];
  createdAt: number;
}

interface JournalEntryViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: JournalEntry | null;
  onEdit: (entry: JournalEntry) => void;
  onDeleted: () => void;
}

const moodIcons: Record<string, LucideIcon> = {
  great: Laugh,
  good: Smile,
  okay: Meh,
  frustrated: Frown,
  tired: BatteryWarning,
};

const moodColors: Record<string, string> = {
  great: "text-(--success)",
  good: "text-(--primary)",
  okay: "text-(--warning)",
  frustrated: "text-(--error)",
  tired: "text-(--text-muted)",
};

const moodBgColors: Record<string, string> = {
  great: "bg-(--success)/10",
  good: "bg-(--primary)/10",
  okay: "bg-(--warning)/10",
  frustrated: "bg-(--error)/10",
  tired: "bg-(--surface-elevated)",
};

const moodLabels: Record<string, string> = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  frustrated: "Frustrated",
  tired: "Tired",
};

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

// Media gallery item with error handling for images and video fallback
interface MediaGalleryItemProps {
  url: string;
  fileId?: string;
  isVideo: boolean;
  index: number;
  onClick: () => void;
}

function MediaGalleryItem({
  url,
  fileId,
  isVideo,
  index,
  onClick,
}: MediaGalleryItemProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // For videos, try to show a thumbnail or video preview
  const videoUrl = fileId ? getFileDownloadUrl(fileId) : url;

  return (
    <div
      onClick={onClick}
      className="relative cursor-pointer group rounded-(--radius-control) overflow-hidden border border-(--border) hover:border-(--primary) transition-colors"
    >
      {isVideo ? (
        <div className="aspect-video bg-(--surface) flex items-center justify-center relative">
          {!videoError ? (
            <>
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                onError={() => setVideoError(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-6 h-6 text-(--on-media) ml-1" />
                </div>
              </div>
            </>
          ) : (
            <Film className="w-8 h-8 text-(--text-muted)" />
          )}
        </div>
      ) : imageError ? (
        <div className="aspect-square bg-(--surface) flex items-center justify-center">
          <Image className="w-8 h-8 text-(--text-muted)" />
        </div>
      ) : (
        <img
          src={url}
          alt={`Attachment ${index + 1}`}
          className="w-full aspect-square object-cover"
          onError={() => setImageError(true)}
        />
      )}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
        {!isVideo && <ExternalLink className="w-5 h-5 text-(--on-media)" />}
      </div>
    </div>
  );
}

export default function JournalEntryViewModal({
  isOpen,
  onClose,
  entry,
  onEdit,
  onDeleted,
}: JournalEntryViewModalProps) {
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null,
  );
  const [showTasks, setShowTasks] = useState(true);

  const deleteEntry = useMutation(api.coach.deleteJournalEntry);

  const entryDelete = useConfirmDelete(async () => {
    if (!entry) return;

    const result = await deleteEntry({
      entryId: entry._id,
      userId: entry.userId,
    });

    if (result.mediaFileIds && result.mediaFileIds.length > 0) {
      const { deleteJournalMedia } = await import("@/lib/appwrite-storage");
      for (const fileId of result.mediaFileIds) {
        try {
          await deleteJournalMedia(fileId);
        } catch (error) {
          console.error("Failed to delete media file:", error);
        }
      }
    }

    onDeleted();
    onClose();
  });

  // Reset lightbox when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSelectedMediaIndex(null);
    }
  }, [isOpen]);

  // Calculate day of week for the entry date (0 = Sunday, 6 = Saturday)
  const entryDayOfWeek = useMemo(() => {
    if (!entry) return undefined;
    const date = new Date(entry.entryDate);
    date.setHours(0, 0, 0, 0); // Normalize to start of day
    return date.getDay();
  }, [entry]);

  // Fetch tasks for the entry date
  const tasksForDate = useQuery(
    api.coach.getTasksForDate,
    entry
      ? {
          userId: entry.userId,
          date: entry.entryDate,
          dayOfWeek: entryDayOfWeek,
        }
      : "skip",
  );

  // Get tasks from the fetched data
  const dateTasks = useMemo(() => {
    if (!tasksForDate) return null;
    return {
      dayIndex: tasksForDate.dayIndex,
      planId: tasksForDate.planId,
      plan: {
        focus: tasksForDate.focus,
        isRestDay: tasksForDate.isRestDay,
        activities: tasksForDate.activities,
      },
    };
  }, [tasksForDate]);

  if (!isOpen || !entry) return null;

  const MoodIcon = moodIcons[entry.mood] || Meh;

  // Use custom values if available, otherwise use session values
  const displayAverage = entry.customAverage || entry.sessionAverage;
  const displaySolveCount = entry.customSolveCount || entry.solveCount;

  // Check if there's any session data - use display values
  const hasSessionData =
    displaySolveCount ||
    displayAverage ||
    entry.bestSingle ||
    entry.practiceMinutes;
  // Check if there's any reflection content
  const hasReflection = entry.wentWell || entry.challenges || entry.notes;

  // The lightbox needs a resolved url: videos stream better from the download
  // endpoint, and the type isn't always recorded on older entries.
  const lightboxMedia = (() => {
    if (selectedMediaIndex === null || !entry?.mediaUrls) return null;
    const url = entry.mediaUrls[selectedMediaIndex];
    if (!url) return null;
    const mediaType = entry.mediaTypes?.[selectedMediaIndex];
    const fileId = entry.mediaFileIds?.[selectedMediaIndex];
    const isVideo = mediaType
      ? mediaType.startsWith("video/")
      : isVideoUrl(url) ||
        url.includes("video") ||
        url.endsWith(".mp4") ||
        url.endsWith(".webm");
    return {
      url: isVideo && fileId ? getFileDownloadUrl(fileId) : url,
      isVideo,
      alt: "Journal attachment",
    };
  })();

  return (
    <Modal open onClose={onClose} size="lg" mobile="fullscreen">
      <Modal.Header
        title="Journal entry"
        description={formatDate(entry.entryDate)}
        stackActions
        actions={
          <>
            <IconButton
              onClick={() => onEdit(entry)}
              aria-label="Edit entry"
              icon={<Pencil />}
            />
            <IconButton
              onClick={() => entryDelete.request()}
              aria-label="Delete entry"
              variant="danger"
              icon={<Trash2 />}
            />
          </>
        }
      />
      <Modal.Body>
        <div className="space-y-5">
          {/* Mood Section */}
          <Card variant="nested">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${moodBgColors[entry.mood]}`}
              >
                <MoodIcon className={`w-6 h-6 ${moodColors[entry.mood]}`} />
              </div>
              <div className="min-w-0">
                <span className="type-overline block">Mood</span>
                <p className="type-card-title mt-0.5">
                  {moodLabels[entry.mood]}
                </p>
              </div>
            </div>
          </Card>

          {/* Stats Grid */}
          {hasSessionData && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3">
              {entry.practiceMinutes && (
                <StatTile
                  size="sm"
                  mobileLayout="row"
                  mono={false}
                  icon={<Clock />}
                  label="Practice"
                  value={`${entry.practiceMinutes} min`}
                />
              )}
              {displaySolveCount && (
                <StatTile
                  size="sm"
                  mobileLayout="row"
                  mono={false}
                  icon={<Target />}
                  label="Solves"
                  value={displaySolveCount}
                />
              )}
              {displayAverage && (
                <StatTile
                  size="sm"
                  mobileLayout="row"
                  icon={<Timer />}
                  tone="primary"
                  label={entry.customAverage ? "Avg" : "Avg Time"}
                  value={formatTime(displayAverage)}
                />
              )}
              {entry.bestSingle && (
                <StatTile
                  size="sm"
                  mobileLayout="row"
                  icon={<Zap />}
                  tone="success"
                  label="Best"
                  value={formatTime(entry.bestSingle)}
                />
              )}
            </div>
          )}

          {/* Media Gallery */}
          {entry.mediaUrls && entry.mediaUrls.length > 0 && (
            <div>
              <label className="type-label block mb-2">
                Attachments
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {entry.mediaUrls.map((url, index) => {
                  // Use mediaTypes if available, otherwise fall back to URL pattern detection
                  const mediaType = entry.mediaTypes?.[index];
                  const isVideo = mediaType
                    ? mediaType.startsWith("video/")
                    : isVideoUrl(url) ||
                      url.includes("video") ||
                      url.endsWith(".mp4") ||
                      url.endsWith(".webm");
                  const fileId = entry.mediaFileIds?.[index];
                  return (
                    <MediaGalleryItem
                      key={index}
                      url={url}
                      fileId={fileId}
                      isVideo={isVideo}
                      index={index}
                      onClick={() => setSelectedMediaIndex(index)}
                    />
                  );
                })}
              </div>
            </div>
          )}

          <Lightbox
            media={lightboxMedia}
            onClose={() => setSelectedMediaIndex(null)}
          />

          {/* Focus Areas */}
          {entry.focusAreas && entry.focusAreas.length > 0 && (
            <div>
              <label className="type-label block mb-2">
                Focus Areas
              </label>
              <div className="flex flex-wrap gap-2">
                {entry.focusAreas.map((area) => (
                  <span
                    key={area}
                    className="px-3 py-1.5 text-sm bg-(--primary)/10 text-(--primary) rounded-full font-medium"
                  >
                    {area}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Training Tasks Section */}
          {dateTasks &&
            !dateTasks.plan.isRestDay &&
            dateTasks.plan.activities.length > 0 && (
              <Card variant="nested" padding="none">
                <button
                  type="button"
                  aria-expanded={showTasks}
                  onClick={() => setShowTasks(!showTasks)}
                  className="w-full flex items-center justify-between gap-3 p-4 text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CardIcon className="w-8 h-8 rounded-full [&_svg]:w-4 [&_svg]:h-4">
                      <CheckCircle2 />
                    </CardIcon>
                    <div className="min-w-0">
                      <span className="type-label block">Training Tasks</span>
                      <span className="type-caption">
                        {
                          dateTasks.plan.activities.filter((a) => a.completed)
                            .length
                        }
                        /{dateTasks.plan.activities.length} completed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <ProgressBar
                      size="sm"
                      className="w-16"
                      label="Training tasks completed"
                      max={dateTasks.plan.activities.length}
                      value={
                        dateTasks.plan.activities.filter((a) => a.completed)
                          .length
                      }
                    />
                    {showTasks ? (
                      <ChevronUp aria-hidden className="w-4 h-4 text-(--text-muted)" />
                    ) : (
                      <ChevronDown aria-hidden className="w-4 h-4 text-(--text-muted)" />
                    )}
                  </div>
                </button>

                {showTasks && (
                  <div className="px-4 pb-4 space-y-2">
                    {dateTasks.plan.activities.map(
                      (activity, activityIndex) => {
                        const isCompleted = activity.completed;
                        return (
                          <div
                            key={activityIndex}
                            className={`flex items-start gap-3 p-3 rounded-(--radius-control) transition-colors ${
                              isCompleted
                                ? "bg-(--success)/10"
                                : "bg-(--surface)"
                            }`}
                          >
                            <div
                              className={`mt-0.5 shrink-0 w-5 h-5 rounded-(--radius-badge) border-2 flex items-center justify-center ${
                                isCompleted
                                  ? "bg-(--success) border-(--success) text-(--on-media)"
                                  : "border-(--border)"
                              }`}
                            >
                              {isCompleted && (
                                <CheckCircle2 className="w-3 h-3" />
                              )}
                            </div>

                            <div className="flex-1 min-w-0">
                              <span
                                className={`font-medium text-sm ${
                                  isCompleted
                                    ? "text-(--text-muted) line-through"
                                    : "text-(--text-primary)"
                                }`}
                              >
                                {activity.title}
                              </span>
                              <p className="text-xs text-(--text-muted) mt-0.5">
                                {activity.description}
                              </p>
                              <div className="flex items-center gap-3 mt-1.5 text-xs text-(--text-muted)">
                                <span className="flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {activity.durationMinutes} min
                                </span>
                                {activity.targetSolves && (
                                  <span className="flex items-center gap-1">
                                    <Target className="w-3 h-3" />
                                    {activity.targetSolves} solves
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
                  </div>
                )}
              </Card>
            )}

          {/* Reflection Section */}
          {hasReflection && (
            <div className="space-y-4">
              {entry.wentWell && (
                <div>
                  <label className="type-label block mb-2">
                    What went well
                  </label>
                  <p className="text-sm text-(--text-secondary) bg-(--surface-elevated) p-3 rounded-(--radius-control) border border-(--border)">
                    {entry.wentWell}
                  </p>
                </div>
              )}

              {entry.challenges && (
                <div>
                  <label className="type-label block mb-2">
                    Challenges
                  </label>
                  <p className="text-sm text-(--text-secondary) bg-(--surface-elevated) p-3 rounded-(--radius-control) border border-(--border)">
                    {entry.challenges}
                  </p>
                </div>
              )}

              {entry.notes && (
                <div>
                  <label className="type-label block mb-2">
                    Notes
                  </label>
                  <p className="text-sm text-(--text-secondary) bg-(--surface-elevated) p-3 rounded-(--radius-control) border border-(--border)">
                    {entry.notes}
                  </p>
                </div>
              )}
            </div>
          )}

        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={onClose}>
          Close
        </Button>
        <Button
          onClick={() => onEdit(entry)}
          iconLeft={<Pencil className="w-4 h-4" />}
        >
          Edit entry
        </Button>
      </Modal.Footer>

      <ConfirmDeleteModal
        isOpen={entryDelete.isOpen}
        onClose={entryDelete.cancel}
        onConfirm={entryDelete.confirm}
        isDeleting={entryDelete.isDeleting}
        title="Delete Entry?"
        description="Are you sure you want to delete this journal entry?"
        itemName={entry ? formatDate(entry.entryDate) : undefined}
        warning="The journal entry and any attached media will be permanently deleted."
        confirmLabel="Delete Entry"
      />
    </Modal>
  );
}
