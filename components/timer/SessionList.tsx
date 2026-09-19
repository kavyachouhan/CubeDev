"use client";

import { useState } from "react";
import type { KeyboardEvent } from "react";
import { Check, Edit2, FolderOpen, Plus, Trash2, X } from "lucide-react";
import { cx } from "@/lib/cx";
import { Input } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";

export interface TimerSession {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

interface SessionListProps {
  currentSession: TimerSession;
  sessions: TimerSession[];
  onSessionChange: (session: TimerSession) => void;
  onCreateSession: (name: string, event: string) => Promise<void>;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
  getSolveCount: (sessionId: string) => number;
  /** Called after a session is picked or created. */
  onDone: () => void;
}

/**
 * Pick, create, rename and delete sessions. Rendered inside a Popover, which
 * is an anchored panel on desktop and a bottom sheet on phones.
 */
export default function SessionList({
  currentSession,
  sessions,
  onSessionChange,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  getSolveCount,
  onDone,
}: SessionListProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [renameValue, setRenameValue] = useState("");
  const [busy, setBusy] = useState(false);

  const resetCreate = () => {
    setIsCreating(false);
    setNewName("");
  };

  const resetRename = () => {
    setRenamingId(null);
    setRenameValue("");
  };

  const create = async () => {
    if (!newName.trim() || busy) return;
    setBusy(true);
    try {
      await onCreateSession(newName.trim(), currentSession.event);
      resetCreate();
      onDone();
    } finally {
      setBusy(false);
    }
  };

  const rename = (sessionId: string) => {
    if (!renameValue.trim()) return;
    onRenameSession(sessionId, renameValue.trim());
    resetRename();
  };

  // Escape cancels the inline edit instead of closing the whole panel.
  const editKeys = (onEnter: () => void, onCancel: () => void) => (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      onEnter();
    } else if (e.key === "Escape") {
      // preventDefault tells the surrounding layer not to close.
      e.preventDefault();
      onCancel();
    }
  };

  return (
    <div className="space-y-1">
      <div className="p-1 pb-2 mb-1 border-b border-(--border)">
        {isCreating ? (
          <Input
            size="md"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            placeholder="Session name"
            aria-label="New session name"
            maxLength={60}
            data-autofocus
            onKeyDown={editKeys(create, resetCreate)}
            trailing={
              <span className="flex items-center gap-0.5">
                <IconButton
                  size="sm"
                  variant="primary"
                  aria-label="Create session"
                  icon={<Check />}
                  onClick={create}
                  disabled={!newName.trim() || busy}
                />
                <IconButton
                  size="sm"
                  aria-label="Cancel"
                  icon={<X />}
                  onClick={resetCreate}
                />
              </span>
            }
            className="[&_input]:pr-20!"
          />
        ) : (
          <button
            type="button"
            data-menu-item
            onClick={() => {
              resetRename();
              setIsCreating(true);
            }}
            className="w-full min-h-11 sm:min-h-9 flex items-center gap-3 px-3 rounded-(--radius-control) text-sm font-medium font-inter text-(--primary) hover:bg-(--primary)/10 transition-colors"
          >
            <Plus className="w-4 h-4" aria-hidden />
            New session
          </button>
        )}
      </div>

      <ul className="space-y-0.5" aria-label="Sessions">
        {sessions.map((session) => {
          const active = session.id === currentSession.id;
          const count = getSolveCount(session.id);

          if (renamingId === session.id) {
            return (
              <li key={session.id} className="p-1">
                <Input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  aria-label={`Rename ${session.name}`}
                  maxLength={60}
                  autoFocus
                  onKeyDown={editKeys(() => rename(session.id), resetRename)}
                  trailing={
                    <span className="flex items-center gap-0.5">
                      <IconButton
                        size="sm"
                        variant="primary"
                        aria-label="Save name"
                        icon={<Check />}
                        onClick={() => rename(session.id)}
                      />
                      <IconButton
                        size="sm"
                        aria-label="Cancel renaming"
                        icon={<X />}
                        onClick={resetRename}
                      />
                    </span>
                  }
                  className="[&_input]:pr-20!"
                />
              </li>
            );
          }

          return (
            <li
              key={session.id}
              className={cx(
                "group flex items-center gap-1 rounded-(--radius-control) transition-colors",
                active ? "bg-(--primary)/10" : "hover:bg-(--surface-elevated)",
              )}
            >
              <button
                type="button"
                data-menu-item
                data-autofocus={active ? true : undefined}
                aria-current={active ? "true" : undefined}
                onClick={() => {
                  onSessionChange(session);
                  onDone();
                }}
                className="flex-1 min-w-0 min-h-11 flex items-center gap-3 px-3 py-2 text-left rounded-(--radius-control)"
              >
                <span
                  className={cx(
                    "shrink-0 inline-flex items-center justify-center w-8 h-8 rounded-(--radius-control)",
                    active ? "bg-(--primary) text-(--on-primary)" : "bg-(--primary)/12 text-(--primary)",
                  )}
                >
                  <FolderOpen className="w-4 h-4" aria-hidden />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-statement text-(--text-primary) truncate">
                    {session.name}
                  </span>
                  <span className="block type-caption">
                    {count} {count === 1 ? "solve" : "solves"}
                  </span>
                </span>
                {active && <Check className="w-4 h-4 shrink-0 text-(--primary)" aria-hidden />}
              </button>
              <span className="flex items-center gap-0.5 pr-1 shrink-0 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 pointer-coarse:opacity-100 transition-opacity">
                <IconButton
                  size="sm"
                  aria-label={`Rename ${session.name}`}
                  icon={<Edit2 />}
                  onClick={() => {
                    resetCreate();
                    setRenamingId(session.id);
                    setRenameValue(session.name);
                  }}
                />
                {sessions.length > 1 && (
                  <IconButton
                    size="sm"
                    variant="danger"
                    aria-label={`Delete ${session.name}`}
                    icon={<Trash2 />}
                    onClick={() => onDeleteSession(session.id)}
                  />
                )}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
