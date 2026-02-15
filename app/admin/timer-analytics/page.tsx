"use client";

import AdminProtectedRoute from "@/components/admin/AdminProtectedRoute";
import AdminLayout from "@/components/admin/AdminLayout";
import AdminTimerStats from "@/components/admin/AdminTimerStats";

export default function AdminTimerAnalyticsPage() {
  return (
    <AdminProtectedRoute>
      <AdminLayout activeSection="timer-analytics">
        <AdminTimerStats />
      </AdminLayout>
    </AdminProtectedRoute>
  );
}