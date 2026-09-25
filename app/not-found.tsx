"use client";

import Link from "next/link";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeft, Timer } from "lucide-react";
import { Button, ButtonLink } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <>
      <Header />
    <div className="min-h-screen bg-(--background) flex items-center justify-center p-4">
      <div className="max-w-4xl w-full mx-auto">
        {/* Main 404 Card */}
        <div className="timer-card text-center mb-8">
          <div className="mb-8">

            <h1 className="text-6xl md:text-8xl font-bold text-(--primary) mb-4 font-statement">
              404
            </h1>
            <h2 className="text-2xl md:text-3xl font-bold text-(--text-primary) mb-3 font-statement">
              Page Not Found
            </h2>
            <p className="text-(--text-secondary) text-lg max-w-2xl mx-auto font-inter">
              The page you're looking for doesn't exist or has been moved. Let's
              get you back to timing your solves!
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => window.history.back()}
              iconLeft={<ArrowLeft className="w-5 h-5" />}
            >
              Go back
            </Button>

            <ButtonLink
              href="/cube-lab/timer"
              size="lg"
              iconLeft={<Timer className="w-5 h-5" />}
            >
              Time your solves
            </ButtonLink>
          </div>
        </div>

        {/* Help Section */}
        <div className="text-center mt-8">
          <p className="text-(--text-muted) font-inter">
            Still having trouble?{" "}
            <Link
              href="/contact"
              className="text-(--primary) hover:text-(--primary-hover) font-semibold transition-colors"
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