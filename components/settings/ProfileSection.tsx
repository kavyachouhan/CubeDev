"use client";

import { User, ExternalLink } from "lucide-react";
import { useUser } from "@/components/UserProvider";

export default function ProfileSection() {
  const { user } = useUser();

  if (!user) return null;

  return (
    <div className="timer-card">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement">
            Profile Information
          </h3>
          <p className="text-sm text-[var(--text-muted)]">
            Your WCA profile information
          </p>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Profile Card */}
        <div className="bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-[var(--border)]"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-[var(--surface)] rounded-full border-2 border-[var(--border)] flex items-center justify-center">
                <User className="w-6 h-6 md:w-8 md:h-8 text-[var(--text-muted)]" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-base md:text-lg font-semibold text-[var(--text-primary)] truncate">
                {user.name}
              </h4>
              <div className="flex items-center gap-2 text-xs md:text-sm text-[var(--text-muted)]">
                <span>{user.wcaId}</span>
                <span>•</span>
                <span>{user.countryIso2}</span>
              </div>
            </div>
          </div>

          <a
            href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 px-3 py-2 bg-[var(--primary)] text-white rounded-md hover:bg-[var(--primary-hover)] transition-colors text-xs md:text-sm font-medium w-full"
          >
            <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
            View WCA Profile
          </a>
        </div>

        {/* Profile Info Fields */}
        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-1">
              Full Name
            </label>
            <div className="px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm md:text-base">
              {user.name}
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-1">
              WCA ID
            </label>
            <div className="px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm md:text-base">
              {user.wcaId}
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-1">
              Country
            </label>
            <div className="px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm md:text-base">
              {user.countryIso2}
            </div>
          </div>

          {user.email && (
            <div>
              <label className="block text-xs md:text-sm font-medium text-[var(--text-secondary)] mb-1">
                Email
              </label>
              <div className="px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-md text-[var(--text-primary)] text-sm md:text-base break-all">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 md:mt-6 p-3 bg-[var(--surface-elevated)] rounded-lg border-l-4 border-l-[var(--primary)]">
        <p className="text-xs md:text-sm text-[var(--text-secondary)]">
          <span className="font-medium text-[var(--text-primary)]">Note:</span>{" "}
          Profile information is synchronized with your WCA account and cannot
          be edited here. To update your profile, make changes on the WCA
          website.
        </p>
      </div>
    </div>
  );
}