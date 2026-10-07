"use client";

import { useEffect, useRef, useState } from "react";
import { cx } from "@/lib/cx";
import { Box, EyeOff, Play } from "lucide-react";
import { useTheme } from "@/lib/theme-context";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import {
  makeStaticCardShell,
  type PanelShellComponent,
} from "./TimerShell";
import { EmptyState } from "@/components/ui/EmptyState";
import { LoadingState } from "@/components/ui/Spinner";
import CubeViewSelector from "@/components/settings/CubeViewSelector";

// Apply interaction styles based on whether the view is 2D or 3D
const applyInteractionStyles = (player: any, is2D: boolean) => {
  player.style.touchAction = is2D ? "auto" : "none";
  player.style.cursor = is2D ? "default" : "grab";
};

const PreviewCardShell = makeStaticCardShell("Scramble Preview");

/** Default player box: 180px on phones, 200px above 640px. */
const DEFAULT_PREVIEW_HEIGHT = "h-45 sm:h-50";

interface ScramblePreviewProps {
  scramble: string;
  event: string;
  partialScramble?: string;
  /** Chrome the preview renders inside. Defaults to a static card. */
  shell?: PanelShellComponent;
  /** Tailwind height for the player box; the player fills it. */
  heightClassName?: string;
  /** Skip the "Load Preview" gate (a sheet opened on purpose is already a yes). */
  autoLoad?: boolean;
  /**
   * Controls sized to float over the player: an intrinsically sized 2D/3D
   * toggle and an icon-only hide button.
   */
  compactControls?: boolean;
}

export default function ScramblePreview({
  scramble,
  event,
  partialScramble,
  shell,
  heightClassName = DEFAULT_PREVIEW_HEIGHT,
  autoLoad = false,
  compactControls = false,
}: ScramblePreviewProps) {
  const Shell = shell ?? PreviewCardShell;
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  // Bumped per load and on effect cleanup, so a superseded load never mounts
  // its player. StrictMode runs the mount effect twice; without this an
  // auto-loaded preview ends up with two players, and updates go to the
  // hidden one.
  const loadIdRef = useRef(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(autoLoad);
  const [loadFailed, setLoadFailed] = useState(false);
  const { cubeViewMode } = useTheme();

  // Determine which scramble to display (partial or full)
  const displayScramble = partialScramble || scramble;

  const is2D = cubeViewMode === "2d";

  // Map event codes to puzzle IDs
  const getPuzzleId = (eventCode: string) => {
    const eventMap = {
      "222": "2x2x2" as const,
      "333": "3x3x3" as const,
      "444": "4x4x4" as const,
      "555": "5x5x5" as const,
      "666": "6x6x6" as const,
      "777": "7x7x7" as const,
      pyram: "pyraminx" as const,
      minx: "megaminx" as const,
      skewb: "skewb" as const,
      sq1: "square1" as const,
      clock: "clock" as const,
      "333bf": "3x3x3" as const,
      "444bf": "4x4x4" as const,
      "555bf": "5x5x5" as const,
      "333oh": "3x3x3" as const,
      "333fm": "3x3x3" as const,
      "333ft": "3x3x3" as const,
    };
    return eventMap[eventCode as keyof typeof eventMap] || ("3x3x3" as const);
  };

  const loadTwisty = async () => {
    const container = containerRef.current;
    if (!container) return;

    const loadId = ++loadIdRef.current;
    setIsLoading(true);

    try {
      // Dynamically import TwistyPlayer
      const { TwistyPlayer } = await import("cubing/twisty");
      if (loadId !== loadIdRef.current) return;

      // Clear previous content right before mounting, after the await
      container.innerHTML = "";

      const puzzleId = getPuzzleId(event);

      // Create player with config
      // Use experimentalSetupAlg to show the scrambled state
      const player = new TwistyPlayer({
        puzzle: puzzleId,
        visualization: is2D ? "2D" : "3D",
        experimentalSetupAlg: displayScramble,
        experimentalSetupAnchor: "end",
        hintFacelets: "none",
        backView: "none",
        controlPanel: "none",
        background: "none",
        viewerLink: "none",
      });

      // Set player size to fill container - responsive heights
      player.style.width = "100%";
      player.style.height = "100%";

      player.style.userSelect = "none";
      // The 2D net is a flat diagram - only the 3D view is draggable
      applyInteractionStyles(player, is2D);

      container.appendChild(player);
      playerRef.current = player;

      // Prevent touch events from interfering with timer
      const preventDefaultTouch = (e: TouchEvent) => {
        // Only stop propagation if the touch is on the player
        if (
          e.target instanceof HTMLElement &&
          e.target.closest("twisty-player")
        ) {
          e.stopPropagation();
        }
      };

      container.addEventListener("touchstart", preventDefaultTouch, {
        passive: true,
      });
      container.addEventListener("touchmove", preventDefaultTouch, {
        passive: true,
      });

      setIsLoaded(true);
    } catch (error) {
      if (loadId !== loadIdRef.current) return;
      console.error("Failed to load twisty player:", error);
      setLoadFailed(true);
    } finally {
      if (loadId === loadIdRef.current) setIsLoading(false);
    }
  };

  // Update scramble when it changes
  useEffect(() => {
    if (showPreview && isLoaded && playerRef.current) {
      try {
        playerRef.current.experimentalSetupAlg = displayScramble;
      } catch (error) {
        console.error("Failed to update scramble:", error);
      }
    }
  }, [displayScramble, showPreview, isLoaded]);

  // Update cube view mode when it changes
  useEffect(() => {
    if (!showPreview || !isLoaded || !playerRef.current) return;

    try {
      playerRef.current.visualization = is2D ? "2D" : "3D";
      applyInteractionStyles(playerRef.current, is2D);
    } catch (error) {
      console.error("Failed to update cube view mode:", error);
    }
  }, [is2D, showPreview, isLoaded]);

  // Load twisty player when preview is shown
  useEffect(() => {
    if (!showPreview || isLoaded) return;
    loadTwisty();
    return () => {
      loadIdRef.current++;
    };
  }, [showPreview, isLoaded]);

  // Reload player when event changes
  useEffect(() => {
    if (showPreview && isLoaded) {
      // Unload current player
      setIsLoaded(false);
      playerRef.current = null;
    }
  }, [event]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current = null;
    };
  }, []);

  const hidePreview = () => {
    setShowPreview(false);
    setIsLoaded(false);
    setLoadFailed(false);
  };

  return (
    <Shell
      actions={
        showPreview ? (
          <>
            <CubeViewSelector compact stretch={!compactControls} />
            {!autoLoad &&
              (compactControls ? (
                <IconButton
                  size="md"
                  variant="subtle"
                  aria-label="Hide preview"
                  icon={<EyeOff />}
                  onClick={hidePreview}
                />
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0"
                  onClick={hidePreview}
                >
                  Hide
                </Button>
              ))}
          </>
        ) : undefined
      }
    >
      {!showPreview ? (
        <div className={cx(
            "w-full bg-(--surface-elevated) rounded-(--radius-panel) flex items-center justify-center border border-(--border)",
            heightClassName,
          )}>
          <Button
            onClick={() => setShowPreview(true)}
            iconLeft={<Play className="w-4 h-4" />}
          >
            Load Preview
          </Button>
        </div>
      ) : loadFailed ? (
        <div className={cx(
            "w-full bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)",
            heightClassName,
          )}>
          <EmptyState
            icon={<Box />}
            title="Preview not available"
            description="The 3D preview couldn't load. Your scramble above is unaffected."
          />
        </div>
      ) : (
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 bg-(--surface-elevated) rounded-(--radius-panel)">
              <LoadingState label="Loading preview…" size="md" className="h-full py-0!" />
            </div>
          )}
          <div
            ref={containerRef}
            className={cx(
              "w-full bg-(--surface-elevated) rounded-(--radius-panel) overflow-hidden",
              heightClassName,
            )}
            style={{
              touchAction: is2D ? "auto" : "none",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          ></div>
        </div>
      )}
    </Shell>
  );
}