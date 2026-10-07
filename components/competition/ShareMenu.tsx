"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareMenu as SharedShareMenu } from "@/components/ui/ShareMenu";

interface ShareMenuProps {
  shareData: {
    title: string;
    text: string;
    url?: string;
  };
  onCopyLink?: () => void;
}

/** Share control for competition results, built on the shared ShareMenu. */
export default function ShareMenu({ shareData, onCopyLink }: ShareMenuProps) {
  return (
    <SharedShareMenu
      title="Share results"
      placement="top-end"
      data={shareData}
      onCopy={onCopyLink}
      trigger={(props) => (
        <Button {...props} variant="subtle" iconLeft={<Share2 className="w-4 h-4" />}>
          Share
        </Button>
      )}
    />
  );
}
