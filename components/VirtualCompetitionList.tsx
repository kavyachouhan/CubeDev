"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Calendar, ExternalLink } from "lucide-react";

/** Vertical gap between rows (`space-y-3`), part of each row's pitch. */
const GAP = 12;

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
  itemHeight = 100, // Height of each item
  containerHeight = 400, // Height of the scroll container
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
          {/*
            Every row occupies exactly `itemHeight` (card + the gap below it),
            because the virtualiser positions rows by index * itemHeight. The
            name and city therefore clamp to one line instead of wrapping and
            pushing the card past its slot.
          */}
          <div className="space-y-3">
            {visibleCompetitions.map((competition) => (
              <a
                key={competition.id}
                href={`https://www.worldcubeassociation.org/competitions/${competition.id}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ height: `${itemHeight - GAP}px` }}
                className="flex items-center gap-3 px-3 bg-(--surface-elevated) rounded-(--radius-panel) border border-(--border) hover:border-(--primary)/40 transition-colors"
              >
                <div className="min-w-0 flex-1">
                  <p className="type-label truncate">{competition.name}</p>
                  <div className="mt-1 flex items-center gap-3 min-w-0 type-caption">
                    <span className="flex items-center gap-1 shrink-0">
                      <Calendar className="w-3 h-3 shrink-0" aria-hidden />
                      {new Date(competition.start_date).toLocaleDateString()}
                    </span>
                    {competition.city && (
                      <span className="flex items-center gap-1 min-w-0">
                        <MapPin className="w-3 h-3 shrink-0" aria-hidden />
                        <span className="truncate">{competition.city}</span>
                      </span>
                    )}
                  </div>
                </div>
                <ExternalLink
                  aria-hidden
                  className="w-4 h-4 shrink-0 text-(--text-muted)"
                />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}