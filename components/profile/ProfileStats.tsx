import { Trophy, Medal, Target, TrendingUp } from "lucide-react";

interface WCACompetitionResult {
  id: number;
  pos: number;
  best: number;
  average: number;
  competition_id: string;
  event_id: string;
  regional_single_record?: string;
  regional_average_record?: string;
  national_single_record?: string;
  national_average_record?: string;
  world_single_record?: string;
  world_average_record?: string;
}

interface WCAPersonalRecord {
  event_id: string;
  best: number;
  world_ranking: number;
  continental_ranking: number;
  national_ranking: number;
}

interface ProfileStatsProps {
  personalRecords: WCAPersonalRecord[] | null;
  competitionResults: WCACompetitionResult[] | null;
}

export default function ProfileStats({
  personalRecords,
  competitionResults,
}: ProfileStatsProps) {
  const getStatsData = () => {
    const stats = {
      competitions: 0,
      events: 0,
      podiums: 0,
      records: 0,
    };

    if (competitionResults) {
      // Count unique competitions
      stats.competitions = new Set(
        competitionResults.map((r) => r.competition_id)
      ).size;

      // Count podium finishes
      stats.podiums = competitionResults.filter(
        (r) => r.pos && r.pos <= 3
      ).length;

      // Count records
      stats.records = competitionResults.filter(
        (r) =>
          r.world_single_record ||
          r.world_average_record ||
          r.national_single_record ||
          r.national_average_record ||
          r.regional_single_record ||
          r.regional_average_record
      ).length;
    }

    if (personalRecords) {
      stats.events = personalRecords.length;
    }

    return stats;
  };

  const stats = getStatsData();

  return (
    <div className="timer-card">
      <h2 className="text-xl font-bold text-[var(--text-primary)] mb-6 font-statement flex items-center gap-3">
        <Trophy className="w-6 h-6 text-[var(--primary)]" />
        Competition Overview
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="text-center p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
          <div className="w-10 h-10 mx-auto mb-3 bg-[var(--primary)]/10 rounded-lg flex items-center justify-center">
            <Target className="w-5 h-5 text-[var(--primary)]" />
          </div>
          <div className="text-2xl font-bold text-[var(--primary)] font-mono mb-1">
            {stats.competitions}
          </div>
          <div className="text-sm text-[var(--text-muted)] font-inter">
            Competitions
          </div>
        </div>

        <div className="text-center p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
          <div className="w-10 h-10 mx-auto mb-3 bg-yellow-500/10 rounded-lg flex items-center justify-center">
            <Trophy className="w-5 h-5 text-yellow-400" />
          </div>
          <div className="text-2xl font-bold text-yellow-400 font-mono mb-1">
            {stats.podiums}
          </div>
          <div className="text-sm text-[var(--text-muted)] font-inter">
            Podiums
          </div>
        </div>

        <div className="text-center p-4 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
          <div className="w-10 h-10 mx-auto mb-3 bg-green-500/10 rounded-lg flex items-center justify-center">
            <TrendingUp className="w-5 h-5 text-green-400" />
          </div>
          <div className="text-2xl font-bold text-green-400 font-mono mb-1">
            {stats.records}
          </div>
          <div className="text-sm text-[var(--text-muted)] font-inter">
            Records
          </div>
        </div>
      </div>

      {/* Best Rankings */}
      {personalRecords && personalRecords.length > 0 && (
        <div className="mt-6 pt-6 border-t border-[var(--border)]">
          <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4">
            Best Rankings
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Best World Ranking */}
            <div className="text-center p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
              <div className="text-lg font-bold text-[var(--primary)] font-mono mb-1">
                #
                {Math.min(
                  ...personalRecords.map((pr) => pr.world_ranking)
                ).toLocaleString()}
              </div>
              <div className="text-sm text-[var(--text-muted)] font-inter">
                World Ranking
              </div>
            </div>

            {/* Best Continental Ranking */}
            <div className="text-center p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
              <div className="text-lg font-bold text-[var(--primary)] font-mono mb-1">
                #
                {Math.min(
                  ...personalRecords.map((pr) => pr.continental_ranking)
                ).toLocaleString()}
              </div>
              <div className="text-sm text-[var(--text-muted)] font-inter">
                Continental
              </div>
            </div>

            {/* Best National Ranking */}
            <div className="text-center p-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
              <div className="text-lg font-bold text-[var(--primary)] font-mono mb-1">
                #
                {Math.min(
                  ...personalRecords.map((pr) => pr.national_ranking)
                ).toLocaleString()}
              </div>
              <div className="text-sm text-[var(--text-muted)] font-inter">
                National
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}