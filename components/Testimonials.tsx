"use client";

import { useEffect, useRef, useState } from "react";
import { Quote, ExternalLink } from "lucide-react";
import Link from "next/link";

interface Testimonial {
  id: string;
  name: string;
  wcaId: string;
  feedback: string;
  highlight?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Aayush Parekh",
    wcaId: "2023PARE02",
    feedback:
      "The competition simulation is incredible with all the authentic sounds and distractions for realistic practice. The interface is clean and intuitive, with great attention to detail. Features like the algorithm trainer and comprehensive statistics make it a complete package for serious cubers.",
    highlight: "Competition Simulation",
  },
  {
    id: "2",
    name: "Rohan Verma",
    wcaId: "2022VERM15",
    feedback:
      "CubeDev has transformed how I track my progress. The analytics are detailed yet easy to understand, and the challenge rooms keep practice sessions exciting. Being able to compete with friends on the same scrambles is a game-changer.",
    highlight: "Analytics & Challenge Rooms",
  },
  {
    id: "3",
    name: "Priya Sharma",
    wcaId: "2024SHAR08",
    feedback:
      "As someone who competes regularly, having WCA integration and cuber profiles is fantastic. I can view my competition history alongside my practice data all in one place. The modern timer with inspection periods feels just like a real competition.",
    highlight: "WCA Integration",
  },
  {
    id: "4",
    name: "Alex Chen",
    wcaId: "2021CHEN42",
    feedback:
      "The Coach feature helped me structure my training and finally break my plateau. The personalized training plans and journal tracking keep me accountable. It's like having a professional coach available anytime.",
    highlight: "Coach Feature",
  },
];

export default function Testimonials() {
  const [visibleCards, setVisibleCards] = useState<Set<number>>(new Set());
  const cardRefs = useRef<(HTMLDivElement | null)[]>([]);
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const observers: IntersectionObserver[] = [];

    cardRefs.current.forEach((ref, index) => {
      if (ref) {
        const observer = new IntersectionObserver(
          ([entry]) => {
            if (entry.isIntersecting) {
              setTimeout(() => {
                setVisibleCards((prev) => new Set([...prev, index]));
              }, index * 100);
            }
          },
          { threshold: 0.2 },
        );
        observer.observe(ref);
        observers.push(observer);
      }
    });

    return () => observers.forEach((observer) => observer.disconnect());
  }, []);

  return (
    <section ref={sectionRef} className="py-16 lg:py-24 bg-[var(--surface)]">
      <div className="container-responsive">
        {/* Section Header */}
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl lg:text-6xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            Trusted by{" "}
            <span className="text-[var(--primary)]">Speedcubers</span>
          </h2>
          <p className="text-lg md:text-2xl text-[var(--text-secondary)] max-w-3xl mx-auto font-inter">
            See what the cubing community has to say about CubeDev
          </p>
        </div>

        {/* Testimonials Grid */}
        <div className="grid md:grid-cols-2 gap-6 lg:gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              ref={(el) => {
                cardRefs.current[index] = el;
              }}
              className={`group bg-[var(--background)] border border-[var(--border)] rounded-xl p-6 lg:p-8 hover:border-[var(--primary)] transition-all duration-500 hover:shadow-lg hover:shadow-[var(--primary)]/5 ${
                visibleCards.has(index)
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-8"
              }`}
            >
              {/* Quote Icon */}
              <div className="mb-4">
                <div className="w-10 h-10 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center group-hover:bg-[var(--primary)]/20 transition-colors duration-300">
                  <Quote className="w-5 h-5 text-[var(--primary)]" />
                </div>
              </div>

              {/* Highlight Badge */}
              {testimonial.highlight && (
                <div className="inline-block mb-4">
                  <span className="text-xs font-semibold text-[var(--primary)] bg-[var(--primary)]/10 px-3 py-1 rounded-full font-button">
                    {testimonial.highlight}
                  </span>
                </div>
              )}

              {/* Feedback */}
              <p className="text-[var(--text-secondary)] leading-relaxed mb-6 font-inter">
                "{testimonial.feedback}"
              </p>

              {/* Cuber Info */}
              <div className="flex items-center justify-between pt-4 border-t border-[var(--border)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[var(--primary)]/20 rounded-full flex items-center justify-center">
                    <span className="text-sm font-bold text-[var(--primary)] font-button">
                      {testimonial.name.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <div className="font-semibold text-[var(--text-primary)] font-button">
                      {testimonial.name}
                    </div>
                    <Link
                      href={`https://www.cubedev.xyz/cuber/${testimonial.wcaId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-[var(--text-muted)] hover:text-[var(--primary)] transition-colors font-inter flex items-center gap-1"
                    >
                      {testimonial.wcaId}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}