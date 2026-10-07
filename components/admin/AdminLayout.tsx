"use client";

import Image from "next/image";
import Link from "next/link";
import {
  Bell,
  ChevronLeft,
  Compass,
  GraduationCap,
  HelpCircle,
  LayoutDashboard,
  Mail,
  Medal,
  MessageSquare,
  Shield,
  Tag,
  Timer,
  Trophy,
  Users,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { getAvatarUrl } from "@/lib/avatar";
import { cx } from "@/lib/cx";
import SidebarUserDropdown from "@/components/SidebarUserDropdown";
import { AppShell } from "@/components/layout/AppShell";
import type { NavSection } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
}

const SECTIONS: NavSection[] = [
  {
    id: "dashboard",
    name: "Dashboard",
    icon: LayoutDashboard,
    description: "System overview & analytics",
    href: "/admin",
  },
  {
    id: "users",
    name: "Users",
    icon: Users,
    description: "User management",
    href: "/admin/users",
  },
  {
    id: "feedback",
    name: "Feedback",
    icon: MessageSquare,
    description: "Feedback & surveys",
    href: "/admin/feedback",
  },
  {
    id: "contact",
    name: "Contact",
    icon: Mail,
    description: "Contact messages",
    href: "/admin/contact",
  },
  {
    id: "notifications",
    name: "Notifications",
    icon: Bell,
    description: "Push notification logs",
    href: "/admin/notifications",
  },
  {
    id: "timer-analytics",
    name: "Timer Analytics",
    icon: Timer,
    description: "Timer usage statistics",
    href: "/admin/timer-analytics",
  },
  {
    id: "algorithms",
    name: "Algorithms",
    icon: GraduationCap,
    description: "Algorithm sets & stats",
    href: "/admin/algorithms",
  },
  {
    id: "coach",
    name: "Coach",
    icon: Compass,
    description: "Coaching activity",
    href: "/admin/coach",
  },
  {
    id: "competitions",
    name: "Competitions",
    icon: Medal,
    description: "Competition simulations",
    href: "/admin/competitions",
  },
  {
    id: "challenges",
    name: "Challenges",
    icon: Trophy,
    description: "Challenge room stats",
    href: "/admin/challenges",
  },
  {
    id: "faq",
    name: "FAQ / Help",
    icon: HelpCircle,
    description: "Help center articles",
    href: "/admin/faq",
  },
  {
    id: "labels",
    name: "Labels",
    icon: Tag,
    description: "Feature label management",
    href: "/admin/labels",
  },
];

export default function AdminLayout({
  children,
  activeSection,
}: AdminLayoutProps) {
  const { user, signOut } = useUser();
  const avatarUrl = user ? getAvatarUrl(user.avatar) : undefined;

  return (
    <AppShell
      sections={SECTIONS}
      activeSection={activeSection}
      brand={
        <>
          Admin <span className="text-(--primary)">Panel</span>
        </>
      }
      brandHref="/admin"
      tag={
        <Badge tone="danger" shape="pill" size="md" icon={<Shield />}>
          Admin
        </Badge>
      }
      storageKey="admin-sidebar-collapsed"
      fallbackTitle="Admin"
      mobileActions={(openDrawer) =>
        user && avatarUrl ? (
          <button
            type="button"
            onClick={openDrawer}
            aria-label={`${user.name}: open menu`}
            className="p-1 rounded-full hover:bg-(--surface-elevated) transition-colors"
          >
            <Image
              src={avatarUrl}
              alt=""
              width={32}
              height={32}
              className="w-8 h-8 rounded-full object-cover border border-(--primary)/50"
            />
          </button>
        ) : null
      }
      footer={(collapsed) => (
        <>
          <Link
            href="/cube-lab/timer"
            title={collapsed ? "Back to Cube Lab" : undefined}
            className={cx(
              "flex items-center gap-2 px-3 py-2 text-sm font-inter text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-(--radius-control) transition-colors",
              collapsed && "justify-center px-2",
            )}
          >
            <ChevronLeft className="w-4 h-4" aria-hidden />
            <span className={collapsed ? "sr-only" : undefined}>
              Back to Cube Lab
            </span>
          </Link>
          {user && (
            <SidebarUserDropdown
              user={user}
              onSignOut={signOut}
              collapsed={collapsed}
            />
          )}
        </>
      )}
      footerNote={`© ${new Date().getFullYear()} CubeDev Admin Panel`}
    >
      {children}
    </AppShell>
  );
}
