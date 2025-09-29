"use client";

import { useState, useRef, useEffect } from "react";
import {
  X,
  Copy,
  Check,
  ChevronDown,
  Clock12,
  Clock5,
} from "lucide-react";
import { scrambleGenerator } from "@/components/timer/ScrambleGenerator";
import { useUser } from "@/components/UserProvider";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import Image from "next/image";

interface CreateRoomModalProps {
  onClose: () => void;
}

const EVENTS = [
  { id: "333", name: "3x3", icon: "/cube-icons/333.svg" },
  { id: "222", name: "2x2", icon: "/cube-icons/222.svg" },
  { id: "444", name: "4x4", icon: "/cube-icons/444.svg" },
  { id: "555", name: "5x5", icon: "/cube-icons/555.svg" },
  { id: "666", name: "6x6", icon: "/cube-icons/666.svg" },
  { id: "777", name: "7x7", icon: "/cube-icons/777.svg" },
  { id: "333oh", name: "3x3 OH", icon: "/cube-icons/333oh.svg" },
  { id: "333bf", name: "3x3 BLD", icon: "/cube-icons/333bf.svg" },
  { id: "pyram", name: "Pyraminx", icon: "/cube-icons/pyram.svg" },
  { id: "minx", name: "Megaminx", icon: "/cube-icons/minx.svg" },
  { id: "skewb", name: "Skewb", icon: "/cube-icons/skewb.svg" },
  { id: "sq1", name: "Square-1", icon: "/cube-icons/sq1.svg" },
  { id: "clock", name: "Clock", icon: "/cube-icons/clock.svg" },
];

export default function CreateRoomModal({ onClose }: CreateRoomModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    event: "333",
    format: "ao5" as "ao5" | "ao12",
    description: "",
    isPublic: true,
  });
  const [isEventDropdownOpen, setIsEventDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [roomCreated, setRoomCreated] = useState<{ roomId: string } | null>(
    null
  );
  const [copied, setCopied] = useState(false);

  const { user } = useUser();
  const router = useRouter();
  const createRoom = useMutation(api.challengeRooms.createRoom);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsEventDropdownOpen(false);
      }
    };

    if (isEventDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isEventDropdownOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user?.convexId) return;

    setIsGenerating(true);

    try {
      // Generate scrambles based on format
      const scrambleCount = formData.format === "ao5" ? 5 : 12;
      const scrambles: string[] = [];

      for (let i = 0; i < scrambleCount; i++) {
        const scramble = await scrambleGenerator.generateScramble(
          formData.event
        );
        scrambles.push(scramble);
      }

      // Create the room
      const result = await createRoom({
        userId: user.convexId,
        name: formData.name,
        event: formData.event,
        format: formData.format,
        scrambles,
        description: formData.description,
        isPublic: formData.isPublic,
      });

      setRoomCreated({ roomId: result.roomId });
    } catch (error) {
      console.error("Failed to create room:", error);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyRoomLink = async () => {
    if (!roomCreated) return;

    const link = `${window.location.origin}/cube-lab/challenges/room/${roomCreated.roomId}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToRoom = () => {
    if (!roomCreated) return;
    router.push(`/cube-lab/challenges/room/${roomCreated.roomId}`);
    onClose();
  };

  if (roomCreated) {
    return (
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <div className="timer-card max-w-md w-full">
          <div className="relative">
            {/* Success Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-[var(--surface-elevated)] rounded-full flex items-center justify-center mx-auto mb-4 border border-[var(--border)]">
                <Check className="w-8 h-8 text-[var(--primary)]" />
              </div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement mb-2">
                Room Created!
              </h2>
              <p className="text-[var(--text-secondary)] font-inter">
                Your challenge room is ready. Share the room code or link with
                others.
              </p>
            </div>

            {/* Room Details */}
            <div className="space-y-4 mb-6">
              <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg p-4">
                <div className="text-center">
                  <p className="text-sm text-[var(--text-secondary)] font-inter mb-1">
                    Room Code
                  </p>
                  <p className="text-2xl font-bold text-[var(--primary)] font-mono tracking-wider">
                    {roomCreated.roomId}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={copyRoomLink}
                  className="w-full btn-primary flex items-center justify-center gap-2 font-inter"
                >
                  {copied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  {copied ? "Copied!" : "Copy Room Link"}
                </button>

                <button onClick={goToRoom} className="w-full btn-secondary">
                  Go to Room
                </button>
              </div>
            </div>

            <button
              onClick={onClose}
              className="absolute top-0 right-0 p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="timer-card w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-2">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                  Create Challenge Room
                </h2>
                <p className="text-sm text-[var(--text-secondary)] font-inter">
                  Set up a new challenge room to compete with others.
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
            {/* Room Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] font-inter mb-2">
                Room Name
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                placeholder="Enter room name..."
                className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors font-inter"
                required
              />
            </div>

            {/* Event Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] font-inter mb-3">
                Event
              </label>
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsEventDropdownOpen(!isEventDropdownOpen)}
                  className="w-full flex items-center justify-between p-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 rounded-lg border border-[var(--border)] transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-1">
                      <Image
                        src={
                          EVENTS.find((e) => e.id === formData.event)?.icon ||
                          "/cube-icons/333.svg"
                        }
                        alt={
                          EVENTS.find((e) => e.id === formData.event)?.name ||
                          "3x3"
                        }
                        width={24}
                        height={24}
                        className="w-full h-full object-contain brightness-0 invert"
                      />
                    </div>
                    <div className="text-left">
                      <div className="font-medium text-[var(--text-primary)] font-statement">
                        {EVENTS.find((e) => e.id === formData.event)?.name ||
                          "3x3"}
                      </div>
                    </div>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-[var(--text-secondary)] transition-transform ${
                      isEventDropdownOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isEventDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl z-[9999] max-h-64 overflow-y-auto">
                    {EVENTS.map((event) => (
                      <button
                        key={event.id}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, event: event.id });
                          setIsEventDropdownOpen(false);
                        }}
                        className={`w-full flex items-center gap-3 p-3 text-left hover:bg-[var(--surface-elevated)] transition-colors ${
                          event.id === formData.event
                            ? "bg-[var(--primary)]/20 border-[var(--primary)]/30"
                            : ""
                        }`}
                      >
                        <div className="w-8 h-8 bg-[var(--primary)] text-white rounded-lg flex items-center justify-center p-1">
                          <Image
                            src={event.icon}
                            alt={event.name}
                            width={24}
                            height={24}
                            className="w-full h-full object-contain brightness-0 invert"
                          />
                        </div>
                        <div>
                          <div className="font-medium text-[var(--text-primary)] font-statement">
                            {event.name}
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Format Selection */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] font-inter mb-3">
                Format
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, format: "ao5" })}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:bg-[var(--surface-elevated)] ${
                    formData.format === "ao5"
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                      <Clock5 className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-[var(--text-primary)] font-statement">
                        Average of 5
                      </div>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, format: "ao12" })}
                  className={`p-4 border rounded-lg transition-all duration-200 hover:bg-[var(--surface-elevated)] ${
                    formData.format === "ao12"
                      ? "border-[var(--primary)] bg-[var(--primary)]/10"
                      : "border-[var(--border)]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-[var(--primary)] rounded-lg flex items-center justify-center">
                      <Clock12 className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <div className="font-semibold text-[var(--text-primary)] font-statement">
                        Average of 12
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--text-primary)] font-inter mb-2">
                Description (Optional)
              </label>
              <textarea
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                placeholder="Add a description for your room..."
                rows={3}
                className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] transition-colors font-inter resize-none"
              />
            </div>

            {/* Public/Private Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium text-[var(--text-primary)] font-inter">
                  Public Room
                </div>
                <div className="text-sm text-[var(--text-secondary)] font-inter">
                  Allow room to appear in public listings
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setFormData({ ...formData, isPublic: !formData.isPublic })
                }
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  formData.isPublic
                    ? "bg-[var(--primary)]"
                    : "bg-[var(--border)]"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    formData.isPublic ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="order-2 sm:order-1 px-6 py-3 bg-[var(--surface-elevated)] hover:bg-[var(--border)] text-[var(--text-primary)] border border-[var(--border)] rounded-lg font-semibold transition-colors font-inter"
                disabled={isGenerating}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isGenerating || !formData.name}
                className="order-1 sm:order-2 flex-1 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold transition-colors font-inter flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Scrambles...
                  </>
                ) : (
                  <>
                    Create Room
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}