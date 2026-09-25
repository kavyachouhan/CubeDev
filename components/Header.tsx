"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Image from "next/image";
import { Box, LogOut, Menu, Settings, User, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { IconButton } from "@/components/ui/IconButton";
import { wcaSignInHref } from "@/lib/wca-config";
import { useUser } from "@/components/UserProvider";
import { getAvatarUrl } from "@/lib/avatar";
import UserDropdown from "@/components/UserDropdown";
import { useLogo } from "@/lib/use-logo";

export default function Header() {
  const pathname = usePathname();
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
    window.location.href = wcaSignInHref();
  };

  const navItems = [
    { name: "Home", href: "/" },
    { name: "Cubers", href: "/cuber" },
    // { name: "WCA Stats", href: "/wca-stats" },
    { name: "About", href: "/about" },
    { name: "Contact", href: "/contact" },
  ];

  /** The URL decides what's active, so it survives reloads and back/forward. */
  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  return (
    <header
      className={`sticky top-0 z-50 bg-(--surface) border-b border-(--border) backdrop-blur-sm transition-all duration-500 ease-in-out ${
        isVisible || mobileMenuOpen
          ? "translate-y-0 opacity-100"
          : "-translate-y-full opacity-0"
      }`}
    >
      <nav className="container-responsive">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2 group">
            <Image
              src={logoSrc}
              alt="CubeDev Logo"
              width={32}
              height={32}
              className="w-8 h-8"
            />
            <span className="text-2xl font-bold text-(--text-primary) group-hover:opacity-80 transition-opacity font-statement">
              Cube<span className="text-(--primary)">Dev</span>
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                aria-current={isActive(item.href) ? "page" : undefined}
                className={`text-base font-medium transition-all duration-200 font-button ${
                  isActive(item.href)
                    ? "text-(--primary) underline decoration-(--primary) underline-offset-4"
                    : "text-(--text-secondary) hover:text-(--primary) hover:underline decoration-(--primary) underline-offset-4"
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
              <Button
                size="sm"
                onClick={handleWCASignIn}
                iconLeft={
                  <Image
                    src="/wca_logo.png"
                    alt=""
                    width={16}
                    height={16}
                    className="w-4 h-4 object-contain"
                  />
                }
              >
                Sign in with WCA
              </Button>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <IconButton
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              icon={mobileMenuOpen ? <X /> : <Menu />}
            />
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-(--border) py-4 animate-fade-in">
            <div className="flex flex-col space-y-4">
              {navItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  className={`px-4 py-2 min-h-11 flex items-center text-lg font-medium transition-all duration-200 font-button ${
                    isActive(item.href)
                      ? "text-(--primary) underline decoration-(--primary) underline-offset-4"
                      : "text-(--text-secondary) hover:text-(--primary) hover:underline decoration-(--primary) underline-offset-4"
                  }`}
                >
                  {item.name}
                </Link>
              ))}

              {/* Mobile User Authentication Section */}
              {user ? (
                <div className="mx-4 space-y-4">
                  {/* User Info */}
                  <div className="flex items-center gap-3 px-4 py-3 bg-(--surface-elevated) rounded-(--radius-control)">
                    {user.avatar && (
                      <Image
                        src={getAvatarUrl(user.avatar) ?? ""}
                        alt={`${user.name}'s avatar`}
                        width={40}
                        height={40}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    )}
                    <div>
                      <div className="text-base font-semibold text-(--text-primary) font-button">
                        {user.name}
                      </div>
                      {user.wcaId && (
                        <div className="text-sm text-(--text-secondary) font-inter">
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
                      className="flex items-center gap-3 px-4 py-3 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-(--radius-control) transition-colors font-inter"
                    >
                      <Box className="w-4 h-4" aria-hidden />
                      Cube Lab
                    </Link>

                    {user.wcaId && (
                      <Link
                        href={`/cuber/${user.wcaId}`}
                        onClick={() => setMobileMenuOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-(--radius-control) transition-colors font-inter"
                      >
                        <User className="w-4 h-4" aria-hidden />
                        Public Profile
                      </Link>
                    )}

                    <Link
                      href="/me"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-(--radius-control) transition-colors font-inter"
                    >
                      <Settings className="w-4 h-4" aria-hidden />
                      Settings
                    </Link>
                  </div>

                  {/* Mobile Sign Out Button */}
                  <Button
                    variant="secondary"
                    fullWidth
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="text-(--error)! border-(--error)/30! hover:bg-(--error)/10!"
                    iconLeft={<LogOut className="w-4 h-4" />}
                  >
                    Sign out
                  </Button>
                </div>
              ) : (
                /* Mobile WCA Sign In Button */
                <Button
                  className="mx-4"
                  onClick={() => {
                    handleWCASignIn();
                    setMobileMenuOpen(false);
                  }}
                  iconLeft={
                    <Image
                      src="/wca_logo.png"
                      alt=""
                      width={20}
                      height={20}
                      className="w-5 h-5 object-contain"
                    />
                  }
                >
                  Sign in with WCA
                </Button>
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}