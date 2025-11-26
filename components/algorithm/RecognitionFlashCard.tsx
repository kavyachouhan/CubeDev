"use client";

import { useState, useEffect } from "react";
import { Eye, Clock } from "lucide-react";
import CubeVisualizer3D from "./CubeVisualizer3D";

interface RecognitionFlashCardProps {
  caseName: string;
  caseImage?: string;
  setupMoves: string;
  recognition: string[];
  algorithm?: string; // The algorithm notation to show after reveal
  onAnswer: (
    timeMs: number,
    correct: boolean,
    rating?: "again" | "hard" | "good" | "easy"
  ) => void;
  showAnswer?: boolean;
  mode?: "recognition" | "all" | "due"; // Add mode to determine which buttons to show
  hasStarted?: boolean; // Track if practice has started
  onStart?: () => void; // Callback when practice starts
}

export default function RecognitionFlashCard({
  caseName,
  caseImage,
  setupMoves,
  recognition,
  algorithm,
  onAnswer,
  showAnswer = false,
  mode = "all",
  hasStarted = false,
  onStart,
}: RecognitionFlashCardProps) {
  const [revealed, setRevealed] = useState(showAnswer);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [recognitionTime, setRecognitionTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());

  // Reset timer when case changes
  useEffect(() => {
    setStartTime(Date.now());
    setRevealed(showAnswer);
    setRecognitionTime(null);
    setCurrentTime(Date.now());
  }, [caseName, showAnswer]);

  // Update timer every 100ms
  useEffect(() => {
    if (!revealed) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [revealed]);

  const handleReveal = () => {
    if (!revealed) {
      const timeMs = Date.now() - startTime;
      setRecognitionTime(timeMs);
      setRevealed(true);
      // Don't call onAnswer here - wait for user to rate
    }
  };

  const handleRating = (rating: "again" | "hard" | "good" | "easy") => {
    const correct = rating === "good" || rating === "easy";
    const timeMs = recognitionTime || Date.now() - startTime;
    onAnswer(timeMs, correct, rating);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flash Card Container */}
      <div className="timer-card">
        {/* Start Practice Prompt */}
        {!hasStarted && onStart && (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-2">
              {mode === "recognition"
                ? "Recognition Practice"
                : "Practice Session"}
            </h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
              {mode === "recognition"
                ? "Practice recognizing algorithm cases quickly. Try to identify each case before revealing the answer."
                : mode === "due"
                  ? "Review your due algorithm cases using spaced repetition. Rate each case based on how well you remember it."
                  : "Practice your learned algorithm cases to improve recognition speed and accuracy."}
            </p>
            <button
              onClick={onStart}
              className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium text-lg"
            >
              Start{" "}
              {mode === "recognition" ? "Recognition Practice" : "Practice"}
            </button>
          </div>
        )}

        {/* Practice Content - Only show when started */}
        {hasStarted && (
          <>
            {/* Timer */}
            {!revealed && (
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 px-4 py-2 bg-[var(--surface-elevated)] rounded-lg">
                  <Clock className="w-4 h-4 text-[var(--primary)]" />
                  <span className="text-lg font-mono text-[var(--text-primary)] font-statement">
                    {Math.floor((currentTime - startTime) / 100) / 10}s
                  </span>
                </div>
              </div>
            )}

            {/* Case Display */}
            <div className="flex flex-col items-center justify-center min-h-[300px] mb-6">
              {setupMoves ? (
                <div className="w-full max-w-md">
                  <CubeVisualizer3D
                    algorithm={setupMoves}
                    puzzle="3x3x3"
                    autoPlay={false}
                    showControls={false}
                    height="300px"
                  />
                </div>
              ) : caseImage ? (
                <img
                  src={caseImage}
                  alt={`${caseName} case`}
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--border)]">
                  <div className="text-center text-[var(--text-muted)]">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Practice recognizing
                      <br />
                      this case
                    </p>
                  </div>
                </div>
              )}

              {/* Setup Moves (for reference) */}
              <div className="mt-4 p-3 bg-[var(--surface-elevated)] rounded-lg">
                <p className="text-xs text-[var(--text-muted)] text-center mb-1">
                  Setup
                </p>
                <p className="text-sm font-mono text-[var(--text-primary)] text-center">
                  {setupMoves}
                </p>
              </div>
            </div>

            {/* Question */}
            {!revealed && (
              <div className="text-center mb-6">
                <h3 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                  What case is this?
                </h3>
                <p className="text-sm text-[var(--text-muted)] mt-2">
                  Try to recognize the case before revealing the answer
                </p>
                <p className="text-xs text-[var(--text-muted)] mt-2 italic">
                  Tip: The timer includes your recognition time, not the setup
                  moves
                </p>
              </div>
            )}

            {/* Answer Section */}
            {revealed && (
              <div className="space-y-4">
                {/* Case Name */}
                <div className="text-center p-4 bg-[var(--primary)]/10 border border-[var(--primary)]/20 rounded-lg">
                  <h3 className="text-3xl font-bold text-[var(--primary)] font-statement">
                    {caseName}
                  </h3>
                  {recognitionTime && (
                    <p className="text-sm text-[var(--text-muted)] mt-2">
                      Recognition time: {(recognitionTime / 1000).toFixed(2)}s
                    </p>
                  )}
                </div>

                {/* Algorithm */}
                {algorithm && (
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Algorithm:
                    </h4>
                    <p className="text-lg font-mono text-[var(--text-primary)] text-center">
                      {algorithm}
                    </p>
                  </div>
                )}

                {/* Recognition Tips */}
                <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                  <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                    Recognition Tips:
                  </h4>
                  <ul className="space-y-1">
                    {recognition.map((tip, index) => (
                      <li
                        key={index}
                        className="text-sm text-[var(--text-secondary)] flex items-start gap-2"
                      >
                        <span className="text-[var(--primary)] mt-0.5">•</span>
                        <span>{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="mt-6">
              {!revealed ? (
                <button
                  onClick={handleReveal}
                  className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium"
                >
                  Show Answer
                </button>
              ) : mode === "due" ? (
                // SRS Rating buttons for spaced repetition mode
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      How well did you recognize this case?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRating("again")}
                      className="py-3 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg transition-colors font-medium text-sm"
                    >
                      <div className="font-bold">Again</div>
                      <div className="text-xs opacity-75 mt-1">
                        Didn't recognize
                      </div>
                    </button>
                    <button
                      onClick={() => handleRating("hard")}
                      className="py-3 px-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 rounded-lg transition-colors font-medium text-sm"
                    >
                      <div className="font-bold">Hard</div>
                      <div className="text-xs opacity-75 mt-1">
                        Took a while
                      </div>
                    </button>
                    <button
                      onClick={() => handleRating("good")}
                      className="py-3 px-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 text-blue-500 rounded-lg transition-colors font-medium text-sm"
                    >
                      <div className="font-bold">Good</div>
                      <div className="text-xs opacity-75 mt-1">Normal</div>
                    </button>
                    <button
                      onClick={() => handleRating("easy")}
                      className="py-3 px-2 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 rounded-lg transition-colors font-medium text-sm"
                    >
                      <div className="font-bold">Easy</div>
                      <div className="text-xs opacity-75 mt-1">Instantly</div>
                    </button>
                  </div>
                </div>
              ) : (
                // Simple Next button for free practice modes
                <button
                  onClick={() => handleRating("good")}
                  className="w-full py-3 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium"
                >
                  Next Case
                </button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
