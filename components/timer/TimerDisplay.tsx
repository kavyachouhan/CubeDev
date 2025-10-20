"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Settings, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";
import {
  getSplitMethod,
  ConsistencyCoachSettings,
  DEFAULT_CONSISTENCY_SETTINGS,
  BPM_TO_MS,
  type PhaseSplit,
} from "@/lib/phase-splits";
import PhaseResults from "./PhaseResults";
import TimerSettings, { TimerMode } from "./TimerSettings";
import PhaseIndicator from "./PhaseIndicator";
import PenaltyButtons from "./PenaltyButtons";
import TimerCore from "./TimerCore";
import ManualTimerCore from "./ManualTimerCore";
import StackmatTimerCore from "./StackmatTimerCore";

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

interface TimerDisplayProps {
  onSolveComplete: (
    time: number,
    notes?: string,
    tags?: string[],
    splits?: PhaseSplit[],
    splitMethod?: string,
    timerMode?: "normal" | "manual" | "stackmat"
  ) => void;
  onSolveCompleteWithPenalty?: (
    time: number,
    penalty: "none" | "+2" | "DNF",
    notes?: string,
    tags?: string[],
    timerMode?: "normal" | "manual" | "stackmat"
  ) => void;
  onApplyPenalty?: (penalty: "none" | "+2" | "DNF") => void;
  lastSolveId?: string | null;
  onTimerStateChange?: (isActive: boolean) => void;
}

type TimerState =
  | "idle"
  | "inspection"
  | "ready"
  | "running"
  | "stopped"
  | "holding";

export default function TimerDisplay({
  onSolveComplete,
  onSolveCompleteWithPenalty,
  onApplyPenalty,
  lastSolveId,
  onTimerStateChange,
}: TimerDisplayProps) {
  const [state, setState] = useState<TimerState>("idle");
  const [time, setTime] = useState(0);
  const [inspectionTime, setInspectionTime] = useState(15);
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [showPenaltyButtons, setShowPenaltyButtons] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [currentPenalty, setCurrentPenalty] = useState<"none" | "+2" | "DNF">(
    "none"
  );
  const [showTimer, setShowTimer] = usePersistentBool(
    "cubelab-timer-expanded",
    true
  );
  const [timerMode, setTimerMode] = useState<TimerMode>(() => {
    if (typeof window === "undefined") return "normal";
    try {
      const saved = localStorage.getItem("cubelab-timer-mode");
      return (saved as TimerMode) || "normal";
    } catch {
      return "normal";
    }
  });
  const [inspectionEnabled, setInspectionEnabled] = usePersistentBool(
    "cubelab-inspection-enabled",
    true
  );
  const [focusModeEnabled, setFocusModeEnabled] = usePersistentBool(
    "cubelab-focus-mode-enabled",
    false
  );

  // Phase Split Settings
  const [phaseSplitsEnabled, setPhaseSplitsEnabled] = usePersistentBool(
    "cubelab-phase-splits-enabled",
    false
  );
  const [selectedSplitMethod, setSelectedSplitMethod] = useState<string>(() => {
    if (typeof window === "undefined") return "cfop";
    try {
      const saved = localStorage.getItem("cubelab-split-method");
      return saved || "cfop";
    } catch {
      return "cfop";
    }
  });
  const [currentSplits, setCurrentSplits] = useState<PhaseSplit[]>([]);
  const [currentPhaseIndex, setCurrentPhaseIndex] = useState<number>(0); // Track which phase we're on

  // Consistency Coach Settings
  const [consistencyCoach, setConsistencyCoach] =
    useState<ConsistencyCoachSettings>(() => {
      if (typeof window === "undefined") return DEFAULT_CONSISTENCY_SETTINGS;
      try {
        const saved = localStorage.getItem("cubelab-consistency-coach");
        return saved ? JSON.parse(saved) : DEFAULT_CONSISTENCY_SETTINGS;
      } catch {
        return DEFAULT_CONSISTENCY_SETTINGS;
      }
    });
  const [metronomeIntervalRef, setMetronomeIntervalRef] =
    useState<NodeJS.Timeout | null>(null);

  const startTimeRef = useRef<number>(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const inspectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const timerContentRef = useRef<HTMLDivElement>(null);
  const touchStartTimeRef = useRef<number>(0);
  const isTouchActiveRef = useRef<boolean>(false);
  const onSolveCompleteRef = useRef(onSolveComplete);
  const onTimerStateChangeRef = useRef(onTimerStateChange);
  const prevTimerModeRef = useRef<TimerMode>(timerMode);

  // Keep refs updated to avoid stale closures
  useEffect(() => {
    onSolveCompleteRef.current = onSolveComplete;
  }, [onSolveComplete]);

  useEffect(() => {
    onTimerStateChangeRef.current = onTimerStateChange;
  }, [onTimerStateChange]);

  // Persist split method
  useEffect(() => {
    try {
      localStorage.setItem("cubelab-split-method", selectedSplitMethod);
    } catch {}
  }, [selectedSplitMethod]);

  // Persist timer mode
  useEffect(() => {
    try {
      localStorage.setItem("cubelab-timer-mode", timerMode);
    } catch {}
  }, [timerMode]);

  // Disable incompatible settings when timer mode changes
  useEffect(() => {
    // Disable phase splits when switching away from normal mode
    if (timerMode !== "normal" && phaseSplitsEnabled) {
      setPhaseSplitsEnabled(false);
      console.log(
        "Phase splits disabled - only available in Normal timer mode"
      );
    }

    // Disable consistency coach when switching to manual mode
    if (timerMode === "manual" && consistencyCoach.enabled) {
      setConsistencyCoach((prev) => ({
        ...prev,
        enabled: false,
      }));
      console.log(
        "Consistency coach disabled - not available in Manual timer mode"
      );
    }
  }, [
    timerMode,
    phaseSplitsEnabled,
    consistencyCoach.enabled,
    setPhaseSplitsEnabled,
  ]);

  // Stop active timer when switching modes (uses ref to detect actual mode change)
  useEffect(() => {
    // Only run cleanup if mode actually changed
    if (prevTimerModeRef.current !== timerMode) {

      if (
        state === "running" ||
        state === "holding" ||
        state === "inspection"
      ) {
        setState("idle");
        setTime(0);
        setInspectionTime(15);

        // Clear intervals
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        if (inspectionIntervalRef.current) {
          clearInterval(inspectionIntervalRef.current);
          inspectionIntervalRef.current = null;
        }
        if (metronomeIntervalRef) {
          clearInterval(metronomeIntervalRef);
          setMetronomeIntervalRef(null);
        }

        // Reset phase data
        setCurrentSplits([]);
        setCurrentPhaseIndex(0);
        setCurrentPenalty("none");
        setShowPenaltyButtons(false);
      }

      prevTimerModeRef.current = timerMode;
    }
  }, [timerMode, state, metronomeIntervalRef]);

  // Persist consistency coach settings
  useEffect(() => {
    try {
      localStorage.setItem(
        "cubelab-consistency-coach",
        JSON.stringify(consistencyCoach)
      );
    } catch {}
  }, [consistencyCoach]);

  // Consistency Coach Metronome Functions
  const initializeAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
      } catch (error) {
        console.log("Audio context not available:", error);
      }
    }
  }, []);

  // Play beep sound
  const playBeep = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        initializeAudioContext();
      }

      if (!audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = 800;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.3, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.1
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.1);
    } catch (error) {
      console.log("Audio not available:", error);
    }
  }, [initializeAudioContext]);

  const playAlert = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        initializeAudioContext();
      }

      if (!audioContextRef.current) return;

      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);

      oscillator.frequency.value = 1200;
      oscillator.type = "sine";
      gainNode.gain.setValueAtTime(0.4, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContextRef.current.currentTime + 0.2
      );

      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + 0.2);
    } catch (error) {
      console.log("Audio not available:", error);
    }
  }, [initializeAudioContext]);

  const playMetronomeTick = useCallback(() => {
    try {
      if (!audioContextRef.current) {
        initializeAudioContext();
      }

      const audioContext = audioContextRef.current;
      if (!audioContext) return;

      // Resume context if suspended (required by some browsers)
      if (audioContext.state === "suspended") {
        audioContext.resume();
      }

      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      const frequency =
        consistencyCoach.sound === "tick"
          ? 2000
          : consistencyCoach.sound === "wood"
            ? 800
            : 1000;
      oscillator.frequency.value = frequency;
      oscillator.type = consistencyCoach.sound === "wood" ? "square" : "sine";

      const volume = (consistencyCoach.volume / 100) * 0.2; // Scale volume
      gainNode.gain.setValueAtTime(volume, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + 0.05
      );

      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.05);
    } catch (error) {
      console.log("Metronome audio not available:", error);
    }
  }, [consistencyCoach.sound, consistencyCoach.volume, initializeAudioContext]);

  const startMetronome = useCallback(() => {
    if (metronomeIntervalRef) {
      clearInterval(metronomeIntervalRef);
    }

    const interval = BPM_TO_MS(consistencyCoach.bpm);
    const newInterval = setInterval(playMetronomeTick, interval);
    setMetronomeIntervalRef(newInterval);
  }, [consistencyCoach.bpm, playMetronomeTick, metronomeIntervalRef]);

  const stopMetronome = useCallback(() => {
    if (metronomeIntervalRef) {
      clearInterval(metronomeIntervalRef);
      setMetronomeIntervalRef(null);
    }
  }, [metronomeIntervalRef]);

  // Stop metronome when timer stops
  useEffect(() => {
    if (state !== "running") {
      stopMetronome();
    }
  }, [state, stopMetronome]);

  // Timer logic
  useEffect(() => {
    if (state === "inspection") {
      inspectionIntervalRef.current = setInterval(() => {
        setInspectionTime((prev) => {
          const newTime = prev - 0.01;

          // Play alert at 8s and 3s
          if (Math.abs(newTime - 7) < 0.02 || Math.abs(newTime - 3) < 0.02) {
            playAlert();
          }

          if (newTime <= 0) {
            setState("running");
            setTime(0);
            setCurrentPenalty("none");
            startTimeRef.current = Date.now();
            playBeep();
            return 15;
          }
          return newTime;
        });
      }, 10);
    } else if (state === "running") {
      intervalRef.current = setInterval(() => {
        setTime(Date.now() - startTimeRef.current);
      }, 10);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (inspectionIntervalRef.current)
        clearInterval(inspectionIntervalRef.current);
    };
  }, [state, playBeep, playAlert]);

  // Notify parent of timer active state changes (for focus mode)
  useEffect(() => {
    if (onTimerStateChangeRef.current) {
      const isActive = state === "inspection" || state === "running";
      // Only notify if focus mode is enabled
      onTimerStateChangeRef.current(isActive && focusModeEnabled);
    }
  }, [state, focusModeEnabled]); // Only run when state or focus mode changes

  // Keyboard handling (only for normal timer mode)
  useEffect(() => {
    // Initialize audio context on first user interaction
    if (timerMode !== "normal") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      initializeAudioContext(); // Initialize audio context on first user interaction

      if (e.code === "Space") {
        e.preventDefault();
        if (!isSpacePressed) {
          setIsSpacePressed(true);
          if (state === "idle" || state === "stopped") {
            setState("holding");
          } else if (state === "inspection") {
            setState("ready");
          } else if (state === "running") {
            // Handle phase splits on space during solve (only in normal mode)
            if (phaseSplitsEnabled && timerMode === "normal") {
              const splitMethod = getSplitMethod(selectedSplitMethod);
              if (
                splitMethod &&
                currentPhaseIndex < splitMethod.phases.length
              ) {
                const currentTime = Date.now() - startTimeRef.current;
                const currentPhase = splitMethod.phases[currentPhaseIndex];

                const newSplit: PhaseSplit = {
                  phase: currentPhase.id,
                  time: currentTime,
                };

                setCurrentSplits((prev) => [...prev, newSplit]);
                setCurrentPhaseIndex((prev) => prev + 1);

                // Play alert on phase split
                playAlert();

                // If this was the final phase, end the timer
                if (currentPhaseIndex === splitMethod.phases.length - 1) {
                  setState("stopped");
                  const finalTime = Date.now() - startTimeRef.current;
                  setTime(finalTime);
                  playAlert();
                  // Only send splits in normal mode
                  onSolveCompleteRef.current(
                    finalTime,
                    undefined,
                    undefined,
                    timerMode === "normal" ? [...currentSplits, newSplit] : [],
                    timerMode === "normal" ? selectedSplitMethod : undefined,
                    timerMode
                  );
                  setShowPenaltyButtons(true);
                }
                return;
              }
            }

            // Allow space to stop timer (if phase splits not enabled or completed)
            setState("stopped");
            const finalTime = Date.now() - startTimeRef.current;
            setTime(finalTime);
            playBeep();
            // Only send splits in normal mode
            onSolveCompleteRef.current(
              finalTime,
              undefined,
              undefined,
              timerMode === "normal" ? currentSplits : [],
              timerMode === "normal" ? selectedSplitMethod : undefined,
              timerMode
            );
            setShowPenaltyButtons(true);
          }
        }
      } else if (state === "running") {
        // Allow 'S' key to stop timer
        e.preventDefault();
        setState("stopped");
        const finalTime = Date.now() - startTimeRef.current;
        setTime(finalTime);
        playBeep();
        // Only send splits in normal mode
        onSolveCompleteRef.current(
          finalTime,
          undefined,
          undefined,
          timerMode === "normal" ? currentSplits : [],
          timerMode === "normal" ? selectedSplitMethod : undefined,
          timerMode
        );
        setShowPenaltyButtons(true);
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        e.preventDefault();
        setIsSpacePressed(false);
        if (state === "holding") {
          // Determine what to do based on inspection setting
          if (inspectionEnabled) {
            setState("inspection");
            setInspectionTime(15);
          } else {
            // When inspection is off, go directly to running
            setState("running");
            setTime(0);
            setCurrentPenalty("none");
            setCurrentSplits([]); // Reset splits for new solve
            setCurrentPhaseIndex(0); // Reset phase index for new solve
            startTimeRef.current = Date.now();

            // Start consistency coach metronome
            if (consistencyCoach.enabled) {
              startMetronome();
            }

            playBeep();
          }
        } else if (state === "ready") {
          setState("running");
          setTime(0);
          setCurrentPenalty("none");
          setCurrentSplits([]); // Reset splits for new solve
          setCurrentPhaseIndex(0); // Reset phase index for new solve
          startTimeRef.current = Date.now();

          // Start consistency coach metronome
          if (consistencyCoach.enabled) {
            startMetronome();
          }

          playBeep();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [
    timerMode,
    state,
    isSpacePressed,
    inspectionEnabled,
    phaseSplitsEnabled,
    selectedSplitMethod,
    consistencyCoach,
    playBeep,
    startMetronome,
    currentPhaseIndex,
    initializeAudioContext,
  ]);

  // Touch and mouse handling
  const handleTouchStart = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      initializeAudioContext(); // Initialize audio context on first user interaction

      if (!isTouchActiveRef.current) {
        isTouchActiveRef.current = true;
        touchStartTimeRef.current = Date.now();

        if (state === "idle" || state === "stopped") {
          setState("holding");
        } else if (state === "inspection") {
          setState("ready");
        } else if (state === "running") {
          // Handle phase splits on touch/mouse during solve
          if (phaseSplitsEnabled) {
            const splitMethod = getSplitMethod(selectedSplitMethod);
            if (splitMethod && currentPhaseIndex < splitMethod.phases.length) {
              const currentTime = Date.now() - startTimeRef.current;
              const currentPhase = splitMethod.phases[currentPhaseIndex];

              const newSplit: PhaseSplit = {
                phase: currentPhase.id,
                time: currentTime,
              };

              setCurrentSplits((prev) => [...prev, newSplit]);
              setCurrentPhaseIndex((prev) => prev + 1);

              // Play alert on phase split
              if (currentPhaseIndex === splitMethod.phases.length - 1) {
                setState("stopped");
                const finalTime = Date.now() - startTimeRef.current;
                setTime(finalTime);
                playBeep();
                // Only send splits in normal mode
                onSolveCompleteRef.current(
                  finalTime,
                  undefined,
                  undefined,
                  timerMode === "normal" ? [...currentSplits, newSplit] : [],
                  timerMode === "normal" ? selectedSplitMethod : undefined,
                  timerMode
                );
                setShowPenaltyButtons(true);
              }
              return;
            }
          }

          // Allow touch/mouse to stop timer (if phase splits not enabled or completed)
          setState("stopped");
          const finalTime = Date.now() - startTimeRef.current;
          setTime(finalTime);
          playBeep();
          // Only send splits in normal mode
          onSolveCompleteRef.current(
            finalTime,
            undefined,
            undefined,
            timerMode === "normal" ? currentSplits : [],
            timerMode === "normal" ? selectedSplitMethod : undefined,
            timerMode
          );
          setShowPenaltyButtons(true);
        }
      }
    },
    [
      state,
      playBeep,
      phaseSplitsEnabled,
      selectedSplitMethod,
      currentPhaseIndex,
      currentSplits,
      initializeAudioContext,
      timerMode,
    ]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      e.preventDefault();
      if (isTouchActiveRef.current) {
        isTouchActiveRef.current = false;

        if (state === "holding") {
          // Determine what to do based on inspection setting
          if (inspectionEnabled) {
            setState("inspection");
            setInspectionTime(15);
          } else {
            // When inspection is off, go directly to running
            setState("running");
            setTime(0);
            setCurrentPenalty("none");
            startTimeRef.current = Date.now();
            playBeep();
          }
        } else if (state === "ready") {
          setState("running");
          setTime(0);
          setCurrentPenalty("none");
          startTimeRef.current = Date.now();
          playBeep();
        }
      }
    },
    [state, inspectionEnabled, playBeep]
  );

  // Handle penalty button clicks
  const handlePenalty = (penalty: "none" | "+2" | "DNF") => {
    setCurrentPenalty(penalty);
    if (onApplyPenalty) {
      onApplyPenalty(penalty);
    }
    setShowPenaltyButtons(false);
  };

  // Handle solve completion for manual and stackmat timers
  const handleManualOrStackmatSolveComplete = useCallback(
    async (time: number, penalty: "none" | "+2" | "DNF") => {
      try {
        // For manual and stackmat timers, use the specialized handler if available
        if (onSolveCompleteWithPenalty) {
          await onSolveCompleteWithPenalty(
            time,
            penalty,
            undefined,
            undefined,
            timerMode
          );
        } else {
          // Fallback to regular handler and apply penalty after
          await onSolveCompleteRef.current(
            time,
            undefined,
            undefined,
            [],
            undefined,
            timerMode
          );

          // Apply penalty if not "none"
          if (penalty !== "none" && onApplyPenalty) {
            // Delay slightly to ensure solve is recorded first
            setTimeout(() => {
              if (onApplyPenalty) {
                onApplyPenalty(penalty);
              }
            }, 100);
          }
        }
      } catch (error) {
        console.error("Error completing solve:", error);
      }
    },
    [onSolveCompleteWithPenalty, onApplyPenalty, timerMode]
  );

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowTimer(!showTimer)}
          className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
          title={showTimer ? "Hide timer" : "Show timer"}
        >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Timer
          </h3>
          {showTimer ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="p-1.5 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
            title="Timer Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowTimer(!showTimer)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showTimer ? "Hide timer" : "Show timer"}
          >
            {showTimer ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      <div
        ref={timerContentRef}
        className="overflow-hidden transition-all duration-300 ease-in-out"
        style={{
          height: showTimer ? "auto" : "0",
          opacity: showTimer ? 1 : 0,
        }}
      >
        {/* Settings Panel */}
        <TimerSettings
          showSettings={showSettings}
          timerMode={timerMode}
          setTimerMode={setTimerMode}
          inspectionEnabled={inspectionEnabled}
          setInspectionEnabled={setInspectionEnabled}
          focusModeEnabled={focusModeEnabled}
          setFocusModeEnabled={setFocusModeEnabled}
          phaseSplitsEnabled={phaseSplitsEnabled}
          setPhaseSplitsEnabled={setPhaseSplitsEnabled}
          selectedSplitMethod={selectedSplitMethod}
          setSelectedSplitMethod={setSelectedSplitMethod}
          consistencyCoach={consistencyCoach}
          setConsistencyCoach={setConsistencyCoach}
        />

        {/* Render timer based on selected mode */}
        {timerMode === "normal" && (
          <>
            <TimerCore
              state={state}
              time={time}
              inspectionTime={inspectionTime}
              currentPenalty={currentPenalty}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
              onMouseDown={handleTouchStart}
              onMouseUp={handleTouchEnd}
            >
              {/* Phase Split Indicator - Show during solving */}
              <PhaseIndicator
                phaseSplitsEnabled={phaseSplitsEnabled}
                isRunning={state === "running"}
                selectedSplitMethod={selectedSplitMethod}
                currentPhaseIndex={currentPhaseIndex}
              />

              {/* Penalty Buttons */}
              {state === "stopped" && (
                <PenaltyButtons
                  showPenaltyButtons={showPenaltyButtons}
                  currentPenalty={currentPenalty}
                  onPenaltyChange={handlePenalty}
                />
              )}
            </TimerCore>

            {/* Phase Results - Show after solve completion */}
            {state === "stopped" &&
              phaseSplitsEnabled &&
              currentSplits.length > 0 && (
                <PhaseResults
                  splits={currentSplits}
                  totalTime={time}
                  splitMethod={selectedSplitMethod}
                  className="mt-4"
                />
              )}
          </>
        )}

        {timerMode === "manual" && (
          <ManualTimerCore
            onSolveComplete={handleManualOrStackmatSolveComplete}
            inspectionEnabled={inspectionEnabled}
            playBeep={playBeep}
            playAlert={playAlert}
          />
        )}

        {timerMode === "stackmat" && (
          <StackmatTimerCore
            onSolveComplete={handleManualOrStackmatSolveComplete}
            inspectionEnabled={inspectionEnabled}
            playBeep={playBeep}
            playAlert={playAlert}
          />
        )}
      </div>
    </div>
  );
}