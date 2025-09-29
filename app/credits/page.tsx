import { ExternalLink, Heart, Code, Box, Grid3x3 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface CreditItem {
  name: string;
  description: string;
  maintainer: string;
  website: string;
  usage: string;
  icon: React.ReactNode;
}

export default function CreditsPage() {
  const credits: CreditItem[] = [
    {
      name: "cubing/twisty",
      description:
        "High-performance 3D puzzle visualization and simulation library for interactive cube displays",
      maintainer: "Cubing.js",
      website: "https://js.cubing.net/cubing/twisty/",
      usage: "3D cube visualization and scramble previews",
      icon: <Box className="w-6 h-6 text-[var(--primary)]" />,
    },
    {
      name: "cubing/scramble",
      description:
        "Professional-grade scramble generation library supporting all WCA puzzle events",
      maintainer: "Cubing.js",
      website: "https://js.cubing.net/cubing/scramble/",
      usage: "Scramble generation for all supported puzzle types",
      icon: <Code className="w-6 h-6 text-[var(--accent)]" />,
    },
    {
      name: "cubing/icons",
      description:
        "Official WCA event icons and puzzle iconography in SVG format",
      maintainer: "Cubing.js",
      website: "https://icons.cubing.net/",
      usage: "Event icons throughout the application interface",
      icon: <Grid3x3 className="w-6 h-6 text-[var(--success)]" />,
    },
    {
      name: "WCA OAuth",
      description:
        "World Cube Association OAuth authentication service for secure user verification",
      maintainer: "World Cube Association",
      website: "https://www.worldcubeassociation.org/",
      usage: "User authentication and WCA profile integration",
      icon: (
        <img src="/wca_logo.png" alt="WCA" className="w-6 h-6 object-contain" />
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-[var(--background)]">
        <Header />
      <div className="container-responsive py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            Credits &{" "}
            <span className="text-[var(--primary)]">Acknowledgments</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
            CubeDev is built on the shoulders of giants. We're grateful to the
            open-source community and organizations that make our platform
            possible.
          </p>
        </div>

        {/* Primary Credits */}
        <div className="space-y-6 mb-16">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 font-statement">
            Core Dependencies
          </h2>

          <div className="grid gap-6">
            {credits.map((credit, index) => (
              <div
                key={credit.name}
                className="timer-card group hover:border-[var(--primary)]/30 transition-all duration-300"
              >
                <div className="flex flex-col lg:flex-row lg:items-start gap-6">
                  {/* Icon & Title */}
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">{credit.icon}</div>
                    <div>
                      <h3 className="text-xl font-bold text-[var(--text-primary)] mb-1 font-statement">
                        {credit.name}
                      </h3>
                      <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
                        <span className="font-inter">{credit.maintainer}</span>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1 space-y-3">
                    <p className="text-[var(--text-secondary)] font-inter leading-relaxed">
                      {credit.description}
                    </p>

                    <div className="bg-[var(--surface-elevated)] p-3 rounded-lg border border-[var(--border)]">
                      <div className="text-sm font-medium text-[var(--text-primary)] mb-1 font-inter">
                        Used for:
                      </div>
                      <div className="text-sm text-[var(--text-secondary)] font-inter">
                        {credit.usage}
                      </div>
                    </div>

                    <a
                      href={credit.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-[var(--primary)] hover:text-[var(--primary-hover)] transition-colors font-inter text-sm group"
                    >
                      Visit Project
                      <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>  

        {/* Special Thanks */}
        <div className="timer-card text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Heart className="w-6 h-6 text-red-500" />
            <h2 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
              Special Thanks
            </h2>
          </div>

          <p className="text-[var(--text-secondary)] font-inter mb-6 max-w-2xl mx-auto">
            To the entire community, WCA delegates, competition
            organizers, and every cuber who has contributed to making this sport
            amazing. CubeDev exists to serve and celebrate this incredible
            sports.
          </p>
        </div>

        {/* Footer Note */}
        <div className="mt-12 text-center">
          <div className="text-sm text-[var(--text-muted)] font-inter max-w-xl mx-auto">
            If you notice any missing attributions or have questions about
            licensing, please reach out to us. We're committed to properly
            crediting all contributors.
          </div>
        </div>
      </div>
        <Footer />
    </div>
  );
}