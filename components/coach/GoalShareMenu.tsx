"use client";

import { Share2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ShareMenu } from "@/components/ui/ShareMenu";

interface GoalShareMenuProps {
  goalData: {
    goalType: string;
    customGoalTime?: number;
    targetDate: number;
    currentAverage?: number;
    primaryEvent: string;
    userName?: string;
    wcaId?: string;
  };
}

const GOAL_TIMES: Record<string, number> = {
  "sub-60": 60000,
  "sub-45": 45000,
  "sub-30": 30000,
  "sub-20": 20000,
  "sub-15": 15000,
  "sub-12": 12000,
  "sub-10": 10000,
  "sub-8": 8000,
};

const EVENT_NAMES: Record<string, string> = {
  "333": "3x3",
  "222": "2x2",
  "444": "4x4",
  "555": "5x5",
  "666": "6x6",
  "777": "7x7",
  "333bf": "3x3 BLD",
  "333oh": "3x3 OH",
  clock: "Clock",
  minx: "Megaminx",
  pyram: "Pyraminx",
  skewb: "Skewb",
  sq1: "Square-1",
};

function formatTime(ms: number): string {
  const seconds = ms / 1000;
  const mins = Math.floor(seconds / 60);
  const secs = (seconds % 60).toFixed(2);
  return mins > 0 ? `${mins}:${secs.padStart(5, "0")}` : secs;
}

/** Share control for a training goal, built on the shared ShareMenu. */
export default function GoalShareMenu({ goalData }: GoalShareMenuProps) {
  const targetTime =
    goalData.customGoalTime || GOAL_TIMES[goalData.goalType] || 20000;
  const eventName = EVENT_NAMES[goalData.primaryEvent] || goalData.primaryEvent;
  const goalDisplay =
    goalData.goalType === "custom"
      ? `Sub-${formatTime(targetTime)}`
      : goalData.goalType.replace("-", " ").toUpperCase();

  const deadlineDate = new Date(goalData.targetDate).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" },
  );

  const text = goalData.userName
    ? `${goalData.userName} is training to go ${goalDisplay} on ${eventName} by ${deadlineDate}! Follow their journey on CubeDev.`
    : `I'm training to go ${goalDisplay} on ${eventName} by ${deadlineDate}! Follow my journey on CubeDev.`;

  return (
    <ShareMenu
      title="Share goal"
      data={{
        title: `${goalData.userName || "My"} training goal`,
        text,
        url: goalData.wcaId
          ? `https://cubedev.xyz/cuber/${goalData.wcaId}`
          : "https://cubedev.xyz",
      }}
      trigger={(props) => (
        <Button
          {...props}
          variant="secondary"
          size="sm"
          iconLeft={<Share2 className="w-4 h-4" />}
        >
          <span className="hidden sm:inline">Share</span>
        </Button>
      )}
    />
  );
}
