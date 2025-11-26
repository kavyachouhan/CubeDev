import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Chat Session | Cubie AI | CubeDev",
  description:
    "Private chat session with Cubie, your speedcubing assistant.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
