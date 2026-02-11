"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminContact from "@/components/admin/AdminContact";

export default function AdminContactPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="contact">
        <AdminContact />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}
