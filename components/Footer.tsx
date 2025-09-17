import Link from "next/link";

export default function Footer() {
  const currentYear = new Date().getFullYear();

  const links = [
    { name: "About", href: "/about" },
    { name: "Privacy", href: "/privacy" },
    { name: "Terms", href: "/terms" },
    { name: "GitHub", href: "https://github.com/cubedev", external: true },
  ];

  return (
    <footer className="bg-[var(--surface)] border-t border-[var(--border)] mt-auto">
      <div className="container-responsive py-8">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          {/* Logo and tagline */}
          <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-4">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="w-6 h-6 bg-gradient-to-br from-[var(--primary)] to-[var(--accent)] rounded flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                <div className="w-3 h-3 bg-[var(--surface)] rounded-sm"></div>
              </div>
              <span className="font-semibold text-lg text-[var(--text-primary)] group-hover:opacity-80 transition-opacity font-statement">
                CubeDev
              </span>
            </Link>
            <span className="text-[var(--text-muted)] text-base text-center sm:text-left font-inter">
              Speedcubing tools for cubers
            </span>
          </div>

          {/* Links */}
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6">
            {links.map((link) => (
              <Link
                key={link.name}
                href={link.href}
                {...(link.external && {
                  target: "_blank",
                  rel: "noopener noreferrer",
                })}
                className="text-[var(--text-secondary)] hover:text-[var(--primary)] text-base transition-colors font-button hover:underline decoration-[var(--primary)] underline-offset-4"
              >
                {link.name}
                {link.external && (
                  <svg
                    className="w-3 h-3 ml-1 inline-block"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                )}
              </Link>
            ))}
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-6 pt-6 border-t border-[var(--border)] text-center">
          <p className="text-[var(--text-muted)] text-base font-inter">
            © {currentYear} CubeDev. Built for the speedcubing community.
          </p>
        </div>
      </div>
    </footer>
  );
}