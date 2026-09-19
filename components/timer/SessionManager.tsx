"use client";

import { useEffect, useState } from "react";
import { ChevronDown, FolderOpen } from "lucide-react";
import { CollapsibleCard } from "@/components/ui/Card";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { Popover } from "@/components/ui/Menu";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import SessionList from "./SessionList";
import type { TimerSession } from "./SessionList";

type Session = TimerSession;

interface SessionManagerProps {
  currentSession: Session;
  sessions: Session[];
  onSessionChange: (session: Session) => void;
  onCreateSession: (name: string, event: string) => Promise<void>;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
  allSolveHistory?: ReadonlyArray<{ sessionId: string }>;
}

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
    } catch {
      // Storage can be unavailable (private mode); the preference just won't persist.
    }
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
  const [isExpanded, setIsExpanded] = usePersistentBool(
    "cubelab-session-manager-expanded",
    true,
  );

  const getLiveSolveCount = (sessionId: string) =>
    allSolveHistory.filter((solve) => solve.sessionId === sessionId).length;

  const sessionDelete = useConfirmDelete<Session>(async (session) => {
    await onDeleteSession(session.id);
  });

  const requestDeleteSession = (sessionId: string) => {
    if (sessions.length <= 1) return;
    const session = sessions.find((item) => item.id === sessionId);
    if (session) sessionDelete.request(session);
  };

  const currentCount = getLiveSolveCount(currentSession.id);

  return (
    <CollapsibleCard title="Session" open={isExpanded} onOpenChange={setIsExpanded}>
      <Popover
        title="Sessions"
        className="w-[min(24rem,calc(100vw-1rem))]"
        trigger={(props) => (
          <button
            {...props}
            type="button"
            className="input input-lg flex items-center gap-3 text-left"
          >
            <span className="shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-(--radius-control) bg-(--primary) text-(--on-primary)">
              <FolderOpen className="w-4 h-4" aria-hidden />
            </span>
            <span className="flex-1 min-w-0">
              <span className="block font-statement text-(--text-primary) truncate">
                {currentSession.name}
              </span>
              <span className="block type-caption">
                {currentCount} {currentCount === 1 ? "solve" : "solves"}
              </span>
            </span>
            <ChevronDown
              aria-hidden
              className={`w-4 h-4 shrink-0 text-(--text-muted) transition-transform ${
                props["aria-expanded"] ? "rotate-180" : ""
              }`}
            />
          </button>
        )}
      >
        {(close) => (
          <SessionList
            currentSession={currentSession}
            sessions={sessions}
            onSessionChange={onSessionChange}
            onCreateSession={onCreateSession}
            onRenameSession={onRenameSession}
            onDeleteSession={requestDeleteSession}
            getSolveCount={getLiveSolveCount}
            onDone={close}
          />
        )}
      </Popover>

      <ConfirmDeleteModal
        isOpen={sessionDelete.isOpen}
        onClose={sessionDelete.cancel}
        onConfirm={sessionDelete.confirm}
        isDeleting={sessionDelete.isDeleting}
        title="Delete Session?"
        description="Are you sure you want to delete this session?"
        itemName={sessionDelete.target?.name}
        warning={`This will permanently delete the session and all ${
          sessionDelete.target ? getLiveSolveCount(sessionDelete.target.id) : 0
        } of its solves.`}
        confirmLabel="Delete Session"
      />
    </CollapsibleCard>
  );
}
