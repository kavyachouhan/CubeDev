"use client";

import { useState, useEffect, useMemo } from "react";
import { 
  X, 
  BookOpen, 
  Clock, 
  CheckCircle2, 
  Circle,
  FolderOpen,
  Save,
  Smile,
  Meh,
  Frown,
  Battery,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

interface Activity {
  type: string;
  title: string;
  description: string;
  durationMinutes: number;
  targetSolves?: number;
  completed: boolean;
  completedAt?: number;
}

interface DailyPlan {
  dayOfWeek: number;
  date: number;
  focus: string;
  activities: Activity[];
  isCompleted: boolean;
  isRestDay: boolean;
}

interface TrainingPlan {
  _id: Id<"coachTrainingPlans">;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  weekNumber: number;
  weekStartDate: number;
  weekEndDate: number;
  status: "active" | "completed" | "skipped";
  dailyPlans: DailyPlan[];
  completedDays: number;
  totalDays: number;
}

interface DailyJournalModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: Id<"users">;
  profileId: Id<"coachProfiles">;
  planId?: Id<"coachTrainingPlans">;
  activePlan?: TrainingPlan | null;
  date?: number;
  onSave?: () => void;
}

type Mood = "great" | "good" | "okay" | "frustrated" | "tired";

const MOODS: { id: Mood; label: string; icon: React.ElementType }[] = [
  { id: "great", label: "Great", icon: Smile },
  { id: "good", label: "Good", icon: Smile },
  { id: "okay", label: "Okay", icon: Meh },
  { id: "frustrated", label: "Frustrated", icon: Frown },
  { id: "tired", label: "Tired", icon: Battery },
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

function isToday(timestamp: number): boolean {
  const today = new Date();
  const date = new Date(timestamp);
  return (
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()
  );
}

export default function DailyJournalModal({
  isOpen,
  onClose,
  userId,
  profileId,
  planId,
  activePlan,
  date: dateProp,
  onSave,
}: DailyJournalModalProps) {
  const stableDate = useMemo(() => dateProp ?? Date.now(), [dateProp]);
  
  const [mood, setMood] = useState<Mood>("good");
  const [wentWell, setWentWell] = useState("");
  const [challenges, setChallenges] = useState("");
  const [notes, setNotes] = useState("");
  const [focusAreas, setFocusAreas] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<Id<"sessions"> | null>(null);
  const [practiceMinutes, setPracticeMinutes] = useState<number>(30);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSessionSelector, setShowSessionSelector] = useState(false);
  const [showTasks, setShowTasks] = useState(true);

  const sessions = useQuery(api.coach.getUserSessionsWith3x3Stats, { userId });
  const sessionStats = useQuery(
    api.coach.getSessionStats,
    selectedSessionId ? { sessionId: selectedSessionId, event: "333" } : "skip"
  );
  const existingEntry = useQuery(api.coach.getJournalEntryByDate, { userId, date: stableDate });
  const saveEntry = useMutation(api.coach.saveJournalEntry);
  const updateActivity = useMutation(api.coach.updateActivityCompletion);

  // Filter sessions to only show sessions with 3x3 solves
  const filteredSessions = useMemo(() => {
    return sessions?.filter(session => session.solveCount3x3 > 0) || [];
  }, [sessions]);

  // Get today's tasks from the training plan
  const todaysTasks = useMemo(() => {
    if (!activePlan) return null;
    const todayIndex = activePlan.dailyPlans.findIndex(d => isToday(d.date));
    if (todayIndex < 0) return null;
    return { dayIndex: todayIndex, plan: activePlan.dailyPlans[todayIndex] };
  }, [activePlan]);

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

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen && !existingEntry) {
      setMood("good");
      setWentWell("");
      setChallenges("");
      setNotes("");
      setFocusAreas([]);
      setSelectedSessionId(null);
      setPracticeMinutes(30);
    }
  }, [isOpen, existingEntry]);

  const toggleFocusArea = (areaId: string) => {
    setFocusAreas(prev =>
      prev.includes(areaId)
        ? prev.filter(id => id !== areaId)
        : [...prev, areaId]
    );
  };

  const handleActivityToggle = async (dayIndex: number, activityIndex: number, completed: boolean) => {
    if (!activePlan) return;
    try {
      await updateActivity({
        planId: activePlan._id,
        dayIndex,
        activityIndex,
        completed,
      });
    } catch (error) {
      console.error("Failed to update activity:", error);
    }
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
      onClose();
    } catch (error) {
      console.error("Failed to save journal entry:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  const completedActivities = todaysTasks?.plan.activities.filter(a => a.completed).length || 0;
  const totalActivities = todaysTasks?.plan.activities.length || 0;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="timer-card max-w-lg w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-[var(--primary)]" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-[var(--text-primary)] font-statement">
                Daily Journal
              </h2>
              <p className="text-sm text-[var(--text-muted)]">{formatDate(stableDate)}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors p-1 rounded-lg hover:bg-[var(--surface-elevated)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-6">
          {/* Mood Selection */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-3 font-inter">
              How was your practice session?
            </label>
            <div className="flex flex-wrap gap-2">
              {MOODS.map((m) => {
                const Icon = m.icon;
                const isSelected = mood === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMood(m.id)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors text-sm ${
                      isSelected
                        ? "bg-[var(--primary)]/10 border-[var(--primary)] text-[var(--primary)]"
                        : "bg-[var(--surface-elevated)] border-[var(--border)] text-[var(--text-secondary)] hover:border-[var(--border-hover)]"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? "text-[var(--primary)]" : "text-[var(--text-muted)]"}`} />
                    <span className="font-medium">{m.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link Timer Session */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Link a Timer Session (Optional)
            </label>
            
            {selectedSessionId && sessionStats ? (
              <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)]">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <FolderOpen className="w-4 h-4 text-[var(--primary)]" />
                    <span className="font-medium text-[var(--text-primary)] text-sm">
                      {sessions?.find(s => s._id === selectedSessionId)?.name || "Session"}
                    </span>
                  </div>
                  <button
                    onClick={() => setSelectedSessionId(null)}
                    className="text-xs text-[var(--text-muted)] hover:text-[var(--error)] transition-colors"
                  >
                    Remove
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-2 bg-[var(--surface)] rounded-lg">
                    <span className="text-xs text-[var(--text-muted)] block">Solves</span>
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {sessionStats.solveCount}
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--surface)] rounded-lg">
                    <span className="text-xs text-[var(--text-muted)] block">Average</span>
                    <span className="font-semibold text-[var(--text-primary)] text-sm">
                      {sessionStats.average ? formatTime(sessionStats.average) : "-"}
                    </span>
                  </div>
                  <div className="p-2 bg-[var(--surface)] rounded-lg">
                    <span className="text-xs text-[var(--text-muted)] block">Best</span>
                    <span className="font-semibold text-[var(--success)] text-sm">
                      {sessionStats.bestSingle ? formatTime(sessionStats.bestSingle) : "-"}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowSessionSelector(!showSessionSelector)}
                className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-left hover:border-[var(--border-hover)] transition-colors"
              >
                <span className="text-sm text-[var(--text-muted)]">
                  Click to select a session from Timer...
                </span>
              </button>
            )}

            {showSessionSelector && !selectedSessionId && filteredSessions.length > 0 && (
              <div className="mt-2 max-h-40 overflow-y-auto space-y-1 p-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg">
                {filteredSessions.slice(0, 5).map((session) => (
                  <button
                    key={session._id}
                    onClick={() => {
                      setSelectedSessionId(session._id);
                      setShowSessionSelector(false);
                    }}
                    className="w-full flex items-center justify-between p-2 rounded hover:bg-[var(--surface)] transition-colors"
                  >
                    <span className="text-sm font-medium text-[var(--text-primary)]">{session.name}</span>
                    <span className="text-xs text-[var(--text-muted)]">{session.solveCount3x3} solves</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Practice Time */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              How long did you practice?
            </label>
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-[var(--text-muted)]" />
              <input
                type="number"
                value={practiceMinutes}
                onChange={(e) => setPracticeMinutes(parseInt(e.target.value) || 0)}
                className="w-24 px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent transition-all font-inter"
                min={0}
                max={480}
              />
              <span className="text-sm text-[var(--text-muted)]">minutes</span>
            </div>
          </div>

          {/* Focus Areas */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              What did you focus on?
            </label>
            <div className="flex flex-wrap gap-2">
              {FOCUS_AREAS.map((area) => (
                <button
                  key={area.id}
                  onClick={() => toggleFocusArea(area.id)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    focusAreas.includes(area.id)
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-secondary)] border border-[var(--border)] hover:border-[var(--border-hover)]"
                  }`}
                >
                  {area.label}
                </button>
              ))}
            </div>
          </div>

          {/* Today's Tasks Section */}
          {todaysTasks && !todaysTasks.plan.isRestDay && (
            <div className="timer-card !p-0 overflow-hidden bg-[var(--surface-elevated)] border border-[var(--border)]">
              <button
                onClick={() => setShowTasks(!showTasks)}
                className="w-full flex items-center justify-between p-4 text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-[var(--primary)]/10 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-[var(--primary)]" />
                  </div>
                  <div>
                    <span className="font-medium text-[var(--text-primary)] block text-sm">
                      Today&apos;s Training Tasks
                    </span>
                    <span className="text-xs text-[var(--text-muted)]">
                      {completedActivities}/{totalActivities} completed
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-16 h-2 bg-[var(--surface)] rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-[var(--primary)] transition-all"
                      style={{ width: `${totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0}%` }}
                    />
                  </div>
                  {showTasks ? (
                    <ChevronUp className="w-4 h-4 text-[var(--text-muted)]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                  )}
                </div>
              </button>

              {showTasks && (
                <div className="px-4 pb-4 space-y-2">
                  {todaysTasks.plan.activities.map((activity, activityIndex) => (
                    <div
                      key={activityIndex}
                      className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                        activity.completed
                          ? "bg-[var(--success)]/10"
                          : "bg-[var(--surface)]"
                      }`}
                    >
                      <button
                        onClick={() => handleActivityToggle(todaysTasks.dayIndex, activityIndex, !activity.completed)}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          activity.completed
                            ? "bg-[var(--success)] border-[var(--success)] text-white"
                            : "border-[var(--border)] hover:border-[var(--primary)]"
                        }`}
                      >
                        {activity.completed && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                      
                      <div className="flex-1 min-w-0">
                        <span className={`font-medium text-sm ${
                          activity.completed 
                            ? "text-[var(--text-muted)] line-through" 
                            : "text-[var(--text-primary)]"
                        }`}>
                          {activity.title}
                        </span>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          {activity.description}
                        </p>
                        <div className="flex items-center gap-3 mt-1.5 text-xs text-[var(--text-muted)]">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {activity.durationMinutes} min
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Rest Day Notice */}
          {todaysTasks?.plan.isRestDay && (
            <div className="p-4 bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] text-center">
              <span className="text-sm text-[var(--text-muted)]">
                Today is a rest day. Take it easy!
              </span>
            </div>
          )}

          {/* What Went Well */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              What went well?
            </label>
            <textarea
              value={wentWell}
              onChange={(e) => setWentWell(e.target.value)}
              placeholder="e.g., Cross planning was much better today..."
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm"
              rows={2}
            />
          </div>

          {/* Challenges */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              What was challenging?
            </label>
            <textarea
              value={challenges}
              onChange={(e) => setChallenges(e.target.value)}
              placeholder="e.g., Struggled with F2L lookahead..."
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm"
              rows={2}
            />
          </div>

          {/* Additional Notes */}
          <div>
            <label className="block text-sm font-medium text-[var(--text-primary)] mb-2 font-inter">
              Additional Notes
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any other thoughts or observations..."
              className="w-full px-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)] focus:border-transparent resize-none transition-all font-inter text-sm"
              rows={2}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4 mt-2 border-t border-[var(--border)]">
            <button
              type="button"
              onClick={onClose}
              className="w-full sm:flex-1 px-4 py-3 bg-transparent border border-[var(--border)] text-[var(--text-primary)] font-semibold rounded-lg hover:border-[var(--primary)] hover:bg-[var(--primary)] hover:text-white transition-all order-2 sm:order-1"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSubmitting}
              className="w-full sm:flex-1 px-4 py-3 bg-[var(--primary)] text-white font-semibold rounded-lg hover:bg-[var(--primary-hover)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 order-1 sm:order-2"
            >
              {isSubmitting ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Save Entry</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
