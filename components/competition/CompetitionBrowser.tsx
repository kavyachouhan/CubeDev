"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Trophy,
  Calendar,
  MapPin,
  Filter,
  Search,
  Play,
  ChevronDown,
  ChevronUp,
  Users,
  ChevronLeft,
  ChevronRight,
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
import CompetitionWalkthrough from "./CompetitionWalkthrough";

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
        15 * 60 * 1000 // 15 minutes
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
            err instanceof Error ? err.message : "Failed to load competitions"
          );
        }
        // Log error if refreshing in background
        console.warn("Background refresh failed, using cached data:", err);
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [timeFilter, selectedRegion]
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
          comp.country_iso2.toLowerCase().includes(query)
      );
    }

    if (selectedEvents.length > 0) {
      filtered = filtered.filter((comp) =>
        selectedEvents.some((event) => comp.event_ids.includes(event))
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
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCompetitions.length / itemsPerPage);

  const toggleEvent = (eventId: string) => {
    setSelectedEvents((prev) =>
      prev.includes(eventId)
        ? prev.filter((e) => e !== eventId)
        : [...prev, eventId]
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
      !!comp.cancelled_at
    );
  };

  return (
    <div className="h-full overflow-y-auto p-3 sm:p-6 lg:p-8">
      {/* Walkthrough Modal and Floating Button */}
      <CompetitionWalkthrough />

      <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
        {/* Tab Navigation */}
        <div className="border-b border-[var(--border)]">
          <nav className="flex space-x-4 sm:space-x-6 overflow-x-auto">
            <button
              onClick={() => handleTabChange("browse")}
              className={`flex items-center gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "browse"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              <Compass className="w-4 h-4" />
              <span className="hidden sm:inline">Browse</span>
              <span className="sm:hidden">Browse</span>
            </button>
            <button
              onClick={() => handleTabChange("registered")}
              className={`flex items-center gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "registered"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              <CircleCheck className="w-4 h-4" />
              <span className="hidden sm:inline">Registered</span>
              <span className="sm:hidden">Registered</span>
            </button>
            <button
              onClick={() => handleTabChange("history")}
              className={`flex items-center gap-2 py-3 sm:py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                activeTab === "history"
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:border-[var(--border)]"
              }`}
            >
              <History className="w-4 h-4" />
              <span className="hidden sm:inline">Simulations</span>
              <span className="sm:hidden">Simulations</span>
            </button>
          </nav>
        </div>

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
                className="flex items-center justify-between w-full text-[var(--text-primary)] font-medium"
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
                      <label className="text-sm text-[var(--text-secondary)]">
                        Events
                      </label>
                      {selectedEvents.length > 0 && (
                        <button
                          onClick={() => setSelectedEvents([])}
                          className="text-xs text-[var(--primary)] hover:underline"
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
                          className={`p-1.5 sm:p-2 rounded-lg border transition-all ${
                            selectedEvents.includes(event.id)
                              ? "border-[var(--primary)] bg-[var(--primary)]/20"
                              : "border-[var(--border)] hover:border-[var(--border-hover)] bg-[var(--surface)]"
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
                    <div>
                      <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                        <input
                          type="text"
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          placeholder="Name or city..."
                          className="w-full pl-9 pr-3 py-2 bg-[var(--surface)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] text-sm placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Time Filter */}
                  <div>
                    <label className="text-sm text-[var(--text-secondary)] mb-1.5 block">
                      When
                    </label>
                    <div className="flex gap-2">
                      {(["ongoing", "upcoming", "past"] as TimeFilter[]).map(
                        (f) => (
                          <button
                            key={f}
                            onClick={() => setTimeFilter(f)}
                            className={`flex-1 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                              timeFilter === f
                                ? "bg-[var(--primary)] text-white"
                                : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]/80"
                            }`}
                          >
                            {f.charAt(0).toUpperCase() + f.slice(1)}
                          </button>
                        )
                      )}
                    </div>
                  </div>

                  {(selectedEvents.length > 0 ||
                    searchQuery ||
                    selectedRegion !== "all") && (
                    <button
                      onClick={() => {
                        setSelectedEvents([]);
                        setSearchQuery("");
                        setSelectedRegion("all");
                      }}
                      className="text-sm text-[var(--primary)] hover:underline"
                    >
                      Reset All Filters
                    </button>
                  )}
                </div>
              )}
            </div>

            {/* Results info */}
            <div className="flex items-center justify-between text-xs sm:text-sm text-[var(--text-muted)]">
              <span className="flex items-center gap-2">
                {filteredCompetitions.length} competition
                {filteredCompetitions.length !== 1 ? "s" : ""}
                {isRefreshing && (
                  <span className="flex items-center gap-1 text-[var(--primary)]">
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
              <div className="timer-card text-center py-8">
                <p className="text-[var(--error)] mb-4">{error}</p>
                <button
                  onClick={() => fetchCompetitions()}
                  className="px-4 py-2 bg-[var(--primary)] text-white rounded-lg"
                >
                  Retry
                </button>
              </div>
            ) : paginatedCompetitions.length === 0 ? (
              <div className="timer-card text-center py-12">
                <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
                <p className="text-[var(--text-secondary)]">
                  No competitions found
                </p>
              </div>
            ) : (
              <div className="grid gap-3">
                {paginatedCompetitions.map((comp) => {
                  const status = getCompetitionStatus(comp);
                  return (
                    <Link
                      key={comp.id}
                      href={`/cube-lab/competitions/${comp.id}`}
                      className="timer-card hover:border-[var(--primary)]/50 transition-all group"
                    >
                      <div className="flex flex-col gap-3">
                        {/* Header Row - Date, Status, CTA */}
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-[var(--text-primary)]">
                              <Calendar className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                              <span className="font-medium">
                                {formatDateRange(
                                  comp.start_date,
                                  comp.end_date
                                )}
                              </span>
                            </div>
                            <span
                              className={`px-2 py-0.5 text-xs rounded-full whitespace-nowrap ${status.color}`}
                            >
                              {status.label}
                            </span>
                          </div>
                          <span className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-[var(--primary)] text-white text-xs sm:text-sm font-medium rounded-lg group-hover:bg-[var(--primary-hover)] transition-colors whitespace-nowrap">
                            <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            <span className="hidden sm:inline">Simulate</span>
                          </span>
                        </div>

                        {/* Competition Info */}
                        <div className="space-y-2">
                          <h3 className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors text-sm sm:text-base">
                            {comp.name}
                          </h3>
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-[var(--text-muted)]">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {comp.city}, {comp.country_iso2}
                            </span>
                            {comp.competitor_limit && (
                              <span className="flex items-center gap-1">
                                <Users className="w-3 h-3" />
                                {comp.competitor_limit} limit
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Events */}
                        <div className="flex flex-wrap gap-1">
                          {comp.event_ids.slice(0, 12).map((eventId) => {
                            const event = WCA_EVENTS.find(
                              (e) => e.id === eventId
                            );
                            return event ? (
                              <div
                                key={eventId}
                                className="p-1 rounded bg-[var(--surface-elevated)]"
                                title={event.name}
                              >
                                <Image
                                  src={event.icon}
                                  alt={event.name}
                                  width={14}
                                  height={14}
                                  className="invert opacity-70"
                                />
                              </div>
                            ) : null;
                          })}
                          {comp.event_ids.length > 12 && (
                            <span className="px-1.5 py-0.5 text-xs text-[var(--text-muted)] bg-[var(--surface-elevated)] rounded">
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
            {totalPages > 1 && (
              <div className="timer-card">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.max(prev - 1, 1))
                    }
                    disabled={currentPage === 1}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Previous</span>
                    <span className="sm:hidden">PREVIOUS</span>
                  </button>

                  <div className="flex items-center gap-2 flex-wrap justify-center">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber;
                      if (totalPages <= 5) {
                        pageNumber = i + 1;
                      } else if (currentPage <= 3) {
                        pageNumber = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i;
                      } else {
                        pageNumber = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNumber}
                          onClick={() => setCurrentPage(pageNumber)}
                          className={`w-10 h-10 rounded-lg font-medium transition-all duration-200 ${
                            currentPage === pageNumber
                              ? "bg-[var(--primary)] text-white"
                              : "bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)]"
                          }`}
                        >
                          {pageNumber}
                        </button>
                      );
                    })}

                    {totalPages > 5 && currentPage < totalPages - 2 && (
                      <>
                        <span className="text-[var(--text-muted)]">...</span>
                        <button
                          onClick={() => setCurrentPage(totalPages)}
                          className="w-10 h-10 rounded-lg bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] font-medium transition-all duration-200"
                        >
                          {totalPages}
                        </button>
                      </>
                    )}
                  </div>

                  <button
                    onClick={() =>
                      setCurrentPage((prev) => Math.min(prev + 1, totalPages))
                    }
                    disabled={currentPage === totalPages}
                    className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] hover:bg-[var(--surface-elevated)]/80 border border-[var(--border)] hover:border-[var(--primary)] text-[var(--text-primary)] rounded-lg transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto justify-center"
                  >
                    <span className="hidden sm:inline">Next</span>
                    <span className="sm:hidden">NEXT</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
