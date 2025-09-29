"use client";

interface RoomJoinCardProps {
  onJoin: () => void;
  isLoading?: boolean;
}

export default function RoomJoinCard({
  onJoin,
  isLoading = false,
}: RoomJoinCardProps) {
  return (
    <div className="timer-card text-center">
      <h3 className="text-lg font-semibold text-[var(--text-primary)] font-statement mb-4">
        Join Challenge
      </h3>
      <p className="text-[var(--text-secondary)] font-inter mb-6">
        Join this challenge to compete with other cubers and see how you rank!
      </p>
      <button
        onClick={onJoin}
        disabled={isLoading}
        className="px-6 py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] disabled:opacity-50 text-white rounded-lg font-semibold transition-colors font-inter"
      >
        {isLoading ? "Joining..." : "Join Room"}
      </button>
    </div>
  );
}