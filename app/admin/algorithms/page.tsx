"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminAlgorithms from "@/components/admin/AdminAlgorithms";

export default function AdminAlgorithmsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="algorithms">
        <AdminAlgorithms />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
