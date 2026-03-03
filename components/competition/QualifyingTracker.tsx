"use client";

import { useState, useEffect } from "react";
import {
  Target,
  Clock,
  Plus,
  X,
  Check,
  Edit2,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { WCA_EVENTS } from "./CompetitionSimulator";
import { formatTime } from "@/lib/stats-utils";

interface QualifyingGoal {
  id: string;
  eventId: string;
  targetTime: number; // in milliseconds
  competitionName: string;
  competitionDate: string;
  cutoff?: number;
  timeLimit?: number;
  notes?: string;
}

interface PersonalBest {
  eventId: string;
  single: number;
  average: number;
  lastUpdated: string;
}

const STORAGE_KEY = "cubedev_qualifying_goals";
const PB_STORAGE_KEY = "cubedev_personal_bests";

export default function QualifyingTracker() {
  const [goals, setGoals] = useState<QualifyingGoal[]>([]);
  const [personalBests, setPersonalBests] = useState<PersonalBest[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<string | null>(null);

  // Form state
  const [formEvent, setFormEvent] = useState("333");
  const [formTargetMinutes, setFormTargetMinutes] = useState("");
  const [formTargetSeconds, setFormTargetSeconds] = useState("");
  const [formTargetMs, setFormTargetMs] = useState("");
  const [formCompetitionName, setFormCompetitionName] = useState("");
  const [formCompetitionDate, setFormCompetitionDate] = useState("");
  const [formCutoffMinutes, setFormCutoffMinutes] = useState("");
  const [formCutoffSeconds, setFormCutoffSeconds] = useState("");
  const [formTimeLimit, setFormTimeLimit] = useState("");
  const [formNotes, setFormNotes] = useState("");

  // PB Form state
  const [showPBForm, setShowPBForm] = useState(false);
  const [pbEvent, setPbEvent] = useState("333");
  const [pbSingleMinutes, setPbSingleMinutes] = useState("");
  const [pbSingleSeconds, setPbSingleSeconds] = useState("");
  const [pbSingleMs, setPbSingleMs] = useState("");
  const [pbAvgMinutes, setPbAvgMinutes] = useState("");
  const [pbAvgSeconds, setPbAvgSeconds] = useState("");
  const [pbAvgMs, setPbAvgMs] = useState("");

  // Load from localStorage
  useEffect(() => {
    const savedGoals = localStorage.getItem(STORAGE_KEY);
    if (savedGoals) {
      try {
        setGoals(JSON.parse(savedGoals));
      } catch (e) {
        console.error("Failed to parse qualifying goals:", e);
      }
    }

    const savedPBs = localStorage.getItem(PB_STORAGE_KEY);
    if (savedPBs) {
      try {
        setPersonalBests(JSON.parse(savedPBs));
      } catch (e) {
        console.error("Failed to parse personal bests:", e);
      }
    }
  }, []);

  // Save to localStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(goals));
  }, [goals]);

  useEffect(() => {
    localStorage.setItem(PB_STORAGE_KEY, JSON.stringify(personalBests));
  }, [personalBests]);

  // Parse time input to milliseconds
  const parseTimeToMs = (
    minutes: string,
    seconds: string,
    ms: string
  ): number => {
    const m = parseInt(minutes) || 0;
    const s = parseInt(seconds) || 0;
    const msVal = parseInt(ms) || 0;
    return m * 60000 + s * 1000 + msVal * 10;
  };

  // Add or update goal
  const saveGoal = () => {
    const targetTime = parseTimeToMs(
      formTargetMinutes,
      formTargetSeconds,
      formTargetMs
    );
    if (targetTime === 0 || !formCompetitionName) return;

    const cutoff =
      formCutoffMinutes || formCutoffSeconds
        ? parseTimeToMs(formCutoffMinutes, formCutoffSeconds, "0")
        : undefined;

    const goal: QualifyingGoal = {
      id: editingGoal || crypto.randomUUID(),
      eventId: formEvent,
      targetTime,
      competitionName: formCompetitionName,
      competitionDate: formCompetitionDate,
      cutoff,
      timeLimit: formTimeLimit ? parseInt(formTimeLimit) * 60000 : undefined,
      notes: formNotes || undefined,
    };

    if (editingGoal) {
      setGoals((prev) => prev.map((g) => (g.id === editingGoal ? goal : g)));
    } else {
      setGoals((prev) => [...prev, goal]);
    }

    resetForm();
  };

  // Delete goal
  const deleteGoal = (id: string) => {
    setGoals((prev) => prev.filter((g) => g.id !== id));
  };

  // Edit goal
  const startEditGoal = (goal: QualifyingGoal) => {
    setEditingGoal(goal.id);
    setFormEvent(goal.eventId);
    setFormCompetitionName(goal.competitionName);
    setFormCompetitionDate(goal.competitionDate);
    setFormNotes(goal.notes || "");

    // Parse target time
    const totalSeconds = Math.floor(goal.targetTime / 1000);
    const ms = Math.floor((goal.targetTime % 1000) / 10);
    setFormTargetMinutes(Math.floor(totalSeconds / 60).toString());
    setFormTargetSeconds((totalSeconds % 60).toString());
    setFormTargetMs(ms.toString().padStart(2, "0"));

    if (goal.cutoff) {
      const cutoffSeconds = Math.floor(goal.cutoff / 1000);
      setFormCutoffMinutes(Math.floor(cutoffSeconds / 60).toString());
      setFormCutoffSeconds((cutoffSeconds % 60).toString());
    }

    if (goal.timeLimit) {
      setFormTimeLimit((goal.timeLimit / 60000).toString());
    }

    setShowAddForm(true);
  };

  // Reset form
  const resetForm = () => {
    setShowAddForm(false);
    setEditingGoal(null);
    setFormEvent("333");
    setFormTargetMinutes("");
    setFormTargetSeconds("");
    setFormTargetMs("");
    setFormCompetitionName("");
    setFormCompetitionDate("");
    setFormCutoffMinutes("");
    setFormCutoffSeconds("");
    setFormTimeLimit("");
    setFormNotes("");
  };

  // Save PB
  const savePB = () => {
    const single = parseTimeToMs(pbSingleMinutes, pbSingleSeconds, pbSingleMs);
    const average = parseTimeToMs(pbAvgMinutes, pbAvgSeconds, pbAvgMs);

    if (single === 0 && average === 0) return;

    const pb: PersonalBest = {
      eventId: pbEvent,
      single,
      average,
      lastUpdated: new Date().toISOString(),
    };

    setPersonalBests((prev) => {
      const existing = prev.findIndex((p) => p.eventId === pbEvent);
      if (existing >= 0) {
        const updated = [...prev];
        updated[existing] = pb;
        return updated;
      }
      return [...prev, pb];
    });

    setShowPBForm(false);
    setPbEvent("333");
    setPbSingleMinutes("");
    setPbSingleSeconds("");
    setPbSingleMs("");
    setPbAvgMinutes("");
    setPbAvgSeconds("");
    setPbAvgMs("");
  };

  // Get PB for event
  const getPB = (eventId: string): PersonalBest | undefined => {
    return personalBests.find((p) => p.eventId === eventId);
  };

  // Calculate progress percentage
  const getProgress = (goal: QualifyingGoal): number => {
    const pb = getPB(goal.eventId);
    if (!pb || !pb.average) return 0;

    // If current PB is faster than target, 100%
    if (pb.average <= goal.targetTime) return 100;

    // Calculate progress from a reasonable starting point
    const startingTime = goal.targetTime * 2; // Assume starting from 2x target
    const progress =
      ((startingTime - pb.average) / (startingTime - goal.targetTime)) * 100;
    return Math.max(0, Math.min(100, progress));
  };

  // Check if goal is achievable
  const isGoalAchieved = (goal: QualifyingGoal): boolean => {
    const pb = getPB(goal.eventId);
    return pb ? pb.average <= goal.targetTime : false;
  };

  // Days until competition
  const getDaysUntil = (dateStr: string): number => {
    if (!dateStr) return -1;
    const date = new Date(dateStr);
    const now = new Date();
    const diff = date.getTime() - now.getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="timer-card">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-(--text-primary)">
              Qualifying Time Tracker
            </h2>
            <p className="text-sm text-(--text-muted) mt-1">
              Set goals for competition cutoffs and track your progress.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowPBForm(true)}
              className="px-4 py-2 text-sm font-medium border border-(--border) text-(--text-primary) rounded-lg hover:bg-(--surface-elevated) transition-colors flex items-center gap-2"
            >
              <Clock className="w-4 h-4" />
              Set PBs
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm font-medium bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add Goal
            </button>
          </div>
        </div>
      </div>

      {/* Personal Bests Summary */}
      {personalBests.length > 0 && (
        <div className="timer-card">
          <h3 className="font-bold text-(--text-primary) mb-4">
            Your Personal Bests
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {personalBests.map((pb) => {
              const event = WCA_EVENTS.find((e) => e.id === pb.eventId);
              return (
                <div
                  key={pb.eventId}
                  className="flex items-center gap-3 p-3 bg-(--surface-elevated) rounded-lg"
                >
                  {event && (
                    <Image
                      src={event.icon}
                      alt={event.name}
                      width={24}
                      height={24}
                      className="opacity-80"
                    />
                  )}
                  <div>
                    <div className="text-xs text-(--text-muted)">
                      {event?.name || pb.eventId}
                    </div>
                    <div className="font-mono text-sm font-medium text-(--text-primary)">
                      {pb.average > 0
                        ? formatTime(pb.average)
                        : formatTime(pb.single)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <div className="timer-card text-center py-12">
          <Target className="w-16 h-16 text-(--text-muted) mx-auto mb-4" />
          <h3 className="text-xl font-bold text-(--text-primary) mb-2">
            No Goals Set
          </h3>
          <p className="text-(--text-muted) mb-6">
            Add a qualifying time goal to start tracking your progress.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-6 py-3 bg-(--primary) text-white font-medium rounded-lg hover:bg-(--primary-hover) transition-colors"
          >
            Add Your First Goal
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {goals.map((goal) => {
            const event = WCA_EVENTS.find((e) => e.id === goal.eventId);
            const pb = getPB(goal.eventId);
            const progress = getProgress(goal);
            const achieved = isGoalAchieved(goal);
            const daysUntil = getDaysUntil(goal.competitionDate);

            return (
              <div
                key={goal.id}
                className={`timer-card ${achieved ? "border-(--success)/50" : ""}`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Event Icon */}
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-3 rounded-lg ${
                        achieved
                          ? "bg-(--success)/10"
                          : "bg-(--surface-elevated)"
                      }`}
                    >
                      {event && (
                        <Image
                          src={event.icon}
                          alt={event.name}
                          width={32}
                          height={32}
                        />
                      )}
                    </div>

                    {/* Goal Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="font-bold text-(--text-primary)">
                          {goal.competitionName}
                        </h3>
                        {achieved && (
                          <span className="flex items-center gap-1 px-2 py-0.5 text-xs bg-(--success)/10 text-(--success) rounded">
                            <Check className="w-3 h-3" />
                            Achieved
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-(--text-muted) mt-1">
                        {event?.name} • Target: {formatTime(goal.targetTime)}
                        {goal.cutoff && ` • Cutoff: ${formatTime(goal.cutoff)}`}
                      </div>
                      {daysUntil > 0 && (
                        <div className="text-sm text-(--text-muted) mt-1">
                          {daysUntil} days until competition
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Progress */}
                  <div className="flex-1 lg:max-w-xs">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-(--text-muted)">Progress</span>
                      <span className="text-(--text-primary)">
                        {Math.round(progress)}%
                      </span>
                    </div>
                    <div className="h-2 bg-(--surface-elevated) rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all ${
                          achieved
                            ? "bg-(--success)"
                            : "bg-(--primary)"
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                    {pb && (
                      <div className="text-xs text-(--text-muted) mt-1">
                        Current PB: {formatTime(pb.average || pb.single)}
                        {pb.average && pb.average > goal.targetTime && (
                          <span className="text-(--error) ml-2">
                            ({formatTime(pb.average - goal.targetTime)} to go)
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => startEditGoal(goal)}
                      className="p-2 text-(--text-muted) hover:text-(--text-primary) transition-colors"
                      title="Edit goal"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteGoal(goal.id)}
                      className="p-2 text-(--text-muted) hover:text-(--error) transition-colors"
                      title="Delete goal"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {goal.notes && (
                  <div className="mt-3 pt-3 border-t border-(--border) text-sm text-(--text-muted)">
                    {goal.notes}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add/Edit Goal Modal */}
      {showAddForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-(--surface) border border-(--border) rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-(--surface) border-b border-(--border) p-4 flex items-center justify-between">
              <h3 className="font-bold text-(--text-primary)">
                {editingGoal ? "Edit Goal" : "Add Qualifying Goal"}
              </h3>
              <button
                onClick={resetForm}
                className="p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Event Select */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Event
                </label>
                <select
                  value={formEvent}
                  onChange={(e) => setFormEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                >
                  {WCA_EVENTS.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Target Time */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Target Time
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formTargetMinutes}
                    onChange={(e) => setFormTargetMinutes(e.target.value)}
                    placeholder="min"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    :
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formTargetSeconds}
                    onChange={(e) => setFormTargetSeconds(e.target.value)}
                    placeholder="sec"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    .
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={formTargetMs}
                    onChange={(e) => setFormTargetMs(e.target.value)}
                    placeholder="ms"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                </div>
              </div>

              {/* Competition Name */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Competition Name
                </label>
                <input
                  type="text"
                  value={formCompetitionName}
                  onChange={(e) => setFormCompetitionName(e.target.value)}
                  placeholder="e.g., World Championship 2025"
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                />
              </div>

              {/* Competition Date */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Competition Date
                </label>
                <input
                  type="date"
                  value={formCompetitionDate}
                  onChange={(e) => setFormCompetitionDate(e.target.value)}
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                />
              </div>

              {/* Cutoff */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Cutoff Time (optional)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formCutoffMinutes}
                    onChange={(e) => setFormCutoffMinutes(e.target.value)}
                    placeholder="min"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    :
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={formCutoffSeconds}
                    onChange={(e) => setFormCutoffSeconds(e.target.value)}
                    placeholder="sec"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  placeholder="Any additional notes..."
                  rows={2}
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) placeholder:text-(--text-muted) focus:outline-none focus:ring-2 focus:ring-(--primary) resize-none"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={resetForm}
                  className="flex-1 px-4 py-2 border border-(--border) text-(--text-primary) rounded-lg hover:bg-(--surface-elevated) transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveGoal}
                  className="flex-1 px-4 py-2 bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
                >
                  {editingGoal ? "Update Goal" : "Add Goal"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PB Form Modal */}
      {showPBForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-(--surface) border border-(--border) rounded-xl max-w-md w-full">
            <div className="border-b border-(--border) p-4 flex items-center justify-between">
              <h3 className="font-bold text-(--text-primary)">
                Set Personal Best
              </h3>
              <button
                onClick={() => setShowPBForm(false)}
                className="p-1 text-(--text-muted) hover:text-(--text-primary) transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {/* Event */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Event
                </label>
                <select
                  value={pbEvent}
                  onChange={(e) => setPbEvent(e.target.value)}
                  className="w-full px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                >
                  {WCA_EVENTS.map((event) => (
                    <option key={event.id} value={event.id}>
                      {event.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Single PB */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Single PB
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={pbSingleMinutes}
                    onChange={(e) => setPbSingleMinutes(e.target.value)}
                    placeholder="min"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    :
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={pbSingleSeconds}
                    onChange={(e) => setPbSingleSeconds(e.target.value)}
                    placeholder="sec"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    .
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={pbSingleMs}
                    onChange={(e) => setPbSingleMs(e.target.value)}
                    placeholder="ms"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                </div>
              </div>

              {/* Average PB */}
              <div>
                <label className="text-sm text-(--text-secondary) block mb-2">
                  Average PB
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="0"
                    value={pbAvgMinutes}
                    onChange={(e) => setPbAvgMinutes(e.target.value)}
                    placeholder="min"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    :
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="59"
                    value={pbAvgSeconds}
                    onChange={(e) => setPbAvgSeconds(e.target.value)}
                    placeholder="sec"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                  <span className="flex items-center text-(--text-muted)">
                    .
                  </span>
                  <input
                    type="number"
                    min="0"
                    max="99"
                    value={pbAvgMs}
                    onChange={(e) => setPbAvgMs(e.target.value)}
                    placeholder="ms"
                    className="w-20 px-3 py-2 bg-(--surface) border border-(--border) rounded-lg text-(--text-primary) text-center focus:outline-none focus:ring-2 focus:ring-(--primary)"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowPBForm(false)}
                  className="flex-1 px-4 py-2 border border-(--border) text-(--text-primary) rounded-lg hover:bg-(--surface-elevated) transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePB}
                  className="flex-1 px-4 py-2 bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
                >
                  Save PB
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}