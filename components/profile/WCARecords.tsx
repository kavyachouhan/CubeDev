import { Trophy, Medal, Award } from "lucide-react";

interface WCAPersonalRecord {
  event_id: string;
  best: number;
  world_ranking: number;
  continental_ranking: number;
  national_ranking: number;
}

interface WCARecordsProps {
  personalRecords: Record<string, any> | undefined;
}

export default function WCARecords({ personalRecords }: WCARecordsProps) {
  const formatTime = (timeMs: number) => {
    if (timeMs === Infinity || timeMs === -1) return "DNF";
    const seconds = timeMs / 100; // WCA times are in centiseconds
    const mins = Math.floor(seconds / 60);
    const secs = (seconds % 60).toFixed(2);
    return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
  };

  const getEventName = (eventId: string) => {
    const events: Record<string, string> = {
      "333": "3x3",
      "222": "2x2",
      "444": "4x4",
      "555": "5x5",
      "666": "6x6",
      "777": "7x7",
      "333oh": "3x3 One-Handed",
      "333bf": "3x3 Blindfolded",
      "333fm": "3x3 Fewest Moves",
      "333ft": "3x3 With Feet",
      clock: "Clock",
      minx: "Megaminx",
      pyram: "Pyraminx",
      skewb: "Skewb",
      sq1: "Square-1",
      "444bf": "4x4 Blindfolded",
      "555bf": "5x5 Blindfolded",
      "333mbf": "3x3 Multi-Blind",
    };
    return events[eventId] || eventId;
  };

  const getRankingColor = (ranking: number) => {
    if (ranking <= 10) return "text-yellow-400";
    if (ranking <= 100) return "text-orange-400";
    if (ranking <= 1000) return "text-blue-400";
    return "text-[var(--text-secondary)]";
  };

  const getRankingIcon = (ranking: number) => {
    if (ranking <= 3) return <Trophy className="w-4 h-4" />;
    if (ranking <= 10) return <Medal className="w-4 h-4" />;
    if (ranking <= 100) return <Award className="w-4 h-4" />;
    return null;
  };

  if (!personalRecords) {
    return (
      <div className="timer-card">
        <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 font-statement flex items-center gap-3">
          <Trophy className="w-6 h-6 text-[var(--primary)]" />
          Personal Records
        </h2>
        <div className="text-center py-12">
          <Trophy className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4" />
          <p className="text-[var(--text-secondary)] font-inter text-lg">
            No personal records found.
          </p>
          <p className="text-[var(--text-muted)] font-inter text-sm mt-2">
            This cuber hasn't competed in any WCA events yet.
          </p>
        </div>
      </div>
    );
  }

  const recordEntries = Object.entries(personalRecords);

  return (
    <div className="timer-card">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 font-statement flex items-center gap-3">
        <Trophy className="w-6 h-6 text-[var(--primary)]" />
        Personal Records
        <span className="text-sm font-normal text-[var(--text-muted)] ml-2">
          ({recordEntries.length} events)
        </span>
      </h2>

      <div className="space-y-4 max-h-96 overflow-y-auto">
        {recordEntries.map(([eventId, record]) => (
          <div
            key={eventId}
            className="p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg hover:border-[var(--primary)]/50 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-[var(--text-primary)] font-statement">
                {getEventName(eventId)}
              </h3>
              {record.single?.national_ranking <= 10 && (
                <div
                  className={`flex items-center gap-1 ${getRankingColor(record.single.national_ranking)}`}
                >
                  {getRankingIcon(record.single.national_ranking)}
                  <span className="text-xs font-bold">
                    Top {record.single.national_ranking <= 3 ? "3" : "10"}
                  </span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Single */}
              {record.single && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text-muted)] font-inter mb-1">
                    Single
                  </div>
                  <div className="text-lg font-bold text-[var(--primary)] font-mono mb-2">
                    {eventId === "333fm"
                      ? `${record.single.best} moves`
                      : `${formatTime(record.single.best)}s`}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div
                        className={`font-bold ${getRankingColor(record.single.world_ranking)}`}
                      >
                        #{record.single.world_ranking?.toLocaleString()}
                      </div>
                      <div className="text-[var(--text-muted)] font-inter">
                        World
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-bold ${getRankingColor(record.single.continental_ranking)}`}
                      >
                        #{record.single.continental_ranking?.toLocaleString()}
                      </div>
                      <div className="text-[var(--text-muted)] font-inter">
                        Cont.
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-bold ${getRankingColor(record.single.national_ranking)}`}
                      >
                        #{record.single.national_ranking?.toLocaleString()}
                      </div>
                      <div className="text-[var(--text-muted)] font-inter">
                        Nat.
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Average */}
              {record.average && (
                <div className="bg-[var(--surface)] border border-[var(--border)] rounded-lg p-3">
                  <div className="text-xs text-[var(--text-muted)] font-inter mb-1">
                    Average
                  </div>
                  <div className="text-lg font-bold text-[var(--primary)] font-mono mb-2">
                    {eventId === "333fm"
                      ? `${(record.average.best / 100).toFixed(2)} moves`
                      : `${formatTime(record.average.best)}s`}
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-xs">
                    <div className="text-center">
                      <div
                        className={`font-bold ${getRankingColor(record.average.world_ranking)}`}
                      >
                        #{record.average.world_ranking?.toLocaleString()}
                      </div>
                      <div className="text-[var(--text-muted)] font-inter">
                        World
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-bold ${getRankingColor(record.average.continental_ranking)}`}
                      >
                        #{record.average.continental_ranking?.toLocaleString()}
                      </div>
                      <div className="text-[var(--text-muted)] font-inter">
                        Cont.
                      </div>
                    </div>
                    <div className="text-center">
                      <div
                        className={`font-bold ${getRankingColor(record.average.national_ranking)}`}
                      >
                        #{record.average.national_ranking?.toLocaleString()}
                      </div>
                      <div className="text-[var(--text-muted)] font-inter">
                        Nat.
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}