"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import {
  ProfileSection,
  PrivacySection,
  DataManagementSection,
  ThemeSection,
  NotificationSettings,
  AccountDeletionSection,
  KeyboardShortcutsSettings,
} from "@/components/settings";

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="settings">
        <div className="container-responsive py-4 md:py-8">
          {/* Settings Sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
            {/* Left Column */}
            <div className="space-y-4 md:space-y-6">
              <ProfileSection />
              <PrivacySection />
              <NotificationSettings />
              <KeyboardShortcutsSettings />
            </div>

            {/* Right Column */}
            <div className="space-y-4 md:space-y-6">
              <ThemeSection />
              <DataManagementSection />
              <AccountDeletionSection />
            </div>
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}
