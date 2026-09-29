"use client";

import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import type {
  CSSProperties,
  KeyboardEvent as ReactKeyboardEvent,
  RefObject,
} from "react";

/*
 * Shared behavior for every layer that sits above the page: dialogs, sheets,
 * drawers and menus. Keeping it in one place is what makes Escape, focus
 * and scroll locking behave identically everywhere, including when layers
 * are nested (a confirm dialog opened from a settings sheet).
 */

const FOCUSABLE =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), iframe, [tabindex]:not([tabindex="-1"]), [contenteditable="true"]';

export function getFocusable(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>(FOCUSABLE)).filter(
    (el) => !el.hasAttribute("inert") && el.getClientRects().length > 0,
  );
}

/*
 * Stacking values for the dialog layers. These mirror the --z-* tokens in
 * app/globals.css; keep the two in sync. They exist in JS because an anchored
 * panel opened from inside a dialog has to compute a z-index above whichever
 * dialog it came from, which a static class cannot express.
 */
export const LAYER_Z = { modal: 110, nested: 120, tour: 140 } as const;

export type LayerName = keyof typeof LAYER_Z;

/* 0 means "not inside a dialog": anchored panels then use --z-dropdown. */
const LayerContext = createContext(0);

export const LayerProvider = LayerContext.Provider;

/** Stacking value of the nearest enclosing dialog, or 0 when there is none. */
export function useParentLayer() {
  return useContext(LayerContext);
}

/* Layer stack: only the top-most layer reacts to Escape and traps focus. */
const stack: number[] = [];
let nextLayerId = 1;

function isTop(id: number) {
  return stack[stack.length - 1] === id;
}

/* Ref-counted scroll lock that restores the previous inline styles. */
let lockCount = 0;
let savedOverflow = "";
let savedPaddingRight = "";

function lockScroll() {
  if (lockCount === 0) {
    const body = document.body;
    // "hidden" is only ever set by a scroll lock, so restoring it would
    // strand the page unscrollable if something else locked without
    // unlocking. Treat it as "no inline value".
    savedOverflow = body.style.overflow === "hidden" ? "" : body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    const scrollbar = window.innerWidth - document.documentElement.clientWidth;
    body.style.overflow = "hidden";
    if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
  }
  lockCount++;
}

function unlockScroll() {
  lockCount = Math.max(0, lockCount - 1);
  if (lockCount === 0) {
    document.body.style.overflow = savedOverflow;
    document.body.style.paddingRight = savedPaddingRight;
  }
}

export interface UseOverlayOptions {
  open: boolean;
  onClose: () => void;
  panelRef: RefObject<HTMLElement | null>;
  /** Escape and outside clicks close the layer. */
  dismissible?: boolean;
  /** Lock page scroll while open (dialogs, sheets, drawers). */
  lockScroll?: boolean;
  /** Keep Tab inside the panel (dialogs, sheets, drawers). */
  trapFocus?: boolean;
  /** Element to focus on open; defaults to `[data-autofocus]`, then the first field, then the panel. */
  initialFocusRef?: RefObject<HTMLElement | null>;
  /** Where focus goes on close; defaults to whatever had focus on open. */
  returnFocusRef?: RefObject<HTMLElement | null>;
}

export function useOverlay({
  open,
  onClose,
  panelRef,
  dismissible = true,
  lockScroll: shouldLock = true,
  trapFocus = true,
  initialFocusRef,
  returnFocusRef,
}: UseOverlayOptions) {
  const onCloseRef = useRef(onClose);
  const dismissibleRef = useRef(dismissible);

  useLayoutEffect(() => {
    onCloseRef.current = onClose;
    dismissibleRef.current = dismissible;
  });

  useEffect(() => {
    if (!open) return;

    const id = nextLayerId++;
    stack.push(id);
    const previouslyFocused = document.activeElement as HTMLElement | null;
    if (shouldLock) lockScroll();

    const focusInitial = () => {
      const panel = panelRef.current;
      if (!panel) return;
      if (panel.contains(document.activeElement)) return;
      const target =
        initialFocusRef?.current ??
        panel.querySelector<HTMLElement>("[data-autofocus]") ??
        panel.querySelector<HTMLElement>(
          "input:not([disabled]):not([type=hidden]), textarea:not([disabled]), select:not([disabled])",
        ) ??
        panel;
      target.focus({ preventScroll: true });
    };
    const frame = requestAnimationFrame(focusInitial);

    const onKeyDown = (event: KeyboardEvent) => {
      if (!isTop(id)) return;

      // A control inside the layer that handles Escape itself (an inline
      // edit field) calls preventDefault; the layer then stays open.
      if (event.key === "Escape" && event.defaultPrevented) return;

      if (event.key === "Escape") {
        if (!dismissibleRef.current) return;
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
        return;
      }

      if (event.key === "Tab" && trapFocus && panelRef.current) {
        const focusable = getFocusable(panelRef.current);
        if (focusable.length === 0) {
          event.preventDefault();
          panelRef.current.focus();
          return;
        }
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        const active = document.activeElement;
        if (event.shiftKey && (active === first || active === panelRef.current)) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && active === last) {
          event.preventDefault();
          first.focus();
        } else if (!panelRef.current.contains(active)) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    // Bubble phase, so handlers inside the layer see the key first.
    document.addEventListener("keydown", onKeyDown);

    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("keydown", onKeyDown);
      const index = stack.indexOf(id);
      if (index !== -1) stack.splice(index, 1);
      if (shouldLock) unlockScroll();
      const returnTarget = returnFocusRef?.current ?? previouslyFocused;
      if (returnTarget && document.contains(returnTarget)) {
        returnTarget.focus({ preventScroll: true });
      }
    };
    // panelRef/initialFocusRef/returnFocusRef are stable refs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, shouldLock, trapFocus]);
}

/** True after mount; portals need `document`. */
export function useMounted() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  return mounted;
}

/**
 * Stops key events inside a layer from reaching window-level shortcuts (the
 * timer's spacebar). Escape and Tab still propagate: the layer stack listens
 * for them on `document` to close and to trap focus.
 */
const isolate = (event: ReactKeyboardEvent) => {
  if (event.key !== "Escape" && event.key !== "Tab") event.stopPropagation();
};

export const isolateKeys = {
  onKeyDown: isolate,
  onKeyUp: isolate,
};

export type Placement = "bottom-start" | "bottom-end" | "top-start" | "top-end";

/**
 * Positions a fixed panel next to its trigger, flipping above when there's
 * no room below and clamping to the viewport. Recomputes on scroll/resize.
 */
export function useAnchoredPosition(
  open: boolean,
  triggerRef: RefObject<HTMLElement | null>,
  panelRef: RefObject<HTMLElement | null>,
  placement: Placement = "bottom-start",
  offset = 6,
  matchWidth = false,
) {
  const [style, setStyle] = useState<CSSProperties>({
    position: "fixed",
    top: 0,
    left: 0,
    visibility: "hidden",
  });

  useLayoutEffect(() => {
    if (!open) return;

    const update = () => {
      const trigger = triggerRef.current;
      const panel = panelRef.current;
      if (!trigger || !panel) return;
      const t = trigger.getBoundingClientRect();
      const p = panel.getBoundingClientRect();
      const margin = 8;
      const vw = window.innerWidth;
      const vh = window.innerHeight;

      const width = matchWidth ? Math.max(t.width, p.width) : p.width;
      const preferTop = placement.startsWith("top");
      const spaceBelow = vh - t.bottom - offset - margin;
      const spaceAbove = t.top - offset - margin;
      const placeTop = preferTop
        ? spaceAbove >= p.height || spaceAbove > spaceBelow
        : spaceBelow < p.height && spaceAbove > spaceBelow;

      let top = placeTop ? t.top - offset - p.height : t.bottom + offset;
      top = Math.max(margin, Math.min(top, vh - margin - p.height));

      let left = placement.endsWith("end") ? t.right - width : t.left;
      left = Math.max(margin, Math.min(left, vw - margin - width));

      setStyle({
        position: "fixed",
        top,
        left,
        minWidth: matchWidth ? t.width : undefined,
        maxHeight: Math.max(160, placeTop ? spaceAbove : spaceBelow),
        transformOrigin: placeTop ? "bottom" : "top",
        visibility: "visible",
      });
    };

    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open, triggerRef, panelRef, placement, offset, matchWidth]);

  return style;
}
