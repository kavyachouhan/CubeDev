import { ExternalLink, Github, Globe, Linkedin } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-[var(--background)]">
      <Header />
      <div className="container-responsive py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            About <span className="text-[var(--primary)]">CubeDev</span>
          </h1>
          <p className="text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
            Built by cubers, for speedcubers. A platform to help
            the global cubing community improve their skills and connect with
            fellow cubers.
          </p>
        </div>

        {/* Creator Section */}
        <div className="timer-card mb-8">
          <div className="flex flex-col lg:flex-row items-center gap-8">
            {/* WCA Avatar */}
            <div className="w-32 h-32 rounded-full overflow-hidden flex-shrink-0 border-4 border-[var(--primary)]/20">
              <img
                src="https://avatars.worldcubeassociation.org/uploads/user/avatar/2022CHOU06/1715086963.jpg"
                alt="Kavya Chouhan"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Creator Info */}
            <div className="flex-1 text-center lg:text-left">
              <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-2 font-statement">
                Kavya Chouhan
              </h2>
              <div className="text-lg text-[var(--primary)] font-semibold mb-4 font-inter">
                WCA ID: 2022CHOU06
              </div>
              <p className="text-[var(--text-secondary)] font-inter leading-relaxed mb-6">
                I'm a passionate speedcuber and developer who created CubeDev to
                fill the gaps I experienced in the cubing. As someone
                who's been both competing and coding for years, I wanted to
                build a platform that truly understands what cubers need to
                improve and connect.
              </p>

              {/* Social Links */}
              <div className="flex flex-wrap gap-4 justify-center lg:justify-start">
                <a
                  href="https://github.com/kavyachouhan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-inter"
                >
                  <Github className="w-5 h-5" />
                  GitHub
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>

                <a
                  href="https://kavyachouhan.xyz"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-inter"
                >
                  <Globe className="w-5 h-5" />
                  Website
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>

                <a
                  href="https://linkedin.com/in/kavya-chouhan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-inter"
                >
                  <Linkedin className="w-5 h-5" />
                  LinkedIn
                  <ExternalLink className="w-4 h-4 opacity-50" />
                </a>

                <a
                  href="https://www.worldcubeassociation.org/persons/2022CHOU06"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-all duration-200 font-inter"
                >
                  <img src="/wca_logo.png" alt="WCA" className="w-5 h-5" />
                  WCA Profile
                  <ExternalLink className="w-4 h-4 opacity-75" />
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="timer-card mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 font-statement">
            Our Mission
          </h2>
          <div className="space-y-4 text-[var(--text-secondary)] font-inter leading-relaxed">
            <p>
              CubeDev was born from the realization that the speedcubing
              community needed better tools to track progress, analyze
              performance, and connect with fellow cubers. As a competitive
              cuber myself, I experienced firsthand the limitations of existing
              platforms.
            </p>
            <p>
              Our mission is to provide the most comprehensive, user-friendly,
              and feature-rich speedcubing platform that helps cubers of all
              levels improve their skills, track their progress, and engage with
              the global cubing community.
            </p>
          </div>
        </div>

        {/* Future Vision */}
        <div className="timer-card mb-8">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-6 font-statement">
            Future Vision
          </h2>
          <div className="space-y-4 text-[var(--text-secondary)] font-inter leading-relaxed">
            <p>
              CubeDev is currently in beta, and we're continuously adding new
              features based on community feedback. Our roadmap includes
              advanced training algorithms, AI-powered solve analysis, virtual
              competitions, and much more.
            </p>
            <p>
              The goal is to create the ultimate speedcubing ecosystem where
              every cuber can find the tools they need to pursue their passion
              and achieve their goals.
            </p>
          </div>
        </div>

        {/* Contact Section */}
        <div className="timer-card text-center">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-4 font-statement">
            Get in Touch
          </h2>
          <p className="text-[var(--text-secondary)] font-inter mb-6 max-w-2xl mx-auto">
            Have feedback, suggestions, or just want to chat about cubing? I'd
            love to hear from you! The best way to reach me is through the
            contact form.
          </p>
          <a
            href="/contact"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-all duration-200 font-button"
          >
            Contact Me
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
        <Footer />
    </div>
  );
}