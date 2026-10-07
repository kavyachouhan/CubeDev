"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { ReactNode } from "react";
import { createPortal } from "react-dom";
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from "lucide-react";
import { cx } from "@/lib/cx";

export type ToastTone = "success" | "error" | "warning" | "info";

export interface ToastOptions {
  title?: ReactNode;
  description?: ReactNode;
  /** Milliseconds; defaults to 4000 (6000 for errors). `Infinity` sticks. */
  duration?: number;
  action?: { label: string; onClick: () => void };
}

interface ToastRecord extends ToastOptions {
  id: number;
  tone: ToastTone;
}

interface ToastApi {
  show: (tone: ToastTone, message: ReactNode, options?: ToastOptions) => number;
  success: (message: ReactNode, options?: ToastOptions) => number;
  error: (message: ReactNode, options?: ToastOptions) => number;
  warning: (message: ReactNode, options?: ToastOptions) => number;
  info: (message: ReactNode, options?: ToastOptions) => number;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

const MAX_VISIBLE = 3;

const TONE: Record<ToastTone, { Icon: typeof Info; color: string }> = {
  success: { Icon: CheckCircle2, color: "text-(--success)" },
  error: { Icon: XCircle, color: "text-(--error)" },
  warning: { Icon: AlertTriangle, color: "text-(--warning)" },
  info: { Icon: Info, color: "text-(--primary)" },
};

/**
 * Transient, non-blocking feedback ("Copied", "Saved", "Couldn't delete").
 * Mounted once in app/layout.tsx. Anything the user must act on belongs in
 * an inline Alert or a dialog, not a toast.
 */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastRecord[]>([]);
  const [mounted, setMounted] = useState(false);
  const nextId = useRef(1);

  useEffect(() => setMounted(true), []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id));
  }, []);

  const show = useCallback(
    (tone: ToastTone, message: ReactNode, options: ToastOptions = {}) => {
      const id = nextId.current++;
      const record: ToastRecord = {
        id,
        tone,
        ...options,
        title: options.title ?? message,
        description: options.title ? message : options.description,
      };
      setToasts((current) => [...current, record].slice(-MAX_VISIBLE));
      return id;
    },
    [],
  );

  const api = useMemo<ToastApi>(
    () => ({
      show,
      dismiss,
      success: (m, o) => show("success", m, o),
      error: (m, o) => show("error", m, o),
      warning: (m, o) => show("warning", m, o),
      info: (m, o) => show("info", m, o),
    }),
    [show, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      {mounted &&
        createPortal(
          <div
            aria-live="polite"
            aria-relevant="additions"
            className="fixed z-(--z-toast) inset-x-0 bottom-0 flex flex-col items-center gap-2 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pointer-events-none sm:inset-x-auto sm:right-4 sm:bottom-4 sm:items-end sm:px-0 sm:pb-0"
          >
            {toasts.map((toast) => (
              <ToastItem key={toast.id} toast={toast} onDismiss={dismiss} />
            ))}
          </div>,
          document.body,
        )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastRecord;
  onDismiss: (id: number) => void;
}) {
  const { Icon, color } = TONE[toast.tone];
  const duration =
    toast.duration ?? (toast.tone === "error" ? 6000 : 4000);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused || !Number.isFinite(duration)) return;
    const id = window.setTimeout(() => onDismiss(toast.id), duration);
    return () => window.clearTimeout(id);
  }, [paused, duration, toast.id, onDismiss]);

  return (
    <div
      role={toast.tone === "error" ? "alert" : "status"}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      className="popover-panel pointer-events-auto w-full sm:w-96 flex items-start gap-3 p-3 pr-2 animate-toast-in"
    >
      <Icon className={cx("w-5 h-5 shrink-0 mt-px", color)} aria-hidden />
      <div className="flex-1 min-w-0 font-inter">
        <p className="text-sm font-semibold text-(--text-primary)">{toast.title}</p>
        {toast.description && (
          <p className="text-xs text-(--text-secondary) mt-0.5">{toast.description}</p>
        )}
      </div>
      {toast.action && (
        <button
          type="button"
          onClick={() => {
            toast.action?.onClick();
            onDismiss(toast.id);
          }}
          className="shrink-0 self-center px-2 py-1 text-sm font-semibold text-(--primary) rounded-(--radius-control) hover:bg-(--primary)/10"
        >
          {toast.action.label}
        </button>
      )}
      <button
        type="button"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss notification"
        className="icon-btn w-7 h-7 shrink-0 [&_svg]:w-4 [&_svg]:h-4"
      >
        <X />
      </button>
    </div>
  );
}

const NOOP_API: ToastApi = {
  show: () => 0,
  success: () => 0,
  error: () => 0,
  warning: () => 0,
  info: () => 0,
  dismiss: () => {},
};

export function useToast(): ToastApi {
  return useContext(ToastContext) ?? NOOP_API;
}
