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
  MessagesSquare,
  Bot,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import SidebarUserDropdown from "@/components/SidebarUserDropdown";
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
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    // Retrieve initial state from localStorage
    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("cubelab-sidebar-collapsed");
      return savedState === "true";
    }
    return false;
  });
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, signOut } = useUser();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const logoSrc = useLogo();

  // Ensure hydration to avoid mismatch
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Save sidebar state to localStorage
  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("cubelab-sidebar-collapsed", String(newState));
  };

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
      id: "cubie",
      name: "Cubie AI",
      icon: Bot,
      description: "AI cubing assistant",
      href: "/cube-lab/cubie",
    },
    {
      id: "challenges",
      name: "Challenge Rooms",
      icon: Trophy,
      description: "Compete in scramble rooms",
      href: "/cube-lab/challenges",
    },
    {
      id: "chat",
      name: "Chat",
      icon: MessagesSquare,
      description: "Chat with friends",
      href: "/cube-lab/chat",
    },
  ];

  return (
    <div className="flex h-screen bg-[var(--background)]">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 bg-[var(--surface)] border-r border-[var(--border)] transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 flex flex-col ${
          sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full w-64"
        } ${
          sidebarCollapsed && !sidebarOpen ? "lg:w-20" : "lg:w-64"
        } ${isTimerFocusMode ? "blur-md opacity-50 pointer-events-none" : ""}`}
      >
        {/* Sidebar Header */}
        <div
          className={`flex flex-col px-6 py-4 border-b border-[var(--border)] ${sidebarCollapsed ? "lg:px-3" : ""}`}
        >
          {/* Logo and Title */}
          {sidebarCollapsed && (
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
            </div>
          )}

          {/* Desktop: Expanded state OR Mobile: Always show - Logo and text with buttons */}
          {!sidebarCollapsed && (
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

          {/* Beta Badge */}
          {!sidebarCollapsed && (
            <div className="mt-3 lg:mt-3 mb-3 lg:mb-0">
              <div className="inline-flex items-center px-2.5 py-1 bg-[var(--warning)]/10 border border-[var(--warning)]/20 rounded-full">
                <span className="text-xs font-medium text-[var(--warning)] font-inter">
                  Beta Version
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <nav
          className={`flex-1 py-6 space-y-2 overflow-y-auto sidebar-nav-container ${sidebarCollapsed ? "lg:px-2" : "px-4"}`}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const isActive = activeSection === section.id;

            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={() => setSidebarOpen(false)}
                title={sidebarCollapsed ? section.name : undefined}
                className={`w-full group sidebar-nav-item flex items-center rounded-lg text-left transition-all ${
                  sidebarCollapsed
                    ? "lg:justify-center lg:px-0 lg:py-3"
                    : "gap-3 px-4 py-3"
                } ${
                  isActive
                    ? "bg-[var(--primary)] text-white active"
                    : "text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] hover:text-[var(--primary)]"
                }`}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-[var(--primary)]"}`}
                />
                {!sidebarCollapsed && (
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
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`mt-auto p-4 border-t border-[var(--border)] space-y-4 sidebar-footer ${sidebarCollapsed ? "lg:p-2 lg:space-y-2" : ""}`}
        >
          {/* User Dropdown */}
          {user && (
            <div className="w-full">
              {sidebarCollapsed ? (
                <div className="hidden lg:flex justify-center">
                  <button
                    onClick={() => {
                      setSidebarCollapsed(false);
                      localStorage.setItem(
                        "cubelab-sidebar-collapsed",
                        "false"
                      );
                    }}
                    className="p-2 rounded-full hover:bg-[var(--surface-elevated)] transition-colors"
                    title={`${user.name} - Click to expand sidebar`}
                  >
                    {user.avatar && (
                      <Image
                        src={user.avatar.url || user.avatar}
                        alt={`${user.name}'s avatar`}
                        width={32}
                        height={32}
                        className="w-8 h-8 rounded-full object-cover border border-[var(--primary)]/50"
                      />
                    )}
                  </button>
                </div>
              ) : (
                <SidebarUserDropdown user={user} onSignOut={signOut} />
              )}
            </div>
          )}

          {/* Footer Text */}
          {!sidebarCollapsed && (
            <div className="text-xs text-[var(--text-muted)] text-center font-inter">
              © {currentYear} CubeDev. Built for the <br /> cubing community.
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
          {/* Mobile User Avatar */}
          {user?.avatar && (
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

        {/* Content Area */}
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}