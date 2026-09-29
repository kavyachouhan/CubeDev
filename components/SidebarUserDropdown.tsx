"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Home,
  LogOut,
  Mail,
  Settings,
  User,
  Users,
} from "lucide-react";
import { cx } from "@/lib/cx";
import { getAvatarUrl } from "@/lib/avatar";
import type { AvatarValue } from "@/lib/avatar";
import { Menu } from "@/components/ui/Menu";
import type { MenuItem } from "@/components/ui/Menu";

interface SidebarUserDropdownProps {
  user: {
    name: string;
    wcaId?: string;
    avatar?: AvatarValue;
  };
  onSignOut: () => void;
  collapsed?: boolean;
}

export default function SidebarUserDropdown({
  user,
  onSignOut,
  collapsed = false,
}: SidebarUserDropdownProps) {
  const router = useRouter();
  const avatarUrl = getAvatarUrl(user.avatar);

  const items: MenuItem[] = [
    { label: "Home", icon: <Home />, onSelect: () => router.push("/") },
    ...(user.wcaId
      ? [
          {
            label: "Public profile",
            icon: <User />,
            onSelect: () => router.push(`/cuber/${user.wcaId}`),
          },
        ]
      : []),
    { label: "Cubers", icon: <Users />, onSelect: () => router.push("/cuber") },
    { type: "separator" },
    { label: "Settings", icon: <Settings />, onSelect: () => router.push("/me") },
    { label: "Help center", icon: <HelpCircle />, onSelect: () => router.push("/help") },
    { label: "Contact", icon: <Mail />, onSelect: () => router.push("/contact") },
    { type: "separator" },
    { label: "Sign out", icon: <LogOut />, tone: "danger", onSelect: onSignOut },
  ];

  return (
    <Menu
      title="Account"
      placement="top-start"
      items={items}
      className="min-w-56"
      trigger={(props) => (
        <button
          {...props}
          type="button"
          aria-label={collapsed ? `${user.name}: account menu` : undefined}
          title={collapsed ? user.name : undefined}
          className={cx(
            collapsed
              ? "mx-auto flex p-1.5 rounded-full hover:bg-(--surface-elevated) transition-colors"
              : "w-full sidebar-user-card flex items-center gap-3 p-2.5 text-left",
          )}
        >
          {avatarUrl && (
            <Image
              src={avatarUrl}
              alt=""
              width={36}
              height={36}
              className={cx(
                "rounded-full object-cover border-2 border-(--primary)/40",
                collapsed ? "w-8 h-8" : "w-9 h-9",
              )}
            />
          )}
          {!collapsed && (
            <>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-semibold text-(--text-primary) truncate">
                  {user.name}
                </span>
                <span
                  className={cx(
                    "block text-xs font-inter",
                    user.wcaId ? "text-(--text-secondary)" : "text-(--success)",
                  )}
                >
                  {user.wcaId ?? "Connected"}
                </span>
              </span>
              {props["aria-expanded"] ? (
                <ChevronUp className="w-4 h-4 shrink-0 text-(--text-muted)" aria-hidden />
              ) : (
                <ChevronDown className="w-4 h-4 shrink-0 text-(--text-muted)" aria-hidden />
              )}
            </>
          )}
        </button>
      )}
    />
  );
}
