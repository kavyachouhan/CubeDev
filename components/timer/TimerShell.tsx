"use client";

import { createContext, useContext } from "react";
import type { ComponentType, ReactNode } from "react";
import { createPortal } from "react-dom";
import { cx } from "@/lib/cx";
import {
  Card,
  CardHeader,
  CollapsibleCard,
  useCollapsed,
} from "@/components/ui/Card";

export interface PanelShellProps {
  /** Controls that belong beside the panel's title. */
  actions?: ReactNode;
  children: ReactNode;
}

export type PanelShellComponent = ComponentType<PanelShellProps>;

/**
 * Builds the card chrome a panel wears in the card layout.
 *
 * Call this at module scope so the returned component has a stable identity;
 * creating it during render would remount the panel on every pass.
 */
export function makeCardPanelShell(
  title: string,
  storageKey: string,
  defaultOpen = true,
): PanelShellComponent {
  function CardPanelShell({ actions, children }: PanelShellProps) {
    const { open, onOpenChange } = useCollapsed(storageKey, defaultOpen);
    return (
      <CollapsibleCard
        title={title}
        open={open}
        onOpenChange={onOpenChange}
        actions={actions}
      >
        {children}
      </CollapsibleCard>
    );
  }
  CardPanelShell.displayName = `CardPanelShell(${title})`;
  return CardPanelShell;
}

/**
 * No chrome at all: fills its flex parent and lets the child own its height.
 *
 * The compact layout sizes panels from a grid, so the card's animated height
 * container would fight it.
 */
export function BarePanelShell({ actions, children }: PanelShellProps) {
  return (
    <div className="flex-1 min-h-0 flex flex-col">
      {actions && (
        <div className="shrink-0 flex items-center justify-end gap-1">
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

/**
 * Bare shell that keeps its actions out of the way entirely.
 *
 * Used where the layout has already placed the panel's controls elsewhere,
 * such as a sheet header or a toolbar.
 */
export function HeadlessPanelShell({ children }: PanelShellProps) {
  return <div className="flex-1 min-h-0 flex flex-col">{children}</div>;
}

/** Bare shell variant that does not grow, for panels inside a scrolling sheet. */
export function StaticPanelShell({ actions, children }: PanelShellProps) {
  return (
    <div className={cx("flex flex-col", actions ? "gap-2" : undefined)}>
      {actions && (
        <div className="flex items-center justify-end gap-1">{actions}</div>
      )}
      {children}
    </div>
  );
}

/**
 * Static card chrome for panels that are not collapsible.
 *
 * Same contract as the collapsible shells so a panel can be moved between a
 * card and a compact pane by swapping one prop.
 */
export function makeStaticCardShell(title: string): PanelShellComponent {
  function StaticCardShell({ actions, children }: PanelShellProps) {
    return (
      <Card>
        <CardHeader title={title} stackActions actions={actions} />
        {children}
      </Card>
    );
  }
  StaticCardShell.displayName = `StaticCardShell(${title})`;
  return StaticCardShell;
}

/* ------------------------------------------------------------------------ */
/* Actions slot                                                             */
/* ------------------------------------------------------------------------ */

const ActionsSlotContext = createContext<HTMLElement | null>(null);

/**
 * Lets a panel's own controls render somewhere else on the page.
 *
 * The compact layout puts the timer's settings button in the toolbar, but the
 * button and its dialog state must stay inside `TimerDisplay`: the timer's
 * keydown handler suppresses the spacebar while that dialog is open, and a
 * second, layout-owned button would leave the spacebar live underneath it.
 * A portal keeps the React tree, and therefore that behaviour, intact.
 */
export function TimerActionsSlotProvider({
  slot,
  children,
}: {
  slot: HTMLElement | null;
  children: ReactNode;
}) {
  return (
    <ActionsSlotContext.Provider value={slot}>
      {children}
    </ActionsSlotContext.Provider>
  );
}

/** Fills its flex parent and sends its actions to the slot. */
export function SlottedPanelShell({ actions, children }: PanelShellProps) {
  const slot = useContext(ActionsSlotContext);
  return (
    <>
      {slot && actions ? createPortal(actions, slot) : null}
      <div className="flex-1 min-h-0 flex flex-col">{children}</div>
    </>
  );
}

/**
 * Chrome that costs no height: actions float inside the panel's top-right
 * corner, over the content.
 *
 * For the compact layout's preview, where a title or controls row would take
 * height the cube itself should have.
 */
export function InsetPanelShell({ actions, children }: PanelShellProps) {
  return (
    <div className="relative">
      {children}
      {actions && (
        <div className="absolute top-2 right-2 z-10 flex items-center gap-1">
          {actions}
        </div>
      )}
    </div>
  );
}
