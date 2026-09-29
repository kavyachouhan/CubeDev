import { ExternalLink, Heart, Code, Box, Grid3x3, Volume2, Lock } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ButtonLink } from "@/components/ui/Button";
import { Card, CardIcon } from "@/components/ui/Card";

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
      name: "StoreMyAPI",
      description:
        "A secure platform to store and manage API keys and sensitive configuration data for web applications",
      maintainer: "StoreMyAPI",
      website: "https://storemyapi.dev/",
      usage: "Secure API key management",
      icon: <Lock />,
    },
    {
      name: "cubing/twisty",
      description:
        "High-performance 3D puzzle visualization and simulation library for interactive cube displays",
      maintainer: "Cubing.js",
      website: "https://js.cubing.net/cubing/twisty/",
      usage: "3D cube visualization and scramble previews",
      icon: <Box />,
    },
    {
      name: "cubing/scramble",
      description:
        "Professional-grade scramble generation library supporting all WCA puzzle events",
      maintainer: "Cubing.js",
      website: "https://js.cubing.net/cubing/scramble/",
      usage: "Scramble generation for all supported puzzle types",
      icon: <Code />,
    },
    {
      name: "cubing/icons",
      description:
        "Official WCA event icons and puzzle iconography in SVG format",
      maintainer: "Cubing.js",
      website: "https://icons.cubing.net/",
      usage: "Event icons throughout the application interface",
      icon: <Grid3x3 />,
    },
    {
      name: "WCA OAuth",
      description:
        "World Cube Association OAuth authentication service for secure user verification",
      maintainer: "World Cube Association",
      website: "https://www.worldcubeassociation.org/",
      usage: "User authentication and WCA profile integration",
      icon: (
        <img src="/wca_logo.png" alt="WCA" className="w-5 h-5 object-contain" />
      ),
    },
    {
      name: "Freesound",
      description:
        "A collaborative database of Creative Commons licensed sounds, providing high-quality audio samples for interactive applications",
      maintainer: "Freesound Community",
      website: "https://freesound.org/",
      usage:
        "Sound effects and audio feedback for competition simulations and timer interactions",
      icon: <Volume2 />,
    },
  ];

  return (
    <div className="min-h-screen bg-(--background)">
      <Header />
      <div className="container-responsive py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="type-page-title">
            Credits & <span className="text-(--primary)">Acknowledgments</span>
          </h1>
          <p className="type-body mt-3 max-w-2xl mx-auto">
            CubeDev is built on the shoulders of giants. We're grateful to the
            open-source community and organizations that make our platform
            possible.
          </p>
        </div>

        {/* Primary Credits */}
        <div className="space-y-4 mb-10 sm:mb-16">
          <h2 className="type-section-title">Core Dependencies</h2>

          <div className="grid gap-4 sm:grid-cols-2">
            {credits.map((credit) => (
              <Card
                key={credit.name}
                className="flex flex-col gap-3 hover:border-(--primary)/30 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <CardIcon>{credit.icon}</CardIcon>
                  <div className="min-w-0">
                    <h3 className="type-card-title wrap-break-word">
                      {credit.name}
                    </h3>
                    <p className="type-caption">{credit.maintainer}</p>
                  </div>
                </div>

                <p className="type-body">{credit.description}</p>

                <div className="rounded-(--radius-panel) border border-(--border) bg-(--surface-elevated) p-3">
                  <p className="type-overline">Used for</p>
                  <p className="type-caption mt-0.5">{credit.usage}</p>
                </div>

                <ButtonLink
                  size="sm"
                  variant="secondary"
                  href={credit.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="self-start mt-auto"
                  iconRight={<ExternalLink className="w-4 h-4" />}
                >
                  Visit Project
                </ButtonLink>
              </Card>
            ))}
          </div>
        </div>

        {/* Special Thanks */}
        <Card className="text-center">
          <div className="flex items-center justify-center gap-3 mb-3">
            <CardIcon tone="error">
              <Heart />
            </CardIcon>
            <h2 className="type-section-title">Special Thanks</h2>
          </div>

          <p className="type-body max-w-2xl mx-auto">
            To the entire community, WCA delegates, competition organizers, and
            every cuber who has contributed to making this sport amazing.
            CubeDev exists to serve and celebrate this incredible sports.
          </p>
        </Card>

        {/* Footer Note */}
        <div className="mt-8 sm:mt-12 text-center">
          <div className="type-caption max-w-xl mx-auto">
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