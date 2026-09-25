"use client";

import { useRef } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { isolateKeys, useMounted, useOverlay } from "./overlay";

export interface LightboxMedia {
  url: string;
  isVideo?: boolean;
  /** Alt text for images; ignored for video. */
  alt?: string;
}

export interface LightboxProps {
  media: LightboxMedia | null;
  onClose: () => void;
}

/**
 * Full-screen media viewer. Sits above modals (journal entries open it from
 * inside a dialog), so it uses the nested layer and its own opaque scrim.
 */
export function Lightbox({ media, onClose }: LightboxProps) {
  const mounted = useMounted();
  const panelRef = useRef<HTMLDivElement>(null);

  useOverlay({ open: !!media, onClose, panelRef });

  if (!mounted || !media) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-(--z-nested) bg-black/95 flex items-center justify-center p-4"
      onClick={onClose}
      {...isolateKeys}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={media.isVideo ? "Video preview" : "Image preview"}
        tabIndex={-1}
        className="outline-none max-w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {media.isVideo ? (
          <video
            src={media.url}
            controls
            autoPlay
            className="max-w-full max-h-[90dvh] rounded-(--radius-card)"
          />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element -- Convex storage URL, unknown dimensions
          <img
            src={media.url}
            alt={media.alt ?? "Full size preview"}
            className="max-w-full max-h-[90dvh] object-contain rounded-(--radius-card)"
          />
        )}
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Close preview"
        data-autofocus
        className="absolute top-4 right-4 p-2 rounded-full text-(--on-media) bg-white/10 hover:bg-white/20 transition-colors"
      >
        <X className="w-6 h-6" />
      </button>
    </div>,
    document.body,
  );
}
