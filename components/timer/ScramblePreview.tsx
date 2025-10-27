"use client";

import { useEffect, useRef, useState } from "react";
import { Play } from "lucide-react";

interface ScramblePreviewProps {
  scramble: string;
  event: string;
  partialScramble?: string;
}

export default function ScramblePreview({
  scramble,
  event,
  partialScramble,
}: ScramblePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Determine which scramble to display (partial or full)
  const displayScramble = partialScramble || scramble;

  const loadTwisty = async () => {
    if (isLoading || !containerRef.current) return;

    setIsLoading(true);

    try {
      // Clear previous content
      containerRef.current.innerHTML = "";

      // Dynamically import TwistyPlayer to avoid increasing initial bundle size
      const { TwistyPlayer } = await import("cubing/twisty");

      const player = new TwistyPlayer({
        puzzle:
          event === "333"
            ? "3x3x3"
            : event === "222"
              ? "2x2x2"
              : event === "444"
                ? "4x4x4"
                : event === "555"
                  ? "5x5x5"
                  : event === "666"
                    ? "6x6x6"
                    : event === "777"
                      ? "7x7x7"
                      : event === "pyram"
                        ? "pyraminx"
                        : event === "minx"
                          ? "megaminx"
                          : event === "skewb"
                            ? "skewb"
                            : event === "sq1"
                              ? "square1"
                              : event === "clock"
                                ? "clock"
                                : event === "444bld"
                                  ? "4x4x4"
                                  : event === "555bld"
                                    ? "5x5x5"
                                    : "3x3x3",
        alg: displayScramble,
        hintFacelets: "none",
        backView: "none",
        controlPanel: "none",
        background: "none",
        tempoScale: 3, // Faster animations
        viewerLink: "none",
      });

      // Set player size to fill container - responsive heights
      player.style.width = "100%";
      player.style.height = window.innerWidth < 640 ? "180px" : "200px";

      // Enable touch interactions
      player.style.touchAction = "none";
      player.style.userSelect = "none";
      player.style.webkitUserSelect = "none";
      player.style.cursor = "grab";

      containerRef.current?.appendChild(player);

      // Prevent touch events from interfering with timer
      if (containerRef.current) {
        const preventDefaultTouch = (e: TouchEvent) => {
          // Only stop propagation if the touch is on the player
          if (
            e.target instanceof HTMLElement &&
            e.target.closest("twisty-player")
          ) {
            e.stopPropagation();
          }
        };

        containerRef.current.addEventListener(
          "touchstart",
          preventDefaultTouch,
          { passive: true }
        );
        containerRef.current.addEventListener(
          "touchmove",
          preventDefaultTouch,
          { passive: true }
        );
      }

      playerRef.current = player;
      setIsLoaded(true);
    } catch (error) {
      console.error("Failed to load twisty player:", error);
      // Show error message
      if (containerRef.current) {
        containerRef.current.innerHTML = `
          <div class="w-full h-[180px] sm:h-48 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center">
            <div class="text-center">
              <div class="text-4xl mb-2">🧩</div>
              <div class="text-sm text-[var(--text-muted)]">Preview not available</div>
            </div>
          </div>
        `;
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Update scramble when it changes
  useEffect(() => {
    if (showPreview && isLoaded && playerRef.current) {
      try {
        playerRef.current.alg = displayScramble;
      } catch (error) {
        console.error("Failed to update scramble:", error);
      }
    }
  }, [displayScramble, showPreview, isLoaded]);

  // Load preview when requested
  useEffect(() => {
    if (showPreview && !isLoaded) {
      loadTwisty();
    }
  }, [showPreview]);

  // Reload player when full scramble or event changes
  useEffect(() => {
    if (showPreview) {
      // Reload the player with the new scramble
      setIsLoaded(false);
      playerRef.current = null;
    }
  }, [scramble, event]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      playerRef.current = null;
    };
  }, []);

  // Handle responsive resizing
  useEffect(() => {
    if (!showPreview || !playerRef.current) return;

    const handleResize = () => {
      if (playerRef.current) {
        playerRef.current.style.height =
          window.innerWidth < 640 ? "180px" : "200px";
        // Ensure touch events are still enabled after resize
        playerRef.current.style.touchAction = "none";
        playerRef.current.style.userSelect = "none";
        playerRef.current.style.webkitUserSelect = "none";
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [showPreview, isLoaded]);

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
          Scramble Preview
        </h3>
        {showPreview && (
          <button
            onClick={() => {
              setShowPreview(false);
              setIsLoaded(false);
            }}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
          >
            Hide
          </button>
        )}
      </div>

      {!showPreview ? (
        <div className="w-full min-h-[180px] sm:min-h-[200px] bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center border border-[var(--border)]">
          <button
            onClick={() => setShowPreview(true)}
            className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors"
          >
            <Play size={16} />
            Load 3D Preview
          </button>
        </div>
      ) : (
        <div className="relative">
          {isLoading && (
            <div className="absolute inset-0 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center z-10">
              <div className="text-center">
                <div className="animate-spin w-6 h-6 border-2 border-[var(--primary)] border-t-transparent rounded-full mx-auto mb-2"></div>
                <div className="text-sm text-[var(--text-muted)]">
                  Loading preview...
                </div>
              </div>
            </div>
          )}
          <div
            ref={containerRef}
            className="w-full min-h-[180px] sm:min-h-[200px] bg-[var(--surface-elevated)] rounded-lg overflow-hidden"
            style={{
              touchAction: "none",
              WebkitTouchCallout: "none",
              WebkitUserSelect: "none",
              userSelect: "none",
            }}
          ></div>
        </div>
      )}
    </div>
  );
}