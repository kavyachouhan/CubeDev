import type { Metadata } from "next";
import { AdminProvider } from "@/components/admin/AdminContext";

export const metadata: Metadata = {
  title: "Admin - CubeDev",
  description: "CubeDev Admin Dashboard",
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminRootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AdminProvider>{children}</AdminProvider>;
}