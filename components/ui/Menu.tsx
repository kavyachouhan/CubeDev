"use client";

import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import type {
  KeyboardEvent,
  MouseEvent,
  ReactNode,
  Ref,
  RefObject,
} from "react";
import { createPortal } from "react-dom";
import { Check, ChevronDown } from "lucide-react";
import { cx } from "@/lib/cx";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { SearchInput } from "./Field";
import { Modal } from "./Modal";
import {
  isolateKeys,
  useAnchoredPosition,
  useMounted,
  useOverlay,
  useParentLayer,
} from "./overlay";
import type { Placement } from "./overlay";

/* ------------------------------------------------------------------------ */
/* Shared layer                                                             */
/* ------------------------------------------------------------------------ */

export type LayerMobile = "sheet" | "popover";

export interface TriggerProps {
  ref: Ref<HTMLButtonElement>;
  onClick: (event: MouseEvent) => void;
  "aria-haspopup": "menu" | "listbox" | "dialog";
  "aria-expanded": boolean;
  "aria-controls"?: string;
}

function useIsPhone() {
  return useMediaQuery("(max-width: 639px)");
}

interface AnchoredLayerProps {
  open: boolean;
  onClose: () => void;
  triggerRef: RefObject<HTMLButtonElement | null>;
  id: string;
  title: string;
  role: "menu" | "listbox" | "dialog";
  placement?: Placement;
  matchWidth?: boolean;
  mobile?: LayerMobile;
  panelClassName?: string;
  onKeyDown?: (event: KeyboardEvent) => void;
  children: ReactNode;
  /** Rendered above the list, outside the scroll area (e.g. a search box). */
  header?: ReactNode;
}

function AnchoredLayer({
  open,
  onClose,
  triggerRef,
  id,
  title,
  role,
  placement = "bottom-start",
  matchWidth,
  mobile = "sheet",
  panelClassName,
  onKeyDown,
  children,
  header,
}: AnchoredLayerProps) {
  const isPhone = useIsPhone();
  const asSheet = isPhone && mobile === "sheet";
  const mounted = useMounted();
  // A panel opened from inside a dialog has to clear that dialog: --z-dropdown
  // sits below --z-modal, so an anchored menu in a modal would paint behind it.
  const parentLayer = useParentLayer();
  const panelRef = useRef<HTMLDivElement>(null);
  const style = useAnchoredPosition(
    open && !asSheet,
    triggerRef,
    panelRef,
    placement,
    6,
    matchWidth,
  );

  useOverlay({
    open: open && !asSheet,
    onClose,
    panelRef,
    lockScroll: false,
    trapFocus: false,
    returnFocusRef: triggerRef,
  });

  useEffect(() => {
    if (!open || asSheet) return;
    const onPointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (panelRef.current?.contains(target)) return;
      if (triggerRef.current?.contains(target)) return;
      onClose();
    };
    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget as Node | null;
      if (next && !panelRef.current?.contains(next) && !triggerRef.current?.contains(next)) {
        onClose();
      }
    };
    document.addEventListener("pointerdown", onPointerDown, true);
    const panel = panelRef.current;
    panel?.addEventListener("focusout", onFocusOut);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      panel?.removeEventListener("focusout", onFocusOut);
    };
  }, [open, asSheet, onClose, triggerRef]);

  if (asSheet) {
    return (
      <Modal open={open} onClose={onClose} mobile="sheet" size="sm" layer="nested">
        <Modal.Header title={title} />
        {header && <div className="px-3 pt-3">{header}</div>}
        <Modal.Body padded={false} className="p-2">
          <div id={id} role={role} aria-label={title} onKeyDown={onKeyDown}>
            {children}
          </div>
        </Modal.Body>
      </Modal>
    );
  }

  if (!mounted || !open) return null;

  return createPortal(
    <div
      ref={panelRef}
      style={parentLayer ? { ...style, zIndex: parentLayer + 1 } : style}
      className={cx(
        "popover-panel z-(--z-dropdown) flex flex-col overflow-hidden animate-menu-in",
        "min-w-48 max-w-[min(22rem,calc(100vw-1rem))]",
        panelClassName,
      )}
      {...isolateKeys}
    >
      {header && <div className="p-2 pb-0">{header}</div>}
      <div
        id={id}
        role={role}
        aria-label={title}
        tabIndex={-1}
        onKeyDown={onKeyDown}
        className="p-1 overflow-y-auto overscroll-contain outline-none"
      >
        {children}
      </div>
    </div>,
    document.body,
  );
}

/** Arrow/Home/End roving focus among `[data-menu-item]` inside a container. */
function useRovingKeys(onClose: () => void) {
  return useCallback(
    (event: KeyboardEvent) => {
      const container = event.currentTarget as HTMLElement;
      const items = Array.from(
        container.querySelectorAll<HTMLElement>("[data-menu-item]:not([disabled])"),
      );
      if (items.length === 0) return;
      const index = items.indexOf(document.activeElement as HTMLElement);
      let next = -1;
      if (event.key === "ArrowDown") next = index < 0 ? 0 : (index + 1) % items.length;
      else if (event.key === "ArrowUp") next = index <= 0 ? items.length - 1 : index - 1;
      else if (event.key === "Home") next = 0;
      else if (event.key === "End") next = items.length - 1;
      else if (event.key === "Tab") {
        onClose();
        return;
      } else if (event.key.length === 1 && /\S/.test(event.key)) {
        const char = event.key.toLowerCase();
        const start = index + 1;
        for (let i = 0; i < items.length; i++) {
          const item = items[(start + i) % items.length];
          if (item.textContent?.trim().toLowerCase().startsWith(char)) {
            item.focus();
            break;
          }
        }
        return;
      } else return;
      event.preventDefault();
      items[next]?.focus();
    },
    [onClose],
  );
}

/* ------------------------------------------------------------------------ */
/* Menu                                                                     */
/* ------------------------------------------------------------------------ */

export type MenuItem =
  | {
      type?: "item";
      label: ReactNode;
      description?: ReactNode;
      icon?: ReactNode;
      onSelect: () => void;
      tone?: "default" | "danger";
      disabled?: boolean;
      /** Keeps the menu open after selecting (toggles). */
      keepOpen?: boolean;
      /** Right-aligned hint, e.g. a shortcut or a check. */
      trailing?: ReactNode;
    }
  | { type: "separator" }
  | { type: "label"; label: ReactNode };

export interface MenuProps {
  trigger: (props: TriggerProps) => ReactNode;
  items: MenuItem[];
  /** Accessible name; also the sheet title on mobile. */
  title: string;
  placement?: Placement;
  mobile?: LayerMobile;
  /** Make the panel at least as wide as its trigger (full-width triggers). */
  matchWidth?: boolean;
  className?: string;
}

/** A list of actions attached to a button (⋯ menus, user menus, share). */
export function Menu({
  trigger,
  items,
  title,
  placement = "bottom-end",
  mobile = "sheet",
  matchWidth,
  className,
}: MenuProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);
  const onKeyDown = useRovingKeys(close);
  const firstEnabled = items.findIndex(
    (item) => (item.type ?? "item") === "item" && !("disabled" in item && item.disabled),
  );

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((value) => !value),
        "aria-haspopup": "menu",
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
      })}
      <AnchoredLayer
        open={open}
        onClose={close}
        triggerRef={triggerRef}
        id={id}
        title={title}
        role="menu"
        placement={placement}
        mobile={mobile}
        matchWidth={matchWidth}
        panelClassName={className}
        onKeyDown={onKeyDown}
      >
        {items.map((item, index) => {
          if (item.type === "separator") {
            return <div key={index} role="separator" className="my-1 h-px bg-(--border)" />;
          }
          if (item.type === "label") {
            return (
              <div key={index} className="type-overline px-3 pt-2 pb-1">
                {item.label}
              </div>
            );
          }
          return (
            <MenuRow
              key={index}
              role="menuitem"
              autoFocus={index === firstEnabled}
              icon={item.icon}
              label={item.label}
              description={item.description}
              trailing={item.trailing}
              danger={item.tone === "danger"}
              disabled={item.disabled}
              onClick={() => {
                if (!item.keepOpen) setOpen(false);
                item.onSelect();
              }}
            />
          );
        })}
      </AnchoredLayer>
    </>
  );
}

function MenuRow({
  role,
  icon,
  label,
  description,
  trailing,
  danger,
  disabled,
  selected,
  autoFocus,
  onClick,
}: {
  role: "menuitem" | "option";
  icon?: ReactNode;
  label: ReactNode;
  description?: ReactNode;
  trailing?: ReactNode;
  danger?: boolean;
  disabled?: boolean;
  selected?: boolean;
  autoFocus?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role={role}
      aria-selected={role === "option" ? selected : undefined}
      data-menu-item
      data-autofocus={autoFocus ? true : undefined}
      disabled={disabled}
      onClick={onClick}
      className={cx(
        "w-full flex items-center gap-3 text-left rounded-(--radius-control) outline-none transition-colors duration-(--duration-fast)",
        "px-3 py-2.5 min-h-11 sm:min-h-9 sm:py-2 text-sm font-inter",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        danger
          ? "text-(--error) hover:bg-(--error)/10 focus-visible:bg-(--error)/10"
          : "text-(--text-primary) hover:bg-(--surface-elevated) focus-visible:bg-(--surface-elevated)",
        selected && "text-(--primary) font-medium",
      )}
    >
      {icon && (
        <span
          className={cx(
            "shrink-0 [&_svg]:w-4 [&_svg]:h-4",
            danger ? "text-(--error)" : selected ? "text-(--primary)" : "text-(--text-muted)",
          )}
        >
          {icon}
        </span>
      )}
      <span className="flex-1 min-w-0">
        <span className="block truncate">{label}</span>
        {description && (
          <span className="block type-caption mt-0.5 whitespace-normal">{description}</span>
        )}
      </span>
      {trailing && <span className="shrink-0 type-caption">{trailing}</span>}
      {role === "option" && (
        <Check
          aria-hidden
          className={cx("w-4 h-4 shrink-0 text-(--primary)", !selected && "invisible")}
        />
      )}
    </button>
  );
}

/* ------------------------------------------------------------------------ */
/* SelectMenu                                                               */
/* ------------------------------------------------------------------------ */

export interface SelectOption<T extends string> {
  value: T;
  label: ReactNode;
  /** Plain-text label for search and the trigger when `label` is rich. */
  textLabel?: string;
  description?: ReactNode;
  icon?: ReactNode;
  disabled?: boolean;
  group?: string;
}

export interface SelectMenuProps<T extends string> {
  value: T | null | undefined;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  /** Accessible name; also the sheet title on mobile. */
  label: string;
  placeholder?: string;
  searchable?: boolean;
  searchPlaceholder?: string;
  size?: "sm" | "md" | "lg";
  fullWidth?: boolean;
  disabled?: boolean;
  /** Replace the default input-like trigger. */
  trigger?: (props: TriggerProps & { selected?: SelectOption<T> }) => ReactNode;
  placement?: Placement;
  mobile?: LayerMobile;
  className?: string;
  id?: string;
}

/**
 * Single choice with rich options (icons, descriptions, groups, search).
 * For plain form fields prefer the native `Select`.
 */
export function SelectMenu<T extends string>({
  value,
  onChange,
  options,
  label,
  placeholder = "Select…",
  searchable = false,
  searchPlaceholder = "Search…",
  size = "md",
  fullWidth = true,
  disabled,
  trigger,
  placement = "bottom-start",
  mobile = "sheet",
  className,
  id: idProp,
}: SelectMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const generatedId = useId();
  const listId = `${idProp ?? generatedId}-list`;
  const close = useCallback(() => setOpen(false), []);
  const onKeyDown = useRovingKeys(close);
  const selected = options.find((option) => option.value === value);

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => {
      const text =
        option.textLabel ?? (typeof option.label === "string" ? option.label : String(option.value));
      return text.toLowerCase().includes(q);
    });
  }, [options, query]);

  const triggerProps: TriggerProps = {
    ref: triggerRef,
    onClick: () => !disabled && setOpen((v) => !v),
    "aria-haspopup": "listbox",
    "aria-expanded": open,
    "aria-controls": open ? listId : undefined,
  };

  let lastGroup: string | undefined;

  return (
    <>
      {trigger ? (
        trigger({ ...triggerProps, selected })
      ) : (
        <button
          {...triggerProps}
          id={idProp}
          type="button"
          disabled={disabled}
          aria-label={selected ? undefined : label}
          className={cx(
            "input flex items-center gap-2 text-left",
            size === "sm" && "input-sm",
            size === "lg" && "input-lg",
            fullWidth ? "w-full" : "w-auto",
            open && "border-(--primary)",
            className,
          )}
        >
          {selected?.icon && (
            <span className="shrink-0 text-(--text-muted) [&_svg]:w-4 [&_svg]:h-4">
              {selected.icon}
            </span>
          )}
          <span className={cx("flex-1 min-w-0 truncate", !selected && "text-(--text-muted)")}>
            {selected ? selected.label : placeholder}
          </span>
          <ChevronDown
            aria-hidden
            className={cx(
              "w-4 h-4 shrink-0 text-(--text-muted) transition-transform duration-(--duration-fast)",
              open && "rotate-180",
            )}
          />
        </button>
      )}
      <AnchoredLayer
        open={open}
        onClose={close}
        triggerRef={triggerRef}
        id={listId}
        title={label}
        role="listbox"
        placement={placement}
        mobile={mobile}
        matchWidth
        panelClassName="max-h-80"
        onKeyDown={onKeyDown}
        header={
          searchable ? (
            <SearchInput
              value={query}
              onChange={setQuery}
              placeholder={searchPlaceholder}
              size="sm"
              aria-label={searchPlaceholder}
              data-autofocus
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  const list = document.getElementById(listId);
                  list?.querySelector<HTMLElement>("[data-menu-item]:not([disabled])")?.focus();
                }
              }}
            />
          ) : undefined
        }
      >
        {filtered.length === 0 ? (
          <p className="type-caption px-3 py-4 text-center">No matches</p>
        ) : (
          filtered.map((option) => {
            const heading =
              option.group && option.group !== lastGroup ? option.group : undefined;
            lastGroup = option.group;
            return (
              <div key={option.value}>
                {heading && <div className="type-overline px-3 pt-2 pb-1">{heading}</div>}
                <MenuRow
                  role="option"
                  selected={option.value === value}
                  autoFocus={!searchable && option.value === (selected?.value ?? filtered[0]?.value)}
                  icon={option.icon}
                  label={option.label}
                  description={option.description}
                  disabled={option.disabled}
                  onClick={() => {
                    onChange(option.value);
                    setOpen(false);
                  }}
                />
              </div>
            );
          })
        )}
      </AnchoredLayer>
    </>
  );
}

/* ------------------------------------------------------------------------ */
/* Popover                                                                  */
/* ------------------------------------------------------------------------ */

export interface PopoverProps {
  trigger: (props: TriggerProps) => ReactNode;
  /** Accessible name; also the sheet title on mobile. */
  title: string;
  children: ReactNode | ((close: () => void) => ReactNode);
  placement?: Placement;
  mobile?: LayerMobile;
  className?: string;
}

/** Anchored panel with arbitrary content (info, filters, share targets). */
export function Popover({
  trigger,
  title,
  children,
  placement = "bottom-start",
  mobile = "sheet",
  className,
}: PopoverProps) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const id = useId();
  const close = useCallback(() => setOpen(false), []);

  return (
    <>
      {trigger({
        ref: triggerRef,
        onClick: () => setOpen((v) => !v),
        "aria-haspopup": "dialog",
        "aria-expanded": open,
        "aria-controls": open ? id : undefined,
      })}
      <AnchoredLayer
        open={open}
        onClose={close}
        triggerRef={triggerRef}
        id={id}
        title={title}
        role="dialog"
        placement={placement}
        mobile={mobile}
        panelClassName={cx("min-w-64", className)}
      >
        {typeof children === "function" ? children(close) : children}
      </AnchoredLayer>
    </>
  );
}
