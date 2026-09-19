"use client";

import { useState } from "react";
import { ArrowRight, Search } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Field, Input } from "@/components/ui/Field";
import { Modal } from "@/components/ui/Modal";

interface JoinRoomModalProps {
  onClose: () => void;
}

export default function JoinRoomModal({ onClose }: JoinRoomModalProps) {
  const [roomCode, setRoomCode] = useState("");
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState("");
  const [isValidating, setIsValidating] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!roomCode.trim()) return;

    setIsJoining(true);
    setIsValidating(true);
    setError("");

    try {
      // Validate room code via API
      const response = await fetch(`/api/room/validate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ roomId: roomCode.trim().toUpperCase() }),
      });

      const data = await response.json();

      if (data.exists) {
        // Navigate to the room
        router.push(
          `/cube-lab/challenges/room/${roomCode.trim().toUpperCase()}`
        );
        onClose();
      } else {
        setError("Room not found. Please check the room code and try again.");
      }
    } catch (err) {
      setError("Failed to validate room. Please try again.");
    } finally {
      setIsJoining(false);
      setIsValidating(false);
    }
  };

  return (
    <Modal open onClose={onClose} size="md" mobile="sheet">
      <Modal.Header
        title="Join Challenge"
        description="Enter a room code to join an existing challenge"
      />
      <form onSubmit={handleSubmit} className="contents">
        <Modal.Body className="space-y-5">
          <Field
            label="Room Code"
            required
            error={error || undefined}
            hint="Room codes are 6 characters long (letters and numbers)"
          >
            <Input
              value={roomCode}
              onChange={(e) => {
                setRoomCode(e.target.value.toUpperCase());
                setError("");
              }}
              placeholder="ABC123"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              size="lg"
              leading={<Search />}
              className="type-time text-lg! tracking-[0.3em] text-center"
              required
              data-autofocus
            />
          </Field>

          <section className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-4">
            <h3 className="type-label mb-2">How to join a room</h3>
            <ul className="list-disc pl-4 space-y-1 text-sm text-(--text-secondary) font-inter">
              <li>Get a room code from the room creator</li>
              <li>Enter the 6-character code above</li>
              <li>You&apos;ll be taken to the room to start solving</li>
            </ul>
          </section>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose} disabled={isJoining}>
            Cancel
          </Button>
          <Button
            type="submit"
            disabled={roomCode.length !== 6}
            loading={isJoining}
            loadingText={isValidating ? "Validating room…" : "Joining room…"}
            iconLeft={<ArrowRight className="w-4 h-4" />}
          >
            Join Room
          </Button>
        </Modal.Footer>
      </form>
    </Modal>
  );
}