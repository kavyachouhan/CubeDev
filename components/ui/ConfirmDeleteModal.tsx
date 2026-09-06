"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, Trash2, X } from "lucide-react";

export interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void | Promise<void>;
  title: string;
  description: string;
  itemName?: string;
  warning?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  requireTypedConfirmation?: string;
  tone?: "danger" | "warning";
  isDeleting?: boolean;
}

export default function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  itemName,
  warning = "This action cannot be undone.",
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  requireTypedConfirmation,
  tone = "danger",
  isDeleting: isDeletingProp,
}: ConfirmDeleteModalProps) {
  const titleId = useId();
  const descriptionId = useId();
  const cancelRef = useRef<HTMLButtonElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const onConfirmRef = useRef(onConfirm);

  const [mounted, setMounted] = useState(false);
  const [typedValue, setTypedValue] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [internalDeleting, setInternalDeleting] = useState(false);

  const isControlled = isDeletingProp !== undefined;
  const isDeleting = isControlled ? isDeletingProp : internalDeleting;
  const isDanger = tone !== "warning";
  const typedMatches =
    !requireTypedConfirmation || typedValue === requireTypedConfirmation;
  const canConfirm = typedMatches && !isDeleting;

  const canConfirmRef = useRef(canConfirm);
  const isDeletingRef = useRef(isDeleting);
  canConfirmRef.current = canConfirm;
  isDeletingRef.current = isDeleting;

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    onConfirmRef.current = onConfirm;
  }, [onConfirm]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setTypedValue("");
      setError(null);
      setInternalDeleting(false);
    }
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isDeletingRef.current) return;
    onCloseRef.current();
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!canConfirmRef.current) return;

    setError(null);
    if (!isControlled) setInternalDeleting(true);

    try {
      await onConfirmRef.current();
      if (!isControlled) onCloseRef.current();
    } catch (caught) {
      const message =
        caught instanceof Error
          ? caught.message
          : "Something went wrong. Please try again.";
      setError(message);
    } finally {
      if (!isControlled) setInternalDeleting(false);
    }
  }, [isControlled]);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        handleClose();
        return;
      }

      if (event.key === "Enter" && !event.shiftKey && canConfirmRef.current) {
        const target = event.target as HTMLElement | null;
        if (target?.tagName === "TEXTAREA" || target?.tagName === "BUTTON") {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        void handleConfirm();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      cancelRef.current?.focus();
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen, handleClose, handleConfirm]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[10050]">
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleClose}
      />

      <div className="absolute inset-0 flex items-end justify-center sm:items-center sm:p-4 pointer-events-none">
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          className="pointer-events-auto w-full max-w-md bg-(--surface) border border-(--border) rounded-t-2xl sm:rounded-xl shadow-lg outline-none animate-slide-up sm:animate-fade-in pb-[max(1rem,env(safe-area-inset-bottom))] sm:pb-0"
          onClick={(event) => event.stopPropagation()}
          onKeyDown={(event) => event.stopPropagation()}
        >
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 bg-(--border) rounded-full" />
          </div>

          <div className="flex items-center justify-between p-4 border-b border-(--border)">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={`p-2 rounded-lg shrink-0 ${
                  isDanger ? "bg-(--error)/10" : "bg-(--warning)/10"
                }`}
              >
                <AlertTriangle
                  className={`w-5 h-5 ${
                    isDanger ? "text-(--error)" : "text-(--warning)"
                  }`}
                />
              </div>
              <h2
                id={titleId}
                className="text-lg md:text-xl font-bold text-(--text-primary) font-statement truncate"
              >
                {title}
              </h2>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            <p
              id={descriptionId}
              className="text-sm text-(--text-secondary) font-inter"
            >
              {description}
            </p>

            {itemName ? (
              <div className="p-3 bg-(--surface-elevated) border border-(--border) rounded-lg">
                <p className="text-sm font-medium text-(--text-primary) font-inter truncate">
                  {itemName}
                </p>
              </div>
            ) : null}

            <div
              className={`flex items-start gap-2 p-3 rounded-lg border ${
                isDanger
                  ? "bg-(--error)/10 border-(--error)/20"
                  : "bg-(--warning)/10 border-(--warning)/20"
              }`}
            >
              <AlertTriangle
                className={`w-4 h-4 shrink-0 mt-0.5 ${
                  isDanger ? "text-(--error)" : "text-(--warning)"
                }`}
              />
              <p
                className={`text-xs font-inter ${
                  isDanger ? "text-(--error)" : "text-(--warning)"
                }`}
              >
                {warning}
              </p>
            </div>

            {requireTypedConfirmation ? (
              <div className="space-y-2">
                <label className="block text-sm font-medium text-(--text-secondary) font-inter">
                  Type{" "}
                  <span
                    className={`font-bold ${
                      isDanger ? "text-(--error)" : "text-(--warning)"
                    }`}
                  >
                    {requireTypedConfirmation}
                  </span>{" "}
                  to confirm:
                </label>
                <input
                  type="text"
                  value={typedValue}
                  onChange={(event) => setTypedValue(event.target.value)}
                  placeholder={requireTypedConfirmation}
                  disabled={isDeleting}
                  autoComplete="off"
                  className={`w-full px-3 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:ring-2 focus:border-transparent transition-all font-inter text-sm disabled:opacity-50 ${
                    isDanger
                      ? "focus:ring-(--error)"
                      : "focus:ring-(--warning)"
                  }`}
                />
              </div>
            ) : null}

            {error ? (
              <div className="flex items-start gap-2 p-3 bg-(--error)/10 border border-(--error)/20 rounded-lg">
                <AlertTriangle className="w-4 h-4 text-(--error) shrink-0 mt-0.5" />
                <p className="text-xs text-(--error) font-inter">{error}</p>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-4 border-t border-(--border) bg-(--surface-elevated) sm:rounded-b-xl">
            <button
              ref={cancelRef}
              type="button"
              onClick={handleClose}
              disabled={isDeleting}
              className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-(--surface) hover:bg-(--surface-elevated) border border-(--border) text-(--text-primary) rounded-lg transition-colors font-button text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {cancelLabel}
            </button>
            <button
              type="button"
              onClick={() => void handleConfirm()}
              disabled={!canConfirm}
              className={`w-full sm:flex-1 px-4 py-2.5 sm:py-2 text-white rounded-lg transition-colors font-button text-sm disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 ${
                isDanger
                  ? "bg-(--error) hover:bg-(--error)/90"
                  : "bg-(--warning) hover:bg-(--warning)/90"
              }`}
            >
              {isDeleting ? (
                "Deleting..."
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  {confirmLabel}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}