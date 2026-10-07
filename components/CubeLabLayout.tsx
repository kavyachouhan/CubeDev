"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  BarChart3,
  Compass,
  GraduationCap,
  Medal,
  Timer,
  Trophy,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { getAvatarUrl } from "@/lib/avatar";
import SidebarUserDropdown from "@/components/SidebarUserDropdown";
import NotificationBell from "@/components/NotificationBell";
import NotificationsModal from "@/components/NotificationsModal";
import NotificationService from "@/components/NotificationService";
import CoachingNotificationService from "@/components/CoachingNotificationService";
import FeatureRibbon, { RibbonVariant } from "@/components/FeatureRibbon";
import { AppShell } from "@/components/layout/AppShell";
import type { NavSection } from "@/components/layout/AppShell";
import { Badge } from "@/components/ui/Badge";

interface CubeLabLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  isTimerFocusMode?: boolean;
}

const SECTIONS: Omit<NavSection, "badge" | "dot">[] = [
  {
    id: "timer",
    name: "Timer",
    icon: Timer,
    description: "Advanced timing with analytics",
    href: "/cube-lab/timer",
  },
  {
    id: "statistics",
    name: "Statistics",
    icon: BarChart3,
    description: "Performance analysis & trends",
    href: "/cube-lab/statistics",
  },
  {
    id: "algorithm-trainer",
    name: "Algorithm Trainer",
    icon: GraduationCap,
    description: "Learn & master algorithms",
    href: "/cube-lab/algorithm-trainer",
  },
  {
    id: "coach",
    name: "Coach",
    icon: Compass,
    description: "Personalized training & goals",
    href: "/cube-lab/coach",
  },
  {
    id: "competitions",
    name: "Competitions",
    icon: Medal,
    description: "Competition simulation & practice",
    href: "/cube-lab/competitions",
  },
  {
    id: "challenges",
    name: "Challenge Rooms",
    icon: Trophy,
    description: "Compete in scramble rooms",
    href: "/cube-lab/challenges",
  },
];

export default function CubeLabLayout({
  children,
  activeSection,
  isTimerFocusMode = false,
}: CubeLabLayoutProps) {
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, signOut } = useUser();
  const activeLabels = useQuery(api.featureLabels.getActiveLabels);

  const sections = useMemo<NavSection[]>(() => {
    const labels = new Map<string, RibbonVariant>();
    (activeLabels ?? []).forEach((label) =>
      labels.set(label.featureKey, label.labelType as RibbonVariant),
    );
    return SECTIONS.map((section) => {
      const variant = labels.get(section.id);
      return {
        ...section,
        dot: Boolean(variant),
        badge: variant ? (
          <FeatureRibbon
            variant={variant}
            position="top-right"
            isActive={activeSection === section.id}
          />
        ) : undefined,
      };
    });
  }, [activeLabels, activeSection]);

  const openNotifications = () => setNotificationsOpen(true);
  const avatarUrl = user ? getAvatarUrl(user.avatar) : undefined;

  return (
    <AppShell
      sections={sections}
      activeSection={activeSection}
      brand={
        <>
          Cube <span className="text-(--primary)">Lab</span>
        </>
      }
      brandHref="/cube-lab/timer"
      tag={
        <Badge tone="warning" shape="pill" size="md">
          Beta
        </Badge>
      }
      storageKey="cubelab-sidebar-collapsed"
      extraTitles={{ settings: "Settings", cubie: "Cubie", chat: "Chat" }}
      fallbackTitle="Cube Lab"
      focusMode={isTimerFocusMode}
      headerActions={(collapsed) => (
        <NotificationBell onClick={openNotifications} collapsed={collapsed} />
      )}
      mobileActions={(openDrawer) => (
        <>
          <NotificationBell onClick={openNotifications} />
          {user && avatarUrl && (
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
          )}
        </>
      )}
      footer={(collapsed) =>
        user ? (
          <SidebarUserDropdown user={user} onSignOut={signOut} collapsed={collapsed} />
        ) : null
      }
      footerNote={`© ${new Date().getFullYear()} CubeDev. Built for the cubing community.`}
      portals={
        <>
          <NotificationsModal
            isOpen={notificationsOpen}
            onClose={() => setNotificationsOpen(false)}
          />
          <NotificationService />
          <CoachingNotificationService />
        </>
      }
    >
      {children}
    </AppShell>
  );
}
