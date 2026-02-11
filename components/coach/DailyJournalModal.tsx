"use client";

import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import {
  X,
  BookOpen,
  Clock,
  CheckCircle2,
  Laugh,
  FolderOpen,
  Check,
  Smile,
  Meh,
  Frown,
  BatteryWarning,
  ChevronDown,
  ChevronUp,
  Image,
  Trash2,
  Upload,
  AlertCircle,
  Film,
  Loader2,
  Play,
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  uploadJournalMedia,
  deleteJournalMedia,
  isImageFile,
  isVideoFile,
  validateFileSize,
  ACCEPTED_MEDIA_TYPES,
  getFileDownloadUrl,
} from "@/lib/appwrite-storage";

interface Activity {
  type: string;
  title: string;
  description: string;
  durationMinutes: number;
  targetSolves?: number;
  completed: boolean;
  completedAt?: number;
}

interface DailyPlan {
  dayOfWeek: number;
  date: number;
  focus: string;
  activities: Activity[];
  isCompleted: boolean;
  isRestDay: boolean;
}

interface TrainingPlan {
  _id: Id<"coachTrainingPlans">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  weekNumber: number;
  weekStartDate: number;
  weekEndDate: number;
  status: "active" | "completed" | "skipped";
  dailyPlans: DailyPlan[];
  completedDays: number;
  totalDays: number;
}

interface DailyJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  planId?: Id<"coachTrainingPlans">;
  activePlan?: TrainingPlan | null;
  date?: number;
  editingEntryId?: Id<"coachJournalEntries">; // Only set when editing an existing entry
  onSave?: () => void;
}

type Mood = "great" | "good" | "okay" | "frustrated" | "tired";

const MOODS: { id: Mood; label: string; icon: React.ElementType }[] = [
  { id: "great", label: "Great", icon: Laugh },
  { id: "good", label: "Good", icon: Smile },
  { id: "okay", label: "Okay", icon: Meh },
  { id: "frustrated", label: "Frustrated", icon: Frown },
  { id: "tired", label: "Tired", icon: BatteryWarning },
];

const FOCUS_AREAS = [
  { id: "cross", label: "Cross" },
  { id: "f2l", label: "F2L" },
  { id: "oll", label: "OLL" },
  { id: "pll", label: "PLL" },
  { id: "lookahead", label: "Lookahead" },
  { id: "fingertricks", label: "Fingertricks" },
  { id: "recognition", label: "Recognition" },
  { id: "inspection", label: "Inspection" },
];

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
interface MediaPreviewItemProps {
  url: string;
  fileId?: string;
  isVideo: boolean;
  onRemove: () => void;
  onPreview: () => void;
}

function MediaPreviewItem({
  url,
  fileId,
  isVideo,
  onRemove,
  onPreview,
}: MediaPreviewItemProps) {
  const [imageError, setImageError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  // For videos, we use the fileId to get the download URL to ensure proper streaming. For images, we can use the URL directly.
  const videoUrl = fileId ? getFileDownloadUrl(fileId) : url;

  return (
    <div className="relative group">
      {isVideo ? (
        <div
          className="aspect-video bg-[var(--surface)] rounded-lg flex items-center justify-center border border-[var(--border)] relative overflow-hidden cursor-pointer"
          onClick={onPreview}
        >
          {!videoError ? (
            <>
              <video
                src={videoUrl}
                className="w-full h-full object-cover"
                muted
                preload="metadata"
                onError={() => setVideoError(true)}
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            </>
          ) : (
            <Film className="w-8 h-8 text-[var(--text-muted)]" />
          )}
        </div>
      ) : imageError ? (
        <div
          className="aspect-square bg-[var(--surface)] rounded-lg flex items-center justify-center border border-[var(--border)] cursor-pointer"
          onClick={onPreview}
        >
          <Image className="w-8 h-8 text-[var(--text-muted)]" />
        </div>
      ) : (
        <img
          src={url}
          alt="Media attachment"
          className="w-full aspect-square object-cover rounded-lg border border-[var(--border)] cursor-pointer"
          onClick={onPreview}
          onError={() => setImageError(true)}
        />
      )}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1.5 bg-[var(--error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove media"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

// Uploading media item with progress indicator
interface UploadingMediaItemProps {
  media: {
    id: string;
    file: File;
    previewUrl: string;
    progress: "uploading" | "completed" | "error";
    errorMessage?: string;
    fileId?: string;
    url?: string;
  };
  onRemove: () => void;
  onRetry: () => void;
  onPreview: () => void;
}

function UploadingMediaItem({
  media,
  onRemove,
  onRetry,
  onPreview,
}: UploadingMediaItemProps) {
  const [videoError, setVideoError] = useState(false);
  const isVideo = media.file.type.startsWith("video/");

  const handleClick = () => {
    if (media.progress === "completed") {
      onPreview();
    }
  };

  return (
    <div className="relative group">
      {isVideo ? (
        videoError ? (
          <div className="aspect-video bg-[var(--surface)] rounded-lg flex items-center justify-center border border-[var(--border)]">
            <Film className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
        ) : (
          <div
            className={`relative aspect-video rounded-lg overflow-hidden border border-[var(--border)] ${media.progress === "completed" ? "cursor-pointer" : ""}`}
            onClick={handleClick}
          >
            <video
              src={media.previewUrl}
              className="w-full h-full object-cover"
              muted
              preload="metadata"
              onError={() => setVideoError(true)}
            />
            {/* Play button overlay for completed videos */}
            {media.progress === "completed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors">
                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Play className="w-5 h-5 text-white ml-0.5" />
                </div>
              </div>
            )}
          </div>
        )
      ) : (
        <img
          src={media.previewUrl}
          alt="New media"
          className={`w-full aspect-square object-cover rounded-lg border border-[var(--border)] ${media.progress === "completed" ? "cursor-pointer" : ""}`}
          onClick={handleClick}
        />
      )}

      {/* Upload progress overlay */}
      {media.progress === "uploading" && (
        <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-white animate-spin" />
            <span className="text-xs text-white font-medium">Uploading...</span>
          </div>
        </div>
      )}

      {/* Error overlay */}
      {media.progress === "error" && (
        <div className="absolute inset-0 bg-[var(--error)]/80 rounded-lg flex items-center justify-center">
          <div className="flex flex-col items-center gap-2 p-2 text-center">
            <AlertCircle className="w-5 h-5 text-white" />
            <span className="text-xs text-white font-medium">Failed</span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onRetry();
              }}
              className="text-xs text-white underline hover:no-underline"
            >
              Retry
            </button>
          </div>
        </div>
      )}

      {/* Completed badge */}
      {media.progress === "completed" && (
        <div className="absolute bottom-1 left-1 px-1.5 py-0.5 bg-[var(--success)] text-white text-[10px] rounded flex items-center gap-1">
          <Check className="w-2.5 h-2.5" />
          <span>Uploaded</span>
        </div>
      )}

      {/* Remove button */}
      <button
        onClick={onRemove}
        className="absolute top-1 right-1 p-1.5 bg-[var(--error)] text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Remove media"
      >
        <Trash2 className="w-3 h-3" />
      </button>
    </div>
  );
}

function isSameDay(timestamp1: number, timestamp2: number): boolean {
  const date1 = new Date(timestamp1);
  const date2 = new Date(timestamp2);
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

export default function DailyJournalModal({
  isOpen,
  onClose,
  userId,
  profileId,
  planId,
  activePlan,
  date: dateProp,
  editingEntryId,
  onSave,
}: DailyJournalModalProps) {
  // Compute a stable date at the start of the day in local timezone, along with the local day of week. This ensures that all date-based logic is consistent and timezone-aware.
  const { stableDate, dayOfWeek } = useMemo(() => {
    const timestamp = dateProp ?? Date.now();
    const date = new Date(timestamp);
    // Set to start of the day in local timezone for consistent date-based queries and comparisons
    date.setHours(0, 0, 0, 0);
    return {
      stableDate: date.getTime(),
      dayOfWeek: date.getDay(), // 0 (Sunday) to 6 (Saturday), local day of week for accurate matching with training plan tasks
    };
  }, [dateProp]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const didSaveRef = useRef(false); // Track if the entry was saved to prevent cleanup of uploaded media on unmount
  const uploadingMediaRef = useRef<
    Array<{
      id: string;
      file: File;
      previewUrl: string;
      progress: "uploading" | "completed" | "error";
      fileId?: string;
      url?: string;
      mediaType: string;
      errorMessage?: string;
    }>
  >([]); // Keep ref in sync with uploadingMedia state for cleanup on unmount

  const [mood, setMood] = useState<Mood>("good");
  const [wentWell, setWentWell] = useState("");
  const [challenges, setChallenges] = useState("");
  const [notes, setNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] =
    useState<Id<"sessions"> | null>(null);
  const [practiceMinutes, setPracticeMinutes] = useState<number>(30);
  const [customAverage, setCustomAverage] = useState<string>("");
  const [useSessionAverage, setUseSessionAverage] = useState(true);
  const [customSolveCount, setCustomSolveCount] = useState<string>("");
  const [useSessionSolveCount, setUseSessionSolveCount] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [showTasks, setShowTasks] = useState(true);

  // State for media uploads
  interface UploadingMedia {
    id: string;
    file: File;
    previewUrl: string;
    progress: "uploading" | "completed" | "error";
    fileId?: string;
    url?: string;
    mediaType: string; // MIME type of the file
    errorMessage?: string;
  }
  const [uploadingMedia, setUploadingMedia] = useState<UploadingMedia[]>([]);
  const [existingMediaUrls, setExistingMediaUrls] = useState<string[]>([]);
  const [existingMediaFileIds, setExistingMediaFileIds] = useState<string[]>(
    [],
  );
  const [existingMediaTypes, setExistingMediaTypes] = useState<string[]>([]);
  const [mediaToDelete, setMediaToDelete] = useState<string[]>([]);
  const [urlsToRemove, setUrlsToRemove] = useState<string[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Media preview lightbox state
  interface PreviewMedia {
    url: string;
    isVideo: boolean;
    fileId?: string;
  }
  const [previewMedia, setPreviewMedia] = useState<PreviewMedia | null>(null);

  // Check if any uploads are in progress
  const isUploading = uploadingMedia.some((m) => m.progress === "uploading");
  const hasUploadErrors = uploadingMedia.some((m) => m.progress === "error");

  const sessions = useQuery(api.coach.getUserSessionsWith3x3Stats, { userId });
  const sessionStats = useQuery(
    api.coach.getSessionStats,
    selectedSessionId ? { sessionId: selectedSessionId, event: "333" } : "skip",
  );
  // Only fetch existing entry when editing an existing entry. This avoids unnecessary data fetching and state updates when creating a new entry.
  const existingEntry = useQuery(
    api.coach.getJournalEntryById,
    editingEntryId ? { entryId: editingEntryId } : "skip",
  );
  const tasksForDate = useQuery(api.coach.getTasksForDate, {
    userId,
    date: stableDate,
    dayOfWeek, // Send local day of week for accurate timezone-aware matching
  });
  const saveEntry = useMutation(api.coach.saveJournalEntry);
  const updateActivity = useMutation(api.coach.updateActivityCompletion);

  // Filter sessions to only show sessions with 3x3 solves
  const filteredSessions = useMemo(() => {
    return sessions?.filter((session) => session.solveCount3x3 > 0) || [];
  }, [sessions]);

  // Get tasks from the fetched data (works for any date)
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

  // Load existing entry data ONLY when editing an existing entry
  useEffect(() => {
    if (editingEntryId && existingEntry) {
      setMood(existingEntry.mood);
      setWentWell(existingEntry.wentWell || "");
      setChallenges(existingEntry.challenges || "");
      setNotes(existingEntry.notes || "");
      setFocusAreas(existingEntry.focusAreas || []);
      setSelectedSessionId(existingEntry.linkedSessionId || null);
      setPracticeMinutes(existingEntry.practiceMinutes || 30);
      if (existingEntry.customAverage) {
        setCustomAverage(formatTime(existingEntry.customAverage));
        setUseSessionAverage(false);
      } else {
        setCustomAverage("");
        setUseSessionAverage(true);
      }
      if (existingEntry.customSolveCount) {
        setCustomSolveCount(existingEntry.customSolveCount.toString());
        setUseSessionSolveCount(false);
      } else {
        setCustomSolveCount("");
        setUseSessionSolveCount(true);
      }
      // Media fields
      setExistingMediaUrls(existingEntry.mediaUrls || []);
      setExistingMediaFileIds(existingEntry.mediaFileIds || []);
      setExistingMediaTypes(existingEntry.mediaTypes || []);
      // Reset deletion tracking state when loading existing entry
      setMediaToDelete([]);
      setUrlsToRemove([]);
      setUploadingMedia([]);
      setUploadError(null);
    }
  }, [editingEntryId, existingEntry, tasksForDate]);

  // Reset form when modal opens for a NEW entry (not editing)
  useEffect(() => {
    if (isOpen && !editingEntryId) {
      // Reset all form fields for a new entry
      setMood("good");
      setWentWell("");
      setChallenges("");
      setNotes("");
      setFocusAreas([]);
      setSelectedSessionId(null);
      setPracticeMinutes(30);
      setCustomAverage("");
      setUseSessionAverage(true);
      setCustomSolveCount("");
      setUseSessionSolveCount(true);
      // Reset media states
      setUploadingMedia([]);
      setExistingMediaUrls([]);
      setExistingMediaFileIds([]);
      setExistingMediaTypes([]);
      setMediaToDelete([]);
      setUrlsToRemove([]);
      setUploadError(null);
    }
  }, [isOpen, editingEntryId, tasksForDate]);

  // Keep ref in sync with uploadingMedia state
  useEffect(() => {
    uploadingMediaRef.current = uploadingMedia;
  }, [uploadingMedia]);

  // Reset didSaveRef when modal opens
  useEffect(() => {
    if (isOpen) {
      didSaveRef.current = false;
    }
  }, [isOpen]);

  // Lock body scroll when lightbox is open
  useEffect(() => {
    if (previewMedia) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [previewMedia]);

  // Cleanup uploaded media on unmount if not saved
  useEffect(() => {
    if (!isOpen) {
      // Modal just closed, cleanup any orphaned uploads
      const mediaToCleanup = uploadingMediaRef.current;

      // Revoke all blob URLs to free memory
      mediaToCleanup.forEach((m) => {
        if (m.previewUrl) {
          URL.revokeObjectURL(m.previewUrl);
        }
      });

      // 1111111111111111111111111111111111111
      if (!didSaveRef.current) {
        const orphanedUploads = mediaToCleanup.filter(
          (m) => m.progress === "completed" && m.fileId,
        );
        orphanedUploads.forEach(async (m) => {
          try {
            if (m.fileId) {
              await deleteJournalMedia(m.fileId);
            }
          } catch (error) {
            console.error("Failed to cleanup orphaned upload:", error);
          }
        });
      }
    }
  }, [isOpen]);

  // Helper function to parse time string (m:ss.cc or ss.cc) to milliseconds
  const parseTimeToMs = (timeStr: string): number | null => {
    const trimmed = timeStr.trim();
    if (!trimmed) return null;

    // Format: m:ss.cc or ss.cc
    const colonMatch = trimmed.match(/^(\d+):(\d{1,2})(\.\d{1,2})?$/);
    if (colonMatch) {
      const mins = parseInt(colonMatch[1], 10);
      const secs = parseInt(colonMatch[2], 10);
      const cs = colonMatch[3] ? parseFloat(colonMatch[3]) : 0;
      return Math.round((mins * 60 + secs + cs) * 1000);
    }

    // Format: ss.cc or just ss
    const secMatch = trimmed.match(/^(\d+)(\.\d{1,2})?$/);
    if (secMatch) {
      const secs = parseInt(secMatch[1], 10);
      const cs = secMatch[2] ? parseFloat(secMatch[2]) : 0;
      return Math.round((secs + cs) * 1000);
    }

    return null;
  };

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId],
    );
  };

  // Toggle task completion and sync with training plan
  const toggleTaskCompletion = async (activityIndex: number) => {
    if (!dateTasks?.planId || dateTasks.dayIndex < 0) return;

    const activity = dateTasks.plan.activities[activityIndex];
    const newCompletedState = !activity.completed;

    try {
      await updateActivity({
        planId: dateTasks.planId,
        dayIndex: dateTasks.dayIndex,
        activityIndex,
        completed: newCompletedState,
      });
      // Invalidate training plan cache to ensure consistency across components
      if (typeof window !== "undefined") {
        const { invalidateTrainingPlan } = await import("@/lib/coach-cache");
        invalidateTrainingPlan(userId);
      }
    } catch (error) {
      console.error("Failed to update task completion:", error);
    }
  };

  // Handle file selection for new media uploads
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploadError(null);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!isImageFile(file) && !isVideoFile(file)) {
        setUploadError("Only images and videos are allowed");
        continue;
      }

      if (!validateFileSize(file)) {
        setUploadError(
          `File "${file.name}" is too large. Max: 10MB for images, 50MB for videos`,
        );
        continue;
      }

      // Create a unique ID for this upload
      const uploadId = `upload-${Date.now()}-${i}`;
      const previewUrl = URL.createObjectURL(file);

      // Add to uploading media state
      setUploadingMedia((prev) => [
        ...prev,
        {
          id: uploadId,
          file,
          previewUrl,
          progress: "uploading",
          mediaType: file.type, // Store the MIME type
        },
      ]);

      // Upload immediately in background
      uploadMediaFile(uploadId, file);
    }

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Upload a single media file to Appwrite
  const uploadMediaFile = async (uploadId: string, file: File) => {
    try {
      const result = await uploadJournalMedia(file);

      // Update the uploading media state with completed status
      setUploadingMedia((prev) =>
        prev.map((m) =>
          m.id === uploadId
            ? {
                ...m,
                progress: "completed" as const,
                fileId: result.fileId,
                url: result.url,
              }
            : m,
        ),
      );
    } catch (error) {
      console.error("Failed to upload file:", error);

      // Update with error status
      setUploadingMedia((prev) =>
        prev.map((m) =>
          m.id === uploadId
            ? {
                ...m,
                progress: "error" as const,
                errorMessage: "Upload failed",
              }
            : m,
        ),
      );
    }
  };

  // Remove a newly uploaded/uploading media
  const removeNewMedia = async (uploadId: string) => {
    const media = uploadingMedia.find((m) => m.id === uploadId);
    if (!media) return;

    // Revoke the object URL to free memory
    URL.revokeObjectURL(media.previewUrl);

    // If already uploaded, delete from Appwrite
    if (media.fileId) {
      try {
        await deleteJournalMedia(media.fileId);
      } catch (error) {
        console.error("Failed to delete uploaded file:", error);
      }
    }

    setUploadingMedia((prev) => prev.filter((m) => m.id !== uploadId));
  };

  // Retry failed upload
  const retryUpload = (uploadId: string) => {
    const media = uploadingMedia.find((m) => m.id === uploadId);
    if (!media) return;

    // Reset to uploading state
    setUploadingMedia((prev) =>
      prev.map((m) =>
        m.id === uploadId
          ? { ...m, progress: "uploading" as const, errorMessage: undefined }
          : m,
      ),
    );

    // Retry upload
    uploadMediaFile(uploadId, media.file);
  };

  const removeExistingMedia = (index: number) => {
    const fileId = existingMediaFileIds[index];
    const url = existingMediaUrls[index];
    if (fileId) {
      setMediaToDelete((prev) => [...prev, fileId]);
    }
    if (url) {
      setUrlsToRemove((prev) => [...prev, url]);
    }
    setExistingMediaUrls((prev) => prev.filter((_, i) => i !== index));
    setExistingMediaFileIds((prev) => prev.filter((_, i) => i !== index));
    setExistingMediaTypes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    setIsSubmitting(true);

    try {
      // Get all successfully uploaded media
      const completedUploads = uploadingMedia.filter(
        (m) => m.progress === "completed" && m.fileId && m.url,
      );

      // Delete removed media from Appwrite
      for (const fileId of mediaToDelete) {
        try {
          await deleteJournalMedia(fileId);
        } catch (error) {
          console.error("Failed to delete file:", error);
        }
      }

      // Combine existing media (minus removed) with newly uploaded media for final save
      const finalMediaUrls = [
        ...existingMediaUrls,
        ...completedUploads.map((m) => m.url!),
      ];
      const finalMediaFileIds = [
        ...existingMediaFileIds,
        ...completedUploads.map((m) => m.fileId!),
      ];
      const finalMediaTypes = [
        ...existingMediaTypes,
        ...completedUploads.map((m) => m.mediaType),
      ];

      const parsedCustomAvg = !useSessionAverage
        ? parseTimeToMs(customAverage)
        : null;

      const parsedCustomSolveCount =
        !useSessionSolveCount && customSolveCount
          ? parseInt(customSolveCount, 10)
          : null;

      await saveEntry({
        entryId: editingEntryId, // Pass entryId when editing
        userId,
        profileId,
        planId,
        entryDate: stableDate,
        linkedSessionId: selectedSessionId || undefined,
        solveCount: sessionStats?.solveCount,
        sessionAverage: sessionStats?.average || undefined,
        bestSingle: sessionStats?.bestSingle || undefined,
        practiceMinutes,
        customAverage: parsedCustomAvg || undefined,
        customSolveCount: parsedCustomSolveCount || undefined,
        mood,
        wentWell: wentWell || undefined,
        challenges: challenges || undefined,
        notes: notes || undefined,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
        completedTaskIndices:
          completedTaskIndices.length > 0 ? completedTaskIndices : undefined,
        // Media fields
        mediaUrls: finalMediaUrls,
        mediaFileIds: finalMediaFileIds,
        mediaTypes: finalMediaTypes,
      });

      // Mark as saved to prevent cleanup of uploaded media
      didSaveRef.current = true;

      // Cleanup preview URLs
      uploadingMedia.forEach((m) => URL.revokeObjectURL(m.previewUrl));

      onSave?.();
      onClose();
    } catch (error) {
      console.error("Failed to save journal entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // Compute completed activities count for progress display
  const completedActivitiesCount =
    dateTasks?.plan.activities.filter((a) => a.completed).length || 0;
  const totalActivities = dateTasks?.plan.activities.length || 0;

  // Get indices of completed tasks for easier access when saving
  const completedTaskIndices =
    dateTasks?.plan.activities
      .map((activity, index) => (activity.completed ? index : -1))
      .filter((index) => index !== -1) || [];

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
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                Daily Journal
              </h2>
              <p className="text-sm text-[var(--text-muted)]">
                {formatDate(stableDate)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3 font-inter">
              How was your practice session?
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const Icon = m.icon;
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                      isSelected
                        ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                        : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <Icon
                      className={`w-4 h-4 ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`}
                    />
                    <span className="font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link Timer Session */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Link a Timer Session (Optional)
            </label>

            {selectedSessionId && sessionStats ? (
              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[var(--primary)]" />
                    <span className="font-medium text-[var(--text-primary)] text-sm">
                      {sessions?.find((s) => s._id === selectedSessionId)
                        ?.name || "Session"}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedSessionId(null)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-[var(--surface)] rounded-lg">
                    <span className="text-xs text-[var(--text-muted)] block">
                      Solves
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {sessionStats.solveCount}
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--surface)] rounded-lg">
                    <span className="text-xs text-[var(--text-muted)] block">
                      Average
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {sessionStats.average
                        ? formatTime(sessionStats.average)
                        : "-"}
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--surface)] rounded-lg">
                    <span className="text-xs text-[var(--text-muted)] block">
                      Best
                    </span>
                    <span className="font-semibold text-[var(--success)] text-sm">
                      {sessionStats.bestSingle
                        ? formatTime(sessionStats.bestSingle)
                        : "-"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSessionSelector(!showSessionSelector)}
                className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-left hover:border-[var(--border-hover)] transition-colors"
              >
                <span className="text-sm text-[var(--text-muted)]">
                  Click to select a session from Timer...
                </span>
              </button>
            )}

            {showSessionSelector &&
              !selectedSessionId &&
              filteredSessions.length > 0 && (
                <div className="mt-2 max-h-40 overflow-y-auto space-y-1 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
                  {filteredSessions.slice(0, 5).map((session) => (
                    <button
                      key={session._id}
                      onClick={() => {
                        setSelectedSessionId(session._id);
                        setShowSessionSelector(false);
                      }}
                      className="w-full flex items-center justify-between p-2 rounded hover:bg-[var(--surface)] transition-colors"
                    >
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {session.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {session.solveCount3x3} solves
                      </span>
                    </button>
                  ))}
                </div>
              )}

            {/* Session Selection Note */}
            <p className="text-xs text-[var(--text-muted)] mt-2 leading-relaxed">
              Select a session that reflects your actual practice. Sessions with
              inaccurate data may affect your training insights.
            </p>
          </div>

          {/* Custom Average */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Session Average
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setUseSessionAverage(true);
                  setCustomAverage("");
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  useSessionAverage
                    ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                    : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {sessionStats?.average
                  ? `From Session: ${formatTime(sessionStats.average)}`
                  : "From Session"}
              </button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="text"
                  value={customAverage}
                  onChange={(e) => {
                    setCustomAverage(e.target.value);
                    setUseSessionAverage(false);
                  }}
                  placeholder="12.34 or 1:23.45"
                  className={`w-full px-3 py-2.5 bg-[var(--surface-elevated)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter text-sm ${
                    !useSessionAverage && customAverage
                      ? "border-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Use session average or enter a custom average (e.g., 12.34 or
              1:23.45)
            </p>
          </div>

          {/* Custom Solve Count */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Total Solves
            </label>
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => {
                  setUseSessionSolveCount(true);
                  setCustomSolveCount("");
                }}
                className={`flex-1 px-4 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  useSessionSolveCount
                    ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                    : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                }`}
              >
                {sessionStats?.solveCount
                  ? `From Session: ${sessionStats.solveCount}`
                  : "From Session"}
              </button>
              <div className="flex-1 flex items-center gap-2">
                <input
                  type="number"
                  value={customSolveCount}
                  onChange={(e) => {
                    setCustomSolveCount(e.target.value);
                    setUseSessionSolveCount(false);
                  }}
                  placeholder="Enter solves"
                  min={0}
                  className={`w-full px-3 py-2.5 bg-[var(--surface-elevated)] border rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter text-sm ${
                    !useSessionSolveCount && customSolveCount
                      ? "border-[var(--primary)]"
                      : "border-[var(--border)]"
                  }`}
                />
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-1.5">
              Use session solve count or enter a custom number
            </p>
          </div>

          {/* Practice Time */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              How long did you practice?
            </label>
            <div className="flex items-center gap-2 sm:gap-3">
              <Clock className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
              <input
                type="number"
                value={practiceMinutes}
                onChange={(e) =>
                  setPracticeMinutes(parseInt(e.target.value) || 0)
                }
                className="w-20 sm:w-24 px-2 sm:px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter text-sm"
                min={0}
                max={480}
              />
              <span className="text-sm text-[var(--text-muted)]">minutes</span>
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              What did you focus on?
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => toggleFocusArea(area.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    focusAreas.includes(area.id)
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tasks Section for the selected date */}
          {dateTasks && !dateTasks.plan.isRestDay && (
            <div className="timer-card !p-0 overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)]">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-primary)] block text-sm">
                      Training Tasks
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {completedActivitiesCount}/{totalActivities} completed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--primary)] transition-all"
                      style={{
                        width: `${totalActivities > 0 ? (completedActivitiesCount / totalActivities) * 100 : 0}%`,
                      }}
                    />
                  </div>
                  {showTasks ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
              </button>

              {showTasks && (
                <div className="px-4 pb-4 space-y-2">
                  {dateTasks.plan.activities.map((activity, activityIndex) => {
                    const isCompleted = activity.completed;
                    return (
                      <div
                        key={activityIndex}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          isCompleted
                            ? "bg-[var(--success)]/10"
                            : "bg-[var(--surface)]"
                        }`}
                      >
                        <button
                          onClick={() => toggleTaskCompletion(activityIndex)}
                          className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                            isCompleted
                              ? "bg-[var(--success)] border-[var(--success)] text-white"
                              : "border-[var(--border)] hover:border-[var(--primary)]"
                          }`}
                        >
                          {isCompleted && <CheckCircle2 className="w-3 h-3" />}
                        </button>

                        <div className="flex-1 min-w-0">
                          <span
                            className={`font-medium text-sm ${
                              isCompleted
                                ? "text-[var(--text-muted)] line-through"
                                : "text-[var(--text-primary)]"
                            }`}
                          >
                            {activity.title}
                          </span>
                          <p className="text-xs text-[var(--text-muted)] mt-0.5">
                            {activity.description}
                          </p>
                          <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {activity.durationMinutes} min
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Rest Day Notice */}
          {dateTasks?.plan.isRestDay && (
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] text-center">
              <span className="text-sm text-[var(--text-muted)]">
                Today is a rest day. Take it easy!
              </span>
            </div>
          )}

          {/* What Went Well */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              What went well?
            </label>
            <textarea
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="e.g., Cross planning was much better today..."
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm"
              rows={2}
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              What was challenging?
            </label>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="e.g., Struggled with F2L lookahead..."
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm"
              rows={2}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other thoughts or observations..."
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm"
              rows={2}
            />
          </div>

          {/* Media Upload Section */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Attach Images or Videos (Optional)
            </label>

            {/* File input */}
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_MEDIA_TYPES}
              multiple
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* Upload button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-dashed border-[var(--border)] rounded-lg text-left hover:border-[var(--primary)] hover:bg-[var(--primary)]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Upload className="w-4 h-4 text-[var(--text-muted)]" />
              <span className="text-sm text-[var(--text-muted)]">
                Click to upload images or videos
              </span>
            </button>

            {/* Upload error */}
            {uploadError && (
              <div className="mt-2 flex items-center gap-2 text-sm text-[var(--error)]">
                <AlertCircle className="w-4 h-4" />
                <span>{uploadError}</span>
              </div>
            )}

            {/* Media previews - existing */}
            {existingMediaUrls.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {existingMediaUrls.map((url, index) => {
                  const mediaType = existingMediaTypes[index];
                  const fileId = existingMediaFileIds[index];
                  const isVideo = mediaType
                    ? mediaType.startsWith("video/")
                    : url.includes("video") ||
                      url.endsWith(".mp4") ||
                      url.endsWith(".webm");
                  return (
                    <MediaPreviewItem
                      key={`existing-${index}`}
                      url={url}
                      fileId={fileId}
                      isVideo={isVideo}
                      onRemove={() => removeExistingMedia(index)}
                      onPreview={() =>
                        setPreviewMedia({
                          url:
                            isVideo && fileId
                              ? getFileDownloadUrl(fileId)
                              : url,
                          isVideo,
                          fileId,
                        })
                      }
                    />
                  );
                })}
              </div>
            )}

            {/* Media previews - uploading/new */}
            {uploadingMedia.length > 0 && (
              <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2">
                {uploadingMedia.map((media) => (
                  <UploadingMediaItem
                    key={media.id}
                    media={media}
                    onRemove={() => removeNewMedia(media.id)}
                    onRetry={() => retryUpload(media.id)}
                    onPreview={() => {
                      const isVideo = media.file.type.startsWith("video/");
                      setPreviewMedia({
                        url:
                          isVideo && media.fileId
                            ? getFileDownloadUrl(media.fileId)
                            : media.previewUrl,
                        isVideo,
                        fileId: media.fileId,
                      });
                    }}
                  />
                ))}
              </div>
            )}

            <p className="text-xs text-[var(--text-muted)] mt-2">
              Max 10MB for images, 50MB for videos. Supported: JPG, PNG, GIF,
              WebP, MP4, WebM
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 bg-transparent border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting || isUploading || hasUploadErrors}
              className="w-full sm:flex-1 px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Uploading media...</span>
                </>
              ) : hasUploadErrors ? (
                <>
                  <AlertCircle className="w-4 h-4" />
                  <span>Fix upload errors</span>
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Media Preview Lightbox - Rendered via portal to ensure full-screen coverage */}
      {previewMedia &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            className="fixed inset-0 bg-black/95 z-[9999] flex items-center justify-center p-4"
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
            onClick={() => setPreviewMedia(null)}
          >
            <button
              className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
              onClick={() => setPreviewMedia(null)}
            >
              <X className="w-8 h-8" />
            </button>
            {previewMedia.isVideo ? (
              <video
                src={previewMedia.url}
                controls
                autoPlay
                className="max-w-full max-h-[90vh] rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            ) : (
              <img
                src={previewMedia.url}
                alt="Full size preview"
                className="max-w-full max-h-[90vh] object-contain rounded-lg"
                onClick={(e) => e.stopPropagation()}
              />
            )}
          </div>,
          document.body,
        )}
    </div>
  );
}