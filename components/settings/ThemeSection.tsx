"use client";

import { Sparkles } from "lucide-react";

export default function ThemeSection() {
  return (
    <div className="timer-card">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Theme & Appearance
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Customize your CubeDev experience
          </p>
        </div>
      </div>

      <div className="text-center py-12">
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-[var(--primary)]/10 rounded-full">
            <Sparkles className="w-8 h-8 text-[var(--primary)]" />
          </div>
        </div>

        <h4 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
          Coming Soon!
        </h4>

        <p className="text-[var(--text-secondary)] mb-6 max-w-md mx-auto">
          We're working on exciting theme customization options including
          dark/light modes, color schemes, and timer appearance settings.
        </p>
      </div>
    </div>
  );
}