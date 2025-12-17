"use client";

import { useState, useEffect, useRef } from "react";
import { Play } from "lucide-react";
import CubeVisualizer3D from "./CubeVisualizer3D";

interface ExecutionPracticeCardProps {
  caseName: string;
  algorithm: string;
  setupMoves: string;
  puzzleType?: string; // "3x3x3", "2x2x2", etc.
  onComplete: (timeMs: number) => void;
  hasStarted?: boolean;
  onStart?: () => void;
}

export default function ExecutionPracticeCard({
  caseName,
  algorithm,
  setupMoves,
  puzzleType = "3x3x3",
  onComplete,
  hasStarted = false,
  onStart,
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
        return "text-[var(--primary)]";
      case "finished":
        return "text-green-500";
      default:
        return "text-[var(--text-muted)]";
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
            <Play className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-2">
              Execution Drill
            </h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
              Practice executing algorithms as fast as possible. Focus on smooth
              fingertricks and muscle memory.
            </p>
            <button
              onClick={onStart}
              className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium text-lg"
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
              <h3 className="text-3xl font-bold text-[var(--primary)] font-statement mb-2">
                {caseName}
              </h3>
              <div className="inline-block px-4 py-2 bg-[var(--surface-elevated)] rounded-lg">
                <p className="text-sm text-[var(--text-muted)] mb-1">
                  Algorithm
                </p>
                <p className="text-lg font-mono text-[var(--text-primary)]">
                  {algorithm}
                </p>
              </div>
            </div>

            {/* Cube Visualization */}
            <div className="mb-6">
              <CubeVisualizer3D
                algorithm={setupMoves}
                puzzle={puzzleType as any}
                autoPlay={false}
                showControls={true}
                height="300px"
              />
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
                            : currentTime - startTime
                        )
                      : timerState === "holding"
                        ? inspectionTime < 15
                          ? "Ready"
                          : "Ready"
                        : "0.00"}
                </div>

                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {getStatusText()}
                </p>

                {/* Manual buttons */}
                {timerState === "finished" && (
                  <div className="flex gap-2 justify-center mt-4">
                    <button
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium"
                    >
                      Next Case
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Tips */}
            {timerState === "idle" && (
              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                  Tips:
                </h4>
                <ul className="space-y-1 text-sm text-[var(--text-secondary)]">
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
