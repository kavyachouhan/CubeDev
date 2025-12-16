"use client";

import { useRef, useState } from "react";
import { Download, Loader2 } from "lucide-react";
import { WCACompetition } from "./CompetitionBrowser";
import { RoundResult } from "./CompetitionDetail";
import { useUser } from "@/components/UserProvider";
import ShareMenu from "./ShareMenu";

interface WCAEvent {
  id: string;
  name: string;
  icon: string;
}

interface WCAScorecardProps {
  competition: WCACompetition;
  event: WCAEvent;
  roundNumber: number;
  groupNumber?: number;
  result: RoundResult;
  competitorName?: string;
  competitorId?: string;
  wcaId?: string;
}

export default function WCAScorecard({
  competition,
  event,
  roundNumber,
  groupNumber = 1,
  result,
  competitorName,
  competitorId,
  wcaId,
}: WCAScorecardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const { user } = useUser();

  // Get user's name and ID from context if not provided
  const displayName = competitorName || user?.name || "Competitor";
  const displayId = competitorId || user?.wcaId || "SIM001";
  const displayWcaId = wcaId || user?.wcaId;

  // Get user initials for competitor signature
  const getUserInitials = (name: string): string => {
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  const competitorInitials = getUserInitials(displayName);

  // Format time for display
  const formatTime = (ms: number): string => {
    if (ms === Infinity || ms === 0 || isNaN(ms)) return "DNF";
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, "0")}`;
  };

  // Get display time with penalties - shows DNF(time) for DNF solves
  const getDisplayTime = (solve: (typeof result.solves)[0]): string => {
    if (solve.penalty === "DNF") {
      // Show DNF with the actual time in parentheses
      const timeStr = formatTime(solve.time);
      return `DNF(${timeStr})`;
    }

    let time = solve.time;
    let suffix = "";

    if (solve.penalty === "+2") {
      time += 2000;
      suffix = "+";
    }
    if (solve.inspectionViolation === "+2") {
      time += 2000;
      suffix = "+";
    }

    return formatTime(time) + suffix;
  };

  // Handle download as image using modern-screenshot
  const handleDownload = async () => {
    if (!cardRef.current) return;

    setIsDownloading(true);

    try {
      // Use modern-screenshot which handles modern CSS features like oklab
      const { domToPng } = await import("modern-screenshot");

      const dataUrl = await domToPng(cardRef.current, {
        scale: 2,
        quality: 1,
        backgroundColor: "#1a1a2e",
      });

      // Create download link
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = `${competition.name.replace(/\s+/g, "_")}_${event.id}_R${roundNumber}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to generate image:", error);
      // Fallback: copy results as text
      const text = `${competition.name} - ${event.name}\nRound ${roundNumber}\n${displayName}\nBest: ${formatTime(result.best)}\nAverage: ${result.average === Infinity ? "DNF" : formatTime(result.average)}`;
      await navigator.clipboard.writeText(text);
      alert("Image download failed. Results copied to clipboard!");
    } finally {
      setIsDownloading(false);
    }
  };

  // Get time limit based on event
  const getTimeLimit = (eventId: string): string => {
    const timeLimits: Record<string, string> = {
      "333": "10:00",
      "222": "1:00",
      "444": "10:00",
      "555": "10:00",
      "666": "10:00",
      "777": "10:00",
      "333oh": "10:00",
      "333bf": "10:00",
      pyram: "1:00",
      skewb: "1:00",
      sq1: "10:00",
      clock: "10:00",
      minx: "10:00",
    };
    return timeLimits[eventId] || "10:00";
  };

  // Share data for ShareMenu
  const shareData = {
    title: `${event.name} - ${competition.name}`,
    text: `${displayName} achieved ${result.average === Infinity ? "DNF" : formatTime(result.average)} avg in ${event.name} at ${competition.name}!\nBest: ${formatTime(result.best)}\n\nSimulated on CubeDev`,
    url: "https://cubedev.xyz/cube-lab/competitions",
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      {/* WCA Scorecard */}
      <div ref={cardRef} className="timer-card p-4 sm:p-6">
        {/* Header - Competition Name */}
        <div className="text-center border-b border-[var(--border)] pb-3 mb-4">
          <h1 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] tracking-wide">
            {competition.name}
          </h1>
        </div>

        {/* Event and Round Info */}
        <div className="flex flex-wrap justify-between items-start gap-3 mb-4">
          <div className="flex-shrink-0">
            <div className="text-xs text-[var(--text-muted)] mb-1">Event</div>
            <div className="border border-[var(--border)] px-3 py-1.5 bg-[var(--surface-elevated)] rounded-lg inline-block">
              <span className="font-medium text-[var(--text-primary)]">
                {event.name}
              </span>
            </div>
          </div>
          <div className="flex gap-2 sm:gap-3">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1 text-center">
                Round
              </div>
              <div className="border border-[var(--border)] w-9 sm:w-10 h-8 flex items-center justify-center bg-[var(--surface-elevated)] rounded-lg">
                <span className="font-bold text-[var(--text-primary)]">
                  {roundNumber}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1 text-center">
                Group
              </div>
              <div className="border border-[var(--border)] w-9 sm:w-10 h-8 flex items-center justify-center bg-[var(--surface-elevated)] rounded-lg">
                <span className="font-bold text-[var(--text-primary)]">
                  {groupNumber}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Competitor Info */}
        <div className="flex flex-wrap justify-between items-center gap-3 mb-4">
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">ID</div>
              <div className="border border-[var(--border)] px-2 py-1 bg-[var(--surface-elevated)] rounded-lg">
                <span className="font-mono text-sm text-[var(--text-primary)]">
                  {displayId}
                </span>
              </div>
            </div>
            <div>
              <div className="text-xs text-[var(--text-muted)] mb-1">Name</div>
              <div className="border border-[var(--border)] px-3 py-1 bg-[var(--surface-elevated)] rounded-lg">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {displayName}
                </span>
              </div>
            </div>
          </div>
          {displayWcaId && (
            <div className="text-right">
              <div className="text-xs text-[var(--text-muted)]">
                {displayWcaId}
              </div>
            </div>
          )}
        </div>

        {/* Results Table */}
        <div className="border border-[var(--border)] rounded-lg overflow-hidden mb-4">
          {/* Table Header */}
          <div className="grid grid-cols-[40px_1fr_50px_50px] sm:grid-cols-[50px_1fr_60px_60px] bg-[var(--surface-elevated)]">
            <div className="p-2 text-center border-r border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                No.
              </span>
            </div>
            <div className="p-2 text-center border-r border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Result
              </span>
            </div>
            <div className="p-2 text-center border-r border-[var(--border)]">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Judge
              </span>
            </div>
            <div className="p-2 text-center">
              <span className="text-xs font-medium text-[var(--text-muted)]">
                Comp
              </span>
            </div>
          </div>

          {/* Solve Rows */}
          {result.solves.map((solve, idx) => (
            <div
              key={idx}
              className={`grid grid-cols-[40px_1fr_50px_50px] sm:grid-cols-[50px_1fr_60px_60px] ${idx < result.solves.length - 1 ? "border-b border-[var(--border)]" : ""}`}
            >
              {/* Solve Number */}
              <div className="p-2 border-r border-[var(--border)] bg-[var(--surface-elevated)]">
                <div className="flex flex-col items-center">
                  <span className="font-bold text-base sm:text-lg text-[var(--text-primary)]">
                    {idx + 1}
                  </span>
                </div>
              </div>

              {/* Result */}
              <div className="p-2 sm:p-3 border-r border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
                <span
                  className={`font-mono text-lg sm:text-xl font-semibold ${
                    solve.penalty === "DNF"
                      ? "text-[var(--error)]"
                      : solve.penalty === "+2" ||
                          solve.inspectionViolation === "+2"
                        ? "text-[var(--warning)]"
                        : "text-[var(--primary)]"
                  }`}
                >
                  {getDisplayTime(solve)}
                </span>
              </div>

              {/* Judge Signature - CD for CubeDev */}
              <div className="p-2 border-r border-[var(--border)] bg-[var(--surface)] flex items-center justify-center">
                <span
                  className="text-sm text-[var(--text-secondary)]"
                  style={{ fontFamily: "cursive, serif" }}
                >
                  CD
                </span>
              </div>

              {/* Competitor Signature - User Initials */}
              <div className="p-2 bg-[var(--surface)] flex items-center justify-center">
                <span
                  className="text-sm text-[var(--text-secondary)]"
                  style={{ fontFamily: "cursive, serif" }}
                >
                  {competitorInitials}
                </span>
              </div>
            </div>
          ))}

          {/* Extra Attempt Row */}
          <div className="border-t border-[var(--border)]">
            <div className="text-xs text-[var(--text-muted)] p-2 bg-[var(--surface-elevated)]">
              Extra attempt
            </div>
            <div className="grid grid-cols-[40px_1fr_50px_50px] sm:grid-cols-[50px_1fr_60px_60px] border-t border-[var(--border)]">
              <div className="p-2 border-r border-[var(--border)] bg-[var(--surface-elevated)] text-center">
                <span className="text-[var(--text-muted)]">-</span>
              </div>
              <div className="p-2 sm:p-3 border-r border-[var(--border)] bg-[var(--surface)]"></div>
              <div className="p-2 border-r border-[var(--border)] bg-[var(--surface)]"></div>
              <div className="p-2 bg-[var(--surface)]"></div>
            </div>
          </div>
        </div>

        {/* Time Limit */}
        <div className="text-right mb-4">
          <span className="text-sm text-[var(--text-secondary)]">
            Time limit:{" "}
            <strong className="text-[var(--text-primary)]">
              {getTimeLimit(event.id)}
            </strong>
          </span>
        </div>

        {/* Results Summary */}
        <div className="border-t border-[var(--border)] pt-4">
          <div className="grid grid-cols-2 gap-3 sm:gap-4">
            <div className="text-center p-3 sm:p-4 bg-[var(--success)]/10 border border-[var(--success)]/30 rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                Best Single
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[var(--success)]">
                {formatTime(result.best)}
              </div>
            </div>
            <div className="text-center p-3 sm:p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/30 rounded-lg">
              <div className="text-xs text-[var(--text-muted)] mb-1">
                Average
              </div>
              <div className="font-mono text-lg sm:text-xl font-bold text-[var(--primary)]">
                {result.average === Infinity
                  ? "DNF"
                  : formatTime(result.average)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4 p-3 bg-[var(--surface)] rounded-lg border border-[var(--border)]">
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className="flex items-center gap-2 px-4 py-2 text-sm border border-[var(--border)] bg-[var(--surface-elevated)] text-[var(--text-secondary)] rounded-lg hover:bg-[var(--surface)] transition-colors disabled:opacity-50"
        >
          {isDownloading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Download className="w-4 h-4" />
          )}
          Download
        </button>
        <ShareMenu shareData={shareData} />
      </div>
    </div>
  );
}
