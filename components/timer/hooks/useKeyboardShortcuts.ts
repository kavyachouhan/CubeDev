import { useCallback, useEffect, useState, useRef } from "react";

// Shortcut action types
export type ShortcutAction =
  | "scramble_222"
  | "scramble_333"
  | "scramble_444"
  | "scramble_555"
  | "scramble_666"
  | "scramble_777"
  | "scramble_sq1"
  | "scramble_pyram"
  | "scramble_minx"
  | "scramble_clock"
  | "scramble_skewb"
  | "toggle_manual_timer"
  | "clear_session"
  | "delete_last_solve"
  | "next_session"
  | "prev_session"
  | "next_scramble"
  | "prev_scramble"
  | "mark_dnf"
  | "mark_plus2"
  | "mark_ok";

// Shortcut configuration interface
export interface ShortcutConfig {
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
  action: ShortcutAction;
  label: string;
  description: string;
}

// Default shortcuts based on csTimer
export const DEFAULT_SHORTCUTS: ShortcutConfig[] = [
  // Event shortcuts
  {
    key: "2",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_222",
    label: "2x2",
    description: "Switch to 2x2 scramble",
  },
  {
    key: "3",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_333",
    label: "3x3",
    description: "Switch to 3x3 scramble",
  },
  {
    key: "4",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_444",
    label: "4x4",
    description: "Switch to 4x4 scramble",
  },
  {
    key: "5",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_555",
    label: "5x5",
    description: "Switch to 5x5 scramble",
  },
  {
    key: "6",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_666",
    label: "6x6",
    description: "Switch to 6x6 scramble",
  },
  {
    key: "7",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_777",
    label: "7x7",
    description: "Switch to 7x7 scramble",
  },
  {
    key: "1",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_sq1",
    label: "Square-1",
    description: "Switch to Square-1 scramble",
  },
  {
    key: "p",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_pyram",
    label: "Pyraminx",
    description: "Switch to Pyraminx scramble",
  },
  {
    key: "m",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_minx",
    label: "Megaminx",
    description: "Switch to Megaminx scramble",
  },
  {
    key: "c",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_clock",
    label: "Clock",
    description: "Switch to Clock scramble",
  },
  {
    key: "s",
    ctrl: false,
    alt: true,
    shift: false,
    action: "scramble_skewb",
    label: "Skewb",
    description: "Switch to Skewb scramble",
  },
  // Timer mode
  {
    key: "i",
    ctrl: false,
    alt: true,
    shift: false,
    action: "toggle_manual_timer",
    label: "Manual Timer",
    description: "Toggle manual time input mode",
  },
  // Session management
  {
    key: "d",
    ctrl: false,
    alt: true,
    shift: false,
    action: "clear_session",
    label: "Clear Session",
    description: "Remove all solves in current session",
  },
  {
    key: "z",
    ctrl: false,
    alt: true,
    shift: false,
    action: "delete_last_solve",
    label: "Undo Solve",
    description: "Remove the latest solve",
  },
  // Session navigation
  {
    key: "ArrowUp",
    ctrl: false,
    alt: true,
    shift: false,
    action: "prev_session",
    label: "Previous Session",
    description: "Switch to previous session",
  },
  {
    key: "ArrowDown",
    ctrl: false,
    alt: true,
    shift: false,
    action: "next_session",
    label: "Next Session",
    description: "Switch to next session",
  },
  // Scramble navigation
  {
    key: "ArrowLeft",
    ctrl: false,
    alt: true,
    shift: false,
    action: "prev_scramble",
    label: "Previous Scramble",
    description: "Display previous scramble",
  },
  {
    key: "ArrowRight",
    ctrl: false,
    alt: true,
    shift: false,
    action: "next_scramble",
    label: "Next Scramble",
    description: "Generate next scramble",
  },
  // Penalty shortcuts - using Alt+Shift to avoid browser tab switching conflicts
  {
    key: "d",
    ctrl: false,
    alt: true,
    shift: true,
    action: "mark_dnf",
    label: "Mark DNF",
    description: "Mark the latest solve as DNF",
  },
  {
    key: "p",
    ctrl: false,
    alt: true,
    shift: true,
    action: "mark_plus2",
    label: "Mark +2",
    description: "Mark the latest solve as +2",
  },
  {
    key: "o",
    ctrl: false,
    alt: true,
    shift: true,
    action: "mark_ok",
    label: "Mark OK",
    description: "Mark the latest solve as OK (remove penalty)",
  },
];

// Storage key for shortcuts
const SHORTCUTS_STORAGE_KEY = "cubelab-keyboard-shortcuts";
const SHORTCUTS_ENABLED_KEY = "cubelab-keyboard-shortcuts-enabled";

// Check if device is mobile
export function isMobileDevice(): boolean {
  if (typeof window === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  ) || window.matchMedia("(max-width: 768px)").matches;
}

// Format shortcut key combination for display
export function formatShortcut(config: ShortcutConfig): string {
  const parts: string[] = [];
  if (config.ctrl) parts.push("Ctrl");
  if (config.alt) parts.push("Alt");
  if (config.shift) parts.push("Shift");
  
  // Format key name
  let keyName = config.key;
  if (keyName === "ArrowUp") keyName = "↑";
  else if (keyName === "ArrowDown") keyName = "↓";
  else if (keyName === "ArrowLeft") keyName = "←";
  else if (keyName === "ArrowRight") keyName = "→";
  else keyName = keyName.toUpperCase();
  
  parts.push(keyName);
  return parts.join(" + ");
}

// Hook interface
interface UseKeyboardShortcutsProps {
  onEventChange?: (event: string) => void;
  onToggleManualTimer?: () => void;
  onClearSession?: () => void;
  onDeleteLastSolve?: () => void;
  onNextSession?: () => void;
  onPrevSession?: () => void;
  onNextScramble?: () => void;
  onPrevScramble?: () => void;
  onMarkDnf?: () => void;
  onMarkPlus2?: () => void;
  onMarkOk?: () => void;
  enabled?: boolean;
  timerRunning?: boolean;
  /** Set to true to activate shortcuts (only for timer page) */
  isTimerPage?: boolean;
}

interface UseKeyboardShortcutsReturn {
  shortcuts: ShortcutConfig[];
  isEnabled: boolean;
  isMobile: boolean;
  setEnabled: (enabled: boolean) => void;
  updateShortcut: (action: ShortcutAction, newConfig: Partial<ShortcutConfig>) => void;
  resetShortcuts: () => void;
  resetShortcut: (action: ShortcutAction) => void;
}

export function useKeyboardShortcuts(
  props: UseKeyboardShortcutsProps = {}
): UseKeyboardShortcutsReturn {
  const {
    onEventChange,
    onToggleManualTimer,
    onClearSession,
    onDeleteLastSolve,
    onNextSession,
    onPrevSession,
    onNextScramble,
    onPrevScramble,
    onMarkDnf,
    onMarkPlus2,
    onMarkOk,
    enabled: enabledProp,
    timerRunning = false,
    isTimerPage = false,
  } = props;

  const [isMobile, setIsMobile] = useState(false);
  const [shortcuts, setShortcuts] = useState<ShortcutConfig[]>(DEFAULT_SHORTCUTS);
  const [isEnabled, setIsEnabled] = useState(true);

  // Use refs to avoid stale closures
  const onEventChangeRef = useRef(onEventChange);
  const onToggleManualTimerRef = useRef(onToggleManualTimer);
  const onClearSessionRef = useRef(onClearSession);
  const onDeleteLastSolveRef = useRef(onDeleteLastSolve);
  const onNextSessionRef = useRef(onNextSession);
  const onPrevSessionRef = useRef(onPrevSession);
  const onNextScrambleRef = useRef(onNextScramble);
  const onPrevScrambleRef = useRef(onPrevScramble);
  const onMarkDnfRef = useRef(onMarkDnf);
  const onMarkPlus2Ref = useRef(onMarkPlus2);
  const onMarkOkRef = useRef(onMarkOk);
  const timerRunningRef = useRef(timerRunning);
  const isTimerPageRef = useRef(isTimerPage);

  // Update refs when props change
  useEffect(() => {
    onEventChangeRef.current = onEventChange;
    onToggleManualTimerRef.current = onToggleManualTimer;
    onClearSessionRef.current = onClearSession;
    onDeleteLastSolveRef.current = onDeleteLastSolve;
    onNextSessionRef.current = onNextSession;
    onPrevSessionRef.current = onPrevSession;
    onNextScrambleRef.current = onNextScramble;
    onPrevScrambleRef.current = onPrevScramble;
    onMarkDnfRef.current = onMarkDnf;
    onMarkPlus2Ref.current = onMarkPlus2;
    onMarkOkRef.current = onMarkOk;
    timerRunningRef.current = timerRunning;
    isTimerPageRef.current = isTimerPage;
  }, [
    onEventChange,
    onToggleManualTimer,
    onClearSession,
    onDeleteLastSolve,
    onNextSession,
    onPrevSession,
    onNextScramble,
    onPrevScramble,
    onMarkDnf,
    onMarkPlus2,
    onMarkOk,
    timerRunning,
    isTimerPage,
  ]);

  // Check for mobile device on mount
  useEffect(() => {
    setIsMobile(isMobileDevice());
    
    const handleResize = () => {
      setIsMobile(isMobileDevice());
    };
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Load shortcuts from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;

    try {
      // Load enabled state
      const enabledStored = localStorage.getItem(SHORTCUTS_ENABLED_KEY);
      if (enabledStored !== null) {
        setIsEnabled(JSON.parse(enabledStored));
      }

      // Load custom shortcuts
      const stored = localStorage.getItem(SHORTCUTS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as ShortcutConfig[];
        // Merge with defaults to handle new shortcuts
        const merged = DEFAULT_SHORTCUTS.map((defaultShortcut) => {
          const custom = parsed.find((s) => s.action === defaultShortcut.action);
          return custom ? { ...defaultShortcut, ...custom } : defaultShortcut;
        });
        setShortcuts(merged);
      }
    } catch (error) {
      console.error("Failed to load keyboard shortcuts:", error);
    }
  }, []);

  // Save shortcuts to localStorage
  const saveShortcuts = useCallback((newShortcuts: ShortcutConfig[]) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SHORTCUTS_STORAGE_KEY, JSON.stringify(newShortcuts));
    } catch (error) {
      console.error("Failed to save keyboard shortcuts:", error);
    }
  }, []);

  // Save enabled state to localStorage
  const saveEnabled = useCallback((enabled: boolean) => {
    if (typeof window === "undefined") return;
    try {
      localStorage.setItem(SHORTCUTS_ENABLED_KEY, JSON.stringify(enabled));
    } catch (error) {
      console.error("Failed to save keyboard shortcuts enabled state:", error);
    }
  }, []);

  // Update enabled state
  const setEnabled = useCallback(
    (enabled: boolean) => {
      setIsEnabled(enabled);
      saveEnabled(enabled);
    },
    [saveEnabled]
  );

  // Update a specific shortcut
  const updateShortcut = useCallback(
    (action: ShortcutAction, newConfig: Partial<ShortcutConfig>) => {
      setShortcuts((prev) => {
        const updated = prev.map((s) =>
          s.action === action ? { ...s, ...newConfig } : s
        );
        saveShortcuts(updated);
        return updated;
      });
    },
    [saveShortcuts]
  );

  // Reset all shortcuts to defaults
  const resetShortcuts = useCallback(() => {
    setShortcuts(DEFAULT_SHORTCUTS);
    saveShortcuts(DEFAULT_SHORTCUTS);
  }, [saveShortcuts]);

  // Reset a single shortcut to default
  const resetShortcut = useCallback(
    (action: ShortcutAction) => {
      const defaultShortcut = DEFAULT_SHORTCUTS.find((s) => s.action === action);
      if (defaultShortcut) {
        updateShortcut(action, defaultShortcut);
      }
    },
    [updateShortcut]
  );

  // Map action to event code
  const actionToEvent: Record<string, string> = {
    scramble_222: "222",
    scramble_333: "333",
    scramble_444: "444",
    scramble_555: "555",
    scramble_666: "666",
    scramble_777: "777",
    scramble_sq1: "sq1",
    scramble_pyram: "pyram",
    scramble_minx: "minx",
    scramble_clock: "clock",
    scramble_skewb: "skewb",
  };

  // Execute shortcut action
  const executeAction = useCallback((action: ShortcutAction) => {
    // Event changes
    if (action in actionToEvent) {
      onEventChangeRef.current?.(actionToEvent[action]);
      return;
    }

    // Other actions
    switch (action) {
      case "toggle_manual_timer":
        onToggleManualTimerRef.current?.();
        break;
      case "clear_session":
        onClearSessionRef.current?.();
        break;
      case "delete_last_solve":
        onDeleteLastSolveRef.current?.();
        break;
      case "next_session":
        onNextSessionRef.current?.();
        break;
      case "prev_session":
        onPrevSessionRef.current?.();
        break;
      case "next_scramble":
        onNextScrambleRef.current?.();
        break;
      case "prev_scramble":
        onPrevScrambleRef.current?.();
        break;
      case "mark_dnf":
        onMarkDnfRef.current?.();
        break;
      case "mark_plus2":
        onMarkPlus2Ref.current?.();
        break;
      case "mark_ok":
        onMarkOkRef.current?.();
        break;
    }
  }, []);

  // Handle keyboard events
  useEffect(() => {
    // Don't add listeners if mobile, disabled, or not on timer page
    const actualEnabled = enabledProp !== undefined ? enabledProp : isEnabled;
    if (isMobile || !actualEnabled || !isTimerPage) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when timer is running (let timer handle its own keys)
      if (timerRunningRef.current) return;

      // Don't intercept when typing in inputs, textareas, or contenteditable
      const target = e.target as HTMLElement;
      if (
        target.tagName === "INPUT" ||
        target.tagName === "TEXTAREA" ||
        target.isContentEditable
      ) {
        return;
      }

      // Don't intercept when a modal/dialog is open
      const hasOpenDialog = document.querySelector('[role="dialog"]') !== null;
      const hasOpenModal = document.querySelector('.modal-open, [data-modal-open="true"]') !== null;
      if (hasOpenDialog || hasOpenModal) {
        return;
      }

      // Don't intercept if user is in a select/dropdown
      if (target.tagName === "SELECT" || target.closest('[role="listbox"]')) {
        return;
      }

      // Find matching shortcut
      const matchingShortcut = shortcuts.find(
        (s) =>
          s.key.toLowerCase() === e.key.toLowerCase() &&
          s.ctrl === (e.ctrlKey || e.metaKey) &&
          s.alt === e.altKey &&
          s.shift === e.shiftKey
      );

      if (matchingShortcut) {
        // Check if the corresponding handler exists
        const hasHandler = (() => {
          switch (matchingShortcut.action) {
            case "scramble_222":
            case "scramble_333":
            case "scramble_444":
            case "scramble_555":
            case "scramble_666":
            case "scramble_777":
            case "scramble_sq1":
            case "scramble_pyram":
            case "scramble_minx":
            case "scramble_clock":
            case "scramble_skewb":
              return !!onEventChangeRef.current;
            case "toggle_manual_timer":
              return !!onToggleManualTimerRef.current;
            case "clear_session":
              return !!onClearSessionRef.current;
            case "delete_last_solve":
              return !!onDeleteLastSolveRef.current;
            case "next_session":
              return !!onNextSessionRef.current;
            case "prev_session":
              return !!onPrevSessionRef.current;
            case "next_scramble":
              return !!onNextScrambleRef.current;
            case "prev_scramble":
              return !!onPrevScrambleRef.current;
            case "mark_dnf":
              return !!onMarkDnfRef.current;
            case "mark_plus2":
              return !!onMarkPlus2Ref.current;
            case "mark_ok":
              return !!onMarkOkRef.current;
            default:
              return false;
          }
        })();

        // Only prevent default and execute if we have a handler
        if (hasHandler) {
          e.preventDefault();
          e.stopPropagation();
          executeAction(matchingShortcut.action);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [shortcuts, isEnabled, enabledProp, isMobile, isTimerPage, executeAction]);

  return {
    shortcuts,
    isEnabled: enabledProp !== undefined ? enabledProp : isEnabled,
    isMobile,
    setEnabled,
    updateShortcut,
    resetShortcuts,
    resetShortcut,
  };
}

export default useKeyboardShortcuts;
