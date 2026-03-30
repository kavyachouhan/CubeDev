"use client";

import { useState, useRef, useEffect } from "react";
import { FolderOpen, BarChart3, AlertCircle, Info } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { OnboardingData } from "./CoachOnboarding";

interface CoachSessionSelectorProps {
  userId: Id<"users">;
  data: Partial<OnboardingData>;
  onUpdate: (updates: Partial<OnboardingData>) => void;
}

function formatTime(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return "-";
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

function determineSkillLevel(avgMs: number): "beginner" | "intermediate" | "advanced" | "expert" {
  if (avgMs > 60000) return "beginner"; // > 60s
  if (avgMs > 30000) return "beginner"; // > 30s
  if (avgMs > 20000) return "intermediate"; // > 20s
  if (avgMs > 12000) return "advanced"; // > 12s
  return "expert"; // < 12s
}

export default function CoachSessionSelector({
  userId,
  data,
  onUpdate,
}: CoachSessionSelectorProps) {
  const sessions = useQuery(api.coach.getUserSessionsWith3x3Stats, { userId });
  const selectedSessionStats = useQuery(
    api.coach.getSessionStats,
    data.selectedSessionId ? { sessionId: data.selectedSessionId, event: "333" } : "skip"
  );
  
  // Track last processed session to prevent infinite loop
  const lastProcessedRef = useRef<string | null>(null);

  // Filter sessions to only show sessions that have 3x3 solves
  const filteredSessions = sessions?.filter(session => session.solveCount3x3 > 0) || [];

  // Handle session stats update without causing infinite loop
  useEffect(() => {
    if (
      selectedSessionStats?.average && 
      data.selectedSessionId &&
      lastProcessedRef.current !== data.selectedSessionId
    ) {
      lastProcessedRef.current = data.selectedSessionId;
      const skillLevel = determineSkillLevel(selectedSessionStats.average);
      onUpdate({
        currentAverage: selectedSessionStats.average,
        skillLevel,
      });
    }
  }, [selectedSessionStats?.average, data.selectedSessionId]);

  const handleSessionSelect = (sessionId: Id<"sessions">) => {
    lastProcessedRef.current = null; // Reset to allow new stats processing
    onUpdate({ 
      selectedSessionId: sessionId,
      primaryEvent: "333", // Always 3x3
    });
  };

  const handleSkillLevelManual = (level: "beginner" | "intermediate" | "advanced" | "expert") => {
    onUpdate({ skillLevel: level });
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="timer-card text-center">
        <h2 className="text-2xl font-bold text-(--text-primary) mb-2">
          What's Your Current Level?
        </h2>
        <p className="text-(--text-secondary)">
          Select a recent 3x3 session so we can analyze your current skill level.
        </p>
      </div>

      {/* Session Selection Card */}
      <div className="timer-card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-(--text-primary)">Select a 3x3 Session</h3>
          <span className="text-xs text-(--text-muted)">Optional</span>
        </div>

        {/* Info Note */}
        <div className="flex items-start gap-2 p-3 bg-(--info)/10 border border-(--info)/20 rounded-lg mb-4">
          <Info className="w-4 h-4 text-(--info) shrink-0 mt-0.5" />
          <p className="text-xs text-(--text-secondary)">
            For best accuracy, select a session with at least <span className="font-semibold text-(--info)">100 solves</span>. 
            This helps us calculate a more accurate average of your current skill level.
          </p>
        </div>
        
        {!sessions ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin w-6 h-6 border-2 border-(--primary) border-t-transparent rounded-full" />
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 bg-(--surface-elevated) rounded-lg border border-(--border)">
            <AlertCircle className="w-8 h-8 text-(--text-muted) mb-2" />
            <p className="text-(--text-muted) text-sm text-center px-4">
              No 3x3 sessions found. Create some 3x3 solves in the Timer first, or select your skill level manually below.
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {filteredSessions.slice(0, 10).map((session) => {
              const isSelected = data.selectedSessionId === session._id;
              const hasEnoughSolves = session.solveCount3x3 >= 100;
              
              return (
                <button
                  key={session._id}
                  onClick={() => handleSessionSelect(session._id)}
                  className={`w-full flex items-center justify-between p-3 rounded-lg border transition-all text-left ${
                    isSelected
                      ? "bg-(--primary)/10 border-(--primary)"
                      : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <FolderOpen className={`w-5 h-5 ${isSelected ? "text-(--primary)" : "text-(--text-muted)"}`} />
                    <span className={`font-medium ${isSelected ? "text-(--primary)" : "text-(--text-primary)"}`}>
                      {session.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-sm ${
                      hasEnoughSolves 
                        ? "text-(--success)" 
                        : "text-(--text-muted)"
                    }`}>
                      {session.solveCount3x3} solves
                    </span>
                    {hasEnoughSolves && (
                      <span className="w-2 h-2 rounded-full bg-(--success)" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Session Stats Card */}
      {data.selectedSessionId && selectedSessionStats && (
        <div className="timer-card">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-(--primary)" />
            <h3 className="font-semibold text-(--text-primary)">Session Analysis</h3>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
              <span className="text-xs text-(--text-muted) block mb-1">Solves</span>
              <span className="text-xl font-bold text-(--text-primary)">
                {selectedSessionStats.solveCount}
              </span>
            </div>
            <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
              <span className="text-xs text-(--text-muted) block mb-1">Average</span>
              <span className="text-xl font-bold text-(--primary)">
                {formatTime(selectedSessionStats.average)}
              </span>
            </div>
            <div className="text-center p-3 bg-(--surface-elevated) rounded-lg">
              <span className="text-xs text-(--text-muted) block mb-1">Best</span>
              <span className="text-xl font-bold text-(--success)">
                {formatTime(selectedSessionStats.bestSingle)}
              </span>
            </div>
          </div>
          
          {selectedSessionStats.solveCount < 100 && (
            <div className="mt-3 p-2 bg-(--warning)/10 border border-(--warning)/20 rounded-lg">
              <p className="text-xs text-(--warning) text-center">
                This session has fewer than 100 solves. The average might not be fully accurate.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Manual Skill Level Selection Card */}
      <div className="timer-card">
        <h3 className="font-semibold text-(--text-primary) mb-4">
          {data.selectedSessionId ? "Detected Skill Level" : "Select Your Skill Level"}
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "beginner", label: "Beginner", description: "Average > 30s" },
            { id: "intermediate", label: "Intermediate", description: "20s - 30s" },
            { id: "advanced", label: "Advanced", description: "12s - 20s" },
            { id: "expert", label: "Expert", description: "< 12s" },
          ].map((level) => (
            <button
              key={level.id}
              onClick={() => handleSkillLevelManual(level.id as any)}
              className={`p-4 rounded-lg border text-left transition-all ${
                data.skillLevel === level.id
                  ? "bg-(--primary)/10 border-(--primary)"
                  : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
              }`}
            >
              <span className={`font-medium block ${
                data.skillLevel === level.id ? "text-(--primary)" : "text-(--text-primary)"
              }`}>
                {level.label}
              </span>
              <span className="text-xs text-(--text-muted)">{level.description}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
