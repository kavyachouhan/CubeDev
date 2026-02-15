"use client";

import { useState, useRef, useEffect, ReactNode } from "react";
import { ChevronDown } from "lucide-react";

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
  maxHeight = "max-h-72",
}: AdminDropdownProps<T>) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Find the currently selected option for display
  const selectedOption = options.find((opt) => opt.value === value);

  // Filter options when searchable
  const filteredOptions = searchable
    ? options.filter(
        (opt) =>
          opt.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (opt.description &&
            opt.description.toLowerCase().includes(searchQuery.toLowerCase())),
      )
    : options;

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setSearchQuery("");
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Close on escape
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

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: T) => {
    onChange(optionValue);
    setIsOpen(false);
    setSearchQuery("");
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
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
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => {
              setIsOpen(false);
              setSearchQuery("");
            }}
          />

          {/* Dropdown menu */}
          <div
            className={`absolute top-full left-0 mt-1 w-full min-w-[200px] bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 overflow-hidden ${menuClassName}`}
          >
            {/* Search input */}
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

            {/* Options list */}
            <div className={`overflow-y-auto ${maxHeight}`}>
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
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// AdminSelect - A simpler dropdown for form controls, without the need for a custom menu
interface AdminSelectProps<T = string> {
  value: T;
  onChange: (value: T) => void;
  options: Array<{ value: T; label: string; disabled?: boolean }>;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function AdminSelect<T extends string = string>({
  value,
  onChange,
  options,
  placeholder,
  className = "",
  disabled = false,
}: AdminSelectProps<T>) {
  return (
    <select
      value={value as string}
      onChange={(e) => onChange(e.target.value as T)}
      disabled={disabled}
      className={`px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] font-inter focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={String(option.value)}
          value={option.value as string}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  );
}

// AdminFilterDropdown - A dropdown specifically designed for filtering, with optional count display and simpler styling
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
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((opt) => opt.value === value);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      {label && (
        <span className="text-xs text-[var(--text-muted)] font-inter mb-1 block">
          {label}
        </span>
      )}
      <button
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
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute top-full left-0 mt-1 min-w-full w-max bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-50 max-h-60 overflow-y-auto">
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
                {showCounts && option.count !== undefined && (
                  <span className="text-xs text-[var(--text-muted)]">
                    {option.count}
                  </span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default AdminDropdown;