"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import {
  Search,
  Cake,
  Trophy,
  BarChart3,
  Flame,
  Loader2,
  AlertCircle,
  Calendar,
  ArrowUpDown,
  ChevronRight,
  ExternalLink,
  Info,
} from "lucide-react";
import {
  WCA_EVENTS,
  DEPRECATED_EVENTS,
  formatTime,
  calculateKinchEventScore,
  isPersonalRecord,
} from "@/lib/wca-stats-utils";
import { getFromCache, saveToCache } from "@/lib/wca-cache";
import { isWcaIdentifier } from "@/lib/identifier-utils";

type WCAStatsTab = "birthdays" | "kinch" | "sum-of-ranks" | "record-streak";

const VALID_TABS: WCAStatsTab[] = [
  "birthdays",
  "kinch",
  "sum-of-ranks",
  "record-streak",
];

interface CompetitionResult {
  competition_id: string;
  event_id: string;
  best: number;
  average: number;
  pos: number;
}

// ─── Main WCA Stats Component ───────────────────────────────────

export default function WCAStatsPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const tabParam = searchParams.get("tab") as WCAStatsTab | null;
  const activeTab: WCAStatsTab =
    tabParam && VALID_TABS.includes(tabParam) ? tabParam : "birthdays";

  const handleTabChange = (tab: WCAStatsTab) => {
    const params = new URLSearchParams(searchParams.toString());
    if (tab === "birthdays") {
      params.delete("tab");
    } else {
      params.set("tab", tab);
    }
    router.push(pathname + (params.toString() ? "?" + params.toString() : ""));
  };

  const tabs: {
    id: WCAStatsTab;
    label: string;
    shortLabel: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "birthdays",
      label: "WCA Birthdays",
      shortLabel: "Birthdays",
      icon: <Cake className="w-4 h-4" />,
    },
    {
      id: "kinch",
      label: "Kinch Ranks",
      shortLabel: "Kinch",
      icon: <BarChart3 className="w-4 h-4" />,
    },
    {
      id: "sum-of-ranks",
      label: "Sum of Ranks",
      shortLabel: "SoR",
      icon: <ArrowUpDown className="w-4 h-4" />,
    },
    {
      id: "record-streak",
      label: "Record Streak",
      shortLabel: "Streak",
      icon: <Flame className="w-4 h-4" />,
    },
  ];

  return (
    <div className="min-h-screen bg-(--background)">
      <div className="container-responsive py-6 md:py-8">
        {/* Header */}
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-2xl sm:text-3xl md:text-5xl font-bold text-(--text-primary) font-statement">
            WCA <span className="text-(--primary)">Stats</span>
          </h1>
          <p className="text-sm sm:text-base text-(--text-secondary) md:text-lg max-w-2xl mx-auto mt-2 md:mt-3 font-inter">
            Explore World Cube Association statistics
          </p>
        </div>

        {/* Tab Navigation */}
        <div className="grid grid-cols-4 border-b border-(--border) mb-6 md:mb-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center justify-center gap-1.5 sm:gap-2 px-2 sm:px-4 py-3 text-xs sm:text-sm font-medium whitespace-nowrap transition-all duration-200 font-button border-b-2 -mb-px ${
                activeTab === tab.id
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border)"
              }`}
            >
              {tab.icon}
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === "birthdays" && <WCABirthdays />}
        {activeTab === "kinch" && <KinchRanks />}
        {activeTab === "sum-of-ranks" && <SumOfRanks />}
        {activeTab === "record-streak" && <RecordStreak />}
      </div>
    </div>
  );
}

// WCA ID Search Component

function WCAIdSearch({
  onSearch,
  isLoading,
  placeholder = "e.g. 2015XXXX01",
}: {
  onSearch: (wcaId: string) => void;
  isLoading: boolean;
  placeholder?: string;
}) {
  const [inputValue, setInputValue] = useState("");
  const [validationError, setValidationError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim().toUpperCase();

    if (!trimmed) {
      return;
    }

    if (!isWcaIdentifier(trimmed)) {
      setValidationError(
        "Use format 2015XXXX01 (4 digits + 4 letters + 2 digits).",
      );
      return;
    }

    setValidationError(null);
    onSearch(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="timer-card mb-6">
      <label className="block text-sm font-medium text-(--text-secondary) font-inter mb-2">
        WCA ID
      </label>
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
          <input
            type="text"
            placeholder={placeholder}
            value={inputValue}
            onChange={(e) => {
              setInputValue(e.target.value.toUpperCase());
              if (validationError) {
                setValidationError(null);
              }
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-(--surface-elevated) border border-(--border) rounded-lg text-sm text-(--text-primary) placeholder-(--text-muted) focus:outline-none focus:border-(--primary) transition-colors font-mono"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading || !inputValue.trim()}
          className="w-full sm:w-auto px-5 py-2.5 bg-(--primary) hover:bg-(--primary-hover) text-white font-semibold rounded-lg transition-all duration-200 font-button text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin mx-auto" />
          ) : (
            "Look Up"
          )}
        </button>
      </div>
      {validationError ? (
        <p className="mt-2 text-xs text-(--warning) font-inter">
          {validationError}
        </p>
      ) : (
        <p className="mt-2 text-xs text-(--text-muted) font-inter">
          Format: 2015XXXX01
        </p>
      )}
    </form>
  );
}

// ─── Error Display Component ────────────────────────────────────

function ErrorDisplay({ message }: { message: string }) {
  return (
    <div className="timer-card text-center py-6 sm:py-8">
      <AlertCircle className="w-10 h-10 text-(--warning) mx-auto mb-3" />
      <h3 className="text-base font-semibold text-(--text-primary) mb-1 font-statement">
        Something went wrong
      </h3>
      <p className="text-sm text-(--text-secondary) font-inter">{message}</p>
    </div>
  );
}

// ─── Info Card Component ────────────────────────────────────────

function InfoCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="timer-card mb-4 sm:mb-6">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left"
      >
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary) shrink-0" />
          <h3 className="text-sm sm:text-base font-semibold text-(--text-primary) font-statement">
            {title}
          </h3>
        </div>
        <ChevronRight
          className={`w-4 h-4 sm:w-5 sm:h-5 text-(--text-muted) transition-transform duration-200 shrink-0 ${
            isOpen ? "rotate-90" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="mt-3 pt-3 border-t border-(--border) text-(--text-secondary) font-inter space-y-2 sm:space-y-3 text-xs sm:text-sm leading-relaxed">
          {children}
        </div>
      )}
    </div>
  );
}

// ─── WCA Birthdays ──────────────────────────────────────────────

function WCABirthdays() {
  const [wcaId, setWcaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personData, setPersonData] = useState<any>(null);
  const [birthdayInfo, setBirthdayInfo] = useState<{
    firstComp: string;
    firstCompName: string;
    firstCompDate: string;
    wcaAge: number;
  } | null>(null);

  const searchPerson = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setBirthdayInfo(null);
    setWcaId(id);

    try {
      const cacheKey = `wca_birthday_${id}`;
      const cached = getFromCache<any>(cacheKey);

      if (cached) {
        setPersonData(cached.personData);
        setBirthdayInfo(cached.birthdayInfo);
        setIsLoading(false);
        return;
      }

      // Fetch person data
      const personRes = await fetch(
        `https://www.worldcubeassociation.org/api/v0/persons/${id}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
          },
        },
      );

      if (!personRes.ok) {
        throw new Error(
          personRes.status === 404
            ? "WCA ID not found. Please check and try again."
            : "Failed to fetch WCA data.",
        );
      }

      const data = await personRes.json();
      setPersonData(data);

      // Fetch competition history to find first competition
      const resultsRes = await fetch(
        `https://www.worldcubeassociation.org/api/v0/persons/${id}/results`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
          },
        },
      );

      if (resultsRes.ok) {
        const results = await resultsRes.json();

        // Group results by competition and find earliest
        const competitionIds = new Set<string>();
        if (Array.isArray(results)) {
          results.forEach((r: any) => competitionIds.add(r.competition_id));
        }

        // Fetch ALL competition details in batches to reliably find the earliest
        const compIds = Array.from(competitionIds);
        let firstComp: any = null;
        let earliestDate = "9999-99-99";
        const batchSize = 10;

        for (let i = 0; i < compIds.length; i += batchSize) {
          const batch = compIds.slice(i, i + batchSize);
          const promises = batch.map(async (compId) => {
            try {
              const compRes = await fetch(
                `https://www.worldcubeassociation.org/api/v0/competitions/${compId}`,
                {
                  headers: {
                    Accept: "application/json",
                    "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
                  },
                },
              );
              if (compRes.ok) {
                return await compRes.json();
              }
            } catch {
              // Continue
            }
            return null;
          });

          const comps = await Promise.all(promises);
          for (const comp of comps) {
            if (comp && comp.start_date && comp.start_date < earliestDate) {
              earliestDate = comp.start_date;
              firstComp = comp;
            }
          }
        }

        if (firstComp) {
          const year = new Date().getFullYear();
          const compYear = parseInt(earliestDate.substring(0, 4));
          const wcaAge = year - compYear;

          const info = {
            firstComp: firstComp.id,
            firstCompName: firstComp.name || firstComp.id,
            firstCompDate: earliestDate,
            wcaAge,
          };

          setBirthdayInfo(info);
          saveToCache(
            cacheKey,
            { personData: data, birthdayInfo: info },
            6 * 60 * 60 * 1000,
          );
        }
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div>
      <InfoCard title="What is a WCA Birthday?">
        <p>
          A WCA Birthday is the anniversary of a competitor{"'s"} first World
          Cube Association competition. It marks the day they officially entered
          the world of competitive speedcubing.
        </p>
        <p>
          Search for any WCA ID to find out when they first competed, which
          competition it was, and how many years they{"'ve"} been competing.
        </p>
      </InfoCard>

      <WCAIdSearch
        onSearch={searchPerson}
        isLoading={isLoading}
        placeholder="e.g. 2015XXXX01"
      />

      {error && <ErrorDisplay message={error} />}

      {/* Results */}
      {birthdayInfo && personData && (
        <div className="timer-card mb-6">
          <div className="flex flex-col items-center text-center">
            <Cake className="w-10 h-10 text-(--primary) mb-3" />
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement mb-1">
              {personData.person?.name}
            </h2>
            <p className="text-(--text-muted) font-mono text-xs sm:text-sm mb-5">
              {wcaId}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full">
              <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border) text-center">
                <Calendar className="w-5 h-5 text-(--primary) mx-auto mb-1.5" />
                <div className="text-xs text-(--text-muted) font-inter mb-0.5">
                  First Competition
                </div>
                <div className="text-sm font-semibold text-(--text-primary) font-mono">
                  {birthdayInfo.firstCompDate}
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border) text-center">
                <Trophy className="w-5 h-5 text-(--primary) mx-auto mb-1.5" />
                <div className="text-xs text-(--text-muted) font-inter mb-0.5">
                  Competition
                </div>
                <div className="text-sm font-semibold text-(--text-primary) font-inter wrap-break-word">
                  {birthdayInfo.firstCompName}
                </div>
              </div>

              <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border) text-center">
                <Cake className="w-5 h-5 text-(--primary) mx-auto mb-1.5" />
                <div className="text-xs text-(--text-muted) font-inter mb-0.5">
                  WCA Age
                </div>
                <div className="text-xl sm:text-2xl font-bold text-(--primary) font-mono">
                  {birthdayInfo.wcaAge}
                </div>
                <div className="text-xs text-(--text-muted) font-inter">
                  years
                </div>
              </div>
            </div>

            <a
              href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 mt-5 text-sm text-(--primary) hover:underline font-inter"
            >
              View on WCA
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && !birthdayInfo && (
        <div className="timer-card text-center py-8 sm:py-12">
          <Cake className="w-12 h-12 sm:w-16 sm:h-16 text-(--text-muted) mx-auto mb-3" />
          <h3 className="text-base font-semibold text-(--text-primary) mb-1.5 font-statement">
            Find a WCA Birthday
          </h3>
          <p className="text-sm text-(--text-secondary) font-inter max-w-md mx-auto">
            Enter a WCA ID to discover when a competitor first competed.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Kinch Ranks ────────────────────────────────────────────────

function KinchRanks() {
  const [wcaId, setWcaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personData, setPersonData] = useState<any>(null);
  const [kinchScores, setKinchScores] = useState<
    { eventId: string; score: number; result: string }[]
  >([]);
  const [overallScore, setOverallScore] = useState<number>(0);
  const [worldRecords, setWorldRecords] = useState<Record<string, number>>({});

  const searchPerson = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setKinchScores([]);
    setOverallScore(0);
    setWcaId(id);

    try {
      const cacheKey = `wca_kinch_${id}`;
      const cached = getFromCache<any>(cacheKey);

      if (cached) {
        setPersonData(cached.personData);
        setKinchScores(cached.kinchScores);
        setOverallScore(cached.overallScore);
        setIsLoading(false);
        return;
      }

      // Fetch person data
      const personRes = await fetch(
        `https://www.worldcubeassociation.org/api/v0/persons/${id}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
          },
        },
      );

      if (!personRes.ok) {
        throw new Error(
          personRes.status === 404
            ? "WCA ID not found."
            : "Failed to fetch WCA data.",
        );
      }

      const data = await personRes.json();
      setPersonData(data);

      // We need world records for Kinch calculation
      // Fetch from WCA records API (both single and average)
      let wrSingleData: Record<string, number> = {};
      let wrAverageData: Record<string, number> = {};
      try {
        const wrCacheKey = "wca_world_records_v2";
        const cachedWR = getFromCache<{
          singles: Record<string, number>;
          averages: Record<string, number>;
        }>(wrCacheKey);
        if (cachedWR) {
          wrSingleData = cachedWR.singles;
          wrAverageData = cachedWR.averages;
        } else {
          const wrRes = await fetch(
            "https://www.worldcubeassociation.org/api/v0/records",
            {
              headers: {
                Accept: "application/json",
                "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
              },
            },
          );
          if (wrRes.ok) {
            const records = await wrRes.json();
            // Extract world records (both singles and averages)
            if (records.world_records) {
              Object.entries(records.world_records).forEach(
                ([eventId, record]: [string, any]) => {
                  if (record.single) {
                    wrSingleData[eventId] = record.single;
                  }
                  if (record.average) {
                    wrAverageData[eventId] = record.average;
                  }
                },
              );
            }
            saveToCache(
              wrCacheKey,
              { singles: wrSingleData, averages: wrAverageData },
              24 * 60 * 60 * 1000,
            );
          }
        }
      } catch {
        // Continue without world records
      }

      setWorldRecords(wrSingleData);

      // Calculate Kinch scores from personal records
      const personalRecords = data.person?.personal_records || {};
      const scores: { eventId: string; score: number; result: string }[] = [];

      Object.entries(WCA_EVENTS).forEach(([eventId, eventName]) => {
        if (DEPRECATED_EVENTS.has(eventId)) return;

        const record = personalRecords[eventId];
        if (!record) {
          scores.push({ eventId, score: 0, result: "-" });
          return;
        }

        const singleBest = record.single?.best || 0;
        const averageBest = record.average?.best || 0;
        const wrSingle = wrSingleData[eventId] || 0;
        const wrAverage = wrAverageData[eventId] || 0;

        let score = 0;
        let result = "-";

        // For BLD and FMC events: take the better of single and average scores
        if (["333bf", "444bf", "555bf", "333fm"].includes(eventId)) {
          let singleScore = 0;
          let avgScore = 0;

          if (singleBest > 0 && wrSingle > 0) {
            singleScore = calculateKinchEventScore(
              singleBest,
              wrSingle,
              eventId,
            );
          }
          if (averageBest > 0 && wrAverage > 0) {
            avgScore = calculateKinchEventScore(
              averageBest,
              wrAverage,
              eventId,
            );
          }

          score = Math.max(singleScore, avgScore);
          if (score > 0) {
            result = formatTime(
              avgScore >= singleScore && averageBest > 0
                ? averageBest
                : singleBest,
              eventId,
            );
          }
        } else if (eventId === "333mbf") {
          // MBLD: use single only (no average in MBLD)
          if (singleBest > 0 && wrSingle > 0) {
            score = calculateKinchEventScore(singleBest, wrSingle, eventId);
            result = formatTime(singleBest, eventId);
          }
        } else {
          // Regular events: use AVERAGE only (score = 0 if no average)
          if (averageBest > 0 && wrAverage > 0) {
            score = calculateKinchEventScore(averageBest, wrAverage, eventId);
            result = formatTime(averageBest, eventId);
          }
        }

        scores.push({ eventId, score: Math.min(score, 100), result });
      });

      // Calculate overall average
      const totalEvents = Object.keys(WCA_EVENTS).filter(
        (e) => !DEPRECATED_EVENTS.has(e),
      ).length;
      const totalScore = scores.reduce((sum, s) => sum + s.score, 0);
      const overall = totalScore / totalEvents;

      setKinchScores(scores);
      setOverallScore(overall);

      saveToCache(
        cacheKey,
        { personData: data, kinchScores: scores, overallScore: overall },
        60 * 60 * 1000,
      );
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return "var(--success)";
    if (score >= 60) return "var(--primary)";
    if (score >= 40) return "var(--warning)";
    if (score >= 20) return "var(--accent)";
    if (score > 0) return "var(--text-secondary)";
    return "var(--text-muted)";
  };

  return (
    <div>
      <InfoCard title="What is Kinch Ranks?">
        <p>
          The Kinch system measures a cuber{"'s"} overall performance across all
          events. For each event, the score is calculated as:{" "}
          <span className="font-mono text-(--primary)">
            (World Record / Your PB) x 100
          </span>
        </p>
        <p>
          The overall Kinch Score is the average of all event scores. Higher
          scores are better, with a maximum of 100. For BLD and FMC events, the
          better of single and average scores is used.
        </p>
      </InfoCard>

      <WCAIdSearch
        onSearch={searchPerson}
        isLoading={isLoading}
        placeholder="e.g. 2015XXXX01"
      />

      {error && <ErrorDisplay message={error} />}

      {personData && kinchScores.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {/* Overall Score Card */}
          <div className="timer-card text-center">
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement mb-0.5">
              {personData.person?.name}
            </h2>
            <p className="text-(--text-muted) font-mono text-xs sm:text-sm mb-4">
              {wcaId}
            </p>

            <div
              className="inline-flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 mb-3"
              style={{ borderColor: getScoreColor(overallScore) }}
            >
              <div>
                <div
                  className="text-2xl sm:text-3xl font-bold font-mono"
                  style={{ color: getScoreColor(overallScore) }}
                >
                  {overallScore.toFixed(2)}
                </div>
                <div className="text-[10px] sm:text-xs text-(--text-muted) font-inter">
                  Kinch Score
                </div>
              </div>
            </div>

            <div className="block">
              <a
                href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-(--primary) hover:underline font-inter"
              >
                View WCA Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Event Scores Table */}
          <div className="timer-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border)">
                    <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement">
                      Event
                    </th>
                    <th className="text-right px-3 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement">
                      Score
                    </th>
                    <th className="text-right px-3 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement hidden sm:table-cell">
                      Result
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {kinchScores.map((row) => (
                    <tr
                      key={row.eventId}
                      className="border-b border-(--border) last:border-b-0 hover:bg-(--surface-elevated) transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-2.5 text-sm text-(--text-primary) font-inter">
                        {WCA_EVENTS[row.eventId] || row.eventId}
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 text-right">
                        <span
                          className="font-mono text-sm font-semibold"
                          style={{ color: getScoreColor(row.score) }}
                        >
                          {row.score > 0 ? row.score.toFixed(2) : "-"}
                        </span>
                      </td>
                      <td className="px-3 sm:px-4 py-2.5 text-right text-sm text-(--text-secondary) font-mono hidden sm:table-cell">
                        {row.result}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && kinchScores.length === 0 && (
        <div className="timer-card text-center py-8 sm:py-12">
          <BarChart3 className="w-12 h-12 sm:w-16 sm:h-16 text-(--text-muted) mx-auto mb-3" />
          <h3 className="text-base font-semibold text-(--text-primary) mb-1.5 font-statement">
            Calculate Kinch Score
          </h3>
          <p className="text-sm text-(--text-secondary) font-inter max-w-md mx-auto">
            Enter a WCA ID to calculate their all-round cubing performance
            score.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Sum of Ranks ───────────────────────────────────────────────

function SumOfRanks() {
  const [wcaId, setWcaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personData, setPersonData] = useState<any>(null);
  const [rankType, setRankType] = useState<"single" | "average">("single");
  const [eventRanks, setEventRanks] = useState<
    {
      eventId: string;
      worldRank: number;
      continentRank: number;
      countryRank: number;
    }[]
  >([]);
  const [totals, setTotals] = useState({ world: 0, continent: 0, country: 0 });

  const searchPerson = useCallback(
    async (id: string) => {
      setIsLoading(true);
      setError(null);
      setEventRanks([]);
      setTotals({ world: 0, continent: 0, country: 0 });
      setWcaId(id);

      try {
        const cacheKey = `wca_sor_${id}_${rankType}`;
        const cached = getFromCache<any>(cacheKey);

        if (cached) {
          setPersonData(cached.personData);
          setEventRanks(cached.eventRanks);
          setTotals(cached.totals);
          setIsLoading(false);
          return;
        }

        const personRes = await fetch(
          `https://www.worldcubeassociation.org/api/v0/persons/${id}`,
          {
            headers: {
              Accept: "application/json",
              "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
            },
          },
        );

        if (!personRes.ok) {
          throw new Error(
            personRes.status === 404
              ? "WCA ID not found."
              : "Failed to fetch WCA data.",
          );
        }

        const data = await personRes.json();
        setPersonData(data);

        const personalRecords = data.person?.personal_records || {};
        const ranks: typeof eventRanks = [];
        let worldSum = 0;
        let continentSum = 0;
        let countrySum = 0;

        Object.entries(WCA_EVENTS).forEach(([eventId]) => {
          if (DEPRECATED_EVENTS.has(eventId)) return;

          const record = personalRecords[eventId];
          const recordType = rankType === "single" ? "single" : "average";

          if (!record || !record[recordType]) {
            // If no record, use a large placeholder rank
            ranks.push({
              eventId,
              worldRank: 0,
              continentRank: 0,
              countryRank: 0,
            });
            return;
          }

          const worldRank = record[recordType].world_ranking || 0;
          const continentRank = record[recordType].continental_ranking || 0;
          const countryRank = record[recordType].national_ranking || 0;

          worldSum += worldRank;
          continentSum += continentRank;
          countrySum += countryRank;

          ranks.push({ eventId, worldRank, continentRank, countryRank });
        });

        setEventRanks(ranks);
        setTotals({
          world: worldSum,
          continent: continentSum,
          country: countrySum,
        });

        saveToCache(
          cacheKey,
          {
            personData: data,
            eventRanks: ranks,
            totals: {
              world: worldSum,
              continent: continentSum,
              country: countrySum,
            },
          },
          60 * 60 * 1000,
        );
      } catch (err: any) {
        setError(err.message || "An error occurred");
      } finally {
        setIsLoading(false);
      }
    },
    [rankType],
  );

  const getRankColor = (rank: number): string => {
    if (rank === 0) return "var(--text-muted)";
    if (rank <= 10) return "var(--success)";
    if (rank <= 100) return "var(--primary)";
    if (rank <= 1000) return "var(--accent)";
    return "var(--text-secondary)";
  };

  // Re-search when rank type changes
  useEffect(() => {
    if (wcaId) {
      searchPerson(wcaId);
    }
  }, [rankType]);

  return (
    <div>
      <InfoCard title="What is Sum of Ranks?">
        <p>
          Sum of Ranks (SoR) measures a cuber{"'s"} overall performance by
          adding up their ranking in every event. Lower is better.
        </p>
        <p>
          You can view rankings by single or average, and at world, continental,
          or country level. Unlike Kinch Ranks, SoR can have event biases since
          popular events have more competitors.
        </p>
      </InfoCard>

      <WCAIdSearch
        onSearch={searchPerson}
        isLoading={isLoading}
        placeholder="e.g. 2015XXXX01"
      />

      {/* Rank Type Selector */}
      <div className="timer-card mb-4 sm:mb-6">
        <div className="flex gap-2">
          <button
            onClick={() => setRankType("single")}
            className={`flex-1 py-2 sm:py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 font-button ${
              rankType === "single"
                ? "bg-(--primary) text-white"
                : "bg-(--surface-elevated) text-(--text-secondary) border border-(--border) hover:border-(--primary)"
            }`}
          >
            Single
          </button>
          <button
            onClick={() => setRankType("average")}
            className={`flex-1 py-2 sm:py-2.5 px-4 rounded-lg text-sm font-semibold transition-all duration-200 font-button ${
              rankType === "average"
                ? "bg-(--primary) text-white"
                : "bg-(--surface-elevated) text-(--text-secondary) border border-(--border) hover:border-(--primary)"
            }`}
          >
            Average
          </button>
        </div>
      </div>

      {error && <ErrorDisplay message={error} />}

      {personData && eventRanks.length > 0 && (
        <div className="space-y-4 sm:space-y-6">
          {/* Summary */}
          <div className="timer-card">
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement mb-0.5 text-center">
              {personData.person?.name}
            </h2>
            <p className="text-(--text-muted) font-mono text-xs sm:text-sm mb-4 sm:mb-6 text-center">
              {wcaId}
            </p>

            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              <div className="p-2.5 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border) text-center">
                <div className="text-[10px] sm:text-sm text-(--text-muted) font-inter mb-0.5">
                  World
                </div>
                <div className="text-lg sm:text-2xl font-bold text-(--primary) font-mono">
                  {totals.world.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border) text-center">
                <div className="text-[10px] sm:text-sm text-(--text-muted) font-inter mb-0.5">
                  Continent
                </div>
                <div className="text-lg sm:text-2xl font-bold text-(--primary) font-mono">
                  {totals.continent.toLocaleString()}
                </div>
              </div>
              <div className="p-2.5 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border) text-center">
                <div className="text-[10px] sm:text-sm text-(--text-muted) font-inter mb-0.5">
                  Country
                </div>
                <div className="text-lg sm:text-2xl font-bold text-(--primary) font-mono">
                  {totals.country.toLocaleString()}
                </div>
              </div>
            </div>

            <div className="text-center mt-3 sm:mt-4">
              <a
                href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm text-(--primary) hover:underline font-inter"
              >
                View WCA Profile
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Ranks Table */}
          <div className="timer-card overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-(--border)">
                    <th className="text-left px-3 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement">
                      Event
                    </th>
                    <th className="text-right px-2 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement">
                      WR
                    </th>
                    <th className="text-right px-2 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement">
                      CR
                    </th>
                    <th className="text-right px-2 sm:px-4 py-2.5 text-xs font-semibold text-(--text-secondary) font-statement">
                      NR
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b-2 border-(--primary)/30 bg-(--surface-elevated)">
                    <td className="px-3 sm:px-4 py-2.5 text-sm font-semibold text-(--text-primary) font-statement">
                      Sum
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-right font-mono text-sm font-bold text-(--primary)">
                      {totals.world.toLocaleString()}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-right font-mono text-sm font-bold text-(--primary)">
                      {totals.continent.toLocaleString()}
                    </td>
                    <td className="px-2 sm:px-4 py-2.5 text-right font-mono text-sm font-bold text-(--primary)">
                      {totals.country.toLocaleString()}
                    </td>
                  </tr>
                  {eventRanks.map((row) => (
                    <tr
                      key={row.eventId}
                      className="border-b border-(--border) last:border-b-0 hover:bg-(--surface-elevated) transition-colors"
                    >
                      <td className="px-3 sm:px-4 py-2.5 text-sm text-(--text-primary) font-inter">
                        {WCA_EVENTS[row.eventId] || row.eventId}
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-right">
                        <span
                          className="font-mono text-sm"
                          style={{ color: getRankColor(row.worldRank) }}
                        >
                          {row.worldRank > 0
                            ? row.worldRank.toLocaleString()
                            : "-"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-right">
                        <span
                          className="font-mono text-sm"
                          style={{ color: getRankColor(row.continentRank) }}
                        >
                          {row.continentRank > 0
                            ? row.continentRank.toLocaleString()
                            : "-"}
                        </span>
                      </td>
                      <td className="px-2 sm:px-4 py-2.5 text-right">
                        <span
                          className="font-mono text-sm"
                          style={{ color: getRankColor(row.countryRank) }}
                        >
                          {row.countryRank > 0
                            ? row.countryRank.toLocaleString()
                            : "-"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && eventRanks.length === 0 && (
        <div className="timer-card text-center py-8 sm:py-12">
          <ArrowUpDown className="w-12 h-12 sm:w-16 sm:h-16 text-(--text-muted) mx-auto mb-3" />
          <h3 className="text-base font-semibold text-(--text-primary) mb-1.5 font-statement">
            Sum of Ranks Calculator
          </h3>
          <p className="text-sm text-(--text-secondary) font-inter max-w-md mx-auto">
            Enter a WCA ID to see combined rankings across all events.
          </p>
        </div>
      )}
    </div>
  );
}

// ─── Record Streak ──────────────────────────────────────────────

function RecordStreak() {
  const [wcaId, setWcaId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [personData, setPersonData] = useState<any>(null);
  const [currentStreak, setCurrentStreak] = useState<string[]>([]);
  const [longestStreak, setLongestStreak] = useState<string[]>([]);
  const [competitionNames, setCompetitionNames] = useState<
    Record<string, string>
  >({});

  const searchPerson = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    setCurrentStreak([]);
    setLongestStreak([]);
    setCompetitionNames({});
    setWcaId(id);

    try {
      const cacheKey = `wca_streak_${id}`;
      const cached = getFromCache<any>(cacheKey);

      if (cached) {
        setPersonData(cached.personData);
        setCurrentStreak(cached.currentStreak);
        setLongestStreak(cached.longestStreak);
        setCompetitionNames(cached.competitionNames || {});
        setIsLoading(false);
        return;
      }

      // Fetch person
      const personRes = await fetch(
        `https://www.worldcubeassociation.org/api/v0/persons/${id}`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
          },
        },
      );

      if (!personRes.ok) {
        throw new Error(
          personRes.status === 404
            ? "WCA ID not found."
            : "Failed to fetch WCA data.",
        );
      }

      const data = await personRes.json();
      setPersonData(data);

      // Fetch results
      const resultsRes = await fetch(
        `https://www.worldcubeassociation.org/api/v0/persons/${id}/results`,
        {
          headers: {
            Accept: "application/json",
            "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
          },
        },
      );

      if (!resultsRes.ok) {
        throw new Error("Failed to fetch competition results.");
      }

      const results = await resultsRes.json();

      if (!Array.isArray(results) || results.length === 0) {
        throw new Error("No competition results found.");
      }

      // Group by competition
      const competitions: Record<
        string,
        { eventId: string; best: number; average: number }[]
      > = {};
      const competitionOrder: string[] = [];

      results.forEach((r: any) => {
        const compId = r.competition_id;
        if (!competitions[compId]) {
          competitions[compId] = [];
          competitionOrder.push(compId);
        }
        competitions[compId].push({
          eventId: r.event_id,
          best: r.best,
          average: r.average,
        });
      });

      // Process competitions in order to compute streaks
      // Note: WCA API returns results roughly in chronological order,
      // but we should sort them. We'll fetch comp data to get dates.

      // Fetch competition dates for proper ordering
      const compNames: Record<string, string> = {};
      const compDates: Record<string, string> = {};

      // Batch fetch a reasonable number of competition details
      const uniqueComps = Object.keys(competitions);
      const batchSize = 10;
      for (let i = 0; i < uniqueComps.length; i += batchSize) {
        const batch = uniqueComps.slice(i, i + batchSize);
        const promises = batch.map(async (compId) => {
          try {
            const compRes = await fetch(
              `https://www.worldcubeassociation.org/api/v0/competitions/${compId}`,
              {
                headers: {
                  Accept: "application/json",
                  "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
                },
              },
            );
            if (compRes.ok) {
              const comp = await compRes.json();
              compNames[compId] = comp.name || compId;
              compDates[compId] = comp.start_date || "9999-99-99";
            } else {
              compNames[compId] = compId;
              compDates[compId] = "9999-99-99";
            }
          } catch {
            compNames[compId] = compId;
            compDates[compId] = "9999-99-99";
          }
        });
        await Promise.all(promises);
      }

      setCompetitionNames(compNames);

      // Sort competitions by date
      const sortedComps = Object.keys(competitions).sort((a, b) => {
        return (compDates[a] || "").localeCompare(compDates[b] || "");
      });

      // Calculate streaks
      const bestSingles: Record<string, number> = {};
      const bestAverages: Record<string, number> = {};
      let current: string[] = [];
      let longest: string[] = [];

      for (const compId of sortedComps) {
        let recordSet = false;

        for (const result of competitions[compId]) {
          const { eventId, best, average } = result;

          // Check single
          if (isPersonalRecord(eventId, best, bestSingles)) {
            bestSingles[eventId] = best;
            recordSet = true;
          }

          // Check average
          if (isPersonalRecord(eventId, average, bestAverages)) {
            bestAverages[eventId] = average;
            recordSet = true;
          }
        }

        if (recordSet) {
          current.push(compId);
          if (current.length > longest.length) {
            longest = [...current];
          }
        } else {
          current = [];
        }
      }

      setCurrentStreak(current);
      setLongestStreak(longest);

      saveToCache(
        cacheKey,
        {
          personData: data,
          currentStreak: current,
          longestStreak: longest,
          competitionNames: compNames,
        },
        60 * 60 * 1000,
      );
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <div>
      <InfoCard title="How does Record Streak work?">
        <p>
          A record streak counts consecutive WCA competitions where a competitor
          set or tied at least one personal record (single or average) in any
          event.
        </p>
        <p>
          We show both the current streak and the longest streak ever achieved.
          Maintaining a long streak becomes harder as you improve.
        </p>
      </InfoCard>

      <WCAIdSearch
        onSearch={searchPerson}
        isLoading={isLoading}
        placeholder="e.g. 2015XXXX01"
      />

      {error && <ErrorDisplay message={error} />}

      {personData && (currentStreak.length > 0 || longestStreak.length > 0) && (
        <div className="space-y-4 sm:space-y-6">
          <div className="timer-card text-center">
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement mb-0.5">
              {personData.person?.name}
            </h2>
            <p className="text-(--text-muted) font-mono text-xs sm:text-sm mb-4">
              {wcaId}
            </p>

            <a
              href={`https://www.worldcubeassociation.org/persons/${wcaId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-(--primary) hover:underline font-inter"
            >
              View WCA Profile
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>

          {/* Streak Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            {/* Current Streak */}
            <div className="timer-card">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-(--primary)/10 flex items-center justify-center shrink-0">
                  <Flame className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary)" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-(--text-primary) font-statement">
                    Current Streak
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-(--primary) font-mono">
                    {currentStreak.length}
                  </p>
                </div>
              </div>

              {currentStreak.length > 0 ? (
                <div className="space-y-1.5 max-h-56 sm:max-h-64 overflow-y-auto">
                  {currentStreak.map((compId, i) => (
                    <div
                      key={compId}
                      className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-(--surface-elevated) rounded-lg border border-(--border)"
                    >
                      <span className="text-xs font-mono text-(--text-muted) w-5">
                        {i + 1}.
                      </span>
                      <span className="text-xs sm:text-sm text-(--text-primary) font-inter truncate">
                        {competitionNames[compId] || compId}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-(--text-muted) font-inter">
                  No active streak.
                </p>
              )}
            </div>

            {/* Longest Streak */}
            <div className="timer-card">
              <div className="flex items-center gap-3 mb-3 sm:mb-4">
                <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-(--success)/10 flex items-center justify-center shrink-0">
                  <Trophy className="w-4 h-4 sm:w-5 sm:h-5 text-(--success)" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-(--text-primary) font-statement">
                    Longest Streak
                  </h3>
                  <p className="text-xl sm:text-2xl font-bold text-(--success) font-mono">
                    {longestStreak.length}
                  </p>
                </div>
              </div>

              {longestStreak.length > 0 ? (
                <div className="space-y-1.5 max-h-56 sm:max-h-64 overflow-y-auto">
                  {longestStreak.map((compId, i) => (
                    <div
                      key={compId}
                      className="flex items-center gap-2 px-2.5 py-1.5 sm:px-3 sm:py-2 bg-(--surface-elevated) rounded-lg border border-(--border)"
                    >
                      <span className="text-xs font-mono text-(--text-muted) w-5">
                        {i + 1}.
                      </span>
                      <span className="text-xs sm:text-sm text-(--text-primary) font-inter truncate">
                        {competitionNames[compId] || compId}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs sm:text-sm text-(--text-muted) font-inter">
                  No streak found.
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Zero streak result */}
      {personData &&
        currentStreak.length === 0 &&
        longestStreak.length === 0 &&
        !isLoading &&
        !error &&
        wcaId && (
          <div className="timer-card text-center py-6 sm:py-8">
            <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) font-statement mb-0.5">
              {personData.person?.name}
            </h2>
            <p className="text-(--text-muted) font-mono text-xs sm:text-sm mb-3">
              {wcaId}
            </p>
            <p className="text-sm text-(--text-secondary) font-inter max-w-md mx-auto">
              No personal record streaks found. This may happen if the
              competitor has only one competition.
            </p>
          </div>
        )}

      {/* Empty state */}
      {!isLoading && !error && !personData && (
        <div className="timer-card text-center py-8 sm:py-12">
          <Flame className="w-12 h-12 sm:w-16 sm:h-16 text-(--text-muted) mx-auto mb-3" />
          <h3 className="text-base font-semibold text-(--text-primary) mb-1.5 font-statement">
            Record Streak Calculator
          </h3>
          <p className="text-sm text-(--text-secondary) font-inter max-w-md mx-auto">
            Enter a WCA ID to see consecutive competitions with a personal
            record.
          </p>
        </div>
      )}
    </div>
  );
}