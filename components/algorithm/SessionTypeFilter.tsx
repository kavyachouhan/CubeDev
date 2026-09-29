"use client";

import { ListFilter } from "lucide-react";
import { SelectMenu } from "@/components/ui/Menu";
import { SegmentedControl } from "@/components/ui/SegmentedControl";

type SessionType = "all" | "recognition" | "execution" | "drill" | "mixed";

interface SessionTypeFilterProps {
  selectedType: SessionType;
  onTypeChange: (type: SessionType) => void;
}

const TYPES = [
  { value: "all" as const, label: "All" },
  { value: "recognition" as const, label: "Recognition" },
  { value: "execution" as const, label: "Execution" },
  { value: "drill" as const, label: "Drill" },
  { value: "mixed" as const, label: "Mixed" },
];

/**
 * Five labels cannot share a phone row legibly, and a sideways scroller hides
 * options behind a gesture. So below `sm` this is a full-width select that
 * opens the shared bottom sheet — every option visible, one tap, big targets —
 * and from `sm` up it is the segmented control used by the other filters.
 * Both render the same state; the breakpoint is CSS, so there is no flash.
 */
export default function SessionTypeFilter({
  selectedType,
  onTypeChange,
}: SessionTypeFilterProps) {
  return (
    <>
      <div className="sm:hidden">
        <SelectMenu
          label="Filter sessions by type"
          value={selectedType}
          onChange={onTypeChange}
          options={TYPES.map((type) => ({
            ...type,
            textLabel: type.label,
            icon: <ListFilter />,
          }))}
        />
      </div>
      <div className="hidden sm:block">
        <SegmentedControl
          aria-label="Filter sessions by type"
          size="sm"
          value={selectedType}
          onChange={onTypeChange}
          options={TYPES}
        />
      </div>
    </>
  );
}
