"use client";

import { useState, useRef, useEffect } from "react";
import { X, MessageSquare, Pencil, Trash2, Check, Plus } from "lucide-react";
import { Session } from "./ChatInterface";
import DeleteConfirmationModal from "./DeleteConfirmationModal";

interface SessionManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: Session[];
  currentSession: Session | null;
  onSelectSession: (sessionId: string) => void;
  onNewChat: () => void;
  onDeleteSession: (sessionId: string) => void;
  onUpdateSession: (sessionId: string, title: string) => Promise<void>;
}

export default function SessionManagementModal({
  isOpen,
  onClose,
  sessions,
  currentSession,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onUpdateSession,
}: SessionManagementModalProps) {
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [deleteSessionId, setDeleteSessionId] = useState<string | null>(null);
  const [deleteSessionTitle, setDeleteSessionTitle] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus the input when entering edit mode
  useEffect(() => {
    if (editingSessionId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingSessionId]);

  const handleStartEdit = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setEditingSessionId(session.session_id);
    setEditingTitle(session.title);
  };

  const handleCancelEdit = () => {
    setEditingSessionId(null);
    setEditingTitle("");
  };

  const handleSaveEdit = async (sessionId: string) => {
    if (!editingTitle.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      await onUpdateSession(sessionId, editingTitle.trim());
      setEditingSessionId(null);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent, sessionId: string) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit(sessionId);
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleNewChat = () => {
    onNewChat();
    onClose();
  };

  const handleSelectSession = (session: Session) => {
    // Notify other parts of the app that a session has been loaded
    window.dispatchEvent(
      new CustomEvent("cubie-session-loaded", {
        detail: {
          sessionId: session.session_id,
          title: session.title,
        },
      })
    );
    onSelectSession(session.session_id);
    onClose();
  };

  const handleDeleteClick = (e: React.MouseEvent, session: Session) => {
    e.stopPropagation();
    setDeleteSessionId(session.session_id);
    setDeleteSessionTitle(session.title);
  };

  const handleConfirmDelete = async () => {
    if (!deleteSessionId) return;

    setIsDeleting(true);
    try {
      await onDeleteSession(deleteSessionId);
      setDeleteSessionId(null);
      setDeleteSessionTitle("");
    } catch (error) {
      console.error("Failed to delete session:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    if (!isDeleting) {
      setDeleteSessionId(null);
      setDeleteSessionTitle("");
    }
  };

  if (!isOpen) return null;

  // Sort sessions by updated_at descending
  const sortedSessions = [...sessions].sort((a, b) => {
    return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
  });

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-(--surface) border border-(--border) rounded-xl max-w-md w-full max-h-[80vh] overflow-hidden flex flex-col shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <h2 className="text-lg md:text-xl font-bold text-(--text-primary) font-statement">
            Chat Sessions
          </h2>
          <div className="flex items-center gap-2">
            {/* New Chat Icon Button */}
            <button
              onClick={handleNewChat}
              className="p-2 hover:bg-(--primary)/20 text-(--primary) rounded-lg transition-colors"
              title="New chat"
            >
              <Plus className="w-5 h-5" />
            </button>
            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-2">
          {sessions.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageSquare className="w-12 h-12 text-(--text-muted) mb-3" />
              <p className="text-sm text-(--text-muted) font-inter text-center">
                No conversations yet
              </p>
              <p className="text-xs text-(--text-muted) font-inter text-center mt-1">
                Start a new chat to begin
              </p>
            </div>
          ) : (
            <div className="space-y-1">
              {sortedSessions.map((session) => {
                const isActive =
                  currentSession?.session_id === session.session_id;
                const isEditing = editingSessionId === session.session_id;

                return (
                  <div
                    key={session.session_id}
                    className={`p-3 rounded-lg border transition-all duration-300 ease-in-out ${
                      isActive
                        ? "bg-(--primary)/10 border-(--primary)"
                        : "bg-(--surface-elevated) border-(--border) hover:border-(--primary)/50"
                    }`}
                  >
                    {isEditing ? (
                      <div
                        className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="flex items-center gap-2 flex-1 min-w-0">
                          <MessageSquare
                            className={`w-4 h-4 shrink-0 ${
                              isActive
                                ? "text-(--primary)"
                                : "text-(--text-muted)"
                            }`}
                          />
                          <input
                            ref={editInputRef}
                            type="text"
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            onKeyDown={(e) =>
                              handleEditKeyDown(e, session.session_id)
                            }
                            className="flex-1 px-2 py-1 text-sm bg-(--surface) border border-(--primary) rounded outline-none font-inter text-(--text-primary) min-w-0"
                            disabled={isUpdating}
                            placeholder="Session title..."
                          />
                        </div>
                        <div className="flex items-center gap-2 justify-end sm:justify-start shrink-0">
                          <button
                            onClick={() => handleSaveEdit(session.session_id)}
                            disabled={isUpdating || !editingTitle.trim()}
                            className="p-1.5 hover:bg-(--success)/20 rounded transition-colors disabled:opacity-50"
                            title="Save"
                          >
                            <Check className="w-4 h-4 text-(--success)" />
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            disabled={isUpdating}
                            className="p-1.5 hover:bg-(--error)/20 rounded transition-colors"
                            title="Cancel"
                          >
                            <X className="w-4 h-4 text-(--error)" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSelectSession(session)}
                          className="flex-1 text-left min-w-0 flex items-start gap-2"
                        >
                          <MessageSquare
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isActive
                                ? "text-(--primary)"
                                : "text-(--text-muted)"
                            }`}
                          />
                          <div className="flex-1 min-w-0">
                            <p
                              className={`text-sm font-medium truncate font-inter ${
                                isActive
                                  ? "text-(--primary)"
                                  : "text-(--text-primary)"
                              }`}
                              title={session.title}
                            >
                              {session.title}
                            </p>
                            <p className="text-xs text-(--text-muted) mt-0.5 font-inter">
                              {session.message_count || 0} messages
                            </p>
                          </div>
                        </button>
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            onClick={(e) => handleStartEdit(e, session)}
                            className="p-1.5 hover:bg-(--primary)/20 rounded transition-colors"
                            title="Edit title"
                          >
                            <Pencil className="w-4 h-4 text-(--primary)" />
                          </button>
                          <button
                            onClick={(e) => handleDeleteClick(e, session)}
                            className="p-1.5 hover:bg-(--error)/20 rounded transition-colors"
                            title="Delete session"
                          >
                            <Trash2 className="w-4 h-4 text-(--error)" />
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-(--border) bg-(--surface-elevated)">
          <p className="text-xs text-(--text-muted) text-center font-inter">
            {sessions.length} {sessions.length === 1 ? "chat" : "chats"} total
          </p>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteSessionId !== null}
        onClose={handleCancelDelete}
        onConfirm={handleConfirmDelete}
        isDeleting={isDeleting}
        sessionTitle={deleteSessionTitle}
      />
    </div>
  );
}