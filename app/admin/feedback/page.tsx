"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminFeedback from "@/components/admin/AdminFeedback";

export default function AdminFeedbackPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="feedback">
        <AdminFeedback />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
