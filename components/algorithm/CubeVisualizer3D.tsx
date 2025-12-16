"use client";

import { useEffect, useRef, useState } from "react";
import { Play, Pause, RotateCcw, FastForward } from "lucide-react";

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
  const [player, setPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  // Initialize Twisty Player
  useEffect(() => {
    let mounted = true;
    let currentPlayer: any = null;

    const initPlayer = async () => {
      if (!containerRef.current) return;

      setIsLoading(true);
      containerRef.current.innerHTML = "";

      try {
        const { TwistyPlayer } = await import("cubing/twisty");

        currentPlayer = new TwistyPlayer({
          puzzle,
          alg: algorithm,
          experimentalSetupAnchor: "end",
          hintFacelets: "none",
          backView: "top-right",
          controlPanel: "none",
          background: "none",
          tempoScale: 3,
          viewerLink: "none",
        });

        currentPlayer.style.width = "100%";
        currentPlayer.style.height = height;
        currentPlayer.style.touchAction = "none";
        currentPlayer.style.userSelect = "none";
        currentPlayer.style.cursor = "grab";

        if (!mounted || !containerRef.current) return;

        containerRef.current.appendChild(currentPlayer);

        // Listen for animation complete
        currentPlayer.experimentalModel.playingInfo.addFreshListener(
          (playingInfo: any) => {
            if (mounted) {
              setIsPlaying(playingInfo.playing || false);
            }
          }
        );

        // Listen for animation end to trigger onComplete
        await new Promise((resolve) => setTimeout(resolve, 100));

        if (mounted) {
          setPlayer(currentPlayer);
          setIsLoading(false);

          if (autoPlay) {
            setTimeout(() => {
              currentPlayer?.controller?.animationController?.playPause();
            }, 300);
          }
        }
      } catch (error) {
        console.error("Failed to load twisty player:", error);
        if (mounted) setIsLoading(false);
      }
    };

    initPlayer();

    return () => {
      mounted = false;
      if (currentPlayer) {
        try {
          currentPlayer.controller?.animationController?.pause();
        } catch (e) {
          // Ignore errors on unmount
        }
      }
    };
  }, [puzzle, height]);

  // Update algorithm when it changes
  useEffect(() => {
    if (player && algorithm) {
      try {
        player.alg = algorithm;
        player.controller?.animationController?.jumpToStart();
      } catch (error) {
        console.error("Failed to update algorithm:", error);
      }
    }
  }, [algorithm, player]);

  // Play/Pause toggle
  const handlePlayPause = () => {
    if (!player?.controller?.animationController) return;
    player.controller.animationController.playPause();
  };

  // Reset to start
  const handleReset = () => {
    if (!player?.controller?.animationController) return;
    player.controller.animationController.pause();
    player.controller.animationController.jumpToStart();
  };

  // Verify (jump to end)
  const handleVerify = () => {
    if (!player?.controller?.animationController) return;
    player.controller.animationController.pause();
    player.controller.animationController.jumpToEnd();
  };

  const handleSpeedChange = (newSpeed: number) => {
    setPlaybackSpeed(newSpeed);
    if (player) {
      player.tempoScale = 3 * newSpeed;
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
          {/* Play/Pause, Reset, and Verify Buttons */}
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={handleReset}
              className="p-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-colors"
              title="Reset to start"
            >
              <RotateCcw className="w-5 h-5 text-[var(--text-secondary)]" />
            </button>

            <button
              onClick={handlePlayPause}
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

            <button
              onClick={handleVerify}
              className="p-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface)] border border-[var(--border)] rounded-lg transition-colors"
              title="Verify (show solved state after algorithm)"
            >
              <FastForward className="w-5 h-5 text-[var(--text-secondary)]" />
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