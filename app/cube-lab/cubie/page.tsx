import ProtectedRoute from "@/components/ProtectedRoute";
import CubeLabLayout from "@/components/CubeLabLayout";
import {
  TrendingUp,
  MessageSquare,
  Zap,
  Database,
  Sparkles
} from "lucide-react";

export default function Chat() {
  const capabilities = [
    {
      icon: <TrendingUp className="w-6 h-6 text-[var(--primary)]" />,
      title: "Solve Time Analysis",
      description:
        "Share your CubeDev solve times and get detailed analysis of your performance patterns, consistency, and improvement trends over time.",
    },
    {
      icon: <MessageSquare className="w-6 h-6 text-[var(--accent)]" />,
      title: "WCA Questions",
      description:
        "Ask anything about WCA regulations, scoring systems, competition formats, or official records and get instant answers.",
    },
    {
      icon: <Database className="w-6 h-6 text-[var(--success)]" />,
      title: "WCA Live Data",
      description:
        "Query real-time competition results, compare performances, track world rankings, and explore historical competition data.",
    },
    {
      icon: <Zap className="w-6 h-6 text-[var(--warning)]" />,
      title: "Training Insights",
      description:
        "Receive personalized recommendations for algorithms, practice techniques, and improvement strategies based on your solving data.",
    },
  ];

  return (
    <ProtectedRoute>
      <CubeLabLayout activeSection="cubie">
        <div className="p-4 md:p-8">
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-full mb-4">
              <span className="text-sm font-semibold text-[var(--primary)] font-button">
                Coming Soon
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-[var(--text-primary)] mb-4 font-statement">
              Cubie AI Assistant
            </h1>
            <p className="text-lg md:text-xl text-[var(--text-secondary)] max-w-2xl mx-auto font-inter">
              Your intelligent cubing companion powered by advanced AI to help
              you analyze, learn, and improve your speedcubing skills.
            </p>
          </div>

          {/* Capabilities Grid */}
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold text-[var(--text-primary)] mb-6 font-button">
              What Cubie Can Do
            </h2>
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {capabilities.map((capability, index) => (
                <div
                  key={index}
                  className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 hover:border-[var(--primary)] transition-all"
                >
                  <div className="w-12 h-12 bg-[var(--surface)] border border-[var(--border)] rounded-lg flex items-center justify-center mb-4">
                    {capability.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-button">
                    {capability.title}
                  </h3>
                  <p className="text-[var(--text-secondary)] font-inter leading-relaxed">
                    {capability.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Status Message */}
            <div className="bg-[var(--surface-elevated)] border border-[var(--border)] rounded-xl p-6 md:p-8 text-center">
              <Sparkles className="w-12 h-12 text-[var(--primary)] mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-[var(--text-primary)] mb-2 font-button">
                Currently in Development
              </h3>
              <p className="text-[var(--text-secondary)] font-inter mb-4">
                Cubie AI is being carefully crafted to provide the best possible
                experience for cubers. Stay tuned for updates!
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
                <span className="text-sm text-[var(--text-muted)] font-inter">
                  Expected launch: 2-3 weeks
                </span>
              </div>
            </div>
          </div>
        </div>
      </CubeLabLayout>
    </ProtectedRoute>
  );
}

export const metadata = {
  title: "Cubie AI | Cube Lab | CubeDev",
  description: "Cubie AI - Your intelligent speedcubing assistant.",
};