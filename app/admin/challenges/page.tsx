"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminChallenges from "@/components/admin/AdminChallenges";

export default function AdminChallengesPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="challenges">
        <AdminChallenges />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
