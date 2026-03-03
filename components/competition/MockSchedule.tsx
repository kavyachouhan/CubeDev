"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Calendar,
  Clock,
  Coffee,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Plus,
  X,
  AlertCircle,
  Volume2,
  VolumeX,
} from "lucide-react";
import Image from "next/image";
import { WCA_EVENTS } from "./CompetitionBrowser";

interface ScheduleBlock {
  id: string;
  type: "event" | "break";
  eventId?: string;
  title: string;
  duration: number; // in minutes
  startTime?: string; // HH:mm format
}

interface MockScheduleProps {
  competitionName: string;
  events: string[];
  onStartSimulation?: (schedule: ScheduleBlock[]) => void;
}

const DEFAULT_BREAK_DURATION = 15;
const DEFAULT_EVENT_DURATION = 45;

export default function MockSchedule({
  competitionName,
  events,
  onStartSimulation,
}: MockScheduleProps) {
  const [schedule, setSchedule] = useState<ScheduleBlock[]>([]);
  const [competitionStartTime, setCompetitionStartTime] = useState("09:00");
  const [isExpanded, setIsExpanded] = useState(false);
  const [currentBlockIndex, setCurrentBlockIndex] = useState<number | null>(
    null
  );
  const [isRunning, setIsRunning] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Initialize default schedule
  useEffect(() => {
    if (events.length > 0 && schedule.length === 0) {
      const defaultSchedule: ScheduleBlock[] = [];
      events.forEach((eventId, index) => {
        const event = WCA_EVENTS.find((e) => e.id === eventId);
        defaultSchedule.push({
          id: `event-${index}`,
          type: "event",
          eventId,
          title: event?.name || eventId,
          duration: DEFAULT_EVENT_DURATION,
        });

        // Add breaks between events
        if ((index + 1) % 2 === 0 && index < events.length - 1) {
          defaultSchedule.push({
            id: `break-${index}`,
            type: "break",
            title:
              index === Math.floor(events.length / 2) - 1
                ? "Lunch Break"
                : "Break",
            duration:
              index === Math.floor(events.length / 2) - 1
                ? 60
                : DEFAULT_BREAK_DURATION,
          });
        }
      });
      setSchedule(defaultSchedule);
    }
  }, [events, schedule.length]);

  // Calculate start times
  const scheduleWithTimes = useCallback(() => {
    let currentTime = competitionStartTime;
    return schedule.map((block) => {
      const startTime = currentTime;
      const [hours, minutes] = currentTime.split(":").map(Number);
      const totalMinutes = hours * 60 + minutes + block.duration;
      const newHours = Math.floor(totalMinutes / 60);
      const newMinutes = totalMinutes % 60;
      currentTime = `${String(newHours).padStart(2, "0")}:${String(newMinutes).padStart(2, "0")}`;
      return { ...block, startTime };
    });
  }, [schedule, competitionStartTime]);

  const scheduleTimed = scheduleWithTimes();

  // Calculate total duration
  const totalDuration = schedule.reduce(
    (acc, block) => acc + block.duration,
    0
  );
  const totalHours = Math.floor(totalDuration / 60);
  const totalMinutes = totalDuration % 60;

  // Timer for running simulation
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRunning && currentBlockIndex !== null) {
      interval = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRunning, currentBlockIndex]);

  // Check if current block is complete
  useEffect(() => {
    if (currentBlockIndex !== null && schedule[currentBlockIndex]) {
      const currentBlock = schedule[currentBlockIndex];
      if (elapsedTime >= currentBlock.duration * 60) {
        // Move to next block or stop
        if (currentBlockIndex < schedule.length - 1) {
          setCurrentBlockIndex(currentBlockIndex + 1);
          setElapsedTime(0);
          if (soundEnabled) {
            // Play notification sound
            const audio = new Audio("/sounds/notification.mp3");
            audio.volume = 0.5;
            audio.play().catch(() => {});
          }
        } else {
          setIsRunning(false);
          setCurrentBlockIndex(null);
        }
      }
    }
  }, [elapsedTime, currentBlockIndex, schedule, soundEnabled]);

  const addBlock = (type: "event" | "break", afterIndex: number) => {
    const newBlock: ScheduleBlock = {
      id: `${type}-${Date.now()}`,
      type,
      title: type === "break" ? "Break" : "Custom Event",
      duration:
        type === "break" ? DEFAULT_BREAK_DURATION : DEFAULT_EVENT_DURATION,
    };
    const newSchedule = [...schedule];
    newSchedule.splice(afterIndex + 1, 0, newBlock);
    setSchedule(newSchedule);
  };

  const removeBlock = (index: number) => {
    const newSchedule = schedule.filter((_, i) => i !== index);
    setSchedule(newSchedule);
  };

  const updateBlock = (index: number, updates: Partial<ScheduleBlock>) => {
    const newSchedule = [...schedule];
    newSchedule[index] = { ...newSchedule[index], ...updates };
    setSchedule(newSchedule);
  };

  const moveBlock = (index: number, direction: "up" | "down") => {
    if (
      (direction === "up" && index === 0) ||
      (direction === "down" && index === schedule.length - 1)
    ) {
      return;
    }
    const newSchedule = [...schedule];
    const targetIndex = direction === "up" ? index - 1 : index + 1;
    [newSchedule[index], newSchedule[targetIndex]] = [
      newSchedule[targetIndex],
      newSchedule[index],
    ];
    setSchedule(newSchedule);
  };

  const startSchedule = () => {
    setCurrentBlockIndex(0);
    setElapsedTime(0);
    setIsRunning(true);
    onStartSimulation?.(scheduleTimed);
  };

  const togglePause = () => {
    setIsRunning(!isRunning);
  };

  const resetSchedule = () => {
    setCurrentBlockIndex(null);
    setElapsedTime(0);
    setIsRunning(false);
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div className="timer-card">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full"
      >
        <div className="flex items-center gap-3">
          <Calendar className="w-5 h-5 text-(--primary)" />
          <div className="text-left">
            <h3 className="font-bold text-(--text-primary)">
              Competition Schedule
            </h3>
            <p className="text-xs text-(--text-muted)">
              {schedule.length} blocks - {formatDuration(totalDuration)} total
            </p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-(--text-muted)" />
        ) : (
          <ChevronDown className="w-5 h-5 text-(--text-muted)" />
        )}
      </button>

      {isExpanded && (
        <div className="mt-4 space-y-4">
          {/* Settings Row */}
          <div className="flex flex-col sm:flex-row sm:flex-wrap items-start sm:items-center gap-3 sm:gap-4 p-3 bg-(--surface-elevated) rounded-lg">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 text-(--text-muted)" />
              <label className="text-sm text-(--text-secondary)">
                Start:
              </label>
              <input
                type="time"
                value={competitionStartTime}
                onChange={(e) => setCompetitionStartTime(e.target.value)}
                className="px-2 py-1 bg-(--surface) border border-(--border) rounded text-sm text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--primary)"
                disabled={isRunning}
              />
            </div>
            <button
              onClick={() => setSoundEnabled(!soundEnabled)}
              className={`flex items-center gap-1 px-2 py-1 rounded border transition-colors ${
                soundEnabled
                  ? "border-(--primary) bg-(--primary)/10 text-(--primary)"
                  : "border-(--border) text-(--text-muted)"
              }`}
            >
              {soundEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
              <span className="text-xs">Alerts</span>
            </button>
          </div>

          {/* Schedule Timeline */}
          <div className="space-y-2">
            {scheduleTimed.map((block, index) => {
              const isActive = currentBlockIndex === index;
              const isPast =
                currentBlockIndex !== null && index < currentBlockIndex;
              const event =
                block.type === "event"
                  ? WCA_EVENTS.find((e) => e.id === block.eventId)
                  : null;

              return (
                <div key={block.id} className="relative">
                  <div
                    className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 rounded-lg border transition-all ${
                      isActive
                        ? "border-(--primary) bg-(--primary)/10"
                        : isPast
                          ? "border-(--success)/50 bg-(--success)/5"
                          : "border-(--border) bg-(--surface)"
                    }`}
                  >
                    {/* Time */}
                    <div className="w-10 sm:w-14 text-center shrink-0">
                      <span className="text-xs sm:text-sm font-mono text-(--text-secondary)">
                        {block.startTime}
                      </span>
                    </div>

                    {/* Icon */}
                    <div
                      className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 ${
                        block.type === "break"
                          ? "bg-(--warning)/20"
                          : "bg-(--primary)/20"
                      }`}
                    >
                      {block.type === "break" ? (
                        <Coffee className="w-3 h-3 sm:w-4 sm:h-4 text-(--warning)" />
                      ) : event ? (
                        <Image
                          src={event.icon}
                          alt={event.name}
                          width={16}
                          height={16}
                          className="invert opacity-80 w-3 h-3 sm:w-4 sm:h-4"
                        />
                      ) : (
                        <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4 text-(--primary)" />
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-(--text-primary) text-xs sm:text-sm truncate">
                        {block.title}
                      </div>
                      {isActive && (
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex-1 h-1 bg-(--surface-elevated) rounded-full overflow-hidden">
                            <div
                              className="h-full bg-(--primary) transition-all"
                              style={{
                                width: `${(elapsedTime / (block.duration * 60)) * 100}%`,
                              }}
                            />
                          </div>
                          <span className="text-xs font-mono text-(--text-muted)">
                            {formatElapsed(elapsedTime)} /{" "}
                            {formatElapsed(block.duration * 60)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Duration */}
                    <div className="text-[10px] sm:text-xs text-(--text-muted) shrink-0">
                      {formatDuration(block.duration)}
                    </div>

                    {/* Actions (when not running) - hidden on small mobile */}
                    {!isRunning && (
                      <div className="hidden sm:flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => moveBlock(index, "up")}
                          disabled={index === 0}
                          className="p-1 text-(--text-muted) hover:text-(--text-primary) disabled:opacity-30"
                        >
                          <ChevronUp className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => moveBlock(index, "down")}
                          disabled={index === schedule.length - 1}
                          className="p-1 text-(--text-muted) hover:text-(--text-primary) disabled:opacity-30"
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeBlock(index)}
                          className="p-1 text-(--error)/70 hover:text-(--error)"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Add block button - hidden on mobile for cleaner UI */}
                  {!isRunning && (
                    <div className="hidden sm:flex items-center justify-center py-1">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => addBlock("event", index)}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs text-(--text-muted) hover:text-(--primary) hover:bg-(--primary)/10 rounded transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                          Event
                        </button>
                        <button
                          onClick={() => addBlock("break", index)}
                          className="flex items-center gap-1 px-2 py-0.5 text-xs text-(--text-muted) hover:text-(--warning) hover:bg-(--warning)/10 rounded transition-colors"
                        >
                          <Coffee className="w-3 h-3" />
                          Break
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pt-4 border-t border-(--border)">
            <div className="text-xs sm:text-sm text-(--text-muted)">
              {totalHours > 0 ? `${totalHours}h ` : ""}
              {totalMinutes > 0 ? `${totalMinutes}m ` : ""}
              total
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              {isRunning || currentBlockIndex !== null ? (
                <>
                  <button
                    onClick={togglePause}
                    className="flex items-center gap-2 px-3 py-1.5 border border-(--border) text-(--text-primary) rounded-lg hover:bg-(--surface-elevated) transition-colors"
                  >
                    {isRunning ? (
                      <>
                        <Pause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4" />
                        Resume
                      </>
                    )}
                  </button>
                  <button
                    onClick={resetSchedule}
                    className="flex items-center gap-2 px-3 py-1.5 text-(--error) border border-(--error)/50 rounded-lg hover:bg-(--error)/10 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Reset
                  </button>
                </>
              ) : (
                <button
                  onClick={startSchedule}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-(--primary) text-white rounded-lg hover:bg-(--primary-hover) transition-colors"
                >
                  <Play className="w-4 h-4" />
                  Start Day
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}