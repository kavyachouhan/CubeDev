import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function TermsPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[var(--background)]">
        <div className="container-responsive py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="timer-card">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary mb-2">
                  Terms of <span className="text-blue">Service</span>
                </h1>
                <p className="text-muted-foreground">
                  Last updated: October 25, 2025
                </p>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8">
                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Acceptance of Terms
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    By accessing and using CubeDev, you accept and agree to be
                    bound by these terms of service. If you do not agree to
                    these terms, please do not use our service.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    These terms may be updated from time to time. Continued use
                    of the service constitutes acceptance of any changes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Eligibility and Account Requirements
                  </h2>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>
                      You must have a valid World Cube Association (WCA) account
                      to use CubeDev
                    </li>
                    <li>
                      You must be at least 13 years old or have parental consent
                    </li>
                    <li>You must provide accurate and truthful information</li>
                    <li>
                      You are responsible for maintaining the security of your
                      account
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Acceptable Use Policy
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    You agree to use CubeDev only for lawful purposes. You may
                    not:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>Submit false solve times or manipulate results</li>
                    <li>Harass, abuse, or harm other users</li>
                    <li>
                      Upload malicious content or attempt to compromise the
                      platform
                    </li>
                    <li>Create multiple accounts to circumvent restrictions</li>
                    <li>Use automated tools or bots without permission</li>
                    <li>Reverse engineer or attempt to extract source code</li>
                    <li>Violate any applicable laws or regulations</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    User Content and Fair Play
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    You retain ownership of all solve times, comments, and data
                    you submit to CubeDev. By submitting content, you grant us
                    permission to store and display this data as part of our
                    service.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    CubeDev is built on trust within the speedcubing community.
                    Submitting false times, using solve assistance, or any form
                    of cheating undermines the platform for everyone. Violations
                    may result in account suspension or permanent ban.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    <strong>Data Storage:</strong> We store your data using
                    Convex, a secure database platform. Your solving sessions,
                    timer records, challenge room participations, and
                    preferences are encrypted and stored securely in compliance
                    with industry standards.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    You can export or delete your data at any time through your
                    account settings. Upon account deletion, all personal data
                    is permanently removed from our systems.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Service Availability
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    CubeDev is currently in beta development. While we strive to
                    provide reliable service:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>
                      The service may occasionally be unavailable for
                      maintenance
                    </li>
                    <li>
                      Features may be added, modified, or removed during
                      development
                    </li>
                    <li>
                      We recommend regular data exports as an additional
                      precaution
                    </li>
                    <li>
                      Beta features may not work perfectly and feedback is
                      appreciated
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Privacy and Data Protection
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    Your privacy is important to us. By using CubeDev, you also
                    agree to our Privacy Policy, which explains how we collect,
                    use, and protect your data.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    <strong>Analytics:</strong> We use Vercel Analytics to
                    collect anonymized usage data to improve our service. This
                    includes page views, navigation patterns, and performance
                    metrics. No personally identifiable information is collected
                    through analytics.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    <strong>Data Processing:</strong> By using CubeDev, you
                    consent to the processing of your data as described in our
                    Privacy Policy, including storage in Convex databases and
                    analytics collection through Vercel Analytics.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    <a href="/privacy" className="text-primary underline">
                      Read our Privacy Policy
                    </a>
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Limitation of Liability
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    CubeDev is provided "as is" without warranties of any kind.
                    To the maximum extent permitted by law:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>
                      We are not liable for damages arising from use of the
                      platform
                    </li>
                    <li>
                      We are not responsible for user-generated content or data
                      loss
                    </li>
                    <li>
                      We are not liable for platform downtime or technical
                      issues
                    </li>
                    <li>
                      Our total liability is limited to the amount paid for the
                      service
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Account Termination
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    Either party may terminate these terms at any time:
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    <strong>You may:</strong> Stop using CubeDev, delete your
                    account, and export your data at any time.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    <strong>We may:</strong> Suspend accounts for terms
                    violations or terminate service with reasonable notice.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Governing Law
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    These terms are governed by applicable laws. Any disputes
                    will be resolved through appropriate legal channels.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    If any part of these terms is found unenforceable, the
                    remaining parts will continue in full effect.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-4">
                    Contact Information
                  </h2>
                  <p className="text-foreground leading-relaxed">
                    If you have questions about these terms of service, please{" "}
                    <a href="/contact" className="text-primary underline">
                      contact us
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}