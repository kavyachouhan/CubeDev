"use client";

import { useState, useEffect } from "react";
import { Target, Clock, Plus, Check, Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import { WCA_EVENTS } from "./CompetitionSimulator";
import { formatTime } from "@/lib/stats-utils";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import ConfirmDeleteModal from "@/components/ui/ConfirmDeleteModal";
import { EmptyState } from "@/components/ui/EmptyState";
import { Field, Input, Select, Textarea } from "@/components/ui/Field";
import { IconButton } from "@/components/ui/IconButton";
import { Modal } from "@/components/ui/Modal";
import { useConfirmDelete } from "@/components/ui/useConfirmDelete";
import {
  DateTimePicker,
  fromDateInputValue,
  toDateInputValue,
} from "@/components/ui/DateTimePicker";

/** Minutes : seconds . hundredths entry. `ms` is omitted for cutoffs. */
function TimeFields({
  label,
  hint,
  minutes,
  seconds,
  ms,
  onMinutes,
  onSeconds,
  onMs,
}: {
  label: string;
  hint?: string;
  minutes: string;
  seconds: string;
  ms?: string;
  onMinutes: (value: string) => void;
  onSeconds: (value: string) => void;
  onMs?: (value: string) => void;
}) {
  return (
    <Field label={label} hint={hint}>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min="0"
          max="59"
          inputMode="numeric"
          value={minutes}
          onChange={(e) => onMinutes(e.target.value)}
          placeholder="min"
          aria-label={`${label} minutes`}
          className="w-20 text-center"
        />
        <span aria-hidden className="text-(--text-muted)">
          :
        </span>
        <Input
          type="number"
          min="0"
          max="59"
          inputMode="numeric"
          value={seconds}
          onChange={(e) => onSeconds(e.target.value)}
          placeholder="sec"
          aria-label={`${label} seconds`}
          className="w-20 text-center"
        />
        {onMs && (
          <>
            <span aria-hidden className="text-(--text-muted)">
              .
            </span>
            <Input
              type="number"
              min="0"
              max="99"
              inputMode="numeric"
              value={ms ?? ""}
              onChange={(e) => onMs(e.target.value)}
              placeholder="ms"
              aria-label={`${label} hundredths`}
              className="w-20 text-center"
            />
          </>
        )}
      </div>
    </Field>
  );
}

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
  const goalDelete = useConfirmDelete<QualifyingGoal>((goal) => {
    setGoals((prev) => prev.filter((item) => item.id !== goal.id));
  });

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
            <h2 className="type-card-title">Qualifying Time Tracker</h2>
            <p className="type-caption mt-1">
              Set goals for competition cutoffs and track your progress.
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setShowPBForm(true)}
              iconLeft={<Clock className="w-4 h-4" />}
            >
              Set PBs
            </Button>
            <Button
              onClick={() => setShowAddForm(true)}
              iconLeft={<Plus className="w-4 h-4" />}
            >
              Add Goal
            </Button>
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
                  className="flex items-center gap-3 p-3 bg-(--surface-elevated) rounded-(--radius-panel)"
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
        <div className="timer-card">
          <EmptyState
            size="page"
            icon={<Target />}
            title="No goals set"
            description="Add a qualifying time goal to start tracking your progress."
            action={
              <Button onClick={() => setShowAddForm(true)}>
                Add your first goal
              </Button>
            }
          />
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
                      className={`p-3 rounded-(--radius-panel) ${
                        achieved ? "bg-(--success)/10" : "bg-(--surface-elevated)"
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
                          <Badge tone="success" icon={<Check />}>
                            Achieved
                          </Badge>
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
                    <IconButton
                      onClick={() => startEditGoal(goal)}
                      aria-label="Edit goal"
                      icon={<Edit2 />}
                    />
                    <IconButton
                      onClick={() => goalDelete.request(goal)}
                      aria-label="Delete goal"
                      variant="danger"
                      icon={<Trash2 />}
                    />
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
      <Modal open={showAddForm} onClose={resetForm} size="md" mobile="sheet">
        <Modal.Header
          title={editingGoal ? "Edit Goal" : "Add Qualifying Goal"}
        />
        <Modal.Body className="space-y-4">
          <Field label="Event">
            <Select
              value={formEvent}
              onChange={(e) => setFormEvent(e.target.value)}
              data-autofocus
            >
              {WCA_EVENTS.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </Select>
          </Field>

          <TimeFields
            label="Target Time"
            minutes={formTargetMinutes}
            seconds={formTargetSeconds}
            ms={formTargetMs}
            onMinutes={setFormTargetMinutes}
            onSeconds={setFormTargetSeconds}
            onMs={setFormTargetMs}
          />

          <Field label="Competition Name">
            <Input
              value={formCompetitionName}
              onChange={(e) => setFormCompetitionName(e.target.value)}
              placeholder="e.g. World Championship 2025"
            />
          </Field>

          <Field label="Competition Date">
            <DateTimePicker
              mode="date"
              label="Competition date"
              value={fromDateInputValue(formCompetitionDate)}
              onChange={(value) =>
                setFormCompetitionDate(toDateInputValue(value))
              }
            />
          </Field>

          <TimeFields
            label="Cutoff Time"
            hint="Optional"
            minutes={formCutoffMinutes}
            seconds={formCutoffSeconds}
            onMinutes={setFormCutoffMinutes}
            onSeconds={setFormCutoffSeconds}
          />

          <Field label="Notes" hint="Optional">
            <Textarea
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              placeholder="Any additional notes…"
              rows={2}
            />
          </Field>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={resetForm}>
            Cancel
          </Button>
          <Button onClick={saveGoal}>
            {editingGoal ? "Update Goal" : "Add Goal"}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* PB Form Modal */}
      <Modal
        open={showPBForm}
        onClose={() => setShowPBForm(false)}
        size="md"
        mobile="sheet"
      >
        <Modal.Header title="Set Personal Best" />
        <Modal.Body className="space-y-4">
          <Field label="Event">
            <Select
              value={pbEvent}
              onChange={(e) => setPbEvent(e.target.value)}
              data-autofocus
            >
              {WCA_EVENTS.map((event) => (
                <option key={event.id} value={event.id}>
                  {event.name}
                </option>
              ))}
            </Select>
          </Field>

          <TimeFields
            label="Single PB"
            minutes={pbSingleMinutes}
            seconds={pbSingleSeconds}
            ms={pbSingleMs}
            onMinutes={setPbSingleMinutes}
            onSeconds={setPbSingleSeconds}
            onMs={setPbSingleMs}
          />

          <TimeFields
            label="Average PB"
            minutes={pbAvgMinutes}
            seconds={pbAvgSeconds}
            ms={pbAvgMs}
            onMinutes={setPbAvgMinutes}
            onSeconds={setPbAvgSeconds}
            onMs={setPbAvgMs}
          />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowPBForm(false)}>
            Cancel
          </Button>
          <Button onClick={savePB}>Save PB</Button>
        </Modal.Footer>
      </Modal>
      <ConfirmDeleteModal
        isOpen={goalDelete.isOpen}
        onClose={goalDelete.cancel}
        onConfirm={goalDelete.confirm}
        isDeleting={goalDelete.isDeleting}
        title="Delete Goal?"
        description="Are you sure you want to delete this qualifying goal?"
        itemName={
          goalDelete.target
            ? `${
                WCA_EVENTS.find((event) => event.id === goalDelete.target?.eventId)
                  ?.name || goalDelete.target.eventId
              } · ${goalDelete.target.competitionName}`
            : undefined
        }
        warning="This goal is stored on this device and will be permanently removed."
        confirmLabel="Delete Goal"
      />
    </div>
  );
}