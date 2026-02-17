"use client";

import Link from "next/link";
import {
  BarChart3,
  TrendingUp,
  Trophy,
  Calendar,
  Timer,
  Target,
} from "lucide-react";

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  iconBgClass: string;
  iconColorClass: string;
}

function FeatureCard({
  icon,
  title,
  description,
  iconBgClass,
  iconColorClass,
}: FeatureCardProps) {
  return (
    <div className="p-4 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border)]">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg ${iconBgClass} shrink-0`}>
          <div className={iconColorClass}>{icon}</div>
        </div>
        <div className="min-w-0">
          <h4 className="font-medium text-[var(--text-primary)] text-sm">
            {title}
          </h4>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            {description}
          </p>
        </div>
      </div>
    </div>
  );
}

export default function StatsEmptyState() {
  const features = [
    {
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Progress Charts",
      description: "Track your improvement over time with visual charts",
      iconBgClass: "bg-[var(--primary)]/10",
      iconColorClass: "text-[var(--primary)]",
    },
    {
      icon: <Trophy className="w-4 h-4" />,
      title: "Personal Bests",
      description: "View your best singles, Ao5, Ao12, and more",
      iconBgClass: "bg-[var(--warning)]/10",
      iconColorClass: "text-[var(--warning)]",
    },
    {
      icon: <BarChart3 className="w-4 h-4" />,
      title: "Time Distribution",
      description: "Analyze your solve time patterns and consistency",
      iconBgClass: "bg-[var(--accent)]/10",
      iconColorClass: "text-[var(--accent)]",
    },
    {
      icon: <Calendar className="w-4 h-4" />,
      title: "Solve Heatmap",
      description: "See your solving activity throughout the year",
      iconBgClass: "bg-[var(--success)]/10",
      iconColorClass: "text-[var(--success)]",
    },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto">
      {/* Main Card */}
      <div className="timer-card">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex p-3 rounded-xl bg-[var(--surface-elevated)] mb-4">
            <BarChart3 className="w-8 h-8 text-[var(--text-muted)]" />
          </div>
          <h2 className="text-xl font-semibold text-[var(--text-primary)] font-statement mb-2">
            No Statistics Yet
          </h2>
          <p className="text-[var(--text-secondary)] text-sm max-w-md mx-auto">
            Complete some solves in the timer to start tracking your progress
            and personal bests.
          </p>
        </div>

        {/* Feature Preview Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          {features.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </div>

        {/* CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4 border-t border-[var(--border)]">
          <Link
            href="/cube-lab/timer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium text-sm hover:opacity-90 transition-opacity"
          >
            <Timer className="w-4 h-4" />
            Start Solving
          </Link>
        </div>
      </div>
    </div>
  );
}