"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareMenu } from "@/components/ui/ShareMenu";

interface RoomShareMenuProps {
  roomId: string;
  roomName: string;
  eventName: string;
  format: string;
}

/**
 * Share control for a challenge room. Built on the shared ShareMenu, so it
 * offers the native share sheet where the device has one, brand targets, and
 * copy-to-clipboard — rather than silently copying and nothing else.
 */
export default function RoomShareMenu({
  roomId,
  roomName,
  eventName,
  format,
}: RoomShareMenuProps) {
  return (
    <ShareMenu
      title="Share room"
      data={() => ({
        title: roomName,
        text: `Join "${roomName}" — a ${format.toUpperCase()} ${eventName} challenge room on CubeDev. Same scrambles, everyone races.`,
        url:
          typeof window === "undefined"
            ? `https://cubedev.xyz/cube-lab/challenges/room/${roomId}`
            : `${window.location.origin}/cube-lab/challenges/room/${roomId}`,
      })}
      trigger={(props) => (
        // One element, not a hidden desktop twin: the popover anchors on this
        // ref, and a display:none trigger would position the panel at 0,0.
        <Button
          {...props}
          size="sm"
          aria-label="Share room"
          iconLeft={<Share2 className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Share</span>
        </Button>
      )}
    />
  );
}
