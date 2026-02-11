"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="dashboard">
        <AdminDashboard />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
