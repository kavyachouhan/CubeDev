"use client";

import { useState } from "react";
import { X, Search, ArrowRight, AlertCircle } from "lucide-react";
import { useRouter } from "next/navigation";

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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="timer-card w-full max-w-md">
        <div className="p-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                  Join Challenge
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-inter">
                  Enter a room code to join an existing challenge
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] font-inter mb-2">
                Room Code
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={roomCode}
                  onChange={(e) => {
                    setRoomCode(e.target.value.toUpperCase());
                    setError(""); // Clear error on change
                  }}
                  placeholder="ABC123"
                  maxLength={6}
                  className="w-full px-4 py-3 pl-12 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors font-mono text-lg tracking-wider text-center"
                  required
                />
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
              </div>
              {error && (
                <div className="mt-2 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-500 font-inter">{error}</p>
                </div>
              )}
              <p className="text-xs text-[var(--text-muted)] font-inter mt-2 text-center">
                Room codes are 6 characters long (letters and numbers)
              </p>
            </div>

            <button
              type="submit"
              disabled={isJoining || roomCode.length !== 6}
              className="btn-primary w-full flex items-center justify-center gap-2 text-base"
            >
              {isJoining ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isValidating ? "Validating Room..." : "Joining Room..."}
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  Join Room
                </>
              )}
            </button>
          </form>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
            <h3 className="text-sm font-medium text-[var(--text-primary)] font-inter mb-2">
              How to join a room
            </h3>
            <ul className="text-sm text-[var(--text-secondary)] font-inter space-y-1">
              <li>• Get a room code from the room creator</li>
              <li>• Enter the 6-character code above</li>
              <li>• You'll be taken to the room to start solving</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}