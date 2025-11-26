import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cubie AI | Cube Lab | CubeDev",
  description:
    "Chat with Cubie, your personal speedcubing assistant. Get personalized training advice, algorithm help, and insights about cubing.",
  robots: {
    index: false,
    follow: true,
    nocache: false,
    googleBot: {
      index: false,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default function CubieLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
