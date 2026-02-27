"use client";

import { useState, useEffect } from "react";
import { Eye, Clock, AlertTriangle } from "lucide-react";
import CubeVisualizer3D from "./CubeVisualizer3D";

interface RecognitionFlashCardProps {
  caseName: string;
  caseImage?: string;
  setupMoves: string;
  recognition: string[];
  algorithm?: string;
  puzzleType?: string; // "3x3x3", "2x2x2", etc.
  onAnswer: (
    timeMs: number,
    correct: boolean,
    rating?: "again" | "hard" | "good" | "easy",
  ) => void;
  showAnswer?: boolean;
  mode?: "srs" | "drill" | "all" | "infinite" | "custom";
  usePatternMemory?: boolean;
  hasStarted?: boolean;
  onStart?: () => void;
  showSrsRatings?: boolean; // Whether to show SRS rating buttons
  isInfiniteMode?: boolean; // Whether in infinite drill mode
  isCustomAlgorithm?: boolean; // Whether this is a user-created custom algorithm
  hasValidNotation?: boolean; // Whether notation is compatible with 3D player
}

export default function RecognitionFlashCard({
  caseName,
  caseImage,
  setupMoves,
  recognition,
  algorithm,
  puzzleType = "3x3x3",
  onAnswer,
  showAnswer = false,
  mode = "drill",
  usePatternMemory = false,
  hasStarted = false,
  onStart,
  showSrsRatings = false,
  isInfiniteMode = false,
  isCustomAlgorithm = false,
  hasValidNotation = true,
}: RecognitionFlashCardProps) {
  const [revealed, setRevealed] = useState(showAnswer);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [recognitionTime, setRecognitionTime] = useState<number | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [isFlashing, setIsFlashing] = useState(usePatternMemory);
  const [flashTimeLeft, setFlashTimeLeft] = useState(
    usePatternMemory ? 3000 : 0,
  );

  // Determine if SRS rating buttons should be shown
  const shouldShowSrsRatings = showSrsRatings || mode === "srs";

  // Reset timer when case changes
  useEffect(() => {
    setStartTime(Date.now());
    setRevealed(showAnswer);
    setRecognitionTime(null);
    setCurrentTime(Date.now());
    setIsFlashing(usePatternMemory);
    setFlashTimeLeft(usePatternMemory ? 3000 : 0);
  }, [caseName, showAnswer, usePatternMemory]);

  // Flash countdown effect
  useEffect(() => {
    if (isFlashing && flashTimeLeft > 0) {
      const interval = setInterval(() => {
        setFlashTimeLeft((prev) => {
          if (prev <= 100) {
            setIsFlashing(false);
            return 0;
          }
          return prev - 100;
        });
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isFlashing, flashTimeLeft]);

  // Update timer every 100ms until revealed
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
      // Do not call onAnswer here - wait for user rating
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
              {isInfiniteMode
                ? "Infinite Drill"
                : mode === "srs"
                  ? "SRS Review"
                  : mode === "custom"
                    ? "Custom Set Practice"
                    : "Recognition Drill"}
            </h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
              {isInfiniteMode
                ? "Drill this case repeatedly until you feel confident. The same case will keep appearing. Use the back button to exit when done."
                : mode === "srs"
                  ? "Review your due algorithm cases using spaced repetition. Rate each case based on how well you remember it."
                  : usePatternMemory
                    ? "The case will flash briefly (3s). Try to remember and identify it after it disappears."
                    : "Practice recognizing algorithm cases quickly. Cases are shown randomly based on your performance."}
            </p>
            <button
              onClick={onStart}
              className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium text-lg"
            >
              {isInfiniteMode
                ? "Start Drilling"
                : mode === "srs"
                  ? "Start SRS Review"
                  : "Start Practice"}
            </button>
          </div>
        )}

        {/* Practice Content */}
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

            {/* Flash Countdown for Pattern Memory */}
            {isFlashing && usePatternMemory && (
              <div className="flex justify-center mb-4">
                <div className="flex items-center gap-2 px-6 py-3 bg-orange-500/20 border border-orange-500/40 rounded-lg">
                  <Eye className="w-5 h-5 text-orange-500 animate-pulse" />
                  <span className="text-xl font-bold font-mono text-orange-500">
                    {(flashTimeLeft / 1000).toFixed(1)}s
                  </span>
                  <span className="text-sm text-orange-500/80">memorize!</span>
                </div>
              </div>
            )}

            {/* Case Display */}
            <div className="flex flex-col items-center justify-center min-h-[300px] mb-6">
              {isFlashing && usePatternMemory ? (
                // Flashing state
                setupMoves && hasValidNotation ? (
                  <div className="w-full max-w-md relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-lg animate-pulse z-10 pointer-events-none" />
                    <CubeVisualizer3D
                      algorithm={setupMoves}
                      puzzle={puzzleType as any}
                      autoPlay={false}
                      showControls={false}
                      height="300px"
                    />
                  </div>
                ) : setupMoves && !hasValidNotation ? (
                  <div className="w-full max-w-md h-[300px] bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center border border-[var(--border)] relative">
                    <div className="absolute inset-0 bg-orange-500/5 rounded-lg animate-pulse z-10 pointer-events-none" />
                    <div className="text-center px-6 z-20">
                      <p className="font-mono text-lg text-[var(--text-primary)] break-all leading-relaxed">
                        {setupMoves}
                      </p>
                    </div>
                  </div>
                ) : caseImage ? (
                  <div className="relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-purple-500/20 rounded-lg animate-pulse z-10 pointer-events-none" />
                    <img
                      src={caseImage}
                      alt={`${caseName} case`}
                      className="max-w-full h-auto rounded-lg"
                    />
                  </div>
                ) : null
              ) : !isFlashing && usePatternMemory && !revealed ? (
                // Hidden state in pattern memory mode
                <div className="w-full max-w-md h-[300px] bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--border)]">
                  <div className="text-center text-[var(--text-muted)]">
                    <Eye className="w-16 h-16 mx-auto mb-3 opacity-30" />
                    <p className="text-lg font-semibold mb-1">
                      What did you see?
                    </p>
                    <p className="text-sm">Try to remember the case</p>
                  </div>
                </div>
              ) : // Normal display after flash or in non-pattern memory mode
              setupMoves && hasValidNotation ? (
                <div className="w-full max-w-md">
                  <CubeVisualizer3D
                    algorithm={setupMoves}
                    puzzle={puzzleType as any}
                    autoPlay={false}
                    showControls={false}
                    height="300px"
                  />
                </div>
              ) : setupMoves && !hasValidNotation ? (
                // If notation is not compatible with 3D player, show moves in text form with warning
                <div className="w-full max-w-md">
                  <div className="bg-[var(--surface-elevated)] rounded-lg border border-[var(--border)] p-6 min-h-[250px] flex flex-col items-center justify-center">
                    <div className="flex items-center gap-2 mb-4">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <span className="text-xs text-yellow-500/80">
                        Non-standard notation
                      </span>
                    </div>
                    <p className="font-mono text-lg text-[var(--text-primary)] text-center break-all leading-relaxed">
                      {setupMoves}
                    </p>
                    {isCustomAlgorithm && (
                      <p className="text-xs text-[var(--text-muted)] mt-4 text-center">
                        3D preview unavailable for this notation
                      </p>
                    )}
                  </div>
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

              {/* Setup Moves - hide for custom algorithms where setup = notation */}
              {!(usePatternMemory && !revealed) &&
                !isFlashing &&
                setupMoves &&
                !(isCustomAlgorithm && !hasValidNotation) && (
                  <div className="mt-4 p-3 bg-[var(--surface-elevated)] rounded-lg">
                    <p className="text-xs text-[var(--text-muted)] text-center mb-1">
                      Setup
                    </p>
                    <p className="text-sm font-mono text-[var(--text-primary)] text-center">
                      {setupMoves}
                    </p>
                  </div>
                )}
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

                {/* Recognition Tips - show hints for predefined, show notation info for custom */}
                {recognition && recognition.length > 0 ? (
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
                          <span className="text-[var(--primary)] mt-0.5">
                            •
                          </span>
                          <span>{tip}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : isCustomAlgorithm ? (
                  <div className="p-4 bg-[var(--surface-elevated)] rounded-lg">
                    <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                      Custom Algorithm
                    </h4>
                    <p className="text-sm text-[var(--text-muted)]">
                      This is a custom algorithm from your collection. Practice
                      recognizing and recalling it.
                    </p>
                  </div>
                ) : null}
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
              ) : isInfiniteMode ? (
                // Infinite Drill mode - simple correct/incorrect buttons
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      Did you recognize it correctly?
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => handleRating("again")}
                      className="py-3 px-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">✗</span>
                      <span>Incorrect</span>
                    </button>
                    <button
                      onClick={() => handleRating("good")}
                      className="py-3 px-4 bg-green-500/10 hover:bg-green-500/20 border border-green-500/20 text-green-500 rounded-lg transition-colors font-medium flex items-center justify-center gap-2"
                    >
                      <span className="text-lg">✓</span>
                      <span>Correct</span>
                    </button>
                  </div>
                  <p className="text-xs text-center text-[var(--text-muted)]">
                    Same case will repeat for drilling
                  </p>
                </div>
              ) : shouldShowSrsRatings ? (
                // SRS Rating Buttons
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
                // Standard Next Case button
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