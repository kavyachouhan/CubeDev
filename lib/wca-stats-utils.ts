// Utility functions for WCA stats calculations and API interactions
export const WCA_API_BASE = "https://www.worldcubeassociation.org/api/v0";

export const WCA_EVENTS: Record<string, string> = {
  "222": "2x2x2",
  "333": "3x3x3",
  "444": "4x4x4",
  "555": "5x5x5",
  "666": "6x6x6",
  "777": "7x7x7",
  "333bf": "3x3x3 BLD",
  "333fm": "3x3x3 FMC",
  "333oh": "3x3x3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
  "444bf": "4x4x4 BLD",
  "555bf": "5x5x5 BLD",
  "333mbf": "3x3x3 MBLD",
};

// Deprecated events that no longer count towards Kinch score
export const DEPRECATED_EVENTS = new Set([
  "333ft",
  "333mbo",
  "magic",
  "mmagic",
]);

// Events that count as "best of" for Kinch (only best of single vs average counts)
export const BEST_OF_EVENTS = new Set(["333bf", "444bf", "555bf", "333mbf", "333fm"]);

export function formatTime(centiseconds: number, eventId?: string): string {
  if (centiseconds <= 0) return "DNF";

  // FMC uses moves, not time
  if (eventId === "333fm") {
    return `${(centiseconds / 100).toFixed(centiseconds % 100 === 0 ? 0 : 2)}`;
  }

  // MBLD uses a special encoding for points/time/missed, so format differently
  if (eventId === "333mbf") {
    return formatMBLD(centiseconds);
  }

  const totalSeconds = centiseconds / 100;

  if (totalSeconds < 60) {
    return totalSeconds.toFixed(2);
  }

  const minutes = Math.floor(totalSeconds / 60);
  const seconds = (totalSeconds % 60).toFixed(2).padStart(5, "0");

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = (minutes % 60).toString().padStart(2, "0");
    return `${hours}:${remainingMinutes}:${seconds}`;
  }

  return `${minutes}:${seconds}`;
}

function formatMBLD(value: number): string {
  // MBLD encodes points, time, and missed in a single number. We need to decode it to display properly.
  const str = value.toString().padStart(10, "0");
  const dd = parseInt(str.substring(1, 3));
  const ttttt = parseInt(str.substring(3, 8));
  const mm = parseInt(str.substring(8, 10));

  const points = 99 - dd;
  const solved = points + mm;
  const attempted = solved + mm;
  const timeMinutes = Math.floor(ttttt / 60);
  const timeSeconds = ttttt % 60;

  if (ttttt === 99999) {
    return `${solved}/${attempted}`;
  }

  return `${solved}/${attempted} ${timeMinutes}:${timeSeconds.toString().padStart(2, "0")}`;
}

// Calculate Kinch score for a single event based on PB and WR
export function calculateKinchEventScore(
  personalBest: number,
  worldRecord: number,
  eventId: string
): number {
  if (!personalBest || personalBest <= 0 || !worldRecord || worldRecord <= 0) {
    return 0;
  }

  // MBLD has a special scoring formula due to its unique encoding and the importance of points over time
  if (eventId === "333mbf") {
    return calculateMBLDKinchScore(personalBest, worldRecord);
  }

  // For other events, score is simply (WR / PB) * 100, capped at 100
  return (worldRecord / personalBest) * 100;
}

function calculateMBLDKinchScore(personalBest: number, worldRecord: number): number {
  // Decode PB and WR to extract points, time, and missed
  const pbStr = personalBest.toString().padStart(10, "0");
  const wrStr = worldRecord.toString().padStart(10, "0");

  const pbPoints = 99 - parseInt(pbStr.substring(1, 3));
  const pbTime = parseInt(pbStr.substring(3, 8));
  const pbMissed = parseInt(pbStr.substring(8, 10));
  const pbSolved = pbPoints + pbMissed;

  const wrPoints = 99 - parseInt(wrStr.substring(1, 3));
  const wrTime = parseInt(wrStr.substring(3, 8));
  const wrMissed = parseInt(wrStr.substring(8, 10));
  const wrSolved = wrPoints + wrMissed;

  // Primary factor is points solved, then time. We can create a composite score that heavily weights points but also considers time for tiebreaking.
  const pbScore = pbPoints + (1 - pbTime / 3600);
  const wrScore = wrPoints + (1 - wrTime / 3600);

  if (wrScore <= 0) return 0;

  return (pbScore / wrScore) * 100;
}

// Calculate overall Kinch score across all events, averaging the event scores and accounting for deprecated events that no longer count
export function calculateKinchScore(
  eventScores: { eventId: string; score: number }[]
): number {
  const validScores = eventScores.filter(
    (e) => !DEPRECATED_EVENTS.has(e.eventId)
  );

  if (validScores.length === 0) return 0;

  // For events that are "best of" (like BLD and FMC), only count the best score towards the average, since that's how Kinch is calculated
  const blindEvents = ["333bf", "444bf", "555bf", "333fm"];
  let totalScore = 0;
  let eventCount = 0;

  const processedEvents = new Set<string>();

  for (const event of validScores) {
    if (processedEvents.has(event.eventId)) continue;
    processedEvents.add(event.eventId);

    totalScore += event.score;
    eventCount++;
  }

  // Average the scores across all valid events
  const totalEvents = Object.keys(WCA_EVENTS).length;
  return totalScore / totalEvents;
}

// Determine if a given result is a personal record compared to the user's best records for that event
export function isPersonalRecord(
  eventId: string,
  result: number,
  bestRecords: Record<string, number>
): boolean {
  if (result <= 0) return false;

  if (!(eventId in bestRecords)) return true;

  // For MBLD, lower encoded value = better result
  return result <= bestRecords[eventId];
}

// Fetch person details from WCA API
export async function fetchWCAPerson(wcaId: string) {
  const response = await fetch(`${WCA_API_BASE}/persons/${wcaId}`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
    },
    next: { revalidate: 3600 }, // Cache for 1 hour since personal details don't change often
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`WCA API error: ${response.status}`);
  }

  return response.json();
}

// Fetch a person's results from WCA API, which includes their best records for each event and their competition history
export async function fetchWCAPersonResults(wcaId: string) {
  const response = await fetch(`${WCA_API_BASE}/persons/${wcaId}/results`, {
    headers: {
      Accept: "application/json",
      "User-Agent": "CubeDev/1.0 (https://cubedev.xyz)",
    },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`WCA API error: ${response.status}`);
  }

  return response.json();
}