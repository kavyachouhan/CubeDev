"use client";

import { useEffect, useRef, useState } from "react";
import {
  Play,
  Pause,
  RotateCcw,
  FastForward,
  AlertTriangle,
} from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import CubeViewSelector from "@/components/settings/CubeViewSelector";

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

// Apply interaction styles to the Twisty Player based on whether it's in 2D or 3D mode. In 2D mode, allow touch interactions and use the default cursor. In 3D mode, disable touch interactions and use a grab cursor for better user experience.
const applyInteractionStyles = (player: any, is2D: boolean) => {
  player.style.touchAction = is2D ? "auto" : "none";
  player.style.cursor = is2D ? "default" : "grab";
};

interface CubeVisualizer3DProps {
  algorithm: string;
  puzzle?: PuzzleType;
  autoPlay?: boolean;
  showControls?: boolean;
  /**
   * Show the 3D/2D view toggle overlaid on the cube. Defaults to true so every
   * cube is switchable; pass false where the toggle would distract (e.g. the
   * memorize flash in recognition drills).
   */
  showViewToggle?: boolean;
  height?: string;
  onComplete?: () => void;
}

export default function CubeVisualizer3D({
  algorithm,
  puzzle = "3x3x3",
  autoPlay = false,
  showControls = true,
  showViewToggle = true,
  height = "300px",
  onComplete,
}: CubeVisualizer3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [player, setPlayer] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const { cubeViewMode } = useTheme();
  const is2D = cubeViewMode === "2d";

  // Keep a ref to the current is2D value so that we can access it in the async initPlayer function without needing to add it to the dependency array (which would cause unnecessary re-initializations).
  const is2DRef = useRef(is2D);
  is2DRef.current = is2D;

  // Initialize Twisty Player
  useEffect(() => {
    let mounted = true;
    let currentPlayer: any = null;

    const initPlayer = async () => {
      if (!containerRef.current) return;

      setIsLoading(true);
      setLoadError(null);
      containerRef.current.innerHTML = "";

      try {
        const { TwistyPlayer } = await import("cubing/twisty");

        const startIn2D = is2DRef.current;

        currentPlayer = new TwistyPlayer({
          puzzle,
          alg: algorithm,
          visualization: startIn2D ? "2D" : "3D",
          experimentalSetupAnchor: "end",
          hintFacelets: "none",
          // The 2D net already shows every face, so the back-view inset
          // (a 3D-only affordance) is redundant there.
          backView: startIn2D ? "none" : "top-right",
          controlPanel: "none",
          background: "none",
          tempoScale: 3,
          viewerLink: "none",
        });

        currentPlayer.style.width = "100%";
        currentPlayer.style.height = height;
        currentPlayer.style.userSelect = "none";
        applyInteractionStyles(currentPlayer, startIn2D);

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
        // Handle errors during player initialization
        console.error("Failed to load twisty player:", error);
        if (mounted) {
          setLoadError(
            error instanceof Error ? error.message : "Unknown error"
          );
          setIsLoading(false);
        }
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

  // Update view mode when is2D changes
  useEffect(() => {
    if (!player) return;

    try {
      player.visualization = is2D ? "2D" : "3D";
      player.backView = is2D ? "none" : "top-right";
      applyInteractionStyles(player, is2D);
    } catch (error) {
      console.error("Failed to update cube view mode:", error);
    }
  }, [is2D, player]);

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
      {/* Cube Container */}
      <div className="relative bg-(--surface-elevated) rounded-lg overflow-hidden border border-(--border)">
        {isLoading && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10"
            style={{ height }}
          >
            <div className="text-center">
              <div className="animate-spin w-8 h-8 border-3 border-(--primary) border-t-transparent rounded-full mx-auto mb-2"></div>
              <div className="text-sm text-(--text-muted)">
                Loading cube...
              </div>
            </div>
          </div>
        )}

        {loadError && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 px-4"
            style={{ height }}
          >
            <div className="text-center">
              <AlertTriangle className="w-6 h-6 text-yellow-500 mx-auto mb-2" />
              <div className="text-sm text-(--text-secondary) mb-1">
                Couldn&apos;t render this case
              </div>
              <p className="font-mono text-xs text-(--text-muted) break-all">
                {algorithm}
              </p>
            </div>
          </div>
        )}

        {showViewToggle && !isLoading && !loadError && (
          // Overlay the CubeViewSelector in the top-left corner of the cube container. This allows users to switch between 2D and 3D views without interfering with the cube's interaction.
          <div className="absolute top-2 left-2 z-20">
            <CubeViewSelector compact />
          </div>
        )}
        <div
          ref={containerRef}
          className="w-full"
          style={{
            height,
            touchAction: is2D ? "auto" : "none",
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
              className="p-2 bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors"
              title="Reset to start"
            >
              <RotateCcw className="w-5 h-5 text-(--text-secondary)" />
            </button>

            <button
              onClick={handlePlayPause}
              className="px-4 sm:px-6 py-2 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors flex items-center gap-2"
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
              className="p-2 bg-(--surface-elevated) hover:bg-(--surface) border border-(--border) rounded-lg transition-colors"
              title="Verify (show solved state after algorithm)"
            >
              <FastForward className="w-5 h-5 text-(--text-secondary)" />
            </button>
          </div>

          {/* Speed Control */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3">
            <span className="text-sm text-(--text-muted)">Speed:</span>
            <div className="flex flex-wrap justify-center gap-2">
              {[0.25, 0.5, 1, 1.5, 2].map((speed) => (
                <button
                  key={speed}
                  onClick={() => handleSpeedChange(speed)}
                  className={`px-3 py-1 rounded text-sm transition-colors ${
                    playbackSpeed === speed
                      ? "bg-(--primary) text-white"
                      : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--surface) border border-(--border)"
                  }`}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>

          {/* Algorithm Display */}
          <div className="p-3 bg-(--surface-elevated) rounded-lg border border-(--border) overflow-x-auto">
            <p className="text-center font-mono text-sm text-(--text-primary) whitespace-nowrap">
              {algorithm}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}