"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import {
  ChevronDown,
  ChevronRight,
  Trash2,
  X,
  Eye,
  EyeOff,
  Clipboard,
  ClipboardCheck,
  Pencil,
  Share2,
  Link,
  CircleCheck,
} from "lucide-react";
import dynamic from "next/dynamic";

// Dynamically import ScramblePreview to avoid loading heavy 3D library on initial load
const ScramblePreview = dynamic(() => import("./ScramblePreview"), {
  loading: () => (
    <div className="w-full h-32 bg-(--surface-elevated) rounded-lg flex items-center justify-center">
      <div className="text-sm text-(--text-muted)">Loading preview...</div>
    </div>
  ),
  ssr: false,
});

// Dynamically import SolveEditModal
const SolveEditModal = dynamic(() => import("./SolveEditModal"), {
  ssr: false,
});

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  notes?: string;
  tags?: string[];
  timerMode?: "normal" | "manual" | "stackmat";
}

interface TimerHistoryProps {
  history: TimerRecord[];
  selectedEvent: string;
  onClearHistory: () => void;
  onApplyPenalty: (solveId: string, penalty: "none" | "+2" | "DNF") => void;
  onDeleteSolve: (solveId: string) => void;
  onUpdateSolve?: (solveId: string, notes?: string, tags?: string[]) => void;
  onEditTime?: (
    solveId: string,
    time: number,
    penalty: "none" | "+2" | "DNF",
  ) => void;
}

// Map of event IDs to display names
const eventNames: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333oh": "3x3 OH",
  pyram: "Pyraminx",
  minx: "Megaminx",
  skewb: "Skewb",
  clock: "Clock",
  sq1: "Square-1",
  "333bld": "3x3 BLD",
  "444bld": "4x4 BLD",
  "555bld": "5x5 BLD",
  "333mbld": "3x3 MBLD",
  "333fm": "3x3 FM",
};

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  const setStateAndStore = (newState: boolean) => {
    setState(newState);
    try {
      localStorage.setItem(key, JSON.stringify(newState));
    } catch {}
  };
  return [state, setStateAndStore] as const;
}

// Share options for share menu
interface ShareOption {
  name: string;
  icon: React.ReactNode;
  color: string;
  getUrl: (data: { title: string; text: string }) => string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: "bg-green-500 hover:bg-green-600",
    getUrl: (data) => `https://wa.me/?text=${encodeURIComponent(data.text)}`,
  },
  {
    name: "X",
    icon: (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color:
      "bg-black hover:bg-gray-800 dark:bg-white dark:text-black dark:hover:bg-gray-200",
    getUrl: (data) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}`,
  },
  {
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "bg-blue-600 hover:bg-blue-700",
    getUrl: (data) =>
      `https://www.facebook.com/sharer/sharer.php?quote=${encodeURIComponent(data.text)}`,
  },
  {
    name: "Reddit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    color: "bg-orange-500 hover:bg-orange-600",
    getUrl: (data) =>
      `https://reddit.com/submit?title=${encodeURIComponent(data.title)}&text=${encodeURIComponent(data.text)}`,
  },
];

// Modal component for solve details and editing
function SolveDetailsModal({
  solve,
  isOpen,
  onClose,
  onApplyPenalty,
  onDeleteSolve,
  onUpdateSolve,
  onEditTime,
}: {
  solve: TimerRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onApplyPenalty: (solveId: string, penalty: "none" | "+2" | "DNF") => void;
  onDeleteSolve: (solveId: string) => void;
  onUpdateSolve?: (solveId: string, notes?: string, tags?: string[]) => void;
  onEditTime?: (
    solveId: string,
    time: number,
    penalty: "none" | "+2" | "DNF",
  ) => void;
}) {
  const [editingNotes, setEditingNotes] = useState(false);
  const [editingTags, setEditingTags] = useState(false);
  const [notesValue, setNotesValue] = useState("");
  const [tagsValue, setTagsValue] = useState("");
  const [copySuccess, setCopySuccess] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [shareMenuOpen, setShareMenuOpen] = useState(false);
  const shareMenuRef = useRef<HTMLDivElement>(null);

  // Close share menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        shareMenuRef.current &&
        !shareMenuRef.current.contains(event.target as Node)
      ) {
        setShareMenuOpen(false);
      }
    };

    if (shareMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [shareMenuOpen]);

  // Sync local state when solve changes
  useEffect(() => {
    if (solve) {
      setNotesValue(solve.notes || "");
      setTagsValue(solve.tags?.join(", ") || "");
    }
  }, [solve]);

  if (!isOpen || !solve) return null;

  const formatTime = (
    timeMs: number,
    penalty: "none" | "+2" | "DNF" = "none",
  ) => {
    if (penalty === "DNF" || timeMs === Infinity || timeMs === 0) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  const getEventName = (eventId: string) => {
    return eventNames[eventId] || eventId;
  };

  // Format date and time
  const formatDateTime = (date: Date) => {
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Copy solve details to clipboard
  const handleCopySolve = async () => {
    const eventName = getEventName(solve.event);
    const time = formatTime(solve.finalTime, solve.penalty);
    const penalty = solve.penalty === "none" ? "" : ` (${solve.penalty})`;
    const dateTime = formatDateTime(solve.timestamp);

    const text = `Generated by CubeDev\n${time}${penalty}\n${solve.scramble}\n${dateTime}`;

    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  // Handle time edit
  const handleEditTime = (time: number, penalty: "none" | "+2" | "DNF") => {
    if (onEditTime && solve) {
      onEditTime(solve.id, time, penalty);
      setShowEditModal(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-(--surface) border border-(--border) rounded-lg shadow-xl max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
            Solve Details
          </h3>
          <button
            onClick={onClose}
            className="p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Time Display */}
          <div className="text-center">
            <div className="flex items-center justify-center gap-2">
              <div
                className={`text-3xl font-bold font-mono ${
                  solve.penalty === "+2"
                    ? "text-yellow-400"
                    : solve.penalty === "DNF"
                      ? "text-red-400"
                      : "text-(--text-primary)"
                }`}
              >
                {formatTime(solve.finalTime, solve.penalty)}
                {solve.penalty === "+2" && "+"}
              </div>
              <button
                onClick={() => setShowEditModal(true)}
                className="p-2 text-(--text-muted) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
                title="Edit solve time"
              >
                <Pencil className="w-4 h-4" />
              </button>
              {/* Share button with dropdown */}
              <div className="relative" ref={shareMenuRef}>
                <button
                  onClick={() => setShareMenuOpen(!shareMenuOpen)}
                  className="p-2 text-(--text-muted) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
                  title="Share solve"
                >
                  {copySuccess ? (
                    <CircleCheck className="w-5 h-5 text-green-400" />
                  ) : (
                    <Share2 className="w-5 h-5" />
                  )}
                </button>

                {shareMenuOpen && (
                  <>
                    {/* Mobile: Bottom sheet */}
                    <div className="fixed inset-0 z-[100] sm:hidden">
                      <div
                        className="absolute inset-0 bg-black/50"
                        onClick={() => setShareMenuOpen(false)}
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-(--surface) border-t border-(--border) rounded-t-2xl shadow-lg">
                        <div className="flex justify-center pt-3 pb-2">
                          <div className="w-10 h-1 bg-(--border) rounded-full" />
                        </div>
                        <div className="px-4 pb-3 border-b border-(--border)">
                          <h3 className="text-base font-semibold text-(--text-primary) text-center">
                            Share Solve
                          </h3>
                        </div>
                        <div className="p-4">
                          <button
                            onClick={handleCopySolve}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-xl transition-colors mb-2"
                          >
                            <div className="w-10 h-10 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-primary)">
                              {copySuccess ? (
                                <CircleCheck className="w-5 h-5 text-(--success)" />
                              ) : (
                                <Link className="w-5 h-5" />
                              )}
                            </div>
                            <span className="font-medium">
                              {copySuccess ? "Copied!" : "Copy to Clipboard"}
                            </span>
                          </button>
                          {typeof navigator !== "undefined" &&
                            "share" in navigator && (
                              <button
                                onClick={async () => {
                                  const eventName = getEventName(solve.event);
                                  const time = formatTime(
                                    solve.finalTime,
                                    solve.penalty,
                                  );
                                  const penalty =
                                    solve.penalty === "none"
                                      ? ""
                                      : ` (${solve.penalty})`;
                                  const dateTime = formatDateTime(
                                    solve.timestamp,
                                  );
                                  const text = `Generated by CubeDev\n${time}${penalty}\n${solve.scramble}\n${dateTime}`;
                                  try {
                                    await navigator.share({
                                      title: `CubeDev Solve - ${eventName}`,
                                      text: text,
                                    });
                                    setShareMenuOpen(false);
                                  } catch (e) {}
                                }}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-xl transition-colors mb-4"
                              >
                                <div className="w-10 h-10 rounded-full bg-(--primary) flex items-center justify-center text-white">
                                  <Share2 className="w-5 h-5" />
                                </div>
                                <span className="font-medium">
                                  Share via...
                                </span>
                              </button>
                            )}
                          <div className="flex justify-center gap-4 pt-2 pb-4">
                            {SHARE_OPTIONS.map((option) => {
                              const eventName = getEventName(solve.event);
                              const time = formatTime(
                                solve.finalTime,
                                solve.penalty,
                              );
                              const penalty =
                                solve.penalty === "none"
                                  ? ""
                                  : ` (${solve.penalty})`;
                              const dateTime = formatDateTime(solve.timestamp);
                              const text = `Generated by CubeDev\n${time}${penalty}\n${solve.scramble}\n${dateTime}`;
                              return (
                                <button
                                  key={option.name}
                                  onClick={() => {
                                    const url = option.getUrl({
                                      title: `CubeDev Solve - ${eventName}`,
                                      text: text,
                                    });
                                    window.open(
                                      url,
                                      "_blank",
                                      "noopener,noreferrer,width=600,height=400",
                                    );
                                    setShareMenuOpen(false);
                                  }}
                                  className="flex flex-col items-center gap-2"
                                >
                                  <div
                                    className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center text-white transition-transform hover:scale-110`}
                                  >
                                    {option.icon}
                                  </div>
                                  <span className="text-[10px] text-(--text-muted)">
                                    {option.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Desktop: Dropdown menu */}
                    <div className="hidden sm:block absolute top-full mt-2 right-0 w-56 bg-(--surface) border border-(--border) rounded-xl shadow-lg z-[100] overflow-hidden">
                      <div className="p-3 border-b border-(--border)">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-(--text-primary)">
                            Share Solve
                          </span>
                          <button
                            onClick={() => setShareMenuOpen(false)}
                            className="p-1 hover:bg-(--surface-elevated) rounded-lg transition-colors"
                          >
                            <X className="w-4 h-4 text-(--text-muted)" />
                          </button>
                        </div>
                      </div>
                      <div className="p-2">
                        {typeof navigator !== "undefined" &&
                          "share" in navigator && (
                            <button
                              onClick={async () => {
                                const eventName = getEventName(solve.event);
                                const time = formatTime(
                                  solve.finalTime,
                                  solve.penalty,
                                );
                                const penalty =
                                  solve.penalty === "none"
                                    ? ""
                                    : ` (${solve.penalty})`;
                                const dateTime = formatDateTime(
                                  solve.timestamp,
                                );
                                const text = `Generated by CubeDev\n${time}${penalty}\n${solve.scramble}\n${dateTime}`;
                                try {
                                  await navigator.share({
                                    title: `CubeDev Solve - ${eventName}`,
                                    text: text,
                                  });
                                  setShareMenuOpen(false);
                                } catch (e) {}
                              }}
                              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                            >
                              <div className="w-8 h-8 rounded-full bg-(--primary) flex items-center justify-center text-white">
                                <Share2 className="w-4 h-4" />
                              </div>
                              <span>Share via...</span>
                            </button>
                          )}
                        <button
                          onClick={handleCopySolve}
                          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                        >
                          <div className="w-8 h-8 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-primary)">
                            {copySuccess ? (
                              <CircleCheck className="w-4 h-4 text-(--success)" />
                            ) : (
                              <Link className="w-4 h-4" />
                            )}
                          </div>
                          <span>
                            {copySuccess ? "Copied!" : "Copy to Clipboard"}
                          </span>
                        </button>
                        <div className="my-2 border-t border-(--border)" />
                        <div className="grid grid-cols-4 gap-2 p-2">
                          {SHARE_OPTIONS.map((option) => {
                            const eventName = getEventName(solve.event);
                            const time = formatTime(
                              solve.finalTime,
                              solve.penalty,
                            );
                            const penalty =
                              solve.penalty === "none"
                                ? ""
                                : ` (${solve.penalty})`;
                            const dateTime = formatDateTime(solve.timestamp);
                            const text = `Generated by CubeDev\n${time}${penalty}\n${solve.scramble}\n${dateTime}`;
                            return (
                              <button
                                key={option.name}
                                onClick={() => {
                                  const url = option.getUrl({
                                    title: `CubeDev Solve - ${eventName}`,
                                    text: text,
                                  });
                                  window.open(
                                    url,
                                    "_blank",
                                    "noopener,noreferrer,width=600,height=400",
                                  );
                                  setShareMenuOpen(false);
                                }}
                                className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white transition-transform hover:scale-110`}
                                title={option.name}
                              >
                                {option.icon}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            <div className="text-sm text-(--text-muted) font-inter mt-2">
              {getEventName(solve.event)} • {solve.timestamp.toLocaleString()}
              {solve.timerMode && solve.timerMode !== "normal" && (
                <>
                  {" • "}
                  <span
                    className={`text-xs px-2 py-0.5 rounded font-medium ${
                      solve.timerMode === "manual"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                        : "bg-purple-500/10 text-purple-500 border border-purple-500/30"
                    }`}
                  >
                    {solve.timerMode === "manual" ? "Manual" : "Stackmat"}
                  </span>
                </>
              )}
            </div>
          </div>

          {/* Time Breakdown */}
          <div className="bg-(--surface-elevated) rounded-lg p-3">
            <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
              Time Breakdown
            </div>
            <div className="space-y-1 text-sm font-mono">
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Raw Time:</span>
                <span className="text-(--text-primary)">
                  {formatTime(solve.time, "none")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-(--text-secondary)">Penalty:</span>
                <span
                  className={
                    solve.penalty === "+2"
                      ? "text-yellow-400"
                      : solve.penalty === "DNF"
                        ? "text-red-400"
                        : "text-(--text-primary)"
                  }
                >
                  {solve.penalty === "none" ? "None" : solve.penalty}
                </span>
              </div>
              <div className="flex justify-between border-t border-(--border) pt-1">
                <span className="text-(--text-secondary) font-semibold">
                  Final Time:
                </span>
                <span className="text-(--text-primary) font-semibold">
                  {formatTime(solve.finalTime, solve.penalty)}
                </span>
              </div>
            </div>
          </div>

          {/* Scramble */}
          <div>
            <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
              Scramble
            </div>
            <div className="text-sm font-mono text-(--text-secondary) bg-(--background) p-3 rounded border border-(--border) mb-3">
              {solve.scramble}
            </div>

            {/* Scramble Preview */}
            <div className="bg-(--surface-elevated) rounded-lg border border-(--border)">
              <ScramblePreview scramble={solve.scramble} event={solve.event} />
            </div>
          </div>

          {/* Notes & Tags */}
          <div className="space-y-4">
            {/* Notes Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter">
                  Notes
                </div>
                <button
                  onClick={() => setEditingNotes(!editingNotes)}
                  className="text-xs text-(--primary) hover:text-(--primary-hover) font-medium"
                >
                  {editingNotes ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingNotes ? (
                <div className="space-y-2">
                  <textarea
                    value={notesValue}
                    onChange={(e) => setNotesValue(e.target.value)}
                    placeholder="Add notes about this solve..."
                    className="w-full p-3 text-sm bg-(--background) border border-(--border) rounded resize-none focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
                    rows={3}
                    onKeyDown={(e) => {
                      if (e.key === "Escape") {
                        setNotesValue(solve.notes || "");
                        setEditingNotes(false);
                      }
                      // Prevent spacebar from triggering timer events
                      if (e.key === " ") {
                        e.stopPropagation();
                      }
                    }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateSolve?.(
                          solve.id,
                          notesValue,
                          tagsValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        );
                        setEditingNotes(false);
                      }}
                      className="px-3 py-1 text-xs bg-(--primary) text-white rounded hover:bg-(--primary-hover) font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setNotesValue(solve.notes || "");
                        setEditingNotes(false);
                      }}
                      className="px-3 py-1 text-xs bg-(--surface-elevated) text-(--text-secondary) rounded hover:bg-(--border) font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-(--text-secondary) bg-(--background) p-3 rounded border border-(--border) min-h-[60px]">
                  {solve.notes || (
                    <span className="text-(--text-muted) italic">
                      No notes added
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Tags Section */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter">
                  Tags
                </div>
                <button
                  onClick={() => setEditingTags(!editingTags)}
                  className="text-xs text-(--primary) hover:text-(--primary-hover) font-medium"
                >
                  {editingTags ? "Cancel" : "Edit"}
                </button>
              </div>
              {editingTags ? (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={tagsValue}
                    onChange={(e) => setTagsValue(e.target.value)}
                    placeholder="Add tags separated by commas..."
                    className="w-full p-3 text-sm bg-(--background) border border-(--border) rounded focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        e.stopPropagation();
                        onUpdateSolve?.(
                          solve.id,
                          notesValue,
                          tagsValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        );
                        setEditingTags(false);
                      }
                      if (e.key === "Escape") {
                        setEditingTags(false);
                        setTagsValue(solve.tags?.join(", ") || "");
                      }
                      // Prevent spacebar from triggering timer events
                      if (e.key === " ") {
                        e.stopPropagation();
                      }
                    }}
                  />
                  <div className="text-xs text-(--text-muted)">
                    Separate tags with commas (e.g., "good scramble, new PB,
                    lucky")
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        onUpdateSolve?.(
                          solve.id,
                          notesValue,
                          tagsValue
                            .split(",")
                            .map((t) => t.trim())
                            .filter(Boolean),
                        );
                        setEditingTags(false);
                      }}
                      className="px-3 py-1 text-xs bg-(--primary) text-white rounded hover:bg-(--primary-hover) font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setTagsValue(solve.tags?.join(", ") || "");
                        setEditingTags(false);
                      }}
                      className="px-3 py-1 text-xs bg-(--surface-elevated) text-(--text-secondary) rounded hover:bg-(--border) font-medium"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-(--background) p-3 rounded border border-(--border) min-h-[40px]">
                  {solve.tags && solve.tags.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {solve.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-(--primary) bg-opacity-20 text-(--foregoround) rounded-full font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  ) : (
                    <span className="text-(--text-muted) italic text-sm">
                      No tags added
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3">
            <div>
              <div className="text-xs text-(--text-muted) uppercase tracking-wide font-inter mb-2">
                Penalty
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onApplyPenalty(solve.id, "none")}
                  className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
                    solve.penalty === "none"
                      ? "bg-(--primary) text-white"
                      : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border)"
                  }`}
                >
                  OK
                </button>
                <button
                  onClick={() => onApplyPenalty(solve.id, "+2")}
                  className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
                    solve.penalty === "+2"
                      ? "bg-(--warning) text-white"
                      : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border)"
                  }`}
                >
                  +2
                </button>
                <button
                  onClick={() => onApplyPenalty(solve.id, "DNF")}
                  className={`flex-1 px-3 py-2 text-sm rounded font-medium transition-colors ${
                    solve.penalty === "DNF"
                      ? "bg-(--error) text-white"
                      : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border)"
                  }`}
                >
                  DNF
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                onDeleteSolve(solve.id);
                onClose();
              }}
              className="w-full px-3 py-2 bg-(--error) hover:bg-red-600 text-white text-sm rounded font-medium transition-colors"
            >
              Delete Solve
            </button>
          </div>
        </div>
      </div>

      {/* Edit Time Modal */}
      {solve && (
        <SolveEditModal
          isOpen={showEditModal}
          onClose={() => setShowEditModal(false)}
          currentTime={solve.time}
          currentPenalty={solve.penalty}
          onSave={handleEditTime}
        />
      )}
    </div>
  );
}

export default function TimerHistory({
  history,
  selectedEvent,
  onClearHistory,
  onApplyPenalty,
  onDeleteSolve,
  onUpdateSolve,
  onEditTime,
}: TimerHistoryProps) {
  const [showHistory, setShowHistory] = usePersistentBool(
    "cubelab-timer-history-expanded",
    true,
  );
  const [selectedSolve, setSelectedSolve] = useState<TimerRecord | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingSolveId, setEditingSolveId] = useState<string | null>(null);

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(20);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Reset display count when event or history changes
  useEffect(() => {
    setDisplayCount(20);
  }, [selectedEvent, history.length]);

  // Infinite scroll handler
  const handleScroll = useCallback(() => {
    if (!scrollContainerRef.current || isLoading) return;

    const { scrollTop, scrollHeight, clientHeight } =
      scrollContainerRef.current;

    // If scrolled near bottom, load more
    if (scrollTop + clientHeight >= scrollHeight - 100) {
      const eventHistory = history.filter((r) => r.event === selectedEvent);

      // Only load more if there are more records to show
      if (displayCount < eventHistory.length) {
        setIsLoading(true);
        // Simulate loading delay for better UX
        setTimeout(() => {
          setDisplayCount((prev) => Math.min(prev + 20, eventHistory.length));
          setIsLoading(false);
        }, 200);
      }
    }
  }, [history, selectedEvent, displayCount, isLoading]);

  // Format time function
  const formatTime = (
    timeMs: number,
    penalty: "none" | "+2" | "DNF" = "none",
  ) => {
    if (penalty === "DNF" || timeMs === Infinity || timeMs === 0) return "DNF";
    const seconds = timeMs / 1000;
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  // Get event display name
  const getEventName = (eventId: string) => {
    return eventNames[eventId] || eventId;
  };

  // Handle solve click to open modal
  const handleSolveClick = (solve: TimerRecord) => {
    setSelectedSolve(solve);
    setIsModalOpen(true);
  };

  // Handle penalty change with modal update
  const handlePenaltyChange = (
    solveId: string,
    penalty: "none" | "+2" | "DNF",
  ) => {
    onApplyPenalty(solveId, penalty);
    // Update selected solve if it's the one being modified
    if (selectedSolve && selectedSolve.id === solveId) {
      const updatedSolve = { ...selectedSolve, penalty };
      // Recalculate finalTime based on new penalty
      if (penalty === "DNF") {
        updatedSolve.finalTime = Infinity;
      } else if (penalty === "+2") {
        updatedSolve.finalTime = selectedSolve.time + 2000;
      } else {
        updatedSolve.finalTime = selectedSolve.time;
      }
      setSelectedSolve(updatedSolve);
    }
  };

  // Handle solve update (notes/tags) with modal update
  const handleUpdateSolve = (
    solveId: string,
    notes?: string,
    tags?: string[],
  ) => {
    if (onUpdateSolve) {
      onUpdateSolve(solveId, notes, tags);
      // Update selected solve if it's the one being modified
      if (selectedSolve && selectedSolve.id === solveId) {
        setSelectedSolve({
          ...selectedSolve,
          notes: notes || "",
          tags: tags || [],
        });
      }
    }
  };

  // Handle time edit
  const handleEditTime = (
    solveId: string,
    time: number,
    penalty: "none" | "+2" | "DNF",
  ) => {
    if (onEditTime) {
      onEditTime(solveId, time, penalty);
      // Update selected solve if it's the one being modified
      if (selectedSolve && selectedSolve.id === solveId) {
        let finalTime = time;
        if (penalty === "+2") {
          finalTime = time + 2000;
        } else if (penalty === "DNF") {
          finalTime = Infinity;
        }
        setSelectedSolve({
          ...selectedSolve,
          time,
          penalty,
          finalTime,
        });
      }
    }
    setEditingSolveId(null);
  };

  const eventHistory = history.filter((r) => r.event === selectedEvent);

  return (
    <>
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowHistory(!showHistory)}
                className="flex items-center gap-1 p-2 text-(--text-muted) hover:text-(--primary) rounded transition-colors"
                title={showHistory ? "Hide recent times" : "Show recent times"}
              >
                <h3 className="text-lg font-semibold text-(--text-primary) font-statement hover:text-(--primary) transition-colors">
                  Recent Times
                </h3>
                {showHistory ? (
                  <ChevronDown className="w-4 h-4" />
                ) : (
                  <ChevronRight className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {eventHistory.length > 0 && (
              <button
                onClick={onClearHistory}
                className="p-1 text-(--text-muted) hover:text-(--error) transition-colors"
                title="Clear all times"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="p-2 text-(--text-muted) hover:text-(--primary) transition-colors"
              title={showHistory ? "Hide recent times" : "Show recent times"}
            >
              {showHistory ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>

        {showHistory && (
          <div
            ref={scrollContainerRef}
            className="space-y-2 max-h-64 overflow-y-auto"
            onScroll={handleScroll}
          >
            {eventHistory.slice(0, displayCount).map((record, index) => {
              // Calculate solve number in descending order
              const solveNumber = eventHistory.length - index;

              return (
                <div
                  key={record.id}
                  className="bg-(--surface-elevated) rounded border border-(--border) p-2 sm:p-3 hover:bg-(--surface-elevated)/80 transition-colors"
                >
                  <div className="flex justify-between items-center gap-2 overflow-x-auto">
                    {/* Solve number and time */}
                    <div
                      className="flex items-center gap-2 sm:gap-3 cursor-pointer shrink-0"
                      onClick={() => handleSolveClick(record)}
                    >
                      <span className="text-xs sm:text-sm text-(--text-muted) font-inter shrink-0">
                        #{solveNumber}
                      </span>
                      <span
                        className={`font-mono text-base sm:text-lg font-semibold whitespace-nowrap ${
                          record.penalty === "+2"
                            ? "text-yellow-400"
                            : record.penalty === "DNF"
                              ? "text-red-400"
                              : "text-(--text-primary)"
                        }`}
                      >
                        {formatTime(record.finalTime, record.penalty)}
                        {record.penalty === "+2" && "+"}
                      </span>
                      {/* Timer Mode Badge */}
                      {record.timerMode && record.timerMode !== "normal" && (
                        <span
                          className={`text-xs px-2 py-0.5 rounded font-medium whitespace-nowrap shrink-0 ${
                            record.timerMode === "manual"
                              ? "bg-blue-500/10 text-blue-500 border border-blue-500/30"
                              : "bg-purple-500/10 text-purple-500 border border-purple-500/30"
                          }`}
                        >
                          {record.timerMode === "manual"
                            ? "Manual"
                            : "Stackmat"}
                        </span>
                      )}
                    </div>

                    {/* Inline action buttons */}
                    <div className="flex items-center gap-0.5 sm:gap-1 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSolveId(record.id);
                        }}
                        className="p-1 text-(--text-muted) hover:text-(--primary) transition-colors"
                        title="Edit solve time"
                      >
                        <Pencil className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePenaltyChange(
                            record.id,
                            record.penalty === "+2" ? "none" : "+2",
                          );
                        }}
                        className={`px-1.5 sm:px-2 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap ${
                          record.penalty === "+2"
                            ? "bg-(--warning) text-white"
                            : "bg-(--surface) text-(--text-secondary) hover:bg-(--border)"
                        }`}
                        title="Toggle +2 penalty"
                      >
                        +2
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePenaltyChange(
                            record.id,
                            record.penalty === "DNF" ? "none" : "DNF",
                          );
                        }}
                        className={`px-1.5 sm:px-2 py-1 text-xs rounded font-medium transition-colors whitespace-nowrap ${
                          record.penalty === "DNF"
                            ? "bg-(--error) text-white"
                            : "bg-(--surface) text-(--text-secondary) hover:bg-(--border)"
                        }`}
                        title="Toggle DNF penalty"
                      >
                        DNF
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSolve(record.id);
                        }}
                        className="p-1 text-(--text-muted) hover:text-(--error) transition-colors"
                        title="Delete solve"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Loading indicator */}
            {isLoading && (
              <div className="text-center py-2">
                <div className="text-sm text-(--text-muted) font-inter">
                  Loading more solves...
                </div>
              </div>
            )}

            {/* Show count info if there are more solves */}
            {displayCount < eventHistory.length && !isLoading && (
              <div className="text-center py-2 border-t border-(--border)">
                <div className="text-xs text-(--text-muted) font-inter">
                  Showing {displayCount} of {eventHistory.length} solves •
                  Scroll down for more
                </div>
              </div>
            )}

            {eventHistory.length === 0 && (
              <div className="text-center py-4 text-(--text-muted) font-inter">
                No solves yet for {getEventName(selectedEvent)}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Inline Edit Modal for history items */}
      {editingSolveId && (
        <SolveEditModal
          isOpen={true}
          onClose={() => setEditingSolveId(null)}
          currentTime={history.find((r) => r.id === editingSolveId)?.time || 0}
          currentPenalty={
            history.find((r) => r.id === editingSolveId)?.penalty || "none"
          }
          onSave={(time, penalty) =>
            handleEditTime(editingSolveId, time, penalty)
          }
        />
      )}

      {/* Solve Details Modal */}
      <SolveDetailsModal
        solve={selectedSolve}
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedSolve(null);
        }}
        onApplyPenalty={handlePenaltyChange}
        onDeleteSolve={onDeleteSolve}
        onUpdateSolve={handleUpdateSolve}
        onEditTime={handleEditTime}
      />
    </>
  );
}
