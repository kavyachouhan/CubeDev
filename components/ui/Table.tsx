import type { ComponentProps, ReactNode } from "react";
import { cx } from "@/lib/cx";

/**
 * Data table. Below `md` a table either scrolls sideways or is replaced by a
 * stacked card list — pick one per screen; don't ship a squeezed table.
 *
 *   <Table.Scroll>
 *     <Table>
 *       <Table.Head><Table.Row>
 *         <Table.HeaderCell>User</Table.HeaderCell>
 *         <Table.HeaderCell align="right">Actions</Table.HeaderCell>
 *       </Table.Row></Table.Head>
 *       <Table.Body>…</Table.Body>
 *     </Table>
 *   </Table.Scroll>
 */
export function Table({ className, ...rest }: ComponentProps<"table">) {
  return <table className={cx("w-full", className)} {...rest} />;
}

/** Horizontal scroll container; keeps the page itself from overflowing. */
function TableScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx("overflow-x-auto -mx-px", className)}>{children}</div>
  );
}

function TableHead({ className, ...rest }: ComponentProps<"thead">) {
  return (
    <thead
      className={cx(
        "bg-(--surface-elevated) border-y border-(--border)",
        className,
      )}
      {...rest}
    />
  );
}

function TableBody({ className, ...rest }: ComponentProps<"tbody">) {
  return (
    <tbody className={cx("divide-y divide-(--border)", className)} {...rest} />
  );
}

function TableRow({ className, ...rest }: ComponentProps<"tr">) {
  return (
    <tr
      className={cx("hover:bg-(--surface-elevated) transition-colors", className)}
      {...rest}
    />
  );
}

function TableHeaderCell({
  align = "left",
  className,
  ...rest
}: ComponentProps<"th"> & { align?: "left" | "right" | "center" }) {
  return (
    <th
      scope="col"
      className={cx(
        "px-4 py-3 type-overline whitespace-nowrap",
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left",
        className,
      )}
      {...rest}
    />
  );
}

function TableCell({
  align = "left",
  className,
  ...rest
}: ComponentProps<"td"> & { align?: "left" | "right" | "center" }) {
  return (
    <td
      className={cx(
        "px-4 py-3 text-sm font-inter text-(--text-secondary)",
        align === "right"
          ? "text-right"
          : align === "center"
            ? "text-center"
            : "text-left",
        className,
      )}
      {...rest}
    />
  );
}

Table.Scroll = TableScroll;
Table.Head = TableHead;
Table.Body = TableBody;
Table.Row = TableRow;
Table.HeaderCell = TableHeaderCell;
Table.Cell = TableCell;
