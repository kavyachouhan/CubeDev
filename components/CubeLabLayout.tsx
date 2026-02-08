"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const logoSrc = useLogo();

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
      ribbon: {
        featureKey: "algorithm-trainer-launch",
        variant: "new" as RibbonVariant,
        expiryDays: 30,
      },
    },
    {
      id: "coach",
      name: "Coach",
      icon: Compass,
      description: "Personalized training & goals",
      href: "/cube-lab/coach",
      ribbon: {
        featureKey: "coach-launch",
        variant: "new" as RibbonVariant,
        expiryDays: 30,
      },
    },
    {
      id: "competitions",
      name: "Competitions",
      icon: Medal,
      description: "Competition simulation & practice",
      href: "/cube-lab/competitions",
      ribbon: {
        featureKey: "competitions-launch",
        variant: "new" as RibbonVariant,
        expiryDays: 30,
      },
    },
    {
      id: "challenges",
      name: "Challenge Rooms",
      icon: Trophy,
      description: "Compete in scramble rooms",
      href: "/cube-lab/challenges",
    },
  ];

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--surface)] border-r border-[var(--border)] transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen
            ? "translate-x-0 w-[80vw] max-w-64"
            : "-translate-x-full w-[80vw] max-w-64"
        } ${
          isHydrated && isCollapsed && !sidebarOpen ? "lg:w-20" : "lg:w-64"
        } ${isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""} ${!isHydrated ? "lg:invisible" : ""}`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex flex-col px-6 py-4 border-b border-[var(--border)] ${isCollapsed ? "lg:px-3" : ""}`}
        >
          {/* Logo and Title */}
          {isCollapsed && (
            <div className="hidden lg:flex flex-col items-center gap-3">
              {/* Expand Button */}
              <button
                onClick={toggleSidebarCollapse}
                className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
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
                <h1 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                  Cube <span className="text-[var(--primary)]">Lab</span>
                </h1>
              </Link>
              {/* Collapse Button */}
              <button
                onClick={toggleSidebarCollapse}
                className="hidden lg:block p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
                title="Collapse sidebar"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              {/* Mobile Close Button */}
              <button
                onClick={() => setSidebarOpen(false)}
                className="lg:hidden p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          )}

          {/* Beta Badge and Notification Bell */}
          {!isCollapsed && (
            <div className="mt-3 lg:mt-3 mb-3 lg:mb-0 flex items-center justify-between">
              <div className="inline-flex items-center px-2.5 py-1 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-full">
                <span className="text-xs font-medium text-[var(--warning)] font-inter">
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

            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={() => setSidebarOpen(false)}
                title={isCollapsed ? section.name : undefined}
                className={`w-full group sidebar-nav-item flex items-center rounded-lg text-left transition-all relative ${
                  isCollapsed
                    ? "lg:justify-center lg:px-0 lg:py-3"
                    : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-[var(--primary)] text-white active"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--primary)]"
                }`}
              >
                {/* Icon with ribbon indicator when collapsed */}
                <div className="relative flex-shrink-0">
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-[var(--primary)]"}`}
                  />
                  {/* Ribbon dot indicator for collapsed sidebar */}
                  {isCollapsed && section.ribbon && (
                    <span className="hidden lg:block absolute -top-1 -right-1 w-2 h-2 bg-[var(--primary)] rounded-full" />
                  )}
                </div>
                {!isCollapsed && (
                  <div className="flex-1 min-w-0">
                    <div
                      className={`font-semibold font-statement truncate ${isActive ? "text-white" : "text-[var(--text-primary)]"}`}
                    >
                      {section.name}
                    </div>
                    <div
                      className={`text-xs ${isActive ? "text-white/70" : "text-[var(--text-muted)]"} font-inter`}
                    >
                      {section.description}
                    </div>
                  </div>
                )}
                {/* Ribbon positioned absolutely - tilted corner ribbon */}
                {!isCollapsed && section.ribbon && (
                  <FeatureRibbon
                    featureKey={section.ribbon.featureKey}
                    variant={section.ribbon.variant}
                    expiryDays={section.ribbon.expiryDays}
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
          className={`mt-auto p-4 border-t border-[var(--border)] space-y-4 sidebar-footer ${isCollapsed ? "lg:p-2 lg:space-y-2" : ""}`}
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
            <div className="text-[9px] text-[var(--text-muted)] text-center font-inter">
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
        <div className="lg:hidden flex items-center justify-between h-16 px-4 bg-[var(--surface)] border-b border-[var(--border)]">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors"
          >
            <Menu className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-bold text-[var(--text-primary)] font-statement">
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
                className="p-2 text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors"
                title="View sessions"
              >
                <MessageSquarePlus className="w-5 h-5" />
              </button>
            )} */}
            {/* Mobile User Avatar */}
            {user && user.avatar && (
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-1 rounded-full hover:bg-[var(--surface-elevated)] transition-colors"
                title={`${user.name} - Tap to open menu`}
              >
                <Image
                  src={user.avatar.url || user.avatar}
                  alt={`${user.name}'s avatar`}
                  width={32}
                  height={32}
                  className="w-8 h-8 rounded-full object-cover border border-[var(--primary)]/50"
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