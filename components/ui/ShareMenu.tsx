"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Check, Link as LinkIcon, Share2 } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "./IconButton";
import { Popover } from "./Menu";
import type { TriggerProps } from "./Menu";
import type { Placement } from "./overlay";
import { useToast } from "./Toast";

export interface ShareData {
  /** Title for native share sheets and Reddit. */
  title: string;
  /** Body text; copied to the clipboard together with `url`. */
  text: string;
  url?: string;
}

/*
 * Third-party brand marks. These are the only literal colors allowed in the
 * UI (brand guidelines require them). lucide has no brand icons, so the
 * glyphs are inline SVG.
 */
const TARGETS: {
  name: string;
  className: string;
  icon: ReactNode;
  href: (data: ShareData) => string;
}[] = [
  {
    name: "WhatsApp",
    className: "bg-[#25d366] text-(--on-primary)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    href: ({ text, url }) =>
      `https://wa.me/?text=${encodeURIComponent(url ? `${text}\n${url}` : text)}`,
  },
  {
    name: "X",
    className: "bg-(--text-primary) text-(--background)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    href: ({ text, url }) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}${
        url ? `&url=${encodeURIComponent(url)}` : ""
      }`,
  },
  {
    name: "Facebook",
    className: "bg-[#1877f2] text-(--on-primary)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    href: ({ text, url }) =>
      `https://www.facebook.com/sharer/sharer.php?${
        url ? `u=${encodeURIComponent(url)}&` : ""
      }quote=${encodeURIComponent(text)}`,
  },
  {
    name: "Reddit",
    className: "bg-[#ff4500] text-(--on-primary)",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden>
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    href: ({ title, text, url }) =>
      url
        ? `https://www.reddit.com/submit?url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`
        : `https://reddit.com/submit?title=${encodeURIComponent(title)}&text=${encodeURIComponent(text)}`,
  },
];

export interface ShareMenuProps {
  /** Heading of the panel/sheet, e.g. "Share solve". */
  title: string;
  data: ShareData | (() => ShareData);
  trigger?: (props: TriggerProps) => ReactNode;
  /** Extra actions above the targets (e.g. "Download image"). */
  children?: ReactNode | ((close: () => void) => ReactNode);
  placement?: Placement;
  /** Called after the payload is copied to the clipboard. */
  onCopy?: () => void;
}

/** The one share UI: copy, native share sheet, then brand targets. */
export function ShareMenu({
  title,
  data,
  trigger,
  children,
  placement = "bottom-end",
  onCopy,
}: ShareMenuProps) {
  const toast = useToast();
  const [copied, setCopied] = useState(false);
  const [canNativeShare, setCanNativeShare] = useState(false);

  useEffect(() => {
    setCanNativeShare(typeof navigator !== "undefined" && "share" in navigator);
  }, []);

  useEffect(() => {
    if (!copied) return;
    const id = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(id);
  }, [copied]);

  const resolve = () => (typeof data === "function" ? data() : data);

  const copy = async () => {
    const { text, url } = resolve();
    try {
      await navigator.clipboard.writeText(url ? `${text}\n${url}` : text);
      setCopied(true);
      onCopy?.();
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Couldn't copy", {
        description: "Your browser blocked clipboard access.",
      });
    }
  };

  const nativeShare = async (close: () => void) => {
    const payload = resolve();
    try {
      await navigator.share(payload);
      close();
    } catch {
      // The user dismissed the system share sheet; nothing to report.
    }
  };

  return (
    <Popover
      title={title}
      placement={placement}
      className="w-[min(18rem,calc(100vw-1rem))]"
      trigger={
        trigger ??
        ((props) => (
          <IconButton {...props} aria-label={title} icon={<Share2 />} />
        ))
      }
    >
      {(close) => (
        <div className="space-y-1">
          <ShareRow
            onClick={copy}
            icon={copied ? <Check className="text-(--success)" /> : <LinkIcon />}
            label={copied ? "Copied" : "Copy to clipboard"}
            autoFocus
          />
          {canNativeShare && (
            <ShareRow
              onClick={() => nativeShare(close)}
              icon={<Share2 />}
              label="Share via…"
            />
          )}
          {typeof children === "function" ? children(close) : children}
          <div className="border-t border-(--border) mt-1 pt-3 pb-1 grid grid-cols-4 gap-1">
            {TARGETS.map((target) => (
              <button
                key={target.name}
                type="button"
                data-menu-item
                onClick={() => {
                  window.open(
                    target.href(resolve()),
                    "_blank",
                    "noopener,noreferrer,width=600,height=500",
                  );
                  close();
                }}
                className="flex flex-col items-center gap-1.5 py-1 rounded-(--radius-control) hover:bg-(--surface-elevated) transition-colors"
              >
                <span
                  className={cx(
                    "w-10 h-10 rounded-full flex items-center justify-center [&_svg]:w-5 [&_svg]:h-5",
                    target.className,
                  )}
                >
                  {target.icon}
                </span>
                <span className="text-[0.6875rem] text-(--text-muted) font-inter">
                  {target.name}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}
    </Popover>
  );
}

/** A full-width action row inside a share panel. */
export function ShareRow({
  onClick,
  icon,
  label,
  disabled,
  autoFocus,
}: {
  onClick: () => void;
  icon: ReactNode;
  label: ReactNode;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  return (
    <button
      type="button"
      data-menu-item
      data-autofocus={autoFocus ? true : undefined}
      onClick={onClick}
      disabled={disabled}
      className="w-full min-h-11 sm:min-h-10 flex items-center gap-3 px-2 rounded-(--radius-control) text-sm font-inter text-(--text-primary) hover:bg-(--surface-elevated) transition-colors disabled:opacity-50"
    >
      <span className="w-8 h-8 shrink-0 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-secondary) [&_svg]:w-4 [&_svg]:h-4">
        {icon}
      </span>
      {label}
    </button>
  );
}
