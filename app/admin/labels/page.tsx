"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminFeatureLabels from "@/components/admin/AdminFeatureLabels";

export default function AdminLabelsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="labels">
        <AdminFeatureLabels />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}