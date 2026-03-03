"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  User,
  Users,
  Settings,
  LogOut,
  ChevronUp,
  Home,
  Mail,
} from "lucide-react";

interface SidebarUserDropdownProps {
  user: {
    name: string;
    wcaId?: string;
    avatar?: any;
  };
  onSignOut: () => void;
  collapsed?: boolean;
}

export default function SidebarUserDropdown({
  user,
  onSignOut,
  collapsed = false,
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
    <div
      className={`relative ${collapsed ? "hidden lg:flex lg:justify-center" : "w-full"}`}
      ref={dropdownRef}
    >
      {/* User Info */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={
          collapsed
            ? "p-2 rounded-full hover:bg-(--surface-elevated) transition-colors"
            : "w-full sidebar-user-card flex items-center gap-3 p-3"
        }
        title={collapsed ? `${user.name} - Click to open menu` : undefined}
      >
        {user.avatar && (
          <div className="relative">
            <Image
              src={user.avatar.url || user.avatar}
              alt={`${user.name}'s avatar`}
              width={collapsed ? 32 : 36}
              height={collapsed ? 32 : 36}
              className={`rounded-full object-cover border-2 ${collapsed ? "w-8 h-8 border-(--primary)/50" : "w-9 h-9 border-(--primary)/30 hover:border-(--primary)"} transition-colors`}
            />
          </div>
        )}
        {!collapsed && (
          <>
            <div className="flex-1 text-left min-w-0">
              <div className="text-sm font-semibold text-(--text-primary) font-button truncate">
                {user.name}
              </div>
              {user.wcaId ? (
                <div className="text-xs text-(--text-secondary) font-inter">
                  {user.wcaId}
                </div>
              ) : (
                <div className="text-xs text-(--success) font-inter">
                  Connected
                </div>
              )}
            </div>
            <ChevronUp
              className={`w-4 h-4 text-(--text-secondary) transition-transform duration-200 ${
                isOpen ? "rotate-0" : "rotate-180"
              }`}
            />
          </>
        )}
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute bottom-full mb-2 bg-(--background) border border-(--border) rounded-lg shadow-lg z-50 py-2 ${collapsed ? "left-0 min-w-[200px]" : "left-0 right-0"}`}
        >
          {/* Menu Items */}
          <div className="py-1">
            <Link
              href="/"
              className="flex items-center gap-3 px-4 py-2 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Home className="w-4 h-4" />
              Home
            </Link>

            {user.wcaId && (
              <Link
                href={`/cuber/${user.wcaId}`}
                className="flex items-center gap-3 px-4 py-2 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) transition-colors font-inter"
                onClick={() => setIsOpen(false)}
              >
                <User className="w-4 h-4" />
                Public Profile
              </Link>
            )}

            <Link
              href="/cuber"
              className="flex items-center gap-3 px-4 py-2 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Users className="w-4 h-4" />
              Cubers
            </Link>

            <Link
              href="/contact"
              className="flex items-center gap-3 px-4 py-2 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Mail className="w-4 h-4" />
              Contact
            </Link>

            <Link
              href="/me"
              className="flex items-center gap-3 px-4 py-2 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) transition-colors font-inter"
              onClick={() => setIsOpen(false)}
            >
              <Settings className="w-4 h-4" />
              Settings
            </Link>
          </div>

          {/* Sign Out */}
          <div className="border-t border-(--border) pt-1 mt-1">
            <button
              onClick={() => {
                onSignOut();
                setIsOpen(false);
              }}
              className="flex items-center gap-3 px-4 py-2 w-full text-left text-(--text-secondary) hover:text-red-500 hover:bg-(--surface-elevated) transition-colors font-inter"
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