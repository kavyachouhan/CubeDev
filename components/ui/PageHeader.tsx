import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/cx";

export interface Crumb {
  label: string;
  /** Omit for the current page. */
  href?: string;
  onClick?: () => void;
}

/**
 * Trail of parent pages. From 640px it shows the full chain; below that it
 * collapses to a single "← Parent" link, which is all a phone has room for.
 */
export function Breadcrumbs({
  items,
  className,
}: {
  items: Crumb[];
  className?: string;
}) {
  const parent = [...items].reverse().find((c) => c.href || c.onClick);

  return (
    <nav aria-label="Breadcrumb" className={cx("font-inter text-sm", className)}>
      {parent && (
        <CrumbLink
          crumb={parent}
          className="sm:hidden inline-flex items-center gap-1.5 -ml-0.5"
        >
          <ArrowLeft className="w-4 h-4" aria-hidden />
          {parent.label}
        </CrumbLink>
      )}
      <ol className="hidden sm:flex flex-wrap items-center gap-1.5">
        {items.map((crumb, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${crumb.label}-${index}`} className="flex items-center gap-1.5 min-w-0">
              {isLast || (!crumb.href && !crumb.onClick) ? (
                <span
                  aria-current={isLast ? "page" : undefined}
                  className={cx(
                    "truncate",
                    isLast ? "text-(--text-primary) font-medium" : "text-(--text-muted)",
                  )}
                >
                  {crumb.label}
                </span>
              ) : (
                <CrumbLink crumb={crumb} className="truncate">
                  {crumb.label}
                </CrumbLink>
              )}
              {!isLast && (
                <ChevronRight className="w-3.5 h-3.5 shrink-0 text-(--text-muted)" aria-hidden />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

function CrumbLink({
  crumb,
  className,
  children,
}: {
  crumb: Crumb;
  className?: string;
  children: ReactNode;
}) {
  const classes = cx(
    "text-(--text-secondary) hover:text-(--primary) transition-colors rounded-(--radius-badge)",
    className,
  );
  if (crumb.href) {
    return (
      <Link href={crumb.href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type="button" onClick={crumb.onClick} className={classes}>
      {children}
    </button>
  );
}

/** The one back-link style: muted text with an arrow. */
export function BackLink({
  href,
  onClick,
  children,
  className,
}: {
  href?: string;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
}) {
  const classes = cx(
    "inline-flex items-center gap-1.5 text-sm font-medium font-inter text-(--text-secondary) hover:text-(--primary) transition-colors rounded-(--radius-badge) -ml-0.5",
    className,
  );
  const content = (
    <>
      <ArrowLeft className="w-4 h-4" aria-hidden />
      {children}
    </>
  );
  return href ? (
    <Link href={href} className={classes}>
      {content}
    </Link>
  ) : (
    <button type="button" onClick={onClick} className={classes}>
      {content}
    </button>
  );
}

export interface PageHeaderProps {
  title: ReactNode;
  description?: ReactNode;
  /** Small label above the title (category, status). */
  eyebrow?: ReactNode;
  /** A single parent to return to. Use `breadcrumbs` for deeper trails. */
  back?: { href?: string; onClick?: () => void; label: string };
  breadcrumbs?: Crumb[];
  /** Right-aligned actions; wrap under the title on mobile. */
  actions?: ReactNode;
  /**
   * Hide the title on mobile when the app bar already names the page
   * (top-level CubeLab sections). Actions and description remain.
   */
  hideTitleOnMobile?: boolean;
  className?: string;
}

/** Title block for a page: navigation, title, description, actions. */
export function PageHeader({
  title,
  description,
  eyebrow,
  back,
  breadcrumbs,
  actions,
  hideTitleOnMobile,
  className,
}: PageHeaderProps) {
  return (
    <header className={cx("mb-4 md:mb-6", className)}>
      {breadcrumbs ? (
        <Breadcrumbs items={breadcrumbs} className="mb-3" />
      ) : back ? (
        <BackLink href={back.href} onClick={back.onClick} className="mb-3">
          {back.label}
        </BackLink>
      ) : null}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className={cx("min-w-0", hideTitleOnMobile && !description && !eyebrow && "hidden lg:block")}>
          {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
          <h1 className={cx("type-page-title wrap-break-word", hideTitleOnMobile && "hidden lg:block")}>
            {title}
          </h1>
          {description && <p className="type-body mt-1 max-w-2xl">{description}</p>}
        </div>
        {actions && (
          <div className="flex flex-wrap items-center gap-2 shrink-0">{actions}</div>
        )}
      </div>
    </header>
  );
}
