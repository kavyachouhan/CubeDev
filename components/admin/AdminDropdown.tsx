"use client";

import { useState, useRef, useEffect, useCallback, ReactNode } from "react";
import { createPortal } from "react-dom";
import { ChevronDown, Check } from "lucide-react";

// Shared hook to compute dropdown position relative to viewport
// Uses a portal approach so menus are never clipped by overflow:hidden parents
function useDropdownPosition(
  isOpen: boolean,
  triggerRef: React.RefObject<HTMLElement | null>,
  fullWidth: boolean = false,
) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    maxHeight: number;
    openUp: boolean;
  }>({ top: 0, left: 0, width: 200, maxHeight: 240, openUp: false });

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const spaceBelow = viewportHeight - rect.bottom;
    const spaceAbove = rect.top;
    const menuHeight = 240;
    const openUp = spaceBelow < menuHeight && spaceAbove > spaceBelow;
    const menuWidth = fullWidth ? rect.width : Math.max(rect.width, 200);

    // Prevent menu from going off-screen horizontally
    let left = rect.left;
    if (left + menuWidth > viewportWidth - 8) {
      left = Math.max(8, viewportWidth - menuWidth - 8);
    }

    setPosition({
      top: openUp
        ? rect.top - Math.min(menuHeight, spaceAbove - 8)
        : rect.bottom + 4,
      left,
      width: menuWidth,
      maxHeight: openUp
        ? Math.min(menuHeight, spaceAbove - 8)
        : Math.min(menuHeight, spaceBelow - 8),
      openUp,
    });
  }, [triggerRef, fullWidth]);

  useEffect(() => {
    if (!isOpen) return;
    updatePosition();

    const handleUpdate = () => updatePosition();
    window.addEventListener("scroll", handleUpdate, true);
    window.addEventListener("resize", handleUpdate);

    return () => {
      window.removeEventListener("scroll", handleUpdate, true);
      window.removeEventListener("resize", handleUpdate);
    };
  }, [isOpen, updatePosition]);

  return position;
}

// Portal wrapper for dropdown menus
function DropdownPortal({ children }: { children: ReactNode }) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}

// AdminDropdown - A versatile dropdown component for admin interfaces
export interface DropdownOption<T = string> {
  value: T;
  label: string;
  description?: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

interface AdminDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: DropdownOption<T>[];
  placeholder?: string;
  icon?: ReactNode;
  className?: string;
  buttonClassName?: string;
  menuClassName?: string;
  disabled?: boolean;
  showCount?: boolean;
  searchable?: boolean;
  maxHeight?: string;
}

export function AdminDropdown<T extends string | number = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  icon,
  className = "",
  buttonClassName = "",
  menuClassName = "",
  disabled = false,
  showCount = false,
  searchable = false,
}: AdminDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useDropdownPosition(isOpen, triggerRef);

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.description &&
            opt.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : options;

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div className={`relative ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] ${buttonClassName}`}
      >
        {icon && <span className="shrink-0">{icon}</span>}
        {selectedOption?.icon && (
          <span className="shrink-0">{selectedOption.icon}</span>
        )}
        <span className="text-sm font-medium text-[var(--text-primary)] font-inter truncate">
          {selectedOption?.label || placeholder}
        </span>
        {showCount && selectedOption?.count !== undefined && (
          <span className="text-xs text-[var(--text-muted)] font-inter">
            ({selectedOption.count.toLocaleString()})
          </span>
        )}
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <DropdownPortal>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />
          <div
            ref={menuRef}
            className={`fixed bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden ${menuClassName}`}
            style={{
              zIndex: 9999,
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            {searchable && (
              <div className="p-2 border-b border-[var(--border)]">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search..."
                  className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-sm text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent font-inter"
                  autoFocus
                />
              </div>
            )}
            <div
              className="overflow-y-auto"
              style={{
                maxHeight: position.maxHeight - (searchable ? 52 : 0),
              }}
            >
              {filteredOptions.length === 0 ? (
                <div className="px-3 py-4 text-sm text-[var(--text-muted)] text-center font-inter">
                  No options found
                </div>
              ) : (
                filteredOptions.map((option) => (
                  <button
                    key={String(option.value)}
                    type="button"
                    onClick={() =>
                      !option.disabled && handleSelect(option.value)
                    }
                    disabled={option.disabled}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-[var(--surface-elevated)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                      option.value === value
                        ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                        : "text-[var(--text-primary)]"
                    }`}
                  >
                    {option.icon && (
                      <span className="shrink-0">{option.icon}</span>
                    )}
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-inter block truncate">
                        {option.label}
                      </span>
                      {option.description && (
                        <span className="text-xs text-[var(--text-muted)] font-inter block truncate">
                          {option.description}
                        </span>
                      )}
                    </div>
                    {showCount && option.count !== undefined && (
                      <span className="text-xs text-[var(--text-muted)] font-inter shrink-0">
                        {option.count.toLocaleString()}
                      </span>
                    )}
                    {option.value === value && (
                      <Check className="w-4 h-4 text-[var(--primary)] shrink-0" />
                    )}
                  </button>
                ))
              )}
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}

// AdminSelect - A custom styled dropdown for form controls, matching timer settings design
interface AdminSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{
    value: T;
    label: string;
    description?: string;
    icon?: ReactNode;
    disabled?: boolean;
  }>;
  placeholder?: string;
  className?: string;
  buttonClassName?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  compact?: boolean;
}

export function AdminSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  buttonClassName = "",
  disabled = false,
  fullWidth = false,
  compact = false,
}: AdminSelectProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useDropdownPosition(isOpen, triggerRef, true);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen]);

  return (
    <div className={`${fullWidth ? "w-full" : ""} ${className}`}>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={`flex items-center justify-between gap-2 ${
          compact ? "px-3 py-1.5" : "px-3 py-2"
        } ${
          fullWidth ? "w-full" : ""
        } bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-[var(--border)] ${buttonClassName}`}
      >
        <div className="flex items-center gap-2 min-w-0 flex-1">
          {selectedOption?.icon && (
            <span className="flex-shrink-0 text-[var(--primary)]">
              {selectedOption.icon}
            </span>
          )}
          <div className="text-left min-w-0 flex-1">
            <span
              className={`block truncate font-inter text-sm ${
                selectedOption
                  ? "text-[var(--text-primary)] font-medium"
                  : "text-[var(--text-muted)]"
              }`}
            >
              {selectedOption?.label || placeholder}
            </span>
            {selectedOption?.description && !compact && (
              <span className="block text-xs text-[var(--text-muted)] font-inter truncate">
                {selectedOption.description}
              </span>
            )}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-muted)] transition-transform flex-shrink-0 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <DropdownPortal>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden"
            style={{
              zIndex: 9999,
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            <div
              className="overflow-y-auto"
              style={{ maxHeight: position.maxHeight }}
            >
              {options.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    if (!option.disabled) {
                      onChange(option.value);
                      setIsOpen(false);
                    }
                  }}
                  disabled={option.disabled}
                  className={`w-full text-left ${
                    compact ? "px-3 py-2" : "px-3 py-2.5"
                  } hover:bg-[var(--surface-elevated)] transition-colors border-b border-[var(--border)]/30 last:border-b-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                    option.value === value ? "bg-[var(--primary)]/10" : ""
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      {option.icon && (
                        <span
                          className={`flex-shrink-0 ${
                            option.value === value
                              ? "text-[var(--primary)]"
                              : "text-[var(--text-secondary)]"
                          }`}
                        >
                          {option.icon}
                        </span>
                      )}
                      <div className="min-w-0 flex-1">
                        <span
                          className={`block text-sm font-inter truncate ${
                            option.value === value
                              ? "text-[var(--primary)] font-medium"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {option.label}
                        </span>
                        {option.description && (
                          <span className="block text-xs text-[var(--text-muted)] font-inter mt-0.5 truncate">
                            {option.description}
                          </span>
                        )}
                      </div>
                    </div>
                    {option.value === value && (
                      <Check className="w-4 h-4 text-[var(--primary)] flex-shrink-0" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}

// AdminFilterDropdown - A dropdown specifically designed for filtering
interface AdminFilterDropdownProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; count?: number }>;
  label?: string;
  className?: string;
  showCounts?: boolean;
}

export function AdminFilterDropdown<T extends string = string>({
  value,
  onChange,
  options,
  label,
  className = "",
  showCounts = false,
}: AdminFilterDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const position = useDropdownPosition(isOpen, triggerRef);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        menuRef.current &&
        !menuRef.current.contains(target)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className={`${className}`}>
      {label && (
        <span className="text-xs text-[var(--text-muted)] font-inter mb-1 block">
          {label}
        </span>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)] transition-colors text-sm"
      >
        <span className="text-[var(--text-primary)] font-inter">
          {selectedOption?.label || "Select"}
        </span>
        {showCounts && selectedOption?.count !== undefined && (
          <span className="text-xs text-[var(--text-muted)]">
            ({selectedOption.count})
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-[var(--text-muted)] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {isOpen && (
        <DropdownPortal>
          <div
            className="fixed inset-0"
            style={{ zIndex: 9998 }}
            onClick={() => setIsOpen(false)}
          />
          <div
            ref={menuRef}
            className="fixed bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden"
            style={{
              zIndex: 9999,
              top: position.top,
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
            }}
          >
            <div
              className="overflow-y-auto"
              style={{ maxHeight: position.maxHeight }}
            >
              {options.map((option) => (
                <button
                  key={String(option.value)}
                  type="button"
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-[var(--surface-elevated)] transition-colors ${
                    option.value === value
                      ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                      : "text-[var(--text-primary)]"
                  }`}
                >
                  <span className="font-inter">{option.label}</span>
                  <div className="flex items-center gap-2 shrink-0">
                    {showCounts && option.count !== undefined && (
                      <span className="text-xs text-[var(--text-muted)]">
                        {option.count}
                      </span>
                    )}
                    {option.value === value && (
                      <Check className="w-3.5 h-3.5 text-[var(--primary)]" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        </DropdownPortal>
      )}
    </div>
  );
}

export default AdminDropdown;
