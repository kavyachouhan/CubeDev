"use client";

import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  headerAction?: React.ReactNode;
}

export default function BottomSheet({
  isOpen,
  onClose,
  title,
  children,
  headerAction,
}: BottomSheetProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) return;

    previouslyFocusedRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        onCloseRef.current();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    requestAnimationFrame(() => {
      const active = document.activeElement;
      if (
        !active ||
        active === document.body ||
        panelRef.current === active
      ) {
        panelRef.current?.focus();
      }
    });

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
      previouslyFocusedRef.current?.focus?.();
    };
  }, [isOpen]);

  if (!mounted || !isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[120]">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="absolute bottom-0 left-0 right-0 bg-(--surface) border-t border-(--border) rounded-t-2xl shadow-lg animate-slide-up outline-none"
        onKeyDown={(event) => event.stopPropagation()}
      >
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-10 h-1 bg-(--border) rounded-full" />
        </div>

        <div className="relative px-4 pb-3 border-b border-(--border)">
          <h3 className="text-base font-semibold text-(--text-primary) text-center font-statement">
            {title}
          </h3>
          {headerAction && (
            <div className="absolute right-4 top-0">{headerAction}</div>
          )}
        </div>

        <div className="max-h-[70vh] overflow-y-auto p-3 pb-[max(2rem,env(safe-area-inset-bottom))]">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}