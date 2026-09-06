"use client";

import { useState } from "react";
import {
  Plus,
  Edit2,
  Trash2,
  FolderOpen,
  Check,
  X,
} from "lucide-react";
import BottomSheet from "@/components/ui/BottomSheet";

export interface TimerSession {
  id: string;
  name: string;
  event: string;
  createdAt: Date;
  solveCount: number;
  convexId?: string;
}

interface SessionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  currentSession: TimerSession;
  sessions: TimerSession[];
  onSessionChange: (session: TimerSession) => void;
  onCreateSession: (name: string, event: string) => Promise<void>;
  onRenameSession: (sessionId: string, newName: string) => void;
  onDeleteSession: (sessionId: string) => void;
  getSolveCount: (sessionId: string) => number;
}

export default function SessionBottomSheet({
  isOpen,
  onClose,
  currentSession,
  sessions,
  onSessionChange,
  onCreateSession,
  onRenameSession,
  onDeleteSession,
  getSolveCount,
}: SessionBottomSheetProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [isRenaming, setIsRenaming] = useState<string | null>(null);
  const [newSessionName, setNewSessionName] = useState("");
  const [renameValue, setRenameValue] = useState("");

  const resetCreate = () => {
    setIsCreating(false);
    setNewSessionName("");
  };

  const resetRename = () => {
    setIsRenaming(null);
    setRenameValue("");
  };

  const handleClose = () => {
    resetCreate();
    resetRename();
    onClose();
  };

  const handleCreateSession = async () => {
    if (!newSessionName.trim()) return;
    await onCreateSession(newSessionName.trim(), currentSession.event);
    resetCreate();
    handleClose();
  };

  const handleRenameSession = (sessionId: string) => {
    if (!renameValue.trim()) return;
    onRenameSession(sessionId, renameValue.trim());
    resetRename();
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={handleClose} title="Session">
      <div className="mb-2">
        {isCreating ? (
          <div className="relative">
            <input
              type="text"
              value={newSessionName}
              onChange={(e) => setNewSessionName(e.target.value)}
              placeholder="Session name..."
              className="w-full min-h-11 px-3 py-2.5 pr-16 bg-(--background) border border-(--border) rounded-xl text-sm font-inter text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  e.stopPropagation();
                  handleCreateSession();
                }
                if (e.key === "Escape") {
                  e.preventDefault();
                  e.stopPropagation();
                  resetCreate();
                }
                if (e.key === " ") {
                  e.stopPropagation();
                }
              }}
            />
            <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
              <button
                onClick={handleCreateSession}
                className="p-2.5 bg-(--success) text-white rounded-lg hover:opacity-90 transition-opacity"
                title="Create session"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={resetCreate}
                className="p-2.5 bg-(--error)/15 text-(--error) border border-(--error)/30 rounded-lg hover:bg-(--error)/25 transition-colors"
                title="Cancel"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => {
              resetRename();
              setIsCreating(true);
            }}
            className="w-full min-h-11 flex items-center gap-3 px-4 py-3 text-(--primary) hover:bg-(--surface-elevated) rounded-xl transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium font-button">New Session</span>
          </button>
        )}
      </div>

      <div className="space-y-1">
        {sessions.map((session) => {
          const isActive = session.id === currentSession.id;

          return (
            <div
              key={session.id}
              className={`flex items-center justify-between rounded-xl transition-colors ${
                isActive
                  ? "bg-(--primary)/10"
                  : "hover:bg-(--surface-elevated)"
              }`}
            >
              <div className="flex-1 min-w-0">
                {isRenaming === session.id ? (
                  <div className="relative p-2">
                    <input
                      type="text"
                      value={renameValue}
                      onChange={(e) => setRenameValue(e.target.value)}
                      className="w-full min-h-11 px-3 py-2 pr-16 bg-(--background) border border-(--border) rounded-xl text-sm font-inter text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          e.stopPropagation();
                          handleRenameSession(session.id);
                        }
                        if (e.key === "Escape") {
                          e.preventDefault();
                          e.stopPropagation();
                          resetRename();
                        }
                        if (e.key === " ") {
                          e.stopPropagation();
                        }
                      }}
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => handleRenameSession(session.id)}
                        className="p-2.5 bg-(--success) text-white rounded-lg hover:opacity-90 transition-opacity"
                        title="Save changes"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={resetRename}
                        className="p-2.5 bg-(--error)/15 text-(--error) border border-(--error)/30 rounded-lg hover:bg-(--error)/25 transition-colors"
                        title="Cancel editing"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      onSessionChange(session);
                      handleClose();
                    }}
                    className="w-full min-h-11 flex items-center gap-3 px-3 py-3 text-left"
                  >
                    <div className="w-8 h-8 bg-(--primary)/15 text-(--primary) rounded-lg flex items-center justify-center shrink-0">
                      <FolderOpen className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-medium text-(--text-primary) font-statement truncate">
                        {session.name}
                      </div>
                      <div className="text-xs text-(--text-muted) font-inter truncate">
                        {getSolveCount(session.id)} solves
                      </div>
                    </div>
                    {isActive && (
                      <Check className="w-4 h-4 text-(--primary) shrink-0" />
                    )}
                  </button>
                )}
              </div>

              {isRenaming !== session.id && (
                <div className="flex items-center gap-0.5 pr-2 shrink-0">
                  <button
                    onClick={() => {
                      resetCreate();
                      setIsRenaming(session.id);
                      setRenameValue(session.name);
                    }}
                    className="p-2.5 text-(--text-muted) hover:text-(--primary) hover:bg-(--surface) rounded-lg transition-colors"
                    title="Rename session"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  {sessions.length > 1 && (
                    <button
                      onClick={() => onDeleteSession(session.id)}
                      className="p-2.5 text-(--text-muted) hover:text-(--error) hover:bg-(--surface) rounded-lg transition-colors"
                      title="Delete session"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </BottomSheet>
  );
}