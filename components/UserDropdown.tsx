"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { User, Settings, Box, LogOut, ChevronDown } from "lucide-react";

interface UserDropdownProps {
  user: {
    name: string;
    wcaId?: string;
    avatar?: any;
  };
  onSignOut: () => void;
}

export default function UserDropdown({ user, onSignOut }: UserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Handle mouse enter - show dropdown
  const handleMouseEnter = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsOpen(true);
  };

  // Handle mouse leave - hide dropdown with slight delay
  const handleMouseLeave = () => {
    timeoutRef.current = setTimeout(() => {
      setIsOpen(false);
    }, 150); // 150ms delay
  };

  // Close dropdown if clicking outside
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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className="relative"
      ref={dropdownRef}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* User Info Trigger */}
      <button className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[var(--surface-elevated)] transition-all duration-200 group">
        {user.avatar && (
          <Image
            src={user.avatar.url || user.avatar}
            alt={`${user.name}'s avatar`}
            width={32}
            height={32}
            className="w-8 h-8 rounded-full object-cover"
          />
        )}
        <div className="hidden lg:block text-left">
          <div className="text-sm font-semibold text-[var(--text-primary)] font-button">
            {user.name}
          </div>
          {user.wcaId && (
            <div className="text-xs text-[var(--text-secondary)] font-inter">
              {user.wcaId}
            </div>
          )}
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-56 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-2">
          {/* User Info Header */}
          <div className="px-4 py-3 border-b border-[var(--border)]">
            <div className="flex items-center gap-3">
              {user.avatar && (
                <Image
                  src={user.avatar.url || user.avatar}
                  alt={`${user.name}'s avatar`}
                  width={40}
                  height={40}
                  className="w-10 h-10 rounded-full object-cover"
                />
              )}
              <div>
                <div className="font-semibold text-[var(--text-primary)] font-button">
                  {user.name}
                </div>
                {user.wcaId && (
                  <div className="text-sm text-[var(--text-secondary)] font-inter">
                    {user.wcaId}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="py-2">
            <Link
              href="/cube-lab/timer"
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Box className="w-4 h-4" />
              Cube Lab
            </Link>

            {user.wcaId && (
              <Link
                href={`/cuber/${user.wcaId}`}
                className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors font-inter"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                Public Profile
              </Link>
            )}

            <Link
              href="/profile"
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Account Settings
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-[var(--border)] pt-2">
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 w-full text-left text-[var(--text-secondary)] hover:text-red-500 hover:bg-[var(--surface-elevated)] transition-colors font-inter"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}