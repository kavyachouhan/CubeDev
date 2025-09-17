"use client";

import Link from "next/link";
import { useState } from "react";
import Image from "next/image";
import { getWCAOAuthUrl } from "@/lib/wca-config";

export default function Header() {
  const [activeTab, setActiveTab] = useState("Timer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleWCASignIn = () => {
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  const navItems = [
    { name: "Timer", href: "/" },
    { name: "Train", href: "/train" },
    { name: "Analyze", href: "/analyze" },
    { name: "Sync", href: "/sync" },
  ];

  return (
    <header className="relative z-50 bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-sm">
      <nav className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
            onClick={() => setActiveTab("Timer")}
          >
            <div className="w-8 h-8 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
              <div className="w-4 h-4 bg-[var(--surface)] rounded-sm"></div>
            </div>
            <span className="text-2xl font-bold text-[var(--text-primary)] group-hover:opacity-80 transition-opacity font-statement">
              Cube<span className="text-blue">Dev</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setActiveTab(item.name)}
                className={`text-base font-medium transition-all duration-200 font-button ${
                  activeTab === item.name
                    ? "text-[var(--primary)] underline decoration-[var(--primary)] underline-offset-4"
                    : "text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline decoration-[var(--primary)] underline-offset-4"
                }`}
              >
                {item.name}
              </Link>
            ))}

            {/* WCA Sign In Button */}
            <button
              onClick={handleWCASignIn}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button text-sm hover:scale-105"
            >
              <Image
                src="/wca_logo.png"
                alt="WCA Logo"
                width={16}
                height={16}
                className="w-4 h-4 object-contain"
              />
              Sign in with WCA
            </button>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-[var(--text-secondary)] hover:text-[var(--text-primary)] p-2 rounded-lg hover:bg-[var(--surface-elevated)] transition-colors"
              aria-label="Toggle menu"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileMenuOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[var(--border)] py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => {
                    setActiveTab(item.name);
                    setMobileMenuOpen(false);
                  }}
                  className={`px-4 py-2 text-lg font-medium transition-all duration-200 font-button ${
                    activeTab === item.name
                      ? "text-[var(--primary)] underline decoration-[var(--primary)] underline-offset-4"
                      : "text-[var(--text-secondary)] hover:text-[var(--primary)] hover:underline decoration-[var(--primary)] underline-offset-4"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile WCA Sign In Button */}
              <button
                onClick={() => {
                  handleWCASignIn();
                  setMobileMenuOpen(false);
                }}
                className="mx-4 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-semibold rounded-lg transition-all duration-200 font-button text-base"
              >
                <Image
                  src="/wca_logo.png"
                  alt="WCA Logo"
                  width={20}
                  height={20}
                  className="w-5 h-5 object-contain"
                />
                Sign in with WCA
              </button>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
