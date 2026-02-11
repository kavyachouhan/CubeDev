"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminNotifications from "@/components/admin/AdminNotifications";

export default function AdminNotificationsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="notifications">
        <AdminNotifications />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
