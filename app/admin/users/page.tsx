"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminUsers from "@/components/admin/AdminUsers";

export default function AdminUsersPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="users">
        <AdminUsers />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
