"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { X } from "lucide-react";

interface EditRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: {
    _id: string;
    roomId: string;
    name: string;
    description?: string;
    format: string;
    expiresAt: number;
  };
}

export default function EditRoomModal({
  isOpen,
  onClose,
  room,
}: EditRoomModalProps) {
  const { user } = useUser();
  const [formData, setFormData] = useState({
    title: room.name,
    description: room.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateRoom = useMutation(api.challengeRooms.updateRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user?.convexId) return;

    setIsSubmitting(true);
    try {
      await updateRoom({
        userId: user.convexId,
        roomId: room.roomId,
        title: formData.title,
        description: formData.description,
      });
      onClose();
    } catch (error) {
      console.error("Failed to update room:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
            Edit Challenge Room
          </h2>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Room Title
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter"
              placeholder="Enter room title..."
              required
              maxLength={100}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter"
              placeholder="Enter room description..."
              maxLength={500}
            />
          </div>

          <div className="timer-card bg-[var(--surface-elevated)] p-4 border border-[var(--border)]">
            <h3 className="text-sm font-medium text-[var(--text-primary)] mb-3 font-statement">
              Room Settings
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)] font-inter">
                  Solves:
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  {room.format === "ao5" ? "5" : "12"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-[var(--text-muted)] font-inter">
                  Expires:
                </span>
                <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                  {new Date(room.expiresAt).toLocaleString()}
                </span>
              </div>
            </div>
            <p className="text-xs text-[var(--text-muted)] mt-3 font-inter">
              Note: Solve count and expiration cannot be changed after room
              creation.
            </p>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 btn-secondary"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}