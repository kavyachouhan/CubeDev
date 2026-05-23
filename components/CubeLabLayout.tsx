"use client";

import { useState, useEffect, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Timer,
  BarChart3,
  Menu,
  X,
  Trophy,
  ChevronLeft,
  ChevronRight,
  GraduationCap,
  Medal,
  Compass,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import SidebarUserDropdown from "@/components/SidebarUserDropdown";
import NotificationBell from "@/components/NotificationBell";
import NotificationsModal from "@/components/NotificationsModal";
import NotificationService from "@/components/NotificationService";
import CoachingNotificationService from "@/components/CoachingNotificationService";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import FeatureRibbon, { RibbonVariant } from "@/components/FeatureRibbon";
import { useLogo } from "@/lib/use-logo";

interface CubeLabLayoutProps {
  children: React.ReactNode;
  activeSection: string;
  isTimerFocusMode?: boolean;
}

export default function CubeLabLayout({
  children,
  activeSection,
  isTimerFocusMode = false,
}: CubeLabLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  // null = not initialized, true/false = user preference after hydration
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean | null>(
    null,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, signOut } = useUser();
  const currentYear = new Date().getFullYear();
  const logoSrc = useLogo();
  const activeLabels = useQuery(api.featureLabels.getActiveLabels);

  const labelsByKey = useMemo(() => {
    const map = new Map<string, { labelType: RibbonVariant }>();
    (activeLabels ?? []).forEach((label) => {
      map.set(label.featureKey, {
        labelType: label.labelType as RibbonVariant,
      });
    });
    return map;
  }, [activeLabels]);

  // Initialize sidebar state from localStorage after hydration
  useEffect(() => {
    setIsHydrated(true);

    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("cubelab-sidebar-collapsed");
      setSidebarCollapsed(savedState === "true");
    }
  }, []); // Only run on mount, not when activeSection changes

  // Save sidebar state to localStorage
  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("cubelab-sidebar-collapsed", String(newState));
  };

  // If sidebarCollapsed is still null (not initialized), treat it as false (expanded)
  const isCollapsed = sidebarCollapsed === true;

  const sections = [
    {
      id: "timer",
      name: "Timer",
      icon: Timer,
      description: "Advanced timing with analytics",
      href: "/cube-lab/timer",
      featureKey: "timer",
    },
    {
      id: "statistics",
      name: "Statistics",
      icon: BarChart3,
      description: "Performance analysis & trends",
      href: "/cube-lab/statistics",
      featureKey: "statistics",
    },
    {
      id: "algorithm-trainer",
      name: "Algorithm Trainer",
      icon: GraduationCap,
      description: "Learn & master algorithms",
      href: "/cube-lab/algorithm-trainer",
      featureKey: "algorithm-trainer",
    },
    {
      id: "coach",
      name: "Coach",
      icon: Compass,
      description: "Personalized training & goals",
      href: "/cube-lab/coach",
      featureKey: "coach",
    },
    {
      id: "competitions",
      name: "Competitions",
      icon: Medal,
      description: "Competition simulation & practice",
      href: "/cube-lab/competitions",
      featureKey: "competitions",
    },
    {
      id: "challenges",
      name: "Challenge Rooms",
      icon: Trophy,
      description: "Compete in scramble rooms",
      href: "/cube-lab/challenges",
      featureKey: "challenges",
    },
  ];

  return (
    <div className="flex h-screen bg-(--background)">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-(--surface) border-r border-(--border) transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen
            ? "translate-x-0 w-[80vw] max-w-64"
            : "-translate-x-full w-[80vw] max-w-64"
        } ${
          isHydrated && isCollapsed && !sidebarOpen ? "lg:w-20" : "lg:w-64"
        } ${isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""} ${!isHydrated ? "lg:invisible" : ""}`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex flex-col px-6 py-4 border-b border-(--border) ${isCollapsed ? "lg:px-3" : ""}`}
        >
          {/* Logo and Title */}
          {isCollapsed && (
            <div className="hidden lg:flex flex-col items-center gap-3">
              {/* Expand Button */}
              <button
                onClick={toggleSidebarCollapse}
                className="p-2 text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                title="Expand sidebar"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
              <Link
                href="/cube-lab/timer"
                className="flex items-center justify-center"
              >
                <Image
                  src={logoSrc}
                  alt="CubeDev Logo"
                  width={32}
                  height={32}
                />
              </Link>
              {/* Notification Bell */}
              <NotificationBell
                onClick={() => setNotificationsOpen(true)}
                collapsed={true}
              />
            </div>
          )}

          {/* Desktop: Expanded state OR Mobile: Always show - Logo and text with buttons */}
          {!isCollapsed && (
            <div className="flex items-center justify-between h-8">
              <Link href="/cube-lab/timer" className="flex items-center gap-3">
                <Image
                  src={logoSrc}
                  alt="CubeDev Logo"
                  width={32}
                  height={32}
                />
                <h1 className="text-xl font-bold text-(--text-primary) font-statement">
                  Cube <span className="text-(--primary)">Lab</span>
                </h1>
              </Link>
              {/* Collapse Button */}
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:block p-2 text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {/* Mobile Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-(--text-secondary) hover:text-(--primary) transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Beta Badge and Notification Bell */}
          {!isCollapsed && (
            <div className="mt-3 lg:mt-3 mb-3 lg:mb-0 flex items-center justify-between">
              <div className="inline-flex items-center px-2.5 py-1 bg-(--warning)/10 border border-(--warning)/20 rounded-full">
                <span className="text-xs font-medium text-(--warning) font-inter">
                  Beta Version
                </span>
              </div>
              {/* Notification Bell for Desktop Expanded */}
              <div className="hidden lg:block">
                <NotificationBell
                  onClick={() => setNotificationsOpen(true)}
                  collapsed={false}
                />
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 py-6 space-y-2 overflow-y-auto sidebar-nav-container ${isCollapsed ? "lg:px-2" : "px-4"}`}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;
            const label = section.featureKey
              ? labelsByKey.get(section.featureKey)
              : undefined;

            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={() => setSidebarOpen(false)}
                title={section.name}
                className={`w-full group sidebar-nav-item flex items-center rounded-lg text-left transition-all relative ${
                  isCollapsed
                    ? "lg:justify-center lg:px-0 lg:py-3"
                    : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-(--primary) text-white active"
                    : "text-(--text-secondary) hover:bg-(--surface-elevated) hover:text-(--primary)"
                }`}
              >
                {/* Icon with ribbon indicator when collapsed */}
                <div className="relative shrink-0">
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-(--primary)"}`}
                  />
                  {/* Ribbon dot indicator for collapsed sidebar */}
                  {isCollapsed && label && (
                    <span className="hidden lg:block absolute -top-1 -right-1 w-2 h-2 bg-(--primary) rounded-full" />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold font-statement truncate ${isActive ? "text-white" : "text-(--text-primary)"}`}
                    >
                      {section.name}
                    </div>
                    <div
                      className={`text-xs ${isActive ? "text-white/70" : "text-(--text-muted)"} font-inter`}
                    >
                      {section.description}
                    </div>
                  </div>
                )}
                {/* Ribbon positioned absolutely - tilted corner ribbon */}
                {!isCollapsed && label && (
                  <FeatureRibbon
                    variant={label.labelType}
                    position="top-right"
                    isActive={isActive}
                  />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`mt-auto p-4 border-t border-(--border) space-y-4 sidebar-footer ${isCollapsed ? "lg:p-2 lg:space-y-2" : ""}`}
        >
          {/* User Dropdown */}
          {user && (
            <div className="w-full">
              <SidebarUserDropdown
                user={user}
                onSignOut={signOut}
                collapsed={isCollapsed}
              />
            </div>
          )}

          {/* Footer Text */}
          {!isCollapsed && (
            <div className="text-[9px] text-(--text-muted) text-center font-inter">
              © {currentYear} CubeDev. Built for the cubing community.
            </div>
          )}
        </div>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 sidebar-overlay z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden lg:ml-0">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-(--surface) border-b border-(--border)">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-(--text-secondary) hover:text-(--primary) transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-(--text-primary) font-statement">
            {sections.find((s) => s.id === activeSection)?.name || "Cube Lab"}
          </h1>
          <div className="flex items-center gap-2">
            {/* Notification Bell - Mobile */}
            <NotificationBell
              onClick={() => setNotificationsOpen(true)}
              collapsed={false}
            />
            {/* Cubie Session Management Button - Only on Cubie page */}
            {/* {activeSection === "cubie" && (
              <button
                onClick={() => {
                  // Dispatch custom event to open session modal
                  window.dispatchEvent(
                    new CustomEvent("cubie-open-session-modal"),
                  );
                }}
                className="p-2 text-(--primary) hover:bg-(--surface-elevated) rounded-lg transition-colors"
                title="View sessions"
              >
                <MessageSquarePlus className="w-5 h-5" />
              </button>
            )} */}
            {/* Mobile User Avatar */}
            {user && user.avatar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded-full hover:bg-(--surface-elevated) transition-colors"
                title={`${user.name} - Tap to open menu`}
              >
                <Image
                  src={user.avatar.url || user.avatar}
                  alt={`${user.name}'s avatar`}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-(--primary)/50"
                />
              </button>
            )}
          </div>
        </div>

        {/* Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {/* Notifications Modal */}
      <NotificationsModal
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
      />

      {/* Notification Service - monitors for due algorithms */}
      <NotificationService />

      {/* Coaching Notification Service - monitors practice reminders, streaks, etc. */}
      <CoachingNotificationService />
    </div>
  );
}