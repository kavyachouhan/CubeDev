import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Simulation in Progress | Competition Simulator | CubeDev",
  description:
    "Your competition simulation is in progress. Complete your events and view your results.",
  robots: {
    index: false,
    follow: false,
    nocache: true,
    googleBot: {
      index: false,
      follow: false,
      noimageindex: true,
    },
  },
};

export default function SimulationRunnerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}