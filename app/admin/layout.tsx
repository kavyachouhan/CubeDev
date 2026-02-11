import type { Metadata } from "next";

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
  return children;
}
