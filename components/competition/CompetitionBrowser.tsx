"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Calendar,
  MapPin,
  Filter,
  Play,
  ChevronDown,
  ChevronUp,
  Users,
  History,
  Compass,
  RefreshCw,
  CircleCheck,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { WCA_CONFIG } from "@/lib/wca-config";
import { getFromCacheWithStaleCheck, saveToCache } from "@/lib/wca-cache";
import {
  getLocalTodayStart,
  getLocalTomorrowStart,
  parseCompetitionDate,
  getCompetitionStatusDisplay,
  formatCompetitionDateRange,
} from "@/lib/date-utils";
import SimulationHistory from "./SimulationHistory";
import UpcomingCompetitionsSuggestions from "./UpcomingCompetitionsSuggestions";
import RegionDropdown from "./RegionDropdown";
import { CompetitionCardsSkeleton } from "@/components/SkeletonLoaders";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState, ErrorState } from "@/components/ui/EmptyState";
import { Field, SearchInput } from "@/components/ui/Field";
import { Pagination } from "@/components/ui/Pagination";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Tabs } from "@/components/ui/Tabs";
import CompetitionWalkthrough from "./CompetitionWalkthrough";
import { useTheme } from "@/lib/theme-context";

// WCA Events with icons
export const WCA_EVENTS = [
  { id: "333", name: "3x3x3", icon: "/cube-icons/333.svg" },
  { id: "222", name: "2x2x2", icon: "/cube-icons/222.svg" },
  { id: "444", name: "4x4x4", icon: "/cube-icons/444.svg" },
  { id: "555", name: "5x5x5", icon: "/cube-icons/555.svg" },
  { id: "666", name: "6x6x6", icon: "/cube-icons/666.svg" },
  { id: "777", name: "7x7x7", icon: "/cube-icons/777.svg" },
  { id: "333bf", name: "3x3 BLD", icon: "/cube-icons/333bf.svg" },
  { id: "333fm", name: "FMC", icon: "/cube-icons/333fm.svg" },
  { id: "333oh", name: "3x3 OH", icon: "/cube-icons/333oh.svg" },
  { id: "clock", name: "Clock", icon: "/cube-icons/clock.svg" },
  { id: "minx", name: "Megaminx", icon: "/cube-icons/minx.svg" },
  { id: "pyram", name: "Pyraminx", icon: "/cube-icons/pyram.svg" },
  { id: "skewb", name: "Skewb", icon: "/cube-icons/skewb.svg" },
  { id: "sq1", name: "Square-1", icon: "/cube-icons/sq1.svg" },
  { id: "444bf", name: "4x4 BLD", icon: "/cube-icons/444bf.svg" },
  { id: "555bf", name: "5x5 BLD", icon: "/cube-icons/555bf.svg" },
  { id: "333mbf", name: "MBLD", icon: "/cube-icons/333mbf.svg" },
];

export interface WCACompetition {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  venue: string;
  event_ids: string[];
  competitor_limit?: number;
  registration_open?: string;
  registration_close?: string;
  url?: string;
  cancelled_at?: string;
  latitude_degrees?: number;
  longitude_degrees?: number;
}

type TimeFilter = "ongoing" | "upcoming" | "past";

const REGIONS = [
  { code: "all", name: "All Regions" },
  { code: "US", name: "United States" },
  { code: "CN", name: "China" },
  { code: "IN", name: "India" },
  { code: "BR", name: "Brazil" },
  { code: "DE", name: "Germany" },
  { code: "FR", name: "France" },
  { code: "GB", name: "United Kingdom" },
  { code: "JP", name: "Japan" },
  { code: "AU", name: "Australia" },
  { code: "CA", name: "Canada" },
  { code: "MX", name: "Mexico" },
  { code: "PL", name: "Poland" },
  { code: "ES", name: "Spain" },
  { code: "IT", name: "Italy" },
  { code: "KR", name: "South Korea" },
  { code: "NL", name: "Netherlands" },
  { code: "PH", name: "Philippines" },
  { code: "ID", name: "Indonesia" },
  { code: "TH", name: "Thailand" },
  { code: "VN", name: "Vietnam" },
  { code: "TR", name: "Turkey" },
  { code: "RU", name: "Russia" },
];

export default function CompetitionBrowser() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { effectiveTheme } = useTheme();
  const getInitialTab = (): "browse" | "registered" | "history" => {
    const tab = searchParams.get("tab");
    if (tab === "registered") return "registered";
    if (tab === "simulation") return "history";
    return "browse";
  };

  const [activeTab, setActiveTab] = useState<
    "browse" | "registered" | "history"
  >(getInitialTab());

  // Sync URL with tab changes
  const handleTabChange = (tab: "browse" | "registered" | "history") => {
    setActiveTab(tab);
    const newParams = new URLSearchParams(searchParams.toString());
    if (tab === "history") {
      newParams.set("tab", "simulation");
    } else if (tab === "registered") {
      newParams.set("tab", "registered");
    } else {
      newParams.set("tab", "browse");
    }
    router.replace(`/cube-lab/competitions?${newParams.toString()}`, {
      scroll: false,
    });
  };
  const [competitions, setCompetitions] = useState<WCACompetition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<
    WCACompetition[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("upcoming");
  const [showFilters, setShowFilters] = useState(true);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // Fetch competitions with caching
  const fetchCompetitions = useCallback(
    async (forceRefresh = false) => {
      const today = new Date().toISOString().split("T")[0];
      const cacheKey = `comps_${timeFilter}_${selectedRegion}_${today}`;

      // Check cache
      const { data: cached, isStale } = getFromCacheWithStaleCheck<
        WCACompetition[]
      >(
        cacheKey,
        15 * 60 * 1000, // 15 minutes
      );

      // Use cached data if fresh
      if (cached && !isStale && !forceRefresh) {
        setCompetitions(cached);
        setIsLoading(false);
        return;
      }

      // Use stale data while refreshing in background
      if (cached && isStale && !forceRefresh) {
        setCompetitions(cached);
        setIsLoading(false);
        setIsRefreshing(true);
      } else if (!cached) {
        setIsLoading(true);
      }

      setError(null);

      try {
        const url = `${WCA_CONFIG.API_BASE_URL}/competitions`;
        const params = new URLSearchParams();

        // Common params
        params.set("per_page", "100");

        // Sorting and filtering based on timeFilter
        if (timeFilter === "past") {
          params.set("sort", "-start_date");
        } else {
          params.set("sort", "start_date");
        }

        switch (timeFilter) {
          case "ongoing":
            // Ongoing: start date <= today <= end date
            const twoWeeksAgo = new Date();
            twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
            params.set("start", twoWeeksAgo.toISOString().split("T")[0]);
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            params.set("end", tomorrow.toISOString().split("T")[0]);
            break;
          case "past":
            const sixMonthsAgo = new Date();
            sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
            params.set("start", sixMonthsAgo.toISOString().split("T")[0]);
            params.set("end", today);
            break;
          case "upcoming":
            params.set("start", today);
            const threeMonthsLater = new Date();
            threeMonthsLater.setMonth(threeMonthsLater.getMonth() + 3);
            params.set("end", threeMonthsLater.toISOString().split("T")[0]);
            break;
        }

        if (selectedRegion !== "all") {
          params.set("country_iso2", selectedRegion);
        }

        const response = await fetch(`${url}?${params.toString()}`);
        if (!response.ok) throw new Error("Failed to fetch competitions");

        const data = await response.json();
        const transformed: WCACompetition[] = data.map((comp: any) => ({
          id: comp.id,
          name: comp.name,
          city: comp.city,
          country_iso2: comp.country_iso2,
          start_date: comp.start_date,
          end_date: comp.end_date,
          venue: comp.venue || "",
          event_ids: comp.event_ids || [],
          competitor_limit: comp.competitor_limit,
          registration_open: comp.registration_open,
          registration_close: comp.registration_close,
          url: comp.url,
          cancelled_at: comp.cancelled_at,
        }));

        // Cache for 30 minutes
        saveToCache(cacheKey, transformed, 30 * 60 * 1000);
        setCompetitions(transformed);
      } catch (err) {
        // Only set error if no cached data
        if (!cached) {
          setError(
            err instanceof Error ? err.message : "Failed to load competitions",
          );
        }
        // Log error if refreshing in background
        console.warn("Background refresh failed, using cached data:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [timeFilter, selectedRegion],
  );

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Apply filters
  useEffect(() => {
    let filtered = [...competitions];

    // Always filter out cancelled competitions
    filtered = filtered.filter((comp) => !comp.cancelled_at);

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(
        (comp) =>
          comp.name.toLowerCase().includes(query) ||
          comp.city.toLowerCase().includes(query) ||
          comp.country_iso2.toLowerCase().includes(query),
      );
    }

    if (selectedEvents.length > 0) {
      filtered = filtered.filter((comp) =>
        selectedEvents.some((event) => comp.event_ids.includes(event)),
      );
    }

    // Filter by time status using timezone-aware utilities
    const today = getLocalTodayStart();
    const tomorrow = getLocalTomorrowStart();

    filtered = filtered.filter((comp) => {
      // Parse dates using timezone-aware utility
      const startDay = parseCompetitionDate(comp.start_date);
      const endDay = parseCompetitionDate(comp.end_date);

      // Ongoing: start date <= today <= end date
      const isOngoing = today >= startDay && today <= endDay;

      // Past: end date < today
      const isPast = endDay < today;

      // Upcoming: start date >= tomorrow
      const isUpcoming = startDay >= tomorrow;

      if (timeFilter === "ongoing") {
        return isOngoing;
      } else if (timeFilter === "past") {
        return isPast;
      } else if (timeFilter === "upcoming") {
        return isUpcoming;
      }
      return true;
    });

    filtered.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return timeFilter === "past" ? dateB - dateA : dateA - dateB;
    });

    setFilteredCompetitions(filtered);
    setCurrentPage(1);
  }, [competitions, searchQuery, selectedEvents, timeFilter]);

  const paginatedCompetitions = filteredCompetitions.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  const totalPages = Math.ceil(filteredCompetitions.length / itemsPerPage);
  const isDarkTheme = effectiveTheme === "dark";

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId],
    );
  };

  // Utilities
  const formatDateRange = (startDate: string, endDate: string) => {
    return formatCompetitionDateRange(startDate, endDate);
  };

  const getCompetitionStatus = (comp: WCACompetition) => {
    return getCompetitionStatusDisplay(
      comp.start_date,
      comp.end_date,
      !!comp.cancelled_at,
    );
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 lg:p-8">
      {/* Walkthrough Modal and Floating Button */}
      <CompetitionWalkthrough />

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Tab Navigation */}
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          aria-label="Competition views"
          items={[
            { value: "browse", label: "Browse", icon: <Compass /> },
            { value: "registered", label: "Registered", icon: <CircleCheck /> },
            { value: "history", label: "Simulations", icon: <History /> },
          ]}
        />

        {/* Registered Tab Content */}
        {activeTab === "registered" && (
          <div className="space-y-6">
            <UpcomingCompetitionsSuggestions />
          </div>
        )}

        {/* History Tab Content */}
        {activeTab === "history" && (
          <div className="space-y-6">
            <SimulationHistory limit={20} showTitle={false} />
          </div>
        )}

        {/* Browse Tab Content */}
        {activeTab === "browse" && (
          <>
            {/* Filters */}
            <div className="timer-card">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center justify-between w-full text-(--text-primary) font-medium"
              >
                <span className="flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  {showFilters ? "Hide Filters" : "Show Filters"}
                </span>
                {showFilters ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </button>

              {showFilters && (
                <div className="mt-4 space-y-4">
                  {/* Events */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm text-(--text-secondary)">
                        Events
                      </label>
                      {selectedEvents.length > 0 && (
                        <button
                          onClick={() => setSelectedEvents([])}
                          className="text-xs text-(--primary) hover:underline"
                        >
                          Clear ({selectedEvents.length})
                        </button>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-1.5 sm:gap-2">
                      {WCA_EVENTS.map((event) => (
                        <button
                          key={event.id}
                          onClick={() => toggleEvent(event.id)}
                          title={event.name}
                          className={`p-1.5 sm:p-2 rounded-(--radius-control) border transition-all ${
                            selectedEvents.includes(event.id)
                              ? "border-(--primary) bg-(--primary)/20"
                              : "border-(--border) hover:border-(--border-hover) bg-(--surface)"
                          }`}
                        >
                          <Image
                            src={event.icon}
                            alt={event.name}
                            width={18}
                            height={18}
                            className="sm:w-5 sm:h-5 invert opacity-90"
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Region & Search */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <RegionDropdown
                      regions={REGIONS}
                      selectedRegion={selectedRegion}
                      onRegionChange={setSelectedRegion}
                      label="Region"
                    />
                    <Field label="Search">
                      <SearchInput
                        value={searchQuery}
                        onChange={setSearchQuery}
                        placeholder="Name or city…"
                      />
                    </Field>
                  </div>

                  {/* Time Filter */}
                  <div>
                    <span className="type-label block mb-1.5">When</span>
                    <SegmentedControl<TimeFilter>
                      value={timeFilter}
                      onChange={setTimeFilter}
                      aria-label="Competition time range"
                      fullWidth
                      options={(
                        ["ongoing", "upcoming", "past"] as TimeFilter[]
                      ).map((f) => ({
                        value: f,
                        label: f.charAt(0).toUpperCase() + f.slice(1),
                      }))}
                    />
                  </div>

                  {(selectedEvents.length > 0 ||
                    searchQuery ||
                    selectedRegion !== "all") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedEvents([]);
                        setSearchQuery("");
                        setSelectedRegion("all");
                      }}
                    >
                      Reset all filters
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-(--text-muted)">
              <span className="flex items-center gap-2">
                {filteredCompetitions.length} competition
                {filteredCompetitions.length !== 1 ? "s" : ""}
                {isRefreshing && (
                  <span className="flex items-center gap-1 text-(--primary)">
                    <RefreshCw className="w-3 h-3 animate-spin" />
                    <span className="hidden sm:inline">Updating...</span>
                  </span>
                )}
              </span>
              {totalPages > 1 && (
                <span>
                  Page {currentPage}/{totalPages}
                </span>
              )}
            </div>

            {/* Competition List */}
            {isLoading ? (
              <CompetitionCardsSkeleton count={5} />
            ) : error ? (
              <div className="timer-card">
                <ErrorState
                  description={error}
                  onRetry={() => fetchCompetitions()}
                />
              </div>
            ) : paginatedCompetitions.length === 0 ? (
              <div className="timer-card">
                <EmptyState
                  size="page"
                  icon={<Trophy />}
                  title="No competitions found"
                  description="Try a different region, event or date range."
                />
              </div>
            ) : (
              <div className="grid gap-3">
                {paginatedCompetitions.map((comp) => {
                  const status = getCompetitionStatus(comp);
                  return (
                    <Link
                      key={comp.id}
                      href={`/cube-lab/competitions/${comp.id}`}
                      className="group timer-card block hover:border-(--primary)/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-(--primary) focus-visible:ring-offset-2 focus-visible:ring-offset-(--surface)"
                    >
                      <div className="flex flex-col gap-3 sm:gap-4">
                        <div className="flex items-start justify-between gap-3 sm:gap-4">
                          <div className="min-w-0 flex-1 space-y-2">
                            <h3 className="line-clamp-2 text-sm font-semibold text-(--text-primary) transition-colors group-hover:text-(--primary) sm:text-base md:text-lg">
                              {comp.name}
                            </h3>
                            <div className="flex flex-wrap items-center gap-2">
                              <Badge tone={status.tone} shape="pill">
                                {status.label}
                              </Badge>
                              {comp.competitor_limit && (
                                <Badge shape="pill" icon={<Users />}>
                                  {comp.competitor_limit} limit
                                </Badge>
                              )}
                            </div>
                          </div>

                          <span className="inline-flex min-h-9 min-w-10 items-center justify-center gap-1.5 rounded-(--radius-control) bg-(--primary) px-3 py-2 text-xs font-semibold text-(--on-primary) transition-colors group-hover:bg-(--primary-hover) sm:min-w-28 sm:px-4 sm:text-sm">
                            <Play className="h-3.5 w-3.5 shrink-0 sm:h-4 sm:w-4" />
                            <span className="hidden sm:inline">Simulate</span>
                          </span>
                        </div>

                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-3">
                          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-(--radius-control) border border-(--border) bg-(--surface-elevated) px-2.5 py-2 text-xs text-(--text-secondary) sm:text-sm">
                            <Calendar className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                            <span className="truncate">
                              {formatDateRange(comp.start_date, comp.end_date)}
                            </span>
                          </span>
                          <span className="inline-flex min-w-0 items-center gap-1.5 rounded-(--radius-control) border border-(--border) bg-(--surface-elevated) px-2.5 py-2 text-xs text-(--text-secondary) sm:text-sm">
                            <MapPin className="h-3.5 w-3.5 shrink-0 text-(--text-muted)" />
                            <span className="truncate">
                              {comp.city}, {comp.country_iso2}
                            </span>
                          </span>
                        </div>

                        <div className="flex flex-wrap gap-1.5 border-t border-(--border) pt-3 sm:gap-2 sm:pt-4">
                          {comp.event_ids.slice(0, 12).map((eventId) => {
                            const event = WCA_EVENTS.find(
                              (e) => e.id === eventId,
                            );
                            return event ? (
                              <div
                                key={eventId}
                                className="rounded-(--radius-badge) border border-(--border) bg-(--surface-elevated) p-1.5"
                                title={event.name}
                              >
                                <Image
                                  src={event.icon}
                                  alt={event.name}
                                  width={16}
                                  height={16}
                                  className={`h-4 w-4 ${
                                    isDarkTheme
                                      ? "invert opacity-80"
                                      : "opacity-80"
                                  }`}
                                />
                              </div>
                            ) : null;
                          })}
                          {comp.event_ids.length > 12 && (
                            <span className="inline-flex items-center rounded-(--radius-badge) border border-(--border) bg-(--surface-elevated) px-2 py-1 text-xs font-medium text-(--text-muted)">
                              +{comp.event_ids.length - 12}
                            </span>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* Pagination */}
            <Pagination
              page={currentPage}
              totalPages={totalPages}
              onChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </div>
  );
}
