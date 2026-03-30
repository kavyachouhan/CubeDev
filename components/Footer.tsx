"use client";

import Link from "next/link";
import Image from "next/image";
import { useLogo } from "@/lib/use-logo";

export default function Footer() {
  const currentYear = new Date().getFullYear();
  const logoSrc = useLogo();

  const links = [
    { name: "Help", href: "/help" },
    { name: "Contribute", href: "/contribute" },
    { name: "Credits", href: "/credits" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
  ];

  return (
    <footer className="bg-(--surface) border-t border-(--border) mt-auto">
      <div className="container-responsive py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo and tagline */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <Image
                src={logoSrc}
                alt="CubeDev Logo"
                width={32}
                height={32}
                className="w-8 h-8"
              />
              <span className="font-semibold text-xl text-(--text-primary) group-hover:opacity-80 transition-opacity font-statement">
                Cube<span className="text-(--primary)">Dev</span>
              </span>
            </Link>
            <span className="text-(--text-muted) text-base text-center sm:text-left font-inter">
              Speedcubing tools for cubers
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                className="text-(--text-secondary) hover:text-(--primary) text-base transition-colors font-button hover:underline decoration-(--primary) underline-offset-4"
              >
                {link.name}
              </Link>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-(--border) text-center">
          <p className="text-(--text-muted) text-base font-inter">
            © {currentYear} CubeDev. Built for the speedcubing community.
          </p>
        </div>
      </div>
    </footer>
  );
}