"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ExternalLink,
  Play,
  Trophy,
  Clock,
  AlertTriangle,
  Timer,
  Target,
  Zap,
  Building,
  History,
  BarChart3,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@/components/UserProvider";
import { WCA_CONFIG } from "@/lib/wca-config";
import { getFromCache, saveToCache } from "@/lib/wca-cache";
import {
  getLocalTodayStart,
  parseCompetitionDate,
  getCompetitionStatus as getCompStatus,
} from "@/lib/date-utils";
import { WCA_EVENTS, WCACompetition } from "./CompetitionBrowser";
import InspectionViolationTrainer from "./InspectionViolationTrainer";
import JudgeErrorSimulator from "./JudgeErrorSimulator";
import MockSchedule from "./MockSchedule";
import {
  CompetitionOverviewSkeleton,
  CompetitionEventsTabSkeleton,
  CompetitionTrainingTabSkeleton,
  SimulationHistorySkeleton,
} from "@/components/SkeletonLoaders";

// Calculate max rounds for an event
const getMaxRounds = (eventId: string): number => {
  const majorEvents = ["333", "222", "444", "333oh", "pyram", "skewb"];
  return majorEvents.includes(eventId) ? 3 : 2;
};

// Calculate total rounds for a simulation
const getTotalRounds = (selectedEvents: string[]): number => {
  return selectedEvents.reduce(
    (total, eventId) => total + getMaxRounds(eventId),
    0,
  );
};

// Calculate completed rounds from eventProgress
const getCompletedRounds = (
  eventProgress: Record<string, number> | undefined,
): number => {
  if (!eventProgress) return 0;
  return Object.values(eventProgress).reduce(
    (total, rounds) => total + (rounds || 0),
    0,
  );
};

const WCA_PERSON_ID_REGEX = /^\d{4}[A-Z]{4}\d{2}$/;
const hasLinkedWcaId = (identifier?: string): identifier is string =>
  !!identifier && WCA_PERSON_ID_REGEX.test(identifier.toUpperCase());

interface CompetitionDetails extends WCACompetition {
  information?: string;
  organizers?: { name: string; email?: string }[];
  delegates?: { name: string; wcaId?: string }[];
  registrationRequirements?: string;
  competitorLimit?: number;
}

// Parse markdown to plain text for safe rendering
function parseMarkdownToText(markdown: string | undefined): string {
  if (!markdown) return "";

  let text = markdown;

  // Remove image markdown ![alt](url)
  text = text.replace(/!\[([^\]]*)\]\([^)]+\)/g, "");

  // Convert markdown links [text](url) to just text with URL
  text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, "$1");

  // Remove ** bold markers
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");

  // Remove * italic markers
  text = text.replace(/\*([^*]+)\*/g, "$1");

  // Convert # headers to plain text
  text = text.replace(/^#{1,6}\s+(.+)$/gm, "$1");

  // Clean up multiple newlines
  text = text.replace(/\n{3,}/g, "\n\n");

  // Trim whitespace
  text = text.trim();

  return text;
}

// Split text into paragraphs based on double newlines
function splitIntoParagraphs(text: string): string[] {
  if (!text) return [];
  return text.split(/\n\n+/).filter((p) => p.trim().length > 0);
}

export default function CompetitionOverview() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const competitionId = params.competitionId as string;
  const { user } = useUser();

  // Get initial tab from URL
  const getInitialTab = ():
    | "info"
    | "events"
    | "rules"
    | "history"
    | "training" => {
    const tabParam = searchParams.get("tab");
    if (
      tabParam === "events" ||
      tabParam === "rules" ||
      tabParam === "history" ||
      tabParam === "training"
    ) {
      return tabParam;
    }
    return "info";
  };

  const [competition, setCompetition] = useState<CompetitionDetails | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "info" | "events" | "rules" | "history" | "training"
  >(getInitialTab());

  // Sync URL with tab changes
  const handleTabChange = (
    tab: "info" | "events" | "rules" | "history" | "training",
  ) => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    newParams.set("tab", tab);
    router.replace(
      `/cube-lab/competitions/${competitionId}?${newParams.toString()}`,
      { scroll: false },
    );
  };

  // Fetch simulations for this competition
  const linkedWcaId = hasLinkedWcaId(user?.wcaId) ? user?.wcaId : undefined;
  const simulations = useQuery(
    api.competitionSimulations.getUserSimulationsForCompetition,
    linkedWcaId && competitionId
      ? { wcaId: linkedWcaId, competitionId }
      : "skip",
  );

  // Parse competition information into paragraphs
  const parsedInfo = useMemo(() => {
    if (!competition?.information) return [];
    const cleanText = parseMarkdownToText(competition.information);
    return splitIntoParagraphs(cleanText);
  }, [competition?.information]);

  // Fetch competition details
  useEffect(() => {
    const fetchCompetition = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = `comp_overview_${competitionId}`;
        const cached = getFromCache<CompetitionDetails>(cacheKey);

        if (cached) {
          setCompetition(cached);
          setIsLoading(false);
          return;
        }

        const response = await fetch(
          `${WCA_CONFIG.API_BASE_URL}/competitions/${competitionId}`,
        );
        if (!response.ok) throw new Error("Competition not found");

        const data = await response.json();
        const comp: CompetitionDetails = {
          id: data.id,
          name: data.name,
          city: data.city,
          country_iso2: data.country_iso2,
          start_date: data.start_date,
          end_date: data.end_date,
          venue: data.venue || "",
          event_ids: data.event_ids || [],
          competitor_limit: data.competitor_limit,
          url: data.url,
          cancelled_at: data.cancelled_at,
          information: data.information,
          latitude_degrees: data.latitude_degrees,
          longitude_degrees: data.longitude_degrees,
        };

        saveToCache(cacheKey, comp, 60 * 60 * 1000);
        setCompetition(comp);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load competition",
        );
      } finally {
        setIsLoading(false);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getCompetitionStatus = () => {
    if (!competition) return null;

    // Use timezone-aware date utilities
    const today = getLocalTodayStart();
    const startDay = parseCompetitionDate(competition.start_date);
    const endDay = parseCompetitionDate(competition.end_date);

    if (competition.cancelled_at) {
      return {
        label: "Cancelled",
        color: "text-(--error) bg-(--error)/10 border-(--error)/30",
      };
    }
    if (today >= startDay && today <= endDay) {
      return {
        label: "In Progress",
        color: "text-(--success) bg-(--success)/10 border-(--success)/30",
      };
    }
    if (endDay < today) {
      return {
        label: "Completed",
        color: "text-(--text-muted) bg-(--surface-elevated) border-(--border)",
      };
    }
    return {
      label: "Upcoming",
      color: "text-(--info) bg-(--info)/10 border-(--info)/30",
    };
  };

  const handleSimulate = () => {
    router.push(`/cube-lab/competitions/${competitionId}/simulate`);
  };

  if (isLoading) {
    return <CompetitionOverviewSkeleton />;
  }

  if (error || !competition) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="timer-card text-center max-w-md w-full">
          <AlertTriangle className="w-12 h-12 text-(--error) mx-auto mb-4" />
          <h2 className="text-xl font-bold text-(--text-primary) mb-2">
            Competition Not Found
          </h2>
          <p className="text-(--text-muted) mb-4">
            {error || "The competition could not be loaded."}
          </p>
          <Link
            href="/cube-lab/competitions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-white rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Competitions
          </Link>
        </div>
      </div>
    );
  }

  const status = getCompetitionStatus();

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-5xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Link */}
        <Link
          href="/cube-lab/competitions"
          className="inline-flex items-center gap-2 text-sm text-(--text-muted) hover:text-(--primary) transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competitions
        </Link>

        {/* Competition Header */}
        <div className="timer-card">
          <div className="flex flex-col gap-4">
            {/* Title and Status */}
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-(--text-primary) font-statement wrap-break-word">
                    {competition.name}
                  </h1>
                  {status && (
                    <span
                      className={`px-2 py-0.5 text-xs font-medium rounded-full border whitespace-nowrap ${status.color}`}
                    >
                      {status.label}
                    </span>
                  )}
                </div>

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-(--text-muted)">
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {formatDateShort(competition.start_date)}
                      {competition.start_date !== competition.end_date &&
                        ` - ${formatDateShort(competition.end_date)}`}
                    </span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 shrink-0" />
                    <span className="truncate">
                      {competition.city}, {competition.country_iso2}
                    </span>
                  </span>
                  {competition.competitor_limit && (
                    <span className="flex items-center gap-1.5">
                      <Users className="w-4 h-4 shrink-0" />
                      <span>{competition.competitor_limit} competitors</span>
                    </span>
                  )}
                </div>

                {competition.venue && (
                  <p className="mt-2 text-sm text-(--text-secondary) flex items-start gap-1.5">
                    <Building className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{competition.venue}</span>
                  </p>
                )}
              </div>

              {/* WCA Link */}
              {competition.url && (
                <a
                  href={competition.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3 py-2 text-sm text-(--primary) border border-(--primary) rounded-lg hover:bg-(--primary)/10 transition-colors w-full sm:w-auto"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>View on WCA</span>
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs - styled like CuberProfile */}
        <div className="border-b border-(--border) mb-4 sm:mb-6">
          <nav className="flex space-x-6 sm:space-x-8 overflow-x-auto">
            <button
              onClick={() => handleTabChange("info")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "info"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border)"
              }`}
            >
              General Info
            </button>
            <button
              onClick={() => handleTabChange("events")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "events"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border)"
              }`}
            >
              Events
            </button>
            <button
              onClick={() => handleTabChange("rules")}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "rules"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border)"
              }`}
            >
              Rules
            </button>
            <button
              onClick={() => handleTabChange("history")}
              className={`flex items-center gap-1.5 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "history"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border)"
              }`}
            >
              My Simulations
              {simulations && simulations.length > 0 && (
                <span className="px-1.5 py-0.5 text-xs bg-(--primary)/20 text-(--primary) rounded-full">
                  {simulations.length}
                </span>
              )}
            </button>
            <button
              onClick={() => handleTabChange("training")}
              className={`flex items-center gap-1.5 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "training"
                  ? "border-(--primary) text-(--primary)"
                  : "border-transparent text-(--text-secondary) hover:text-(--text-primary) hover:border-(--border)"
              }`}
            >
              Training
            </button>
          </nav>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === "info" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-(--text-primary) mb-3 sm:mb-4">
                  Competition Details
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg">
                    <div className="text-xs sm:text-sm text-(--text-muted) mb-1">
                      Date
                    </div>
                    <div className="text-sm sm:text-base text-(--text-primary) font-medium">
                      {formatDate(competition.start_date)}
                      {competition.start_date !== competition.end_date && (
                        <>
                          <br className="sm:hidden" />
                          <span className="hidden sm:inline"> - </span>
                          <span className="sm:hidden">to </span>
                          {formatDate(competition.end_date)}
                        </>
                      )}
                    </div>
                  </div>
                  <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg">
                    <div className="text-xs sm:text-sm text-(--text-muted) mb-1">
                      Location
                    </div>
                    <div className="text-sm sm:text-base text-(--text-primary) font-medium">
                      {competition.city}, {competition.country_iso2}
                    </div>
                  </div>
                  {competition.venue && (
                    <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg sm:col-span-2">
                      <div className="text-xs sm:text-sm text-(--text-muted) mb-1">
                        Venue
                      </div>
                      <div className="text-sm sm:text-base text-(--text-primary) font-medium">
                        {competition.venue}
                      </div>
                    </div>
                  )}
                  {competition.competitor_limit && (
                    <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg">
                      <div className="text-xs sm:text-sm text-(--text-muted) mb-1">
                        Competitor Limit
                      </div>
                      <div className="text-sm sm:text-base text-(--text-primary) font-medium">
                        {competition.competitor_limit} competitors
                      </div>
                    </div>
                  )}
                  <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg">
                    <div className="text-xs sm:text-sm text-(--text-muted) mb-1">
                      Number of Events
                    </div>
                    <div className="text-sm sm:text-base text-(--text-primary) font-medium">
                      {competition.event_ids.length} events
                    </div>
                  </div>
                </div>
              </div>

              {parsedInfo.length > 0 && (
                <div>
                  <h4 className="text-sm sm:text-base font-medium text-(--text-primary) mb-2 sm:mb-3">
                    Additional Information
                  </h4>
                  <div className="space-y-3 text-xs sm:text-sm text-(--text-secondary) leading-relaxed">
                    {parsedInfo.map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "events" && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-(--text-primary)">
                Competition Events
              </h3>
              <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
                {competition.event_ids.map((eventId) => {
                  const event = WCA_EVENTS.find((e) => e.id === eventId);
                  return event ? (
                    <div
                      key={eventId}
                      className="flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border border-(--border) bg-(--surface-elevated) hover:border-(--primary)/50 transition-colors"
                    >
                      <div className="w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg bg-(--surface)">
                        <Image
                          src={event.icon}
                          alt={event.name}
                          width={24}
                          height={24}
                          className="w-5 h-5 sm:w-6 sm:h-6 invert opacity-80"
                        />
                      </div>
                      <span className="text-[10px] sm:text-xs font-medium text-(--text-primary) text-center leading-tight">
                        {event.name}
                      </span>
                    </div>
                  ) : null;
                })}
              </div>

              <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
                <h4 className="text-sm sm:text-base font-medium text-(--text-primary) mb-2 flex items-center gap-2">
                  <Timer className="w-4 h-4 text-(--primary)" />
                  Event Format Information
                </h4>
                <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                  Most events use Average of 5 (Ao5) format where you get 5
                  solves and the best and worst are dropped. Some events like
                  6x6, 7x7, and BLD events use Mean of 3 (Mo3) format. Check the
                  WCA page for specific time limits and cutoffs.
                </p>
              </div>
            </div>
          )}

          {activeTab === "rules" && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-(--text-primary)">
                Competition Rules
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <h4 className="text-sm sm:text-base font-medium text-(--text-primary) mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-(--warning)" />
                    Time Limits
                  </h4>
                  <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                    If you reach the time limit during your solve, the judge
                    will stop you and your result will be DNF. Time limits vary
                    by event and are set by the competition organizers.
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <h4 className="text-sm sm:text-base font-medium text-(--text-primary) mb-2 flex items-center gap-2">
                    <Target className="w-4 h-4 text-(--primary)" />
                    Cutoffs
                  </h4>
                  <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                    Some rounds have a cutoff. You must beat the cutoff time in
                    your first 1-2 attempts to proceed to the remaining solves
                    in that round.
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <h4 className="text-sm sm:text-base font-medium text-(--text-primary) mb-2 flex items-center gap-2">
                    <Zap className="w-4 h-4 text-(--success)" />
                    Inspection
                  </h4>
                  <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                    You have 15 seconds to inspect the cube before starting.
                    Going over 15 seconds adds a +2 penalty, and going over 17
                    seconds results in a DNF.
                  </p>
                </div>

                <div className="p-3 sm:p-4 bg-(--surface-elevated) rounded-lg border border-(--border)">
                  <h4 className="text-sm sm:text-base font-medium text-(--text-primary) mb-2 flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-(--warning)" />
                    Advancement
                  </h4>
                  <p className="text-xs sm:text-sm text-(--text-muted) leading-relaxed">
                    Competitors are ranked by their average (or mean/single for
                    some events). Top competitors from each round advance to the
                    next round until the final.
                  </p>
                </div>
              </div>

              <div className="text-xs sm:text-sm text-(--text-muted)">
                For complete WCA regulations, visit{" "}
                <a
                  href="https://www.worldcubeassociation.org/regulations/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-(--primary) hover:underline"
                >
                  WCA Regulations
                </a>
              </div>
            </div>
          )}

          {/* My Simulations Tab */}
          {activeTab === "history" && (
            <div className="space-y-4 sm:space-y-6">
              <h3 className="text-base sm:text-lg font-bold text-(--text-primary)">
                My Simulations for {competition.name}
              </h3>

              {!simulations || simulations.length === 0 ? (
                <div className="timer-card text-center py-12">
                  <History className="w-12 h-12 text-(--text-muted) mx-auto mb-4" />
                  <h4 className="text-lg font-medium text-(--text-primary) mb-2">
                    No Simulations Yet
                  </h4>
                  <p className="text-sm text-(--text-muted) mb-4">
                    Start a simulation to practice for this competition.
                  </p>
                  <button
                    onClick={handleSimulate}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Simulation
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {simulations.map((sim: any) => {
                    const totalRounds = getTotalRounds(
                      sim.selectedEvents || [],
                    );
                    const completedRounds = getCompletedRounds(
                      sim.eventProgress,
                    );
                    const progress =
                      totalRounds > 0
                        ? Math.round((completedRounds / totalRounds) * 100)
                        : 0;
                    const isInProgress = sim.status === "in-progress";

                    return (
                      <Link
                        key={sim._id}
                        href={`/cube-lab/competitions/${competitionId}/simulate/${sim._id}`}
                        className="block p-4 rounded-lg border border-(--border) hover:border-(--primary)/50 bg-(--surface) hover:bg-(--surface-elevated) transition-all"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                                sim.status === "completed"
                                  ? "bg-(--success)/10 text-(--success)"
                                  : sim.status === "in-progress"
                                    ? "bg-(--warning)/10 text-(--warning)"
                                    : "bg-(--text-muted)/10 text-(--text-muted)"
                              }`}
                            >
                              {sim.status === "completed"
                                ? "Completed"
                                : sim.status === "in-progress"
                                  ? "In Progress"
                                  : "Abandoned"}
                            </span>
                            <span className="text-xs text-(--text-muted)">
                              {new Date(sim.startedAt).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                          {isInProgress && (
                            <span className="flex items-center gap-2 text-xs text-(--primary)">
                              <Play className="w-3 h-3" />
                              Continue
                            </span>
                          )}
                          {sim.status === "completed" && (
                            <span className="flex items-center gap-2 text-xs text-(--success)">
                              <BarChart3 className="w-3 h-3" />
                              View Results
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between text-sm mb-1">
                              <span className="text-(--text-secondary)">
                                {completedRounds}/{totalRounds} rounds
                              </span>
                              <span className="text-(--text-muted)">
                                {progress}%
                              </span>
                            </div>
                            <div className="w-full h-1.5 bg-(--surface-elevated) rounded-full overflow-hidden">
                              <div
                                className={`h-full transition-all ${
                                  sim.status === "completed"
                                    ? "bg-(--success)"
                                    : "bg-(--primary)"
                                }`}
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                          </div>
                        </div>

                        {/* Event icons */}
                        <div className="flex flex-wrap gap-1 mt-3">
                          {(sim.selectedEvents as string[])
                            .slice(0, 8)
                            .map((eventId: string) => {
                              const event = WCA_EVENTS.find(
                                (e) => e.id === eventId,
                              );
                              const isCompleted =
                                sim.completedEvents?.includes(eventId);
                              return event ? (
                                <div
                                  key={eventId}
                                  className={`p-1 rounded ${
                                    isCompleted
                                      ? "bg-(--success)/20"
                                      : "bg-(--surface-elevated)"
                                  }`}
                                  title={`${event.name}${isCompleted ? " (completed)" : ""}`}
                                >
                                  <Image
                                    src={event.icon}
                                    alt={event.name}
                                    width={14}
                                    height={14}
                                    className={`invert ${isCompleted ? "opacity-100" : "opacity-60"}`}
                                  />
                                </div>
                              ) : null;
                            })}
                          {sim.selectedEvents.length > 8 && (
                            <span className="px-1.5 text-[10px] text-(--text-muted) bg-(--surface-elevated) rounded flex items-center">
                              +{sim.selectedEvents.length - 8}
                            </span>
                          )}
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Training Tab */}
          {activeTab === "training" && (
            <div className="space-y-4 sm:space-y-6">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-(--text-primary) mb-2">
                  Competition Training Tools
                </h3>
                <p className="text-sm text-(--text-muted)">
                  Practice essential competition skills to prepare for{" "}
                  {competition.name}.
                </p>
              </div>

              {/* Mock Schedule */}
              {/* <MockSchedule
                competitionName={competition.name}
                events={competition.event_ids}
              /> */}

              {/* Inspection Trainer */}
              <InspectionViolationTrainer />

              {/* Judge Error Trainer */}
              <JudgeErrorSimulator />
            </div>
          )}
        </div>

        {/* Simulate Button Section - only show if no simulations yet */}
        {(!simulations || simulations.length === 0) && (
          <div className="timer-card border-(--primary)/20">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-base sm:text-lg font-bold text-(--text-primary)">
                  Practice for this Competition
                </h3>
                <p className="text-xs sm:text-sm text-(--text-muted) mt-1">
                  Simulate the competition atmosphere with configurable
                  pressure, noise, and more.
                </p>
              </div>
              <button
                onClick={handleSimulate}
                className="flex items-center justify-center gap-2 sm:gap-3 w-full sm:w-auto px-6 py-3 sm:py-4 bg-(--primary) text-white text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl hover:bg-(--primary-hover) transition-colors"
              >
                <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                Simulate Competition
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
