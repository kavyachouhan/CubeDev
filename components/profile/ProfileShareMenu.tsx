"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareMenu } from "@/components/ui/ShareMenu";

interface ProfileShareMenuProps {
  person: {
    name: string;
  };
  wcaId: string;
}

export default function ProfileShareMenu({
  person,
  wcaId,
}: ProfileShareMenuProps) {
  return (
    <ShareMenu
      title="Share profile"
      data={{
        title: `${person.name} on CubeDev`,
        text: `Check out ${person.name}'s cubing profile on CubeDev!`,
        url: `https://cubedev.xyz/cuber/${wcaId}`,
      }}
      trigger={(props) => (
        <Button {...props} variant="subtle" iconLeft={<Share2 className="w-4 h-4" />}>
          <span className="hidden sm:inline">Share Profile</span>
          <span className="sm:hidden">Share</span>
        </Button>
      )}
    />
  );
}
