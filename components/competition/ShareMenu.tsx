"use client";

import { useState, useRef, useEffect } from "react";
import { Share2, Link, X, CircleCheck } from "lucide-react";

interface ShareMenuProps {
  shareData: {
    title: string;
    text: string;
    url?: string;
  };
  onCopyLink?: () => void;
}

interface ShareOption {
  name: string;
  icon: React.ReactNode;
  color: string;
  getUrl: (data: { title: string; text: string; url?: string }) => string;
}

const SHARE_OPTIONS: ShareOption[] = [
  {
    name: "WhatsApp",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
      </svg>
    ),
    color: "bg-green-500 hover:bg-green-600",
    getUrl: (data) =>
      `https://wa.me/?text=${encodeURIComponent(data.text + (data.url ? "\n" + data.url : ""))}`,
  },
  {
    name: "X (Twitter)",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
    color:
      "bg-black hover:bg-gray-800 dark:bg-white dark:hover:bg-gray-200 dark:text-black",
    getUrl: (data) =>
      `https://twitter.com/intent/tweet?text=${encodeURIComponent(data.text)}&url=${encodeURIComponent(data.url || "")}`,
  },
  {
    name: "Facebook",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
    color: "bg-blue-600 hover:bg-blue-700",
    getUrl: (data) =>
      `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(data.url || "")}&quote=${encodeURIComponent(data.text)}`,
  },
  {
    name: "Reddit",
    icon: (
      <svg viewBox="0 0 24 24" className="w-5 h-5" fill="currentColor">
        <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" />
      </svg>
    ),
    color: "bg-orange-500 hover:bg-orange-600",
    getUrl: (data) =>
      `https://www.reddit.com/submit?url=${encodeURIComponent(data.url || "")}&title=${encodeURIComponent(data.title)}`,
  },
];

export default function ShareMenu({ shareData, onCopyLink }: ShareMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  const handleShare = async (option: ShareOption) => {
    const url = option.getUrl(shareData);
    window.open(url, "_blank", "noopener,noreferrer,width=600,height=400");
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    try {
      const textToCopy = shareData.url
        ? `${shareData.text}\n${shareData.url}`
        : shareData.text;
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      onCopyLink?.();
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: shareData.title,
          text: shareData.text,
          url: shareData.url,
        });
        setIsOpen(false);
      } catch (e) {
        // User cancelled or share failed
      }
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2 text-sm border border-(--border) bg-(--surface-elevated) text-(--text-secondary) rounded-lg hover:bg-(--surface) transition-colors"
      >
        <Share2 className="w-4 h-4" />
        Share
      </button>

      {isOpen && (
        <>
          {/* Mobile: Bottom sheet with backdrop */}
          <div className="fixed inset-0 z-[100] sm:hidden">
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setIsOpen(false)}
            />
            <div className="absolute bottom-0 left-0 right-0 bg-(--surface) border-t border-(--border) rounded-t-2xl shadow-lg">
              {/* Handle bar */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-10 h-1 bg-(--border) rounded-full" />
              </div>

              {/* Title */}
              <div className="px-4 pb-3 border-b border-(--border)">
                <h3 className="text-base font-semibold text-(--text-primary) text-center">
                  Share Results
                </h3>
              </div>

              {/* Share options */}
              <div className="p-4">
                {/* Copy Link */}
                <button
                  onClick={handleCopyLink}
                  className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-xl transition-colors mb-2"
                >
                  <div className="w-10 h-10 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-primary)">
                    {copied ? (
                      <CircleCheck className="w-5 h-5 text-(--success)" />
                    ) : (
                      <Link className="w-5 h-5" />
                    )}
                  </div>
                  <span className="font-medium">
                    {copied ? "Copied!" : "Copy to Clipboard"}
                  </span>
                </button>

                {/* Native share */}
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    onClick={handleNativeShare}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-xl transition-colors mb-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-(--primary) flex items-center justify-center text-white">
                      <Share2 className="w-5 h-5" />
                    </div>
                    <span className="font-medium">Share via...</span>
                  </button>
                )}

                {/* Social options grid */}
                <div className="flex justify-center gap-4 pt-2 pb-4">
                  {SHARE_OPTIONS.map((option) => (
                    <button
                      key={option.name}
                      onClick={() => handleShare(option)}
                      className="flex flex-col items-center gap-2"
                    >
                      <div
                        className={`w-12 h-12 rounded-full ${option.color} flex items-center justify-center text-white transition-transform hover:scale-110`}
                      >
                        {option.icon}
                      </div>
                      <span className="text-[10px] text-(--text-muted)">
                        {option.name === "X (Twitter)" ? "X" : option.name}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Desktop: Dropdown menu */}
          <div className="hidden sm:block absolute bottom-full mb-2 right-0 w-64 bg-(--surface) border border-(--border) rounded-xl shadow-lg z-[100] overflow-hidden">
            <div className="p-3 border-b border-(--border)">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-(--text-primary)">
                  Share Results
                </span>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-(--surface-elevated) rounded-lg transition-colors"
                >
                  <X className="w-4 h-4 text-(--text-muted)" />
                </button>
              </div>
            </div>

            <div className="p-2">
              {/* Native share (mobile) */}
              {typeof navigator !== "undefined" && "share" in navigator && (
                <button
                  onClick={handleNativeShare}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-(--primary) flex items-center justify-center text-white">
                    <Share2 className="w-4 h-4" />
                  </div>
                  <span>Share via...</span>
                </button>
              )}

              {/* Copy Link */}
              <button
                onClick={handleCopyLink}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
              >
                <div className="w-8 h-8 rounded-full bg-(--surface-elevated) border border-(--border) flex items-center justify-center text-(--text-primary)">
                  {copied ? (
                    <CircleCheck className="w-4 h-4 text-(--success)" />
                  ) : (
                    <Link className="w-4 h-4" />
                  )}
                </div>
                <span>{copied ? "Copied!" : "Copy to Clipboard"}</span>
              </button>

              <div className="my-2 border-t border-(--border)" />

              {/* Social options */}
              <div className="grid grid-cols-4 gap-2 p-2">
                {SHARE_OPTIONS.map((option) => (
                  <button
                    key={option.name}
                    onClick={() => handleShare(option)}
                    className={`w-10 h-10 rounded-full ${option.color} flex items-center justify-center text-white transition-transform hover:scale-110`}
                    title={option.name}
                  >
                    {option.icon}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
