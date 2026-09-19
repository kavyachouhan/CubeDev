"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { RotateCcw, Check, X, ChevronDown, ChevronUp, Info } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { IconButton } from "@/components/ui/IconButton";
import { SwitchRow } from "@/components/ui/Switch";
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

  // Detect mobile device for warning message
  const [showMobileWarning, setShowMobileWarning] = useState(false);
  useEffect(() => {
    setShowMobileWarning(isMobileDevice());
  }, []);

  // Categorize shortcuts for display
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

  // Check for conflicts with existing shortcuts
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

  // Handle key capture when editing a shortcut
  const handleKeyCapture = useCallback(
    (e: KeyboardEvent) => {
      if (!editingAction) return;

      e.preventDefault();
      e.stopPropagation();

      // Ignore pure modifier keys
      if (["Control", "Alt", "Shift", "Meta"].includes(e.key)) {
        return;
      }

      // Allow exiting edit mode with Escape
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

  // Add/remove keydown listener when editing
  useEffect(() => {
    if (editingAction) {
      window.addEventListener("keydown", handleKeyCapture);
      return () => window.removeEventListener("keydown", handleKeyCapture);
    }
  }, [editingAction, handleKeyCapture]);

  // Focus the input when starting to edit
  useEffect(() => {
    if (editingAction && inputRef.current) {
      inputRef.current.focus();
    }
  }, [editingAction]);

  // Save the edited shortcut
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

  // Format the shortcut for display in the button
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

  // Check if the shortcut has been modified from the default
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
    <Card variant="static">
      <CardHeader
        title="Keyboard Shortcuts"
        description="Customize keyboard shortcuts for faster navigation"
      />

      {showMobileWarning && (
        <Alert tone="warning" title="Disabled on mobile">
          Keyboard shortcuts require a physical keyboard.
        </Alert>
      )}

      {!showMobileWarning && (
        <div className="space-y-4">
          <Alert tone="primary" size="sm" icon={<Info />}>
            Shortcuts only work on the Timer page (Cube Lab).
          </Alert>

          <SwitchRow
            label="Enable Shortcuts"
            description="Quick actions while using the timer"
            checked={isEnabled}
            onChange={setEnabled}
          />

          {isEnabled && (
            <>
              <Button
                variant="secondary"
                fullWidth
                aria-expanded={isExpanded}
                onClick={() => setIsExpanded(!isExpanded)}
                iconRight={
                  isExpanded ? (
                    <ChevronUp className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )
                }
                className="justify-between!"
              >
                {isExpanded ? "Hide" : "View"} Shortcuts
              </Button>

              {isExpanded && (
                <div className="space-y-4 sm:space-y-6">
                  <div className="flex justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetShortcuts}
                      iconLeft={<RotateCcw className="w-3.5 h-3.5" />}
                    >
                      Reset All
                    </Button>
                  </div>

                  {shortcutCategories.map((category) => (
                    <div key={category.name}>
                      <h4 className="type-overline mb-2 sm:mb-3">
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
                                    {modified && <Badge tone="primary">Modified</Badge>}
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
                                            ? "border-(--error) bg-(--error)/10 text-(--error)"
                                            : "border-(--primary) bg-(--surface) text-(--text-primary)"
                                        }
                                      `}
                                    >
                                      {editingShortcut
                                        ? formatEditingShortcut(editingShortcut)
                                        : "Press keys…"}
                                    </div>
                                    <IconButton
                                      size="sm"
                                      variant="primary"
                                      aria-label="Save shortcut"
                                      icon={<Check />}
                                      onClick={handleSaveShortcut}
                                      disabled={hasConflict || !editingShortcut}
                                    />
                                    <IconButton
                                      size="sm"
                                      aria-label="Cancel"
                                      icon={<X />}
                                      onClick={handleCancelEdit}
                                    />
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => handleStartEdit(shortcut)}
                                      aria-label={`Change shortcut for ${shortcut.label}: ${formatShortcut(shortcut)}`}
                                      className="px-2 sm:px-3 py-1.5 text-xs sm:text-sm type-time bg-(--surface) border border-(--border) border-b-2 rounded-(--radius-badge) hover:border-(--border-hover) text-(--text-secondary) transition-colors truncate max-w-35 sm:max-w-none"
                                    >
                                      {formatShortcut(shortcut)}
                                    </button>
                                    {modified && (
                                      <IconButton
                                        size="sm"
                                        aria-label="Reset to default"
                                        icon={<RotateCcw />}
                                        onClick={() => resetShortcut(shortcut.action)}
                                      />
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
                    <Alert tone="error" title="Shortcut conflict">
                      This key combination is already in use.
                    </Alert>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </Card>
  );
}