"use client";

import { X, Trash2, AlertTriangle } from "lucide-react";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  isDeleting: boolean;
  sessionTitle: string;
}

export default function DeleteConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  isDeleting,
  sessionTitle,
}: DeleteConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-(--surface) border border-(--border) rounded-xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--error)/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-(--error)" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-(--text-primary) font-statement">
              Delete Chat?
            </h2>
          </div>
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors disabled:opacity-50"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-(--text-secondary) font-inter">
            Are you sure you want to delete this chat session?
          </p>

          <div className="p-3 bg-(--surface-elevated) border border-(--border) rounded-lg">
            <p className="text-sm font-medium text-(--text-primary) font-inter truncate">
              {sessionTitle}
            </p>
          </div>

          <div className="flex items-start gap-2 p-3 bg-(--error)/10 border border-(--error)/20 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-(--error) shrink-0 mt-0.5" />
            <p className="text-xs text-(--error) font-inter">
              This action cannot be undone. All messages in this chat will be
              permanently deleted.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-4 border-t border-(--border) bg-(--surface-elevated)">
          <button
            onClick={onClose}
            disabled={isDeleting}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-(--surface) hover:bg-(--surface-elevated) border border-(--border) text-(--text-primary) rounded-lg transition-colors font-button text-sm disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={isDeleting}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-(--error) hover:bg-(--error)/90 text-white rounded-lg transition-colors font-button text-sm disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {isDeleting ? (
              "Deleting..."
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Chat
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}