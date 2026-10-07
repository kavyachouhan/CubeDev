"use client";

import { RotateCcw } from "lucide-react";
import { Card, CardHeader, IconButton } from "@/components/ui";

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
  return (
    <Card>
      <CardHeader
        title="Current Scramble"
        actions={
          canEdit && onNewScramble ? (
            <IconButton
              size="sm"
              aria-label="Generate new scramble"
              title="Generate new scramble"
              icon={<RotateCcw />}
              onClick={onNewScramble}
            />
          ) : undefined
        }
      />

      <div className="p-4 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border)">
        <p className="text-lg font-mono text-(--text-primary) text-center leading-relaxed wrap-break-word">
          {scramble}
        </p>
      </div>
    </Card>
  );
}
