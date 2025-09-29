"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, TrendingUp, Target, Flame, Eye, EyeOff, ChevronDown, ChevronRight } from "lucide-react";

interface TimerRecord {
  id: string;
  time: number;
  timestamp: Date;
  scramble: string;
  penalty: "none" | "+2" | "DNF";
  finalTime: number;
  event: string;
  sessionId: string;
  notes?: string;
  tags?: string[];
}

interface SolveHeatmapProps {
  solves: TimerRecord[];
}

interface DayData {
  date: Date;
  count: number;
  level: number; // 0-5 intensity level
  formattedDate: string;
  dayOfWeek: number;
  isToday: boolean;
  isWeekend: boolean;
}

interface WeekData {
  days: DayData[];
  weekNumber: number;
  monthStart?: string;
}

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const FULL_DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Persistent boolean that reads/writes localStorage on first render
function usePersistentBool(key: string, defaultValue: boolean) {
  const [state, setState] = useState<boolean>(() => {
    if (typeof window === "undefined") return defaultValue;
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? defaultValue : JSON.parse(raw);
    } catch {
      return defaultValue;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch {}
  }, [key, state]);
  return [state, setState] as const;
}

export default function SolveHeatmap({ solves }: SolveHeatmapProps) {
  const [hoveredDay, setHoveredDay] = useState<DayData | null>(null);
  const [clickedDay, setClickedDay] = useState<DayData | null>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<"3m" | "6m" | "1y">(
    "1y"
  );
  const [tooltipPosition, setTooltipPosition] = useState<{
    x: number;
    y: number;
  }>({
    x: 0,
    y: 0,
  });
  const [showHeatmap, setShowHeatmap] = usePersistentBool(
    "cubelab-solve-heatmap-expanded",
    true
  );

  // Handle outside clicks to close tooltip
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-heatmap-cell]")) {
        setClickedDay(null);
      }
    };

    if (clickedDay) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [clickedDay]);

  // Generate heatmap data based on solves and selected period
  const heatmapData = useMemo(() => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // Set to end of today

    // Calculate days back from today
    const daysBack =
      selectedPeriod === "3m" ? 90 : selectedPeriod === "6m" ? 180 : 365;

    const startDate = new Date(today);
    startDate.setDate(today.getDate() - daysBack + 1); // +1 to include start date
    startDate.setHours(0, 0, 0, 0); // Start of the day

    // Align start date to the previous Sunday for full week display
    const firstDay = new Date(startDate);
    const dayOffset = firstDay.getDay();
    firstDay.setDate(firstDay.getDate() - dayOffset);

    const data: DayData[] = [];
    const solveCounts = new Map<string, number>();

    // Count solves per day
    solves.forEach((solve) => {
      const solveDate = new Date(solve.timestamp);
      // Ensure solveDate is valid
      if (isNaN(solveDate.getTime())) {
        console.warn("Invalid solve timestamp:", solve.timestamp);
        return;
      }

      // Check if solve is within our date range
      if (solveDate >= startDate && solveDate <= today) {
        const dateKey = solveDate.toISOString().split("T")[0];
        solveCounts.set(dateKey, (solveCounts.get(dateKey) || 0) + 1);
      }
    });

    // Calculate percentiles for intensity levels
    const counts = Array.from(solveCounts.values()).sort((a, b) => a - b);
    const getPercentile = (p: number) => {
      const index = Math.ceil((p / 100) * counts.length) - 1;
      return counts[Math.max(0, index)] || 0;
    };

    const p20 = getPercentile(20);
    const p40 = getPercentile(40);
    const p60 = getPercentile(60);
    const p80 = getPercentile(80);
    const p95 = getPercentile(95);

    // Set end date to today for loop boundary
    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    // Calculate total weeks and days to display
    const totalWeeks = Math.ceil(
      (endOfToday.getTime() - firstDay.getTime()) / (1000 * 60 * 60 * 24 * 7)
    );
    const totalDays = totalWeeks * 7;

    for (let i = 0; i < totalDays; i++) {
      const currentDate = new Date(firstDay);
      currentDate.setDate(firstDay.getDate() + i);

      // Stop if we're past today
      if (currentDate > endOfToday) break;

      const dateKey = currentDate.toISOString().split("T")[0];
      const count = solveCounts.get(dateKey) || 0;

      // Calculate intensity level (0-5) based on percentiles
      let level = 0;
      if (count > 0) {
        if (count >= p95) level = 5;
        else if (count >= p80) level = 4;
        else if (count >= p60) level = 3;
        else if (count >= p40) level = 2;
        else level = 1;
      }

      const dayOfWeek = currentDate.getDay();
      const todayKey = new Date().toISOString().split("T")[0];
      const isToday = dateKey === todayKey;
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      data.push({
        date: new Date(currentDate),
        count,
        level,
        formattedDate: dateKey,
        dayOfWeek,
        isToday,
        isWeekend,
      });
    }

    return data;
  }, [solves, selectedPeriod]);

  // Group days into weeks for rendering
  const weeks = useMemo(() => {
    const weekGroups: WeekData[] = [];
    let currentWeek: DayData[] = [];
    let weekNumber = 0;

    heatmapData.forEach((day, index) => {
      currentWeek.push(day);

      // If Saturday or last day, push the week
      if (day.dayOfWeek === 6 || index === heatmapData.length - 1) {
        // Determine if this week starts a new month
        const firstDayOfWeek = currentWeek[0];
        const monthStart =
          firstDayOfWeek && firstDayOfWeek.date.getDate() <= 7
            ? MONTHS[firstDayOfWeek.date.getMonth()]
            : undefined;

        weekGroups.push({
          days: [...currentWeek],
          weekNumber: weekNumber++,
          monthStart,
        });
        currentWeek = [];
      }
    });

    return weekGroups;
  }, [heatmapData]);

  // Calculate overall stats
  const stats = useMemo(() => {
    // Calculate days back from today
    const daysBack =
      selectedPeriod === "3m" ? 90 : selectedPeriod === "6m" ? 180 : 365;

    const today = new Date();
    today.setHours(23, 59, 59, 999);

    const cutoff = new Date(today);
    cutoff.setDate(today.getDate() - daysBack + 1); // +1 to include start date
    cutoff.setHours(0, 0, 0, 0);

    const filteredSolves = solves.filter((solve) => {
      const solveDate = new Date(solve.timestamp);
      return solveDate >= cutoff && solveDate <= today;
    });

    const activeDays = new Set(
      heatmapData.filter((day) => day.count > 0).map((day) => day.formattedDate)
    ).size;

    // Use actual days back for total days calculation
    const totalDays = daysBack;
    const averagePerDay = totalDays > 0 ? filteredSolves.length / totalDays : 0;

    // Calculate streaks (current and longest)
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;

    const todayDate = new Date();
    todayDate.setHours(23, 59, 59, 999);
    const yesterdayDate = new Date(todayDate);
    yesterdayDate.setDate(todayDate.getDate() - 1);

    // Check current streak starting from today
    const todayKey = todayDate.toISOString().split("T")[0];
    const yesterdayKey = yesterdayDate.toISOString().split("T")[0];

    const hasSolvedToday = filteredSolves.some((solve) => {
      const solveDate = new Date(solve.timestamp);
      return solveDate.toISOString().split("T")[0] === todayKey;
    });

    const hasSolvedYesterday = filteredSolves.some((solve) => {
      const solveDate = new Date(solve.timestamp);
      return solveDate.toISOString().split("T")[0] === yesterdayKey;
    });

    // Determine starting point for current streak check
    let checkDate = new Date(todayDate);
    if (!hasSolvedToday && hasSolvedYesterday) {
      checkDate = new Date(yesterdayDate);
    } else if (!hasSolvedToday && !hasSolvedYesterday) {
      currentStreak = 0;
    }

    if (hasSolvedToday || hasSolvedYesterday) {
      while (checkDate >= cutoff) {
        const dateKey = checkDate.toISOString().split("T")[0];
        const dayData = heatmapData.find(
          (day) => day.formattedDate === dateKey
        );

        if (dayData && dayData.count > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          break;
        }
      }
    }

    // Calculate longest streak
    heatmapData.forEach((day) => {
      if (day.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    // Find best day
    const bestDay = heatmapData.reduce(
      (best, current) => (current.count > best.count ? current : best),
      heatmapData[0] || { count: 0, date: new Date(), formattedDate: "" }
    );

    return {
      totalSolves: filteredSolves.length,
      activeDays,
      totalDays,
      currentStreak,
      longestStreak,
      averagePerDay,
      bestDay,
      completionRate: totalDays > 0 ? (activeDays / totalDays) * 100 : 0,
    };
  }, [heatmapData, solves, selectedPeriod]);

  const getIntensityColor = (level: number, isHovered: boolean = false) => {
    const baseColors = {
      0: "bg-[var(--surface)] border-[var(--border)]",
      1: "bg-emerald-100 dark:bg-emerald-900/30 border-emerald-200 dark:border-emerald-800",
      2: "bg-emerald-300 dark:bg-emerald-700/50 border-emerald-400 dark:border-emerald-600",
      3: "bg-emerald-500 dark:bg-emerald-600/70 border-emerald-600 dark:border-emerald-500",
      4: "bg-emerald-600 dark:bg-emerald-500/80 border-emerald-700 dark:border-emerald-400",
      5: "bg-emerald-700 dark:bg-emerald-400 border-emerald-800 dark:border-emerald-300",
    };

    const hoverEffects = isHovered
      ? " ring-2 ring-[var(--primary)] ring-opacity-50 scale-110 z-10"
      : "";
    return `${baseColors[level as keyof typeof baseColors] || baseColors[0]}${hoverEffects}`;
  };

  const formatTooltip = (day: DayData) => {
    const date = day.date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const solveText = day.count === 1 ? "solve" : "solves";
    return {
      date,
      count: `${day.count} ${solveText}`,
      intensity:
        day.count === 0
          ? "No activity"
          : day.level === 1
            ? "Low activity"
            : day.level === 2
              ? "Moderate activity"
              : day.level === 3
                ? "Good activity"
                : day.level === 4
                  ? "High activity"
                  : "Intense activity",
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="flex items-center gap-1 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] rounded transition-colors"
            title={showHeatmap ? "Hide solve activity" : "Show solve activity"}
          >
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement hover:text-[var(--primary)] transition-colors">
            Solve Activity
          </h3>
          {showHeatmap ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
          </button>
          <button
            onClick={() => setShowHeatmap(!showHeatmap)}
            className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] rounded-md transition-colors"
            title={showHeatmap ? "Hide solve activity" : "Show solve activity"}
          >
            {showHeatmap ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {showHeatmap && (
          <div className="flex items-center gap-1 p-1 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] sm:overflow-x-auto">
            {(
              [
                ["3m", "3 months"],
                ["6m", "6 months"],
                ["1y", "1 year"],
              ] as const
            ).map(([period, label]) => (
              <button
                key={period}
                onClick={() => setSelectedPeriod(period)}
                className={`px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-medium rounded-md transition-all whitespace-nowrap flex-1 sm:flex-none ${
                  selectedPeriod === period
                    ? "bg-[var(--primary)] text-white shadow-sm"
                    : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface)]"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        )}
      </div>

      {showHeatmap && (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-blue-500/10 rounded-lg">
                  <Target className="w-3 h-3 sm:w-4 sm:h-4 text-blue-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Total Solves
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {stats.totalSolves.toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-emerald-500/10 rounded-lg">
                  <Calendar className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Active Days
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {stats.activeDays}{" "}
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] font-normal">
                      / {stats.totalDays}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-orange-500/10 rounded-lg">
                  <Flame className="w-3 h-3 sm:w-4 sm:h-4 text-orange-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Current Streak
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {stats.currentStreak}{" "}
                    <span className="text-xs sm:text-sm text-[var(--text-muted)] font-normal">
                      days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-4 border border-[var(--border)]">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="p-1.5 sm:p-2 bg-purple-500/10 rounded-lg">
                  <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs text-[var(--text-muted)] uppercase tracking-wide truncate">
                    Daily Average
                  </div>
                  <div className="text-sm sm:text-lg font-bold text-[var(--text-primary)]">
                    {stats.averagePerDay.toFixed(1)}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Heatmap */}
          <div className="bg-[var(--surface-elevated)] rounded-xl p-3 sm:p-6 border border-[var(--border)] relative heatmap-container">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Month labels */}
                <div className="flex mb-3 sm:mb-4">
                  <div className="w-8 sm:w-8 flex-shrink-0"></div>
                  <div className="flex-1 relative">
                    {weeks.map((week) =>
                      week.monthStart ? (
                        <div
                          key={`month-${week.weekNumber}`}
                          className="absolute text-xs font-medium text-[var(--text-muted)]"
                          style={{
                            left: `${week.weekNumber * (typeof window !== "undefined" && window.innerWidth < 640 ? 14 : 16) + 2}px`,
                            top: "-2px",
                          }}
                        >
                          {week.monthStart}
                        </div>
                      ) : null
                    )}
                  </div>
                </div>

                {/* Heatmap grid */}
                <div className="flex items-start">
                  {/* Day labels */}
                  <div className="flex flex-col gap-1 mr-3 mt-1">
                    {DAYS.map((day, index) => (
                      <div
                        key={`day-${index}`}
                        className="w-4 h-3 sm:h-3 flex items-center justify-center text-xs font-medium text-[var(--text-muted)]"
                      >
                        {index % 2 === 1 ? day.charAt(0) : ""}
                      </div>
                    ))}
                  </div>

                  {/* Heatmap cells */}
                  <div className="flex gap-1">
                    {weeks.map((week) => (
                      <div
                        key={week.weekNumber}
                        className="flex flex-col gap-1"
                      >
                        {Array.from({ length: 7 }, (_, dayIndex) => {
                          const dayData = week.days.find(
                            (day) => day.dayOfWeek === dayIndex
                          );

                          if (!dayData) {
                            return (
                              <div
                                key={`empty-${week.weekNumber}-${dayIndex}`}
                                className="w-3 h-3 rounded-sm bg-transparent"
                              />
                            );
                          }

                          const isHovered =
                            hoveredDay?.formattedDate === dayData.formattedDate;
                          const isClicked =
                            clickedDay?.formattedDate === dayData.formattedDate;
                          const isActive = isHovered || isClicked;

                          return (
                            <div
                              key={`${week.weekNumber}-${dayIndex}`}
                              data-heatmap-cell
                              className={`w-3 h-3 rounded-sm border transition-all duration-200 cursor-pointer relative ${getIntensityColor(dayData.level, isActive)}`}
                              onMouseEnter={(e) => {
                                setHoveredDay(dayData);
                                const heatmapContainer =
                                  e.currentTarget.closest(".heatmap-container");
                                const containerRect =
                                  heatmapContainer?.getBoundingClientRect();
                                const cellRect =
                                  e.currentTarget.getBoundingClientRect();

                                if (containerRect && cellRect) {
                                  setTooltipPosition({
                                    x:
                                      cellRect.left -
                                      containerRect.left +
                                      cellRect.width / 2,
                                    y: cellRect.top - containerRect.top - 8,
                                  });
                                }
                              }}
                              onMouseMove={(e) => {
                                const heatmapContainer =
                                  e.currentTarget.closest(".heatmap-container");
                                const containerRect =
                                  heatmapContainer?.getBoundingClientRect();
                                const cellRect =
                                  e.currentTarget.getBoundingClientRect();

                                if (containerRect && cellRect) {
                                  setTooltipPosition({
                                    x:
                                      cellRect.left -
                                      containerRect.left +
                                      cellRect.width / 2,
                                    y: cellRect.top - containerRect.top - 8,
                                  });
                                }
                              }}
                              onMouseLeave={() => {
                                setHoveredDay(null);
                              }}
                              onClick={(e) => {
                                if (
                                  clickedDay?.formattedDate ===
                                  dayData.formattedDate
                                ) {
                                  setClickedDay(null);
                                } else {
                                  setClickedDay(dayData);
                                  const heatmapContainer =
                                    e.currentTarget.closest(
                                      ".heatmap-container"
                                    );
                                  const containerRect =
                                    heatmapContainer?.getBoundingClientRect();
                                  const cellRect =
                                    e.currentTarget.getBoundingClientRect();

                                  if (containerRect && cellRect) {
                                    setTooltipPosition({
                                      x:
                                        cellRect.left -
                                        containerRect.left +
                                        cellRect.width / 2,
                                      y: cellRect.top - containerRect.top - 8,
                                    });
                                  }
                                }
                              }}
                              style={{
                                transform: isActive ? "scale(1.1)" : "scale(1)",
                                zIndex: isActive ? 10 : 1,
                              }}
                            >
                              {dayData.isToday && (
                                <div className="absolute -inset-0.5 rounded-sm border-2 border-[var(--primary)] animate-pulse" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-[var(--border)] gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 text-xs text-[var(--text-muted)]">
                    <span>Less</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-3 h-3 rounded-sm border ${getIntensityColor(level)}`}
                        />
                      ))}
                    </div>
                    <span>More</span>
                  </div>

                  <div className="text-xs text-[var(--text-muted)]">
                    Longest streak:{" "}
                    <span className="font-medium text-[var(--text-primary)]">
                      {stats.longestStreak} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tooltip */}
            {(hoveredDay || clickedDay) && (
              <div
                className="absolute bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3 shadow-xl z-50 pointer-events-none max-w-xs text-sm"
                style={{
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  transform: "translateX(-50%) translateY(-100%)",
                }}
              >
                <div className="text-sm font-medium text-[var(--text-primary)]">
                  {formatTooltip(hoveredDay || clickedDay!).date}
                </div>
                <div className="text-xs text-[var(--text-secondary)] mt-1">
                  {formatTooltip(hoveredDay || clickedDay!).count} •{" "}
                  {formatTooltip(hoveredDay || clickedDay!).intensity}
                </div>
                {clickedDay && (
                  <div className="text-xs text-[var(--text-muted)] mt-1">
                    Tap to close
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}