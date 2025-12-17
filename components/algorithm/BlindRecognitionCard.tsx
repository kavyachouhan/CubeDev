"use client";

import { useState, useEffect, useMemo } from "react";
import { Eye, Clock, Search, Check, X } from "lucide-react";
import CubeVisualizer3D from "./CubeVisualizer3D";

interface BlindRecognitionCardProps {
  caseName: string;
  caseImage?: string;
  setupMoves: string;
  recognition: string[];
  algorithm?: string;
  puzzleType?: string; // "3x3x3", "2x2x2", etc.
  allCaseNames: string[]; // List of all possible case names
  onAnswer: (
    timeMs: number,
    correct: boolean,
    rating?: "again" | "hard" | "good" | "easy"
  ) => void;
  hasStarted?: boolean;
  onStart?: () => void;
}

export default function BlindRecognitionCard({
  caseName,
  caseImage,
  setupMoves,
  recognition,
  algorithm,
  puzzleType = "3x3x3",
  allCaseNames,
  onAnswer,
  hasStarted = false,
  onStart,
}: BlindRecognitionCardProps) {
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [currentTime, setCurrentTime] = useState<number>(Date.now());
  const [recognitionTime, setRecognitionTime] = useState<number | null>(null);
  const [selectedCase, setSelectedCase] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [isAnswered, setIsAnswered] = useState(false);
  const [wasCorrect, setWasCorrect] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);

  // Reset state when caseName changes
  useEffect(() => {
    setStartTime(Date.now());
    setCurrentTime(Date.now());
    setRecognitionTime(null);
    setSelectedCase("");
    setSearchQuery("");
    setIsAnswered(false);
    setWasCorrect(false);
    setShowDropdown(false);
  }, [caseName]);

  // Timer update effect
  useEffect(() => {
    if (!isAnswered && hasStarted) {
      const interval = setInterval(() => {
        setCurrentTime(Date.now());
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isAnswered, hasStarted]);

  // Filtered case names based on search query
  const filteredCases = useMemo(() => {
    if (!searchQuery) return allCaseNames.slice(0, 10);
    return allCaseNames
      .filter((name) => name.toLowerCase().includes(searchQuery.toLowerCase()))
      .slice(0, 10);
  }, [allCaseNames, searchQuery]);

  const handleSelectCase = (name: string) => {
    setSelectedCase(name);
    setSearchQuery(name);
    setShowDropdown(false);
  };

  const handleSubmitAnswer = () => {
    if (!selectedCase) return;

    const timeMs = Date.now() - startTime;
    setRecognitionTime(timeMs);

    const correct =
      selectedCase.toLowerCase().trim() === caseName.toLowerCase().trim();
    setWasCorrect(correct);
    setIsAnswered(true);
  };

  const handleRating = (rating: "again" | "hard" | "good" | "easy") => {
    const timeMs = recognitionTime || Date.now() - startTime;
    const correct = rating === "good" || rating === "easy";
    onAnswer(timeMs, correct, rating);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && selectedCase && !isAnswered) {
      e.preventDefault();
      handleSubmitAnswer();
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="timer-card">
        {/* Start Practice Prompt */}
        {!hasStarted && onStart && (
          <div className="text-center py-12">
            <Eye className="w-16 h-16 text-[var(--primary)] mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-[var(--text-primary)] font-statement mb-2">
              Blind Recognition
            </h3>
            <p className="text-[var(--text-muted)] mb-6 max-w-md mx-auto">
              True recognition training: identify the case name before seeing
              the answer. Type or select the case you think it is.
            </p>
            <button
              onClick={onStart}
              className="px-8 py-4 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white rounded-lg transition-colors font-medium text-lg"
            >
              Start Blind Recognition
            </button>
          </div>
        )}

        {/* Practice Content */}
        {hasStarted && (
          <>
            {/* Timer */}
            {!isAnswered && (
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
                    puzzle={puzzleType as any}
                    autoPlay={false}
                    showControls={false}
                    height="300px"
                  />
                </div>
              ) : caseImage ? (
                <img
                  src={caseImage}
                  alt="Case to identify"
                  className="max-w-full h-auto rounded-lg"
                />
              ) : (
                <div className="w-48 h-48 bg-[var(--surface-elevated)] rounded-lg flex items-center justify-center border-2 border-dashed border-[var(--border)]">
                  <div className="text-center text-[var(--text-muted)]">
                    <Eye className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">
                      Identify
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

            {/* Answer Input Section */}
            {!isAnswered ? (
              <div className="space-y-4">
                <div className="text-center">
                  <h3 className="text-2xl font-bold text-[var(--text-primary)] font-statement">
                    What case is this?
                  </h3>
                  <p className="text-sm text-[var(--text-muted)] mt-2">
                    Type or select the case name below
                  </p>
                </div>

                {/* Case Selection Input */}
                <div className="relative">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setSelectedCase("");
                        setShowDropdown(true);
                      }}
                      onFocus={() => setShowDropdown(true)}
                      onKeyDown={handleKeyDown}
                      placeholder="Type case name (e.g., T-Perm, OLL 21)..."
                      className="w-full pl-10 pr-4 py-3 bg-[var(--surface-elevated)] border border-[var(--border)] rounded-lg text-[var(--text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                    />
                  </div>

                  {/* Dropdown */}
                  {showDropdown && filteredCases.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-[var(--surface)] border border-[var(--border)] rounded-lg shadow-lg z-10 max-h-48 overflow-y-auto">
                      {filteredCases.map((name) => (
                        <button
                          key={name}
                          onClick={() => handleSelectCase(name)}
                          className={`w-full text-left px-4 py-2 hover:bg-[var(--surface-elevated)] transition-colors ${
                            selectedCase === name
                              ? "bg-[var(--primary)]/10 text-[var(--primary)]"
                              : "text-[var(--text-primary)]"
                          }`}
                        >
                          {name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  onClick={handleSubmitAnswer}
                  disabled={!selectedCase && !searchQuery}
                  className={`w-full py-3 rounded-lg transition-colors font-medium ${
                    selectedCase || searchQuery
                      ? "bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white"
                      : "bg-[var(--surface-elevated)] text-[var(--text-muted)] cursor-not-allowed"
                  }`}
                >
                  Submit Answer
                </button>
              </div>
            ) : (
              /* Answer Revealed */
              <div className="space-y-4">
                {/* Result */}
                <div
                  className={`text-center p-4 rounded-lg border ${
                    wasCorrect
                      ? "bg-green-500/10 border-green-500/20"
                      : "bg-red-500/10 border-red-500/20"
                  }`}
                >
                  {wasCorrect ? (
                    <div className="flex items-center justify-center gap-2">
                      <Check className="w-6 h-6 text-green-500" />
                      <span className="text-xl font-bold text-green-500 font-statement">
                        Correct!
                      </span>
                    </div>
                  ) : (
                    <div>
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <X className="w-6 h-6 text-red-500" />
                        <span className="text-xl font-bold text-red-500 font-statement">
                          Incorrect
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-muted)]">
                        You guessed:{" "}
                        <span className="font-mono">
                          {selectedCase || searchQuery}
                        </span>
                      </p>
                    </div>
                  )}
                </div>

                {/* Correct Answer */}
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

                {/* Rating Buttons */}
                <div className="space-y-3">
                  <div className="text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      Rate your confidence for this case
                    </p>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    <button
                      onClick={() => handleRating("again")}
                      className="py-3 px-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-500 rounded-lg transition-colors font-medium text-sm"
                    >
                      <div className="font-bold">Again</div>
                      <div className="text-xs opacity-75 mt-1">Didn't know</div>
                    </button>
                    <button
                      onClick={() => handleRating("hard")}
                      className="py-3 px-2 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 text-orange-500 rounded-lg transition-colors font-medium text-sm"
                    >
                      <div className="font-bold">Hard</div>
                      <div className="text-xs opacity-75 mt-1">Struggled</div>
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
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
