"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  MessageSquare,
  Mail,
  Bell,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  Shield,
  Trophy,
  Compass,
  GraduationCap,
  Medal,
  Timer,
} from "lucide-react";
import { useUser } from "@/components/UserProvider";
import SidebarUserDropdown from "@/components/SidebarUserDropdown";
import { useLogo } from "@/lib/use-logo";

interface AdminLayoutProps {
  children: React.ReactNode;
  activeSection: string;
}

export default function AdminLayout({
  children,
  activeSection,
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean | null>(
    null,
  );
  const [isHydrated, setIsHydrated] = useState(false);
  const { user, signOut } = useUser();
  const pathname = usePathname();
  const currentYear = new Date().getFullYear();
  const logoSrc = useLogo();

  // Hydration and sidebar state initialization
  useEffect(() => {
    setIsHydrated(true);

    if (typeof window !== "undefined") {
      const savedState = localStorage.getItem("admin-sidebar-collapsed");
      setSidebarCollapsed(savedState === "true");
    }
  }, []);

  // Close sidebar on route change (mobile)
  const toggleSidebarCollapse = () => {
    const newState = !sidebarCollapsed;
    setSidebarCollapsed(newState);
    localStorage.setItem("admin-sidebar-collapsed", String(newState));
  };

  const isCollapsed = sidebarCollapsed === true;

  const sections = [
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
        } ${!isHydrated ? "lg:invisible" : ""}`}
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
              <Link href="/admin" className="flex items-center justify-center">
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
          {!isCollapsed && (
            <div className="flex items-center justify-between h-8">
              <Link href="/admin" className="flex items-center gap-3">
                <Image
                  src={logoSrc}
                  alt="CubeDev Logo"
                  width={32}
                  height={32}
                />
                <h1 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                  Admin <span className="text-[var(--primary)]">Panel</span>
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

          {/* Admin Badge */}
          {!isCollapsed && (
            <div className="mt-3 lg:mt-3 mb-3 lg:mb-0 flex items-center">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-[var(--error)]/10 border border-[var(--error)]/20 rounded-full">
                <Shield className="w-3 h-3 text-[var(--error)]" />
                <span className="text-xs font-medium text-[var(--error)] font-inter">
                  Admin
                </span>
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
                <div className="relative flex-shrink-0">
                  <Icon
                    className={`w-5 h-5 ${isActive ? "text-white" : "text-[var(--primary)]"}`}
                  />
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
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={`mt-auto p-4 border-t border-[var(--border)] space-y-4 sidebar-footer ${isCollapsed ? "lg:p-2 lg:space-y-2" : ""}`}
        >
          {/* Back to Cube Lab */}
          <Link
            href="/cube-lab/timer"
            className={`flex items-center gap-2 px-3 py-2 text-sm text-[var(--text-secondary)] hover:text-[var(--primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors ${isCollapsed ? "lg:justify-center lg:px-2" : ""}`}
            title={isCollapsed ? "Back to Cube Lab" : undefined}
          >
            <ChevronLeft className="w-4 h-4" />
            {!isCollapsed && (
              <span className="font-inter">Back to Cube Lab</span>
            )}
          </Link>

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
              © {currentYear} CubeDev Admin Panel
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
            {sections.find((s) => s.id === activeSection)?.name || "Admin"}
          </h1>
          <div className="flex items-center gap-2">
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
    </div>
  );
}