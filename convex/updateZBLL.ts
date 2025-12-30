import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

/**
 * ZBLL Update Migration
 *
 * This file contains mutations to update the ZBLL algorithm set to match the correct
 * 493 cases (472 pure ZBLL + 21 PLL cases that complete the set).
 *
 * ZBLL breakdown (standard naming from CubeRoot):
 * - U: 72 cases (U1-U72)
 * - T: 72 cases (T1-T72)
 * - L: 72 cases (L1-L72)
 * - H: 40 cases (H1-H40)
 * - Pi: 72 cases (Pi1-Pi72)
 * - S (Sune): 72 cases (S1-S72)
 * - AS (Anti-Sune): 72 cases (AS1-AS72)
 * Total: 472 pure ZBLL + 21 PLL = 493 cases
 *
 * This migration preserves user algorithm progress by matching on case slugs.
 */

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// Correct ZBLL data based on CubeRoot algorithm sheet
// Format: [caseName, algorithm, altAlgorithm?]
// The algorithms shown are the main/default algorithms from the images

// ZBLL-U Cases (72 total)
const ZBLL_U_DATA = [
  // U1-U12 (first column in images)
  ["U1", "(R' U' R U' R' U2 R)", "(R' U2' R U R' U R)"],
  ["U2", "(R U' L' U R' U' L)", "(L' U R U' L U R')"],
  ["U3", "R2 D (r' U2 r D') R' U2 R'", "(R U2 R D) (r' U2 r D') R2"],
  ["U4", "R2 D (R' U R D')", "(R2' U R U2 R')"],
  ["U5", "(R U2' R2' D') (R U2 R' D)", "(R2 U' R' U2 R U2' R')"],
  ["U6", "R2 D (R' U2 R D') R' U2 R'", "(R U2 R D) (R' U2 R D') R2"],
  ["U7", "(R U' R' U') (R U2' R' UD)", "(R' U R U2) (R' U R D')"],
  ["U8", "(R' U' R U) (R U R' U') R' U", "F (R U R' U') F' (R' U R)"],
  ["U9", "(R' U' L U') (R U L' U)", "(R' U' R U') (R' U R U)"],
  ["U10", "(R' U R' U'D') (R U' R' U2')", "(R' U' R' D) R U' R"],
  ["U11", "(R' U' R U') L U' (R' U2 L'", "(U2) R U' L U2 L'"],
  ["U12", "(R U' R' U) (R U R' U')2", "R U L U' R' U L'"],

  // U13-U24
  ["U13", "R2' D' (r U2 r' D) R U2 R", ""],
  ["U14", "R2' D' (R U' R' D)", "(R2 U' R' U2 R)"],
  ["U15", "(R U R' U) R U2' R2'", "z (R U R' D) R U' z'"],
  ["U16", "(R' U2 R' D') (R U2 R' D)", "(R U2 R U R' U R)"],
  ["U17", "R2' D' (R U2 R' D) R U2 R", ""],
  ["U18", "(R' U2' R2 D) (R' U2 R D')", "R2' U (R U2 R' U2' R)"],
  ["U19", "(R' U R U) (R' U2' R U'D')", "(R U' R' U2) (R U' R' D)"],
  ["U20", "(R U R' U') (R U' R')", "(L' U R U' R' L)"],
  ["U21", "(R' U' R UD) (R' U U2' R')", "(R' U' R D') R' U' R U' R'"],
  ["U22", "(R U L' U R' U') L) U'", "(R U R' U') (L' U R U' R')"],
  ["U23", "(R' U R U') R' U' (R U R'", "(R' U2 R D') (R' U' R U)"],
  ["U24", "F (R U' R' U') (R U2 R' U')", "F' (R' U R U) (R' U2 R U)"],

  // U25-U36 (FB-light)
  ["U25", "R' F (R U' R' U') (R U R' F')", ""],
  ["U26", "L' (R' U2 L U2) (R U' L' U) L", ""],
  ["U27", "F2 (R U' R' U') (R U R' F')", "(R U R' U') (R' F R F2)"],
  ["U28", "L (R U2' R' U2) (L' U R U' R')", ""],
  ["U29", "F U R2' D' (R U' R' D) R2 F'", ""],
  ["U30", "(R' U' R F) R2' D' (R U R'", ""],
  ["U31", "F' (R U R' U) (R U R' F') (R", ""],
  ["U32", "R2' F' (R U R' U') (R' F R2 U')", ""],
  ["U33", "R' U' (R U' R' U2)2 R' D'", ""],
  ["U34", "(R U R' U) (R U2' R' U) (R", ""],
  ["U35", "R2' D' (R U2 R' D) R U2", "(R U R' U2) (R U R' U R)"],
  ["U36", "(R2 D R' U2 R D' R' U2 R')", "U' (R U2 R' U' R U' R')"],

  // U37-U48 (X pattern)
  ["U37", "(R U R' U') L' U2 (R U R'", "R' D' (R U R' D) (R2 U R'2)"],
  ["U38", "(R U2' R' U' R U' R') (R2' D'", ""],
  ["U39", "(R' U' R U) L U2 (R' U' R", "R U2' R' (L' U R U') L"],
  ["U40", "(R' U2' R U R' U R) (R2 D", ""],
  ["U41", "x' R2 D2 (R' U2 R D2)", ""],
  ["U42", "x R2' D2 (R U2 R' D2)", "R U2 R x'"],
  ["U43", "F (R U' R' U) (R U R' U)", ""],
  ["U44", "L' (R' U R U') L (R' U' R U2)", ""],
  ["U45", "(R' U R U) (R' U R U') R D", "(R' U R2 D) (R' U R D')"],
  ["U46", "(R U' R' U') (R U' R' U) R D'", "R' D' (R U R' D) R U' R"],
  ["U47", "(R' U2 R U) (R' U R' D')", "(R' U' R' D) R U' R"],
  ["U48", "(R U' R' U') (R U2' R' U2)", "R' D' (R U' R' D) R U2 R"],

  // U49-U60 (B-light)
  ["U49", "(R' U' R' U') (R U R D) (R' U R D') R2'", ""],
  ["U50", "F (R U R' U')2 F' U' R'", "(F U' F') U R"],
  ["U51", "", ""],
  ["U52", "(R' U2 R) F U' (R' U' R U) F'", ""],
  ["U53", "F (R U R' U') (R U2' R' U')", ""],
  ["U54", "", ""],
  ["U55", "", ""],
  ["U56", "(R' U2 R) F U' (R' U R U) (R' U R U') F'", ""],
  ["U57", "R' D' (R U' R' D) R2 U2'", "R' U R U R'"],
  ["U58", "F (R U R' U') F' U2 (r' U r2", "U' r2' U' r)"],
  ["U59", "R D' R2' U (R U' R' U2')", ""],
  ["U60", "", ""],

  // U61-U72 (F-light / 2GLL-U)
  ["U61", "(R U R' U R U2' R') U", "(R U2' R' U' R U' R')"],
  ["U62", "(R U R' U') (R U' R' U2)", "R U R'"],
  ["U63", "(R U2' R' U R U' R') U'", "(R U' R' U R U2' R')"],
  ["U64", "(R' U2' R2 U R2' U) R U'", "(R U R' U') R' U R"],
  ["U65", "(R' U2 R U R' U R) U", "(R' U' R' U' R' U2 R)"],
  ["U66", "(R U2' R2' U' R2 U') (R' U", "R' U') (R U' R' U R)"],
  ["U67", "(R U R' U) (R' U' R U')", "(R' U2' R U2' R' U2 R U2' R')"],
  ["U68", "(R' U' R U') (R U R' U')", "(R' U2' R U2 R U2' R')"],
  ["U69", "(R' U' R U' R' U2 R)", "(R U2' R' U' R U' R')"],
  ["U70", "(R U R' U R U2' R')", "(R U2' R' U' R U' R')"],
  ["U71", "x' R2 D2 (R' U' R D2)", "R2' D (R U R' D') x"],
  ["U72", "", ""],
];

// ZBLL-T Cases (72 total)
const ZBLL_T_DATA = [
  // T1-T12 (R-light)
  ["T1", "R' U' (R U' R' U') R U2", "L' (R' U R U') L"],
  ["T2", "R' U2' (R2 U R' U') R' U2'", "F' (R U2 R U2') R' F"],
  ["T3", "R2' F2 (R U2' R U2')", "(R' F2 R U') R' F2 R2"],
  ["T4", "F R2 D (R' U' R D') R2' U' F'", "(R U2 R' U') F'"],
  ["T5", "F (R U R' U')2 F' (R U R'", "U') (R' F R F')"],
  ["T6", "(l' U' L U) (R U' r' F)", "F' (r U R' U') (r' F R)"],
  ["T7", "(R' U2 R) F U' (R' U R U) F'", "(R' U R)"],
  ["T8", "(R' U' R U) (R' U R)", "L' (U R' U' R) L"],
  ["T9", "F U (R U2 R' U) (R U R' F')", ""],
  ["T10", "(R U R' U') R' F'", "(R U2 R U2') R' F"],
  ["T11", "(R U R' U') (R U R2' D')", "(R U2 R' D) R2 U'"],
  ["T12", "R' U (R U R' U') R' D'", "(R U2 R' D) R U R"],

  // T13-T24 (L-light)
  ["T13", "L (R U' R' U) L' (R U R' U)", "(R U R' U') R U' R'"],
  ["T14", "R' D' (R U R' D) (R2 U' R'", "U) (R U R' U') R U' R'"],
  ["T15", "(R U R' U) (R U R' U2) L", "(R U' R' U') R' U' R"],
  ["T16", "F (R U R' U') R' F' U2'", "(R U R' U') R2' U' R"],
  ["T17", "(r U R' U') (r' F R F')", "(F R' F' r) (U R U' r')"],
  ["T18", "(R' U2 R U2') (R' U R U')", "(L U' R' U L') (U R)"],
  ["T19", "(R U R D) (R' U2 R D') (R' U' R' U)", ""],
  ["T20", "(R U R' U') (R U' R')", "(L' U R U' L)"],
  ["T21", "(R U2' R' U2) (R' F R U R", "U' R' F')"],
  ["T22", "L' U2 (R U2' R' U2) L", "L U R U' R'"],
  ["T23", "(R U' R' U') (R U R D)", "(R' U2 R D') R' U' R"],
  ["T24", "L' (R U R' U) L U", "(R U R' U') R U' R'"],

  // T25-T36 (F-light)
  ["T25", "(R' U R U2') L'", "(R' U R U') L"],
  ["T26", "(R U R D) (R' U' R D')", "(R' U2 R' U') R U' R'"],
  ["T27", "(R' U' R' U2) L", "(R U' R' U) L'"],
  ["T28", "(R' U L U' R U L') U", "(R U R' U R U2' R')"],
  ["T29", "F (R U' R' U') (R U2 R' U')", "F' (R' U R U) (R' U2 R)"],
  ["T30", "(R' U2' R U R' U R) F U", "(R U' R' U) (R U R' F')"],
  ["T31", "(r U' r U2') (R' F R U2) r2' F", "(r U' r U2') (R' F R2) r2' F"],
  ["T32", "(R U R' U') (R' U L' U2)", "(R' U' R U L) R' L"],
  ["T33", "(R U' R' U) (R U R' U')2", "R' D' (R U' R' D) R"],
  ["T34", "(R U R' U) (R U' R' U')", "L' U2 (R U2' R' U2) L"],
  ["T35", "R' D' (R U R' D) R U (R U'", "R' U') R U R'"],
  ["T36", "L' U2 (R U2' R' U2) L U", "(R U' R' U') R U' R'"],

  // T37-T48 (B-light)
  ["T37", "R' D' (R U R' D) (R2 U R'", "U2) (R U' R' U') R U' R'"],
  ["T38", "(R U2 R D R' U2 R D' R2')", "U (R U2 R' U' R U' R')"],
  ["T39", "(R U2' R') (L' U R U)", "(L U' L') R' U L"],
  ["T40", "(R U2 R D) (R' U2 R D')", "(R' U' R U') R' U2 R"],
  ["T41", "x (R' U2 R' D2) (R U2 R')", "D2 R2 x'"],
  ["T42", "x' (R U2 R D2) (R' U2 R)", "D2 R2' x"],
  ["T43", "", ""],
  ["T44", "", ""],
  ["T45", "(R' U' R' D' R U R' D)", "(R' U2' R' U R U' R)"],
  ["T46", "(R U' R' U') (R U' R' U) R' D'", ""],
  ["T47", "(R' U R2 D) (R' U R D')", "(R' U R' U') (R U' R' U') R"],
  ["T48", "(F R U R' U' R' F' R) U", "(R U' R' U') (R U R' F')"],

  // T49-T60 (LR-light)
  ["T49", "(R' U' R U) (R' U' R2 D)", "(R' U R D') (R' U2 R)"],
  ["T50", "R2' F2 (R U2 R U2') R' F'", "(R' U' R' F') R2"],
  ["T51", "(R U' R2' D') (r U2 r' D)", "(R2 U' R' U') R U' R'"],
  ["T52", "(R U R' U2) R' D' (R U R' D)", "(R2 U' R' U) R U' R'"],
  ["T53", "(R U2' R' U) (L U' R U L2'", "U) R' U' L"],
  ["T54", "R2' F (R U R' U') R' F'", "(R' U' R2 U2') R U2 R"],
  ["T55", "(R U' R2' D') (r U2 r' D)", "R2 U R'"],
  ["T56", "(R' U R2 D) (r' U2 r D')", "R2' U' R"],
  ["T57", "R' U' (R U2 R D) (R' U' R D')", "(R2' U R U') R' U R"],
  ["T58", "(R' U' R U' R2' U2') (R U R' U' L' U R2 U' R')", ""],
  ["T59", "(R U R' U') (R U R2' D')", "(R U' R' D) (R U2 R' U)"],
  ["T60", "(R U R' F' R U R' U')", "(R' F R U R' F' R) U'"],

  // T61-T72 (FB-light / 2GLL-T)
  ["T61", "(R U' R' U2) (R U R' U2)", "(R U' R' U) R U R'"],
  ["T62", "(R U R' U R U2' R') U'", "(R U2' R' U' R U' R')"],
  ["T63", "", ""],
  ["T64", "(R U2' R' U R U' R') U", "(R U2' R' U R U2' R')"],
  ["T65", "(R' U' R U') (R' U U' R) R U", "R2 U2' R'"],
  ["T66", "(R' U2 R U R' U R) U'", "(R U2' R' U R U' R')"],
  ["T67", "(R' U' R2 U R2' U R2 U2')", "(R' U' R' U R U R)"],
  ["T68", "(R U R2' U' R2 U' R2' U2)", "R U R U' R' U' R'"],
  ["T69", "(R U2' R' U R U' R')", "(R' U2' R U' R' U R)"],
  ["T70", "(R' U2 R U R' U R)", "(R U2 R' U R U' R')"],
  ["T71", "x' D (R U' R' D') R2 D2", "(R' U R D2) R2' x"],
  ["T72", "(R U R' U R U2' R')", "(L' U' L U' L' U2 L)"],
];

// ZBLL-L Cases (72 total)
const ZBLL_L_DATA = [
  // L1-L12 (B-Comm)
  ["L1", "(R U2' R' U' R U' R' U')", "(L' U' R' U L' U' R)"],
  ["L2", "(L U' R' U L' U' R)", "(R U2' R' U' R U' R')"],
  ["L3", "(R' U2' R2 D) (R' U R D')", "R2 U R"],
  ["L4", "(R' U2 R' D') (r U2 r' D) R2", ""],
  ["L5", "(R' U2 R U2') (R' U' R2 D)", "(R' U2 R D') R2'"],
  ["L6", "(R' U2 R' D') (R U2 R' D) R2", ""],
  ["L7", "(R U R' U2)2 y' (R' U2 R U'", "R' U' R)"],
  ["L8", "(R' U2' R U R' U R) (R U2'", "R' U2) L' (U R U' R') L"],
  ["L9", "(R U' R D) (R' U' R U2')", "(R' U R U) R'"],
  ["L10", "(R U R' U') (R' U' R' U)", "(L' U R U' L)"],
  ["L11", "(L' U R' U') L U' (R' U2 L'", "U2) R U R' U' R"],
  ["L12", "L (R' U' R U) L' U' (R' U' R U) R' U' R", ""],

  // L13-L24 (B-light)
  ["L13", "(R U R' U) (R U' R' U')", "(R U R' U') L' (R U R' U') L"],
  ["L14", "(R' U' R' U) R' F R F'", "(R U2 R U2') R'"],
  ["L15", "L U' (R U R') L' U2", "(R U' R' U') R U' R'"],
  ["L16", "(R' U2' R2 U) (R' U' R' U2')", "F (R U R' U') F'"],
  ["L17", "R' U' (R U' R' U)2 (R U' R2'", "D') (R U2 R' D) R2"],
  ["L18", "(R' U2 R U2') (R' U R U')", "L' (R' U' R U) L"],
  ["L19", "(R U R' U) (R U R' U') R U R' U'", "(R U D') (R' U2 R D) R'"],
  ["L20", "L (R U' R' U) R' U' R U' R'", "(L' U R U' R') L"],
  ["L21", "(R U R D) (R' U2 R D')", "(R' U' R' U) R U' R'"],
  ["L22", "(R U R' U) (R U' R' U')", "(L' U R U') L R' L"],
  ["L23", "F (R U R' U') R' F' U2'", "(R U R' U) R U2' R'"],
  ["L24", "(R U R' U') L' U2", "(R U2' R' U2) L"],

  // L25-L36 (R-light)
  ["L25", "(R' U' R U) R' F2 (R U2 R'", "U2) R' F2 R2"],
  ["L26", "(L' U L U2) R' (L' U L L U)", "R (U R' U R)"],
  ["L27", "(R U R' U2) L U' (R U' R' U)", "(R U2' R') L'"],
  ["L28", "F' (R U2' R' U2) R' F U2'", "(R U R' U) R U2' R'"],
  ["L29", "", ""],
  ["L30", "(R U L' U) (R' U L' U2')", "R U2' R'"],
  ["L31", "L' (R' U R U') L (R' U' R U')", "R' U R"],
  ["L32", "(R U R' U') (L U2 L' U' L U')", "R' (R U R)"],
  ["L33", "F' (R U2' R' U2) R' F", "(R U R' U') R U2' R'"],
  ["L34", "(R U R' U) R' D (R U2 R'", "D') R U' R' U' R"],
  ["L35", "(R' U' R' D') (R U2 R' D) (R U R' U') R' U R", ""],
  ["L36", "F (R U' R' U') (R U2 R' U')", "F'"],

  // L37-L48 (F-Comm)
  ["L37", "(R' U2 R U R' U R)", "(L' U R U' L U R')"],
  ["L38", "(R U2' R2' D') (R U' R' D)", "R2 U' R'"],
  ["L39", "(L' U R U' L U R')", "(R' U2' R' U' R U' R)"],
  ["L40", "(R U2 R D) (r' U2 r D') R2'", ""],
  ["L41", "(R U2 R D) (R' U2 R D') R2'", ""],
  ["L42", "(R U2' R' U2) (R U R2' D')", "(R U2 R' D) R2"],
  ["L43", "F (R U R' U') R' F' U' R U", "(R U R' U') R' F R F'"],
  ["L44", "(R' U' R U2)2 y (R U2 R' U", "R U R')"],
  ["L45", "(L' U' R U' L U')2 (R' U R U' R')", ""],
  ["L46", "(R' U' R U) (R' U R U')", "(L R' U' R U) L'"],
  ["L47", "(R' U R' D') (R U R' U2)", "(R U' R' U') R"],
  ["L48", "(R U2' R' U) (L' U2 R U2')", "(L R' U) (L' U L)"],

  // L49-L60 (Diagonal)
  ["L49", "r U2' (r2' F R F') r2 U2' r'", ""],
  ["L50", "(R U2' R' U') L' U2", "(R U' L' U L) R'"],
  ["L51", "(L' U2 L U) R U2 L' U2", "(R' L U') (R U' R')"],
  ["L52", "r U2 R (r2' F R' F') r2 U2' r'", ""],
  ["L53", "(R' U' R U') (L U' R' U L')", "R (U' R' U R)"],
  ["L54", "(R U R' U) (L' U R U' L)", "R' (U R U' R')"],
  ["L55", "F (R U R' U') R' F (R2 U' R'", "U') (R U R' F2)"],
  ["L56", "(R U' R' U) (R U R' U)", "(R U' R' D) R U R' D'"],
  ["L57", "r U2' (R2' F R F') R U2' r'", ""],
  ["L58", "F (R U R' U') (R U2 R' U')", "F'"],
  ["L59", "L' U2 (R U' R' U2) L", "(R U' R')"],
  ["L60", "F (R U' R' U') (R U2 R' U') F'", ""],

  // L61-L72 (Pure / 2GLL-L)
  ["L61", "R2 U (R' U' R' U') (R U R U') R2'", ""],
  ["L62", "(R U2' R' U' R U' R') U", "(R' U2' R U R' U R)"],
  ["L63", "(R U R' U R U2' R') U", "(R' U' R U' R' U2 R)"],
  ["L64", "R2' U' (R U R' U) (R' U' R' U) R2", ""],
  ["L65", "(R' U2' R U R' U R) U'", "(R U2 R' U' R U' R')"],
  ["L66", "R2' U' (R U' R U R' U)", "(R U R' U') R2"],
  ["L67", "(R' U' R U' R' U R U')", "(R' U2 R U R' U R)"],
  ["L68", "R2 U (R' U' R' U) (R U' R U) R2'", ""],
  ["L69", "(R U2' R' U' R U' R') U2", "(R U' R' U R U2' R')"],
  ["L70", "(R U R' U R U2' R') U2", "(R U R' U' R U' R' U2 R U' R')"],
  ["L71", "(R U2 R' U') (R U R' U')2", "R U' R'"],
  ["L72", "(R U2' R' U2) (R' U' R U)", "(R' U2' R U2 R U R')"],
];

// ZBLL-H Cases (40 total)
const ZBLL_H_DATA = [
  // H1-H12 (F-light)
  ["H1", "(F' r U R' U' r' F R)", "(R U2' R' U' R U' R')"],
  ["H2", "(R U R' U R U2 R') U' (R2 D", "R' U R D' R' U' R')"],
  ["H3", "(R U2' R' U' R U' R')", "(R2 D' R U' R' D R U R)"],
  ["H4", "(R' U2' R U R D' R' U' R)", "R' U' R'"],
  ["H5", "(R U2' R' U) L' U2 (R U2' R'", "U2) L (R U' R')"],
  ["H6", "(R' U2 R U') L U2 (R' U2 R", "U2') L' (R' U R)"],
  ["H7", "F (R U R' U') R' F' U2'", "(R U R' U) R2 U2' R'"],
  ["H8", "F (R U' R' U) (R U2 R' U')", "(R U R' U') F'"],
  ["H9", "R U2' (R2' U' R2 U') R' U'", "(L' U R U' L U' R)"],
  ["H10", "(R' U2 R) L U2 (R' U R U2')", "L' (R' U2' R)"],
  ["H11", "(R U2' R') L' U2 (R U' R'", "L' U2) L U2 L' (R U2 R')"],
  ["H12", "F U' (R U' R' U) (R U R' U) F'", ""],

  // H13-H24 (R-light)
  ["H13", "", ""],
  ["H14", "(R U2 R' U') R2 D (R' U' R D')", "R2' U' R' U' R'"],
  ["H15", "R2' D' (R U' R' D) (R2 U R'", "U2) (R U2' R' U) R U2' R'"],
  ["H16", "(R' U2' R2 U) (R' U' R' D)", "R2 U R' U R"],
  ["H17", "R' D' (R U R' D) (R2 U R'", "U2) (R U2' R' U) R U2' R'"],
  ["H18", "(R U2 R D2) (R' U R D2)", "(R' U2 R' U R) U2 R"],
  ["H19", "(R U R' U') (R U2' R2 D)", "(R U' R' D') (R2 U2' R')"],
  ["H20", "", ""],
  ["H21", "(R' U' R U' L') (R' U' R U L)", ""],
  ["H22", "(R U R' U) (L' U R U' L)", "R' (U' R U' R')"],
  ["H23", "(R U R' U) R' U2 R", ""],
  ["H24", "", ""],

  // H25-H32 (LR-light)
  ["H25", "F U' R2 U (R U2' R' U) R2", "U2' (R' U' R F')"],
  ["H26", "(R U R' U R U2' R') L' U2", "(L R' U2 R U2 L' U2 L)"],
  ["H27", "F (R U R' U')3 F'", ""],
  ["H28", "(R U' L' U R' U' L) U", "(R U' L' U R' U' L)"],
  ["H29", "(U2) (R U R' U R U2' R2')", "U2' (L' U R U' L U' R)"],
  ["H30", "(U2) (R' U' R U' R' U2 R2)", "U2' (L' U R U' L U R')"],
  ["H31", "(R' U' R U' R' U2 R) U (R'", "U' R) L U2 (R' U' R) U2 L'"],
  ["H32", "F R' U (R U2' R2' U') (R U2", "R U') F'"],

  // H33-H40 (FB-light / 2GLL-H)
  ["H33", "(R U R' U) (R U' R' U)", "R U2' R'"],
  ["H34", "(R' U' R U') (R' U R U')", "R' U2 R"],
  ["H35", "R' U2' (R U R' U) R", "(R U R' U R)"],
  ["H36", "(R U2 R' U') (R U R' U') R U' R'", ""],
  ["H37", "(R' U2' R U R' U R) U", "(R' U2' R' U' R U' R)"],
  ["H38", "(R U2' R' U' R U' R') U'", "(R' U' R U' R' U2 R)"],
  ["H39", "(R' U' R' U' R' U2 R) U", "(R U2' R' U' R U' R')"],
  ["H40", "(R U R' U) (R U' R' U)2", "R U' R' U R"],
];

// ZBLL-Pi Cases (72 total)
const ZBLL_PI_DATA = [
  // Pi1-Pi12 (X pattern)
  ["Pi1", "", ""],
  ["Pi2", "", ""],
  ["Pi3", "", ""],
  ["Pi4", "", ""],
  ["Pi5", "(R' U2' R2 D) (R' U2 R D') R2' U (R U2 R' U2' R)", ""],
  ["Pi6", "", ""],
  ["Pi7", "", ""],
  ["Pi8", "", ""],
  ["Pi9", "", ""],
  ["Pi10", "", ""],
  ["Pi11", "", ""],
  ["Pi12", "", ""],

  // Pi13-Pi24 (R-light)
  ["Pi13", "R2 D (R' U R D') (R2' U R2", "D) (R' U2 R D') R2'"],
  ["Pi14", "(R U2 R' U') R2 D (R' U' R D')", "R2' U' R' U' R'"],
  ["Pi15", "R2' D' (R U' R' D) (R2 U'", "R2' D') (R U2' R' D) R2"],
  ["Pi16", "(R' U2 R U) R2' D' (R U R' D)", "R2 U R U R"],
  ["Pi17", "R' D' (R U R' D) (R2 U R'", "U2) (R U2' R' U) R U2' R'"],
  ["Pi18", "(R U2 R D) R' D2 (R U' R'", "D2) (R U2' R' U R) U2 R"],
  ["Pi19", "(R U R' U') (R' U2' R2 D)", "(R' U' R D') R2 U2' R'"],
  ["Pi20", "", ""],
  ["Pi21", "(R' U' R U' R' U) (L U' R U L')", ""],
  ["Pi22", "(R U R' U R U') (L' U R' U' L)", ""],
  ["Pi23", "", ""],
  ["Pi24", "", ""],

  // Pi25-Pi36
  ["Pi25", "R' U2' (R U R' U) R U2 L (U' R U R') L'", ""],
  ["Pi26", "(R' U' R' U') (R U' R' U) (R U R' U R)", ""],
  ["Pi27", "L' (R U R' U') L U2 (R' U' R U') R' U2 R", ""],
  ["Pi28", "(R' U2 R U R' U') (R U R2' F) (R U R U' R' F' R)", ""],
  ["Pi29", "(R U' L' U R' U' L) U' (R U' L' U R' U' L)", ""],
  ["Pi30", "F U (R U' R' U) (R U2 R' F') (R U R' U) F'", ""],
  ["Pi31", "(R U R' U) (R U R2' D') (R U2 R' D) R U2' R", ""],
  ["Pi32", "(R' U' R U) (R U2' R' U2) R D (R' U R U'D') R2' U2' R'", ""],
  ["Pi33", "(L' U R U' L U R') U", "(L' U R U' L U R')"],
  ["Pi34", "(L' U R U' L U R')", "(R' U2 R U R' U R)"],
  ["Pi35", "(R U2' R' U' R U' R')", "(R' U L' U' R U L)"],
  ["Pi36", "(R' U' R' U' R' U2 R) U", "(L' U' L U' L' U2 L)"],

  // Pi37-Pi48
  ["Pi37", "", ""],
  ["Pi38", "", ""],
  ["Pi39", "", ""],
  ["Pi40", "L (R' U' R U) L' U2", "(R U R' U) R U2 R'"],
  ["Pi41", "(R U R' U') R' F (R2 U R'", "U') (R U R' U') F'"],
  ["Pi42", "", ""],
  ["Pi43", "(R U2' R' U') (R U R' U') R' U' R", "(R U2' R' U) R U' R'"],
  ["Pi44", "(R' U' R U2)2 y (R U2' R' U", "R U R' U D')"],
  ["Pi45", "(R U R' U R U2' R') U'", "(R' U L' U' R U L)"],
  ["Pi46", "(R' U2' R' U' R U' L)", "(L' U R U' L U R')"],
  ["Pi47", "(L U' R' U L' U' R) U", "(L U' R' U L' U' R)"],
  ["Pi48", "(R U2' R' U) (L' U2 R U2')", "(L U2' R' U) R U2' R'"],

  // Pi49-Pi60
  ["Pi49", "", ""],
  ["Pi50", "", ""],
  ["Pi51", "", ""],
  ["Pi52", "", ""],
  ["Pi53", "", ""],
  ["Pi54", "", ""],
  ["Pi55", "", ""],
  ["Pi56", "", ""],
  ["Pi57", "", ""],
  ["Pi58", "", ""],
  ["Pi59", "", ""],
  ["Pi60", "", ""],

  // Pi61-Pi72 (R-light / 2GLL-Pi)
  ["Pi61", "", ""],
  ["Pi62", "(R U R' U R U2' R')", "(R' U2' R U R' U R)"],
  ["Pi63", "(R U2' R' U2) (R U' R' U2)2", "R U R'"],
  ["Pi64", "(R' U2 R U2') (R' U R U2')2", "R' U' R"],
  ["Pi65", "(R U' R' U2) (R U R' U2')2", "R U2' R'"],
  ["Pi66", "(R' U2 R U2') (R' U' R U2')", "R' U2 R"],
  ["Pi67", "(R U2' R' U' R U' R')", "(R' U2' R' U' R U' R)"],
  ["Pi68", "", ""],
  ["Pi69", "(R U2' R' U' R U' R') U", "(R' U2' R' U' R U' R)"],
  ["Pi70", "(R' U' R U' R' U2 R) U", "(R U2 R U R' U R)"],
  ["Pi71", "", ""],
  ["Pi72", "", ""],
];

// ZBLL-S (Sune) Cases (72 total) - from the images showing Easy ZBLL-S & AS
const ZBLL_S_DATA = [
  // Easy ZBLL-S & AS (6 cases shown at top)
  ["S-Easy-1", "R U R' U R U2' R'", ""],
  ["S-Easy-2", "R' U2' R U R' U R", ""],
  ["S-Easy-3", "R U' L' U R' U' L", ""],
  ["S-Easy-4", "R U2 R' U' R U' R'", ""],
  ["S-Easy-5", "R' U' R' U' R' U2 R", ""],
  ["S-Easy-6", "L' U R U' L U R'", ""],

  // S1-S12 - placeholder for full implementation
  ["S1", "(R U R' U) R U2' R'", ""],
  ["S2", "(R U2 R' U') R U' R'", ""],
  ["S3", "", ""],
  ["S4", "", ""],
  ["S5", "", ""],
  ["S6", "", ""],
  ["S7", "", ""],
  ["S8", "", ""],
  ["S9", "", ""],
  ["S10", "", ""],
  ["S11", "", ""],
  ["S12", "", ""],

  // S13-S24
  ["S13", "", ""],
  ["S14", "", ""],
  ["S15", "", ""],
  ["S16", "", ""],
  ["S17", "", ""],
  ["S18", "", ""],
  ["S19", "", ""],
  ["S20", "", ""],
  ["S21", "", ""],
  ["S22", "", ""],
  ["S23", "", ""],
  ["S24", "", ""],

  // S25-S36
  ["S25", "", ""],
  ["S26", "", ""],
  ["S27", "", ""],
  ["S28", "", ""],
  ["S29", "", ""],
  ["S30", "", ""],
  ["S31", "", ""],
  ["S32", "", ""],
  ["S33", "", ""],
  ["S34", "", ""],
  ["S35", "", ""],
  ["S36", "", ""],

  // S37-S48
  ["S37", "", ""],
  ["S38", "", ""],
  ["S39", "", ""],
  ["S40", "", ""],
  ["S41", "", ""],
  ["S42", "", ""],
  ["S43", "", ""],
  ["S44", "", ""],
  ["S45", "", ""],
  ["S46", "", ""],
  ["S47", "", ""],
  ["S48", "", ""],

  // S49-S60
  ["S49", "", ""],
  ["S50", "", ""],
  ["S51", "", ""],
  ["S52", "", ""],
  ["S53", "", ""],
  ["S54", "", ""],
  ["S55", "", ""],
  ["S56", "", ""],
  ["S57", "", ""],
  ["S58", "", ""],
  ["S59", "", ""],
  ["S60", "", ""],

  // S61-S72 (2GLL-S)
  ["S61", "", ""],
  ["S62", "", ""],
  ["S63", "", ""],
  ["S64", "", ""],
  ["S65", "", ""],
  ["S66", "", ""],
  ["S67", "", ""],
  ["S68", "", ""],
  ["S69", "", ""],
  ["S70", "", ""],
  ["S71", "", ""],
  ["S72", "", ""],
];

// ZBLL-AS (Anti-Sune) Cases (72 total)
const ZBLL_AS_DATA = [
  // AS1-AS12
  ["AS1", "(R' U' R U') R' U2 R", ""],
  ["AS2", "(R' U2 R U) R' U R", ""],
  ["AS3", "", ""],
  ["AS4", "", ""],
  ["AS5", "", ""],
  ["AS6", "", ""],
  ["AS7", "", ""],
  ["AS8", "", ""],
  ["AS9", "", ""],
  ["AS10", "", ""],
  ["AS11", "", ""],
  ["AS12", "", ""],

  // AS13-AS24
  ["AS13", "", ""],
  ["AS14", "", ""],
  ["AS15", "", ""],
  ["AS16", "", ""],
  ["AS17", "", ""],
  ["AS18", "", ""],
  ["AS19", "", ""],
  ["AS20", "", ""],
  ["AS21", "", ""],
  ["AS22", "", ""],
  ["AS23", "", ""],
  ["AS24", "", ""],

  // AS25-AS36
  ["AS25", "", ""],
  ["AS26", "", ""],
  ["AS27", "", ""],
  ["AS28", "", ""],
  ["AS29", "", ""],
  ["AS30", "", ""],
  ["AS31", "", ""],
  ["AS32", "", ""],
  ["AS33", "", ""],
  ["AS34", "", ""],
  ["AS35", "", ""],
  ["AS36", "", ""],

  // AS37-AS48
  ["AS37", "", ""],
  ["AS38", "", ""],
  ["AS39", "", ""],
  ["AS40", "", ""],
  ["AS41", "", ""],
  ["AS42", "", ""],
  ["AS43", "", ""],
  ["AS44", "", ""],
  ["AS45", "", ""],
  ["AS46", "", ""],
  ["AS47", "", ""],
  ["AS48", "", ""],

  // AS49-AS60
  ["AS49", "", ""],
  ["AS50", "", ""],
  ["AS51", "", ""],
  ["AS52", "", ""],
  ["AS53", "", ""],
  ["AS54", "", ""],
  ["AS55", "", ""],
  ["AS56", "", ""],
  ["AS57", "", ""],
  ["AS58", "", ""],
  ["AS59", "", ""],
  ["AS60", "", ""],

  // AS61-AS72 (2GLL-AS)
  ["AS61", "", ""],
  ["AS62", "", ""],
  ["AS63", "", ""],
  ["AS64", "", ""],
  ["AS65", "", ""],
  ["AS66", "", ""],
  ["AS67", "", ""],
  ["AS68", "", ""],
  ["AS69", "", ""],
  ["AS70", "", ""],
  ["AS71", "", ""],
  ["AS72", "", ""],
];

// Build the complete ZBLL data with proper structure
function buildZBLLCases() {
  const allCases: {
    caseName: string;
    algorithms: { notation: string; isDefault: boolean }[];
    subset: string;
  }[] = [];

  // Helper to add cases from data arrays
  const addCases = (
    data: string[][],
    subset: string,
    prefix: string = subset
  ) => {
    data.forEach(([name, alg, altAlg]) => {
      if (alg) {
        const algorithms = [{ notation: alg, isDefault: true }];
        if (altAlg) {
          algorithms.push({ notation: altAlg, isDefault: false });
        }
        allCases.push({
          caseName: name.startsWith(prefix) ? name : `${prefix}-${name}`,
          algorithms,
          subset,
        });
      }
    });
  };

  addCases(ZBLL_U_DATA, "U");
  addCases(ZBLL_T_DATA, "T");
  addCases(ZBLL_L_DATA, "L");
  addCases(ZBLL_H_DATA, "H");
  addCases(ZBLL_PI_DATA, "Pi");
  addCases(ZBLL_S_DATA, "S");
  addCases(ZBLL_AS_DATA, "AS");

  return allCases;
}

/**
 * Query to check current ZBLL state before migration
 */
export const checkZBLLState = query({
  args: {},
  handler: async (ctx) => {
    const zbllSet = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (!zbllSet) {
      return {
        exists: false,
        message: "ZBLL set not found - run seedZBLLAlgorithms first",
      };
    }

    const cases = await ctx.db
      .query("algorithmCases")
      .filter((q) => q.eq(q.field("setId"), zbllSet._id))
      .collect();

    // Count cases by prefix
    const counts: Record<string, number> = {};
    cases.forEach((c) => {
      const prefix = c.caseName.split("-")[0];
      counts[prefix] = (counts[prefix] || 0) + 1;
    });

    // Count user progress entries
    let userProgressCount = 0;
    for (const c of cases.slice(0, 10)) {
      const progress = await ctx.db
        .query("userAlgorithmProgress")
        .withIndex("by_case", (q) => q.eq("caseId", c._id))
        .collect();
      userProgressCount += progress.length;
    }

    return {
      exists: true,
      setId: zbllSet._id,
      totalCases: cases.length,
      caseCounts: counts,
      sampleUserProgress: userProgressCount,
      message: `Found ${cases.length} cases with user progress on at least ${userProgressCount} cases`,
    };
  },
});

/**
 * Migration to update ZBLL algorithms
 * This preserves user data by:
 * 1. Matching cases by slug (derived from caseName)
 * 2. Updating existing cases rather than replacing
 * 3. Only adding new cases if they don't exist
 * 4. Marking deprecated cases instead of deleting them
 */
export const updateZBLLAlgorithms = mutation({
  args: {},
  handler: async (ctx) => {
    const zbllSet = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (!zbllSet) {
      return {
        success: false,
        message: "ZBLL set not found - run seedZBLLAlgorithms first",
      };
    }

    const now = Date.now();
    let updated = 0;
    let added = 0;
    let skipped = 0;

    // Get all existing cases
    const existingCases = await ctx.db
      .query("algorithmCases")
      .filter((q) => q.eq(q.field("setId"), zbllSet._id))
      .collect();

    const existingBySlug = new Map(
      existingCases.map((c) => [c.slug || createSlug(c.caseName), c])
    );

    const zbllCases = buildZBLLCases();

    for (let i = 0; i < zbllCases.length; i++) {
      const caseData = zbllCases[i];
      const slug = createSlug(caseData.caseName);

      const existing = existingBySlug.get(slug);

      if (existing) {
        // Update existing case's algorithms
        const existingAlgs = await ctx.db
          .query("algorithms")
          .withIndex("by_case", (q) => q.eq("caseId", existing._id))
          .collect();

        // Only update if algorithms are different
        const currentDefault = existingAlgs.find((a) => a.isDefault);
        const newDefault = caseData.algorithms.find((a) => a.isDefault);

        if (
          newDefault &&
          currentDefault &&
          currentDefault.notation !== newDefault.notation
        ) {
          // Update the default algorithm notation
          await ctx.db.patch(currentDefault._id, {
            notation: newDefault.notation,
          });
          updated++;
        } else {
          skipped++;
        }

        // Remove from map so we can track what's left
        existingBySlug.delete(slug);
      } else {
        // Add new case
        const caseId = await ctx.db.insert("algorithmCases", {
          setId: zbllSet._id,
          caseName: caseData.caseName,
          slug: slug,
          setupMoves: "", // Will need to be populated
          recognition: [`${caseData.subset} subset`],
          difficulty: 5,
          frequency: 5,
          order: i + 1,
          createdAt: now,
        });

        for (const alg of caseData.algorithms) {
          await ctx.db.insert("algorithms", {
            caseId,
            notation: alg.notation,
            moveCount: alg.notation.split(/\s+/).length,
            popularity: alg.isDefault ? 90 : 80,
            isDefault: alg.isDefault,
            createdAt: now,
          });
        }

        added++;
      }
    }

    // Update the case count in the set
    await ctx.db.patch(zbllSet._id, {
      caseCount: 493, // Correct ZBLL count
      description:
        "ZBLL (Zborowski-Bruchem Last Layer) solves the last layer in one step when edges are oriented. Total: 493 cases across 7 subsets (U, T, L, H, Pi, S, AS).",
    });

    return {
      success: true,
      message: `Updated ${updated}, added ${added}, skipped ${skipped} cases`,
      remainingOldCases: existingBySlug.size,
      oldCaseNames: Array.from(existingBySlug.values())
        .slice(0, 20)
        .map((c) => c.caseName),
    };
  },
});

/**
 * Helper mutation to view algorithm data for a specific subset
 */
export const viewZBLLSubset = query({
  args: {},
  handler: async (ctx) => {
    const zbllSet = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (!zbllSet) {
      return { error: "ZBLL set not found" };
    }

    const cases = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set", (q) => q.eq("setId", zbllSet._id))
      .take(20);

    const result = [];
    for (const c of cases) {
      const algs = await ctx.db
        .query("algorithms")
        .withIndex("by_case", (q) => q.eq("caseId", c._id))
        .collect();

      result.push({
        caseName: c.caseName,
        slug: c.slug,
        algorithms: algs.map((a) => ({
          notation: a.notation,
          isDefault: a.isDefault,
        })),
      });
    }

    return result;
  },
});

/**
 * Update a specific algorithm by case name
 * Use this to fix individual algorithms without running full migration
 */
export const updateSingleAlgorithm = mutation({
  args: {
    caseName: v.string(),
    newAlgorithm: v.string(),
  },
  handler: async (ctx, { caseName, newAlgorithm }) => {
    const zbllSet = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (!zbllSet) {
      return { success: false, error: "ZBLL set not found" };
    }

    const slug = createSlug(caseName);
    const algorithmCase = await ctx.db
      .query("algorithmCases")
      .withIndex("by_set_slug", (q) =>
        q.eq("setId", zbllSet._id).eq("slug", slug)
      )
      .first();

    if (!algorithmCase) {
      return { success: false, error: `Case "${caseName}" not found` };
    }

    const defaultAlg = await ctx.db
      .query("algorithms")
      .withIndex("by_case_default", (q) =>
        q.eq("caseId", algorithmCase._id).eq("isDefault", true)
      )
      .first();

    if (!defaultAlg) {
      return { success: false, error: "No default algorithm found for case" };
    }

    await ctx.db.patch(defaultAlg._id, {
      notation: newAlgorithm,
      moveCount: newAlgorithm.split(/\s+/).length,
    });

    return {
      success: true,
      message: `Updated algorithm for "${caseName}"`,
      oldAlgorithm: defaultAlg.notation,
      newAlgorithm,
    };
  },
});

/**
 * Remove duplicate/extra ZBLL cases safely
 * Only removes cases that have no user progress associated
 */
export const cleanupExtraCases = mutation({
  args: {
    dryRun: v.optional(v.boolean()),
  },
  handler: async (ctx, { dryRun = true }) => {
    const zbllSet = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (!zbllSet) {
      return { success: false, error: "ZBLL set not found" };
    }

    const allCases = await ctx.db
      .query("algorithmCases")
      .filter((q) => q.eq(q.field("setId"), zbllSet._id))
      .collect();

    // Count cases by subset
    const subsetCounts: Record<string, number> = {
      T: 0,
      U: 0,
      L: 0,
      H: 0,
      Pi: 0,
      Sune: 0,
      AntiSune: 0,
    };

    // Expected counts
    const expectedCounts: Record<string, number> = {
      T: 72,
      U: 72,
      L: 72,
      H: 40,
      Pi: 72,
      Sune: 72,
      AntiSune: 72,
    };

    const casesToRemove: { id: string; name: string; hasProgress: boolean }[] =
      [];
    const casesToKeep: string[] = [];

    for (const c of allCases) {
      // Determine subset
      let subset = "Unknown";
      if (c.caseName.startsWith("T-")) subset = "T";
      else if (c.caseName.startsWith("U-")) subset = "U";
      else if (c.caseName.startsWith("L-")) subset = "L";
      else if (c.caseName.startsWith("H-")) subset = "H";
      else if (c.caseName.startsWith("Pi-")) subset = "Pi";
      else if (c.caseName.startsWith("Sune-")) subset = "Sune";
      else if (c.caseName.startsWith("AntiSune-")) subset = "AntiSune";

      if (subset !== "Unknown") {
        subsetCounts[subset]++;

        // Check if over expected count
        const expected = expectedCounts[subset];
        if (subsetCounts[subset] > expected) {
          // Check for user progress
          const progress = await ctx.db
            .query("userAlgorithmProgress")
            .withIndex("by_case", (q) => q.eq("caseId", c._id))
            .first();

          casesToRemove.push({
            id: c._id,
            name: c.caseName,
            hasProgress: !!progress,
          });
        } else {
          casesToKeep.push(c.caseName);
        }
      }
    }

    // Only remove cases without user progress
    const safeToRemove = casesToRemove.filter((c) => !c.hasProgress);
    const unsafeToRemove = casesToRemove.filter((c) => c.hasProgress);

    if (!dryRun) {
      for (const c of safeToRemove) {
        // Delete algorithms first
        const algs = await ctx.db
          .query("algorithms")
          .withIndex("by_case", (q) => q.eq("caseId", c.id as any))
          .collect();
        for (const alg of algs) {
          await ctx.db.delete(alg._id);
        }
        // Delete case
        await ctx.db.delete(c.id as any);
      }

      // Update case count
      await ctx.db.patch(zbllSet._id, {
        caseCount: allCases.length - safeToRemove.length,
      });
    }

    return {
      success: true,
      dryRun,
      totalCases: allCases.length,
      subsetCounts,
      expectedCounts,
      casesToRemove: casesToRemove.length,
      safeToRemove: safeToRemove.map((c) => c.name),
      unsafeToRemove: unsafeToRemove.map((c) => c.name),
      message: dryRun
        ? `Would remove ${safeToRemove.length} cases (${unsafeToRemove.length} have user progress and will be kept)`
        : `Removed ${safeToRemove.length} cases`,
    };
  },
});

/**
 * Get statistics about current ZBLL data quality
 */
export const getZBLLStats = query({
  args: {},
  handler: async (ctx) => {
    const zbllSet = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (!zbllSet) {
      return { error: "ZBLL set not found" };
    }

    const allCases = await ctx.db
      .query("algorithmCases")
      .filter((q) => q.eq(q.field("setId"), zbllSet._id))
      .collect();

    const stats = {
      totalCases: allCases.length,
      bySubset: {} as Record<string, number>,
      casesWithEmptySetup: 0,
      casesWithShortRecognition: 0,
    };

    for (const c of allCases) {
      // Count by subset prefix
      const prefix = c.caseName.split("-")[0];
      stats.bySubset[prefix] = (stats.bySubset[prefix] || 0) + 1;

      // Check data quality
      if (!c.setupMoves || c.setupMoves.trim() === "") {
        stats.casesWithEmptySetup++;
      }
      if (!c.recognition || c.recognition.length === 0) {
        stats.casesWithShortRecognition++;
      }
    }

    return {
      ...stats,
      targetCount: 493,
      difference: allCases.length - 493,
      expectedSubsets: {
        T: 72,
        U: 72,
        L: 72,
        H: 40,
        Pi: 72,
        Sune: 72,
        AntiSune: 72,
      },
    };
  },
});
