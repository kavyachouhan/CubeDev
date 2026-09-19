"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { Field, Input, Textarea } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";

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
  const toast = useToast();
  const [formData, setFormData] = useState({
    title: room.name,
    description: room.description || "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateRoom = useMutation(api.challengeRooms.updateRoom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting || !user?.convexId) return;

    setIsSubmitting(true);
    setError(null);
    try {
      await updateRoom({
        userId: user.convexId,
        roomId: room.roomId,
        title: formData.title,
        description: formData.description,
      });
      toast.success("Room updated");
      onClose();
    } catch (caught) {
      console.error("Failed to update room:", caught);
      setError("Couldn't save your changes. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal open={isOpen} onClose={onClose} size="md" mobile="sheet">
      <Modal.Header title="Edit Challenge Room" closeLabel="Close edit room" />
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body className="space-y-5">
          {error && <Alert tone="error">{error}</Alert>}

          <Field label="Room Title" required>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Enter room title…"
              required
              maxLength={100}
              data-autofocus
            />
          </Field>

          <Field label="Description">
            <Textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="Enter room description…"
              maxLength={500}
            />
          </Field>

          <section className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4">
            <h3 className="type-overline mb-2">Room Settings</h3>
            <dl className="space-y-1.5 text-sm font-inter">
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-muted)">Solves</dt>
                <dd className="type-label">{room.format === "ao5" ? "5" : "12"}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-(--text-muted)">Expires</dt>
                <dd className="type-label text-right">
                  {new Date(room.expiresAt).toLocaleString()}
                </dd>
              </div>
            </dl>
            <p className="type-caption mt-3">
              Solve count and expiration cannot be changed after room creation.
            </p>
          </section>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" loading={isSubmitting} loadingText="Saving…">
            Save Changes
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}
