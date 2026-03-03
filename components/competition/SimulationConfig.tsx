"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Play,
  Check,
  AlertTriangle,
  Loader2,
  Volume2,
  Brain,
  Zap,
  Timer,
  Settings,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { WCA_CONFIG } from "@/lib/wca-config";
import { getFromCache, saveToCache } from "@/lib/wca-cache";
import { WCA_EVENTS, WCACompetition } from "./CompetitionBrowser";
import { useUser } from "@/components/UserProvider";
import { SimulationConfigSkeleton } from "@/components/SkeletonLoaders";

export interface AtmosphereSettings {
  crowdNoise: number; // 0-100
  pressure: number; // 0-100
  distractions: boolean;
  timerDelay: boolean;
  judgeInteractions: boolean;
}

const DEFAULT_ATMOSPHERE: AtmosphereSettings = {
  crowdNoise: 30,
  pressure: 50,
  distractions: false,
  timerDelay: true,
  judgeInteractions: true,
};

export default function SimulationConfig() {
  const params = useParams();
  const router = useRouter();
  const { user } = useUser();
  const competitionId = params.competitionId as string;

  const [competition, setCompetition] = useState<WCACompetition | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);

  // Configuration state
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [eventRounds, setEventRounds] = useState<Record<string, number>>({});
  const [atmosphere, setAtmosphere] =
    useState<AtmosphereSettings>(DEFAULT_ATMOSPHERE);

  // Convex mutation
  const createSimulation = useMutation(
    api.competitionSimulations.createSimulation
  );

  // Fetch competition details
  useEffect(() => {
    const fetchCompetition = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const cacheKey = `comp_detail_${competitionId}`;
        const wcifCacheKey = `comp_wcif_${competitionId}`;
        const cached = getFromCache<WCACompetition>(cacheKey);
        const cachedWcif = getFromCache<Record<string, number>>(wcifCacheKey);

        if (cached) {
          setCompetition(cached);
          // Default to selecting all events
          setSelectedEvents(cached.event_ids);
          if (cachedWcif) {
            setEventRounds(cachedWcif);
          }
          setIsLoading(false);
          // Still try to fetch WCIF if we don't have it cached
          if (!cachedWcif) {
            fetchWcifData(cached.event_ids);
          }
          return;
        }

        const response = await fetch(
          `${WCA_CONFIG.API_BASE_URL}/competitions/${competitionId}`
        );
        if (!response.ok) throw new Error("Competition not found");

        const data = await response.json();
        const comp: WCACompetition = {
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
        };

        saveToCache(cacheKey, comp, 60 * 60 * 1000);
        setCompetition(comp);
        // Default to selecting all events
        setSelectedEvents(comp.event_ids);

        // Fetch WCIF data to get actual round counts
        fetchWcifData(comp.event_ids);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to load competition"
        );
      } finally {
        setIsLoading(false);
      }
    };

    // Fetch WCIF data to get actual rounds per event
    const fetchWcifData = async (eventIds: string[]) => {
      try {
        const wcifCacheKey = `comp_wcif_${competitionId}`;
        const wcifResponse = await fetch(
          `${WCA_CONFIG.API_BASE_URL}/competitions/${competitionId}/wcif/public`
        );

        if (wcifResponse.ok) {
          const wcifData = await wcifResponse.json();
          const rounds: Record<string, number> = {};

          // Extract rounds from WCIF events data
          if (wcifData.events && Array.isArray(wcifData.events)) {
            wcifData.events.forEach(
              (event: { id: string; rounds?: unknown[] }) => {
                if (event.rounds && Array.isArray(event.rounds)) {
                  rounds[event.id] = event.rounds.length;
                }
              }
            );
          }

          // For any events without WCIF data, use fallback
          eventIds.forEach((eventId) => {
            if (!rounds[eventId]) {
              // Fallback: major events get 3 rounds, others get 2
              const majorEvents = [
                "333",
                "222",
                "444",
                "333oh",
                "pyram",
                "skewb",
              ];
              rounds[eventId] = majorEvents.includes(eventId) ? 3 : 2;
            }
          });

          setEventRounds(rounds);
          saveToCache(wcifCacheKey, rounds, 60 * 60 * 1000); // 1hr cache
        } else {
          // Fallback if WCIF fetch fails
          const fallbackRounds: Record<string, number> = {};
          eventIds.forEach((eventId) => {
            const majorEvents = [
              "333",
              "222",
              "444",
              "333oh",
              "pyram",
              "skewb",
            ];
            fallbackRounds[eventId] = majorEvents.includes(eventId) ? 3 : 2;
          });
          setEventRounds(fallbackRounds);
        }
      } catch (wcifErr) {
        console.warn(
          "Failed to fetch WCIF data, using fallback rounds:",
          wcifErr
        );
        // Fallback if WCIF fetch fails
        const fallbackRounds: Record<string, number> = {};
        eventIds.forEach((eventId) => {
          const majorEvents = ["333", "222", "444", "333oh", "pyram", "skewb"];
          fallbackRounds[eventId] = majorEvents.includes(eventId) ? 3 : 2;
        });
        setEventRounds(fallbackRounds);
      }
    };

    if (competitionId) {
      fetchCompetition();
    }
  }, [competitionId]);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
    );
  };

  const selectAllEvents = () => {
    if (competition) {
      setSelectedEvents(competition.event_ids);
    }
  };

  const clearAllEvents = () => {
    setSelectedEvents([]);
  };

  const handleStartSimulation = async () => {
    if (!competition || selectedEvents.length === 0 || !user?.wcaId) {
      setError("You must be logged in to start a simulation.");
      return;
    }

    setIsStarting(true);
    try {
      // Create simulation in Convex
      const simulationId = await createSimulation({
        wcaId: user.wcaId,
        competitionId: competition.id,
        competitionName: competition.name,
        competitionDate: competition.start_date,
        competitionVenue: competition.venue,
        competitionCity: competition.city,
        competitionCountry: competition.country_iso2,
        selectedEvents,
        eventRounds, // Pass the actual rounds per event from WCIF data
        atmosphereSettings: atmosphere,
      });

      // Navigate to the simulation runner with the simulation ID
      router.push(
        `/cube-lab/competitions/${competitionId}/simulate/${simulationId}`
      );
    } catch (err) {
      console.error("Failed to start simulation:", err);
      setError("Failed to start simulation. Please try again.");
      setIsStarting(false);
    }
  };

  const formatDateShort = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (isLoading) {
    return <SimulationConfigSkeleton />;
  }

  if (error || !competition) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="timer-card text-center max-w-md w-full">
          <AlertTriangle className="w-10 h-10 sm:w-12 sm:h-12 text-(--error) mx-auto mb-4" />
          <h2 className="text-lg sm:text-xl font-bold text-(--text-primary) mb-2">
            Competition Not Found
          </h2>
          <p className="text-sm text-(--text-muted) mb-4">
            {error || "The competition could not be loaded."}
          </p>
          <Link
            href="/cube-lab/competitions"
            className="inline-flex items-center gap-2 px-4 py-2 bg-(--primary) text-white rounded-lg text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Competitions
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-4 md:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto space-y-4 sm:space-y-6">
        {/* Back Link */}
        <Link
          href={`/cube-lab/competitions/${competitionId}`}
          className="inline-flex items-center gap-2 text-sm text-(--text-muted) hover:text-(--primary) transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Competition
        </Link>

        {/* Header */}
        <div className="timer-card">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-(--text-primary) font-statement mb-2">
            Configure Simulation
          </h1>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs sm:text-sm text-(--text-muted)">
            <span className="font-medium text-(--text-secondary)">
              {competition.name}
            </span>
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {formatDateShort(competition.start_date)}
            </span>
            <span className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              {competition.city}, {competition.country_iso2}
            </span>
          </div>
        </div>

        {/* Event Selection */}
        <div className="timer-card">
          <div className="flex items-center justify-between mb-3 sm:mb-4">
            <h2 className="text-base sm:text-lg font-bold text-(--text-primary)">
              Select Events to Simulate
            </h2>
            <div className="flex gap-2 text-xs">
              <button
                onClick={selectAllEvents}
                className="text-(--primary) hover:underline"
              >
                Select All
              </button>
              <span className="text-(--text-muted)">|</span>
              <button
                onClick={clearAllEvents}
                className="text-(--text-muted) hover:text-(--text-primary)"
              >
                Clear
              </button>
            </div>
          </div>

          <div className="grid grid-cols-3 xs:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-7 gap-2 sm:gap-3">
            {competition.event_ids.map((eventId) => {
              const event = WCA_EVENTS.find((e) => e.id === eventId);
              const isSelected = selectedEvents.includes(eventId);

              return event ? (
                <button
                  key={eventId}
                  onClick={() => toggleEvent(eventId)}
                  className={`relative flex flex-col items-center gap-1.5 sm:gap-2 p-2 sm:p-3 rounded-lg border transition-all ${
                    isSelected
                      ? "border-(--primary) bg-(--primary)/15"
                      : "border-(--border) hover:border-(--primary)/50 bg-(--surface)"
                  }`}
                >
                  {isSelected && (
                    <div className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-4 h-4 sm:w-5 sm:h-5 bg-(--primary) rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-white" />
                    </div>
                  )}
                  <div
                    className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-lg ${
                      isSelected
                        ? "bg-(--primary)/20"
                        : "bg-(--surface-elevated)"
                    }`}
                  >
                    <Image
                      src={event.icon}
                      alt={event.name}
                      width={24}
                      height={24}
                      className="w-5 h-5 sm:w-6 sm:h-6 invert opacity-80"
                    />
                  </div>
                  <span
                    className={`text-[10px] sm:text-xs font-medium text-center leading-tight ${
                      isSelected
                        ? "text-(--text-primary)"
                        : "text-(--text-secondary)"
                    }`}
                  >
                    {event.name}
                  </span>
                </button>
              ) : null;
            })}
          </div>

          <div className="mt-3 sm:mt-4 text-xs sm:text-sm text-(--text-muted)">
            {selectedEvents.length} of {competition.event_ids.length} events
            selected
          </div>
        </div>

        {/* Atmosphere Settings */}
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-4 sm:mb-6">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-(--primary)" />
            <h2 className="text-base sm:text-lg font-bold text-(--text-primary)">
              Simulation Atmosphere
            </h2>
          </div>

          <div className="space-y-4 sm:space-y-6">
            {/* Crowd Noise */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-(--primary)" />
                  <span className="text-xs sm:text-sm font-medium text-(--text-primary)">
                    Crowd Noise
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-(--primary)">
                  {atmosphere.crowdNoise}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={atmosphere.crowdNoise}
                onChange={(e) =>
                  setAtmosphere({
                    ...atmosphere,
                    crowdNoise: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 sm:h-3 bg-(--surface-elevated) rounded-lg appearance-none cursor-pointer accent-(--primary)"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-(--text-muted)">
                <span>Silent</span>
                <span>Moderate</span>
                <span>Loud</span>
              </div>
            </div>

            {/* Competition Pressure */}
            <div className="space-y-2 sm:space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-(--warning)" />
                  <span className="text-xs sm:text-sm font-medium text-(--text-primary)">
                    Competition Pressure
                  </span>
                </div>
                <span className="text-lg sm:text-xl font-bold text-(--warning)">
                  {atmosphere.pressure}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                value={atmosphere.pressure}
                onChange={(e) =>
                  setAtmosphere({
                    ...atmosphere,
                    pressure: parseInt(e.target.value),
                  })
                }
                className="w-full h-2 sm:h-3 bg-(--surface-elevated) rounded-lg appearance-none cursor-pointer accent-(--warning)"
              />
              <div className="flex justify-between text-[10px] sm:text-xs text-(--text-muted)">
                <span>Relaxed</span>
                <span>Normal</span>
                <span>Intense</span>
              </div>
              <p className="text-[10px] sm:text-xs text-(--text-muted)">
                Higher pressure adds visual cues and timing variations to
                simulate real competition stress
              </p>
            </div>

            {/* Toggle Options */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 sm:gap-3">
              {/* Distractions */}
              <button
                onClick={() =>
                  setAtmosphere({
                    ...atmosphere,
                    distractions: !atmosphere.distractions,
                  })
                }
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all ${
                  atmosphere.distractions
                    ? "border-(--primary) bg-(--primary)/15"
                    : "border-(--border) hover:border-(--primary)/50 bg-(--surface)"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <Zap
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${atmosphere.distractions ? "text-(--primary)" : "text-(--text-muted)"}`}
                  />
                  <span className="text-sm sm:text-base font-medium text-(--text-primary)">
                    Distractions
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-(--text-muted)">
                  Random visual distractions during solves
                </p>
                <div
                  className={`mt-2 sm:mt-3 text-xs sm:text-sm font-bold ${atmosphere.distractions ? "text-(--primary)" : "text-(--text-muted)"}`}
                >
                  {atmosphere.distractions ? "On" : "Off"}
                </div>
              </button>

              {/* Timer Delay */}
              <button
                onClick={() =>
                  setAtmosphere({
                    ...atmosphere,
                    timerDelay: !atmosphere.timerDelay,
                  })
                }
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all ${
                  atmosphere.timerDelay
                    ? "border-(--primary) bg-(--primary)/15"
                    : "border-(--border) hover:border-(--primary)/50 bg-(--surface)"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <Timer
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${atmosphere.timerDelay ? "text-(--primary)" : "text-(--text-muted)"}`}
                  />
                  <span className="text-sm sm:text-base font-medium text-(--text-primary)">
                    Timer Delay
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-(--text-muted)">
                  Slight random delays like real stackmat
                </p>
                <div
                  className={`mt-2 sm:mt-3 text-xs sm:text-sm font-bold ${atmosphere.timerDelay ? "text-(--primary)" : "text-(--text-muted)"}`}
                >
                  {atmosphere.timerDelay ? "On" : "Off"}
                </div>
              </button>

              {/* Judge Interactions */}
              <button
                onClick={() =>
                  setAtmosphere({
                    ...atmosphere,
                    judgeInteractions: !atmosphere.judgeInteractions,
                  })
                }
                className={`p-3 sm:p-4 rounded-lg border text-left transition-all ${
                  atmosphere.judgeInteractions
                    ? "border-(--primary) bg-(--primary)/15"
                    : "border-(--border) hover:border-(--primary)/50 bg-(--surface)"
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5 sm:mb-2">
                  <Users
                    className={`w-4 h-4 sm:w-5 sm:h-5 ${atmosphere.judgeInteractions ? "text-(--primary)" : "text-(--text-muted)"}`}
                  />
                  <span className="text-sm sm:text-base font-medium text-(--text-primary)">
                    Judge Sim
                  </span>
                </div>
                <p className="text-[10px] sm:text-xs text-(--text-muted)">
                  Simulate judge ready prompts
                </p>
                <div
                  className={`mt-2 sm:mt-3 text-xs sm:text-sm font-bold ${atmosphere.judgeInteractions ? "text-(--primary)" : "text-(--text-muted)"}`}
                >
                  {atmosphere.judgeInteractions ? "On" : "Off"}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Atmosphere Preview */}
        <div className="timer-card">
          <h3 className="text-xs sm:text-sm font-medium text-(--text-muted) mb-2 sm:mb-3">
            Atmosphere Preview
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
            <div className="text-center p-2 sm:p-3 bg-(--surface-elevated) rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-(--primary)">
                {atmosphere.crowdNoise}%
              </div>
              <div className="text-[10px] sm:text-xs text-(--text-muted)">
                Crowd Noise
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-(--surface-elevated) rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-(--warning)">
                {atmosphere.pressure}%
              </div>
              <div className="text-[10px] sm:text-xs text-(--text-muted)">
                Pressure
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-(--surface-elevated) rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-(--text-primary)">
                {atmosphere.distractions ? "On" : "Off"}
              </div>
              <div className="text-[10px] sm:text-xs text-(--text-muted)">
                Distractions
              </div>
            </div>
            <div className="text-center p-2 sm:p-3 bg-(--surface-elevated) rounded-lg">
              <div className="text-lg sm:text-2xl font-bold text-(--text-primary)">
                {atmosphere.judgeInteractions ? "On" : "Off"}
              </div>
              <div className="text-[10px] sm:text-xs text-(--text-muted)">
                Judge Sim
              </div>
            </div>
          </div>
        </div>

        {/* Start Button */}
        <div className="timer-card">
          <button
            onClick={handleStartSimulation}
            disabled={selectedEvents.length === 0 || isStarting}
            className="flex items-center justify-center gap-2 sm:gap-3 w-full px-6 py-3 sm:py-4 bg-(--primary) text-white text-sm sm:text-lg font-bold rounded-lg sm:rounded-xl hover:bg-(--primary-hover) transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isStarting ? (
              <>
                <Loader2 className="w-5 h-5 sm:w-6 sm:h-6 animate-spin" />
                Starting...
              </>
            ) : (
              <>
                <Play className="w-5 h-5 sm:w-6 sm:h-6" />
                Start Competition Simulation
              </>
            )}
          </button>

          {selectedEvents.length === 0 && (
            <p className="text-center text-xs sm:text-sm text-(--error) mt-3">
              Please select at least one event to simulate
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
