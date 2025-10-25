import Header from "@/components/Header";
import Footer from "@/components/Footer";

export default function PrivacyPage() {
  return (
    <>
      <Header />
      <main className="flex-1 bg-[var(--background)]">
        <div className="container-responsive py-12 md:py-16">
          <div className="max-w-4xl mx-auto">
            <div className="timer-card">
              <div className="mb-8">
                <h1 className="text-3xl font-bold text-primary mb-2">
                  Privacy <span className="text-blue">Policy</span>
                </h1>
                <p className="text-muted-foreground">
                  Last updated: October 25, 2025
                </p>
              </div>

              <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6">
                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Information We Collect
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    CubeDev collects information to provide better services to
                    our users. We collect information in the following ways:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>
                      <strong>Account Information:</strong> When you sign in
                      with World Cube Association (WCA), we collect your WCA ID,
                      name, email, profile picture, country, gender, WCA User
                      ID, and competition data.
                    </li>
                    <li>
                      <strong>Usage Data:</strong> We collect information about
                      your solving sessions, times, and practice activities
                      within CubeDev.
                    </li>
                    <li>
                      <strong>Timer Sessions and Solves:</strong> We store your
                      timer sessions including session names, cube events, solve
                      times, scrambles, penalties, phase splits, timer modes
                      (normal, manual, stackmat), comments, and tags to provide
                      personalized statistics and insights.
                    </li>
                    <li>
                      <strong>Challenge Room Data:</strong> When you participate
                      in challenge rooms, we collect your room participation
                      data, solve times, rankings, and completion status.
                    </li>
                    <li>
                      <strong>Preferences and Settings:</strong> We store your
                      theme preferences (dark/light mode), color scheme choices,
                      timer customization settings, accessibility options, and
                      privacy preferences.
                    </li>
                    <li>
                      <strong>Analytics Data:</strong> We use Vercel Analytics
                      to collect anonymized usage data including page views,
                      navigation patterns, and performance metrics to improve
                      our service. This data does not include personally
                      identifiable information.
                    </li>
                    <li>
                      <strong>Contact Messages:</strong> When you contact us
                      through our contact form, we collect your name, email,
                      subject, message content, and optionally your WCA ID.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    How We Use Your Information
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    We use the information we collect to:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>
                      Provide and maintain our speedcubing tools and services
                    </li>
                    <li>
                      Analyze your solving patterns to provide personalized
                      training recommendations and detailed performance
                      statistics
                    </li>
                    <li>
                      Display your competition history and personal records
                    </li>
                    <li>
                      Enable participation in challenge rooms and track
                      leaderboards
                    </li>
                    <li>
                      Remember your preferences and customization settings
                    </li>
                    <li>
                      Communicate with you about service updates and features
                    </li>
                    <li>
                      Improve our platform through anonymized usage analytics
                    </li>
                    <li>Ensure the security and integrity of our platform</li>
                    <li>Respond to your support requests and inquiries</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Data Sharing and Disclosure
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    We do not sell, trade, or otherwise transfer your personal
                    information to third parties. We may share your information
                    only in the following circumstances:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>With your explicit consent</li>
                    <li>
                      With Convex (our database provider) and Vercel (our
                      hosting and analytics provider) who are bound by strict
                      data protection agreements
                    </li>
                    <li>
                      To comply with legal obligations or protect our rights
                    </li>
                    <li>In connection with a business transfer or merger</li>
                    <li>
                      To provide services you have requested through third-party
                      integrations
                    </li>
                  </ul>
                  <p className="text-foreground leading-relaxed mt-4">
                    <strong>Third-Party Services:</strong> We use Vercel
                    Analytics for website performance monitoring. Vercel
                    Analytics collects anonymized usage data and does not track
                    personally identifiable information. All data is stored
                    securely and complies with GDPR and privacy regulations.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Data Security
                  </h2>
                  <p className="text-foreground leading-relaxed">
                    We implement appropriate security measures to protect your
                    personal information against unauthorized access,
                    alteration, disclosure, or destruction. However, no internet
                    transmission is completely secure, and we cannot guarantee
                    absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Data Retention
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    We retain your information for as long as your account is
                    active or as needed to provide services. You may request
                    deletion of your account and associated data at any time
                    through your account settings.
                  </p>
                  <p className="text-foreground leading-relaxed">
                    Specifically, we retain: solving session data, timer
                    records, challenge room participations, and user preferences
                    for as long as your account remains active. Upon account
                    deletion, all personal data is permanently removed from our
                    database, though anonymized analytics data may be retained
                    for service improvement purposes.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Your Rights
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    You have the right to:
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>Access and review your personal information</li>
                    <li>Request correction of inaccurate data</li>
                    <li>Request deletion of your account and data</li>
                    <li>Export your solving data and statistics</li>
                    <li>Withdraw consent for data processing</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Cookies and Tracking
                  </h2>
                  <p className="text-foreground leading-relaxed mb-4">
                    CubeDev uses cookies and similar technologies to enhance
                    your experience, analyze usage patterns, and maintain your
                    session. You can control cookie preferences through your
                    browser settings.
                  </p>
                  <p className="text-foreground leading-relaxed mb-4">
                    <strong>Types of cookies we use:</strong>
                  </p>
                  <ul className="space-y-2 text-foreground ml-4">
                    <li>
                      <strong>Essential Cookies:</strong> Required for
                      authentication and core functionality
                    </li>
                    <li>
                      <strong>Preference Cookies:</strong> Store your theme,
                      color scheme, and customization settings
                    </li>
                    <li>
                      <strong>Analytics Cookies:</strong> Vercel Analytics uses
                      cookies to collect anonymized usage data to help us
                      understand how users interact with our platform
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Changes to This Policy
                  </h2>
                  <p className="text-foreground leading-relaxed">
                    We may update this Privacy Policy from time to time. We will
                    notify you of any changes by posting the new policy on this
                    page and updating the "Last updated" date above.
                  </p>
                </section>

                <section>
                  <h2 className="text-xl font-semibold text-primary mb-3">
                    Contact Us
                  </h2>
                  <p className="text-foreground leading-relaxed">
                    If you have any questions about this Privacy Policy, please
                    contact us at{" "}
                    <a href="/contact" className="text-primary underline">
                      our contact page
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