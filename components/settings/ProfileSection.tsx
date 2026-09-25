"use client";

import { ExternalLink, User } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { wcaSignInHref } from "@/lib/wca-config";
import { isCubeDevIdentifier } from "@/lib/identifier-utils";
import { getAvatarUrl } from "@/lib/avatar";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { buttonClasses } from "@/components/ui/button-styles";
import { Card, CardHeader } from "@/components/ui/Card";
import { Field, Input } from "@/components/ui/Field";

export default function ProfileSection() {
  const { user } = useUser();

  if (!user) return null;

  const userIdentifier = user.wcaId || "Unknown";
  const isCdUser = isCubeDevIdentifier(user.wcaId);
  const avatarUrl = getAvatarUrl(user.avatar);

  const handleReauth = () => {
    window.location.href = wcaSignInHref();
  };

  return (
    <Card variant="static">
      <CardHeader
        title="Profile Information"
        description={
          isCdUser ? "Your CubeDev profile information" : "Your WCA profile information"
        }
      />

      <div className="space-y-5">
        <div className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-3 md:p-4">
          <div className="flex items-center gap-3 md:gap-4 mb-4">
            {avatarUrl ? (
              // WCA avatars come from arbitrary hosts, so next/image can't optimize them.
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={avatarUrl}
                alt=""
                className="w-12 h-12 md:w-16 md:h-16 rounded-full border-2 border-(--border) object-cover"
              />
            ) : (
              <div className="w-12 h-12 md:w-16 md:h-16 bg-(--surface) rounded-full border-2 border-(--border) flex items-center justify-center">
                <User className="w-6 h-6 md:w-8 md:h-8 text-(--text-muted)" aria-hidden />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="text-base md:text-lg font-semibold text-(--text-primary) truncate">
                {user.name}
              </p>
              <p className="type-caption">
                {userIdentifier} · {user.countryIso2}
              </p>
            </div>
          </div>

          {!isCdUser && user.wcaId ? (
            <a
              href={`https://www.worldcubeassociation.org/persons/${user.wcaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses({ variant: "primary", size: "md", fullWidth: true })}
            >
              <ExternalLink className="w-4 h-4" aria-hidden />
              View WCA Profile
            </a>
          ) : (
            <Button fullWidth onClick={handleReauth}>
              Re-auth with WCA
            </Button>
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full Name">
            <Input readOnly value={user.name} />
          </Field>
          <Field label={isCdUser ? "CubeDev ID" : "WCA ID"}>
            <Input readOnly value={userIdentifier} className="type-time" />
          </Field>
          <Field label="Country">
            <Input readOnly value={user.countryIso2} />
          </Field>
          {user.email && (
            <Field label="Email">
              <Input readOnly value={user.email} />
            </Field>
          )}
        </div>

        <Alert tone="primary" size="sm">
          {isCdUser
            ? "You currently use a CubeDev ID because your WCA account does not have a WCA competition ID yet. Use Re-auth with WCA after your first official competition to upgrade to your WCA ID."
            : "Profile information is synchronized with your WCA account and cannot be edited here. To update your profile, make changes on the WCA website."}
        </Alert>
      </div>
    </Card>
  );
}
