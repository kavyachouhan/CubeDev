/**
 * Utility functions for validating and analyzing cube notation strings.
 */

// List of valid move bases in standard cube notation
const STANDARD_FACE_MOVES = ["R", "L", "U", "D", "F", "B"];
const STANDARD_SLICE_MOVES = ["M", "E", "S"];
const STANDARD_ROTATION_MOVES = ["x", "y", "z"];
const STANDARD_WIDE_MOVES = ["r", "l", "u", "d", "f", "b"];

const ALL_STANDARD_BASES = [
  ...STANDARD_FACE_MOVES,
  ...STANDARD_SLICE_MOVES,
  ...STANDARD_ROTATION_MOVES,
  ...STANDARD_WIDE_MOVES,
];

// Regex pattern to match valid moves, allowing for optional wide (w), double (2), and prime (') modifiers
const VALID_MOVE_PATTERN = new RegExp(
  `^(${ALL_STANDARD_BASES.join("|")})(w)?(2)?(')?$`,
);

// Extended pattern to allow for an optional leading number (for move counts) and more flexible spacing
const EXTENDED_MOVE_PATTERN =
  /^(\d)?(R|L|U|D|F|B|M|E|S|r|l|u|d|f|b|x|y|z)(w)?(\d)?(')?$/;

// This pattern allows for moves like "R", "R'", "R2", "R2'", "Rw", "Rw'", "Rw2", as well as "3R" or "3Rw2" for move counts.
function normalizeQuotes(notation: string): string {
  // Replace all common quote-like characters with ASCII apostrophe
  return notation.replace(/[\u2018\u2019\u201A\u201B\u2032\u0060\u00B4]/g, "'");
}

// Check if a single move is valid cube notation
export function isValidCubeMove(move: string): boolean {
  if (!move || move.trim().length === 0) return false;
  const trimmed = normalizeQuotes(move.trim());
  return EXTENDED_MOVE_PATTERN.test(trimmed);
}

// Analyze a full notation string and return details about valid/invalid moves and total move count
export function analyzeNotation(notation: string): {
  isFullyValid: boolean;
  validMoves: string[];
  invalidMoves: string[];
  totalMoves: number;
} {
  if (!notation || !notation.trim()) {
    return {
      isFullyValid: true,
      validMoves: [],
      invalidMoves: [],
      totalMoves: 0,
    };
  }

  const normalized = normalizeQuotes(notation);
  const tokens = normalized
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0);
  const validMoves: string[] = [];
  const invalidMoves: string[] = [];

  for (const token of tokens) {
    if (isValidCubeMove(token)) {
      validMoves.push(token);
    } else {
      invalidMoves.push(token);
    }
  }

  return {
    isFullyValid: invalidMoves.length === 0,
    validMoves,
    invalidMoves,
    totalMoves: tokens.length,
  };
}

// Check if a notation string is fully valid and can be used with the cube visualization/player
export function isNotationCompatibleWithPlayer(notation: string): boolean {
  if (!notation || !notation.trim()) return false;
  return analyzeNotation(notation).isFullyValid;
}

// Extract only the valid moves from a notation string, preserving their order
export function extractValidMoves(notation: string): string {
  const { validMoves } = analyzeNotation(notation);
  return validMoves.join(" ");
}

// List of all valid move bases for quick reference
export function countMoves(notation: string): number {
  if (!notation || !notation.trim()) return 0;
  return notation
    .trim()
    .split(/\s+/)
    .filter((t) => t.length > 0).length;
}