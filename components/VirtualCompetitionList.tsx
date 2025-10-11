"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Calendar, ExternalLink } from "lucide-react";

interface CompetitionInfo {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  city?: string;
  venue?: string;
  country_iso2: string;
  events: string[];
  bestResult: number;
  mainEvent?: string;
}

interface VirtualCompetitionListProps {
  competitions: CompetitionInfo[];
  itemHeight?: number;
  containerHeight?: number;
}

export default function VirtualCompetitionList({
  competitions,
  itemHeight = 100, // Approximate height of each competition item
  containerHeight = 400, // Height of the scrollable container
}: VirtualCompetitionListProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate visible range
  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
  const endIndex = Math.min(
    competitions.length,
    Math.ceil((scrollTop + containerHeight) / itemHeight) + 2
  );

  const visibleCompetitions = competitions.slice(startIndex, endIndex);
  const totalHeight = competitions.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return (
    <div
      ref={containerRef}
      onScroll={handleScroll}
      className="overflow-y-auto"
      style={{ height: `${containerHeight}px` }}
    >
      <div style={{ height: `${totalHeight}px`, position: "relative" }}>
        <div
          style={{
            transform: `translateY(${offsetY}px)`,
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
          }}
        >
          <div className="space-y-3">
            {visibleCompetitions.map((competition) => (
              <div
                key={competition.id}
                className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]"
              >
                <div className="flex items-start justify-between">
                  <div className="min-w-0 flex-1">
                    <h4 className="font-medium text-[var(--text-primary)] font-inter mb-1">
                      {competition.name}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-[var(--text-muted)] mb-2">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        <span>
                          {new Date(
                            competition.start_date
                          ).toLocaleDateString()}
                        </span>
                      </div>
                      {competition.city && (
                        <div className="flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          <span>{competition.city}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  <a
                    href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-3 p-2 text-[var(--text-muted)] hover:text-[var(--primary)] hover:bg-[var(--primary)]/10 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
