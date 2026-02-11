"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminCoach from "@/components/admin/AdminCoach";

export default function AdminCoachPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="coach">
        <AdminCoach />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
