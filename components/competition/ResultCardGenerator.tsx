"use client";

import { useState, useRef } from "react";
import {
  FileText,
  Download,
  Share2,
  Copy,
  Check,
  Trophy,
  Calendar,
  MapPin,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { WCA_EVENTS, WCACompetition } from "./CompetitionSimulator";
import { formatTime } from "@/lib/stats-utils";

interface ResultCardGeneratorProps {
  competition: WCACompetition | null;
  eventId: string;
  results: number[];
}

export default function ResultCardGenerator({
  competition,
  eventId,
  results,
}: ResultCardGeneratorProps) {
  const [copied, setCopied] = useState(false);
  const [competitorName, setCompetitorName] = useState("");
  const [roundName, setRoundName] = useState("First Round");
  const cardRef = useRef<HTMLDivElement>(null);

  const event = WCA_EVENTS.find((e) => e.id === eventId);

  // Calculate statistics
  const calculateStats = () => {
    if (results.length === 0) return null;

    const sorted = [...results].sort((a, b) => a - b);
    const best = sorted[0];
    const worst = sorted[sorted.length - 1];

    // Calculate average (excluding best and worst if 5 solves)
    let average = 0;
    if (results.length >= 5) {
      const trimmed = sorted.slice(1, -1);
      average = trimmed.reduce((a, b) => a + b, 0) / trimmed.length;
    } else if (results.length === 3) {
      average = results.reduce((a, b) => a + b, 0) / results.length;
    }

    return { best, worst, average };
  };

  const stats = calculateStats();

  // Copy results to clipboard
  const copyResults = () => {
    if (!competition || !stats) return;

    const text = `
${competition.name} - ${event?.name || eventId}
Round: ${roundName}
Competitor: ${competitorName || "Anonymous"}
Date: ${new Date().toLocaleDateString()}

Times: ${results.map(formatTime).join(", ")}
Best: ${formatTime(stats.best)}
Average: ${stats.average > 0 ? formatTime(stats.average) : "N/A"}
    `.trim();

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Download as image (simplified - would need html2canvas in production)
  const downloadCard = async () => {
    if (!cardRef.current) return;

    // In a real implementation, you'd use html2canvas
    // For now, we'll just copy the text
    copyResults();
  };

  if (!competition) {
    return (
      <div className="timer-card text-center py-12">
        <FileText className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          No Results Yet
        </h3>
        <p className="text-[var(--text-muted)] mb-2">
          Complete a simulation to generate your WCA-style result card.
        </p>
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="timer-card text-center py-12">
        <Trophy className="w-16 h-16 text-[var(--text-muted)] mx-auto mb-4" />
        <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
          Complete a Simulation First
        </h3>
        <p className="text-[var(--text-muted)]">
          Your simulation results will appear here as a WCA-style result card.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Card Customization */}
      <div className="timer-card">
        <h3 className="font-bold text-[var(--text-primary)] mb-4">
          Customize Your Card
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">
              Competitor Name
            </label>
            <input
              type="text"
              value={competitorName}
              onChange={(e) => setCompetitorName(e.target.value)}
              placeholder="Your name"
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            />
          </div>
          <div>
            <label className="text-sm text-[var(--text-secondary)] block mb-2">
              Round Name
            </label>
            <select
              value={roundName}
              onChange={(e) => setRoundName(e.target.value)}
              className="w-full px-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="First Round">First Round</option>
              <option value="Second Round">Second Round</option>
              <option value="Semi Final">Semi Final</option>
              <option value="Final">Final</option>
            </select>
          </div>
        </div>
      </div>

      {/* Result Card Preview */}
      <div
        ref={cardRef}
        className="timer-card bg-[var(--surface)] border-2 border-[var(--primary)]/30"
      >
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[var(--border)] pb-4 mb-4">
          <div>
            <h2 className="text-xl font-bold text-[var(--text-primary)]">
              {competition.name}
            </h2>
            <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(competition.start_date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {competition.city}, {competition.country_iso2}
              </span>
            </div>
          </div>
          {event && (
            <div className="flex items-center gap-2 px-3 py-2 bg-[var(--surface-elevated)] rounded-lg">
              <Image src={event.icon} alt={event.name} width={24} height={24} />
              <span className="font-medium text-[var(--text-primary)]">
                {event.name}
              </span>
            </div>
          )}
        </div>

        {/* Competitor Info */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">
              Competitor
            </div>
            <div className="font-medium text-[var(--text-primary)]">
              {competitorName || "Anonymous"}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--text-muted)] mb-1">Round</div>
            <div className="font-medium text-[var(--text-primary)]">
              {roundName}
            </div>
          </div>
        </div>

        {/* Times */}
        <div className="mb-6">
          <div className="text-xs text-[var(--text-muted)] mb-2">
            Solve Times
          </div>
          <div className="flex flex-wrap gap-2">
            {results.map((time, idx) => {
              const isBest = stats && time === stats.best;
              const isWorst =
                stats && time === stats.worst && results.length >= 5;
              return (
                <div
                  key={idx}
                  className={`px-4 py-2 rounded-lg font-mono ${
                    isBest
                      ? "bg-[var(--success)]/10 text-[var(--success)] border border-[var(--success)]/30"
                      : isWorst
                        ? "bg-[var(--error)]/10 text-[var(--error)] border border-[var(--error)]/30"
                        : "bg-[var(--surface-elevated)] text-[var(--text-primary)]"
                  }`}
                >
                  <span className="text-xs text-[var(--text-muted)] mr-2">
                    {idx + 1}.
                  </span>
                  {formatTime(time)}
                </div>
              );
            })}
          </div>
        </div>

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-[var(--border)]">
            <div className="text-center p-3 bg-[var(--success)]/5 rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                Best Single
              </div>
              <div className="text-xl font-mono font-bold text-[var(--success)]">
                {formatTime(stats.best)}
              </div>
            </div>
            <div className="text-center p-3 bg-[var(--primary)]/5 rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                {results.length >= 5 ? "Average" : "Mean"}
              </div>
              <div className="text-xl font-mono font-bold text-[var(--primary)]">
                {stats.average > 0 ? formatTime(stats.average) : "N/A"}
              </div>
            </div>
            <div className="text-center p-3 bg-[var(--surface-elevated)] rounded-lg sm:col-span-1 col-span-2">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                Worst Single
              </div>
              <div className="text-xl font-mono font-bold text-[var(--text-secondary)]">
                {formatTime(stats.worst)}
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 pt-4 border-t border-[var(--border)] text-center">
          <p className="text-xs text-[var(--text-muted)]">
            Simulated result • Generated by CubeDev Competition Simulator
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-4">
        <button
          onClick={copyResults}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] text-[var(--text-primary)] rounded-lg hover:bg-[var(--border)] transition-colors"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4 text-[var(--success)]" />
              Copied!
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              Copy Results
            </>
          )}
        </button>
        <button
          onClick={downloadCard}
          className="flex items-center gap-2 px-4 py-2 bg-[var(--primary)] text-white rounded-lg hover:bg-[var(--primary-hover)] transition-colors"
        >
          <Download className="w-4 h-4" />
          Download Card
        </button>
      </div>
    </div>
  );
}
