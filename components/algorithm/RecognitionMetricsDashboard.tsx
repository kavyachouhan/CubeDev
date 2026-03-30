"use client";

import { useMemo } from "react";
import { Clock, Eye, Zap, TrendingUp, Award, Target } from "lucide-react";

interface RecognitionMetrics {
  totalCases: number;
  mastered: number;
  averageRecognitionTime: number;
  averageExecutionTime: number;
  fastestRecognition: number;
  slowestRecognition: number;
  accuracyRate: number;
  improvementRate: number; // percentage improvement over time
}

interface RecognitionMetricsDashboardProps {
  metrics: RecognitionMetrics;
  recentSessions?: Array<{
    _id: string;
    sessionType: "recognition" | "execution" | "drill" | "mixed";
    casesReviewed: number;
    averageRecognitionTime?: number;
    averageExecutionTime?: number;
    accuracyRate: number;
    duration: number;
    createdAt: number;
  }>;
}

// Recognition Metrics Dashboard Component
export default function RecognitionMetricsDashboard({
  metrics,
  recentSessions = [],
}: RecognitionMetricsDashboardProps) {
  // Calculate trends from recent sessions
  const trends = useMemo(() => {
    if (recentSessions.length < 2) {
      return { recognitionTrend: 0, accuracyTrend: 0 };
    }

    const recent = recentSessions.slice(0, 5);
    const older = recentSessions.slice(5, 10);

    const avgRecentRecognition =
      recent.reduce((sum, s) => sum + (s.averageRecognitionTime || 0), 0) /
      recent.length;
    const avgOlderRecognition =
      older.length > 0
        ? older.reduce((sum, s) => sum + (s.averageRecognitionTime || 0), 0) /
          older.length
        : avgRecentRecognition;

    const avgRecentAccuracy =
      recent.reduce((sum, s) => sum + s.accuracyRate, 0) / recent.length;
    const avgOlderAccuracy =
      older.length > 0
        ? older.reduce((sum, s) => sum + s.accuracyRate, 0) / older.length
        : avgRecentAccuracy;

    const recognitionTrend =
      avgOlderRecognition > 0
        ? ((avgOlderRecognition - avgRecentRecognition) / avgOlderRecognition) *
          100
        : 0;
    const accuracyTrend = avgRecentAccuracy - avgOlderAccuracy;

    return { recognitionTrend, accuracyTrend };
  }, [recentSessions]);

  const formatTime = (ms: number): string => {
    return (ms / 1000).toFixed(2) + "s";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-(--text-primary) font-statement mb-2">
          Recognition Analytics
        </h2>
        <p className="text-(--text-muted)">
          Track your pattern recognition speed and accuracy over time
        </p>
      </div>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {/* Average Recognition Time */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Eye className="w-4 h-4 text-blue-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-blue-500 font-statement">
            {formatTime(metrics.averageRecognitionTime)}
          </div>
          <div className="text-xs text-(--text-muted) mt-1">
            Avg Recognition
          </div>
          {trends.recognitionTrend !== 0 && (
            <div
              className={`text-xs mt-1 ${
                trends.recognitionTrend > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {trends.recognitionTrend > 0 ? "↓" : "↑"}{" "}
              {Math.abs(trends.recognitionTrend).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Fastest Recognition */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Zap className="w-4 h-4 text-green-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-green-500 font-statement">
            {formatTime(metrics.fastestRecognition)}
          </div>
          <div className="text-xs text-(--text-muted) mt-1">Fastest</div>
        </div>

        {/* Slowest Recognition */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-orange-500/10 rounded-lg">
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-orange-500 font-statement">
            {formatTime(metrics.slowestRecognition)}
          </div>
          <div className="text-xs text-(--text-muted) mt-1">Slowest</div>
        </div>

        {/* Accuracy Rate */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Target className="w-4 h-4 text-purple-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-purple-500 font-statement">
            {metrics.accuracyRate.toFixed(0)}%
          </div>
          <div className="text-xs text-(--text-muted) mt-1">Accuracy</div>
          {trends.accuracyTrend !== 0 && (
            <div
              className={`text-xs mt-1 ${
                trends.accuracyTrend > 0 ? "text-green-500" : "text-red-500"
              }`}
            >
              {trends.accuracyTrend > 0 ? "↑" : "↓"}{" "}
              {Math.abs(trends.accuracyTrend).toFixed(1)}%
            </div>
          )}
        </div>

        {/* Execution Speed */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-cyan-500/10 rounded-lg">
              <TrendingUp className="w-4 h-4 text-cyan-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-cyan-500 font-statement">
            {formatTime(metrics.averageExecutionTime)}
          </div>
          <div className="text-xs text-(--text-muted) mt-1">
            Avg Execution
          </div>
        </div>

        {/* Mastery Progress */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-2 bg-yellow-500/10 rounded-lg">
              <Award className="w-4 h-4 text-yellow-500" />
            </div>
          </div>
          <div className="text-xl font-bold text-yellow-500 font-statement">
            {metrics.mastered}/{metrics.totalCases}
          </div>
          <div className="text-xs text-(--text-muted) mt-1">Mastered</div>
          <div className="text-xs text-(--text-muted) mt-1">
            {((metrics.mastered / metrics.totalCases) * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {/* Recognition vs Execution Comparison */}
      <div className="timer-card">
        <h3 className="text-lg font-bold text-(--text-primary) font-statement mb-4">
          Recognition vs Execution
        </h3>
        <div className="space-y-3">
          {/* Recognition Time Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-(--text-secondary)">
                Recognition Time
              </span>
              <span className="text-sm font-mono text-(--text-primary) font-statement">
                {formatTime(metrics.averageRecognitionTime)}
              </span>
            </div>
            <div className="h-3 bg-(--surface-elevated) rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (metrics.averageRecognitionTime /
                      (metrics.averageRecognitionTime +
                        metrics.averageExecutionTime)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Execution Time Bar */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm text-(--text-secondary)">
                Execution Time
              </span>
              <span className="text-sm font-mono text-(--text-primary) font-statement">
                {formatTime(metrics.averageExecutionTime)}
              </span>
            </div>
            <div className="h-3 bg-(--surface-elevated) rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 transition-all duration-300"
                style={{
                  width: `${Math.min(
                    (metrics.averageExecutionTime /
                      (metrics.averageRecognitionTime +
                        metrics.averageExecutionTime)) *
                      100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>

          {/* Total Time */}
          <div className="pt-2 border-t border-(--border)">
            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold text-(--text-primary)">
                Total Average Time
              </span>
              <span className="text-sm font-mono font-bold text-(--primary) font-statement">
                {formatTime(
                  metrics.averageRecognitionTime + metrics.averageExecutionTime
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips for Improvement */}
      <div className="timer-card bg-(--primary)/5 border border-(--primary)/20">
        <h3 className="text-lg font-bold text-(--text-primary) font-statement mb-3">
          💡 Improvement Tips
        </h3>
        <ul className="space-y-2 text-sm text-(--text-secondary)">
          {metrics.averageRecognitionTime > 3000 && (
            <li className="flex items-start gap-2">
              <span className="text-(--primary) mt-0.5">•</span>
              <span>
                Your recognition time is above 3 seconds. Try using Pattern
                Memory mode to build faster visual recognition.
              </span>
            </li>
          )}
          {metrics.accuracyRate < 85 && (
            <li className="flex items-start gap-2">
              <span className="text-(--primary) mt-0.5">•</span>
              <span>
                Focus on accuracy before speed. Review recognition tips for
                cases you struggle with.
              </span>
            </li>
          )}
          {metrics.averageExecutionTime >
            metrics.averageRecognitionTime * 3 && (
            <li className="flex items-start gap-2">
              <span className="text-(--primary) mt-0.5">•</span>
              <span>
                Your execution is much slower than recognition. Practice
                fingertricks in Execution mode.
              </span>
            </li>
          )}
          {metrics.mastered < metrics.totalCases * 0.5 && (
            <li className="flex items-start gap-2">
              <span className="text-(--primary) mt-0.5">•</span>
              <span>
                Keep up with your SRS reviews to master more cases. Consistency
                is key!
              </span>
            </li>
          )}
          {trends.recognitionTrend > 10 && (
            <li className="flex items-start gap-2">
              <span className="text-(--primary) mt-0.5">•</span>
              <span>
                Great progress! You're getting{" "}
                {trends.recognitionTrend.toFixed(0)}% faster at recognition.
                Keep it up!
              </span>
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}