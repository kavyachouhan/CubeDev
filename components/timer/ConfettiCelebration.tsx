"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { Trophy, Zap } from "lucide-react";

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

interface ConfettiCelebrationProps {
  show: boolean;
  achievementType: "single" | "ao5" | "ao12" | "ao100";
  timeValue?: string;
  onComplete?: () => void;
}

export default function ConfettiCelebration({
  show,
  achievementType,
  timeValue,
  onComplete,
}: ConfettiCelebrationProps) {
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

  // Get achievement text
  const getAchievementText = () => {
    switch (achievementType) {
      case "single":
        return "New Personal Best!";
      case "ao5":
        return "New Ao5 PB!";
      case "ao12":
        return "New Ao12 PB!";
      case "ao100":
        return "New Ao100 PB!";
      default:
        return "New Record!";
    }
  };

  // Initialize confetti pieces
  useEffect(() => {
    if (!show) return;
    setIsAnimating(true);
    const colors = getColors();

    // Spread bursts across the 3500ms audio length
    const AUDIO_MS = 3500;
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

    // Play confetti sound
    if (!prefersReduced) {
      try {
        const audio = new Audio("/yay_confetti.wav");
        audio.volume = 0.85;
        audioRef.current = audio;
        // ignore play promise rejection
        audio.play().catch(() => {});
      } catch (e) {}
    }

    startTimeRef.current = Date.now();
  }, [show]);

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
    []
  );

  // Animation loop
  useEffect(() => {
    if (!isAnimating) return;

    const animate = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const duration = 3500; // total animation duration

      if (elapsed >= duration) {
        setIsAnimating(false);
        setConfetti([]);
        onComplete?.();
        return;
      }

      setConfetti((prev) =>
        prev.map((piece) => {
          // Apply gravity and velocity
          const newVelocityY = piece.velocity.y + 0.15; // Gravity
          const newX = piece.x + piece.velocity.x * 0.5;
          const newY = piece.y + piece.velocity.y * 0.5;
          const newRotation = piece.rotation + piece.rotationSpeed;

          // Fade out towards end
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
              x: piece.velocity.x * 0.98, // Air resistance
              y: newVelocityY,
            },
            scale: piece.scale * (opacity > 0.5 ? 1 : opacity * 2),
          };
        })
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
      // Throttle interactive spawns to avoid accidental floods
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
        } catch (e) {}
        audioRef.current = null;
      }
    };
  }, []);

  if (!show) return null;

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
      {/* Confetti pieces */}
      {confetti.map((piece) => {
        // Check if piece is out of bounds
        const isVisible =
          piece.x >= -10 && piece.x <= 110 && piece.y >= -10 && piece.y <= 110;

        if (!isVisible) return null;

        return (
          <div
            key={piece.id}
            className="absolute w-2 h-2 transition-opacity"
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

      {/* Achievement message with icon */}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          animation:
            "celebration-bounce 0.6s cubic-bezier(0.68, -0.55, 0.265, 1.55)",
        }}
      >
        <div className="flex flex-col items-center gap-2 px-6 py-4 rounded-xl bg-[var(--surface)] border border-[var(--primary)] shadow-lg">
          <div className="flex items-center gap-2">
            {achievementType === "single" ? (
              <Zap
                className="w-5 h-5 text-[var(--primary)]"
                strokeWidth={2.5}
              />
            ) : (
              <Trophy
                className="w-5 h-5 text-[var(--primary)]"
                strokeWidth={2.5}
              />
            )}
            <span className="text-lg font-bold text-[var(--primary)] font-statement">
              {getAchievementText()}
            </span>
          </div>
          {timeValue && (
            <span className="text-2xl font-bold text-[var(--text-primary)] font-mono">
              {timeValue}
            </span>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes celebration-bounce {
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