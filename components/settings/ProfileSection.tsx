"use client";

import { User, ExternalLink } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { getWCAOAuthUrl } from "@/lib/wca-config";
import { isCubeDevIdentifier } from "@/lib/identifier-utils";

export default function ProfileSection() {
  const { user } = useUser();

  if (!user) return null;

  const userIdentifier = user.wcaId || "Unknown";
  const isCdUser = isCubeDevIdentifier(user.wcaId);

  const handleReauth = () => {
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  return (
    <div className="timer-card">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-(--text-primary) font-statement">
            Profile Information
          </h3>
          <p className="text-sm text-(--text-muted)">
            {isCdUser
              ? "Your CubeDev profile information"
              : "Your WCA profile information"}
          </p>
        </div>
      </div>

      <div className="space-y-4 md:space-y-6">
        {/* Profile Card */}
        <div className="bg-(--surface-elevated) rounded-lg border border-(--border) p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4 mb-3 md:mb-4">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-(--border)"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-(--surface) rounded-full border-2 border-(--border) flex items-center justify-center">
                <User className="w-6 h-6 md:w-8 md:h-8 text-(--text-muted)" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="text-base md:text-lg font-semibold text-(--text-primary) truncate">
                {user.name}
              </h4>
              <div className="flex items-center gap-2 text-xs md:text-sm text-(--text-muted)">
                <span>{userIdentifier}</span>
                <span>•</span>
                <span>{user.countryIso2}</span>
              </div>
            </div>
          </div>

          {!isCdUser && user.wcaId ? (
            <a
              href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-3 py-2 bg-(--primary) text-white rounded-md hover:bg-(--primary-hover) transition-colors text-xs md:text-sm font-medium w-full"
            >
              <ExternalLink className="w-3 h-3 md:w-4 md:h-4" />
              View WCA Profile
            </a>
          ) : (
            <button
              type="button"
              onClick={handleReauth}
              className="flex items-center justify-center gap-2 px-3 py-2 bg-(--primary) text-white rounded-md hover:bg-(--primary-hover) transition-colors text-xs md:text-sm font-medium w-full"
            >
              Re-auth with WCA
            </button>
          )}
        </div>

        {/* Profile Info Fields */}
        <div className="space-y-3 md:space-y-4">
          <div>
            <label className="block text-xs md:text-sm font-medium text-(--text-secondary) mb-1">
              Full Name
            </label>
            <div className="px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-md text-(--text-primary) text-sm md:text-base">
              {user.name}
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-(--text-secondary) mb-1">
              {isCdUser ? "CubeDev ID" : "WCA ID"}
            </label>
            <div className="px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-md text-(--text-primary) text-sm md:text-base">
              {userIdentifier}
            </div>
          </div>

          <div>
            <label className="block text-xs md:text-sm font-medium text-(--text-secondary) mb-1">
              Country
            </label>
            <div className="px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-md text-(--text-primary) text-sm md:text-base">
              {user.countryIso2}
            </div>
          </div>

          {user.email && (
            <div>
              <label className="block text-xs md:text-sm font-medium text-(--text-secondary) mb-1">
                Email
              </label>
              <div className="px-3 py-2 bg-(--surface-elevated) border border-(--border) rounded-md text-(--text-primary) text-sm md:text-base break-all">
                {user.email}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 md:mt-6 p-3 bg-(--surface-elevated) rounded-lg border-l-4 border-l-(--primary)">
        <p className="text-xs md:text-sm text-(--text-secondary)">
          <span className="font-medium text-(--text-primary)">Note:</span>{" "}
          {isCdUser
            ? "You currently use a CubeDev ID because your WCA account does not have a WCA competition ID yet. Use Re-auth with WCA after your first official competition to upgrade to your WCA ID."
            : "Profile information is synchronized with your WCA account and cannot be edited here. To update your profile, make changes on the WCA website."}
        </p>
      </div>
    </div>
  );
}