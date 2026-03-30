"use client";

import { useState, useRef, useEffect } from "react";
import { MessageSquarePlus, Pencil, Trash2, Check, X } from "lucide-react";
import { Session } from "./ChatInterface";

interface ChatHeaderProps {
  currentSession: Session | null;
  onOpenSessionModal: () => void;
  onUpdateSession: (sessionId: string, title: string) => Promise<void>;
  onDeleteSession: (sessionId: string) => void;
}

export default function ChatHeader({
  currentSession,
  onOpenSessionModal,
  onUpdateSession,
  onDeleteSession,
}: ChatHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingTitle, setEditingTitle] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const editInputRef = useRef<HTMLInputElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditing && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [isEditing]);

  const handleStartEdit = () => {
    if (!currentSession) return;
    setIsEditing(true);
    setEditingTitle(currentSession.title);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditingTitle("");
  };

  const handleSaveEdit = async () => {
    if (!currentSession || !editingTitle.trim() || isUpdating) return;

    setIsUpdating(true);
    try {
      await onUpdateSession(currentSession.session_id, editingTitle.trim());
      setIsEditing(false);
      setEditingTitle("");
    } catch (error) {
      console.error("Failed to update session:", error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleEditKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSaveEdit();
    } else if (e.key === "Escape") {
      handleCancelEdit();
    }
  };

  const handleDelete = () => {
    if (!currentSession) return;
    if (confirm("Are you sure you want to delete this chat session?")) {
      onDeleteSession(currentSession.session_id);
    }
  };

  return (
    <div className="border-b border-(--border) bg-(--surface) px-3 md:px-4 lg:px-6 py-3 md:py-4 shrink-0">
      <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-3">
        {/* Session Management Button */}
        <button
          onClick={onOpenSessionModal}
          className="p-2 hover:bg-(--surface-elevated) rounded-lg transition-colors shrink-0"
          title="View all sessions"
        >
          <MessageSquarePlus className="w-5 h-5 text-(--primary)" />
        </button>

        {/* Session Title / Edit Mode */}
        <div className="flex-1 min-w-0">
          {currentSession ? (
            isEditing ? (
              <div className="flex items-center gap-2">
                <input
                  ref={editInputRef}
                  type="text"
                  value={editingTitle}
                  onChange={(e) => setEditingTitle(e.target.value)}
                  onKeyDown={handleEditKeyDown}
                  className="flex-1 px-3 py-1.5 text-sm md:text-base bg-(--surface-elevated) border border-(--primary) rounded-lg outline-none font-inter text-(--text-primary) min-w-0"
                  disabled={isUpdating}
                  placeholder="Chat title..."
                />
                <button
                  onClick={handleSaveEdit}
                  disabled={isUpdating || !editingTitle.trim()}
                  className="p-2 hover:bg-(--success)/20 rounded-lg transition-colors disabled:opacity-50 shrink-0"
                  title="Save"
                >
                  <Check className="w-4 h-4 md:w-5 md:h-5 text-(--success)" />
                </button>
                <button
                  onClick={handleCancelEdit}
                  disabled={isUpdating}
                  className="p-2 hover:bg-(--error)/20 rounded-lg transition-colors shrink-0"
                  title="Cancel"
                >
                  <X className="w-4 h-4 md:w-5 md:h-5 text-(--error)" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-base md:text-lg font-semibold text-(--text-primary) truncate font-statement flex-1">
                  {currentSession.title}
                </h1>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                  <button
                    onClick={handleStartEdit}
                    className="p-1.5 hover:bg-(--primary)/20 rounded-lg transition-colors"
                    title="Edit title"
                  >
                    <Pencil className="w-4 h-4 text-(--primary)" />
                  </button>
                  <button
                    onClick={handleDelete}
                    className="p-1.5 hover:bg-(--error)/20 rounded-lg transition-colors"
                    title="Delete session"
                  >
                    <Trash2 className="w-4 h-4 text-(--error)" />
                  </button>
                </div>
              </div>
            )
          ) : (
            <h1 className="text-base md:text-lg font-semibold text-(--text-primary) font-statement">
              New Chat
            </h1>
          )}
        </div>

        {/* Session Info */}
        {currentSession && !isEditing && (
          <div className="hidden md:flex items-center gap-2 text-xs text-(--text-muted) font-inter shrink-0">
            <span>{currentSession.message_count || 0} messages</span>
          </div>
        )}
      </div>
    </div>
  );
}
