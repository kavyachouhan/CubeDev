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
  ArrowRight,
  User,
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
    new Set()
  );
  const featureRefs = useRef<(HTMLDivElement | null)[]>([]);

  const features: Feature[] = [
    {
      id: "modern-timer",
      title: "Modern Timer",
      description:
        "Professional speedcubing timer with inspection periods, penalty options, phase detection, and precision timing down to centiseconds.",
      icon: <Timer className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
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

              <div className="mt-4 grid grid-cols-3 gap-3">
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
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
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
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-16 h-16 bg-[var(--primary)]/20 rounded-full flex items-center justify-center">
                  <User className="w-8 h-8 text-[var(--primary)]" />
                </div>
                <div>
                  <h4 className="font-semibold text-[var(--text-primary)] font-button">
                    Aman Sharma
                  </h4>
                  <div className="text-sm text-[var(--text-secondary)] font-inter">
                    2025SHAR01 • IN
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
      id: "challenge-rooms",
      title: "Challenge Rooms",
      description:
        "Create and join timed challenge rooms with friends, compete on same scrambles, track leaderboards, and enjoy real-time competition.",
      icon: <Trophy className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
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
    {
      id: "practice-mode",
      title: "Practice Mode",
      description:
        "Structured training sessions with phase-specific drills and BPM (Blocks Per Minute) mode to improve your solving efficiency.",
      icon: <BookOpen className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  F2L Phase Drill
                </h4>
                <span className="text-xs text-[var(--accent)] font-button">
                  BPM Mode
                </span>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                      Cross Phase
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-inter">
                      Focus on efficiency
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[var(--success)] font-mono">
                    2.1s avg
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded border-2 border-[var(--primary)]">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                      F2L Pairs
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-inter">
                      Current drill
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[var(--primary)] font-mono">
                    4.2 BPM
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 bg-[var(--background)] rounded opacity-50">
                  <div>
                    <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                      Last Layer
                    </div>
                    <div className="text-xs text-[var(--text-muted)] font-inter">
                      Coming next
                    </div>
                  </div>
                  <div className="text-sm font-bold text-[var(--text-muted)] font-mono">
                    --
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    Session Progress
                  </span>
                  <span className="text-sm text-[var(--primary)] font-mono">
                    12/25 pairs
                  </span>
                </div>

                <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="w-1/2 h-full bg-[var(--primary)] animate-pulse"></div>
                </div>

                <div className="text-xs text-[var(--text-muted)] font-inter text-center">
                  Target: 5.0 BPM • Current: 4.2 BPM
                </div>
              </div>
            </div>

            <button className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
              Continue Drill
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "import-export",
      title: "Import & Export Data",
      description:
        "Seamless data portability with support for major timer formats, backup functionality, and easy migration from other timers.",
      icon: <Download className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <h4 className="font-semibold text-[var(--text-primary)] font-button mb-4">
                Data Management
              </h4>

              <div className="space-y-3 mb-4">
                {[
                  {
                    name: "csTimer",
                    status: "Ready to import",
                    color: "text-[var(--success)]",
                  },
                  {
                    name: "Twisty Timer",
                    status: "Supported format",
                    color: "text-[var(--primary)]",
                  },
                  {
                    name: "CubeDesk",
                    status: "Compatible",
                    color: "text-[var(--accent)]",
                  },
                ].map((service, i) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-3 bg-[var(--background)] rounded transition-all duration-300"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <div>
                        <div className="text-sm font-medium text-[var(--text-primary)] font-inter">
                          {service.name}
                        </div>
                        <div className="text-xs text-[var(--text-muted)] font-inter">
                          {service.status}
                        </div>
                      </div>
                    </div>
                    <div className={`text-xs ${service.color} font-inter`}>
                      ✓
                    </div>
                  </div>
                ))}
              </div>

              <div className="bg-[var(--background)] p-3 rounded border border-[var(--border)]">
                <div className="text-sm font-medium text-[var(--text-primary)] font-inter mb-2">
                  Export includes:
                </div>
                <div className="text-xs text-[var(--text-secondary)] font-inter space-y-1">
                  <div>• All solve times and scrambles</div>
                  <div>• Session information</div>
                  <div>• Notes and tags</div>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] text-[var(--text-primary)] text-base rounded-lg font-button transition-all">
                Import Data
              </button>
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Export Data
              </button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  // Intersection Observer for scroll animations
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
          { threshold: 0.3 }
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
        <div className="space-y-16">
          {features.map((feature, index) => (
            <div
              key={feature.id}
              ref={(el) => {
                featureRefs.current[index] = el;
              }}
              className={`grid lg:grid-cols-2 gap-6 sm:gap-8 lg:gap-12 items-center transition-all duration-700 ${
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
