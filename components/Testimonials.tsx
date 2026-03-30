"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import {
  Quote,
  ChevronLeft,
  ChevronRight,
  User,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

interface Testimonial {
  id: string;
  name: string;
  wcaId: string;
  feedback: string;
  highlight?: string;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    name: "Aayush Parekh",
    wcaId: "2023PARE02",
    feedback:
      "The competition simulation is incredible with all the authentic sounds and distractions for realistic practice. The interface is clean and intuitive, with great attention to detail. Features like the algorithm trainer and comprehensive statistics make it a complete package for serious cubers.",
    highlight: "Competition Simulation",
    avatar:
      "https://assets.worldcubeassociation.org/assets/062b138/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png",
  },
  {
    id: "2",
    name: "Junaid Ekhlaque",
    wcaId: "2024EKHL01",
    feedback:
      "This is a very good timer for Cubing. We can freely use this timer for speed solving, fun solving, compete with other friends. And the new coach feature is insane. We can learn many things with this coach. Very good work by CubeDev developers!",
    highlight: "Timer & Coach",
    avatar:
      "https://avatars.worldcubeassociation.org/lk708827qkx43z5zl409ajj5oc26",
  },
  {
    id: "3",
    name: "Ritesh Yeragi",
    wcaId: "2019YERA01",
    feedback:
      "It's nice getting sign in via WCA, and being able to set a goal, and getting a clear path to practice or learn algs to achieve the final goal! The timer is also very good, but the coach thing makes CubeDev stand out!",
    highlight: "Goal Setting & Coach",
    avatar:
      "https://assets.worldcubeassociation.org/assets/1f8985e/assets/missing_avatar_thumb-d77f478a307a91a9d4a083ad197012a391d5410f6dd26cb0b0e3118a5de71438.png",
  },
];

// Avatar component with error handling and fallback
function TestimonialAvatar({
  name,
  avatar,
  size = 48,
}: {
  name: string;
  avatar?: string;
  size?: number;
}) {
  const [imageError, setImageError] = useState(false);

  if (avatar && !imageError) {
    return (
      <div
        className="relative rounded-full overflow-hidden border-2 border-(--border) shrink-0"
        style={{ width: size, height: size }}
      >
        <Image
          src={avatar}
          alt={`${name}'s avatar`}
          fill
          className="object-cover"
          onError={() => setImageError(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="rounded-full flex items-center justify-center bg-(--primary)/10 border-2 border-(--border) shrink-0"
      style={{ width: size, height: size }}
    >
      {avatar && imageError ? (
        <User className="w-1/2 h-1/2 text-(--primary)" />
      ) : (
        <span
          className="font-bold text-(--primary)"
          style={{ fontSize: size * 0.4 }}
        >
          {name.charAt(0)}
        </span>
      )}
    </div>
  );
}

// Card component for individual testimonials
function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <div className="group bg-(--background) border border-(--border) rounded-xl p-4 sm:p-6 hover:border-(--primary) transition-all duration-300 h-full flex flex-col min-h-[280px] sm:min-h-[320px]">
      {/* Quote Icon */}
      <div className="mb-3 sm:mb-4">
        <div className="w-8 h-8 sm:w-10 sm:h-10 bg-(--primary)/10 rounded-lg flex items-center justify-center group-hover:bg-(--primary)/20 transition-colors duration-300">
          <Quote className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary)" />
        </div>
      </div>

      {/* Highlight Badge */}
      {testimonial.highlight && (
        <div className="inline-block mb-3 sm:mb-4">
          <span className="text-[10px] sm:text-xs font-semibold text-(--primary) bg-(--primary)/10 px-2 sm:px-3 py-1 rounded-full font-button">
            {testimonial.highlight}
          </span>
        </div>
      )}

      {/* Feedback */}
      <p className="text-sm sm:text-base text-(--text-secondary) leading-relaxed mb-4 sm:mb-6 font-inter flex-grow line-clamp-6 sm:line-clamp-none">
        &ldquo;{testimonial.feedback}&rdquo;
      </p>

      {/* Cuber Info */}
      <div className="flex items-center gap-2 sm:gap-3 pt-3 sm:pt-4 border-t border-(--border)">
        <TestimonialAvatar
          name={testimonial.name}
          avatar={testimonial.avatar}
          size={36}
        />
        <div className="min-w-0">
          <div className="font-semibold text-sm sm:text-base text-(--text-primary) font-button truncate">
            {testimonial.name}
          </div>
          <Link
            href={`/cuber/${testimonial.wcaId}`}
            className="text-xs sm:text-sm text-(--text-muted) hover:text-(--primary) transition-colors font-inter"
          >
            {testimonial.wcaId}
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Testimonials() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // To create an infinite loop effect, we can duplicate the testimonials array multiple times
  const extendedTestimonials = [
    ...testimonials,
    ...testimonials,
    ...testimonials,
  ];

  const getVisibleCount = useCallback(() => {
    if (typeof window === "undefined") return 3;
    if (window.innerWidth < 768) return 1;
    if (window.innerWidth < 1024) return 2;
    return 3;
  }, []);

  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(getVisibleCount());
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [getVisibleCount]);

  // Intersection Observer to detect when the section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.2 },
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Autoplay functionality
  useEffect(() => {
    if (isPaused || !isVisible) {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    intervalRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 4000);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPaused, isVisible]);

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? testimonials.length - 1 : prev - 1,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  return (
    <section
      ref={sectionRef}
      className="py-12 sm:py-16 lg:py-24 bg-(--surface)"
    >
      <div className="container-responsive">
        {/* Section Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-6xl font-bold text-(--text-primary) mb-3 sm:mb-4 font-statement">
            Trusted by{" "}
            <span className="text-(--primary)">Speedcubers</span>
          </h2>
          <p className="text-base sm:text-lg md:text-2xl text-(--text-secondary) max-w-3xl mx-auto font-inter px-4">
            See what the cubing community has to say about CubeDev
          </p>
        </div>

        {/* Carousel Container */}
        <div className="relative px-2 sm:px-0">
          {/* Navigation Buttons */}
          <button
            onClick={goToPrevious}
            className="hidden sm:flex absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1 md:-translate-x-4 z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-(--background) border border-(--border) rounded-full items-center justify-center text-(--text-secondary) hover:text-(--primary) hover:border-(--primary) transition-all duration-200"
            aria-label="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          <button
            onClick={goToNext}
            className="hidden sm:flex absolute right-0 top-1/2 -translate-y-1/2 translate-x-1 md:translate-x-4 z-10 w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 bg-(--background) border border-(--border) rounded-full items-center justify-center text-(--text-secondary) hover:text-(--primary) hover:border-(--primary) transition-all duration-200"
            aria-label="Next testimonial"
          >
            <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6" />
          </button>

          {/* Testimonials Grid */}
          <div className="overflow-hidden mx-0 sm:mx-8 md:mx-12">
            <div
              className="flex transition-transform duration-500 ease-in-out"
              style={{
                transform: `translateX(-${currentIndex * (100 / visibleCount)}%)`,
              }}
            >
              {extendedTestimonials.map((testimonial, index) => (
                <div
                  key={`${testimonial.id}-${index}`}
                  className="shrink-0 px-1.5 sm:px-2 md:px-3"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <TestimonialCard testimonial={testimonial} />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Carousel Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6 sm:mt-8">
          {/* Mobile Navigation Arrows */}
          <button
            onClick={goToPrevious}
            className="sm:hidden w-8 h-8 bg-(--background) border border-(--border) rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--primary) hover:border-(--primary) transition-all duration-200"
            aria-label="Previous testimonial"
            title="Previous testimonial"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Pagination Dots */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {testimonials.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full transition-all duration-300 ${
                  index === currentIndex
                    ? "bg-(--primary) w-4 sm:w-6"
                    : "bg-(--border) hover:bg-(--text-muted)"
                }`}
                aria-label={`Go to testimonial ${index + 1}`}
                title={`Go to testimonial ${index + 1}`}
              />
            ))}
          </div>

          {/* Mobile Next Arrow */}
          <button
            onClick={goToNext}
            className="sm:hidden w-8 h-8 bg-(--background) border border-(--border) rounded-full flex items-center justify-center text-(--text-secondary) hover:text-(--primary) hover:border-(--primary) transition-all duration-200"
            aria-label="Next testimonial"
            title="Next testimonial"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
}