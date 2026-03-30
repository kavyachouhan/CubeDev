"use client";

import { useEffect, useRef } from "react";

export interface ActionOption {
  label: string;
  description?: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
}

interface ActionBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  options: ActionOption[];
}

export default function ActionBottomSheet({
  isOpen,
  onClose,
  title,
  options,
}: ActionBottomSheetProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const hasDescriptions = options.some((o) => !!o.description);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Mobile: Bottom sheet */}
      <div className="fixed inset-0 z-[100] sm:hidden">
        <div className="absolute inset-0 bg-black/50" onClick={onClose} />
        <div className="absolute bottom-0 left-0 right-0 bg-(--surface) border-t border-(--border) rounded-t-2xl shadow-lg animate-slide-up">
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 bg-(--border) rounded-full" />
          </div>

          {/* Title */}
          {title && (
            <div className="px-4 pb-3 border-b border-(--border)">
              <h3 className="text-base font-semibold text-(--text-primary) text-center">
                {title}
              </h3>
            </div>
          )}

          {/* Options */}
          <div className="p-3 pb-8">
            {options.map((option, index) => (
              <button
                key={index}
                onClick={() => {
                  option.onClick();
                  onClose();
                }}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl transition-colors text-left ${
                  option.variant === "danger"
                    ? "text-red-500 hover:bg-red-500/10"
                    : "text-(--text-primary) hover:bg-(--surface-elevated)"
                }`}
              >
                {option.icon && (
                  <div
                    className={`shrink-0 ${
                      option.variant === "danger"
                        ? ""
                        : "p-2 bg-(--surface-elevated) border border-(--border) rounded-lg"
                    }`}
                  >
                    {option.icon}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium">{option.label}</p>
                  {option.description && (
                    <p className="text-xs text-(--text-muted) mt-0.5">
                      {option.description}
                    </p>
                  )}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Desktop: Dropdown positioned by parent */}
      <div className="hidden sm:block" ref={menuRef}>
        <div className="fixed inset-0 z-40" onClick={onClose} />
        <div
          className="absolute left-1/2 -translate-x-1/2 top-full mt-1 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-50 py-1 overflow-hidden"
          style={{ minWidth: hasDescriptions ? "20rem" : "13rem" }}
        >
          {options.map((option, index) => (
            <button
              key={index}
              onClick={() => {
                option.onClick();
                onClose();
              }}
              className={`w-full flex items-start gap-3 px-3 py-2.5 text-sm transition-colors text-left ${
                option.variant === "danger"
                  ? "text-red-500 hover:bg-red-500/10"
                  : "text-(--text-primary) hover:bg-(--surface-elevated)"
              }`}
            >
              {option.icon && (
                <div className="shrink-0 mt-0.5">{option.icon}</div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium">{option.label}</p>
                {option.description && (
                  <p className="text-xs text-(--text-muted) mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </button>
          ))}
        </div>
      </div>
    </>
  );
}