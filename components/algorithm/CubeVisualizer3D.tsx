"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, FastForward, Rewind } from "lucide-react";

type PuzzleType =
  | "3x3x3"
  | "2x2x2"
  | "4x4x4"
  | "5x5x5"
  | "6x6x6"
  | "7x7x7"
  | "pyraminx"
  | "megaminx"
  | "skewb"
  | "square1"
  | "clock";

interface CubeVisualizer3DProps {
  algorithm: string;
  puzzle?: PuzzleType;
  autoPlay?: boolean;
  showControls?: boolean;
  height?: string;
  onComplete?: () => void;
}

export default function CubeVisualizer3D({
  algorithm,
  puzzle = "3x3x3",
  autoPlay = false,
  showControls = true,
  height = "300px",
  onComplete,
}: CubeVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  useEffect(() => {
    loadTwistyPlayer();
  }, [puzzle]);

  useEffect(() => {
    const updateAlgorithm = async () => {
      if (playerRef.current && algorithm) {
        try {
          // Pause if currently playing
          if (isPlaying) {
            playerRef.current.controller.togglePlay(false);
          }

          // Update algorithm
          playerRef.current.alg = algorithm;

          // Reset to start when algorithm changes
          playerRef.current.jumpToStart();

          setIsPlaying(false);
        } catch (error) {
          console.error("Failed to update algorithm:", error);
        }
      }
    };

    updateAlgorithm();
  }, [algorithm]);

  const loadTwistyPlayer = async () => {
    if (!containerRef.current) return;

    setIsLoading(true);

    try {
      containerRef.current.innerHTML = "";

      const { TwistyPlayer } = await import("cubing/twisty");

      const player = new TwistyPlayer({
        puzzle,
        alg: algorithm,
        hintFacelets: "none",
        backView: "top-right",
        controlPanel: "none",
        background: "none",
        tempoScale: 3,
        viewerLink: "none",
      });

      player.style.width = "100%";
      player.style.height = height;
      player.style.touchAction = "none";
      player.style.userSelect = "none";
      player.style.cursor = "grab";

      containerRef.current?.appendChild(player);
      playerRef.current = player;

      // Listen to playing state changes
      player.experimentalModel.playingInfo.addFreshListener(
        (playingInfo: any) => {
          setIsPlaying(playingInfo.playing || false);
        }
      );

      setIsLoading(false);

      // Auto-play if enabled
      if (autoPlay) {
        setTimeout(() => {
          handlePlay();
        }, 500);
      }
    } catch (error) {
      console.error("Failed to load twisty player:", error);
      setIsLoading(false);
    }
  };

  const handlePlay = async () => {
    if (!playerRef.current) return;

    try {
      // Get timeline info to check if we're at the end
      const timelineInfo =
        await playerRef.current.experimentalModel.coarseTimelineInfo.get();

      // If at the end, reset to start first
      if (timelineInfo.atEnd) {
        playerRef.current.jumpToStart();
        // Small delay to ensure state is updated
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Use the controller's togglePlay method with true parameter
      playerRef.current.controller.togglePlay(true);
      setIsPlaying(true);
    } catch (error) {
      console.error("Playback error:", error);
      // Fallback: try to reset and play again
      try {
        playerRef.current.jumpToStart();
        await new Promise((resolve) => setTimeout(resolve, 100));
        playerRef.current.controller.togglePlay(true);
        setIsPlaying(true);
      } catch (retryError) {
        console.error("Retry playback failed:", retryError);
      }
    }
  };

  const handlePause = () => {
    if (!playerRef.current) return;
    try {
      // Use the controller's togglePlay method with false parameter
      playerRef.current.controller.togglePlay(false);
      setIsPlaying(false);
    } catch (error) {
      console.error("Pause error:", error);
    }
  };

  const handleReset = () => {
    if (!playerRef.current) return;
    try {
      // Pause first if playing
      if (isPlaying) {
        playerRef.current.controller.togglePlay(false);
      }
      // Use the built-in jumpToStart() method from TwistyPlayer
      playerRef.current.jumpToStart();
      setIsPlaying(false);
    } catch (error) {
      console.error("Reset error:", error);
    }
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (playerRef.current) {
      // Higher speed = faster tempo, so we multiply instead of divide
      playerRef.current.tempoScale = 3 * newSpeed;
    }
  };

  return (
    <div className="w-full">
      {/* 3D Cube Container */}
      <div className="relative bg-[var(--surface-elevated)] rounded-lg overflow-hidden border border-[var(--border)]">
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ height }}
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-[var(--text-muted)]">
                Loading 3D cube...
              </div>
            </div>
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full"
          style={{
            height,
            touchAction: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
          }}
        ></div>
      </div>

      {/* Playback Controls */}
      {showControls && !isLoading && (
        <div className="mt-4 space-y-3">
          {/* Play/Pause and Reset Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-colors"
              title="Reset"
            >
              <RotateCcw className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="px-4 sm:px-6 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {isPlaying ? (
                <>
                  <Pause className="w-5 h-5" />
                  <span className="hidden sm:inline">Pause</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span className="hidden sm:inline">Play</span>
                </>
              )}
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <span className="text-sm text-[var(--text-muted)]">Speed:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[0.25, 0.5, 1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    playbackSpeed === speed
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:bg-[var(--surface)] border border-[var(--border)]"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm Display */}
          <div className="p-3 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] overflow-x-auto">
            <p className="text-center font-mono text-sm text-[var(--text-primary)] whitespace-nowrap">
              {algorithm}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
