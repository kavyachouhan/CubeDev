"use client";

import { useState, useEffect, useRef } from "react";
import { Play, AlertTriangle } from "lucide-react";
import CubeVisualizer3D from "./CubeVisualizer3D";

interface ExecutionPracticeCardProps {
  caseName: string;
  algorithm: string;
  setupMoves: string;
  puzzleType?: string; // "3x3x3", "2x2x2", etc.
  onComplete: (timeMs: number) => void;
  hasStarted?: boolean;
  onStart?: () => void;
  isCustomAlgorithm?: boolean; // Whether this is a user-created custom algorithm
  hasValidNotation?: boolean; // Whether notation is compatible with 3D player
}

export default function ExecutionPracticeCard({
  caseName,
  algorithm,
  setupMoves,
  puzzleType = "3x3x3",
  onComplete,
  hasStarted = false,
  onStart,
  isCustomAlgorithm = false,
  hasValidNotation = true,
}: ExecutionPracticeCardProps) {
  const [timerState, setTimerState] = useState<
    "idle" | "inspection" | "holding" | "ready" | "running" | "finished"
  >("idle");
  const [startTime, setStartTime] = useState<number>(0);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const [inspectionTime, setInspectionTime] = useState<number>(15);
  const [keyHoldStart, setKeyHoldStart] = useState<number>(0);
  const [touchHoldStart, setTouchHoldStart] = useState<number>(0);
  const holdTimeRequired = 300; // milliseconds
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Reset when case changes
    if (hasStarted) {
      setTimerState("idle");
      setExecutionTime(null);
      setInspectionTime(15);
      setKeyHoldStart(0);
      setTouchHoldStart(0);
    }
  }, [caseName, hasStarted]);

  // Cleanup intervals on unmount
  useEffect(() => {
    return () => {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, []);

  // Inspection timer
  useEffect(() => {
    if (timerState === "inspection") {
      inspectionIntervalRef.current = setInterval(() => {
        setInspectionTime((prev) => {
          const newTime = prev - 0.01;
          if (newTime <= 0) {
            // Auto-start timer when inspection ends
            if (inspectionIntervalRef.current) {
              clearInterval(inspectionIntervalRef.current);
            }
            startTimer();
            return 15;
          }
          return newTime;
        });
      }, 10);
    } else {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
        inspectionIntervalRef.current = null;
      }
    }

    return () => {
      if (inspectionIntervalRef.current) {
        clearInterval(inspectionIntervalRef.current);
      }
    };
  }, [timerState]);

  // Running timer
  useEffect(() => {
    if (timerState === "running") {
      timerIntervalRef.current = setInterval(() => {
        setCurrentTime(Date.now());
      }, 10);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    }

    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [timerState]);

  // Keyboard event handlers
  useEffect(() => {
    if (!hasStarted) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();

      if (timerState === "idle") {
        // Start holding
        setKeyHoldStart(Date.now());
        setTimerState("holding");
      } else if (timerState === "inspection") {
        // During inspection, start holding
        setKeyHoldStart(Date.now());
        setTimerState("holding");
      } else if (timerState === "running") {
        // Stop the timer
        handleStopTimer();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code !== "Space") return;
      e.preventDefault();

      if (timerState === "holding") {
        const holdDuration = Date.now() - keyHoldStart;

        if (holdDuration >= holdTimeRequired) {
          // Held long enough to trigger action
          if (inspectionTime < 15) {
            // Inspection complete, start timer
            startTimer();
          } else {
            // Start inspection
            startInspection();
          }
        } else {
          // Not held long enough, revert state
          if (inspectionTime < 15) {
            setTimerState("inspection");
          } else {
            setTimerState("idle");
          }
        }
        setKeyHoldStart(0);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [timerState, hasStarted, keyHoldStart, inspectionTime]);

  const startInspection = () => {
    setTimerState("inspection");
    setInspectionTime(15);
  };

  const startTimer = () => {
    setTimerState("running");
    setStartTime(Date.now());
    setCurrentTime(Date.now());
    setInspectionTime(15);
  };

  const handleStopTimer = () => {
    const timeMs = Date.now() - startTime;
    setExecutionTime(timeMs);
    setTimerState("finished");
  };

  const handleReset = () => {
    setTimerState("idle");
    setExecutionTime(null);
    setInspectionTime(15);
    setKeyHoldStart(0);
    setTouchHoldStart(0);
  };

  // Touch event handlers
  const handleTouchStart = (e: React.TouchEvent | React.MouseEvent) => {
    if (!hasStarted) return;
    e.preventDefault();

    if (timerState === "idle") {
      setTouchHoldStart(Date.now());
      setTimerState("holding");
    } else if (timerState === "inspection") {
      setTouchHoldStart(Date.now());
      setTimerState("holding");
    } else if (timerState === "running") {
      handleStopTimer();
    }
  };

  const handleTouchEnd = (e: React.TouchEvent | React.MouseEvent) => {
    if (!hasStarted) return;
    e.preventDefault();

    if (timerState === "holding") {
      const holdDuration = Date.now() - touchHoldStart;

      if (holdDuration >= holdTimeRequired) {
        if (inspectionTime < 15) {
          startTimer();
        } else {
          startInspection();
        }
      } else {
        if (inspectionTime < 15) {
          setTimerState("inspection");
        } else {
          setTimerState("idle");
        }
      }
      setTouchHoldStart(0);
    }
  };

  const handleNext = () => {
    if (executionTime !== null) {
      onComplete(executionTime);
    }
  };

  const formatTime = (ms: number): string => {
    const totalSeconds = ms / 1000;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return minutes > 0 ? `${minutes}:${seconds.padStart(5, "0")}` : seconds;
  };

  const getTimerColor = () => {
    switch (timerState) {
      case "holding":
        return "text-yellow-500";
      case "inspection":
        if (inspectionTime <= 3) return "text-red-500";
        if (inspectionTime <= 8) return "text-yellow-500";
        return "text-green-500";
      case "ready":
        return "text-green-500";
      case "running":
        return "text-(--primary)";
      case "finished":
        return "text-green-500";
      default:
        return "text-(--text-muted)";
    }
  };

  const getStatusText = () => {
    switch (timerState) {
      case "idle":
        return "Hold SPACE or touch and hold to start inspection";
      case "holding":
        return inspectionTime < 15
          ? "Release to start timer"
          : "Release to start inspection";
      case "inspection":
        return `Inspection - Hold SPACE/touch when ready`;
      case "running":
        return "Press SPACE or touch to stop";
      case "finished":
        return "Click Next Case to continue";
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="timer-card">
        {/* Start Practice Prompt */}
        {!hasStarted && onStart && (
          <div className="text-center py-12">
            <Play className="w-16 h-16 text-(--primary) mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-(--text-primary) font-statement mb-2">
              Execution Drill
            </h3>
            <p className="text-(--text-muted) mb-6 max-w-md mx-auto">
              Practice executing algorithms as fast as possible. Focus on smooth
              fingertricks and muscle memory.
            </p>
            <button
              onClick={onStart}
              className="px-8 py-4 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-medium text-lg"
            >
              Start Execution Drill
            </button>
          </div>
        )}

        {/* Practice Content */}
        {hasStarted && (
          <>
            {/* Case Info */}
            <div className="text-center mb-6">
              <h3 className="text-3xl font-bold text-(--primary) font-statement mb-2">
                {caseName}
              </h3>
              <div className="inline-block px-4 py-2 bg-(--surface-elevated) rounded-lg">
                <p className="text-sm text-(--text-muted) mb-1">
                  Algorithm
                </p>
                <p className="text-lg font-mono text-(--text-primary)">
                  {algorithm}
                </p>
              </div>
            </div>

            {/* Cube Visualization */}
            <div className="mb-6">
              {hasValidNotation ? (
                <CubeVisualizer3D
                  algorithm={setupMoves}
                  puzzle={puzzleType as any}
                  autoPlay={false}
                  showControls={true}
                  height="300px"
                />
              ) : (
                <div className="bg-(--surface-elevated) rounded-lg border border-(--border) p-6 min-h-[250px] flex flex-col items-center justify-center">
                  <div className="flex items-center gap-2 mb-4">
                    <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs text-yellow-500/80">
                      Non-standard notation
                    </span>
                  </div>
                  <p className="font-mono text-lg text-(--text-primary) text-center break-all leading-relaxed">
                    {setupMoves}
                  </p>
                  <p className="text-xs text-(--text-muted) mt-4 text-center">
                    3D preview unavailable - practice by executing the algorithm
                    above
                  </p>
                </div>
              )}
            </div>

            {/* Timer Display */}
            <div
              className="mb-6"
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
              onContextMenu={(e) => e.preventDefault()}
              style={{
                userSelect: "none",
                WebkitUserSelect: "none",
                touchAction: "none",
              }}
            >
              <div className="text-center min-h-[200px] flex flex-col justify-center cursor-pointer">
                <div
                  className={`text-6xl font-bold font-mono ${getTimerColor()} mb-4 transition-colors`}
                >
                  {timerState === "inspection"
                    ? inspectionTime.toFixed(2)
                    : timerState === "running" || timerState === "finished"
                      ? formatTime(
                          timerState === "finished"
                            ? executionTime || 0
                            : currentTime - startTime,
                        )
                      : timerState === "holding"
                        ? inspectionTime < 15
                          ? "Ready"
                          : "Ready"
                        : "0.00"}
                </div>

                <p className="text-sm text-(--text-secondary) mb-4">
                  {getStatusText()}
                </p>

                {/* Manual buttons */}
                {timerState === "finished" && (
                  <div className="flex gap-2 justify-center mt-4">
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-(--primary) hover:bg-(--primary-hover) text-white rounded-lg transition-colors font-medium"
                    >
                      Next Case
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            {timerState === "idle" && (
              <div className="p-4 bg-(--surface-elevated) rounded-lg">
                <h4 className="text-sm font-semibold text-(--text-primary) mb-2">
                  Tips:
                </h4>
                <ul className="space-y-1 text-sm text-(--text-secondary)">
                  <li>• Focus on smooth fingertricks and muscle memory</li>
                  <li>• Try to minimize pauses between moves</li>
                  <li>• Practice until you can execute without thinking</li>
                </ul>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}