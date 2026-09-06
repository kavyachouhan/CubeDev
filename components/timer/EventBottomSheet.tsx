"use client";

import { Check } from "lucide-react";
import Image from "next/image";
import BottomSheet from "@/components/ui/BottomSheet";
import { TIMER_EVENTS, getEventIconPath } from "@/lib/timer-events";

interface EventBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  selectedEvent: string;
  onEventChange: (event: string) => void;
  getSolveCount: (eventId: string) => number;
}

export default function EventBottomSheet({
  isOpen,
  onClose,
  selectedEvent,
  onEventChange,
  getSolveCount,
}: EventBottomSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Event">
      <div className="space-y-1">
        {TIMER_EVENTS.map((event) => {
          const isActive = event.id === selectedEvent;

          return (
            <button
              key={event.id}
              onClick={() => {
                onEventChange(event.id);
                onClose();
              }}
              className={`w-full min-h-11 flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${
                isActive
                  ? "bg-(--primary)/10"
                  : "hover:bg-(--surface-elevated)"
              }`}
            >
              <div className="w-8 h-8 bg-(--primary) text-white rounded-lg flex items-center justify-center p-1 shrink-0">
                <Image
                  src={getEventIconPath(event.id)}
                  alt={event.name}
                  width={24}
                  height={24}
                  className="w-full h-full object-contain brightness-0 invert"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-medium text-(--text-primary) font-statement">
                  {event.name}
                </div>
                <div className="text-xs text-(--text-muted) font-inter">
                  {getSolveCount(event.id)} solves
                </div>
              </div>
              {isActive && (
                <Check className="w-4 h-4 text-(--primary) shrink-0" />
              )}
            </button>
          );
        })}
      </div>
    </BottomSheet>
  );
}