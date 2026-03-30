"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Trophy,
  MapPin,
  Filter,
  Search,
  Play,
  ChevronDown,
  Users,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import Image from "next/image";
import { WCA_EVENTS, WCACompetition } from "./CompetitionSimulator";
import { WCA_CONFIG } from "@/lib/wca-config";
import { getFromCache, saveToCache } from "@/lib/wca-cache";
import { CompetitionCardsSkeleton } from "@/components/SkeletonLoaders";
import RegionDropdown from "./RegionDropdown";

interface CompetitionListProps {
  onStartSimulation: (competition: WCACompetition, eventId: string) => void;
}

type TimeFilter = "present" | "recent" | "past" | "upcoming" | "custom";

// Country data for region filter
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

export default function CompetitionList({
  onStartSimulation,
}: CompetitionListProps) {
  const [competitions, setCompetitions] = useState<WCACompetition[]>([]);
  const [filteredCompetitions, setFilteredCompetitions] = useState<
    WCACompetition[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("present");
  const [showFilters, setShowFilters] = useState(true);
  const [showCancelled, setShowCancelled] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(20);

  // Selected competition for event modal
  const [selectedCompetition, setSelectedCompetition] =
    useState<WCACompetition | null>(null);

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  // Fetch competitions from WCA API
  const fetchCompetitions = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Build query params based on time filter
      let url = `${WCA_CONFIG.API_BASE_URL}/competitions`;
      const params = new URLSearchParams();

      const today = new Date().toISOString().split("T")[0];

      switch (timeFilter) {
        case "present":
          // Competitions happening now or starting soon
          params.set("start", today);
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          params.set("end", nextMonth.toISOString().split("T")[0]);
          break;
        case "recent":
          // Last 30 days
          const thirtyDaysAgo = new Date();
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          params.set("start", thirtyDaysAgo.toISOString().split("T")[0]);
          params.set("end", today);
          break;
        case "past":
          // Last 6 months
          const sixMonthsAgo = new Date();
          sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
          params.set("start", sixMonthsAgo.toISOString().split("T")[0]);
          params.set("end", today);
          break;
        case "upcoming":
          // Next 6 months
          params.set("start", today);
          const sixMonthsLater = new Date();
          sixMonthsLater.setMonth(sixMonthsLater.getMonth() + 6);
          params.set("end", sixMonthsLater.toISOString().split("T")[0]);
          break;
        case "custom":
          if (customStartDate) params.set("start", customStartDate);
          if (customEndDate) params.set("end", customEndDate);
          break;
      }

      if (selectedRegion !== "all") {
        params.set("country_iso2", selectedRegion);
      }

      // Check cache first
      const cacheKey = `competitions_${timeFilter}_${selectedRegion}_${customStartDate}_${customEndDate}`;
      const cached = getFromCache<WCACompetition[]>(cacheKey);

      if (cached) {
        setCompetitions(cached);
        setIsLoading(false);
        return;
      }

      const response = await fetch(`${url}?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch competitions");
      }

      const data = await response.json();

      // Transform data to WCACompetition[]
      const transformedData: WCACompetition[] = data.map((comp: any) => ({
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
        latitude_degrees: comp.latitude_degrees,
        longitude_degrees: comp.longitude_degrees,
      }));

      // Cache for 1 hour
      saveToCache(cacheKey, transformedData, 60 * 60 * 1000);
      setCompetitions(transformedData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load competitions"
      );
    } finally {
      setIsLoading(false);
    }
  }, [timeFilter, selectedRegion, customStartDate, customEndDate]);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

  // Apply filters
  useEffect(() => {
    let filtered = [...competitions];

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (comp) =>
          comp.name.toLowerCase().includes(query) ||
          comp.city.toLowerCase().includes(query) ||
          comp.venue.toLowerCase().includes(query)
      );
    }

    // Filter by selected events
    if (selectedEvents.length > 0) {
      filtered = filtered.filter((comp) =>
        selectedEvents.some((event) => comp.event_ids.includes(event))
      );
    }

    // Filter cancelled competitions
    if (!showCancelled) {
      filtered = filtered.filter((comp) => !comp.cancelled_at);
    }

    // Sort by date
    filtered.sort((a, b) => {
      const dateA = new Date(a.start_date).getTime();
      const dateB = new Date(b.start_date).getTime();
      return timeFilter === "past" || timeFilter === "recent"
        ? dateB - dateA
        : dateA - dateB;
    });

    setFilteredCompetitions(filtered);
    setCurrentPage(1);
  }, [competitions, searchQuery, selectedEvents, showCancelled, timeFilter]);

  // Paginate results
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

  const clearEventFilters = () => {
    setSelectedEvents([]);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatDateRange = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (startDate === endDate) {
      return formatDate(startDate);
    }

    const startMonth = start.toLocaleDateString("en-US", { month: "short" });
    const endMonth = end.toLocaleDateString("en-US", { month: "short" });

    if (startMonth === endMonth && start.getFullYear() === end.getFullYear()) {
      return `${startMonth} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
    }

    return `${formatDate(startDate)} - ${formatDate(endDate)}`;
  };

  return (
    <div className="space-y-4">
      {/* Filters Section */}
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 text-(--text-primary) font-medium"
          >
            <Filter className="w-4 h-4" />
            <span>{showFilters ? "Hide Filters" : "Show Filters"}</span>
            <ChevronDown
              className={`w-4 h-4 transition-transform ${showFilters ? "rotate-180" : ""}`}
            />
          </button>
          {(selectedEvents.length > 0 ||
            searchQuery ||
            selectedRegion !== "all") && (
            <button
              onClick={() => {
                clearEventFilters();
                setSearchQuery("");
                setSelectedRegion("all");
              }}
              className="text-sm text-(--primary) hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>

        {showFilters && (
          <div className="space-y-4">
            {/* Event Filter */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm text-(--text-secondary)">
                  Events
                </label>
                {selectedEvents.length > 0 && (
                  <button
                    onClick={clearEventFilters}
                    className="text-xs text-(--text-muted) hover:text-(--text-primary)"
                  >
                    Clear ({selectedEvents.length})
                  </button>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {WCA_EVENTS.map((event) => (
                  <button
                    key={event.id}
                    onClick={() => toggleEvent(event.id)}
                    title={event.name}
                    className={`p-2 rounded-lg border transition-colors ${
                      selectedEvents.includes(event.id)
                        ? "border-(--primary) bg-(--primary)/10"
                        : "border-(--border) hover:border-(--border-hover) bg-(--surface)"
                    }`}
                  >
                    <Image
                      src={event.icon}
                      alt={event.name}
                      width={20}
                      height={20}
                      className="opacity-80"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Region and Search */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <RegionDropdown
                regions={REGIONS}
                selectedRegion={selectedRegion}
                onRegionChange={setSelectedRegion}
                label="Region"
              />
              <div>
                <label className="text-sm text-(--text-secondary) mb-2 block">
                  Search
                </label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-muted)" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Name or city..."
                    className="w-full pl-10 pr-4 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                </div>
              </div>
            </div>

            {/* Time Filter */}
            <div>
              <label className="text-sm text-(--text-secondary) mb-2 block">
                When
              </label>
              <div className="flex flex-wrap gap-2">
                {(
                  [
                    "present",
                    "recent",
                    "past",
                    "upcoming",
                    "custom",
                  ] as TimeFilter[]
                ).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                      timeFilter === filter
                        ? "bg-(--primary) text-white"
                        : "bg-(--surface-elevated) text-(--text-secondary) hover:text-(--text-primary)"
                    }`}
                  >
                    {filter.charAt(0).toUpperCase() + filter.slice(1)}
                  </button>
                ))}
              </div>
              {timeFilter === "custom" && (
                <div className="flex flex-wrap gap-4 mt-3">
                  <div>
                    <label className="text-xs text-(--text-muted) block mb-1">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => setCustomStartDate(e.target.value)}
                      className="px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-(--text-muted) block mb-1">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => setCustomEndDate(e.target.value)}
                      className="px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Show Cancelled */}
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showCancelled}
                onChange={(e) => setShowCancelled(e.target.checked)}
                className="w-4 h-4 rounded border-(--border) text-(--primary) focus:ring-(--primary)"
              />
              <span className="text-sm text-(--text-secondary)">
                Show cancelled competitions
              </span>
            </label>
          </div>
        )}
      </div>

      {/* Results Count */}
      <div className="flex items-center justify-between text-sm text-(--text-muted)">
        <span>
          {filteredCompetitions.length} competition
          {filteredCompetitions.length !== 1 ? "s" : ""} found
        </span>
        {totalPages > 1 && (
          <span>
            Page {currentPage} of {totalPages}
          </span>
        )}
      </div>

      {/* Competition List */}
      {isLoading ? (
        <CompetitionCardsSkeleton count={5} />
      ) : error ? (
        <div className="timer-card text-center py-8">
          <p className="text-(--error)">{error}</p>
          <button
            onClick={fetchCompetitions}
            className="mt-4 px-4 py-2 bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
          >
            Retry
          </button>
        </div>
      ) : paginatedCompetitions.length === 0 ? (
        <div className="timer-card text-center py-8">
          <Trophy className="w-12 h-12 text-(--text-muted) mx-auto mb-3" />
          <p className="text-(--text-secondary)">No competitions found</p>
          <p className="text-sm text-(--text-muted) mt-1">
            Try adjusting your filters
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {paginatedCompetitions.map((competition) => (
            <div
              key={competition.id}
              className={`timer-card hover:border-(--primary)/50 transition-all cursor-pointer ${
                competition.cancelled_at ? "opacity-60" : ""
              }`}
              onClick={() => setSelectedCompetition(competition)}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {/* Date */}
                <div className="shrink-0 text-center sm:w-28">
                  <div className="text-sm font-medium text-(--text-primary)">
                    {formatDateRange(
                      competition.start_date,
                      competition.end_date
                    )}
                  </div>
                </div>

                {/* Competition Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-2">
                    <h3 className="font-medium text-(--text-primary) truncate">
                      {competition.name}
                    </h3>
                    {competition.cancelled_at && (
                      <span className="shrink-0 px-2 py-0.5 text-xs bg-(--error)/10 text-(--error) rounded">
                        Cancelled
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-1 text-sm text-(--text-muted)">
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3 h-3" />
                      {competition.city}, {competition.country_iso2}
                    </span>
                    {competition.competitor_limit && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        {competition.competitor_limit} limit
                      </span>
                    )}
                  </div>
                </div>

                {/* Events */}
                <div className="flex flex-wrap gap-1 sm:max-w-[200px]">
                  {competition.event_ids.slice(0, 6).map((eventId) => {
                    const event = WCA_EVENTS.find((e) => e.id === eventId);
                    return event ? (
                      <div
                        key={eventId}
                        className="p-1 rounded bg-(--surface-elevated)"
                        title={event.name}
                      >
                        <Image
                          src={event.icon}
                          alt={event.name}
                          width={16}
                          height={16}
                          className="opacity-70"
                        />
                      </div>
                    ) : null;
                  })}
                  {competition.event_ids.length > 6 && (
                    <div className="px-2 py-1 text-xs text-(--text-muted) bg-(--surface-elevated) rounded">
                      +{competition.event_ids.length - 6}
                    </div>
                  )}
                </div>

                {/* Action */}
                <div className="shrink-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedCompetition(competition);
                    }}
                    className="px-3 py-1.5 text-sm font-medium bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors flex items-center gap-1"
                  >
                    <Play className="w-3 h-3" />
                    Simulate
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-lg border border-(--border) text-(--text-secondary) hover:bg-(--surface-elevated) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              return (
                <button
                  key={pageNum}
                  onClick={() => setCurrentPage(pageNum)}
                  className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                    currentPage === pageNum
                      ? "bg-(--primary) text-white"
                      : "text-(--text-secondary) hover:bg-(--surface-elevated)"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
          </div>
          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-lg border border-(--border) text-(--text-secondary) hover:bg-(--surface-elevated) disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Event Selection Modal */}
      {selectedCompetition && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-(--surface) border border-(--border) rounded-xl max-w-md w-full max-h-[80vh] overflow-y-auto">
            <div className="sticky top-0 bg-(--surface) border-b border-(--border) p-4 flex items-center justify-between">
              <h3 className="font-bold text-(--text-primary)">
                Select Event to Simulate
              </h3>
              <button
                onClick={() => setSelectedCompetition(null)}
                className="p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <p className="text-sm text-(--text-muted) mb-4">
                {selectedCompetition.name}
              </p>
              <div className="grid grid-cols-3 gap-3">
                {selectedCompetition.event_ids.map((eventId) => {
                  const event = WCA_EVENTS.find((e) => e.id === eventId);
                  return event ? (
                    <button
                      key={eventId}
                      onClick={() => {
                        onStartSimulation(selectedCompetition, eventId);
                        setSelectedCompetition(null);
                      }}
                      className="flex flex-col items-center gap-2 p-3 rounded-lg border border-(--border) hover:border-(--primary) hover:bg-(--primary)/5 transition-colors"
                    >
                      <Image
                        src={event.icon}
                        alt={event.name}
                        width={28}
                        height={28}
                        className="opacity-80"
                      />
                      <span className="text-xs text-(--text-secondary)">
                        {event.name}
                      </span>
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}