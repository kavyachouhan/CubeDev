import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserProvider } from "@/components/UserProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CubeDev - Professional Speedcubing Tools",
  description:
    "Professional timing, advanced analytics, and training tools designed for cubers who want to push their limits. Master your speedcubing with CubeDev.",
  keywords: [
    "speedcubing",
    "rubiks cube",
    "timer",
    "cubing",
    "speedsolving",
    "WCA",
    "puzzle",
  ],
  authors: [{ name: "CubeDev Team" }],
  creator: "CubeDev",
  publisher: "CubeDev",
  robots: "index, follow",
  openGraph: {
    title: "CubeDev - Professional Speedcubing Tools",
    description:
      "Master your speedcubing with professional timing and analytics tools",
    url: "https://cubedev.xyz",
    siteName: "CubeDev",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "CubeDev - Professional Speedcubing Tools",
    description:
      "Master your speedcubing with professional timing and analytics tools",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <ConvexClientProvider>
          <UserProvider>{children}</UserProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}