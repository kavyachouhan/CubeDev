"use client";

import { useState } from "react";
import { RotateCcw, Eye, EyeOff } from "lucide-react";

interface RoomScrambleDisplayProps {
  scramble: string;
  canEdit?: boolean;
  onNewScramble?: () => void;
}

export default function RoomScrambleDisplay({
  scramble,
  canEdit = false,
  onNewScramble,
}: RoomScrambleDisplayProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="timer-card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
          Current Scramble
        </h3>
        <div className="flex items-center gap-2">
          {canEdit && onNewScramble && (
            <button
              onClick={onNewScramble}
              className="p-1.5 text-(--text-secondary) hover:text-(--primary) transition-colors"
              title="Generate new scramble"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1.5 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-md transition-colors"
            title={isExpanded ? "Hide scramble" : "Show scramble"}
          >
            {isExpanded ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 bg-(--surface-elevated) rounded-lg">
          <p className="text-lg font-mono text-(--text-primary) text-center leading-relaxed">
            {scramble}
          </p>
        </div>
      )}
    </div>
  );
}