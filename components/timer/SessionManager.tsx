"use client";

import {
  ChevronDown,
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Check,
  X,
  Eye,
  EyeOff,
} from "lucide-react";
import React, {
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

interface Session {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

interface SessionManagerProps {
  currentSession: Session;
  sessions: Session[];
  onSessionChange: (session: Session) => void;
  onCreateSession: (name: string, event: string) => Promise<void>;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
  allSolveHistory?: Array<{ sessionId: string; [key: string]: any }>;
}

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
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export default function SessionManager({
  currentSession,
  sessions,
  onSessionChange,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  allSolveHistory = [],
}: SessionManagerProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-session-manager-expanded",
    true
  );

  // Helper function to get display name for events
  const getEventName = (eventId: string): string => {
    const eventMap: { [key: string]: string } = {
      "333": "3x3",
      "222": "2x2",
      "444": "4x4",
      "555": "5x5",
      "666": "6x6",
      "777": "7x7",
      "333oh": "3x3 OH",
      "333bld": "3x3 BLD",
      "444bld": "4x4 BLD",
      "555bld": "5x5 BLD",
      "333mbld": "3x3 MBLD",
      "333fm": "3x3 FM",
      pyram: "Pyraminx",
      minx: "Megaminx",
      skewb: "Skewb",
      clock: "Clock",
      sq1: "Square-1",
    };

    return eventMap[eventId] || eventId;
  };

  // Helper to count solves in a session
  const getLiveSolveCount = (sessionId: string) => {
    return allSolveHistory.filter((solve) => solve.sessionId === sessionId)
      .length;
  };

  // Body visibility state (for accessibility and to prevent interaction during collapse)
  const [isBodyVisible, setIsBodyVisible] = useState<boolean>(isExpanded);

  // Refs to measure heights
  const cardRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Max height for smooth transition
  const [maxH, setMaxH] = useState<number>(0);

  // Function to measure heights
  const measureHeights = useMemo(
    () => () => {
      const card = cardRef.current;
      const header = headerRef.current;
      const body = bodyRef.current;
      if (!card || !header || !body) return { collapsed: 0, expanded: 0 };

      const styles = getComputedStyle(card);
      const padY =
        parseFloat(styles.paddingTop || "0") +
        parseFloat(styles.paddingBottom || "0");
      const headerH = header.offsetHeight;
      const bodyH = body.scrollHeight; // use scrollHeight to get full height even if not visible

      return {
        collapsed: Math.ceil(headerH + padY),
        expanded: Math.ceil(headerH + bodyH + padY),
      };
    },
    []
  );

  // Initial layout
  useLayoutEffect(() => {
    const { collapsed, expanded } = measureHeights();
    setMaxH(isExpanded ? expanded : collapsed);
    setIsBodyVisible(isExpanded);
  }, []);

  // Adjust max height on expand/collapse, scramble change, or resize
  useEffect(() => {
    const apply = () => {
      const { collapsed, expanded } = measureHeights();
      setMaxH(isExpanded ? expanded : collapsed);
    };
    apply();

    const ro = new ResizeObserver(apply);
    if (cardRef.current) ro.observe(cardRef.current);
    if (bodyRef.current) ro.observe(bodyRef.current);
    if (headerRef.current) ro.observe(headerRef.current);
    window.addEventListener("resize", apply);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", apply);
    };
  }, [isExpanded, sessions.length, currentSession.name, measureHeights]);

  // After expand animation ends, show body content
  useEffect(() => {
    const el = cardRef.current;
    if (!el) return;
    const onEnd = (e: TransitionEvent) => {
      if (e.propertyName !== "max-height") return;
      if (isExpanded) setIsBodyVisible(true);
    };
    el.addEventListener("transitionend", onEnd);
    return () => el.removeEventListener("transitionend", onEnd);
  }, [isExpanded]);

  // Toggle expand/collapse
  const toggleExpanded = () => {
    if (isExpanded) {
      // collapsing: hide body first, then shrink
      setIsBodyVisible(false);
      setIsExpanded(false);
    } else {
      // expanding: expand first, then show body
      setIsExpanded(true);
    }
  };

  // Close dropdown on outside click
  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node)
      ) {
        setIsDropdownOpen(false);
        setIsCreating(false);
        setIsRenaming(null);
        setNewSessionName("");
        setRenameValue("");
      }
    };
    if (isDropdownOpen) {
      document.addEventListener("mousedown", onDoc);
      return () => document.removeEventListener("mousedown", onDoc);
    }
  }, [isDropdownOpen]);

  // Create session handler
  const handleCreateSession = async () => {
    if (newSessionName.trim()) {
      await onCreateSession(newSessionName.trim(), currentSession.event);
      setNewSessionName("");
      setIsCreating(false);
      setIsDropdownOpen(false);
    }
  };

  const handleRenameSession = (sessionId: string) => {
    if (renameValue.trim()) {
      onRenameSession(sessionId, renameValue.trim());
      setRenameValue("");
      setIsRenaming(null);
    }
  };

  const handleDeleteSession = (sessionId: string) => {
    if (sessions.length > 1) onDeleteSession(sessionId);
  };

  return (
    <div
      ref={cardRef}
      className={[
        "timer-card",
        "transition-[max-height] duration-300 ease-in-out",
        isDropdownOpen ? "relative z-[60]" : "",
      ].join(" ")}
      style={{
        maxHeight: maxH ? `${maxH}px` : undefined,
        overflow: isExpanded && isBodyVisible ? "visible" : "hidden",
      }}
    >
      {/* Header */}
      <div
        ref={headerRef}
        className={`flex items-center justify-between ${
          isExpanded ? "mb-4" : "mb-0"
        }`}
      >
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Session
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={toggleExpanded}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={isExpanded ? "Hide session details" : "Show session details"}
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {/* Body */}
      <div
        ref={bodyRef}
        className={
          isBodyVisible
            ? "pb-4"
            : "invisible pointer-events-none select-none pb-4"
        }
        aria-hidden={!isBodyVisible}
      >
        <div className="relative" ref={dropdownRef}>
          {/* Dropdown button */}
          <button
            onClick={() => setIsDropdownOpen((v) => !v)}
            className="w-full flex items-center justify-between p-2 md:p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
          >
            <div className="flex items-center gap-2 md:gap-3 min-w-0 flex-1">
              <FolderOpen className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
              <div className="text-left min-w-0 flex-1">
                <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                  {currentSession.name}
                </div>
                <div className="text-xs text-[var(--text-muted)] font-inter truncate">
                  {getEventName(currentSession.event)} •{" "}
                  {getLiveSolveCount(currentSession.id)} solves
                </div>
              </div>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-[var(--text-secondary)] transition-transform flex-shrink-0 ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
            />
          </button>

          {/* Dropdown */}
          {isDropdownOpen && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-80 overflow-hidden">
              {/* Create New Session */}
              <div className="p-3 border-b border-[var(--border)] bg-[var(--surface-elevated)]">
                {isCreating ? (
                  <div className="relative">
                    <input
                      type="text"
                      value={newSessionName}
                      onChange={(e) => setNewSessionName(e.target.value)}
                      placeholder="Session name..."
                      className="w-full px-3 py-2 pr-16 bg-[var(--background)] border border-[var(--border)] rounded-md text-sm font-inter text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleCreateSession();
                        }
                        if (e.key === "Escape") {
                          setIsCreating(false);
                          setNewSessionName("");
                        }
                        // Prevent spacebar from triggering timer events
                        if (e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                    />
                    <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={handleCreateSession}
                        className="p-1.5 bg-[var(--surface)] text-white rounded hover:bg-[var(--success)]/80 transition-colors"
                        title="Create session"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => {
                          setIsCreating(false);
                          setNewSessionName("");
                        }}
                        className="p-1.5 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] rounded transition-colors"
                        title="Cancel"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setIsCreating(true)}
                    className="w-full flex items-center gap-2 p-2 text-[var(--primary)] hover:bg-[var(--surface)] rounded-md transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span className="text-sm font-medium font-button">
                      New Session
                    </span>
                  </button>
                )}
              </div>

              {/* Session list */}
              <div className="max-h-56 overflow-y-auto">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className={`group flex items-center justify-between p-3 hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/50 last:border-b-0 ${
                      session.id === currentSession.id
                        ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                        : "bg-[var(--background)]"
                    }`}
                  >
                    <div
                      className="flex-1 cursor-pointer min-w-0 pr-3"
                      onClick={() => {
                        if (isRenaming !== session.id) {
                          onSessionChange(session);
                          setIsDropdownOpen(false);
                        }
                      }}
                    >
                      {isRenaming === session.id ? (
                        <div className="relative">
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="w-full px-2 py-1 pr-14 bg-[var(--surface-elevated)] border border-[var(--border)] rounded text-sm font-inter text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                e.stopPropagation();
                                handleRenameSession(session.id);
                              }
                              if (e.key === "Escape") {
                                setIsRenaming(null);
                                setRenameValue("");
                              }
                              // Prevent spacebar from triggering timer events
                              if (e.key === " ") {
                                e.stopPropagation();
                              }
                            }}
                          />
                          <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-0.5">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRenameSession(session.id);
                              }}
                              className="p-1 bg-[var(--surface)] text-white rounded hover:bg-[var(--success)]/80 transition-colors"
                              title="Save changes"
                            >
                              <Check className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setIsRenaming(null);
                                setRenameValue("");
                              }}
                              className="p-1 bg-[var(--surface)] border border-[var(--border)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border-hover)] rounded transition-colors"
                              title="Cancel editing"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-[var(--text-primary)] font-statement truncate">
                            {session.name}
                          </div>
                          <div className="text-xs text-[var(--text-muted)] font-inter truncate">
                            {getEventName(session.event)} •{" "}
                            {getLiveSolveCount(session.id)} solves
                          </div>
                        </div>
                      )}
                    </div>

                    {isRenaming !== session.id && (
                      <div className="flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setIsRenaming(session.id);
                            setRenameValue(session.name);
                          }}
                          className="p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--surface)] rounded-md transition-colors"
                          title="Rename session"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        {sessions.length > 1 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteSession(session.id);
                            }}
                            className="p-2 text-[var(--text-muted)] hover:text-[var(--error)] hover:bg-[var(--surface)] rounded-md transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}