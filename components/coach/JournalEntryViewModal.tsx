"use client";

import { useState, useMemo, useEffect } from "react";
import { createPortal } from "react-dom";
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
  AlertTriangle,
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
      className="relative cursor-pointer group rounded-lg overflow-hidden border border-(--border) hover:border-(--primary) transition-colors"
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
                  <Play className="w-6 h-6 text-white ml-1" />
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
        {!isVideo && <ExternalLink className="w-5 h-5 text-white" />}
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
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedMediaIndex, setSelectedMediaIndex] = useState<number | null>(
    null,
  );
  const [showTasks, setShowTasks] = useState(true);

  const deleteEntry = useMutation(api.coach.deleteJournalEntry);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (selectedMediaIndex !== null) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [selectedMediaIndex]);

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

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const result = await deleteEntry({
        entryId: entry._id,
        userId: entry.userId,
      });

      // Delete media files from Appwrite
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
    } catch (error) {
      console.error("Failed to delete entry:", error);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Check if there's any session data - use display values
  const hasSessionData =
    displaySolveCount ||
    displayAverage ||
    entry.bestSingle ||
    entry.practiceMinutes;
  // Check if there's any reflection content
  const hasReflection = entry.wentWell || entry.challenges || entry.notes;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      {/* Modal */}
      <div className="relative timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-(--primary)/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-(--primary)" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-(--text-primary) font-statement">
                Journal Entry
              </h2>
              <p className="text-sm text-(--text-muted)">
                {formatDate(entry.entryDate)}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(entry)}
              className="p-2 rounded-lg hover:bg-(--surface-elevated) text-(--text-muted) hover:text-(--primary) transition-colors"
              aria-label="Edit entry"
              title="Edit Entry"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 rounded-lg hover:bg-(--error)/10 text-(--text-muted) hover:text-(--error) transition-colors"
              aria-label="Delete entry"
              title="Delete Entry"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="text-(--text-muted) hover:text-(--text-primary) transition-colors p-1 rounded-lg hover:bg-(--surface-elevated)"
              aria-label="Close modal"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {/* Mood Section */}
          <div className="p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
            <div className="flex items-center gap-3">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center ${moodBgColors[entry.mood]}`}
              >
                <MoodIcon className={`w-6 h-6 ${moodColors[entry.mood]}`} />
              </div>
              <div>
                <span className="text-xs text-(--text-muted) block">Mood</span>
                <p className="text-lg font-semibold text-(--text-primary)">
                  {moodLabels[entry.mood]}
                </p>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          {hasSessionData && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {entry.practiceMinutes && (
                <div className="p-2 sm:p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                    <span className="text-[10px] sm:text-xs text-(--text-muted)">
                      Practice
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-(--text-primary)">
                    {entry.practiceMinutes} min
                  </p>
                </div>
              )}
              {displaySolveCount && (
                <div className="p-2 sm:p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Target className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                    <span className="text-[10px] sm:text-xs text-(--text-muted)">
                      {entry.customSolveCount ? "Solves" : "Solves"}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-(--text-primary)">
                    {displaySolveCount}
                  </p>
                </div>
              )}
              {displayAverage && (
                <div className="p-2 sm:p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Timer className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                    <span className="text-[10px] sm:text-xs text-(--text-muted) truncate">
                      {entry.customAverage ? "Avg" : "Avg Time"}
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-(--primary)">
                    {formatTime(displayAverage)}
                  </p>
                </div>
              )}
              {entry.bestSingle && (
                <div className="p-2 sm:p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <div className="flex items-center gap-1.5 mb-1">
                    <Zap className="w-3 h-3 sm:w-4 sm:h-4 text-(--success)" />
                    <span className="text-[10px] sm:text-xs text-(--text-muted)">
                      Best
                    </span>
                  </div>
                  <p className="text-sm sm:text-base font-bold text-(--success)">
                    {formatTime(entry.bestSingle)}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Media Gallery */}
          {entry.mediaUrls && entry.mediaUrls.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
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

          {/* Media Lightbox - Rendered via portal to ensure full-screen coverage */}
          {selectedMediaIndex !== null &&
            entry.mediaUrls &&
            typeof document !== "undefined" &&
            createPortal(
              <div
                className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
                style={{
                  position: "fixed",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                }}
                onClick={() => setSelectedMediaIndex(null)}
              >
                <button
                  className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
                  onClick={() => setSelectedMediaIndex(null)}
                >
                  <X className="w-8 h-8" />
                </button>
                {(() => {
                  const url = entry.mediaUrls[selectedMediaIndex];
                  const mediaType = entry.mediaTypes?.[selectedMediaIndex];
                  const fileId = entry.mediaFileIds?.[selectedMediaIndex];
                  const isVideo = mediaType
                    ? mediaType.startsWith("video/")
                    : isVideoUrl(url) ||
                      url.includes("video") ||
                      url.endsWith(".mp4") ||
                      url.endsWith(".webm");

                  if (isVideo) {
                    // Use download URL for better video streaming compatibility
                    const videoUrl = fileId ? getFileDownloadUrl(fileId) : url;
                    return (
                      <video
                        src={videoUrl}
                        controls
                        autoPlay
                        className="max-w-full max-h-[90vh] rounded-lg"
                        onClick={(e) => e.stopPropagation()}
                      />
                    );
                  }
                  return (
                    <img
                      src={url}
                      alt="Full size"
                      className="max-w-full max-h-[90vh] object-contain rounded-lg"
                      onClick={(e) => e.stopPropagation()}
                    />
                  );
                })()}
              </div>,
              document.body,
            )}

          {/* Focus Areas */}
          {entry.focusAreas && entry.focusAreas.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
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
              <div className="bg-(--surface-elevated) rounded-lg border border-(--border) overflow-hidden">
                <button
                  onClick={() => setShowTasks(!showTasks)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-(--primary)/10 flex items-center justify-center">
                      <CheckCircle2 className="w-4 h-4 text-(--primary)" />
                    </div>
                    <div>
                      <span className="font-medium text-(--text-primary) block text-sm">
                        Training Tasks
                      </span>
                      <span className="text-xs text-(--text-muted)">
                        {
                          dateTasks.plan.activities.filter((a) => a.completed)
                            .length
                        }
                        /{dateTasks.plan.activities.length} completed
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-(--surface) rounded-full overflow-hidden">
                      <div
                        className="h-full bg-(--primary) transition-all"
                        style={{
                          width: `${
                            dateTasks.plan.activities.length > 0
                              ? (dateTasks.plan.activities.filter(
                                  (a) => a.completed,
                                ).length /
                                  dateTasks.plan.activities.length) *
                                100
                              : 0
                          }%`,
                        }}
                      />
                    </div>
                    {showTasks ? (
                      <ChevronUp className="w-4 h-4 text-(--text-muted)" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-(--text-muted)" />
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
                            className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                              isCompleted
                                ? "bg-(--success)/10"
                                : "bg-(--surface)"
                            }`}
                          >
                            <div
                              className={`mt-0.5 shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center ${
                                isCompleted
                                  ? "bg-(--success) border-(--success) text-white"
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
              </div>
            )}

          {/* Reflection Section */}
          {hasReflection && (
            <div className="space-y-4">
              {entry.wentWell && (
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    What went well
                  </label>
                  <p className="text-sm text-(--text-secondary) bg-(--surface-elevated) p-3 rounded-lg border border-(--border)">
                    {entry.wentWell}
                  </p>
                </div>
              )}

              {entry.challenges && (
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Challenges
                  </label>
                  <p className="text-sm text-(--text-secondary) bg-(--surface-elevated) p-3 rounded-lg border border-(--border)">
                    {entry.challenges}
                  </p>
                </div>
              )}

              {entry.notes && (
                <div>
                  <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
                    Notes
                  </label>
                  <p className="text-sm text-(--text-secondary) bg-(--surface-elevated) p-3 rounded-lg border border-(--border)">
                    {entry.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-2 border-t border-(--border)">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 bg-transparent border border-(--border) text-(--text-primary) font-semibold rounded-lg hover:border-(--primary) hover:bg-(--primary) hover:text-white transition-all order-2 sm:order-1"
            >
              Close
            </button>
            <button
              onClick={() => onEdit(entry)}
              className="w-full sm:flex-1 px-4 py-3 bg-(--primary) text-white font-semibold rounded-lg hover:bg-(--primary-hover) transition-all flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              <Pencil className="w-4 h-4" />
              <span>Edit Entry</span>
            </button>
          </div>
        </div>

        {/* Delete Confirmation */}
        {showDeleteConfirm && (
          <div className="absolute inset-0 bg-(--surface)/95 backdrop-blur-sm flex items-center justify-center p-4 rounded-xl">
            <div className="text-center max-w-sm">
              <div className="w-12 h-12 rounded-full bg-(--error)/10 flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-(--error)" />
              </div>
              <h3 className="font-semibold text-(--text-primary) mb-2 font-statement">
                Delete Entry?
              </h3>
              <p className="text-sm text-(--text-muted) mb-6">
                This action cannot be undone. The journal entry will be
                permanently deleted.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2.5 border border-(--border) rounded-lg text-(--text-secondary) hover:bg-(--surface-elevated) transition-colors font-medium"
                  disabled={isDeleting}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-4 py-2.5 bg-(--error) text-white rounded-lg hover:bg-(--error)/90 transition-colors disabled:opacity-50 font-medium"
                >
                  {isDeleting ? "Deleting..." : "Delete Entry"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
