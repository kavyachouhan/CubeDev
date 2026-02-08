"use client";

import { useEffect, useRef, useState } from "react";
import {
  Timer,
  BarChart3,
  Users,
  Trophy,
  BookOpen,
  Download,
  Clock,
  TrendingUp,
  User,
  Palette,
  GraduationCap,
  Brain,
  Target,
  Calendar,
  BookMarked,
} from "lucide-react";

interface Feature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  preview: React.ReactNode;
}

export default function FeaturesShowcase() {
  const [visibleFeatures, setVisibleFeatures] = useState<Set<number>>(
    new Set(),
  );
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  const features: Feature[] = [
    {
      id: "modern-timer",
      title: "Modern Timer",
      description:
        "Professional speedcubing timer with multiple input modes including manual entry, Stackmat integration, and keyboard timing. Features inspection periods, penalty options, phase-specific drills and precision timing.",
      icon: <Timer className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Timer
                </h4>
                <div className="flex gap-2">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-xs text-[var(--primary)] font-button">
                    Inspection
                  </span>
                </div>
              </div>

              <div className="text-center space-y-4">
                <div className="text-6xl font-bold text-[var(--primary)] font-mono animate-pulse">
                  12.43
                </div>
                <div className="text-sm text-[var(--text-secondary)] font-inter">
                  Hold SPACE to prepare
                </div>
              </div>

              <div className="mt-4 mb-4 flex gap-2 justify-center">
                <button className="px-3 py-1.5 bg-[var(--primary)] text-white text-xs rounded font-button">
                  Normal
                </button>
                <button className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded font-button hover:border-[var(--primary)] transition-all">
                  Manual
                </button>
                <button className="px-3 py-1.5 border border-[var(--border)] text-[var(--text-secondary)] text-xs rounded font-button hover:border-[var(--primary)] transition-all">
                  Stackmat
                </button>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-2 bg-[var(--background)] rounded">
                  <div className="text-sm font-bold text-[var(--success)] font-mono">
                    10.21
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Best
                  </div>
                </div>
                <div className="text-center p-2 bg-[var(--background)] rounded">
                  <div className="text-sm font-bold text-[var(--primary)] font-mono">
                    12.85
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Ao5
                  </div>
                </div>
                <div className="text-center p-2 bg-[var(--background)] rounded">
                  <div className="text-sm font-bold text-[var(--accent)] font-mono">
                    47
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Solves
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Start Session
              </button>
              <button className="px-4 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg transition-all">
                +2
              </button>
              <button className="px-4 py-3 border border-[var(--border)] hover:border-[var(--error)] text-[var(--text-secondary)] hover:text-[var(--error)] rounded-lg transition-all">
                DNF
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "comprehensive-stats",
      title: "Comprehensive Statistics",
      description:
        "Advanced analytics with solve heatmaps, time progression charts, phase breakdowns, personal bests tracking, and detailed performance insights.",
      icon: <BarChart3 className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <h4 className="font-semibold text-[var(--text-primary)] font-button mb-4">
                Performance Analytics
              </h4>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="text-center p-3 bg-[var(--background)] rounded">
                  <div className="text-2xl font-bold text-[var(--primary)] font-mono">
                    12.43
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Session Average
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--background)] rounded">
                  <div className="text-2xl font-bold text-[var(--success)] font-mono">
                    94%
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Consistency
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-[var(--text-primary)] font-button">
                  Phase Breakdown
                </div>
                {[
                  {
                    phase: "Cross",
                    time: "2.1s",
                    width: "w-1/5",
                    color: "bg-[var(--success)]",
                  },
                  {
                    phase: "F2L",
                    time: "7.8s",
                    width: "w-3/4",
                    color: "bg-[var(--primary)]",
                  },
                  {
                    phase: "OLL",
                    time: "1.9s",
                    width: "w-1/6",
                    color: "bg-[var(--warning)]",
                  },
                  {
                    phase: "PLL",
                    time: "1.1s",
                    width: "w-1/8",
                    color: "bg-[var(--accent)]",
                  },
                ].map((item, i) => (
                  <div
                    key={item.phase}
                    className="flex items-center justify-between"
                  >
                    <span className="text-xs text-[var(--text-secondary)] font-inter w-12">
                      {item.phase}
                    </span>
                    <div className="flex-1 mx-2 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${item.color} ${item.width} animate-pulse`}
                        style={{ animationDelay: `${i * 100}ms` }}
                      ></div>
                    </div>
                    <span className="text-xs text-[var(--text-primary)] font-mono w-10 text-right">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
              <TrendingUp className="w-4 h-4 text-[var(--success)]" />
              <span>Improved by 0.8s this week</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "cuber-profiles",
      title: "Cuber Profiles",
      description:
        "Cuber Profiles with WCA integration, competition history, personal records, CubeDev statistics, and community features.",
      icon: <Users className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[var(--primary)]/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] font-button">
                    Kavya Chouhan
                  </h4>
                  <div className="text-sm text-[var(--text-secondary)] font-inter">
                    2022CHOU06 • IN
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-2 bg-[var(--background)] rounded">
                  <div className="text-lg font-bold text-[var(--primary)] font-mono">
                    8.92
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    3x3 Single
                  </div>
                </div>
                <div className="text-center p-2 bg-[var(--background)] rounded">
                  <div className="text-lg font-bold text-[var(--accent)] font-mono">
                    11.24
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    3x3 Average
                  </div>
                </div>
                <div className="text-center p-2 bg-[var(--background)] rounded">
                  <div className="text-lg font-bold text-[var(--warning)] font-mono">
                    47
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Competitions
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-semibold text-[var(--text-primary)] font-button">
                  Recent Activity
                </div>
                <div className="space-y-1">
                  <div className="text-xs text-[var(--text-secondary)] font-inter">
                    • Completed 250 solves this week
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-inter">
                    • New 3x3 PB: 8.92s
                  </div>
                  <div className="text-xs text-[var(--text-secondary)] font-inter">
                    • Participated in 3 challenge rooms
                  </div>
                </div>
              </div>
            </div>

            <button className="w-full px-6 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] text-base rounded-lg font-button transition-all">
              View Full Profile
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "personal-coach",
      title: "Personal Coach",
      description:
        "Your dedicated cubing coach with personalized training plans, progress tracking, and structured practice sessions. Set goals, log your practice journal, and get actionable insights to break through plateaus.",
      icon: <Target className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Your Training Plan
                </h4>
                <span className="text-xs text-[var(--success)] font-button px-2 py-1 bg-[var(--success)]/10 rounded">
                  Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[var(--background)] rounded">
                  <div className="text-2xl font-bold text-[var(--primary)] font-mono">
                    Sub-15
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Current Goal
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--background)] rounded">
                  <div className="text-2xl font-bold text-[var(--success)] font-mono">
                    72%
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Progress
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="text-sm font-semibold text-[var(--text-primary)] font-button flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-[var(--primary)]" />
                  This Week's Focus
                </div>
                {[
                  {
                    day: "Mon",
                    task: "F2L Efficiency",
                    status: "completed",
                  },
                  {
                    day: "Tue",
                    task: "Cross Planning",
                    status: "completed",
                  },
                  {
                    day: "Wed",
                    task: "OLL Recognition",
                    status: "current",
                  },
                  {
                    day: "Thu",
                    task: "Full Solves",
                    status: "upcoming",
                  },
                ].map((item) => (
                  <div
                    key={item.day}
                    className={`flex items-center justify-between p-2 rounded ${
                      item.status === "current"
                        ? "bg-[var(--primary)]/10 border border-[var(--primary)]"
                        : "bg-[var(--background)]"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-[var(--text-muted)] font-inter w-8">
                        {item.day}
                      </span>
                      <span
                        className={`text-sm font-inter ${
                          item.status === "completed"
                            ? "text-[var(--text-muted)] line-through"
                            : item.status === "current"
                              ? "text-[var(--primary)] font-medium"
                              : "text-[var(--text-secondary)]"
                        }`}
                      >
                        {item.task}
                      </span>
                    </div>
                    {item.status === "completed" && (
                      <span className="text-xs text-[var(--success)]">✓</span>
                    )}
                    {item.status === "current" && (
                      <span className="text-xs text-[var(--primary)] font-button">
                        Today
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
                <BookMarked className="w-4 h-4 text-[var(--accent)]" />
                <span>5 journal entries this week</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Start Training
              </button>
              <button className="px-4 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg transition-all">
                Journal
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "algorithm-trainer",
      title: "Algorithm Trainer",
      description:
        "Master OLL, PLL, F2L, and more with our intelligent spaced repetition system. Track your progress, get personalized practice sessions, and never forget an algorithm again.",
      icon: <GraduationCap className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Algorithm Progress
                </h4>
                <span className="text-xs text-[var(--primary)] font-button px-2 py-1 bg-[var(--primary)]/10 rounded">
                  SRS Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center p-3 bg-[var(--background)] rounded">
                  <div className="text-2xl font-bold text-[var(--success)] font-mono">
                    47
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Mastered
                  </div>
                </div>
                <div className="text-center p-3 bg-[var(--background)] rounded">
                  <div className="text-2xl font-bold text-[var(--warning)] font-mono">
                    12
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Due for Review
                  </div>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div className="text-sm font-semibold text-[var(--text-primary)] font-button">
                  Algorithm Sets
                </div>
                {[
                  {
                    name: "PLL",
                    progress: 85,
                    mastered: 18,
                    total: 21,
                    color: "bg-[var(--success)]",
                  },
                  {
                    name: "OLL",
                    progress: 65,
                    mastered: 37,
                    total: 57,
                    color: "bg-[var(--primary)]",
                  },
                  {
                    name: "F2L",
                    progress: 40,
                    mastered: 17,
                    total: 41,
                    color: "bg-[var(--warning)]",
                  },
                ].map((set) => (
                  <div
                    key={set.name}
                    className="p-3 bg-[var(--background)] rounded"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-[var(--text-primary)] font-inter">
                        {set.name}
                      </span>
                      <span className="text-xs text-[var(--text-muted)] font-inter">
                        {set.mastered}/{set.total}
                      </span>
                    </div>
                    <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${set.color} transition-all`}
                        style={{ width: `${set.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
                <Brain className="w-4 h-4 text-[var(--primary)]" />
                <span>Spaced repetition optimizes your learning</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Practice Now
              </button>
              <button className="px-4 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg transition-all">
                Browse
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "competition-simulation",
      title: "Competition Simulation",
      description:
        "Experience the thrill of competition with realistic simulation. Practice under competition conditions with averages, cutoffs, time limits, and proper WCA-style rounds.",
      icon: <Trophy className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Competition Round
                </h4>
                <span className="text-xs text-[var(--success)] font-button px-2 py-1 bg-[var(--success)]/10 rounded">
                  Live
                </span>
              </div>

              <div className="text-center p-4 bg-[var(--background)] rounded-lg mb-4">
                <div className="text-xs text-[var(--text-muted)] font-inter mb-1">
                  Current Solve
                </div>
                <div className="text-4xl font-bold text-[var(--primary)] font-mono">
                  3 / 5
                </div>
                <div className="text-sm text-[var(--text-secondary)] font-inter mt-1">
                  Ao5 Round
                </div>
              </div>

              <div className="grid grid-cols-5 gap-2 mb-4">
                {["12.43", "11.87", "13.21", "--", "--"].map((time, i) => (
                  <div
                    key={i}
                    className={`text-center p-2 rounded ${
                      time === "--"
                        ? "bg-[var(--border)]"
                        : "bg-[var(--background)]"
                    }`}
                  >
                    <div
                      className={`text-xs font-mono ${
                        time === "--"
                          ? "text-[var(--text-muted)]"
                          : i === 1
                            ? "text-[var(--success)] font-bold"
                            : "text-[var(--text-primary)]"
                      }`}
                    >
                      {time}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] font-inter">
                    Current Average
                  </span>
                  <span className="text-[var(--primary)] font-mono font-bold">
                    12.50
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] font-inter">
                    Time Limit
                  </span>
                  <span className="text-[var(--text-primary)] font-mono">
                    1:00.00
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-secondary)] font-inter">
                    Cutoff
                  </span>
                  <span className="text-[var(--success)] font-mono">
                    Passed
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Next Solve
              </button>
              <button className="px-4 py-3 border border-[var(--border)] hover:border-[var(--error)] text-[var(--text-secondary)] hover:text-[var(--error)] rounded-lg transition-all">
                DNF
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "challenge-rooms",
      title: "Challenge Rooms",
      description:
        "Create and join timed challenge rooms with friends, compete on same scrambles, track leaderboards, and enjoy real-time competition.",
      icon: <Trophy className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-4 sm:p-6 md:p-8 shadow-xl w-full max-w-lg mx-auto">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-4 sm:p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Friday Night Challenge
                </h4>
                <span className="text-xs text-[var(--success)] font-button px-2 py-1 bg-[var(--success)]/10 rounded">
                  Live
                </span>
              </div>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 bg-[var(--primary)]/20 rounded-full flex items-center justify-center">
                  <Trophy className="w-4 h-4 text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                    Ao5 Format • 3x3
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    8 participants • Expires in 2h 15m
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="text-sm font-semibold text-[var(--text-primary)] font-button">
                  Leaderboard
                </div>
                {[
                  {
                    rank: 1,
                    name: "speedcuber_pro",
                    time: "9.87",
                    color: "text-[var(--success)]",
                  },
                  {
                    rank: 2,
                    name: "cube_master",
                    time: "10.24",
                    color: "text-[var(--primary)]",
                  },
                  {
                    rank: 3,
                    name: "fast_fingers",
                    time: "11.56",
                    color: "text-[var(--warning)]",
                  },
                ].map((entry) => (
                  <div
                    key={entry.rank}
                    className="flex items-center justify-between p-2 bg-[var(--background)] rounded"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-sm font-bold ${entry.color} font-mono w-4`}
                      >
                        #{entry.rank}
                      </span>
                      <span className="text-sm text-[var(--text-primary)] font-inter">
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-[var(--text-primary)] font-mono">
                      {entry.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Join Room
              </button>
              <button className="px-4 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] rounded-lg transition-all">
                Create
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Track which features are visible for animation
  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    featureRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setVisibleFeatures((prev) => new Set([...prev, index]));
            }
          },
          { threshold: 0.3 },
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  return (
    <section className="py-16 lg:py-24 bg-[var(--background)]">
      <div className="container-responsive">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            Everything You <span className="text-[var(--primary)]">Need</span>{" "}
            To Improve
          </h2>
          <p className="text-lg md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-inter">
            From precision timing to competitive challenges, everything you need
            to improve your cubing skills
          </p>
        </div>

        {/* Features */}
        <div className="space-y-16 overflow-hidden">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => {
                featureRefs.current[index] = el;
              }}
              className={`grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center transition-all duration-700 overflow-hidden ${
                visibleFeatures.has(index)
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-12"
              }`}
            >
              {/* Alternate layout */}
              {index % 2 === 0 ? (
                <>
                  {/* Content */}
                  <div className="space-y-6">
                    <div className="mb-4">
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] font-statement">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-xl text-[var(--text-secondary)] font-inter leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                  {/* Preview */}
                  <div className="flex justify-center lg:justify-end">
                    <div
                      className={`transition-all duration-700 delay-200 ${
                        visibleFeatures.has(index)
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-0 transform translate-x-8"
                      }`}
                    >
                      {feature.preview}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* Preview */}
                  <div className="flex justify-center lg:justify-start order-2 lg:order-1">
                    <div
                      className={`transition-all duration-700 delay-200 ${
                        visibleFeatures.has(index)
                          ? "opacity-100 transform translate-x-0"
                          : "opacity-0 transform -translate-x-8"
                      }`}
                    >
                      {feature.preview}
                    </div>
                  </div>
                  {/* Content */}
                  <div className="space-y-6 order-1 lg:order-2">
                    <div className="mb-4">
                      <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] font-statement">
                        {feature.title}
                      </h3>
                    </div>
                    <p className="text-xl text-[var(--text-secondary)] font-inter leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}