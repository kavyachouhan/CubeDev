"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import {
  ArrowLeft,
  Timer,
} from "lucide-react";

export default function NotFound() {
  return (
    <>
      <Header />
    <div className="min-h-screen bg-[var(--background)] flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Main 404 Card */}
        <div className="timer-card text-center mb-8">
          <div className="mb-8">

            <h1 className="text-6xl md:text-8xl font-bold text-[var(--primary)] mb-4 font-statement">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-3 font-statement">
              Page Not Found
            </h2>
            <p className="text-[var(--text-secondary)] text-lg max-w-2xl mx-auto font-inter">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back to timing your solves!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Link
              href="/cube-lab/timer"
              className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-all duration-200 font-statement font-semibold"
            >
              <Timer className="w-5 h-5" />
              Time Your Solves
            </Link>

            <button
              onClick={() => window.history.back()}
              className="inline-flex items-center gap-3 px-6 py-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] hover:text-[var(--primary)] rounded-lg transition-all duration-200 font-statement font-semibold"
            >
              <ArrowLeft className="w-5 h-5" />
              Go Back
            </button>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mt-8">
          <p className="text-[var(--text-muted)] font-inter">
            Still having trouble?{" "}
            <Link
              href="/contact"
              className="text-[var(--primary)] hover:text-[var(--primary-hover)] font-semibold transition-colors"
            >
              Contact us
            </Link>
          </p>
        </div>
      </div>
    </div>
        <Footer />
    </>
  );
}