"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { cx } from "@/lib/cx";
import { IconButton } from "./IconButton";

export interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
  /** How many numbered pages to show around the current one. */
  window?: number;
  className?: string;
}

/** Build the visible page numbers, keeping the current page centred. */
function pageWindow(page: number, totalPages: number, size: number): number[] {
  const count = Math.min(size, totalPages);
  let start = page - Math.floor(count / 2);
  start = Math.max(1, Math.min(start, totalPages - count + 1));
  return Array.from({ length: count }, (_, i) => start + i);
}

/** Numbered pager. Below `sm` only the arrows and the current page show. */
export function Pagination({
  page,
  totalPages,
  onChange,
  window: size = 5,
  className,
}: PaginationProps) {
  if (totalPages <= 1) return null;
  const pages = pageWindow(page, totalPages, size);

  return (
    <nav
      aria-label="Pagination"
      className={cx("flex items-center justify-center gap-1.5", className)}
    >
      <IconButton
        variant="subtle"
        aria-label="Previous page"
        disabled={page === 1}
        onClick={() => onChange(Math.max(1, page - 1))}
        icon={<ChevronLeft />}
      />
      <span className="type-caption px-2 sm:hidden" aria-hidden>
        {page} / {totalPages}
      </span>
      <div className="hidden sm:flex items-center gap-1">
        {pages[0] > 1 && (
          <>
            <PageButton page={1} current={page} onChange={onChange} />
            {pages[0] > 2 && (
              <span className="px-1 text-(--text-muted)" aria-hidden>
                …
              </span>
            )}
          </>
        )}
        {pages.map((n) => (
          <PageButton key={n} page={n} current={page} onChange={onChange} />
        ))}
        {pages[pages.length - 1] < totalPages && (
          <>
            {pages[pages.length - 1] < totalPages - 1 && (
              <span className="px-1 text-(--text-muted)" aria-hidden>
                …
              </span>
            )}
            <PageButton
              page={totalPages}
              current={page}
              onChange={onChange}
            />
          </>
        )}
      </div>
      <IconButton
        variant="subtle"
        aria-label="Next page"
        disabled={page === totalPages}
        onClick={() => onChange(Math.min(totalPages, page + 1))}
        icon={<ChevronRight />}
      />
    </nav>
  );
}

function PageButton({
  page,
  current,
  onChange,
}: {
  page: number;
  current: number;
  onChange: (page: number) => void;
}) {
  const active = page === current;
  return (
    <button
      type="button"
      onClick={() => onChange(page)}
      aria-label={`Page ${page}`}
      aria-current={active ? "page" : undefined}
      className={cx(
        "w-10 h-10 rounded-(--radius-control) text-sm font-medium font-inter transition-colors",
        active
          ? "bg-(--primary) text-(--on-primary)"
          : "text-(--text-secondary) hover:bg-(--surface-elevated) hover:text-(--text-primary)",
      )}
    >
      {page}
    </button>
  );
}
