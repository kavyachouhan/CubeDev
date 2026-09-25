"use client";

import { useMemo, useState, useEffect } from "react";
import { Calendar, TrendingUp, Target, Flame } from "lucide-react";
import { CollapsibleCard } from "@/components/ui/Card";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { StatTile } from "@/components/ui/StatTile";

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

interface HeatmapDataPoint {
  date: string;
  count: number;
  events?: string[];
}

interface SolveHeatmapProps {
  solves?: TimerRecord[];
  heatmapData?: HeatmapDataPoint[];
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

export default function SolveHeatmap({ solves, heatmapData }: SolveHeatmapProps) {
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
  const dayGridData = useMemo(() => {
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

    // Count solves per day — use lightweight heatmapData if provided, else fall back to solves
    if (heatmapData) {
      heatmapData!.forEach((point) => {
        const pointDate = new Date(point.date + "T12:00:00");
        if (pointDate >= startDate && pointDate <= today) {
          solveCounts.set(point.date, point.count);
        }
      });
    } else if (solves) {
      solves.forEach((solve) => {
        const solveDate = new Date(solve.timestamp);
        if (isNaN(solveDate.getTime())) {
          return;
        }
        if (solveDate >= startDate && solveDate <= today) {
          const dateKey = solveDate.toISOString().split("T")[0];
          solveCounts.set(dateKey, (solveCounts.get(dateKey) || 0) + 1);
        }
      });
    }

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
  }, [solves, heatmapData, selectedPeriod]);

  // Group days into weeks for rendering
  const weeks = useMemo(() => {
    const weekGroups: WeekData[] = [];
    let currentWeek: DayData[] = [];
    let weekNumber = 0;

    dayGridData.forEach((day, index) => {
      currentWeek.push(day);

      // If Saturday or last day, push the week
      if (day.dayOfWeek === 6 || index === dayGridData.length - 1) {
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
  }, [dayGridData]);

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

    const filteredSolvesCount = dayGridData.reduce((sum, day) => {
      // Only count solves within the selected period
      return sum + day.count;
    }, 0);

    const activeDays = new Set(
      dayGridData.filter((day) => day.count > 0).map((day) => day.formattedDate)
    ).size;

    // Use actual days back for total days calculation
    const totalDays = daysBack;
    const averagePerDay = totalDays > 0 ? filteredSolvesCount / totalDays : 0;

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

    const hasSolvedToday = dayGridData.some(
      (day) => day.formattedDate === todayKey && day.count > 0,
    );

    const hasSolvedYesterday = dayGridData.some(
      (day) => day.formattedDate === yesterdayKey && day.count > 0,
    );

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
        const dayData = dayGridData.find(
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
    dayGridData.forEach((day) => {
      if (day.count > 0) {
        tempStreak++;
        longestStreak = Math.max(longestStreak, tempStreak);
      } else {
        tempStreak = 0;
      }
    });

    // Find best day
    const bestDay = dayGridData.reduce(
      (best, current) => (current.count > best.count ? current : best),
      dayGridData[0] || { count: 0, date: new Date(), formattedDate: "" }
    );

    return {
      totalSolves: filteredSolvesCount,
      activeDays,
      totalDays,
      currentStreak,
      longestStreak,
      averagePerDay,
      bestDay,
      completionRate: totalDays > 0 ? (activeDays / totalDays) * 100 : 0,
    };
  }, [dayGridData, selectedPeriod]);

  const getIntensityColor = (level: number, isHovered: boolean = false) => {
    // Activity is shown as steps of the scheme's primary color.
    const baseColors = {
      0: "bg-(--surface) border-(--border)",
      1: "bg-(--primary)/20 border-(--primary)/25",
      2: "bg-(--primary)/40 border-(--primary)/45",
      3: "bg-(--primary)/60 border-(--primary)/65",
      4: "bg-(--primary)/80 border-(--primary)/85",
      5: "bg-(--primary) border-(--primary)",
    };

    const hoverEffects = isHovered
      ? " ring-2 ring-(--primary)/50 scale-110 z-10"
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
    <CollapsibleCard
      title="Solve Activity"
      open={showHeatmap}
      onOpenChange={setShowHeatmap}
      variant="static"
      actions={
        showHeatmap ? (
          <SegmentedControl
            aria-label="Activity period"
            size="sm"
            value={selectedPeriod}
            onChange={setSelectedPeriod}
            options={[
              { value: "3m", label: "3M", "aria-label": "3 months" },
              { value: "6m", label: "6M", "aria-label": "6 months" },
              { value: "1y", label: "1Y", "aria-label": "1 year" },
            ]}
          />
        ) : undefined
      }
    >
      <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <StatTile
              label="Total Solves"
              icon={<Target />}
              mono={false}
              value={stats.totalSolves.toLocaleString()}
            />
            <StatTile
              label="Active Days"
              icon={<Calendar />}
              mono={false}
              value={
                <>
                  {stats.activeDays}
                  <span className="text-sm text-(--text-muted) font-normal"> / {stats.totalDays}</span>
                </>
              }
            />
            <StatTile
              label="Current Streak"
              icon={<Flame />}
              mono={false}
              value={
                <>
                  {stats.currentStreak}
                  <span className="text-sm text-(--text-muted) font-normal"> days</span>
                </>
              }
            />
            <StatTile
              label="Daily Average"
              icon={<TrendingUp />}
              mono={false}
              value={stats.averagePerDay.toFixed(1)}
            />
          </div>

          {/* Heatmap */}
          <div className="bg-(--surface-elevated) rounded-(--radius-panel) p-3 sm:p-6 border border-(--border) relative heatmap-container">
            <div className="overflow-x-auto">
              <div className="inline-block min-w-full">
                {/* Month labels */}
                <div className="flex mb-3 sm:mb-4">
                  <div className="w-8 sm:w-8 shrink-0"></div>
                  <div className="flex-1 relative">
                    {weeks.map((week) =>
                      week.monthStart ? (
                        <div
                          key={`month-${week.weekNumber}`}
                          className="absolute text-xs font-medium text-(--text-muted)"
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
                        className="w-4 h-3 sm:h-3 flex items-center justify-center text-xs font-medium text-(--text-muted)"
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
                                className="w-3 h-3 rounded-(--radius-badge) bg-transparent"
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
                              className={`w-3 h-3 rounded-(--radius-badge) border transition-all duration-200 cursor-pointer relative ${getIntensityColor(dayData.level, isActive)}`}
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
                                <div
                                  aria-label="Today"
                                  className="absolute -inset-0.5 rounded-(--radius-badge) border-2 border-(--text-primary)"
                                />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mt-4 sm:mt-6 pt-3 sm:pt-4 border-t border-(--border) gap-3 sm:gap-0">
                  <div className="flex items-center gap-2 text-xs text-(--text-muted)">
                    <span>Less</span>
                    <div className="flex items-center gap-1">
                      {[0, 1, 2, 3, 4, 5].map((level) => (
                        <div
                          key={level}
                          className={`w-3 h-3 rounded-(--radius-badge) border ${getIntensityColor(level)}`}
                        />
                      ))}
                    </div>
                    <span>More</span>
                  </div>

                  <div className="text-xs text-(--text-muted)">
                    Longest streak:{" "}
                    <span className="font-medium text-(--text-primary)">
                      {stats.longestStreak} days
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tooltip */}
            {(hoveredDay || clickedDay) && (
              <div
                role="tooltip"
                className="absolute popover-panel p-3 z-(--z-dropdown) pointer-events-none max-w-xs text-sm font-inter"
                style={{
                  left: tooltipPosition.x,
                  top: tooltipPosition.y,
                  transform: "translateX(-50%) translateY(-100%)",
                }}
              >
                <div className="text-sm font-medium text-(--text-primary)">
                  {formatTooltip(hoveredDay || clickedDay!).date}
                </div>
                <div className="text-xs text-(--text-secondary) mt-1">
                  {formatTooltip(hoveredDay || clickedDay!).count} •{" "}
                  {formatTooltip(hoveredDay || clickedDay!).intensity}
                </div>
                {clickedDay && (
                  <div className="text-xs text-(--text-muted) mt-1">
                    Tap to close
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </CollapsibleCard>
  );
}