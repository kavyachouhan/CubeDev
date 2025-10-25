"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, BarChart3, Users, Trophy, Download, Zap } from "lucide-react";

export default function WhyCubeDev() {
  const [visibleItems, setVisibleItems] = useState<number[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            // Stagger the animation of items
            setTimeout(() => setVisibleItems([0]), 100);
            setTimeout(() => setVisibleItems([0, 1]), 300);
            setTimeout(() => setVisibleItems([0, 1, 2]), 500);
            setTimeout(() => setVisibleItems([0, 1, 2, 3]), 700);
            setTimeout(() => setVisibleItems([0, 1, 2, 3, 4]), 900);
            setTimeout(() => setVisibleItems([0, 1, 2, 3, 4, 5]), 1100);
          }
        });
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const features = [
    {
      icon: Timer,
      title: "Modern Timer",
      description:
        "Professional speedcubing timer with inspection periods, penalty options, and precision timing down to centiseconds.",
    },
    {
      icon: BarChart3,
      title: "Comprehensive Analytics",
      description:
        "Advanced statistics with solve heatmaps, time progression charts, phase breakdowns, and detailed performance insights.",
    },
    {
      icon: Users,
      title: "Cuber Profiles",
      description:
        "Complete cuber directory with WCA integration, competition history, and community features to connect with fellow cubers.",
    },
    {
      icon: Trophy,
      title: "Challenge Rooms",
      description:
        "Create and join timed challenge rooms with friends, compete on same scrambles, and track real-time leaderboards.",
    },
    {
      icon: Download,
      title: "Data Portability",
      description:
        "Import from popular timers, export your data for backup, and maintain full control over your solving history.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Optimized for speed with instant response times and seamless performance across all devices and platforms.",
    },
  ];

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-[var(--surface)] overflow-hidden"
    >
      <div className="container-responsive">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 font-statement">
            Why <span className="text-[var(--primary)]">CubeDev</span>?
          </h2>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-inter">
            A cutting-edge platform designed by cubers, for cubers. Whether
            you're a beginner or a seasoned pro, CubeDev has everything you need
            to take your speedcubing to the next level.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            const isVisible = visibleItems.includes(index);

            return (
              <div
                key={index}
                className={`group p-8 bg-[var(--background)] border border-[var(--border)] rounded-xl hover:border-[var(--primary)] transition-all duration-500 hover:shadow-lg hover:shadow-[var(--primary)]/10 transform ${
                  isVisible
                    ? "translate-y-0 opacity-100"
                    : "translate-y-8 opacity-0"
                }`}
                style={{
                  transitionDelay: isVisible ? `${index * 100}ms` : "0ms",
                }}
              >
                <div className="flex items-start space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors duration-300">
                      <Icon className="w-6 h-6 text-[var(--primary)]" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3 font-statement">
                      {feature.title}
                    </h3>
                    <p className="text-[var(--text-secondary)] leading-relaxed font-inter">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}