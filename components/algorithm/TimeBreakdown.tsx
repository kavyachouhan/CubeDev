"use client";

import { Eye, Zap } from "lucide-react";

interface RecognitionMetrics {
  totalCases: number;
  mastered: number;
  averageRecognitionTime: number;
  averageExecutionTime: number;
  fastestRecognition: number;
  slowestRecognition: number;
  accuracyRate: number;
  improvementRate: number;
}

interface TimeBreakdownProps {
  metrics: RecognitionMetrics;
}

export default function TimeBreakdown({ metrics }: TimeBreakdownProps) {
  const formatTime = (ms: number): string => {
    return (ms / 1000).toFixed(2) + "s";
  };

  const totalTime =
    metrics.averageRecognitionTime + metrics.averageExecutionTime;
  const recognitionPercentage =
    totalTime > 0 ? (metrics.averageRecognitionTime / totalTime) * 100 : 0;
  const executionPercentage =
    totalTime > 0 ? (metrics.averageExecutionTime / totalTime) * 100 : 0;

  const breakdowns = [
    {
      icon: Eye,
      bg: "bg-blue-500/10",
      text: "text-blue-500 dark:text-blue-400",
      barColor: "bg-blue-500",
      label: "Recognition Time",
      value: metrics.averageRecognitionTime,
      percentage: recognitionPercentage,
    },
    {
      icon: Zap,
      bg: "bg-cyan-500/10",
      text: "text-cyan-500 dark:text-cyan-400",
      barColor: "bg-cyan-500",
      label: "Execution Time",
      value: metrics.averageExecutionTime,
      percentage: executionPercentage,
    },
  ];

  return (
    <div className="timer-card">
      <h3 className="text-lg font-bold text-(--text-primary) font-statement mb-6">
        Time Breakdown
      </h3>
      <div className="space-y-5">
        {breakdowns.map((item) => (
          <div key={item.label}>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-lg ${item.bg}`}>
                  <item.icon className={`w-4 h-4 ${item.text}`} />
                </div>
                <span className="text-sm text-(--text-secondary)">
                  {item.label}
                </span>
              </div>
              <span className="text-sm font-semibold text-(--text-primary) font-statement">
                {formatTime(item.value)} ({item.percentage.toFixed(0)}%)
              </span>
            </div>
            <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
              <div
                className={`h-full ${item.barColor} transition-all duration-300`}
                style={{ width: `${Math.min(item.percentage, 100)}%` }}
              />
            </div>
          </div>
        ))}

        <div className="pt-4 mt-4 border-t border-(--border)">
          <div className="flex justify-between items-center p-3 rounded-lg bg-(--surface-elevated)">
            <span className="text-sm font-semibold text-(--text-primary)">
              Total Average
            </span>
            <span className="text-lg font-bold text-(--primary) font-statement">
              {formatTime(totalTime)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}