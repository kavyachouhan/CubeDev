import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy - CubeDev",
  description:
    "Learn about CubeDev's privacy policy, what data we collect, how we use it, and your rights as a user.",
  keywords: ["privacy", "policy", "data", "cubing", "speedcubing"],
};

export default function PrivacyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}