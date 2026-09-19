import type { Metadata } from "next";
import { Anton, Inter, JetBrains_Mono, Oswald } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import { UserProvider } from "@/components/UserProvider";
import { ThemeProviderWrapper } from "@/components/ThemeProviderWrapper";
import { FeedbackProvider } from "@/components/feedback";
import { ToastProvider } from "@/components/ui/Toast";
import { DEFAULT_SURVEY_CONFIGS } from "@/components/feedback/surveyConfig";
import { Analytics } from "@vercel/analytics/next";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const anton = Anton({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-anton",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
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
                  var root = document.documentElement;
                  var stored = localStorage.getItem('cubedev-theme-preferences');
                  var prefs = stored ? JSON.parse(stored) : {};
                  var themeMode = prefs.themeMode || 'dark';

                  var effectiveTheme = themeMode;
                  if (themeMode === 'auto') {
                    effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
                  }

                  root.setAttribute('data-theme', effectiveTheme);
                  root.setAttribute('data-color-scheme', prefs.colorScheme || 'blue');
                  root.setAttribute('data-timer-size', prefs.timerFontSize || 'lg');
                  root.setAttribute('data-timer-font', prefs.timerFontFamily || 'mono');
                  if (prefs.reduceMotion) root.setAttribute('data-reduce-motion', 'true');
                  if (prefs.disableGlow) root.setAttribute('data-disable-glow', 'true');
                  if (prefs.highContrast) root.setAttribute('data-high-contrast', 'true');
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
        className={`${inter.variable} ${anton.variable} ${oswald.variable} ${jetbrainsMono.variable} antialiased min-h-screen flex flex-col overflow-x-hidden`}
      >
        <ConvexClientProvider>
          <UserProvider>
            <ThemeProviderWrapper>
              <ToastProvider>
                <FeedbackProvider defaultConfig={DEFAULT_SURVEY_CONFIGS.general}>
                  {children}
                </FeedbackProvider>
              </ToastProvider>
              <Analytics />
            </ThemeProviderWrapper>
          </UserProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}