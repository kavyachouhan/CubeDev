"use client";

import { useState, useEffect, useMemo } from "react";
import {
  BookOpen,
  Calendar,
  Clock,
  Target,
  CheckCircle2,
  Smile,
  Meh,
  Frown,
  Zap,
  Battery,
  FolderOpen,
  Save,
  X,
} from "lucide-react";
import { Input, Textarea } from "@/components/ui/Field";
import { Button } from "@/components/ui/Button";
import type { LucideIcon } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface CoachJournalEntryProps {
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  planId?: Id<"coachTrainingPlans">;
  date?: number;
  onSave?: () => void;
  onClose?: () => void;
}

type Mood = "great" | "good" | "okay" | "frustrated" | "tired";

const MOODS: { id: Mood; label: string; icon: LucideIcon; color: string }[] = [
  { id: "great", label: "Great", icon: Smile, color: "text-(--success)" },
  { id: "good", label: "Good", icon: Smile, color: "text-(--primary)" },
  { id: "okay", label: "Okay", icon: Meh, color: "text-(--warning)" },
  {
    id: "frustrated",
    label: "Frustrated",
    icon: Frown,
    color: "text-(--error)",
  },
  { id: "tired", label: "Tired", icon: Battery, color: "text-(--text-muted)" },
];

const FOCUS_AREAS = [
  { id: "cross", label: "Cross" },
  { id: "f2l", label: "F2L" },
  { id: "oll", label: "OLL" },
  { id: "pll", label: "PLL" },
  { id: "lookahead", label: "Lookahead" },
  { id: "fingertricks", label: "Fingertricks" },
  { id: "recognition", label: "Recognition" },
  { id: "inspection", label: "Inspection" },
];

function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

export default function CoachJournalEntry({
  userId,
  profileId,
  planId,
  date: dateProp,
  onSave,
  onClose,
}: CoachJournalEntryProps) {
  // Stabilize the date to prevent infinite re-renders when date prop is undefined (Date.now())
  const stableDate = useMemo(() => dateProp ?? Date.now(), [dateProp]);

  const [mood, setMood] = useState<Mood>("good");
  const [wentWell, setWentWell] = useState("");
  const [challenges, setChallenges] = useState("");
  const [notes, setNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] =
    useState<Id<"sessions"> | null>(null);
  const [practiceMinutes, setPracticeMinutes] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionSelector, setShowSessionSelector] = useState(false);

  const sessions = useQuery(api.coach.getUserSessionsWith3x3Stats, { userId });
  const sessionStats = useQuery(
    api.coach.getSessionStats,
    selectedSessionId ? { sessionId: selectedSessionId, event: "333" } : "skip",
  );
  const existingEntry = useQuery(api.coach.getJournalEntryByDate, {
    userId,
    date: stableDate,
  });
  const saveEntry = useMutation(api.coach.saveJournalEntry);

  // Filter sessions to only show sessions with 3x3 solves
  const filteredSessions =
    sessions?.filter((session) => session.solveCount3x3 > 0) || [];

  // Load existing entry data
  useEffect(() => {
    if (existingEntry) {
      setMood(existingEntry.mood);
      setWentWell(existingEntry.wentWell || "");
      setChallenges(existingEntry.challenges || "");
      setNotes(existingEntry.notes || "");
      setFocusAreas(existingEntry.focusAreas || []);
      setSelectedSessionId(existingEntry.linkedSessionId || null);
      setPracticeMinutes(existingEntry.practiceMinutes || 30);
    }
  }, [existingEntry]);

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas((prev) =>
      prev.includes(areaId)
        ? prev.filter((id) => id !== areaId)
        : [...prev, areaId],
    );
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      await saveEntry({
        userId,
        profileId,
        planId,
        entryDate: stableDate,
        linkedSessionId: selectedSessionId || undefined,
        solveCount: sessionStats?.solveCount,
        sessionAverage: sessionStats?.average || undefined,
        bestSingle: sessionStats?.bestSingle || undefined,
        practiceMinutes,
        mood,
        wentWell: wentWell || undefined,
        challenges: challenges || undefined,
        notes: notes || undefined,
        focusAreas: focusAreas.length > 0 ? focusAreas : undefined,
      });
      onSave?.();
    } catch (error) {
      console.error("Failed to save journal entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-(--primary)/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-(--primary)" />
          </div>
          <div>
            <h3 className="font-semibold text-(--text-primary)">
              Daily Journal
            </h3>
            <p className="text-sm text-(--text-muted)">
              {formatDate(stableDate)}
            </p>
          </div>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="p-2 text-(--text-muted) hover:text-(--text-primary) hover:bg-(--surface-elevated) rounded-(--radius-control) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Mood Selection */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          How was your practice session?
        </label>
        <div className="flex gap-2 flex-wrap">
          {MOODS.map((m) => {
            const Icon = m.icon;
            return (
              <button
                key={m.id}
                onClick={() => setMood(m.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-(--radius-control) border transition-colors ${
                  mood === m.id
                    ? "bg-(--primary)/10 border-(--primary)"
                    : "bg-(--surface-elevated) border-(--border) hover:border-(--border-hover)"
                }`}
              >
                <Icon
                  className={`w-5 h-5 ${mood === m.id ? m.color : "text-(--text-muted)"}`}
                />
                <span
                  className={`text-sm font-medium ${
                    mood === m.id
                      ? "text-(--primary)"
                      : "text-(--text-secondary)"
                  }`}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Link Session */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          Link a Timer Session (Optional)
        </label>

        {selectedSessionId && sessionStats ? (
          <div className="p-4 bg-(--surface-elevated) rounded-(--radius-control) border border-(--border)">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="w-4 h-4 text-(--primary)" />
                <span className="font-medium text-(--text-primary)">
                  {sessions?.find((s) => s._id === selectedSessionId)?.name ||
                    "Session"}
                </span>
              </div>
              <button
                onClick={() => setSelectedSessionId(null)}
                className="text-sm text-(--text-muted) hover:text-(--error)"
              >
                Remove
              </button>
            </div>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <span className="text-xs text-(--text-muted) block">
                  Solves
                </span>
                <span className="font-semibold text-(--text-primary)">
                  {sessionStats.solveCount}
                </span>
              </div>
              <div>
                <span className="text-xs text-(--text-muted) block">
                  Average
                </span>
                <span className="font-semibold text-(--text-primary)">
                  {sessionStats.average
                    ? formatTime(sessionStats.average)
                    : "-"}
                </span>
              </div>
              <div>
                <span className="text-xs text-(--text-muted) block">Best</span>
                <span className="font-semibold text-(--success)">
                  {sessionStats.bestSingle
                    ? formatTime(sessionStats.bestSingle)
                    : "-"}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setShowSessionSelector(!showSessionSelector)}
            className="w-full p-3 bg-(--surface-elevated) border border-(--border) rounded-(--radius-control) text-left hover:border-(--border-hover) transition-colors"
          >
            <span className="text-sm text-(--text-muted)">
              Click to select a session from Timer...
            </span>
          </button>
        )}

        {showSessionSelector &&
          !selectedSessionId &&
          filteredSessions.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1 p-2 bg-(--surface-elevated) border border-(--border) rounded-(--radius-control)">
              {filteredSessions.slice(0, 5).map((session) => (
                <button
                  key={session._id}
                  onClick={() => {
                    setSelectedSessionId(session._id);
                    setShowSessionSelector(false);
                  }}
                  className="w-full flex items-center justify-between p-2 rounded hover:bg-(--surface) transition-colors"
                >
                  <span className="text-sm font-medium text-(--text-primary)">
                    {session.name}
                  </span>
                  <span className="text-xs text-(--text-muted)">
                    {session.solveCount3x3} solves
                  </span>
                </button>
              ))}
            </div>
          )}
      </div>

      {/* Practice Time */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          How long did you practice?
        </label>
        <div className="flex items-center gap-3">
          <Clock className="w-5 h-5 text-(--text-muted)" />
          <Input
            className="w-24"
            type="number"
            value={practiceMinutes}
            onChange={(e) => setPracticeMinutes(parseInt(e.target.value) || 0)}
            aria-label="Practice minutes"
            min={0}
            max={480}
          />
          <span className="text-sm text-(--text-muted)">minutes</span>
        </div>
      </div>

      {/* Focus Areas */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          What did you focus on?
        </label>
        <div className="flex flex-wrap gap-2">
          {FOCUS_AREAS.map((area) => (
            <button
              key={area.id}
              onClick={() => toggleFocusArea(area.id)}
              className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                focusAreas.includes(area.id)
                  ? "bg-(--primary) text-(--on-primary)"
                  : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--surface)"
              }`}
            >
              {area.label}
            </button>
          ))}
        </div>
      </div>

      {/* What Went Well */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          What went well?
        </label>
        <Textarea
          value={wentWell}
          onChange={(e) => setWentWell(e.target.value)}
          placeholder="e.g., Cross planning was much better today..."
          rows={3}
        />
      </div>

      {/* Challenges */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          What was challenging?
        </label>
        <Textarea
          value={challenges}
          onChange={(e) => setChallenges(e.target.value)}
          placeholder="e.g., Struggled with F2L lookahead..."
          rows={3}
        />
      </div>

      {/* Additional Notes */}
      <div className="space-y-3">
        <label className="block text-sm font-medium text-(--text-secondary)">
          Additional Notes
        </label>
        <Textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any other thoughts or observations..."
          rows={2}
        />
      </div>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={isSubmitting}
          loadingText="Saving…"
          iconLeft={<Save className="w-5 h-5" />}
        >
          Save entry
        </Button>
      </div>
    </div>
  );
}
