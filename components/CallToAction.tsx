"use client";

import { useState, useEffect, useRef } from "react";
import { ArrowRight } from "lucide-react";
import { useUser } from "@/components/UserProvider";
import { getWCAOAuthUrl } from "@/lib/wca-config";

export default function CallToAction() {
  const { user } = useUser();
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);

  const handleWCASignIn = () => {
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
          }
        });
      },
      { threshold: 0.3 }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={sectionRef}
      className="py-24 bg-[var(--surface)] relative overflow-hidden border-t border-[var(--border)]"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute top-0 left-0 w-full h-full">
          <div className="w-4 h-4 bg-[var(--primary)]/20 rounded-full absolute top-20 left-20"></div>
          <div className="w-2 h-2 bg-[var(--primary)]/10 rounded-full absolute top-40 right-32"></div>
          <div className="w-3 h-3 bg-[var(--primary)]/15 rounded-full absolute bottom-32 left-1/3"></div>
          <div className="w-2 h-2 bg-[var(--primary)]/10 rounded-full absolute bottom-20 right-20"></div>
        </div>
      </div>

      <div className="container-responsive relative z-10">
        <div
          className={`text-center transform transition-all duration-1000 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-8 opacity-0"
          }`}
        >
          {/* Main Content */}
          <div className="max-w-4xl mx-auto mb-12">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-[var(--text-primary)] mb-6 font-statement">
              Ready to <span className="text-[var(--primary)]">master</span>{" "}
              your next solve?
            </h2>
            <p className="text-xl md:text-2xl text-[var(--text-secondary)] mb-8 font-inter leading-relaxed">
              Join thousands of cubers who've already improved their times with
              CubeDev's professional training platform. Your personal best is
              waiting.
            </p>
          </div>

          {/* CTA Button */}
          <div
            className={`flex justify-center transform transition-all duration-1000 delay-300 ${
              isVisible
                ? "translate-y-0 opacity-100"
                : "translate-y-8 opacity-0"
            }`}
          >
            {user ? (
              <a
                href="/cube-lab/timer"
                className="group px-10 py-5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition-all duration-300 font-button text-lg flex items-center gap-3 hover:gap-4 shadow-lg hover:shadow-xl hover:scale-105"
              >
                Start Training Now
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </a>
            ) : (
              <button
                onClick={handleWCASignIn}
                className="px-10 py-5 bg-[var(--primary)] text-white font-bold rounded-xl hover:bg-[var(--primary-hover)] transition-all duration-300 font-button text-lg shadow-lg hover:shadow-xl hover:scale-105 flex items-center gap-3"
              >
                <img src="/wca_logo.png" alt="WCA" className="w-5 h-5" />
                Sign in with WCA
              </button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}