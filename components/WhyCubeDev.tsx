"use client";

import { useState, useEffect, useRef } from "react";
import { Timer, BarChart3, Target, Zap, TrendingUp, Users } from "lucide-react";

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
      title: "Professional Timer",
      description:
        "Industry-standard timing with inspection periods, penalties, and precision down to centiseconds.",
    },
    {
      icon: BarChart3,
      title: "Advanced Analytics",
      description:
        "Track your progress with detailed statistics, averages, and performance trends over time.",
    },
    {
      icon: Target,
      title: "Training Tools",
      description:
        "Specialized practice modes, algorithm trainers, and structured learning paths for improvement.",
    },
    {
      icon: Zap,
      title: "Lightning Fast",
      description:
        "Optimized for speed with instant response times and seamless performance across all devices.",
    },
    {
      icon: TrendingUp,
      title: "Progress Tracking",
      description:
        "Visualize your improvement journey with comprehensive charts and milestone achievements.",
    },
    {
      icon: Users,
      title: "Community Features",
      description:
        "Connect with fellow cubers, share sessions, and participate in online competitions.",
    },
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-[var(--surface)]">
      <div className="container-responsive">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 font-statement">
            Why <span className="text-[var(--primary)]">CubeDev</span>?
          </h2>
          <p className="text-xl md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-inter">
            Built by speedcubers, for speedcubers. Experience the most advanced
            timing and training platform designed to accelerate your solving
            journey.
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

        {/* Stats Section */}
        {/* <div className="mt-20 grid grid-cols-2 lg:grid-cols-4 gap-8">
          {[
            { number: "10K+", label: "Active Cubers" },
            { number: "1M+", label: "Solves Recorded" },
            { number: "50+", label: "Training Modes" },
            { number: "99.9%", label: "Uptime" },
          ].map((stat, index) => (
            <div key={index} className="text-center group">
              <div className="text-3xl md:text-4xl font-bold text-[var(--primary)] mb-2 font-statement">
                {stat.number}
              </div>
              <div className="text-[var(--text-secondary)] font-inter">
                {stat.label}
              </div>
            </div>
          ))}
        </div> */}
      </div>
    </section>
  );
}
