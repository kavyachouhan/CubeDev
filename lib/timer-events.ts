export interface TimerEvent {
  id: string;
  name: string;
  category: string;
}

export const TIMER_EVENTS: TimerEvent[] = [
  { id: "333", name: "3x3", category: "WCA" },
  { id: "222", name: "2x2", category: "WCA" },
  { id: "444", name: "4x4", category: "WCA" },
  { id: "555", name: "5x5", category: "WCA" },
  { id: "666", name: "6x6", category: "WCA" },
  { id: "777", name: "7x7", category: "WCA" },
  { id: "333oh", name: "3x3 OH", category: "WCA" },
  { id: "pyram", name: "Pyraminx", category: "WCA" },
  { id: "minx", name: "Megaminx", category: "WCA" },
  { id: "skewb", name: "Skewb", category: "WCA" },
  { id: "clock", name: "Clock", category: "WCA" },
  { id: "sq1", name: "Square-1", category: "WCA" },
  { id: "333bld", name: "3x3 BLD", category: "WCA" },
  { id: "444bld", name: "4x4 BLD", category: "WCA" },
  { id: "555bld", name: "5x5 BLD", category: "WCA" },
  { id: "333mbld", name: "3x3 MBLD", category: "WCA" },
  { id: "333fm", name: "3x3 FM", category: "WCA" },
];

const EVENT_ICON_MAP: Record<string, string> = {
  "333": "333.svg",
  "222": "222.svg",
  "444": "444.svg",
  "555": "555.svg",
  "666": "666.svg",
  "777": "777.svg",
  "333oh": "333oh.svg",
  "333bld": "333bf.svg",
  "444bld": "444bf.svg",
  "555bld": "555bf.svg",
  "333mbld": "333mbf.svg",
  "333fm": "333fm.svg",
  pyram: "pyram.svg",
  minx: "minx.svg",
  skewb: "skewb.svg",
  clock: "clock.svg",
  sq1: "sq1.svg",
};

export function getEventIconPath(eventId: string): string {
  return EVENT_ICON_MAP[eventId]
    ? `/cube-icons/${EVENT_ICON_MAP[eventId]}`
    : "/cube-icons/333.svg";
}

export function getTimerEvent(eventId: string): TimerEvent {
  return TIMER_EVENTS.find((event) => event.id === eventId) || TIMER_EVENTS[0];
}