"use client";

import { useState, useRef, useEffect } from "react";
import { MapPin, ChevronDown, Check } from "lucide-react";

interface Region {
  code: string;
  name: string;
}

interface RegionDropdownProps {
  regions: Region[];
  selectedRegion: string;
  onRegionChange: (code: string) => void;
  label?: string;
}

export default function RegionDropdown({
  regions,
  selectedRegion,
  onRegionChange,
  label = "Region",
}: RegionDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedRegionName =
    regions.find((r) => r.code === selectedRegion)?.name || "All Regions";

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
        <label className="text-sm text-(--text-secondary) mb-1.5 block">
          {label}
        </label>
      )}

      {/* Dropdown Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2 bg-(--surface) border border-(--border) rounded-lg hover:border-(--primary) focus:outline-none focus:ring-2 focus:ring-(--primary) focus:border-transparent transition-all"
      >
        <div className="flex items-center gap-2 min-w-0">
          <MapPin className="w-4 h-4 text-(--primary) shrink-0" />
          <span className="text-sm font-medium text-(--text-primary) truncate">
            {selectedRegionName}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-(--text-muted) shrink-0 transition-transform duration-200 ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-(--surface) border border-(--border) rounded-lg shadow-xl z-200 max-h-64 overflow-y-auto">
          {regions.map((region, index) => (
            <button
              key={region.code}
              type="button"
              onClick={() => {
                onRegionChange(region.code);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
                index !== 0 ? "border-t border-(--border)/50" : ""
              } ${
                selectedRegion === region.code
                  ? "text-(--primary) bg-(--primary)/10"
                  : "text-(--text-primary) hover:bg-(--surface-elevated)"
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <span className="truncate">{region.name}</span>
              </div>
              {selectedRegion === region.code && (
                <Check className="w-4 h-4 text-(--primary) shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}