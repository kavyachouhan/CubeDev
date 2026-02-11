"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminCompetitions from "@/components/admin/AdminCompetitions";

export default function AdminCompetitionsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="competitions">
        <AdminCompetitions />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
