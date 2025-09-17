"use client";

import { useEffect, useRef, useState } from "react";
import {
  Target,
  Box,
  Calendar,
  BarChart3,
  Link2,
  Play,
  TrendingUp,
  ArrowRight,
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
      id: "personalisation",
      title: "Personalisation",
      description:
        "Training that adapts to your solves. Hit your next milestone with smart drills and plans.",
      icon: <Target className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Your Training Plan
                </h4>
                <span className="text-xs text-[var(--primary)] font-button">
                  Week 3
                </span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 bg-[var(--background)] rounded">
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    F2L Efficiency
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="w-3/4 h-full bg-[var(--primary)] animate-pulse"></div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      75%
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between p-2 bg-[var(--background)] rounded">
                  <span className="text-sm text-[var(--text-secondary)] font-inter">
                    OLL Recognition
                  </span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-[var(--border)] rounded-full overflow-hidden">
                      <div className="w-1/2 h-full bg-[var(--warning)]"></div>
                    </div>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      50%
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <button className="w-full px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
              Start Today's Session
            </button>
          </div>
        </div>
      ),
    },
    {
      id: "virtual-cube",
      title: "Virtual Cube Lab",
      description:
        "See every move, learn every grip. Compare alg variants with step-through animations and finger-trick overlays.",
      icon: <Box className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  T-Perm Variants
                </h4>
                <div className="flex gap-1">
                  <button className="p-1 text-[var(--text-secondary)] hover:text-[var(--primary)] transition-colors">
                    <Play className="w-4 h-4" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded border-2 transition-all duration-300 ${
                      i === 1 || i === 3 || i === 7 || i === 9
                        ? "bg-[var(--primary)] border-[var(--primary)]"
                        : i === 5
                        ? "bg-[var(--warning)] border-[var(--warning)]"
                        : "bg-[var(--surface)] border-[var(--border)]"
                    }`}
                    style={{ animationDelay: `${i * 50}ms` }}
                  />
                ))}
              </div>
              <div className="text-xs text-[var(--text-muted)] font-mono">
                R U R' F' R U R' U' R' F R2 U' R'
              </div>
            </div>
            <div className="flex gap-2">
              <button className="flex-1 px-4 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] text-base rounded-lg font-button transition-all">
                Compare
              </button>
              <button className="flex-1 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white text-base rounded-lg font-button transition-all">
                Practice
              </button>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "case-of-day",
      title: "Case of the Day",
      description:
        "One case, ten perfect reps. Master high-impact cases with handedness-aware algs and TPS tips.",
      icon: <Calendar className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-[var(--text-primary)] font-button">
                  Today's Focus
                </h4>
                <span className="text-xs text-[var(--accent)] font-button">
                  OLL #21
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1 mb-3">
                {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => (
                  <div
                    key={i}
                    className={`aspect-square rounded border transition-all duration-500 ${
                      i === 2 || i === 4 || i === 6 || i === 8
                        ? "bg-[var(--warning)] border-[var(--warning)]"
                        : "bg-[var(--surface)] border-[var(--border)]"
                    }`}
                    style={{ animationDelay: `${i * 100}ms` }}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <div className="text-xs text-[var(--text-muted)] font-mono">
                  R U R' U R U' R' U R U2 R'
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-[var(--text-secondary)] font-inter">
                    Progress
                  </span>
                  <span className="text-xs text-[var(--primary)] font-mono">
                    7/10 reps
                  </span>
                </div>
                <div className="w-full h-2 bg-[var(--border)] rounded-full overflow-hidden">
                  <div className="w-3/4 h-full bg-[var(--primary)] animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "analytics",
      title: "Analytics",
      description:
        "Clarity in every split. Phase breakdowns, consistency score, and honest trends that actually help you improve.",
      icon: <BarChart3 className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <h4 className="font-semibold text-[var(--text-primary)] font-button mb-3">
                Session Analysis
              </h4>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--primary)] font-mono">
                    12.43
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Average
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-[var(--accent)] font-mono">
                    94%
                  </div>
                  <div className="text-xs text-[var(--text-muted)] font-inter">
                    Consistency
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {[
                  { phase: "Cross", time: "2.1s", color: "success" },
                  { phase: "F2L", time: "7.8s", color: "primary" },
                  { phase: "OLL", time: "1.9s", color: "warning" },
                  { phase: "PLL", time: "1.1s", color: "accent" },
                ].map((item, i) => (
                  <div
                    key={item.phase}
                    className="flex justify-between text-xs"
                    style={{ animationDelay: `${i * 100}ms` }}
                  >
                    <span className="text-[var(--text-secondary)] font-inter">
                      {item.phase}
                    </span>
                    <span className="text-[var(--text-primary)] font-mono">
                      {item.time}
                    </span>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] font-inter">
              <TrendingUp className="w-4 h-4 text-[var(--success)]" />
              <span>Improved by 0.3s this week</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      id: "integrations",
      title: "Integrations",
      description:
        "Bring your data. Take it anywhere. Import from popular timers, export your sessions, or build on our API.",
      icon: <Link2 className="w-6 h-6" />,
      preview: (
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-xl p-8 shadow-xl max-w-lg w-full">
          <div className="space-y-6">
            <div className="bg-[var(--surface-elevated)] p-6 rounded-lg border border-[var(--border)]">
              <h4 className="font-semibold text-[var(--text-primary)] font-button mb-3">
                Connected Services
              </h4>
              <div className="space-y-2">
                {[
                  { name: "csTimer", status: "connected", color: "success" },
                  { name: "Twisty Timer", status: "syncing", color: "primary" },
                  { name: "CubeDesk", status: "available", color: "muted" },
                ].map((service, i) => (
                  <div
                    key={service.name}
                    className="flex items-center justify-between p-2 bg-[var(--background)] rounded transition-all duration-300"
                    style={{ animationDelay: `${i * 150}ms` }}
                  >
                    <span className="text-sm text-[var(--text-secondary)] font-inter">
                      {service.name}
                    </span>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          service.color === "success"
                            ? "bg-[var(--success)]"
                            : service.color === "primary"
                            ? "bg-[var(--primary)] animate-pulse"
                            : "bg-[var(--border)]"
                        }`}
                      ></div>
                      <span className="text-xs text-[var(--text-muted)] font-inter capitalize">
                        {service.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <button className="w-full px-6 py-3 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-secondary)] hover:text-[var(--primary)] text-base rounded-lg font-button transition-all">
              Add Integration
            </button>
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
            Everything You <span className="text-[var(--primary)]">Need</span>
          </h2>
          <p className="text-lg md:text-2xl text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
            Professional tools designed for serious cubers who want to improve
            faster
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
              className={`grid lg:grid-cols-2 gap-8 lg:gap-12 items-center transition-all duration-700 ${
                visibleFeatures.has(index)
                  ? "opacity-100 transform translate-y-0"
                  : "opacity-0 transform translate-y-12"
              }`}
            >
              {/* Alternate layout: even indices have content first, odd indices have preview first */}
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
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button group text-lg">
                      Learn More
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
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
                    <button className="inline-flex items-center gap-2 px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button group text-lg">
                      Learn More
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </button>
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
