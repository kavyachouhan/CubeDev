"use client";

import { useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import { ChevronLeft, ChevronRight, Menu, X } from "lucide-react";
import { cx } from "@/lib/cx";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { useLogo } from "@/lib/use-logo";
import { IconButton } from "@/components/ui/IconButton";
import { useOverlay } from "@/components/ui/overlay";

export interface NavSection {
  id: string;
  name: string;
  description: string;
  icon: LucideIcon;
  href: string;
  /** Decoration rendered on the item (feature ribbon) when expanded. */
  badge?: ReactNode;
  /** Small dot shown on the icon when the sidebar is collapsed. */
  dot?: boolean;
}

export interface AppShellProps {
  children: ReactNode;
  sections: NavSection[];
  activeSection: string;
  /** Wordmark next to the logo, e.g. <>Cube <span>Lab</span></>. */
  brand: ReactNode;
  brandHref: string;
  /** Pill under the wordmark (Beta, Admin). */
  tag?: ReactNode;
  /** localStorage key for the collapsed state. */
  storageKey: string;
  /** Titles for sections that aren't in the nav (settings, cubie). */
  extraTitles?: Record<string, string>;
  fallbackTitle: string;
  /** Header controls (notification bell); receives the collapsed state. */
  headerActions?: (collapsed: boolean) => ReactNode;
  /** Mobile app-bar controls on the right (bell, avatar). */
  mobileActions?: (openDrawer: () => void) => ReactNode;
  /** Sidebar footer (user menu, links); receives the collapsed state. */
  footer?: (collapsed: boolean) => ReactNode;
  footerNote?: string;
  /** Recede the sidebar during a solve. */
  focusMode?: boolean;
  /** Rendered once alongside the shell (services, global modals). */
  portals?: ReactNode;
}

/**
 * Sidebar + app bar shared by Cube Lab and the admin panel.
 * Desktop (≥1024px): static sidebar, collapsible to icons.
 * Below that: an app bar with the page title, and the sidebar as a
 * modal drawer (Escape closes, focus stays inside, page doesn't scroll).
 */
export function AppShell({
  children,
  sections,
  activeSection,
  brand,
  brandHref,
  tag,
  storageKey,
  extraTitles,
  fallbackTitle,
  headerActions,
  mobileActions,
  footer,
  footerNote,
  focusMode = false,
  portals,
}: AppShellProps) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [collapsedPref, setCollapsedPref] = useState<boolean | null>(null);
  const logoSrc = useLogo();
  const isDesktop = useMediaQuery("(min-width: 1024px)");
  const sidebarRef = useRef<HTMLElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setCollapsedPref(localStorage.getItem(storageKey) === "true");
  }, [storageKey]);

  useEffect(() => {
    if (isDesktop) setDrawerOpen(false);
  }, [isDesktop]);

  useOverlay({
    open: drawerOpen && !isDesktop,
    onClose: () => setDrawerOpen(false),
    panelRef: sidebarRef,
    returnFocusRef: menuButtonRef,
  });

  const hydrated = collapsedPref !== null;
  // The collapsed rail is a desktop affordance; the drawer is always full.
  const collapsed = collapsedPref === true && isDesktop;

  const toggleCollapsed = () => {
    const next = !collapsed;
    setCollapsedPref(next);
    localStorage.setItem(storageKey, String(next));
  };

  const title =
    sections.find((s) => s.id === activeSection)?.name ??
    extraTitles?.[activeSection] ??
    fallbackTitle;

  const drawerIsModal = drawerOpen && !isDesktop;

  return (
    <div className="flex h-dvh bg-(--background)">
      <aside
        ref={sidebarRef}
        aria-label="Main navigation"
        role={drawerIsModal ? "dialog" : undefined}
        aria-modal={drawerIsModal ? true : undefined}
        tabIndex={drawerIsModal ? -1 : undefined}
        inert={!isDesktop && !drawerOpen ? true : undefined}
        className={cx(
          "fixed inset-y-0 left-0 z-(--z-drawer) flex flex-col bg-(--surface) border-r border-(--border) outline-none",
          "w-[min(20rem,85vw)] transition-[transform,width] duration-(--duration-slow) ease-out",
          "lg:static lg:translate-x-0",
          drawerOpen ? "translate-x-0 shadow-(--shadow-overlay)" : "-translate-x-full",
          collapsed ? "lg:w-20" : "lg:w-64",
          focusMode && "blur-md opacity-50 pointer-events-none",
          !hydrated && "lg:invisible",
        )}
      >
        <div className={cx("px-5 py-4 border-b border-(--border)", collapsed && "px-3")}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <IconButton
                aria-label="Expand sidebar"
                icon={<ChevronRight />}
                onClick={toggleCollapsed}
              />
              <Link href={brandHref} aria-label="Home" className="rounded-(--radius-control)">
                <Image src={logoSrc} alt="" width={32} height={32} />
              </Link>
              {headerActions?.(true)}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between gap-2 h-9">
                <Link
                  href={brandHref}
                  className="flex items-center gap-3 min-w-0 rounded-(--radius-control)"
                >
                  <Image src={logoSrc} alt="CubeDev" width={32} height={32} />
                  <span className="text-xl text-(--text-primary) font-statement truncate">
                    {brand}
                  </span>
                </Link>
                <IconButton
                  aria-label="Collapse sidebar"
                  icon={<ChevronLeft />}
                  onClick={toggleCollapsed}
                  className="hidden lg:inline-flex"
                />
                <IconButton
                  aria-label="Close menu"
                  icon={<X />}
                  onClick={() => setDrawerOpen(false)}
                  className="lg:hidden"
                />
              </div>
              {(tag || headerActions) && (
                <div className="mt-3 flex items-center justify-between gap-2">
                  {tag}
                  <div className="hidden lg:block">{headerActions?.(false)}</div>
                </div>
              )}
            </>
          )}
        </div>

        <nav
          aria-label="Sections"
          className={cx(
            "flex-1 py-4 space-y-1 overflow-y-auto sidebar-nav-container",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {sections.map((section) => {
            const Icon = section.icon;
            const active = activeSection === section.id;
            return (
              <Link
                key={section.id}
                href={section.href}
                onClick={() => setDrawerOpen(false)}
                aria-current={active ? "page" : undefined}
                title={collapsed ? section.name : undefined}
                className={cx(
                  "sidebar-nav-item group relative flex items-center rounded-(--radius-control)",
                  collapsed
                    ? "justify-center h-11 overflow-hidden"
                    : "gap-3 px-3 py-2 min-h-11",
                  active
                    ? "active bg-(--primary) text-(--on-primary)"
                    : "text-(--text-secondary) hover:bg-(--surface-elevated) hover:text-(--primary)",
                )}
              >
                <span className="relative shrink-0">
                  <Icon
                    className={cx("w-5 h-5", active ? "text-(--on-primary)" : "text-(--primary)")}
                    aria-hidden
                  />
                  {collapsed && section.dot && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-(--primary) ring-2 ring-(--surface)" />
                  )}
                </span>
                {collapsed ? (
                  <span className="sr-only">{section.name}</span>
                ) : (
                  <span className="flex-1 min-w-0">
                    <span
                      className={cx(
                        "block font-statement truncate",
                        active ? "text-(--on-primary)" : "text-(--text-primary)",
                      )}
                    >
                      {section.name}
                    </span>
                    {/* Wraps rather than truncating: the descriptions are the
                        only thing distinguishing two similar section names, so
                        an ellipsis mid-phrase costs more than a second line. */}
                    <span
                      className={cx(
                        "block text-xs font-inter leading-snug",
                        active ? "text-(--on-primary)/75" : "text-(--text-muted)",
                      )}
                    >
                      {section.description}
                    </span>
                  </span>
                )}
                {!collapsed && section.badge}
              </Link>
            );
          })}
        </nav>

        <div
          className={cx(
            "mt-auto sidebar-footer space-y-3",
            collapsed ? "p-2" : "p-3",
          )}
        >
          {footer?.(collapsed)}
          {!collapsed && footerNote && (
            <p className="text-[0.625rem] text-(--text-muted) text-center font-inter">
              {footerNote}
            </p>
          )}
        </div>
      </aside>

      {drawerOpen && (
        <div
          aria-hidden
          className="fixed inset-0 z-[calc(var(--z-drawer)-1)] sidebar-overlay animate-scrim-in lg:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {/* Three equal end columns keep the title optically centred however
            many actions the page hangs on the right. */}
        <header className="lg:hidden sticky top-0 z-(--z-sticky) grid grid-cols-[1fr_auto_1fr] items-center gap-2 h-14 px-2 bg-(--surface) border-b border-(--border)">
          <div className="flex items-center justify-self-start">
            <IconButton
              ref={menuButtonRef}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              icon={<Menu />}
              size="lg"
              onClick={() => setDrawerOpen(true)}
            />
          </div>
          <p className="min-w-0 text-center text-lg text-(--text-primary) font-statement truncate">
            {title}
          </p>
          <div className="flex items-center justify-end gap-1 pr-1">
            {mobileActions?.(() => setDrawerOpen(true))}
          </div>
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>

      {portals}
    </div>
  );
}
