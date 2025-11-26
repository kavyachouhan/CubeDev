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
