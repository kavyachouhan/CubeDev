"use client";

import { Sparkles, Zap, TrendingUp, MessageSquare, Brain } from "lucide-react";
import Link from "next/link";

export default function CubieComingSoon() {
  return (
    <section className="py-16 lg:py-24 bg-[var(--surface)] overflow-hidden">
      <div className="container-responsive">
        <div className="max-w-5xl mx-auto">
          {/* Main Announcement Card */}
          <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-2xl p-6 sm:p-8 md:p-12 shadow-xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full mb-6">
                <Sparkles className="w-4 h-4 text-[var(--primary)]" />
                <span className="text-sm font-semibold text-[var(--primary)] font-button">
                  Coming Soon
                </span>
              </div>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-4 font-statement">
                Meet <span className="text-[var(--primary)]">Cubie AI</span>
              </h2>
              <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
                Your personal AI cubing assistant, powered by advanced language
                models to help you improve faster than ever before.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <div className="w-12 h-12 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center mb-4">
                  <TrendingUp className="w-6 h-6 text-[var(--primary)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-button">
                  Solve Analysis
                </h3>
                <p className="text-[var(--text-secondary)] font-inter">
                  Get instant insights into your solving patterns, identify
                  weaknesses, and receive personalized improvement strategies.
                </p>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <div className="w-12 h-12 bg-[var(--accent)]/10 rounded-lg flex items-center justify-center mb-4">
                  <MessageSquare className="w-6 h-6 text-[var(--accent)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-button">
                  WCA Intelligence
                </h3>
                <p className="text-[var(--text-secondary)] font-inter">
                  Ask questions about WCA regulations, competition data,
                  records, and get instant, accurate answers from the official
                  database.
                </p>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <div className="w-12 h-12 bg-[var(--success)]/10 rounded-lg flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-[var(--success)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-button">
                  Training Plans
                </h3>
                <p className="text-[var(--text-secondary)] font-inter">
                  Generate custom practice routines based on your skill level,
                  goals, and available time to maximize your improvement.
                </p>
              </div>

              <div className="bg-[var(--background)] border border-[var(--border)] rounded-xl p-6">
                <div className="w-12 h-12 bg-[var(--warning)]/10 rounded-lg flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-[var(--warning)]" />
                </div>
                <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-button">
                  Smart Recommendations
                </h3>
                <p className="text-[var(--text-secondary)] font-inter">
                  Discover algorithms, techniques, and solving methods tailored
                  to your current skill level and learning style.
                </p>
              </div>
            </div>

            {/* CTA Section */}
            <div className="text-center pt-6 border-t border-[var(--border)]">
              <p className="text-[var(--text-secondary)] mb-4 font-inter">
                Be among the first to experience the future of speedcubing
                training
              </p>
              <Link
                href="/cube-lab/cubie"
                className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg font-button transition-all"
              >
                Learn More About Cubie
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}