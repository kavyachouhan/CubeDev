"use client";

interface PenaltyButtonsProps {
  showPenaltyButtons: boolean;
  currentPenalty: "none" | "+2" | "DNF";
  onPenaltyChange: (penalty: "none" | "+2" | "DNF") => void;
}

export default function PenaltyButtons({
  showPenaltyButtons,
  currentPenalty,
  onPenaltyChange,
}: PenaltyButtonsProps) {
  if (!showPenaltyButtons) return null;

  const handlePenalty = (penalty: "none" | "+2" | "DNF") => {
    const newPenalty = currentPenalty === penalty ? "none" : penalty;
    onPenaltyChange(newPenalty);
  };

  return (
    <div className="flex justify-center gap-3">
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handlePenalty("+2");
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        className={`px-6 py-2 text-white text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105 ${
          currentPenalty === "+2"
            ? "bg-[var(--penalty-plus2-hover)] ring-2 ring-[var(--penalty-plus2)]/50"
            : "bg-[var(--penalty-plus2)] hover:bg-[var(--penalty-plus2-hover)]"
        }`}
      >
        +2 {currentPenalty === "+2" ? "✓" : ""}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          handlePenalty("DNF");
        }}
        onTouchStart={(e) => e.stopPropagation()}
        onTouchEnd={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
        onMouseUp={(e) => e.stopPropagation()}
        className={`px-6 py-2 text-white text-sm rounded-lg font-semibold font-statement transition-all hover:scale-105 ${
          currentPenalty === "DNF"
            ? "bg-[var(--penalty-dnf-hover)] ring-2 ring-[var(--penalty-dnf)]/50"
            : "bg-[var(--penalty-dnf)] hover:bg-[var(--penalty-dnf-hover)]"
        }`}
      >
        DNF {currentPenalty === "DNF" ? "✓" : ""}
      </button>
    </div>
  );
}