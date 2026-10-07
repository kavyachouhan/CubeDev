"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Box, ChevronDown, LogOut, Settings, User } from "lucide-react";
import { getAvatarUrl } from "@/lib/avatar";
import type { AvatarValue } from "@/lib/avatar";
import { Menu } from "@/components/ui/Menu";
import type { MenuItem } from "@/components/ui/Menu";

interface UserDropdownProps {
  user: {
    name: string;
    wcaId?: string;
    avatar?: AvatarValue;
  };
  onSignOut: () => void;
}

/** Account menu in the marketing header. Opens on click, not hover. */
export default function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  const router = useRouter();
  const avatarUrl = getAvatarUrl(user.avatar);

  const items: MenuItem[] = [
    { type: "label", label: user.wcaId ? `${user.name} · ${user.wcaId}` : user.name },
    { label: "Cube Lab", icon: <Box />, onSelect: () => router.push("/cube-lab/timer") },
    ...(user.wcaId
      ? [
          {
            label: "Public profile",
            icon: <User />,
            onSelect: () => router.push(`/cuber/${user.wcaId}`),
          },
        ]
      : []),
    { label: "Settings", icon: <Settings />, onSelect: () => router.push("/me") },
    { type: "separator" },
    { label: "Sign out", icon: <LogOut />, tone: "danger", onSelect: onSignOut },
  ];

  return (
    <Menu
      title="Account"
      items={items}
      className="min-w-60"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={`${user.name}: account menu`}
          className="flex items-center gap-2 px-2 py-1.5 rounded-(--radius-control) hover:bg-(--surface-elevated) transition-colors"
        >
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover"
            />
          )}
          <span className="hidden lg:block text-left">
            <span className="block text-sm font-semibold text-(--text-primary)">
              {user.name}
            </span>
            {user.wcaId && (
              <span className="block text-xs text-(--text-secondary) font-inter">
                {user.wcaId}
              </span>
            )}
          </span>
          <ChevronDown
            aria-hidden
            className={`w-4 h-4 text-(--text-secondary) transition-transform duration-(--duration-base) ${
              props["aria-expanded"] ? "rotate-180" : ""
            }`}
          />
        </button>
      )}
    />
  );
}
