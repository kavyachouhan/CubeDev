/**
 * Date and time utilities for CubeDev
 * Handles timezone conversions and formatting
 */

/**
 * Formats a UTC date string to the user's local timezone
 * @param utcDateString - ISO 8601 date string in UTC
 * @param options - Intl.DateTimeFormatOptions for formatting
 * @returns Formatted date string in user's local timezone
 */
export function formatToLocalTime(
  utcDateString: string,
  options?: Intl.DateTimeFormatOptions
): string {
  const date = new Date(utcDateString);

  // Default options for time display
  const defaultOptions: Intl.DateTimeFormatOptions = {
    hour: "2-digit",
    minute: "2-digit",
    ...options,
  };

  return date.toLocaleTimeString([], defaultOptions);
}

/**
 * Formats a UTC date string to a full local date and time
 * @param utcDateString - ISO 8601 date string in UTC
 * @returns Formatted date and time string in user's local timezone
 */
export function formatToLocalDateTime(utcDateString: string): string {
  const date = new Date(utcDateString);

  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Formats a UTC date string to a relative time (e.g., "2 hours ago")
 * @param utcDateString - ISO 8601 date string in UTC
 * @returns Relative time string
 */
export function formatToRelativeTime(utcDateString: string): string {
  const date = new Date(utcDateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) {
    return "Just now";
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  } else if (diffInSeconds < 604800) {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} ${days === 1 ? "day" : "days"} ago`;
  } else {
    return formatToLocalDateTime(utcDateString);
  }
}

/**
 * Gets the user's timezone
 * @returns IANA timezone identifier (e.g., "America/New_York")
 */
export function getUserTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * Checks if a date is today in the user's local timezone
 * @param utcDateString - ISO 8601 date string in UTC
 * @returns true if the date is today
 */
export function isToday(utcDateString: string): boolean {
  const date = new Date(utcDateString);
  const today = new Date();

  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
}

/**
 * Checks if a date is yesterday in the user's local timezone
 * @param utcDateString - ISO 8601 date string in UTC
 * @returns true if the date is yesterday
 */
export function isYesterday(utcDateString: string): boolean {
  const date = new Date(utcDateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);

  return (
    date.getDate() === yesterday.getDate() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getFullYear() === yesterday.getFullYear()
  );
}

/**
 * Competition date status types
 */
export type CompetitionStatus = "past" | "ongoing" | "upcoming";

/**
 * Gets the start of today in the user's local timezone
 * @returns Date object representing midnight today
 */
export function getLocalTodayStart(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

/**
 * Gets the start of tomorrow in the user's local timezone
 * @returns Date object representing midnight tomorrow
 */
export function getLocalTomorrowStart(): Date {
  const today = getLocalTodayStart();
  today.setDate(today.getDate() + 1);
  return today;
}

/**
 * Parses a date string (YYYY-MM-DD) to a Date at the start of that day in local timezone
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Date object at midnight local time
 */
export function parseCompetitionDate(dateString: string): Date {
  const [year, month, day] = dateString.split("-").map(Number);
  return new Date(year, month - 1, day);
}

/**
 * Determines the status of a competition based on user's local timezone
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Competition status: 'past', 'ongoing', or 'upcoming'
 */
export function getCompetitionStatus(
  startDate: string,
  endDate: string
): CompetitionStatus {
  const today = getLocalTodayStart();
  const tomorrow = getLocalTomorrowStart();

  const start = parseCompetitionDate(startDate);
  const end = parseCompetitionDate(endDate);

  // Ongoing: today is between start and end dates (inclusive)
  const isOngoing = today >= start && today <= end;
  if (isOngoing) return "ongoing";

  // Past: end date is before today
  const isPast = end < today;
  if (isPast) return "past";

  // Upcoming: start date is after today
  return "upcoming";
}

/**
 * Checks if a competition is past (completed)
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns true if the competition has ended
 */
export function isCompetitionPast(startDate: string, endDate: string): boolean {
  return getCompetitionStatus(startDate, endDate) === "past";
}

/**
 * Checks if a competition is ongoing
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns true if the competition is happening today
 */
export function isCompetitionOngoing(
  startDate: string,
  endDate: string
): boolean {
  return getCompetitionStatus(startDate, endDate) === "ongoing";
}

/**
 * Checks if a competition is upcoming (hasn't started)
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns true if the competition hasn't started yet
 */
export function isCompetitionUpcoming(
  startDate: string,
  endDate: string
): boolean {
  return getCompetitionStatus(startDate, endDate) === "upcoming";
}

/**
 * Formats a competition date range for display
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @returns Formatted date range string
 */
export function formatCompetitionDateRange(
  startDate: string,
  endDate: string
): string {
  const start = parseCompetitionDate(startDate);
  const end = parseCompetitionDate(endDate);
  const opts: Intl.DateTimeFormatOptions = { month: "short", day: "numeric" };

  if (startDate === endDate) {
    return start.toLocaleDateString(undefined, { ...opts, year: "numeric" });
  }

  if (
    start.getMonth() === end.getMonth() &&
    start.getFullYear() === end.getFullYear()
  ) {
    return `${start.toLocaleDateString(undefined, opts).split(" ")[0]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${start.toLocaleDateString(undefined, opts)} - ${end.toLocaleDateString(undefined, { ...opts, year: "numeric" })}`;
}

/**
 * Gets a human-readable status label and styling for a competition
 * @param startDate - Start date string (YYYY-MM-DD)
 * @param endDate - End date string (YYYY-MM-DD)
 * @param cancelled - Whether the competition was cancelled
 * @returns Object with label and color class
 */
export function getCompetitionStatusDisplay(
  startDate: string,
  endDate: string,
  cancelled?: boolean
): { label: string; color: string } {
  if (cancelled) {
    return {
      label: "Cancelled",
      color: "text-[var(--error)] bg-[var(--error)]/10",
    };
  }

  const status = getCompetitionStatus(startDate, endDate);

  switch (status) {
    case "ongoing":
      return {
        label: "In Progress",
        color: "text-[var(--success)] bg-[var(--success)]/10",
      };
    case "upcoming":
      return {
        label: "Upcoming",
        color: "text-[var(--info)] bg-[var(--info)]/10",
      };
    case "past":
      return {
        label: "Completed",
        color: "text-[var(--text-muted)] bg-[var(--surface-elevated)]",
      };
  }
}