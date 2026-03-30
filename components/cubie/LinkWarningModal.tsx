"use client";

import { AlertTriangle, ExternalLink, X } from "lucide-react";

interface LinkWarningModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  onProceed: () => void;
}

export default function LinkWarningModal({
  isOpen,
  onClose,
  url,
  onProceed,
}: LinkWarningModalProps) {
  if (!isOpen) return null;

  // Helper to extract domain from URL
  const getDomain = (urlString: string) => {
    try {
      const urlObj = new URL(urlString);
      return urlObj.hostname;
    } catch {
      return urlString;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-(--surface) border border-(--border) rounded-xl max-w-md w-full shadow-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border)">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-(--warning)/10 rounded-lg">
              <AlertTriangle className="w-5 h-5 text-(--warning)" />
            </div>
            <h2 className="text-lg md:text-xl font-bold text-(--text-primary) font-statement">
              External Link Warning
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          <p className="text-sm text-(--text-secondary) font-inter">
            You&apos;re about to visit an external website. While Cubie AI aims
            to provide helpful resources, please verify the legitimacy of
            external links before proceeding.
          </p>

          <div className="p-3 bg-(--surface-elevated) border border-(--border) rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <ExternalLink className="w-4 h-4 text-(--text-muted)" />
              <span className="text-xs font-semibold text-(--text-muted) font-inter">
                Destination:
              </span>
            </div>
            <p className="text-sm text-(--text-primary) font-inter break-all">
              {getDomain(url)}
            </p>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-(--text-muted) font-inter">
              Safety Tips:
            </p>
            <ul className="text-xs text-(--text-secondary) font-inter space-y-1 pl-4 list-disc">
              <li>Verify the URL matches the expected website</li>
              <li>Be cautious of sites requesting personal information</li>
              <li>Ensure the website uses HTTPS when available</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 p-4 border-t border-(--border) bg-(--surface-elevated)">
          <button
            onClick={onClose}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-(--surface) hover:bg-(--surface-elevated) border border-(--border) text-(--text-primary) rounded-lg transition-colors font-button text-sm"
          >
            Cancel
          </button>
          <button
            onClick={onProceed}
            className="w-full sm:flex-1 px-4 py-2.5 sm:py-2 bg-(--primary) hover:bg-(--primary)/90 text-white rounded-lg transition-colors font-button text-sm"
          >
            Continue to Link
          </button>
        </div>
      </div>
    </div>
  );
}