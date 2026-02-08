"use client";

import { useState, useMemo, useRef, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  Target,
  Calendar as CalendarIcon,
  List,
  Grid3X3,
  Smile,
  Meh,
  Frown,
  Battery,
} from "lucide-react";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  addMonths,
  subMonths,
} from "date-fns";
import { CoachJournalCalendarSkeleton } from "@/components/SkeletonLoaders";
import {
  getCachedJournalEntries,
  cacheJournalEntries,
  CachedJournalEntry,
} from "@/lib/coach-cache";

interface JournalEntry {
  _id: Id<"coachJournalEntries">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  entryDate: number;
  solveCount?: number;
  sessionAverage?: number;
  bestSingle?: number;
  practiceMinutes?: number;
  customAverage?: number;
  customSolveCount?: number;
  mood: "great" | "good" | "okay" | "frustrated" | "tired";
  wentWell?: string;
  challenges?: string;
  notes?: string;
  focusAreas?: string[];
  completedTaskIndices?: number[];
  mediaUrls?: string[];
  mediaFileIds?: string[];
  mediaTypes?: string[];
  createdAt: number;
}

interface CoachJournalCalendarProps {
  userId: Id<"users">;
  onAddEntry: (date: Date) => void;
  onViewEntry?: (entry: JournalEntry) => void;
}

type ViewMode = "month" | "list";

const moodIcons: Record<string, React.ElementType> = {
  great: Smile,
  good: Smile,
  okay: Meh,
  frustrated: Frown,
  tired: Battery,
};

const moodColors: Record<string, string> = {
  great: "text-[var(--success)]",
  good: "text-[var(--primary)]",
  okay: "text-[var(--warning)]",
  frustrated: "text-[var(--error)]",
  tired: "text-[var(--text-muted)]",
};

const moodBgColors: Record<string, string> = {
  great: "bg-[var(--success)]/10",
  good: "bg-[var(--primary)]/10",
  okay: "bg-[var(--warning)]/10",
  frustrated: "bg-[var(--error)]/10",
  tired: "bg-[var(--surface-elevated)]",
};

const moodLabels: Record<string, string> = {
  great: "Great",
  good: "Good",
  okay: "Okay",
  frustrated: "Frustrated",
  tired: "Tired",
};

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

export default function CoachJournalCalendar({
  userId,
  onAddEntry,
  onViewEntry,
}: CoachJournalCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());

  // Ref for mobile day scroll container
  const mobileScrollRef = useRef<HTMLDivElement>(null);
  const todayButtonRef = useRef<HTMLButtonElement>(null);

  // Get cached entries on initial load
  const [cachedEntries, setCachedEntries] = useState<
    CachedJournalEntry[] | null
  >(() => getCachedJournalEntries(userId));

  // Get journal entries for the current month range
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);

  const journalEntriesQuery = useQuery(api.coach.getJournalEntries, {
    userId,
    startDate: monthStart.getTime(),
    endDate: monthEnd.getTime(),
  });

  // Cache entries when fresh data arrives
  useEffect(() => {
    if (journalEntriesQuery) {
      const entriesData: CachedJournalEntry[] = journalEntriesQuery.map(
        (e) => ({
          _id: e._id,
          userId: e.userId,
          profileId: e.profileId,
          planId: e.planId,
          entryDate: e.entryDate,
          linkedSessionId: e.linkedSessionId,
          solveCount: e.solveCount,
          sessionAverage: e.sessionAverage,
          bestSingle: e.bestSingle,
          practiceMinutes: e.practiceMinutes,
          customAverage: e.customAverage,
          customSolveCount: e.customSolveCount,
          mood: e.mood,
          wentWell: e.wentWell,
          challenges: e.challenges,
          notes: e.notes,
          focusAreas: e.focusAreas,
          completedTaskIndices: e.completedTaskIndices,
          mediaUrls: e.mediaUrls,
          mediaFileIds: e.mediaFileIds,
          mediaTypes: e.mediaTypes,
          createdAt: e.createdAt,
          updatedAt: e.updatedAt || e.createdAt,
        }),
      );
      cacheJournalEntries(userId, entriesData);
      setCachedEntries(entriesData);
    }
  }, [journalEntriesQuery, userId]);

  // Filter cached entries for current month if no fresh data yet
  const cachedForMonth = useMemo(() => {
    if (!cachedEntries) return null;
    const start = monthStart.getTime();
    const end = monthEnd.getTime();
    return cachedEntries.filter(
      (e) => e.entryDate >= start && e.entryDate <= end,
    );
  }, [cachedEntries, monthStart, monthEnd]);

  // Use fresh data if available, otherwise use cached (cast cached to JournalEntry type)
  const journalEntries: JournalEntry[] | undefined = journalEntriesQuery
    ? journalEntriesQuery
    : cachedForMonth
      ? (cachedForMonth as unknown as JournalEntry[])
      : undefined;

  const isLoading = journalEntriesQuery === undefined && !cachedForMonth;

  // Calculate calendar days
  const calendarDays = useMemo(() => {
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
    return eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  }, [currentDate]);

  const today = new Date();

  // Auto-scroll to today's date in mobile month view
  useEffect(() => {
    if (
      viewMode === "month" &&
      mobileScrollRef.current &&
      todayButtonRef.current
    ) {
      // Calculate scroll position to center today's date
      const container = mobileScrollRef.current;
      const todayButton = todayButtonRef.current;
      const containerWidth = container.offsetWidth;
      const buttonLeft = todayButton.offsetLeft;
      const buttonWidth = todayButton.offsetWidth;

      // Scroll to center the today button
      const scrollPosition = buttonLeft - containerWidth / 2 + buttonWidth / 2;
      container.scrollTo({
        left: Math.max(0, scrollPosition),
        behavior: "auto",
      });
    }
  }, [viewMode, currentDate, calendarDays]);

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
    setSelectedDate(null);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  };

  const handleDateClick = (date: Date) => {
    setSelectedDate(date);
  };

  // Get entry for a specific date (returns first entry for backward compatibility)
  const getEntryForDate = (date: Date): JournalEntry | null => {
    if (!journalEntries) return null;
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return (
      journalEntries.find(
        (entry) =>
          entry.entryDate >= startOfDay.getTime() &&
          entry.entryDate <= endOfDay.getTime(),
      ) || null
    );
  };

  // Get all entries for a specific date
  const getEntriesForDate = (date: Date): JournalEntry[] => {
    if (!journalEntries) return [];
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return journalEntries.filter(
      (entry) =>
        entry.entryDate >= startOfDay.getTime() &&
        entry.entryDate <= endOfDay.getTime(),
    );
  };

  // Get total entry count for the month
  const monthEntryCount = useMemo(() => {
    return journalEntries?.length || 0;
  }, [journalEntries]);

  // Get entries for selected date (supports multiple entries per day)
  const selectedDateEntries = selectedDate
    ? getEntriesForDate(selectedDate)
    : [];

  // Get total practice time for the month
  const monthTotalTime = useMemo(() => {
    if (!journalEntries) return 0;
    return journalEntries.reduce(
      (sum, entry) => sum + (entry.practiceMinutes || 0),
      0,
    );
  }, [journalEntries]);

  // Get total solves for the month (3x3 or custom)
  const monthTotalSolves = useMemo(() => {
    if (!journalEntries) return 0;
    return journalEntries.reduce(
      (sum, entry) => sum + (entry.customSolveCount || entry.solveCount || 0),
      0,
    );
  }, [journalEntries]);

  // Get active days count (unique days with entries)
  const activeDaysCount = useMemo(() => {
    if (!journalEntries || journalEntries.length === 0) return 0;
    // Count unique days by normalizing to start of day
    const uniqueDays = new Set(
      journalEntries.map((entry) => {
        const date = new Date(entry.entryDate);
        return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      }),
    );
    return uniqueDays.size;
  }, [journalEntries]);

  const formatDuration = (minutes: number): string => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  // Show skeleton while loading
  if (isLoading) {
    return <CoachJournalCalendarSkeleton />;
  }

  return (
    <div className="timer-card">
      {/* Header */}
      <div className="flex flex-col gap-4 mb-6">
        {/* Top Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Date Icon */}
            <div className="flex flex-col items-center overflow-hidden rounded-lg border border-[var(--border)] w-12 sm:w-14 flex-shrink-0">
              <div className="flex h-5 sm:h-6 w-full items-center justify-center bg-[var(--primary)] text-center text-xs font-semibold text-white uppercase">
                {format(currentDate, "MMM")}
              </div>
              <div className="flex w-full items-center justify-center text-base sm:text-lg font-bold text-[var(--text-primary)]">
                {format(currentDate, "dd")}
              </div>
            </div>

            {/* Title */}
            <div>
              <h2 className="text-base sm:text-lg font-semibold text-[var(--text-primary)] font-statement">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <span className="text-xs text-[var(--text-muted)]">
                {monthEntryCount} {monthEntryCount === 1 ? "entry" : "entries"}
              </span>
            </div>
          </div>

          {/* Desktop: Navigation + View Toggle */}
          <div className="hidden sm:flex items-center gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToday}
                className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
                aria-label="Today"
                title="Jump to Today"
              >
                Today
              </button>
              <button
                onClick={handlePreviousMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Previous month"
                title="Previous month"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={handleNextMonth}
                className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label="Next month"
                title="Next month"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
              <button
                onClick={() => setViewMode("month")}
                className={`p-2 transition-colors ${
                  viewMode === "month"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                }`}
                aria-label="Month view"
                title="Month view"
              >
                <Grid3X3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${
                  viewMode === "list"
                    ? "bg-[var(--primary)] text-white"
                    : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                }`}
                aria-label="List view"
                title="List view"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex sm:hidden items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToday}
              className="px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg text-[var(--text-secondary)] hover:bg-[var(--surface-elevated)] transition-colors"
              aria-label="Today"
              title="Jump to Today"
            >
              Today
            </button>
            <button
              onClick={handlePreviousMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Previous month"
              title="Previous month"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg hover:bg-[var(--surface-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="Next month"
              title="Next month"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Mobile View Toggle */}
          <div className="flex items-center border border-[var(--border)] rounded-lg overflow-hidden">
            <button
              onClick={() => setViewMode("month")}
              className={`p-2 transition-colors ${
                viewMode === "month"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              }`}
              aria-label="Month view"
              title="Month view"
            >
              <Grid3X3 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 transition-colors ${
                viewMode === "list"
                  ? "bg-[var(--primary)] text-white"
                  : "text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
              }`}
              aria-label="List view"
              title="List view"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <CalendarIcon className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs text-[var(--text-muted)]">
                Active Days
              </span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {activeDaysCount}
            </p>
          </div>
          <div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Target className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs text-[var(--text-muted)]">Entries</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {monthEntryCount}
            </p>
          </div>
          <div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <Clock className="w-4 h-4 text-[var(--primary)]" />
              <span className="text-xs text-[var(--text-muted)]">
                Total Time
              </span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {formatDuration(monthTotalTime)}
            </p>
          </div>
          <div className="p-3 bg-[var(--surface-elevated)] rounded-lg">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-4 h-4 text-[var(--primary)] flex items-center justify-center font-bold text-sm">
                #
              </div>
              <span className="text-xs text-[var(--text-muted)]">Solves</span>
            </div>
            <p className="text-xl font-bold text-[var(--text-primary)]">
              {monthTotalSolves}
            </p>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {viewMode === "month" && (
        <>
          {/* Desktop: Grid Layout */}
          <div className="hidden md:block">
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Month Grid */}
              <div className="flex-1">
                {/* Day Headers */}
                <div className="grid grid-cols-7 border-b border-[var(--border)] mb-1">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(
                    (day) => (
                      <div
                        key={day}
                        className="py-2 text-center text-xs font-medium text-[var(--text-muted)] uppercase"
                      >
                        {day}
                      </div>
                    ),
                  )}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-px bg-[var(--border)]">
                  {calendarDays.map((day) => {
                    const dayStr = format(day, "yyyy-MM-dd");
                    const entries = getEntriesForDate(day);
                    const entry = entries[0]; // First entry for display
                    const entryCount = entries.length;
                    const isCurrentMonth = isSameMonth(day, currentDate);
                    const isToday = isSameDay(day, today);
                    const isSelected =
                      selectedDate && isSameDay(day, selectedDate);
                    const MoodIcon = entry ? moodIcons[entry.mood] : null;

                    return (
                      <div
                        key={dayStr}
                        onClick={() => handleDateClick(day)}
                        className={`
                          min-h-[100px] p-2 bg-[var(--surface)] cursor-pointer transition-colors
                          ${!isCurrentMonth ? "bg-[var(--surface-elevated)]/50" : ""}
                          ${isSelected ? "ring-2 ring-[var(--primary)] ring-inset" : "hover:bg-[var(--surface-elevated)]"}
                        `}
                      >
                        {/* Date Number */}
                        <div
                          className={`
                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full mb-1
                            ${isToday ? "bg-[var(--primary)] text-white" : ""}
                            ${!isCurrentMonth ? "text-[var(--text-muted)]" : "text-[var(--text-primary)]"}
                          `}
                        >
                          {format(day, "d")}
                        </div>

                        {/* Entry Preview */}
                        {entry && (
                          <div
                            className={`
                              text-xs px-1.5 py-1 rounded cursor-pointer relative
                              border border-[var(--border)] ${moodBgColors[entry.mood]}
                            `}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDateClick(day);
                            }}
                          >
                            {entryCount > 1 && (
                              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center font-medium">
                                {entryCount}
                              </span>
                            )}
                            <div className="flex items-center gap-1">
                              {MoodIcon && (
                                <MoodIcon
                                  className={`w-3 h-3 ${moodColors[entry.mood]}`}
                                />
                              )}
                              <span className="text-[var(--text-secondary)] truncate">
                                {moodLabels[entry.mood]}
                              </span>
                            </div>
                            {entry.practiceMinutes && (
                              <div className="text-[var(--text-muted)] mt-0.5">
                                {entry.practiceMinutes}min
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Selected Day Details Panel */}
              {selectedDate && (
                <div className="lg:w-80 border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium text-[var(--text-primary)]">
                      {format(selectedDate, "EEEE, MMM d")}
                    </h3>
                    <button
                      onClick={() => onAddEntry(selectedDate)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg"
                      aria-label="Add entry for this day"
                      title="Add entry for this day"
                    >
                      <Plus className="w-4 h-4" />
                      Add
                    </button>
                  </div>

                  {selectedDateEntries.length === 0 ? (
                    <div className="text-center py-8">
                      <CalendarIcon className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-2" />
                      <p className="text-sm text-[var(--text-muted)]">
                        No entry for this day
                      </p>
                      <button
                        onClick={() => onAddEntry(selectedDate)}
                        className="mt-3 text-sm text-[var(--primary)] hover:underline"
                      >
                        Add an entry
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto overflow-x-visible pl-3 pt-3">
                      {selectedDateEntries.map((entry, index) => (
                        <div key={entry._id} className="relative">
                          {selectedDateEntries.length > 1 && (
                            <span className="absolute -top-2 -left-3 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center font-medium z-10">
                              {index + 1}
                            </span>
                          )}
                          <EntryCard
                            entry={entry}
                            onClick={() => onViewEntry?.(entry)}
                            expanded={selectedDateEntries.length === 1}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Mobile: Single Column Day View */}
          <div className="md:hidden">
            {/* Day selector - horizontal scroll */}
            <div
              ref={mobileScrollRef}
              className="overflow-x-auto pb-3 mb-4 -mx-4 px-4"
            >
              <div className="flex gap-1" style={{ width: "max-content" }}>
                {calendarDays.map((day) => {
                  const entry = getEntryForDate(day);
                  const isCurrentMonth = isSameMonth(day, currentDate);
                  const isToday = isSameDay(day, today);
                  const isSelected =
                    selectedDate && isSameDay(day, selectedDate);
                  const hasEntry = !!entry;

                  if (!isCurrentMonth) return null;

                  return (
                    <button
                      key={format(day, "yyyy-MM-dd")}
                      ref={isToday ? todayButtonRef : undefined}
                      onClick={() => handleDateClick(day)}
                      className={`
                        flex flex-col items-center p-2 rounded-lg min-w-[44px] transition-colors
                        ${isSelected ? "bg-[var(--primary)] text-white" : ""}
                        ${!isSelected && isToday ? "bg-[var(--primary)]/10 text-[var(--primary)]" : ""}
                        ${!isSelected && !isToday ? "hover:bg-[var(--surface-elevated)]" : ""}
                      `}
                    >
                      <span className="text-[10px] uppercase opacity-70">
                        {format(day, "EEE")}
                      </span>
                      <span className="text-lg font-bold">
                        {format(day, "d")}
                      </span>
                      {hasEntry && (
                        <span
                          className={`w-1.5 h-1.5 rounded-full mt-1 ${
                            isSelected ? "bg-white" : "bg-[var(--primary)]"
                          }`}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Selected day entry */}
            {selectedDate ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium text-[var(--text-primary)]">
                    {format(selectedDate, "EEEE, MMMM d")}
                  </h3>
                  <button
                    onClick={() => onAddEntry(selectedDate)}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm bg-[var(--primary)] text-white rounded-lg"
                    aria-label="Add entry for this day"
                    title="Add entry for this day"
                  >
                    <Plus className="w-4 h-4" />
                    Add
                  </button>
                </div>

                {selectedDateEntries.length === 0 ? (
                  <div className="text-center py-12 bg-[var(--surface-elevated)] rounded-lg">
                    <CalendarIcon
                      className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3"
                      aria-hidden="true"
                    />
                    <p className="text-[var(--text-secondary)] font-medium">
                      No entry logged
                    </p>
                    <p className="text-sm text-[var(--text-muted)] mt-1">
                      Tap &quot;Add&quot; to log your practice
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedDateEntries.map((entry, index) => (
                      <div key={entry._id} className="relative">
                        {selectedDateEntries.length > 1 && (
                          <span className="absolute -top-2 -left-2 w-5 h-5 rounded-full bg-[var(--primary)] text-white text-xs flex items-center justify-center font-medium z-10">
                            {index + 1}
                          </span>
                        )}
                        <EntryCard
                          entry={entry}
                          onClick={() => onViewEntry?.(entry)}
                          expanded={selectedDateEntries.length === 1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-[var(--text-muted)]">
                Select a date to view entry
              </div>
            )}
          </div>
        </>
      )}

      {/* List View */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {calendarDays
            .filter((day) => {
              const entries = getEntriesForDate(day);
              return entries.length > 0 && isSameMonth(day, currentDate);
            })
            .map((day) => {
              const entries = getEntriesForDate(day);
              const isToday = isSameDay(day, today);

              if (entries.length === 0) return null;

              return (
                <div key={format(day, "yyyy-MM-dd")} className="space-y-2">
                  <div className="flex items-center gap-2 px-2">
                    <div
                      className={`
                        text-sm font-medium px-2 py-0.5 rounded
                        ${isToday ? "bg-[var(--primary)] text-white" : "text-[var(--text-secondary)]"}
                      `}
                    >
                      {format(day, "EEE, MMM d")}
                    </div>
                    {entries.length > 1 && (
                      <span className="text-xs text-[var(--text-muted)]">
                        ({entries.length} entries)
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {entries.map((entry, index) => (
                      <div key={entry._id} className="relative">
                        {entries.length > 1 && (
                          <span className="absolute -top-1 -left-1 w-4 h-4 rounded-full bg-[var(--primary)] text-white text-[10px] flex items-center justify-center font-medium z-10">
                            {index + 1}
                          </span>
                        )}
                        <EntryCard
                          entry={entry}
                          onClick={() => onViewEntry?.(entry)}
                          expanded
                        />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

          {/* Empty State */}
          {!calendarDays.some((day) => {
            const entries = getEntriesForDate(day);
            return entries.length > 0 && isSameMonth(day, currentDate);
          }) && (
            <div className="text-center py-12">
              <CalendarIcon className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3" />
              <p className="text-[var(--text-secondary)] font-medium">
                No entries this month
              </p>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Start logging your practice sessions
              </p>
              <button
                onClick={() => onAddEntry(today)}
                className="flex items-center gap-2 mx-auto mt-4 px-4 py-2 bg-[var(--primary)] text-white rounded-lg font-medium hover:bg-[var(--primary-hover)] transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Entry
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Entry Card Component
interface EntryCardProps {
  entry: JournalEntry;
  onClick: () => void;
  expanded?: boolean;
}

function EntryCard({ entry, onClick, expanded }: EntryCardProps) {
  const MoodIcon = moodIcons[entry.mood] || Meh;
  // Use custom values if available, otherwise use session values
  const displayAverage = entry.customAverage || entry.sessionAverage;
  const displaySolveCount = entry.customSolveCount || entry.solveCount;

  return (
    <div
      onClick={onClick}
      className="p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-colors cursor-pointer"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${moodBgColors[entry.mood]}`}
            >
              <MoodIcon className={`w-4 h-4 ${moodColors[entry.mood]}`} />
            </div>
            <span className="font-medium text-[var(--text-primary)] text-sm">
              {moodLabels[entry.mood]}
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3 mt-2 text-xs text-[var(--text-muted)]">
            {entry.practiceMinutes && (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {entry.practiceMinutes} min
              </span>
            )}
            {displaySolveCount && (
              <span className="flex items-center gap-1">
                <Target className="w-3 h-3" />
                {displaySolveCount} solves
              </span>
            )}
            {displayAverage && (
              <span className="font-medium text-[var(--primary)]">
                Avg: {formatTime(displayAverage)}
              </span>
            )}
          </div>
          {expanded && entry.focusAreas && entry.focusAreas.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {entry.focusAreas.map((area) => (
                <span
                  key={area}
                  className="px-1.5 py-0.5 text-xs bg-[var(--primary)]/10 text-[var(--primary)] rounded"
                >
                  {area}
                </span>
              ))}
            </div>
          )}
          {expanded && entry.wentWell && (
            <p className="text-sm text-[var(--text-secondary)] mt-2 line-clamp-2">
              {entry.wentWell}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
