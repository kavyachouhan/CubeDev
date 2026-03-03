"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  Keyboard,
  RotateCcw,
  AlertTriangle,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from "lucide-react";
import {
  useKeyboardShortcuts,
  DEFAULT_SHORTCUTS,
  formatShortcut,
  isMobileDevice,
  ShortcutConfig,
  ShortcutAction,
} from "@/components/timer/hooks/useKeyboardShortcuts";

interface EditingShortcut {
  action: ShortcutAction;
  key: string;
  ctrl: boolean;
  alt: boolean;
  shift: boolean;
}

export default function KeyboardShortcutsSettings() {
  const {
    shortcuts,
    isEnabled,
    isMobile,
    setEnabled,
    updateShortcut,
    resetShortcuts,
    resetShortcut,
  } = useKeyboardShortcuts();

  const [isExpanded, setIsExpanded] = useState(false);
  const [editingAction, setEditingAction] = useState<ShortcutAction | null>(null);
  const [editingShortcut, setEditingShortcut] = useState<EditingShortcut | null>(
    null
  );
  const [hasConflict, setHasConflict] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);

  // Check for mobile on mount
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  useEffect(() => {
    setShowMobileWarning(isMobileDevice());
  }, []);

  // Group shortcuts by category
  const shortcutCategories = [
    {
      name: "Cube Events",
      shortcuts: shortcuts.filter((s) => s.action.startsWith("scramble_")),
    },
    {
      name: "Timer Controls",
      shortcuts: shortcuts.filter(
        (s) =>
          s.action === "toggle_manual_timer" ||
          s.action === "next_scramble" ||
          s.action === "prev_scramble"
      ),
    },
    {
      name: "Session Management",
      shortcuts: shortcuts.filter(
        (s) =>
          s.action === "clear_session" ||
          s.action === "delete_last_solve" ||
          s.action === "next_session" ||
          s.action === "prev_session"
      ),
    },
    {
      name: "Penalties",
      shortcuts: shortcuts.filter(
        (s) =>
          s.action === "mark_dnf" ||
          s.action === "mark_plus2" ||
          s.action === "mark_ok"
      ),
    },
  ];

  // Check for conflicts when editing
  const checkConflict = useCallback(
    (newConfig: EditingShortcut): boolean => {
      return shortcuts.some(
        (s) =>
          s.action !== newConfig.action &&
          s.key.toLowerCase() === newConfig.key.toLowerCase() &&
          s.ctrl === newConfig.ctrl &&
          s.alt === newConfig.alt &&
          s.shift === newConfig.shift
      );
    },
    [shortcuts]
  );

  // Handle key capture for editing
  const handleKeyCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!editingAction) return;

      e.preventDefault();
      e.stopPropagation();

      // Ignore modifier-only keys
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        return;
      }

      // Cancel on Escape
      if (e.key === "Escape") {
        setEditingAction(null);
        setEditingShortcut(null);
        setHasConflict(false);
        return;
      }

      const newConfig: EditingShortcut = {
        action: editingAction,
        key: e.key,
        ctrl: e.ctrlKey || e.metaKey,
        alt: e.altKey,
        shift: e.shiftKey,
      };

      const conflict = checkConflict(newConfig);
      setHasConflict(conflict);
      setEditingShortcut(newConfig);
    },
    [editingAction, checkConflict]
  );

  // Add/remove key listener when editing
  useEffect(() => {
    if (editingAction) {
      window.addEventListener("keydown", handleKeyCapture);
      return () => window.removeEventListener("keydown", handleKeyCapture);
    }
  }, [editingAction, handleKeyCapture]);

  // Focus ref when editing starts
  useEffect(() => {
    if (editingAction && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAction]);

  // Save shortcut
  const handleSaveShortcut = () => {
    if (!editingShortcut || hasConflict) return;

    updateShortcut(editingShortcut.action, {
      key: editingShortcut.key,
      ctrl: editingShortcut.ctrl,
      alt: editingShortcut.alt,
      shift: editingShortcut.shift,
    });

    setEditingAction(null);
    setEditingShortcut(null);
    setHasConflict(false);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingAction(null);
    setEditingShortcut(null);
    setHasConflict(false);
  };

  // Start editing a shortcut
  const handleStartEdit = (shortcut: ShortcutConfig) => {
    setEditingAction(shortcut.action);
    setEditingShortcut({
      action: shortcut.action,
      key: shortcut.key,
      ctrl: shortcut.ctrl,
      alt: shortcut.alt,
      shift: shortcut.shift,
    });
    setHasConflict(false);
  };

  // Format display for editing shortcut
  const formatEditingShortcut = (config: EditingShortcut): string => {
    const parts: string[] = [];
    if (config.ctrl) parts.push("Ctrl");
    if (config.alt) parts.push("Alt");
    if (config.shift) parts.push("Shift");

    let keyName = config.key;
    if (keyName === "ArrowUp") keyName = "↑";
    else if (keyName === "ArrowDown") keyName = "↓";
    else if (keyName === "ArrowLeft") keyName = "←";
    else if (keyName === "ArrowRight") keyName = "→";
    else keyName = keyName.toUpperCase();

    parts.push(keyName);
    return parts.join(" + ");
  };

  // Check if shortcut is modified from default
  const isModified = (shortcut: ShortcutConfig): boolean => {
    const defaultShortcut = DEFAULT_SHORTCUTS.find(
      (s) => s.action === shortcut.action
    );
    if (!defaultShortcut) return false;

    return (
      shortcut.key !== defaultShortcut.key ||
      shortcut.ctrl !== defaultShortcut.ctrl ||
      shortcut.alt !== defaultShortcut.alt ||
      shortcut.shift !== defaultShortcut.shift
    );
  };

  return (
    <div className="timer-card">
      {/* Header */}
      <div className="flex items-start gap-3 mb-6">
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
            Keyboard Shortcuts
          </h3>
          <p className="text-sm text-(--text-muted)">
            Customize keyboard shortcuts for faster navigation
          </p>
        </div>
      </div>

      {/* Mobile Warning */}
      {showMobileWarning && (
        <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-(--warning)/10 border border-(--warning)/20">
          <AlertTriangle className="w-5 h-5 text-(--warning) shrink-0 mt-0.5" />
          <div className="min-w-0">
            <p className="text-sm text-(--text-primary) font-medium">
              Disabled on mobile
            </p>
            <p className="text-xs text-(--text-muted) mt-1">
              Keyboard shortcuts require a physical keyboard.
            </p>
          </div>
        </div>
      )}

      {/* Desktop content */}
      {!showMobileWarning && (
        <div className="space-y-4">
          {/* Timer Page Info */}
          <div className="flex items-start gap-3 p-3 rounded-lg bg-(--primary)/5 border border-(--primary)/10">
            <Info className="w-4 h-4 text-(--primary) shrink-0 mt-0.5" />
            <p className="text-xs text-(--text-muted)">
              Shortcuts only work on the Timer page (Cube Lab).
            </p>
          </div>

          {/* Enable/Disable Toggle */}
          <div className="flex items-center justify-between gap-4 p-3 sm:p-4 rounded-lg border border-(--border)">
            <div className="min-w-0">
              <h4 className="text-sm font-medium text-(--text-primary)">
                Enable Shortcuts
              </h4>
              <p className="text-xs text-(--text-muted) mt-0.5">
                Quick actions while using the timer
              </p>
            </div>
            <button
              onClick={() => setEnabled(!isEnabled)}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors shrink-0
                ${isEnabled ? "bg-(--primary)" : "bg-(--border)"}
              `}
              role="switch"
              aria-checked={isEnabled}
              aria-label="Enable keyboard shortcuts"
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${isEnabled ? "translate-x-6" : "translate-x-1"}
                `}
              />
            </button>
          </div>

          {/* Expandable Shortcuts List */}
          {isEnabled && (
            <>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center justify-between w-full p-3 rounded-lg border border-(--border) hover:border-(--border-hover) transition-colors"
              >
                <span className="text-sm font-medium text-(--text-primary)">
                  {isExpanded ? "Hide" : "View"} Shortcuts
                </span>
                {isExpanded ? (
                  <ChevronUp className="w-4 h-4 text-(--text-muted)" />
                ) : (
                  <ChevronDown className="w-4 h-4 text-(--text-muted)" />
                )}
              </button>

              {isExpanded && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Reset All Button */}
                  <div className="flex justify-end">
                    <button
                      onClick={resetShortcuts}
                      className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-(--text-muted) hover:text-(--text-primary) border border-(--border) hover:border-(--border-hover) rounded-lg transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Reset All
                    </button>
                  </div>

                  {/* Shortcut Categories */}
                  {shortcutCategories.map((category) => (
                    <div key={category.name}>
                      <h4 className="text-xs font-semibold text-(--text-muted) uppercase tracking-wider mb-2 sm:mb-3">
                        {category.name}
                      </h4>
                      <div className="space-y-2">
                        {category.shortcuts.map((shortcut) => {
                          const isEditing = editingAction === shortcut.action;
                          const modified = isModified(shortcut);

                          return (
                            <div
                              key={shortcut.action}
                              className={`
                                p-2 sm:p-3 rounded-lg border transition-colors
                                ${
                                  isEditing
                                    ? "border-(--primary) bg-(--primary)/5"
                                    : "border-(--border) hover:border-(--border-hover)"
                                }
                              `}
                            >
                              {/* Responsive layout: stack on mobile */}
                              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4">
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <span className="text-sm text-(--text-primary)">
                                      {shortcut.label}
                                    </span>
                                    {modified && (
                                      <span className="px-1.5 py-0.5 text-[10px] font-medium bg-(--primary)/10 text-(--primary) rounded">
                                        Modified
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-xs text-(--text-muted) mt-0.5 line-clamp-1">
                                    {shortcut.description}
                                  </p>
                                </div>

                                {isEditing ? (
                                  <div className="flex items-center gap-2">
                                    <div
                                      ref={inputRef}
                                      tabIndex={0}
                                      className={`
                                        px-2 sm:px-3 py-1.5 flex-1 sm:flex-none min-w-0 sm:min-w-[100px] text-center text-xs sm:text-sm font-mono rounded border-2 transition-colors truncate
                                        ${
                                          hasConflict
                                            ? "border-red-500 bg-red-500/10 text-red-500"
                                            : "border-(--primary) bg-(--surface) text-(--text-primary)"
                                        }
                                      `}
                                    >
                                      {editingShortcut
                                        ? formatEditingShortcut(editingShortcut)
                                        : "Press keys..."}
                                    </div>
                                    <button
                                      onClick={handleSaveShortcut}
                                      disabled={hasConflict || !editingShortcut}
                                      className="p-1.5 rounded-lg bg-(--primary) text-white hover:bg-(--primary-hover) disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
                                      title="Save"
                                    >
                                      <Check className="w-4 h-4" />
                                    </button>
                                    <button
                                      onClick={handleCancelEdit}
                                      className="p-1.5 rounded-lg border border-(--border) text-(--text-muted) hover:border-(--border-hover) hover:text-(--text-primary) transition-colors shrink-0"
                                      title="Cancel"
                                    >
                                      <X className="w-4 h-4" />
                                    </button>
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      onClick={() => handleStartEdit(shortcut)}
                                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-mono bg-(--surface) border border-(--border) rounded hover:border-(--border-hover) text-(--text-secondary) transition-colors truncate max-w-[140px] sm:max-w-none"
                                    >
                                      {formatShortcut(shortcut)}
                                    </button>
                                    {modified && (
                                      <button
                                        onClick={() => resetShortcut(shortcut.action)}
                                        className="p-1.5 rounded-lg text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface) transition-colors shrink-0"
                                        title="Reset to default"
                                      >
                                        <RotateCcw className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}

                  {/* Conflict Warning */}
                  {hasConflict && (
                    <div className="flex items-start gap-3 p-3 sm:p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                      <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-sm text-(--text-primary) font-medium">
                          Shortcut conflict
                        </p>
                        <p className="text-xs text-(--text-muted) mt-1">
                          This key combination is already in use.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Tips */}
                  <div className="p-3 sm:p-4 rounded-lg bg-(--surface) border border-(--border)">
                    <h4 className="text-sm font-medium text-(--text-primary) mb-2">
                      Tips
                    </h4>
                    <ul className="space-y-1.5 text-xs text-(--text-muted)">
                      <li>- Click a shortcut key to customize it</li>
                      <li>- Press Escape to cancel editing</li>
                      <li>- Shortcuts are disabled while timer is running</li>
                      <li>- Use Ctrl, Alt, or Shift for unique combinations</li>
                    </ul>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
