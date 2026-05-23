"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowLeft,
  Trophy,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Award,
  Download,
  Loader2,
  ExternalLink,
  Eye,
  X,
  Flame,
  AlertCircle,
  Search,
  ChevronDown,
  ChevronUp,
  Check,
  Clock,
} from "lucide-react";
import { WCA_CONFIG } from "@/lib/wca-config";
import WCAScorecard from "./WCAScorecard";
import { WCA_EVENTS, WCACompetition } from "./CompetitionBrowser";
import { RoundResult } from "./CompetitionDetail";
import { isCompetitionPast } from "@/lib/date-utils";
import { isWcaIdentifier } from "@/lib/identifier-utils";

interface CompetitionAnalyticsProps {
  competition: WCACompetition;
  results: RoundResult[];
  isPast: boolean;
  onBack: () => void;
}

interface WCAPersonResult {
  eventId: string;
  roundTypeId: string;
  pos: number;
  best: number;
  average: number;
}

interface WCACompetitorResult {
  person: {
    name: string;
    wcaId: string;
    countryIso2: string;
  };
  results: {
    eventId: string;
    best: number;
    average: number;
    ranking: number;
  }[];
}

interface ComparisonResult {
  eventId: string;
  simulatedBest: number;
  simulatedAvg: number;
  actualBest: number;
  actualAvg: number;
  bestDiff: number;
  avgDiff: number;
}

export default function CompetitionAnalytics({
  competition,
  results,
  isPast,
  onBack,
}: CompetitionAnalyticsProps) {
  const [actualResults, setActualResults] =
    useState<WCACompetitorResult | null>(null);
  const [comparisonResults, setComparisonResults] = useState<
    ComparisonResult[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<string>("");
  const [showCompareSection, setShowCompareSection] = useState(true);
  const [scorecardModal, setScorecardModal] = useState<{
    eventId: string;
    roundNumber: number;
    result: RoundResult;
  } | null>(null);

  // Determine if competition is past based on dates
  const competitionIsPast = isCompetitionPast(
    competition.start_date,
    competition.end_date,
  );

  const openScorecardModal = (
    eventId: string,
    roundNumber: number,
    result: RoundResult,
  ) => {
    setScorecardModal({ eventId, roundNumber, result });
  };

  const closeScorecardModal = () => {
    setScorecardModal(null);
  };

  // Group results by event
  const resultsByEvent = results.reduce(
    (acc, result) => {
      if (!acc[result.eventId]) {
        acc[result.eventId] = [];
      }
      acc[result.eventId].push(result);
      return acc;
    },
    {} as Record<string, RoundResult[]>,
  );

  // Calculate overall statistics
  const totalSolves = results.reduce((acc, r) => acc + r.solves.length, 0);
  const totalDNFs = results.reduce(
    (acc, r) => acc + r.solves.filter((s) => s.penalty === "DNF").length,
    0,
  );
  const dnfRate =
    totalSolves > 0 ? ((totalDNFs / totalSolves) * 100).toFixed(1) : "0";

  // Best average and best single across all events
  const bestAverageResult = results
    .filter((r) => r.average !== Infinity)
    .reduce<{
      average: number;
      eventId: string;
    } | null>(
      (best, r) =>
        !best || r.average < best.average
          ? { average: r.average, eventId: r.eventId }
          : best,
      null,
    );
  const bestAverage = bestAverageResult?.average ?? null;
  const bestAverageEvent = bestAverageResult?.eventId
    ? WCA_EVENTS.find((e) => e.id === bestAverageResult.eventId)?.name ||
      bestAverageResult.eventId
    : null;

  const bestSingleResult = results
    .filter((r) => r.best !== Infinity)
    .reduce<{
      best: number;
      eventId: string;
    } | null>(
      (best, r) =>
        !best || r.best < best.best
          ? { best: r.best, eventId: r.eventId }
          : best,
      null,
    );
  const overallBest = bestSingleResult?.best ?? null;
  const bestSingleEvent = bestSingleResult?.eventId
    ? WCA_EVENTS.find((e) => e.id === bestSingleResult.eventId)?.name ||
      bestSingleResult.eventId
    : null;

  // Fetch actual results for a given WCA ID
  const fetchActualResults = async (wcaId: string) => {
    const normalizedWcaId = wcaId.trim().toUpperCase();

    if (!normalizedWcaId) {
      setError("Please enter a valid WCA ID");
      return;
    }

    if (!isWcaIdentifier(normalizedWcaId)) {
      setError(
        "Invalid WCA ID format. Please enter a valid WCA ID (e.g. 2015XXXX01).",
      );
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Fetch all results for the competition
      const response = await fetch(
        `${WCA_CONFIG.API_BASE_URL}/competitions/${competition.id}/results`,
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("Competition results not available yet");
        }
        throw new Error("Failed to fetch competition results");
      }

      const allResults = await response.json();

      // Filter results for the specified WCA ID
      const competitorResults = allResults.filter(
        (r: any) => r.wca_id?.toUpperCase() === normalizedWcaId,
      );

      if (competitorResults.length === 0) {
        throw new Error(`No results found for WCA ID: ${normalizedWcaId}`);
      }

      // Transform results to our format
      const transformedResults: WCACompetitorResult = {
        person: {
          name: competitorResults[0]?.name || normalizedWcaId,
          wcaId: normalizedWcaId,
          countryIso2: competitorResults[0]?.country_iso2 || "",
        },
        results: competitorResults.map((r: any) => ({
          eventId: r.event_id,
          best: r.best,
          average: r.average,
          ranking: r.pos,
        })),
      };

      setActualResults(transformedResults);

      // Generate comparison with simulated results
      const comparisons: ComparisonResult[] = [];

      Object.entries(resultsByEvent).forEach(([eventId, eventResults]) => {
        // Find actual result for this event
        const actualResult = transformedResults.results.find(
          (r) => r.eventId === eventId,
        );

        if (actualResult) {
          // Get best simulated results for this event
          const bestSimBest = Math.min(...eventResults.map((r) => r.best));
          const bestSimAvg = Math.min(
            ...eventResults
              .filter((r) => r.average !== Infinity)
              .map((r) => r.average),
          );

          comparisons.push({
            eventId,
            simulatedBest: bestSimBest,
            simulatedAvg: bestSimAvg === Infinity ? 0 : bestSimAvg,
            actualBest:
              actualResult.best > 0 ? actualResult.best * 10 : Infinity, // WCA times are in centiseconds
            actualAvg:
              actualResult.average > 0 ? actualResult.average * 10 : Infinity,
            bestDiff:
              actualResult.best > 0 ? bestSimBest - actualResult.best * 10 : 0,
            avgDiff:
              actualResult.average > 0 && bestSimAvg !== Infinity
                ? bestSimAvg - actualResult.average * 10
                : 0,
          });
        }
      });

      setComparisonResults(comparisons);
      setCompareMode(true);
    } catch (err) {
      console.error("Failed to fetch results:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch results");
      setActualResults(null);
      setComparisonResults([]);
      setCompareMode(false);
    } finally {
      setIsLoading(false);
    }
  };

  const clearComparison = () => {
    setActualResults(null);
    setComparisonResults([]);
    setCompareMode(false);
    setSelectedCompetitor("");
    setError(null);
  };

  // Format time
  const formatTime = (ms: number): string => {
    if (ms === Infinity || !ms) return "DNF";
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    if (minutes > 0) {
      return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
    }
    return `${remainingSeconds}.${centiseconds.toString().padStart(2, "0")}`;
  };

  // Get event icon
  const getEventIcon = (eventId: string) => {
    const event = WCA_EVENTS.find((e) => e.id === eventId);
    return event?.icon || "/cube-icons/333.svg";
  };

  const getEventName = (eventId: string) => {
    const event = WCA_EVENTS.find((e) => e.id === eventId);
    return event?.name || eventId;
  };

  // Calculate comparison stats
  const getComparisonDisplay = (
    diff: number,
  ): { text: string; color: string; icon: typeof TrendingUp } => {
    if (diff === 0)
      return { text: "Same", color: "text-(--text-muted)", icon: Minus };
    if (diff < 0) {
      // Simulated was faster (better)
      return {
        text: `-${formatTime(Math.abs(diff))}`,
        color: "text-(--success)",
        icon: TrendingUp,
      };
    }
    // Simulated was slower
    return {
      text: `+${formatTime(diff)}`,
      color: "text-(--error)",
      icon: TrendingDown,
    };
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="inline-flex items-center gap-2 text-(--text-muted) hover:text-(--primary)"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competition
        </button>

        {/* Header */}
        <div className="timer-card">
          <div className="flex items-center gap-4">
            <Trophy className="w-10 h-10 text-(--warning)" />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-(--text-primary) font-statement">
                Competition Results
              </h1>
              <p className="text-(--text-muted)">{competition.name}</p>
            </div>
          </div>
        </div>

        {/* Overall Statistics */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="timer-card text-center">
            <Flame className="w-6 h-6 text-(--primary) mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-(--text-primary)">
              {overallBest ? formatTime(overallBest) : "-"}
            </div>
            <div className="text-xs text-(--text-muted)">
              Best Single{bestSingleEvent ? ` (${bestSingleEvent})` : ""}
            </div>
          </div>

          <div className="timer-card text-center">
            <Target className="w-6 h-6 text-(--success) mx-auto mb-2" />
            <div className="text-2xl font-bold font-mono text-(--text-primary)">
              {bestAverage ? formatTime(bestAverage) : "-"}
            </div>
            <div className="text-xs text-(--text-muted)">
              Best Average{bestAverageEvent ? ` (${bestAverageEvent})` : ""}
            </div>
          </div>

          <div className="timer-card text-center">
            <Award className="w-6 h-6 text-(--warning) mx-auto mb-2" />
            <div className="text-2xl font-bold text-(--text-primary)">
              {Object.keys(resultsByEvent).length}
            </div>
            <div className="text-xs text-(--text-muted)">Events Completed</div>
          </div>

          <div className="timer-card text-center">
            <AlertCircle className="w-6 h-6 text-(--error) mx-auto mb-2" />
            <div className="text-2xl font-bold text-(--text-primary)">
              {dnfRate}%
            </div>
            <div className="text-xs text-(--text-muted)">DNF Rate</div>
          </div>
        </div>

        {/* Compare with Actual Results (for past competitions) */}
        {(isPast || competitionIsPast) && (
          <div className="timer-card">
            <button
              onClick={() => setShowCompareSection(!showCompareSection)}
              className="flex items-center justify-between w-full text-left"
            >
              <div className="flex items-center gap-3">
                <div>
                  <h3 className="font-bold text-(--text-primary) font-statement">
                    Compare with Actual Results
                  </h3>
                  <p className="text-xs text-(--text-muted)">
                    See how your simulation compares to real competition
                    performance
                  </p>
                </div>
              </div>
              {showCompareSection ? (
                <ChevronUp className="w-5 h-5 text-(--text-muted)" />
              ) : (
                <ChevronDown className="w-5 h-5 text-(--text-muted)" />
              )}
            </button>

            {showCompareSection && (
              <div className="mt-4 space-y-4">
                {/* Input Section */}
                {!compareMode && (
                  <>
                    <p className="text-sm text-(--text-primary)">
                      Enter a WCA ID to compare your simulation with actual
                      competition results.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
                        <input
                          type="text"
                          value={selectedCompetitor}
                          onChange={(e) =>
                            setSelectedCompetitor(e.target.value.toUpperCase())
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && selectedCompetitor) {
                              fetchActualResults(selectedCompetitor);
                            }
                          }}
                          placeholder="e.g. 2015XXXX01"
                          className="w-full pl-10 pr-4 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-(--text-primary) placeholder:text-(--text-muted) focus:border-(--primary) focus:ring-2 focus:ring-(--primary)/20 outline-none transition-all"
                        />
                      </div>
                      <button
                        onClick={() => fetchActualResults(selectedCompetitor)}
                        disabled={!selectedCompetitor || isLoading}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-(--primary) text-white rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-(--primary-hover) transition-colors"
                      >
                        {isLoading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Search className="w-4 h-4" />
                        )}
                        <span className="sm:inline">Compare</span>
                      </button>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 p-3 bg-(--error)/10 border border-(--error)/20 rounded-lg text-(--error) text-sm">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        <span>{error}</span>
                      </div>
                    )}
                  </>
                )}

                {/* Comparison Results */}
                {compareMode && actualResults && (
                  <div className="space-y-4">
                    {/* Competitor Info Header */}
                    <div className="flex items-center justify-between p-3 bg-(--surface-elevated) rounded-lg border border-(--border)">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-(--success)/10 rounded-full">
                          <Check className="w-4 h-4 text-(--success)" />
                        </div>
                        <div>
                          <div className="font-medium text-(--text-primary)">
                            {actualResults.person.name}
                          </div>
                          <div className="text-xs text-(--text-muted) flex items-center gap-2">
                            <span>{actualResults.person.wcaId}</span>
                            {actualResults.person.countryIso2 && (
                              <span className="px-1.5 py-0.5 bg-(--surface) rounded text-xs">
                                {actualResults.person.countryIso2}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={clearComparison}
                        className="p-2 text-(--text-muted) hover:text-(--error) hover:bg-(--error)/10 rounded-lg transition-colors"
                        title="Clear comparison"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Comparison Results */}
                    {comparisonResults.length > 0 ? (
                      <>
                        {/* Mobile Card View */}
                        <div className="sm:hidden space-y-3">
                          {comparisonResults.map((comp) => {
                            const bestDiff = getComparisonDisplay(
                              comp.bestDiff,
                            );
                            const avgDiff = getComparisonDisplay(comp.avgDiff);

                            return (
                              <div
                                key={comp.eventId}
                                className="p-3 bg-(--surface-elevated) rounded-lg border border-(--border)"
                              >
                                {/* Event Header */}
                                <div className="flex items-center gap-2 mb-3 pb-2 border-b border-(--border)/50">
                                  <Image
                                    src={getEventIcon(comp.eventId)}
                                    alt={getEventName(comp.eventId)}
                                    width={20}
                                    height={20}
                                    className="invert opacity-70"
                                  />
                                  <span className="text-(--text-primary) font-medium">
                                    {getEventName(comp.eventId)}
                                  </span>
                                </div>

                                {/* Results Grid */}
                                <div className="grid grid-cols-2 gap-3">
                                  {/* Simulated */}
                                  <div>
                                    <div className="text-xs text-(--text-muted) mb-1">
                                      Simulated
                                    </div>
                                    <div className="font-mono text-sm">
                                      <div className="text-(--success)">
                                        {formatTime(comp.simulatedBest)}
                                      </div>
                                      <div className="text-(--text-primary)">
                                        {comp.simulatedAvg
                                          ? formatTime(comp.simulatedAvg)
                                          : "-"}
                                      </div>
                                    </div>
                                  </div>

                                  {/* Actual */}
                                  <div>
                                    <div className="text-xs text-(--text-muted) mb-1">
                                      Actual
                                    </div>
                                    <div className="font-mono text-sm">
                                      <div className="text-(--success)">
                                        {comp.actualBest !== Infinity
                                          ? formatTime(comp.actualBest)
                                          : "-"}
                                      </div>
                                      <div className="text-(--text-primary)">
                                        {comp.actualAvg !== Infinity
                                          ? formatTime(comp.actualAvg)
                                          : "-"}
                                      </div>
                                    </div>
                                  </div>
                                </div>

                                {/* Difference */}
                                {(comp.bestDiff !== 0 ||
                                  comp.avgDiff !== 0) && (
                                  <div className="mt-3 pt-2 border-t border-(--border)/50 flex items-center gap-3">
                                    <span className="text-xs text-(--text-muted)">
                                      Diff:
                                    </span>
                                    <div className="flex flex-wrap gap-2">
                                      {comp.bestDiff !== 0 && (
                                        <div
                                          className={`flex items-center gap-1 text-xs font-mono ${bestDiff.color}`}
                                        >
                                          <bestDiff.icon className="w-3 h-3" />
                                          <span>{bestDiff.text}</span>
                                        </div>
                                      )}
                                      {comp.avgDiff !== 0 && (
                                        <div
                                          className={`flex items-center gap-1 text-xs font-mono ${avgDiff.color}`}
                                        >
                                          <avgDiff.icon className="w-3 h-3" />
                                          <span>{avgDiff.text}</span>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Desktop Table View */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-(--border)">
                                <th className="text-left py-3 px-2 text-(--text-muted) font-medium">
                                  Event
                                </th>
                                <th className="text-center py-3 px-2 text-(--text-muted) font-medium">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span>Simulated</span>
                                    <span className="text-xs opacity-60">
                                      Best / Avg
                                    </span>
                                  </div>
                                </th>
                                <th className="text-center py-3 px-2 text-(--text-muted) font-medium">
                                  <div className="flex flex-col items-center gap-0.5">
                                    <span>Actual</span>
                                    <span className="text-xs opacity-60">
                                      Best / Avg
                                    </span>
                                  </div>
                                </th>
                                <th className="text-center py-3 px-2 text-(--text-muted) font-medium">
                                  Difference
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {comparisonResults.map((comp) => {
                                const bestDiff = getComparisonDisplay(
                                  comp.bestDiff,
                                );
                                const avgDiff = getComparisonDisplay(
                                  comp.avgDiff,
                                );

                                return (
                                  <tr
                                    key={comp.eventId}
                                    className="border-b border-(--border)/50 hover:bg-(--surface-elevated)/50 transition-colors"
                                  >
                                    <td className="py-3 px-2">
                                      <div className="flex items-center gap-2">
                                        <Image
                                          src={getEventIcon(comp.eventId)}
                                          alt={getEventName(comp.eventId)}
                                          width={20}
                                          height={20}
                                          className="invert opacity-70"
                                        />
                                        <span className="text-(--text-primary) font-medium">
                                          {getEventName(comp.eventId)}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <div className="flex items-center justify-center gap-2 font-mono text-sm">
                                        <span className="text-(--success)">
                                          {formatTime(comp.simulatedBest)}
                                        </span>
                                        <span className="text-(--text-muted)">
                                          /
                                        </span>
                                        <span className="text-(--text-primary)">
                                          {comp.simulatedAvg
                                            ? formatTime(comp.simulatedAvg)
                                            : "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <div className="flex items-center justify-center gap-2 font-mono text-sm">
                                        <span className="text-(--success)">
                                          {comp.actualBest !== Infinity
                                            ? formatTime(comp.actualBest)
                                            : "-"}
                                        </span>
                                        <span className="text-(--text-muted)">
                                          /
                                        </span>
                                        <span className="text-(--text-primary)">
                                          {comp.actualAvg !== Infinity
                                            ? formatTime(comp.actualAvg)
                                            : "-"}
                                        </span>
                                      </div>
                                    </td>
                                    <td className="py-3 px-2 text-center">
                                      <div className="flex flex-col items-center gap-1">
                                        {comp.bestDiff !== 0 && (
                                          <div
                                            className={`flex items-center gap-1 text-xs font-mono ${bestDiff.color}`}
                                          >
                                            <bestDiff.icon className="w-3 h-3" />
                                            <span>{bestDiff.text}</span>
                                          </div>
                                        )}
                                        {comp.avgDiff !== 0 && (
                                          <div
                                            className={`flex items-center gap-1 text-xs font-mono ${avgDiff.color}`}
                                          >
                                            <avgDiff.icon className="w-3 h-3" />
                                            <span>{avgDiff.text}</span>
                                          </div>
                                        )}
                                        {comp.bestDiff === 0 &&
                                          comp.avgDiff === 0 && (
                                            <span className="text-xs text-(--text-muted)">
                                              -
                                            </span>
                                          )}
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-6 text-(--text-muted)">
                        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">
                          No matching events found between your simulation and
                          actual results
                        </p>
                      </div>
                    )}

                    {/* Summary Stats */}
                    {comparisonResults.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
                        <div className="p-3 bg-(--surface-elevated) rounded-lg text-center">
                          <div className="text-lg font-bold text-(--text-primary)">
                            {comparisonResults.length}
                          </div>
                          <div className="text-xs text-(--text-muted)">
                            Events Compared
                          </div>
                        </div>
                        <div className="p-3 bg-(--surface-elevated) rounded-lg text-center">
                          <div className="text-lg font-bold text-(--success)">
                            {
                              comparisonResults.filter((c) => c.bestDiff < 0)
                                .length
                            }
                          </div>
                          <div className="text-xs text-(--text-muted)">
                            Faster Singles
                          </div>
                        </div>
                        <div className="p-3 bg-(--surface-elevated) rounded-lg text-center col-span-2 sm:col-span-1">
                          <div className="text-lg font-bold text-(--success)">
                            {
                              comparisonResults.filter((c) => c.avgDiff < 0)
                                .length
                            }
                          </div>
                          <div className="text-xs text-(--text-muted)">
                            Faster Averages
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Results by Event */}
        <div className="timer-card">
          <h3 className="font-bold text-(--text-primary) mb-4 font-statement">
            Results by Event
          </h3>
          <div className="space-y-4">
            {Object.entries(resultsByEvent).map(([eventId, eventResults]) => {
              const bestResult = eventResults.reduce((best, curr) =>
                curr.average < best.average ? curr : best,
              );
              const finalRound = eventResults.find(
                (r) =>
                  r.roundNumber ===
                  Math.max(...eventResults.map((e) => e.roundNumber)),
              );

              return (
                <div
                  key={eventId}
                  className="p-4 bg-(--surface-elevated) rounded-lg"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src={getEventIcon(eventId)}
                        alt={getEventName(eventId)}
                        width={28}
                        height={28}
                        className="invert opacity-80"
                      />
                      <div>
                        <h4 className="font-medium text-(--text-primary)">
                          {getEventName(eventId)}
                        </h4>
                        <p className="text-xs text-(--text-muted)">
                          {eventResults.length} round
                          {eventResults.length !== 1 ? "s" : ""} completed
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-mono font-bold text-(--primary)">
                        {formatTime(bestResult.average)}
                      </div>
                      <div className="text-xs text-(--text-muted)">
                        Best Average
                      </div>
                    </div>
                  </div>

                  {/* Round Breakdown */}
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {eventResults.map((result) => (
                      <div
                        key={`${eventId}-${result.roundNumber}`}
                        className="p-3 bg-(--surface) rounded-lg border border-(--border)"
                      >
                        <div className="text-xs text-(--text-muted) mb-1">
                          Round {result.roundNumber}
                        </div>
                        <div className="flex justify-between items-baseline">
                          <div className="font-mono text-sm text-(--success)">
                            {formatTime(result.best)}
                          </div>
                          <div className="font-mono text-sm text-(--text-primary)">
                            {formatTime(result.average)}
                          </div>
                        </div>
                        <div className="flex justify-between text-xs text-(--text-muted)">
                          <span>Best</span>
                          <span>Avg</span>
                        </div>
                        {/* View Scorecard Button */}
                        <button
                          onClick={() =>
                            openScorecardModal(
                              eventId,
                              result.roundNumber,
                              result,
                            )
                          }
                          className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1 text-xs text-(--text-secondary) hover:text-(--primary) hover:bg-(--surface-elevated) rounded transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          View Scorecard
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Performance Trends */}
        <div className="timer-card">
          <h3 className="font-bold text-(--text-primary) mb-4 font-statement">
            Performance Analysis
          </h3>

          {/* Solve Distribution */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-(--text-secondary) mb-3">
              Solve Outcomes ({totalSolves} total)
            </h4>
            <div className="flex gap-2">
              <div
                className="h-4 bg-(--success) rounded-l-full"
                style={{
                  width: `${((totalSolves - totalDNFs) / totalSolves) * 100}%`,
                }}
              />
              {totalDNFs > 0 && (
                <div
                  className="h-4 bg-(--error) rounded-r-full"
                  style={{ width: `${(totalDNFs / totalSolves) * 100}%` }}
                />
              )}
            </div>
            <div className="flex justify-between mt-2 text-xs text-(--text-muted)">
              <span>{totalSolves - totalDNFs} successful</span>
              <span>{totalDNFs} DNF</span>
            </div>
          </div>

          {/* Penalties Breakdown */}
          <div>
            <h4 className="text-sm font-medium text-(--text-secondary) mb-3">
              Penalty Breakdown
            </h4>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-(--surface-elevated) rounded-lg">
                <div className="text-xl font-bold text-(--success)">
                  {results.reduce(
                    (acc, r) =>
                      acc +
                      r.solves.filter(
                        (s) => s.penalty === "none" && !s.inspectionViolation,
                      ).length,
                    0,
                  )}
                </div>
                <div className="text-xs text-(--text-muted)">Clean Solves</div>
              </div>
              <div className="p-3 bg-(--surface-elevated) rounded-lg">
                <div className="text-xl font-bold text-(--warning)">
                  {results.reduce(
                    (acc, r) =>
                      acc +
                      r.solves.filter(
                        (s) =>
                          s.penalty === "+2" || s.inspectionViolation === "+2",
                      ).length,
                    0,
                  )}
                </div>
                <div className="text-xs text-(--text-muted)">+2 Penalties</div>
              </div>
              <div className="p-3 bg-(--surface-elevated) rounded-lg">
                <div className="text-xl font-bold text-(--error)">
                  {totalDNFs}
                </div>
                <div className="text-xs text-(--text-muted)">DNFs</div>
              </div>
            </div>
          </div>
        </div>

        {/* Export Options */}
        <div className="flex flex-wrap justify-center gap-3">
          <button
            onClick={() => {
              // Generate CSV export
              const formatSolveTime = (solve: RoundResult["solves"][0]) => {
                const timeStr = (solve.time / 1000).toFixed(2);
                if (solve.penalty === "DNF") return `DNF(${timeStr})`;
                if (solve.penalty === "+2")
                  return `${((solve.time + 2000) / 1000).toFixed(2)}+`;
                return timeStr;
              };

              // CSV escaping
              const escapeCSV = (field: string) => {
                if (
                  field.includes(",") ||
                  field.includes('"') ||
                  field.includes("\n")
                ) {
                  return `"${field.replace(/"/g, '""')}"`;
                }
                return field;
              };

              // Create comprehensive CSV
              const lines: string[] = [];

              // Competition Info Header
              lines.push("COMPETITION SIMULATION RESULTS");
              lines.push("");
              lines.push("Competition Details");
              lines.push(`Name,${escapeCSV(competition.name)}`);
              lines.push(`ID,${competition.id}`);
              lines.push(
                `Location,${escapeCSV(competition.city + ", " + competition.country_iso2)}`,
              );
              lines.push(
                `Dates,${competition.start_date} to ${competition.end_date}`,
              );
              lines.push(`Simulation Date,${new Date().toISOString()}`);
              lines.push("");

              // Summary
              lines.push("Summary");
              lines.push(`Total Events,${Object.keys(resultsByEvent).length}`);
              lines.push(`Total Rounds,${results.length}`);
              lines.push(`Total Solves,${totalSolves}`);
              lines.push(`Successful Solves,${totalSolves - totalDNFs}`);
              lines.push(`DNF Count,${totalDNFs}`);
              lines.push(`DNF Rate,${dnfRate}%`);
              lines.push(
                `Best Single,${overallBest ? (overallBest / 1000).toFixed(2) : "N/A"}`,
              );
              lines.push(
                `Best Average,${bestAverage ? (bestAverage / 1000).toFixed(2) : "N/A"}`,
              );
              lines.push("");

              // Detailed Results
              lines.push("Detailed Results");
              lines.push(
                "Event,Round,Solve #,Time (raw),Display Time,Scramble,Penalty,Inspection Violation",
              );

              results.forEach((r) => {
                r.solves.forEach((s, idx) => {
                  lines.push(
                    [
                      escapeCSV(getEventName(r.eventId)),
                      r.roundNumber.toString(),
                      (idx + 1).toString(),
                      (s.time / 1000).toFixed(2),
                      formatSolveTime(s),
                      escapeCSV(s.scramble),
                      s.penalty,
                      s.inspectionViolation || "none",
                    ].join(","),
                  );
                });
              });

              lines.push("");

              // Round Summary
              lines.push("Round Summary");
              lines.push("Event,Round,Best,Average,Completed At");

              results.forEach((r) => {
                lines.push(
                  [
                    escapeCSV(getEventName(r.eventId)),
                    r.roundNumber.toString(),
                    r.best === Infinity ? "DNF" : (r.best / 1000).toFixed(2),
                    r.average === Infinity
                      ? "DNF"
                      : (r.average / 1000).toFixed(2),
                    r.completedAt,
                  ].join(","),
                );
              });

              const csv = lines.join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `${competition.id}-simulation-results.csv`;
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 border border-(--border) text-(--text-secondary) rounded-lg hover:bg-(--surface-elevated)"
          >
            <Download className="w-4 h-4" />
            Export Results
          </button>

          {competition.url && (
            <a
              href={competition.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 border border-(--border) text-(--text-secondary) rounded-lg hover:bg-(--surface-elevated)"
            >
              <ExternalLink className="w-4 h-4" />
              View on WCA
            </a>
          )}
        </div>
      </div>

      {/* Scorecard Modal */}
      {scorecardModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm"
          onClick={closeScorecardModal}
        >
          <div
            className="relative w-full max-w-lg max-h-[95vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeScorecardModal}
              className="absolute top-2 right-2 z-20 p-2 text-(--text-muted) hover:text-(--text-primary) bg-(--surface) hover:bg-(--surface-elevated) rounded-full transition-colors shadow-lg"
            >
              <X className="w-5 h-5" />
            </button>

            {/* WCA Scorecard */}
            <WCAScorecard
              competition={competition}
              event={WCA_EVENTS.find((e) => e.id === scorecardModal.eventId)!}
              roundNumber={scorecardModal.roundNumber}
              result={scorecardModal.result}
            />
          </div>
        </div>
      )}
    </div>
  );
}