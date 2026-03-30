"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Trophy, PartyPopper } from "lucide-react";

interface ConfettiPiece {
  id: number;
  x: number;
  y: number;
  rotation: number;
  scale: number;
  velocity: { x: number; y: number };
  rotationSpeed: number;
  color: string;
}

interface GoalCelebrationProps {
  show: boolean;
  goalType: string;
  timeValue?: string;
  customGoalTime?: number;
  onComplete?: () => void;
  muted?: boolean;
}

// Format time in ms to display string (e.g., 12500 -> "12.50")
function formatGoalTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

export default function GoalCelebration({
  show,
  goalType,
  timeValue,
  customGoalTime,
  onComplete,
  muted = false,
}: GoalCelebrationProps) {
  const [confetti, setConfetti] = useState<ConfettiPiece[]>([]);
  const [isAnimating, setIsAnimating] = useState(false);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(0);
  const idCounterRef = useRef(0);
  const timeoutsRef = useRef<number[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastInteractiveAt = useRef(0);

  // Get theme colors for confetti
  const getColors = () => {
    if (typeof window === "undefined") return [];
    const style = getComputedStyle(document.documentElement);
    return [
      style.getPropertyValue("--primary").trim() || "#3b82f6",
      style.getPropertyValue("--accent").trim() || "#06b6d4",
      style.getPropertyValue("--primary-light").trim() || "#60a5fa",
      style.getPropertyValue("--success").trim() || "#10b981",
      style.getPropertyValue("--warning").trim() || "#f59e0b",
    ];
  };

  // Spawn a burst helper
  const spawnBurst = useCallback(
    (opts: {
      originX: number;
      originY: number;
      count: number;
      spread?: number;
      colors?: string[];
    }) => {
      const {
        originX,
        originY,
        count,
        spread = 1.2,
        colors = getColors(),
      } = opts;
      setConfetti((prev) => {
        const next: ConfettiPiece[] = [...prev];
        for (let i = 0; i < count; i++) {
          const angle =
            (Math.PI * 2 * i) / count + (Math.random() - 0.5) * spread;
          const velocity = 3 + Math.random() * 5;
          const id = idCounterRef.current++;

          next.push({
            id,
            x: originX,
            y: originY,
            rotation: Math.random() * 360,
            scale: 0.6 + Math.random() * 0.9,
            velocity: {
              x: Math.cos(angle) * velocity * (0.5 + Math.random() * 1.2),
              y: Math.sin(angle) * velocity - (1 + Math.random() * 3),
            },
            rotationSpeed: (Math.random() - 0.5) * 14,
            color: colors[Math.floor(Math.random() * colors.length)],
          });
        }
        return next;
      });
    },
    [],
  );

  // Initialize confetti pieces
  useEffect(() => {
    if (!show) return;
    setIsAnimating(true);
    const colors = getColors();

    // Spread bursts across the animation
    const burstOffsets = [0, 300, 650, 1000, 1450, 1900, 2400, 2900, 3300];
    const burstCounts = [60, 50, 45, 40, 35, 28, 22, 16, 10];

    const prefersReduced =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    burstOffsets.forEach((delay, bIdx) => {
      const t = window.setTimeout(() => {
        spawnBurst({
          originX: 50 + (Math.random() - 0.5) * 30,
          originY: 45 + (Math.random() - 0.5) * 20,
          count: prefersReduced
            ? Math.min(12, burstCounts[bIdx])
            : burstCounts[bIdx],
          spread: 1.6 + Math.random() * 0.8,
          colors,
        });
      }, delay);
      timeoutsRef.current.push(t);
    });

    // Play confetti sound (unless muted)
    if (!prefersReduced && !muted) {
      try {
        const audio = new Audio("/yay_confetti.wav");
        audio.volume = 0.85;
        audioRef.current = audio;
        audio.play().catch(() => {});
      } catch {
        // Ignore audio errors
      }
    }

    startTimeRef.current = Date.now();
  }, [show, muted, spawnBurst]);

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const duration = 3500;

      if (elapsed >= duration) {
        setIsAnimating(false);
        setConfetti([]);
        onComplete?.();
        return;
      }

      setConfetti((prev) =>
        prev.map((piece) => {
          const newVelocityY = piece.velocity.y + 0.15;
          const newX = piece.x + piece.velocity.x * 0.5;
          const newY = piece.y + piece.velocity.y * 0.5;
          const newRotation = piece.rotation + piece.rotationSpeed;

          const fadeStart = duration * 0.6;
          const opacity =
            elapsed > fadeStart
              ? 1 - (elapsed - fadeStart) / (duration - fadeStart)
              : 1;

          return {
            ...piece,
            x: newX,
            y: newY,
            rotation: newRotation,
            velocity: {
              x: piece.velocity.x * 0.98,
              y: newVelocityY,
            },
            scale: piece.scale * (opacity > 0.5 ? 1 : opacity * 2),
          };
        }),
      );

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isAnimating, onComplete]);

  // Interactive confetti spawns on pointer down
  useEffect(() => {
    if (!show) return;
    const handler = () => {
      const now = Date.now();
      if (now - lastInteractiveAt.current < 250) return;
      lastInteractiveAt.current = now;
      spawnBurst({
        originX: 50 + (Math.random() - 0.5) * 40,
        originY: 50 + (Math.random() - 0.5) * 30,
        count: 12,
        spread: 2,
      });
    };

    document.addEventListener("pointerdown", handler);
    return () => document.removeEventListener("pointerdown", handler);
  }, [show, spawnBurst]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      timeoutsRef.current.forEach((t) => clearTimeout(t));
      timeoutsRef.current = [];
      if (audioRef.current) {
        try {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
        } catch {
          // Ignore audio errors
        }
        audioRef.current = null;
      }
    };
  }, []);

  if (!show) return null;

  // Format goal type for display
  const formatGoalType = (type: string, customTime?: string) => {
    if (type === "custom") {
      return customTime ? `Custom Goal (${customTime})` : "Custom Goal";
    }
    return type.replace("-", " ").toUpperCase();
  };

  return (
    <div className="fixed inset-0 overflow-hidden z-50">
      {/* Blur backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto" />
      {/* Confetti pieces */}
      {confetti.map((piece) => {
        const isVisible =
          piece.x >= -10 && piece.x <= 110 && piece.y >= -10 && piece.y <= 110;

        if (!isVisible) return null;

        return (
          <div
            key={piece.id}
            className="absolute w-2 h-2 transition-opacity pointer-events-none"
            style={{
              left: `${piece.x}%`,
              top: `${piece.y}%`,
              transform: `rotate(${piece.rotation}deg) scale(${piece.scale})`,
              backgroundColor: piece.color,
              opacity: isVisible ? 1 : 0,
            }}
          />
        );
      })}

      {/* Achievement message */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center p-4 pointer-events-none"
        style={{
          animation:
            "goal-celebration-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        }}
      >
        <div className="flex flex-col items-center gap-2 sm:gap-3 px-6 sm:px-8 py-5 sm:py-6 rounded-xl bg-(--surface) border-2 border-(--success) shadow-2xl max-w-[90vw] sm:max-w-md">
          <div className="flex items-center gap-2">
            <PartyPopper className="w-5 h-5 sm:w-6 sm:h-6 text-(--success)" />
            <Trophy className="w-7 h-7 sm:w-8 sm:h-8 text-(--success)" />
            <PartyPopper className="w-5 h-5 sm:w-6 sm:h-6 text-(--success)" />
          </div>
          <span className="text-lg sm:text-xl font-bold text-(--success)">
            Goal Achieved!
          </span>
          <span className="text-base sm:text-lg font-semibold text-(--text-primary)">
            {formatGoalType(
              goalType,
              customGoalTime ? formatGoalTime(customGoalTime) : undefined,
            )}
          </span>
          {timeValue && (
            <div className="flex flex-col items-center gap-1">
              <span className="text-xs sm:text-sm text-(--text-muted)">
                Current Average
              </span>
              <span className="text-xl sm:text-2xl font-bold text-(--primary) font-mono">
                {timeValue}
              </span>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes goal-celebration-bounce {
          0% {
            transform: scale(0) translateY(20px);
            opacity: 0;
          }
          50% {
            transform: scale(1.1) translateY(-5px);
          }
          100% {
            transform: scale(1) translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
