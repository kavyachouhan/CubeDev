"use client";

import { useState } from "react";
import { useUser } from "@/components/UserProvider";
import {
  Trophy,
  Play,
  TrendingUp,
  Target,
  FileText,
} from "lucide-react";
import CompetitionList from "./CompetitionList";
import SimulationMode from "./SimulationMode";
import ResultCardGenerator from "./ResultCardGenerator";
import QualifyingTracker from "./QualifyingTracker";
import AnxietyMetrics from "./AnxietyMetrics";

// WCA Events with icons
export const WCA_EVENTS = [
  { id: "333", name: "3x3x3", icon: "/cube-icons/333.svg" },
  { id: "222", name: "2x2x2", icon: "/cube-icons/222.svg" },
  { id: "444", name: "4x4x4", icon: "/cube-icons/444.svg" },
  { id: "555", name: "5x5x5", icon: "/cube-icons/555.svg" },
  { id: "666", name: "6x6x6", icon: "/cube-icons/666.svg" },
  { id: "777", name: "7x7x7", icon: "/cube-icons/777.svg" },
  { id: "333bf", name: "3x3 BLD", icon: "/cube-icons/333bf.svg" },
  { id: "333fm", name: "FMC", icon: "/cube-icons/333fm.svg" },
  { id: "333oh", name: "3x3 OH", icon: "/cube-icons/333oh.svg" },
  { id: "clock", name: "Clock", icon: "/cube-icons/clock.svg" },
  { id: "minx", name: "Megaminx", icon: "/cube-icons/minx.svg" },
  { id: "pyram", name: "Pyraminx", icon: "/cube-icons/pyram.svg" },
  { id: "skewb", name: "Skewb", icon: "/cube-icons/skewb.svg" },
  { id: "sq1", name: "Square-1", icon: "/cube-icons/sq1.svg" },
  { id: "444bf", name: "4x4 BLD", icon: "/cube-icons/444bf.svg" },
  { id: "555bf", name: "5x5 BLD", icon: "/cube-icons/555bf.svg" },
  { id: "333mbf", name: "MBLD", icon: "/cube-icons/333mbf.svg" },
];

export interface WCACompetition {
  id: string;
  name: string;
  city: string;
  country_iso2: string;
  start_date: string;
  end_date: string;
  venue: string;
  event_ids: string[];
  competitor_limit?: number;
  registration_open?: string;
  registration_close?: string;
  url?: string;
  cancelled_at?: string;
  latitude_degrees?: number;
  longitude_degrees?: number;
}

type TabType =
  | "competitions"
  | "simulation"
  | "results"
  | "tracking"
  | "anxiety";

export default function CompetitionSimulator() {
  const [activeTab, setActiveTab] = useState<TabType>("competitions");
  const [selectedCompetition, setSelectedCompetition] =
    useState<WCACompetition | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<string>("333");
  const [simulationResults, setSimulationResults] = useState<number[]>([]);

  const tabs = [
    {
      id: "competitions" as TabType,
      name: "Browse Competitions",
      icon: Trophy,
    },
    { id: "simulation" as TabType, name: "Simulation Mode", icon: Play },
    { id: "results" as TabType, name: "Result Cards", icon: FileText },
    { id: "tracking" as TabType, name: "Qualifying Tracker", icon: Target },
    {
      id: "anxiety" as TabType,
      name: "Performance Analysis",
      icon: TrendingUp,
    },
  ];

  const handleStartSimulation = (
    competition: WCACompetition,
    eventId: string
  ) => {
    setSelectedCompetition(competition);
    setSelectedEvent(eventId);
    setActiveTab("simulation");
  };

  const handleSimulationComplete = (results: number[]) => {
    setSimulationResults(results);
  };

  return (
    <div className="h-full overflow-y-auto p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] font-statement">
                Competition{" "}
                <span className="text-[var(--primary)]">Simulator</span>
              </h1>
              <p className="text-sm text-[var(--text-muted)] mt-1">
                Practice like you compete. Build confidence with realistic WCA
                simulation.
              </p>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex flex-wrap gap-2 border-b border-[var(--border)] pb-2">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                    activeTab === tab.id
                      ? "bg-[var(--primary)] text-white"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-elevated)]"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="hidden sm:inline">{tab.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px]">
          {activeTab === "competitions" && (
            <CompetitionList onStartSimulation={handleStartSimulation} />
          )}
          {activeTab === "simulation" && (
            <SimulationMode
              competition={selectedCompetition}
              eventId={selectedEvent}
              onComplete={handleSimulationComplete}
              onSelectCompetition={() => setActiveTab("competitions")}
            />
          )}
          {activeTab === "results" && (
            <ResultCardGenerator
              competition={selectedCompetition}
              eventId={selectedEvent}
              results={simulationResults}
            />
          )}
          {activeTab === "tracking" && <QualifyingTracker />}
          {activeTab === "anxiety" && <AnxietyMetrics />}
        </div>
      </div>
    </div>
  );
}