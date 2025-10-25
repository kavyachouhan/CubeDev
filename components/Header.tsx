"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import Image from "next/image";
import { getWCAOAuthUrl } from "@/lib/wca-config";
import { useUser } from "@/components/UserProvider";
import UserDropdown from "@/components/UserDropdown";
import { useLogo } from "@/lib/use-logo";

export default function Header() {
  const [activeTab, setActiveTab] = useState("Timer");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const { user, signOut } = useUser();
  const logoSrc = useLogo();

  // Hide/show header on scroll
  useEffect(() => {
    const controlHeader = () => {
      const currentScrollY = window.scrollY;
      const scrollDifference = Math.abs(currentScrollY - lastScrollY);

      // Only trigger if scrolled more than 5px to avoid jitter
      if (scrollDifference < 5) return;

      // Show header when scrolling up or at the top
      if (currentScrollY < lastScrollY || currentScrollY < 10) {
        setIsVisible(true);
      }
      // Hide header when scrolling down (but not if at the very top or mobile menu is open)
      else if (
        currentScrollY > lastScrollY &&
        currentScrollY > 80 &&
        !mobileMenuOpen
      ) {
        setIsVisible(false);
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", controlHeader);
    return () => window.removeEventListener("scroll", controlHeader);
  }, [lastScrollY, mobileMenuOpen]);

  const handleWCASignIn = () => {
    const wcaAuthUrl = getWCAOAuthUrl();
    window.location.href = wcaAuthUrl;
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Cubers", href: "/cuber" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  return (
    <header
      className={`sticky top-0 z-50 bg-[var(--surface)] border-b border-[var(--border)] backdrop-blur-sm transition-all duration-500 ease-in-out ${
        isVisible || mobileMenuOpen
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <nav className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center space-x-2 group"
            onClick={() => setActiveTab("Timer")}
          >
            <Image
              src={logoSrc}
              alt="CubeDev Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-[var(--text-primary)] group-hover:opacity-80 transition-opacity font-statement">
              Cube<span className="text-[var(--primary)]">Dev</span>
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

            {/* User Authentication Section */}
            {user ? (
              <UserDropdown user={user} onSignOut={signOut} />
            ) : (
              /* WCA Sign In Button */
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
            )}
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

              {/* Mobile User Authentication Section */}
              {user ? (
                <div className="mx-4 space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-[var(--surface-elevated)] rounded-lg">
                    {user.avatar && (
                      <Image
                        src={user.avatar.url || user.avatar}
                        alt={`${user.name}'s avatar`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="text-base font-semibold text-[var(--text-primary)] font-button">
                        {user.name}
                      </div>
                      {user.wcaId && (
                        <div className="text-sm text-[var(--text-secondary)] font-inter">
                          {user.wcaId}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Mobile Menu Items */}
                  <div className="space-y-2">
                    <Link
                      href="/cube-lab/timer"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors font-inter"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                        />
                      </svg>
                      Cube Lab
                    </Link>

                    {user.wcaId && (
                      <Link
                        href={`/cuber/${user.wcaId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors font-inter"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                          />
                        </svg>
                        Public Profile
                      </Link>
                    )}

                    <Link
                      href="/me"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-lg transition-colors font-inter"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                      </svg>
                      Settings
                    </Link>
                  </div>

                  {/* Mobile Sign Out Button */}
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-3 px-4 py-3 text-[var(--error)] hover:text-[var(--error)] hover:bg-[var(--error)]/10 border border-[var(--error)]/30 rounded-lg transition-all duration-200 font-button text-base"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                      />
                    </svg>
                    Sign Out
                  </button>
                </div>
              ) : (
                /* Mobile WCA Sign In Button */
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
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}