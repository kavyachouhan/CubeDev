import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserProvider } from "@/components/UserProvider";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";
import { FeedbackProvider } from "@/components/feedback";
import { DEFAULT_SURVEY_CONFIGS } from "@/components/feedback/surveyConfig";
import { Analytics } from "@vercel/analytics/next";

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
    "Professional timing, advanced analytics, personalized coaching, and training tools designed for cubers who want to push their limits. Set goals, track progress, and master speedcubing with CubeDev.",
  keywords: [
    "speedcubing",
    "rubiks cube",
    "timer",
    "cubing",
    "speedsolving",
    "WCA",
    "puzzle",
    "speedcubing coach",
    "cubing goals",
    "training plans",
    "speedcubing training",
    "cubing analytics",
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
      "Master your speedcubing with professional timing, analytics tools, and personalized coaching. Set goals and track your progress.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Prevent theme flash by applying theme before React hydration */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  // Apply theme preferences
                  const stored = localStorage.getItem('cubedev-theme-preferences');
                  let themeMode = 'dark';
                  let colorScheme = 'blue';
                  
                  if (stored) {
                    const prefs = JSON.parse(stored);
                    themeMode = prefs.themeMode || 'dark';
                    colorScheme = prefs.colorScheme || 'blue';
                  }
                  
                  let effectiveTheme = themeMode;
                  if (themeMode === 'auto') {
                    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }
                  
                  document.documentElement.setAttribute('data-theme', effectiveTheme);
                  document.documentElement.setAttribute('data-color-scheme', colorScheme);
                  
                  // Apply sidebar state
                  const sidebarState = localStorage.getItem('cubelab-sidebar-collapsed');
                  if (sidebarState === 'true') {
                    document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
                  }
                } catch (e) {
                  document.documentElement.setAttribute('data-theme', 'dark');
                  document.documentElement.setAttribute('data-color-scheme', 'blue');
                }
              })();
            `,
          }}
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col overflow-x-hidden`}
      >
        <ConvexClientProvider>
          <UserProvider>
            <ThemeProviderWrapper>
              <FeedbackProvider defaultConfig={DEFAULT_SURVEY_CONFIGS.general}>
                {children}
              </FeedbackProvider>
              <Analytics />
            </ThemeProviderWrapper>
          </UserProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}