"use client";

interface SessionTypeFilterProps {
  selectedType: "all" | "recognition" | "execution" | "drill" | "mixed";
  onTypeChange: (
    type: "all" | "recognition" | "execution" | "drill" | "mixed"
  ) => void;
}

export default function SessionTypeFilter({
  selectedType,
  onTypeChange,
}: SessionTypeFilterProps) {
  const types = [
    { value: "all" as const, label: "All" },
    { value: "recognition" as const, label: "Recognition" },
    { value: "execution" as const, label: "Execution" },
    { value: "drill" as const, label: "Drill" },
    { value: "mixed" as const, label: "Mixed" },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {types.map((type) => (
        <button
          key={type.value}
          onClick={() => onTypeChange(type.value)}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
            selectedType === type.value
              ? "bg-(--primary) text-white"
              : "bg-(--surface-elevated) text-(--text-secondary) hover:bg-(--border)"
          }`}
        >
          {type.label}
        </button>
      ))}
    </div>
  );
}