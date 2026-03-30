"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check } from "lucide-react";

interface Option {
  value: string;
  label: string;
}

interface FeedbackDropdownProps {
  options: Option[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

export default function FeedbackDropdown({
  options,
  value,
  onChange,
  placeholder = "Select an option...",
  label,
}: FeedbackDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedOption = options.find((o) => o.value === value);
  const displayText = selectedOption?.label || placeholder;

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

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Close dropdown on escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [isOpen]);

  return (
    <div className="relative" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-(--text-primary) mb-2 font-inter">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-(--surface-elevated) border border-(--border) rounded-lg hover:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all"
      >
        <span
          className={`text-sm font-medium truncate font-inter ${
            value ? "text-(--text-primary)" : "text-(--text-muted)"
          }`}
        >
          {displayText}
        </span>
        <ChevronDown
          className={`w-4 h-4 text-(--text-muted) shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
          {/* Empty option */}
          <button
            type="button"
            onClick={() => {
              onChange("");
              setIsOpen(false);
            }}
            className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors font-inter ${
              !value
                ? "text-(--primary) bg-(--primary)/10"
                : "text-(--text-muted) hover:bg-(--surface-elevated)"
            }`}
          >
            <span className="truncate">{placeholder}</span>
            {!value && (
              <Check className="w-4 h-4 text-(--primary) shrink-0" />
            )}
          </button>

          {options.map((option, index) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors font-inter border-t border-(--border)/50 ${
                value === option.value
                  ? "text-(--primary) bg-(--primary)/10"
                  : "text-(--text-primary) hover:bg-(--surface-elevated)"
              }`}
            >
              <span className="truncate">{option.label}</span>
              {value === option.value && (
                <Check className="w-4 h-4 text-(--primary) shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}