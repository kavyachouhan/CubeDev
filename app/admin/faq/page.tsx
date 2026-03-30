"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminFAQ from "@/components/admin/AdminFAQ";

export default function AdminFAQPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="faq">
        <AdminFAQ />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}