"use client";

import {
  createContext,
  useContext,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type { PointerEvent, ReactNode, RefObject } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "./IconButton";
import { LAYER_Z, LayerProvider, isolateKeys, useMounted, useOverlay } from "./overlay";
import type { LayerName } from "./overlay";

export type ModalSize = "sm" | "md" | "lg" | "xl" | "2xl";
/**
 * Below 640px:
 * - `sheet` — slides up from the bottom (forms, settings, confirmations)
 * - `fullscreen` — takes the whole screen (dense content, wizards)
 * - `dialog` — stays a centered card (tours, very short messages)
 */
export type ModalMobile = "sheet" | "fullscreen" | "dialog";

const WIDTH: Record<ModalSize, string> = {
  sm: "sm:max-w-sm",
  md: "sm:max-w-md",
  lg: "sm:max-w-lg",
  xl: "sm:max-w-2xl",
  "2xl": "sm:max-w-4xl",
};

interface ModalContextValue {
  titleId: string;
  descriptionId: string;
  onClose: () => void;
  dismissible: boolean;
  mobile: ModalMobile;
  setHasDescription: (value: boolean) => void;
  dragHandlers: {
    onPointerDown: (e: PointerEvent) => void;
    onPointerMove: (e: PointerEvent) => void;
    onPointerUp: (e: PointerEvent) => void;
    onPointerCancel: (e: PointerEvent) => void;
  };
}

const ModalContext = createContext<ModalContextValue | null>(null);

function useModalContext() {
  const context = useContext(ModalContext);
  if (!context) throw new Error("Modal parts must be rendered inside <Modal>");
  return context;
}

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  size?: ModalSize;
  mobile?: ModalMobile;
  /** When false, Escape, the backdrop and the close button do nothing. */
  dismissible?: boolean;
  /** Clicking the backdrop closes the modal (default true). Turn off for long forms. */
  closeOnBackdrop?: boolean;
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Accessible name when there is no `Modal.Header` title. */
  "aria-label"?: string;
  /** `alertdialog` for confirmations that interrupt the user. */
  role?: "dialog" | "alertdialog";
  className?: string;
  /** Stacking layer; nested dialogs (opened from a dialog) use "nested". */
  layer?: LayerName;
}

/**
 * The one dialog system. Compose with Modal.Header, Modal.Body and
 * Modal.Footer. Handles portal, scrim, focus trap and restore, Escape,
 * nested scroll locking and keeping keystrokes away from the timer.
 */
export function Modal({
  open,
  onClose,
  children,
  size = "md",
  mobile = "sheet",
  dismissible = true,
  closeOnBackdrop = true,
  initialFocusRef,
  role = "dialog",
  className,
  layer = "modal",
  ...aria
}: ModalProps) {
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  const [hasDescription, setHasDescription] = useState(false);
  const [dragY, setDragY] = useState(0);
  const dragStart = useRef<number | null>(null);

  useOverlay({
    open,
    onClose,
    panelRef,
    dismissible,
    initialFocusRef,
  });

  const dragHandlers = {
    onPointerDown: (e: PointerEvent) => {
      if (mobile !== "sheet" || !dismissible || window.innerWidth >= 640) return;
      dragStart.current = e.clientY;
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    },
    onPointerMove: (e: PointerEvent) => {
      if (dragStart.current === null) return;
      setDragY(Math.max(0, e.clientY - dragStart.current));
    },
    onPointerUp: () => {
      if (dragStart.current === null) return;
      dragStart.current = null;
      if (dragY > 96) onClose();
      setDragY(0);
    },
    onPointerCancel: () => {
      dragStart.current = null;
      setDragY(0);
    },
  };

  if (!mounted || !open) return null;

  const layerClass =
    layer === "nested" ? "z-(--z-nested)" : layer === "tour" ? "z-(--z-tour)" : "z-(--z-modal)";

  return createPortal(
    <LayerProvider value={LAYER_Z[layer]}>
    <ModalContext.Provider
      value={{
        titleId,
        descriptionId,
        onClose,
        dismissible,
        mobile,
        setHasDescription,
        dragHandlers,
      }}
    >
      <div className={cx("fixed inset-0", layerClass)} {...isolateKeys}>
        <div
          aria-hidden
          className="absolute inset-0 scrim animate-scrim-in"
          onClick={dismissible && closeOnBackdrop ? onClose : undefined}
        />
        <div
          className={cx(
            "absolute inset-0 flex justify-center pointer-events-none sm:items-center sm:p-4",
            mobile === "sheet" && "items-end",
            mobile === "dialog" && "items-center p-4",
            mobile === "fullscreen" && "items-stretch",
          )}
        >
          <div
            ref={panelRef}
            role={role}
            aria-modal="true"
            aria-labelledby={aria["aria-label"] ? undefined : titleId}
            aria-label={aria["aria-label"]}
            aria-describedby={hasDescription ? descriptionId : undefined}
            tabIndex={-1}
            onClick={(e) => e.stopPropagation()}
            style={dragY ? { transform: `translateY(${dragY}px)`, transition: "none" } : undefined}
            className={cx(
              "dialog-panel pointer-events-auto relative flex flex-col w-full outline-none",
              "sm:max-h-[min(90dvh,60rem)] sm:animate-dialog-in",
              WIDTH[size],
              mobile === "sheet" &&
                "max-h-[92dvh] rounded-b-none! rounded-t-(--radius-sheet)! border-b-0 sm:rounded-(--radius-card)! sm:border-b animate-sheet-in transition-transform pb-[env(safe-area-inset-bottom)] sm:pb-0",
              mobile === "dialog" && "max-h-[85dvh] animate-dialog-in",
              mobile === "fullscreen" &&
                "h-dvh max-h-dvh rounded-none! border-0 sm:h-auto sm:border sm:rounded-(--radius-card)! animate-sheet-in pb-[env(safe-area-inset-bottom)] sm:pb-0",
              className,
            )}
          >
            {mobile === "sheet" && (
              <div
                aria-hidden
                className="sm:hidden flex justify-center pt-2.5 pb-1 touch-none cursor-grab"
                {...dragHandlers}
              >
                <div className="w-10 h-1 rounded-full bg-(--border-hover)" />
              </div>
            )}
            {children}
          </div>
        </div>
      </div>
    </ModalContext.Provider>
    </LayerProvider>,
    document.body,
  );
}

interface ModalHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Leading icon tile (CardIcon) — use for confirmations and wizards. */
  icon?: ReactNode;
  /** Extra controls before the close button. */
  actions?: ReactNode;
  /**
   * Drop `actions` onto their own row below the title under `sm`, leaving only
   * the close button on the title row. Use it when there are two or more
   * actions, which would otherwise squeeze a long description into three lines
   * on a phone.
   */
  stackActions?: boolean;
  hideClose?: boolean;
  closeLabel?: string;
  className?: string;
}

function ModalHeader({
  title,
  description,
  icon,
  actions,
  stackActions,
  hideClose,
  closeLabel = "Close",
  className,
}: ModalHeaderProps) {
  const { titleId, descriptionId, onClose, dismissible, setHasDescription, mobile, dragHandlers } =
    useModalContext();

  // The dialog references the description only when one is rendered.
  const hasDescription = Boolean(description);
  useLayoutEffect(() => {
    setHasDescription(hasDescription);
  }, [hasDescription, setHasDescription]);

  const closeButton = !hideClose && dismissible && (
    <IconButton aria-label={closeLabel} icon={<X />} onClick={onClose} />
  );
  const stopDrag = (e: PointerEvent) => e.stopPropagation();

  return (
    <div
      className={cx(
        "px-(--dialog-pad) pb-4 border-b border-(--border) shrink-0",
        mobile === "sheet" ? "pt-2 sm:pt-(--dialog-pad)" : "pt-(--dialog-pad)",
        className,
      )}
      {...(mobile === "sheet" ? dragHandlers : {})}
    >
      <div className="flex items-start gap-3">
        {icon}
        <div className="flex-1 min-w-0 self-center">
          <h2 id={titleId} className="type-section-title wrap-break-word">
            {title}
          </h2>
          {description && (
            <p id={descriptionId} className="type-body mt-1">
              {description}
            </p>
          )}
        </div>
        {(actions || closeButton) && (
          <div
            className="flex items-center gap-1 shrink-0 -mr-1.5 -mt-1"
            onPointerDown={stopDrag}
          >
            {stackActions ? (
              <span className="hidden sm:flex items-center gap-1">{actions}</span>
            ) : (
              actions
            )}
            {closeButton}
          </div>
        )}
      </div>
      {stackActions && actions && (
        <div
          className="flex items-center gap-1 mt-3 -ml-1.5 sm:hidden"
          onPointerDown={stopDrag}
        >
          {actions}
        </div>
      )}
    </div>
  );
}

function ModalBody({
  children,
  className,
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  return (
    <div
      className={cx(
        "flex-1 min-h-0 overflow-y-auto overscroll-contain",
        padded && "px-(--dialog-pad) py-5",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * Action row. Order children as [secondary, primary]: on desktop they sit
 * right-aligned in that order; on mobile they stack full-width with the
 * primary on top. `start` holds extras (step counter, a destructive "Delete"
 * in edit forms, Share): left-aligned on desktop, and below the actions —
 * full-width like them — on mobile.
 */
function ModalFooter({
  children,
  start,
  className,
}: {
  children: ReactNode;
  start?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "shrink-0 flex flex-col gap-3 sm:flex-row sm:items-center px-(--dialog-pad) py-4 border-t border-(--border) bg-(--surface-elevated) sm:rounded-b-(--radius-card)",
        className,
      )}
    >
      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:gap-3 sm:order-2 sm:ml-auto [&>*]:w-full sm:[&>*]:w-auto">
        {children}
      </div>
      {start && (
        <div className="order-last sm:order-1 flex items-center gap-2 sm:mr-auto [&>*]:w-full sm:[&>*]:w-auto">
          {start}
        </div>
      )}
    </div>
  );
}

Modal.Header = ModalHeader;
Modal.Body = ModalBody;
Modal.Footer = ModalFooter;
