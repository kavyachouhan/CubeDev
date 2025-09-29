"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Settings,
  LogOut,
  ChevronUp,
  Home,
} from "lucide-react";

interface SidebarUserDropdownProps {
  user: {
    name: string;
    wcaId?: string;
    avatar?: any;
  };
  onSignOut: () => void;
}

export default function SidebarUserDropdown({
  user,
  onSignOut,
}: SidebarUserDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* User Info */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full sidebar-user-card flex items-center gap-3 p-3"
      >
        {user.avatar && (
          <div className="relative">
            <Image
              src={user.avatar.url || user.avatar}
              alt={`${user.name}'s avatar`}
              width={36}
              height={36}
              className="w-9 h-9 rounded-full object-cover border-2 border-[var(--primary)]/30 hover:border-[var(--primary)] transition-colors"
            />
          </div>
        )}
        <div className="flex-1 text-left min-w-0">
          <div className="text-sm font-semibold text-[var(--text-primary)] font-button truncate">
            {user.name}
          </div>
          {user.wcaId ? (
            <div className="text-xs text-[var(--text-secondary)] font-inter">
              {user.wcaId}
            </div>
          ) : (
            <div className="text-xs text-[var(--success)] font-inter">
              Connected
            </div>
          )}
        </div>
        <ChevronUp
          className={`w-4 h-4 text-[var(--text-secondary)] transition-transform duration-200 ${
            isOpen ? "rotate-0" : "rotate-180"
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute bottom-full left-0 right-0 mb-2 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50 py-2">
          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4" />
              Home
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
              href="/me"
              className="flex items-center gap-3 px-4 py-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-[var(--border)] pt-1 mt-1">
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