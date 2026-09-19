export const ao5CleanTimes = [12340, 11520, 13110, 11880, 12050];
export const ao5WithDnf = [12340, Infinity, 13110, 11880, 12050];
export const ao5TwoDnf = [12340, Infinity, Infinity, 11880, 12050];
export const ao12Times = [
  10100, 10200, 10300, 10400, 10500, 10600, 10700, 10800, 10900, 11000, 11100,
  11200,
];

export function makeSolve(overrides: {
  id?: string;
  time: number;
  penalty?: "none" | "+2" | "DNF";
  timestamp?: Date;
  scramble?: string;
  event?: string;
  sessionId?: string;
}) {
  const time = overrides.time;
  const penalty = overrides.penalty ?? "none";
  const finalTime =
    penalty === "DNF" ? Infinity : penalty === "+2" ? time + 2000 : time;
  return {
    id: overrides.id ?? `solve-${time}`,
    time,
    timestamp: overrides.timestamp ?? new Date("2026-01-15T12:00:00.000Z"),
    scramble: overrides.scramble ?? "R U R' U'",
    penalty,
    finalTime,
    event: overrides.event ?? "333",
    sessionId: overrides.sessionId ?? "session-1",
  };
}
