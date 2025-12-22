import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Helper function to create URL-friendly slugs
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "")
    .replace(/--+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");
}

// This mutation seeds the database with ZBLL (Zborowski-Bruchem Last Layer) algorithms
export const seedZBLLAlgorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "ZBLL"))
      .first();

    if (existing) {
      return { message: "ZBLL algorithms already seeded" };
    }

    const now = Date.now();

    // Create ZBLL set
    const zbllSetId = await ctx.db.insert("algorithmSets", {
      name: "ZBLL",
      slug: "zbll",
      category: "Last Layer",
      description:
        "ZBLL (Zborowski-Bruchem Last Layer) is a collection of algorithms used to solve the last layer of the Rubik's Cube in one step, after orienting the last layer (OLL). It consists of 505 algorithms that cover all possible permutations of the last layer pieces while keeping their orientation intact.",
      caseCount: 505,
      difficulty: "advanced",
      puzzleType: "3x3x3",
      order: 4,
      isPublished: true,
      createdAt: now,
    });

    // ZBLL Cases and Algorithms - T Set (72 cases)
    // T set has the T-shaped OLL (corners twisted in a T pattern)
    const zbllData = [
      // T Set - Solved Corners (EPLL subset - 4 cases)
      {
        caseName: "T-EPLL-Ua",
        setupMoves: "R U' R U R U R U' R' U' R2",
        recognition: ["T OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R U' R U R U R U' R' U' R2",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "R2 U' R' U' R U R U R U' R",
            moveCount: 11,
            popularity: 85,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "T-EPLL-Ub",
        setupMoves: "R2 U R U R' U' R' U' R' U R'",
        recognition: ["T OLL shape", "Ub perm - 3-cycle counter-clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R2 U R U R' U' R' U' R' U R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "R' U R' U' R' U' R' U R U R2",
            moveCount: 11,
            popularity: 85,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "T-EPLL-Z",
        setupMoves: "M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["T OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U M' U2 M2 U2 M'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R' U' R U' R U R U' R' U R U R2 U' R'",
            moveCount: 14,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "T-EPLL-H",
        setupMoves: "M2 U M2 U2 M2 U M2",
        recognition: ["T OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U2 M2 U M2",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
          {
            notation: "R2 U2 R U2 R2 U2 R2 U2 R U2 R2",
            moveCount: 11,
            popularity: 70,
            isDefault: false,
          },
        ],
      },

      // T Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "T-AS-1",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: [
          "T OLL shape",
          "Adjacent swap",
          "Headlights left, bar back",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-2",
        setupMoves: "R' U' R U R B' R2 U R U R' U' R B",
        recognition: [
          "T OLL shape",
          "Adjacent swap",
          "Headlights right, bar back",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U R B' R2 U R U R' U' R B",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-3",
        setupMoves: "R U2 R' U' R U R' U2 R' F R F'",
        recognition: ["T OLL shape", "Adjacent swap", "Checker pattern left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 R' F R F'",
            moveCount: 12,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-4",
        setupMoves: "R' U2 R U R' U' R U2 R B' R' B",
        recognition: ["T OLL shape", "Adjacent swap", "Checker pattern right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U2 R B' R' B",
            moveCount: 12,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-5",
        setupMoves: "R U R' U R U' R' U R U2 R' U' R U' R' U R U R'",
        recognition: ["T OLL shape", "Adjacent swap", "3-move setup"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F U R U' R' U R U' R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-6",
        setupMoves: "R' F R F' R U' R' U' R U R' U R U2 R'",
        recognition: ["T OLL shape", "Adjacent swap", "Twisted front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F R U R' U' R U R' U' F'",
            moveCount: 17,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-7",
        setupMoves: "R' U' R U R' U R U' R' U2 R U R' U R",
        recognition: ["T OLL shape", "Adjacent swap", "Bar front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U' R U R' U' R' F R F'",
            moveCount: 16,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-8",
        setupMoves: "R U R' U' R' F R F' R U2 R' U' R U' R'",
        recognition: ["T OLL shape", "Adjacent swap", "Front-left headlight"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U' R' F R F'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-9",
        setupMoves: "R' U' F' U F R U' R' U' R U' R' U2 R",
        recognition: ["T OLL shape", "Adjacent swap", "Wide trigger pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U R F R U R' U' R U R' U' F'",
            moveCount: 17,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-10",
        setupMoves: "F R' F' R U R U' R' U' R U' R' U2 R U' R'",
        recognition: ["T OLL shape", "Adjacent swap", "Reverse wide trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U' R U R D R' U' R D' R' U2 R'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-11",
        setupMoves: "R U R' U' R U R' U' R U R' U2 R U' R'",
        recognition: ["T OLL shape", "Adjacent swap", "Triple sexy variant"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F R U' R' U' R U R' F'",
            moveCount: 16,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-12",
        setupMoves: "R' U' R U R' U' R U R' U' R U2 R' U R",
        recognition: ["T OLL shape", "Adjacent swap", "Inverse triple sexy"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' F R U R' U' F' U R U' R' U R U R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-13",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["T OLL shape", "Adjacent swap", "Sune combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R' F R F' R U2 R'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-14",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U R",
        recognition: ["T OLL shape", "Adjacent swap", "Anti-sune combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R B' R' B R' U2 R",
            moveCount: 14,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-15",
        setupMoves: "F R U R' U' R U R' U' F' R U R' U R U2 R'",
        recognition: ["T OLL shape", "Adjacent swap", "Front sledge setup"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' F' U F U' R U' R' U R U R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-16",
        setupMoves: "R' F R U R' U' F' U R U R' U' R U2 R'",
        recognition: ["T OLL shape", "Adjacent swap", "Back sledge setup"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 F' U F R U R'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-17",
        setupMoves: "R' U R U2 R' U' R U' R' U' R U R' U R",
        recognition: ["T OLL shape", "Adjacent swap", "Connected pattern left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F R U R' U' F' R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-AS-18",
        setupMoves: "R U' R' U2 R U R' U R U R' U' R U' R'",
        recognition: [
          "T OLL shape",
          "Adjacent swap",
          "Connected pattern right",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F' U' F R U R' U R U R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },

      // T Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "T-DS-1",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["T OLL shape", "Diagonal swap", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-2",
        setupMoves: "R U R' U' R' F R F' R' F R F' R U R' U' R' F R F'",
        recognition: ["T OLL shape", "Diagonal swap", "Double sledgehammer"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U' R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 17,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-3",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["T OLL shape", "Diagonal swap", "Wide r trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-4",
        setupMoves: "R' U' R U R' F' R U R' U' R' F R2 U' R' U R",
        recognition: ["T OLL shape", "Diagonal swap", "Extended sledge"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U R' F' R U R' U' R' F R2 U' R' U R",
            moveCount: 17,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-5",
        setupMoves: "R U R' U R U2 R' U' R U' L' U R' U' L",
        recognition: ["T OLL shape", "Diagonal swap", "J perm like"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U' R U' L' U R' U' L",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-6",
        setupMoves: "R' U' R U' R' U2 R U R' U L U' R U L'",
        recognition: ["T OLL shape", "Diagonal swap", "Mirror J perm like"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R U R' U L U' R U L'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-7",
        setupMoves: "R U R' U' R U R' U R U' R' U R U2 R' U' R U R'",
        recognition: ["T OLL shape", "Diagonal swap", "Long sexy chain"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U2 R U R'",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-8",
        setupMoves: "R' U' R U R' U' R U' R' U R U' R' U2 R",
        recognition: ["T OLL shape", "Diagonal swap", "Inverse sexy chain"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U2 R' U' R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-9",
        setupMoves: "F R' F' R U2 R U2 R' U' R U R' U' R U' R'",
        recognition: ["T OLL shape", "Diagonal swap", "F2L insert pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R' F R F' R U2 R'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-10",
        setupMoves: "R B R' B' U2 R' U2 R U R' U' R U R' U R",
        recognition: ["T OLL shape", "Diagonal swap", "Mirror F2L insert"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R B' R' B R' U2 R",
            moveCount: 14,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-11",
        setupMoves: "R U2 R' U' R U R' U' R U' R' U R U2 R'",
        recognition: ["T OLL shape", "Diagonal swap", "Double anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R2 U2 R U R' U R",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-12",
        setupMoves: "R' U2 R U R' U' R U R' U R U' R' U2 R",
        recognition: ["T OLL shape", "Diagonal swap", "Double sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R2 U2 R' U' R U' R'",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-13",
        setupMoves: "R U R' U R U' R' U R U' R' U R' F R F' R U' R'",
        recognition: ["T OLL shape", "Diagonal swap", "Inserted sledge"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R F' R U' R' U2 R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-14",
        setupMoves: "R' U' R U' R' U R U' R' U R U' R B' R' B R' U R",
        recognition: ["T OLL shape", "Diagonal swap", "Inserted hedge"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U R B' R' B R' U R U2 R' U' R",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-15",
        setupMoves: "F U R U' R' F' R U R' U R U2 R'",
        recognition: ["T OLL shape", "Diagonal swap", "Front OLL to sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F U R U' R' F'",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-16",
        setupMoves: "F' U' R' U R F R' U' R U' R' U2 R",
        recognition: ["T OLL shape", "Diagonal swap", "Back OLL to anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R F' U' R' U R F",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-17",
        setupMoves: "R U R' U' R U R' U' R U2 R' F R U R' U' F'",
        recognition: ["T OLL shape", "Diagonal swap", "Extended OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U2 R' U' R U R' U' R U' R'",
            moveCount: 17,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-DS-18",
        setupMoves: "R' U' R U R' U' R U R' U2 R F' R' U' R U F",
        recognition: ["T OLL shape", "Diagonal swap", "Mirror extended OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U2 R U R' U' R U R' U R",
            moveCount: 17,
            popularity: 70,
            isDefault: true,
          },
        ],
      },

      // T Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "T-OS-1",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["T OLL shape", "Opposite swap", "No bars visible"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R2 U R' U R U2 R'",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-2",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["T OLL shape", "Opposite swap", "Mirrored no bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R2 U' R U' R' U2 R",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-3",
        setupMoves: "R U R' U R U' R' U R' F R F' R U R' U' R U' R'",
        recognition: ["T OLL shape", "Opposite swap", "Bar on front"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R F' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-4",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U' R U R' U R",
        recognition: ["T OLL shape", "Opposite swap", "Bar on back"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U R B' R' B R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-5",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R'",
        recognition: ["T OLL shape", "Opposite swap", "Left headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U R' U' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-6",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R",
        recognition: ["T OLL shape", "Opposite swap", "Right headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U' R U R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-7",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: ["T OLL shape", "Opposite swap", "Two headlight pairs"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-8",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: [
          "T OLL shape",
          "Opposite swap",
          "Mirror two headlight pairs",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-9",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["T OLL shape", "Opposite swap", "Block on left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-10",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["T OLL shape", "Opposite swap", "Block on right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-11",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["T OLL shape", "Opposite swap", "OLL 33 like"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-12",
        setupMoves: "R U R' U' R' F R F' F R U' R' U' R U R' F'",
        recognition: ["T OLL shape", "Opposite swap", "Double OLL trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' R U R' U' F' U F R U' R'",
            moveCount: 18,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-13",
        setupMoves: "R U R' U R' F R F' R U2 R' U R U2 R'",
        recognition: [
          "T OLL shape",
          "Opposite swap",
          "Front bar, back checker",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U2 R' U' R' F R F' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-14",
        setupMoves: "R' U' R U' R B' R' B R' U2 R U' R' U2 R",
        recognition: [
          "T OLL shape",
          "Opposite swap",
          "Back bar, front checker",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U2 R U R B' R' B R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-15",
        setupMoves: "R U R' U' R U' R' F R U R' U' R U R' U' F'",
        recognition: ["T OLL shape", "Opposite swap", "Checker front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U' R' U R U R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-16",
        setupMoves: "R' U' R U R' U R F' R' U' R U R' U' R U F",
        recognition: ["T OLL shape", "Opposite swap", "Checker front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U R U' R' U' R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-17",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["T OLL shape", "Opposite swap", "All four checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-OS-18",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U' R U R' U R",
        recognition: [
          "T OLL shape",
          "Opposite swap",
          "Mirror all four checkers",
        ],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },

      // T Set - Solved Corners (CPLL Skip) - 18 cases
      {
        caseName: "T-Skip-1",
        setupMoves: "R U R' U' R U R' U' R U R' U' R U R'",
        recognition: ["T OLL shape", "Corners solved", "All edges wrong"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-2",
        setupMoves: "R' U' R U R' U' R U R' U' R U R' U' R",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "All edges wrong reverse",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-3",
        setupMoves: "R U R' U' R U R' U' R U2 R'",
        recognition: ["T OLL shape", "Corners solved", "Adjacent edges wrong"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-4",
        setupMoves: "R' U' R U R' U' R U R' U2 R",
        recognition: ["T OLL shape", "Corners solved", "Mirror adjacent edges"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-5",
        setupMoves: "R U R' U R U' R' U' R U' R' U R U R'",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Opposite edges wrong pair 1",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U' R' U R U R' U R U' R' U' R U R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-6",
        setupMoves: "R' U' R U' R' U R U R' U R U' R' U' R",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Opposite edges wrong pair 2",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U' R' U R U R' U' R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-7",
        setupMoves: "M2 U M2 U M2",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Three edges cycle front",
        ],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U' M2 U' M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-8",
        setupMoves: "M2 U' M2 U' M2",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Three edges cycle back",
        ],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U M2 U M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-9",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R'",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Bar front, adjacent swap",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U' R' U R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-10",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Bar back, adjacent swap",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U R U' R' U' R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-11",
        setupMoves: "R U' R' U R U' R' U' R U R' U R U2 R'",
        recognition: ["T OLL shape", "Corners solved", "Three bar pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R' U' R U R' U R",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-12",
        setupMoves: "R' U R U' R' U R U R' U' R U' R' U2 R",
        recognition: ["T OLL shape", "Corners solved", "Mirror three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R U R' U' R U' R'",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-13",
        setupMoves: "M U M' U M U M' U M U2 M'",
        recognition: ["T OLL shape", "Corners solved", "Complex M slice"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M' U2 M U' M' U' M U' M' U' M",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T-Skip-14",
        setupMoves: "M' U' M U' M' U' M U' M' U2 M",
        recognition: [
          "T OLL shape",
          "Corners solved",
          "Mirror complex M slice",
        ],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M U2 M' U M U M' U M U M'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      // U Set - EPLL (All Corners Solved) - 4 cases
      {
        caseName: "U-EPLL-Ua",
        setupMoves: "R U' R U R U R U' R' U' R2",
        recognition: ["U OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R U' R U R U R U' R' U' R2",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U M U2 M' U M2",
            moveCount: 7,
            popularity: 88,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "U-EPLL-Ub",
        setupMoves: "R2 U R U R' U' R' U' R' U R'",
        recognition: ["U OLL shape", "Ub perm - 3-cycle counter-clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R2 U R U R' U' R' U' R' U R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U' M U2 M' U' M2",
            moveCount: 7,
            popularity: 88,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "U-EPLL-Z",
        setupMoves: "M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["U OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U M' U2 M2 U2 M'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-EPLL-H",
        setupMoves: "M2 U M2 U2 M2 U M2",
        recognition: ["U OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U2 M2 U M2",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },

      // U Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "U-AS-1",
        setupMoves: "R' U' R U' R' U2 R2 U R' U R U2 R'",
        recognition: ["U OLL shape", "Adjacent swap", "Headlights front"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R2 U R' U R U2 R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-2",
        setupMoves: "R U R' U R U2 R2 U' R U' R' U2 R",
        recognition: ["U OLL shape", "Adjacent swap", "Headlights back"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R2 U' R U' R' U2 R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-3",
        setupMoves: "F R U R' U' R U R' U' F' U' R U R' U R U2 R'",
        recognition: ["U OLL shape", "Adjacent swap", "Bar on left side"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U F R U R' U' R U R' U' F'",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-4",
        setupMoves: "R' F' U' F U R U R U R' U' R U R' U' R U2 R'",
        recognition: ["U OLL shape", "Adjacent swap", "Bar on right side"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R' F' U' F U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-5",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R' U' R U R'",
        recognition: [
          "U OLL shape",
          "Adjacent swap",
          "Checker pattern front-left",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-6",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R U R' U' R",
        recognition: [
          "U OLL shape",
          "Adjacent swap",
          "Checker pattern front-right",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-7",
        setupMoves: "R U2 R' U' R U R' U' R U' R' F R U R' U' F'",
        recognition: ["U OLL shape", "Adjacent swap", "Twisted front corners"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U R' U R U2 R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-8",
        setupMoves: "R' U2 R U R' U' R U R' U R F' R' U' R U F",
        recognition: ["U OLL shape", "Adjacent swap", "Twisted back corners"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U' R U' R' U2 R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-9",
        setupMoves: "R U R' U R U' R' U' R' F R F' R U' R'",
        recognition: ["U OLL shape", "Adjacent swap", "Sune setup left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-10",
        setupMoves: "R' U' R U' R' U R U R B' R' B R' U R",
        recognition: ["U OLL shape", "Adjacent swap", "Sune setup right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R B R' U' R U R B' R2 U R",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-11",
        setupMoves: "R U R' U' R' F R F' R U R' U' R U2 R' U' R U' R'",
        recognition: ["U OLL shape", "Adjacent swap", "Double trigger pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R' R' F R F' R U R' U' R U' R'",
            moveCount: 18,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-12",
        setupMoves: "R' U' R U R B' R' B R' U' R U R' U2 R U R' U R",
        recognition: ["U OLL shape", "Adjacent swap", "Mirror double trigger"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R R B' R' B R' U' R U R' U R",
            moveCount: 18,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-13",
        setupMoves: "R U2 R' U' R U' R' U R U R' U' R U' R' U R U2 R'",
        recognition: ["U OLL shape", "Adjacent swap", "Long algorithm front"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U R U R' U' R U' R' U R U' R' U' R U' R'",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-14",
        setupMoves: "R' U2 R U R' U R U' R' U' R U R' U R U' R' U2 R",
        recognition: ["U OLL shape", "Adjacent swap", "Long algorithm back"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R U' R' U' R U R' U R U' R' U R U R' U R",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-15",
        setupMoves: "F R U' R' U' R U R' F' U R U' R' U' R U R' U' R U2 R'",
        recognition: ["U OLL shape", "Adjacent swap", "OLL into sune"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U R U R' U' F R U' R' U' R U R' F'",
            moveCount: 18,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-16",
        setupMoves: "F' R' U R U R' U' R F U' R' U R U R' U' R U R' U2 R",
        recognition: ["U OLL shape", "Adjacent swap", "OLL into anti-sune"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R U' R' U' R U F' R' U R U R' U' R F",
            moveCount: 18,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-17",
        setupMoves: "R' F R F' R U' R' U R U' R' U' R U R' U R U2 R'",
        recognition: ["U OLL shape", "Adjacent swap", "Sledge to sune combo"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R U R' U' R' F R F'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-AS-18",
        setupMoves: "R B' R' B R' U R U' R' U R U R' U' R U' R' U2 R",
        recognition: [
          "U OLL shape",
          "Adjacent swap",
          "Hedge to anti-sune combo",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R' U' R U R B' R' B",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },

      // U Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "U-DS-1",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["U OLL shape", "Diagonal swap", "No headlights pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-2",
        setupMoves: "R' F R F' R U R' U' R' F R F' R U' R'",
        recognition: ["U OLL shape", "Diagonal swap", "Double sledge variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U R' U' R' F R F' R U' R' F",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-3",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["U OLL shape", "Diagonal swap", "Wide move trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R' F' r U R U' r'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-4",
        setupMoves: "l' U' L U l F' L2 U L U L' U' L F",
        recognition: ["U OLL shape", "Diagonal swap", "Mirror wide move"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' L' U' L U L F l' U' L' U l",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-5",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["U OLL shape", "Diagonal swap", "Sune to OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-6",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: ["U OLL shape", "Diagonal swap", "Anti-sune to OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-7",
        setupMoves: "R U R' U' R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["U OLL shape", "Diagonal swap", "Triple sexy to sledge"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U R' U' R U' R' U R U' R'",
            moveCount: 20,
            popularity: 68,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-8",
        setupMoves: "R' U' R U R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: [
          "U OLL shape",
          "Diagonal swap",
          "Triple reverse sexy to hedge",
        ],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U' R U R' U R U' R' U R",
            moveCount: 20,
            popularity: 68,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-9",
        setupMoves: "R U R' U R U' R' U R U2 R' U' R U R' U' R' F R F'",
        recognition: ["U OLL shape", "Diagonal swap", "Sune to sledge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U R U2 R' U' R U' R' U R U' R'",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-10",
        setupMoves: "R' U' R U' R' U R U' R' U2 R U R' U' R U R B' R' B",
        recognition: ["U OLL shape", "Diagonal swap", "Anti-sune to hedge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U' R' U2 R U R' U R U' R' U R",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-11",
        setupMoves: "R U2 R' U' R U' R' U R U' R' U' R U2 R'",
        recognition: ["U OLL shape", "Diagonal swap", "Double sune pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U R U R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-12",
        setupMoves: "R' U2 R U R' U R U' R' U R U R' U2 R",
        recognition: [
          "U OLL shape",
          "Diagonal swap",
          "Double anti-sune pattern",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U' R' U' R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-13",
        setupMoves: "F R U R' U' R U R' U' R U R' U' F'",
        recognition: ["U OLL shape", "Diagonal swap", "Triple sexy in F"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' R U R' U' F'",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-14",
        setupMoves: "F' R' U' R U R' U' R U R' U' R U F",
        recognition: [
          "U OLL shape",
          "Diagonal swap",
          "Triple reverse sexy in F'",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U R' U' R U F",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-15",
        setupMoves: "R U' L' U R' U' L U R U' L' U R' U' L",
        recognition: ["U OLL shape", "Diagonal swap", "J perm variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' L' U R' U' L U R U' L' U R' U' L",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-16",
        setupMoves: "L' U R U' L U R' U' L' U R U' L U R'",
        recognition: ["U OLL shape", "Diagonal swap", "Mirror J perm variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U R U' L U R' U' L' U R U' L U R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-17",
        setupMoves: "R U R' U' R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
        recognition: ["U OLL shape", "Diagonal swap", "Complex pattern left"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U2 R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 17,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-DS-18",
        setupMoves: "R' U' R U R' U' R F R' U' R U R F' R2 U R U2 R' U R",
        recognition: ["U OLL shape", "Diagonal swap", "Complex pattern right"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R' U' R U2 R' U' R F R' U' R U R F' R2 U R",
            moveCount: 17,
            popularity: 72,
            isDefault: true,
          },
        ],
      },

      // U Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "U-OS-1",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["U OLL shape", "Opposite swap", "No bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U' R U' R' U2 R",
            moveCount: 11,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-2",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["U OLL shape", "Opposite swap", "Mirror no bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U R' U R U2 R'",
            moveCount: 11,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-3",
        setupMoves: "R U R' U R' F R F' R U' R' U R U2 R'",
        recognition: ["U OLL shape", "Opposite swap", "Bar front"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-4",
        setupMoves: "R' U' R U' R B' R' B R' U R U' R' U2 R",
        recognition: ["U OLL shape", "Opposite swap", "Bar back"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-5",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R'",
        recognition: ["U OLL shape", "Opposite swap", "Headlights left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U R' U' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-6",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R",
        recognition: ["U OLL shape", "Opposite swap", "Headlights right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U' R U R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-7",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: ["U OLL shape", "Opposite swap", "Two headlight pairs"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-8",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: ["U OLL shape", "Opposite swap", "Mirror headlight pairs"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-9",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["U OLL shape", "Opposite swap", "Block left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-10",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["U OLL shape", "Opposite swap", "Block right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-11",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["U OLL shape", "Opposite swap", "OLL 33 variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-12",
        setupMoves: "R U R' U' R' F R F' F R U' R' U' R U R' F'",
        recognition: ["U OLL shape", "Opposite swap", "Double trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R' F R F' R U R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-13",
        setupMoves: "R U R' U R' F R F' R U2 R' U R U2 R'",
        recognition: ["U OLL shape", "Opposite swap", "Front bar back checker"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U2 R' U' R' F R F' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-14",
        setupMoves: "R' U' R U' R B' R' B R' U2 R U' R' U2 R",
        recognition: ["U OLL shape", "Opposite swap", "Back bar front checker"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U2 R U R B' R' B R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-15",
        setupMoves: "R U R' U' R U' R' F R U R' U' R U R' U' F'",
        recognition: ["U OLL shape", "Opposite swap", "Checker front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U' R' U R U R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-16",
        setupMoves: "R' U' R U R' U R F' R' U' R U R' U' R U F",
        recognition: ["U OLL shape", "Opposite swap", "Checker front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U R U' R' U' R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-17",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["U OLL shape", "Opposite swap", "All checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-OS-18",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U' R U R' U R",
        recognition: ["U OLL shape", "Opposite swap", "Mirror all checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },

      // U Set - Solved Corners (CPLL Skip) - 14 cases
      {
        caseName: "U-Skip-1",
        setupMoves: "R U R' U' R U R' U' R U R' U' R U R'",
        recognition: ["U OLL shape", "Corners solved", "All edges wrong"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-2",
        setupMoves: "R' U' R U R' U' R U R' U' R U R' U' R",
        recognition: [
          "U OLL shape",
          "Corners solved",
          "All edges wrong reverse",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-3",
        setupMoves: "R U R' U' R U R' U' R U2 R'",
        recognition: [
          "U OLL shape",
          "Corners solved",
          "Adjacent edges wrong front",
        ],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-4",
        setupMoves: "R' U' R U R' U' R U R' U2 R",
        recognition: [
          "U OLL shape",
          "Corners solved",
          "Adjacent edges wrong back",
        ],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-5",
        setupMoves: "M2 U M2 U M2",
        recognition: ["U OLL shape", "Corners solved", "3-cycle front"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U' M2 U' M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-6",
        setupMoves: "M2 U' M2 U' M2",
        recognition: ["U OLL shape", "Corners solved", "3-cycle back"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U M2 U M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-7",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R'",
        recognition: [
          "U OLL shape",
          "Corners solved",
          "Sune plus adjacent swap",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U' R' U R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-8",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R",
        recognition: ["U OLL shape", "Corners solved", "Anti-sune plus swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U R U' R' U' R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-9",
        setupMoves: "M U M' U M U M' U M U2 M'",
        recognition: ["U OLL shape", "Corners solved", "M slice combo"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M' U2 M U' M' U' M U' M' U' M",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-10",
        setupMoves: "M' U' M U' M' U' M U' M' U2 M",
        recognition: ["U OLL shape", "Corners solved", "Mirror M slice"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M U2 M' U M U M' U M U M'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-11",
        setupMoves: "R U' R' U R U' R' U' R U R' U R U2 R'",
        recognition: ["U OLL shape", "Corners solved", "Three bar pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R' U' R U R' U R",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-12",
        setupMoves: "R' U R U' R' U R U R' U' R U' R' U2 R",
        recognition: ["U OLL shape", "Corners solved", "Mirror three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R U R' U' R U' R'",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-13",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["U OLL shape", "Corners solved", "Sledge variant"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U-Skip-14",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["U OLL shape", "Corners solved", "Hedge variant"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },

      // U Set - Edge PLL (EPLL) - 4 cases
      {
        caseName: "L-EPLL-Ua",
        setupMoves: "R U' R U R U R U' R' U' R2",
        recognition: ["L OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R U' R U R U R U' R' U' R2",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U M U2 M' U M2",
            moveCount: 7,
            popularity: 88,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "L-EPLL-Ub",
        setupMoves: "R2 U R U R' U' R' U' R' U R'",
        recognition: ["L OLL shape", "Ub perm - 3-cycle counter-clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R2 U R U R' U' R' U' R' U R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U' M U2 M' U' M2",
            moveCount: 7,
            popularity: 88,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "L-EPLL-Z",
        setupMoves: "M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["L OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U M' U2 M2 U2 M'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-EPLL-H",
        setupMoves: "M2 U M2 U2 M2 U M2",
        recognition: ["L OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U2 M2 U M2",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },

      // L Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "L-AS-1",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["L OLL shape", "Adjacent swap", "Headlights on left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-2",
        setupMoves: "R' U' R U R B' R2 U R U R' U' R B",
        recognition: ["L OLL shape", "Adjacent swap", "Headlights on right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U R B' R2 U R U R' U' R B",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-3",
        setupMoves: "R U2 R' U' R U R' U2 R' F R F'",
        recognition: ["L OLL shape", "Adjacent swap", "Bar on back"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 R' F R F'",
            moveCount: 12,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-4",
        setupMoves: "R' U2 R U R' U' R U2 R B' R' B",
        recognition: ["L OLL shape", "Adjacent swap", "Bar on front"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U2 R B' R' B",
            moveCount: 12,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-5",
        setupMoves: "F R U' R' U' R U R' F' U2 R U R' U R U2 R'",
        recognition: ["L OLL shape", "Adjacent swap", "Front bar left checker"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U2 F R U' R' U' R U R' F'",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-6",
        setupMoves: "F' R' U R U R' U' R F U2 R' U' R U' R' U2 R",
        recognition: ["L OLL shape", "Adjacent swap", "Back bar right checker"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U2 F' R' U R U R' U' R F",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-7",
        setupMoves: "R U R' U R U' R' U R U' R' U' R' F R F'",
        recognition: ["L OLL shape", "Adjacent swap", "Triple sexy to sledge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-8",
        setupMoves: "R' U' R U' R' U R U' R' U R U R B' R' B",
        recognition: [
          "L OLL shape",
          "Adjacent swap",
          "Triple reverse sexy to hedge",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-9",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["L OLL shape", "Adjacent swap", "Sune to OLL trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-10",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: [
          "L OLL shape",
          "Adjacent swap",
          "Anti-sune to OLL trigger",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-11",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R' U' R U R'",
        recognition: ["L OLL shape", "Adjacent swap", "Long sexy chain"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U' R U R' U R U' R'",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-12",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R U R' U' R",
        recognition: ["L OLL shape", "Adjacent swap", "Long reverse chain"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U R' U' R U' R' U R",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-13",
        setupMoves: "R U2 R' U' R U R' U' R U' R' F R U R' U' F'",
        recognition: ["L OLL shape", "Adjacent swap", "Sune into OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U R' U R U2 R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-14",
        setupMoves: "R' U2 R U R' U' R U R' U R F' R' U' R U F",
        recognition: ["L OLL shape", "Adjacent swap", "Anti-sune into OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U' R U' R' U2 R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-15",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["L OLL shape", "Adjacent swap", "Wide r opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R' F' r U R U' r'",
            moveCount: 11,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-16",
        setupMoves: "l' U' L U l F' L2 U L U L' U' L F",
        recognition: ["L OLL shape", "Adjacent swap", "Wide l opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' L' U' L U L F l' U' L' U l",
            moveCount: 11,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-17",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["L OLL shape", "Adjacent swap", "Sexy sledge combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-AS-18",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: [
          "L OLL shape",
          "Adjacent swap",
          "Reverse sexy hedge combo",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },

      // L Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "L-DS-1",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["L OLL shape", "Diagonal swap", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-2",
        setupMoves: "R U R' U' R' F R F' R' F R F' R U R' U' R' F R F'",
        recognition: ["L OLL shape", "Diagonal swap", "Double sledge pattern"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U' R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-3",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["L OLL shape", "Diagonal swap", "Wide r trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-4",
        setupMoves: "R' U' R U R' F' R U R' U' R' F R2 U' R' U R",
        recognition: ["L OLL shape", "Diagonal swap", "Extended sledge"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R' F' R U R' U' R' F R2 U' R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-5",
        setupMoves: "R U R' U R U2 R' U' R U' L' U R' U' L",
        recognition: ["L OLL shape", "Diagonal swap", "J perm like"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U' R U L U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-6",
        setupMoves: "R' U' R U' R' U2 R U R' U L U' R U L'",
        recognition: ["L OLL shape", "Diagonal swap", "Mirror J perm like"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L U R' U' L' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-7",
        setupMoves: "R U R' U' R U R' U R U' R' U R U2 R' U' R U R'",
        recognition: ["L OLL shape", "Diagonal swap", "Long sexy pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U2 R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-8",
        setupMoves: "R' U' R U R' U' R U' R' U R U' R' U2 R",
        recognition: ["L OLL shape", "Diagonal swap", "Inverse sexy pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U2 R' U' R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-9",
        setupMoves: "F R' F' R U2 R U2 R' U' R U R' U' R U' R'",
        recognition: ["L OLL shape", "Diagonal swap", "F2L like insert"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R' F R F' R U2 R'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-10",
        setupMoves: "F' R F R' U2 R' U2 R U R' U' R U R' U R",
        recognition: ["L OLL shape", "Diagonal swap", "Mirror F2L insert"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R F' R' F R' U2 R",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-11",
        setupMoves: "R U2 R' U' R U' R' U R U' R' U' R U2 R'",
        recognition: ["L OLL shape", "Diagonal swap", "Double anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U R U R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-12",
        setupMoves: "R' U2 R U R' U R U' R' U R U R' U2 R",
        recognition: ["L OLL shape", "Diagonal swap", "Double sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U' R' U' R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-13",
        setupMoves: "R U R' U' R U R' U' R U R' U2 R U' R'",
        recognition: ["L OLL shape", "Diagonal swap", "Inserted pattern left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U2 R U R' U R U' R' U R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-14",
        setupMoves: "R' U' R U R' U' R U R' U' R U2 R' U R",
        recognition: ["L OLL shape", "Diagonal swap", "Inserted pattern right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U2 R' U' R U' R' U R U' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-15",
        setupMoves: "F U R U' R' F' R U R' U R U2 R'",
        recognition: ["L OLL shape", "Diagonal swap", "OLL to sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F U R U' R' F'",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-16",
        setupMoves: "F' U' R' U R F R' U' R U' R' U2 R",
        recognition: ["L OLL shape", "Diagonal swap", "OLL to anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R F' U' R' U R F",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-17",
        setupMoves: "R U R' U' R U R' U' R U2 R' F R U R' U' F'",
        recognition: ["L OLL shape", "Diagonal swap", "Extended OLL combo"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U2 R' U' R U R' U' R U' R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-DS-18",
        setupMoves: "R' U' R U R' U' R U R' U2 R F' R' U' R U F",
        recognition: ["L OLL shape", "Diagonal swap", "Mirror extended OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U2 R U R' U' R U R' U R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },

      // L Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "L-OS-1",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["L OLL shape", "Opposite swap", "No bars visible"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R2 U R' U R U2 R'",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-2",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["L OLL shape", "Opposite swap", "Mirror no bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R2 U' R U' R' U2 R",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-3",
        setupMoves: "R U R' U R' F R F' R U' R' U R U2 R'",
        recognition: ["L OLL shape", "Opposite swap", "Bar on front"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-4",
        setupMoves: "R' U' R U' R B' R' B R' U R U' R' U2 R",
        recognition: ["L OLL shape", "Opposite swap", "Bar on back"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-5",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R'",
        recognition: ["L OLL shape", "Opposite swap", "Headlights left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U R' U' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-6",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R",
        recognition: ["L OLL shape", "Opposite swap", "Headlights right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U' R U R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-7",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: ["L OLL shape", "Opposite swap", "Double headlight pairs"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-8",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: [
          "L OLL shape",
          "Opposite swap",
          "Mirror double headlights",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-9",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["L OLL shape", "Opposite swap", "Block pattern left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-10",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["L OLL shape", "Opposite swap", "Block pattern right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-11",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["L OLL shape", "Opposite swap", "OLL 33 variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-12",
        setupMoves: "R U R' U' R' F R F' F R U' R' U' R U R' F'",
        recognition: ["L OLL shape", "Opposite swap", "Double OLL trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R' F R F' R U R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-13",
        setupMoves: "R U R' U R' F R F' R U2 R' U R U2 R'",
        recognition: ["L OLL shape", "Opposite swap", "Front bar back checker"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U2 R' U' R' F R F' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-14",
        setupMoves: "R' U' R U' R B' R' B R' U2 R U' R' U2 R",
        recognition: ["L OLL shape", "Opposite swap", "Back bar front checker"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U2 R U R B' R' B R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-15",
        setupMoves: "R U R' U' R U' R' F R U R' U' R U R' U' F'",
        recognition: ["L OLL shape", "Opposite swap", "Checker front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U' R' U R U R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-16",
        setupMoves: "R' U' R U R' U R F' R' U' R U R' U' R U F",
        recognition: ["L OLL shape", "Opposite swap", "Checker front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U R U' R' U' R",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-17",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["L OLL shape", "Opposite swap", "All four checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-OS-18",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U' R U R' U R",
        recognition: ["L OLL shape", "Opposite swap", "Mirror all checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },

      // L Set - Solved Corners (CPLL Skip) - 14 cases
      {
        caseName: "L-Skip-1",
        setupMoves: "R U R' U' R U R' U' R U R' U' R U R'",
        recognition: ["L OLL shape", "Corners solved", "All edges wrong"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-2",
        setupMoves: "R' U' R U R' U' R U R' U' R U R' U' R",
        recognition: [
          "L OLL shape",
          "Corners solved",
          "All edges wrong reverse",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-3",
        setupMoves: "R U R' U' R U R' U' R U2 R'",
        recognition: ["L OLL shape", "Corners solved", "Adjacent edges front"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-4",
        setupMoves: "R' U' R U R' U' R U R' U2 R",
        recognition: ["L OLL shape", "Corners solved", "Adjacent edges back"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-5",
        setupMoves: "M2 U M2 U M2",
        recognition: ["L OLL shape", "Corners solved", "3-cycle front"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U' M2 U' M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-6",
        setupMoves: "M2 U' M2 U' M2",
        recognition: ["L OLL shape", "Corners solved", "3-cycle back"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U M2 U M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-7",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R'",
        recognition: ["L OLL shape", "Corners solved", "Sune plus swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U' R' U R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-8",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R",
        recognition: ["L OLL shape", "Corners solved", "Anti-sune plus swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U R U' R' U' R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-9",
        setupMoves: "M U M' U M U M' U M U2 M'",
        recognition: ["L OLL shape", "Corners solved", "M slice combo"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M' U2 M U' M' U' M U' M' U' M",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-10",
        setupMoves: "M' U' M U' M' U' M U' M' U2 M",
        recognition: ["L OLL shape", "Corners solved", "Mirror M slice"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M U2 M' U M U M' U M U M'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-11",
        setupMoves: "R U' R' U R U' R' U' R U R' U R U2 R'",
        recognition: ["L OLL shape", "Corners solved", "Three bar pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R' U' R U R' U R",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-12",
        setupMoves: "R' U R U' R' U R U R' U' R U' R' U2 R",
        recognition: ["L OLL shape", "Corners solved", "Mirror three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R U R' U' R U' R'",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-13",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["L OLL shape", "Corners solved", "Sledge insert"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L-Skip-14",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["L OLL shape", "Corners solved", "Hedge insert"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },

      // H Set - Edge PLL (EPLL) - 4 cases
      {
        caseName: "H-EPLL-Ua",
        setupMoves: "R U' R U R U R U' R' U' R2",
        recognition: ["H OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R U' R U R U R U' R' U' R2",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U M U2 M' U M2",
            moveCount: 7,
            popularity: 92,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "H-EPLL-Ub",
        setupMoves: "R2 U R U R' U' R' U' R' U R'",
        recognition: ["H OLL shape", "Ub perm - 3-cycle counter-clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R2 U R U R' U' R' U' R' U R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U' M U2 M' U' M2",
            moveCount: 7,
            popularity: 92,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "H-EPLL-Z",
        setupMoves: "M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["H OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U M' U2 M2 U2 M'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "M' U M2 U M2 U M' U2 M2",
            moveCount: 9,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "H-EPLL-H",
        setupMoves: "M2 U M2 U2 M2 U M2",
        recognition: ["H OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U2 M2 U M2",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },

      // H Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "H-AS-1",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["H OLL shape", "Adjacent swap", "Headlights front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-2",
        setupMoves: "R' U' R U R B' R2 U R U R' U' R B",
        recognition: ["H OLL shape", "Adjacent swap", "Headlights front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U R B' R2 U R U R' U' R B",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-3",
        setupMoves: "R U2 R' U' R U R' U2 R' F R F'",
        recognition: ["H OLL shape", "Adjacent swap", "Bar back-left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 R' F R F'",
            moveCount: 12,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-4",
        setupMoves: "R' U2 R U R' U' R U2 R B' R' B",
        recognition: ["H OLL shape", "Adjacent swap", "Bar back-right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U2 R B' R' B",
            moveCount: 12,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-5",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["H OLL shape", "Adjacent swap", "Double trigger front"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-6",
        setupMoves: "F' R' U R U R' U' R F R' U' R U R B' R' B",
        recognition: ["H OLL shape", "Adjacent swap", "Double trigger back"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U F' R' U R U R' U' R F",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-7",
        setupMoves: "R U R' U R U' R' U R U' R' U' R' F R F'",
        recognition: ["H OLL shape", "Adjacent swap", "Sexy chain to sledge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-8",
        setupMoves: "R' U' R U' R' U R U' R' U R U R B' R' B",
        recognition: ["H OLL shape", "Adjacent swap", "Reverse sexy to hedge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-9",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["H OLL shape", "Adjacent swap", "Sune into OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-10",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: ["H OLL shape", "Adjacent swap", "Anti-sune into OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-11",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["H OLL shape", "Adjacent swap", "Wide r trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R' F' r U R U' r'",
            moveCount: 11,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-12",
        setupMoves: "l' U' L U l F' L2 U L U L' U' L F",
        recognition: ["H OLL shape", "Adjacent swap", "Wide l trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' L' U' L U L F l' U' L' U l",
            moveCount: 11,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-13",
        setupMoves: "R U2 R' U' R U R' U' R U' R' F R U R' U' F'",
        recognition: ["H OLL shape", "Adjacent swap", "Anti-sune to OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U R' U R U2 R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-14",
        setupMoves: "R' U2 R U R' U' R U R' U R F' R' U' R U F",
        recognition: ["H OLL shape", "Adjacent swap", "Sune to reverse OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U' R U' R' U2 R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-15",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["H OLL shape", "Adjacent swap", "Sexy to sledge combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-16",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["H OLL shape", "Adjacent swap", "Reverse sexy hedge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-17",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R' U' R U R'",
        recognition: ["H OLL shape", "Adjacent swap", "Extended sexy pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U' R U R' U R U' R'",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-AS-18",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R U R' U' R",
        recognition: ["H OLL shape", "Adjacent swap", "Extended reverse sexy"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U R' U' R U' R' U R",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },

      // H Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "H-DS-1",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["H OLL shape", "Diagonal swap", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-2",
        setupMoves: "R U R' U' R' F R F' R' F R F' R U R' U' R' F R F'",
        recognition: ["H OLL shape", "Diagonal swap", "Triple sledge"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U' R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-3",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["H OLL shape", "Diagonal swap", "Wide opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-4",
        setupMoves: "R' U' R U R' F' R U R' U' R' F R2 U' R' U R",
        recognition: ["H OLL shape", "Diagonal swap", "Extended pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R' F' R U R' U' R' F R2 U' R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-5",
        setupMoves: "R U R' U R U2 R' U' R U' L' U R' U' L",
        recognition: ["H OLL shape", "Diagonal swap", "J perm variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U' R U L U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-6",
        setupMoves: "R' U' R U' R' U2 R U R' U L U' R U L'",
        recognition: ["H OLL shape", "Diagonal swap", "Mirror J variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L U R' U' L' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-7",
        setupMoves: "R U R' U' R U R' U R U' R' U R U2 R' U' R U R'",
        recognition: ["H OLL shape", "Diagonal swap", "Long sexy chain"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U2 R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-8",
        setupMoves: "R' U' R U R' U' R U' R' U R U' R' U2 R",
        recognition: ["H OLL shape", "Diagonal swap", "Inverse chain"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U2 R' U' R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-9",
        setupMoves: "F R' F' R U2 R U2 R' U' R U R' U' R U' R'",
        recognition: ["H OLL shape", "Diagonal swap", "F2L style insert"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R' F R F' R U2 R'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-10",
        setupMoves: "F' R F R' U2 R' U2 R U R' U' R U R' U R",
        recognition: ["H OLL shape", "Diagonal swap", "Mirror F2L insert"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R F' R' F R' U2 R",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-11",
        setupMoves: "R U2 R' U' R U' R' U R U' R' U' R U2 R'",
        recognition: ["H OLL shape", "Diagonal swap", "Double anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U R U R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-12",
        setupMoves: "R' U2 R U R' U R U' R' U R U R' U2 R",
        recognition: ["H OLL shape", "Diagonal swap", "Double sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U' R' U' R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-13",
        setupMoves: "R U R' U' R U R' U' R U R' U2 R U' R'",
        recognition: ["H OLL shape", "Diagonal swap", "Triple sexy variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U2 R U R' U R U' R' U R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-14",
        setupMoves: "R' U' R U R' U' R U R' U' R U2 R' U R",
        recognition: ["H OLL shape", "Diagonal swap", "Triple reverse sexy"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U2 R' U' R U' R' U R U' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-15",
        setupMoves: "F U R U' R' F' R U R' U R U2 R'",
        recognition: ["H OLL shape", "Diagonal swap", "OLL into sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F U R U' R' F'",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-16",
        setupMoves: "F' U' R' U R F R' U' R U' R' U2 R",
        recognition: ["H OLL shape", "Diagonal swap", "OLL into anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R F' U' R' U R F",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-17",
        setupMoves: "R U R' U' R U R' U' R U2 R' F R U R' U' F'",
        recognition: ["H OLL shape", "Diagonal swap", "Extended OLL trigger"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U2 R' U' R U R' U' R U' R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-DS-18",
        setupMoves: "R' U' R U R' U' R U R' U2 R F' R' U' R U F",
        recognition: ["H OLL shape", "Diagonal swap", "Mirror extended OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U2 R U R' U' R U R' U R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },

      // H Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "H-OS-1",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["H OLL shape", "Opposite swap", "No bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R2 U R' U R U2 R'",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-2",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["H OLL shape", "Opposite swap", "Mirror no bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R2 U' R U' R' U2 R",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-3",
        setupMoves: "R U R' U R' F R F' R U' R' U R U2 R'",
        recognition: ["H OLL shape", "Opposite swap", "Bar front"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-4",
        setupMoves: "R' U' R U' R B' R' B R' U R U' R' U2 R",
        recognition: ["H OLL shape", "Opposite swap", "Bar back"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-5",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R'",
        recognition: ["H OLL shape", "Opposite swap", "Left headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U R' U' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-6",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R",
        recognition: ["H OLL shape", "Opposite swap", "Right headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U' R U R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-7",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: ["H OLL shape", "Opposite swap", "Double headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-8",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: [
          "H OLL shape",
          "Opposite swap",
          "Mirror double headlights",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-9",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["H OLL shape", "Opposite swap", "Block left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-10",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["H OLL shape", "Opposite swap", "Block right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-11",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["H OLL shape", "Opposite swap", "OLL 33 variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-12",
        setupMoves: "R U R' U' R' F R F' F R U' R' U' R U R' F'",
        recognition: ["H OLL shape", "Opposite swap", "Double OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R' F R F' R U R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-13",
        setupMoves: "R U R' U R' F R F' R U2 R' U R U2 R'",
        recognition: ["H OLL shape", "Opposite swap", "Sledge pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U2 R' U' R' F R F' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-14",
        setupMoves: "R' U' R U' R B' R' B R' U2 R U' R' U2 R",
        recognition: ["H OLL shape", "Opposite swap", "Hedge pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U2 R U R B' R' B R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-15",
        setupMoves: "R U R' U' R U' R' F R U R' U' R U R' U' F'",
        recognition: ["H OLL shape", "Opposite swap", "Checker front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U' R' U R U R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-16",
        setupMoves: "R' U' R U R' U R F' R' U' R U R' U' R U F",
        recognition: ["H OLL shape", "Opposite swap", "Checker front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U R U' R' U' R",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-17",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["H OLL shape", "Opposite swap", "All checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-OS-18",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U' R U R' U R",
        recognition: ["H OLL shape", "Opposite swap", "Mirror all checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },

      // H Set - Solved Corners (CPLL Skip) - 14 cases
      {
        caseName: "H-Skip-1",
        setupMoves: "R U R' U' R U R' U' R U R' U' R U R'",
        recognition: ["H OLL shape", "Corners solved", "All edges wrong"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-2",
        setupMoves: "R' U' R U R' U' R U R' U' R U R' U' R",
        recognition: [
          "H OLL shape",
          "Corners solved",
          "All edges wrong reverse",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-3",
        setupMoves: "R U R' U' R U R' U' R U2 R'",
        recognition: ["H OLL shape", "Corners solved", "Adjacent edges front"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-4",
        setupMoves: "R' U' R U R' U' R U R' U2 R",
        recognition: ["H OLL shape", "Corners solved", "Adjacent edges back"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-5",
        setupMoves: "M2 U M2 U M2",
        recognition: ["H OLL shape", "Corners solved", "3-cycle front"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U' M2 U' M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-6",
        setupMoves: "M2 U' M2 U' M2",
        recognition: ["H OLL shape", "Corners solved", "3-cycle back"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U M2 U M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-7",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R'",
        recognition: ["H OLL shape", "Corners solved", "Sune swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U' R' U R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-8",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R",
        recognition: ["H OLL shape", "Corners solved", "Anti-sune swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U R U' R' U' R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-9",
        setupMoves: "M U M' U M U M' U M U2 M'",
        recognition: ["H OLL shape", "Corners solved", "M slice pattern"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M' U2 M U' M' U' M U' M' U' M",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-10",
        setupMoves: "M' U' M U' M' U' M U' M' U2 M",
        recognition: ["H OLL shape", "Corners solved", "Mirror M slice"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M U2 M' U M U M' U M U M'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-11",
        setupMoves: "R U' R' U R U' R' U' R U R' U R U2 R'",
        recognition: ["H OLL shape", "Corners solved", "Three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R' U' R U R' U R",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-12",
        setupMoves: "R' U R U' R' U R U R' U' R U' R' U2 R",
        recognition: ["H OLL shape", "Corners solved", "Mirror three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R U R' U' R U' R'",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-13",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["H OLL shape", "Corners solved", "Sledge insert"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H-Skip-14",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["H OLL shape", "Corners solved", "Hedge insert"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },

      // Pi Set - Edge Permutation (EPLL) - 4 cases
      {
        caseName: "Pi-EPLL-Ua",
        setupMoves: "R U' R U R U R U' R' U' R2",
        recognition: ["Pi OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R U' R U R U R U' R' U' R2",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U M U2 M' U M2",
            moveCount: 7,
            popularity: 92,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "Pi-EPLL-Ub",
        setupMoves: "R2 U R U R' U' R' U' R' U R'",
        recognition: ["Pi OLL shape", "Ub perm - 3-cycle counter-clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "R2 U R U R' U' R' U' R' U R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "M2 U' M U2 M' U' M2",
            moveCount: 7,
            popularity: 92,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "Pi-EPLL-Z",
        setupMoves: "M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["Pi OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U M' U2 M2 U2 M'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-EPLL-H",
        setupMoves: "M2 U M2 U2 M2 U M2",
        recognition: ["Pi OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U M2 U2 M2 U M2",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },

      // Pi Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "Pi-AS-1",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Headlights front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-2",
        setupMoves: "R' U' R U R B' R2 U R U R' U' R B",
        recognition: [
          "Pi OLL shape",
          "Adjacent swap",
          "Headlights front-right",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U R B' R2 U R U R' U' R B",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-3",
        setupMoves: "R U2 R' U' R U R' U2 R' F R F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Bar back-left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 R' F R F'",
            moveCount: 12,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-4",
        setupMoves: "R' U2 R U R' U' R U2 R B' R' B",
        recognition: ["Pi OLL shape", "Adjacent swap", "Bar back-right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U2 R B' R' B",
            moveCount: 12,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-5",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Double trigger"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-6",
        setupMoves: "F' R' U R U R' U' R F R' U' R U R B' R' B",
        recognition: ["Pi OLL shape", "Adjacent swap", "Mirror double trigger"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U F' R' U R U R' U' R F",
            moveCount: 18,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-7",
        setupMoves: "R U R' U R U' R' U R U' R' U' R' F R F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Sexy to sledge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-8",
        setupMoves: "R' U' R U' R' U R U' R' U R U R B' R' B",
        recognition: ["Pi OLL shape", "Adjacent swap", "Reverse sexy to hedge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-9",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Sune to OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-10",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: ["Pi OLL shape", "Adjacent swap", "Anti-sune to OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-11",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Wide r opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R' F' r U R U' r'",
            moveCount: 11,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-12",
        setupMoves: "l' U' L U l F' L2 U L U L' U' L F",
        recognition: ["Pi OLL shape", "Adjacent swap", "Wide l opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' L' U' L U L F l' U' L' U l",
            moveCount: 11,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-13",
        setupMoves: "R U2 R' U' R U R' U' R U' R' F R U R' U' F'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Anti-sune OLL combo"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U R' U R U2 R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-14",
        setupMoves: "R' U2 R U R' U' R U R' U R F' R' U' R U F",
        recognition: ["Pi OLL shape", "Adjacent swap", "Sune OLL combo"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U' R U' R' U2 R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-15",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Sexy sledge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-16",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["Pi OLL shape", "Adjacent swap", "Reverse sexy hedge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-17",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R' U' R U R'",
        recognition: ["Pi OLL shape", "Adjacent swap", "Long sexy pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U' R U R' U R U' R'",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-AS-18",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R U R' U' R",
        recognition: ["Pi OLL shape", "Adjacent swap", "Long reverse pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U R' U' R U' R' U R",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },

      // Pi Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "Pi-DS-1",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["Pi OLL shape", "Diagonal swap", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-2",
        setupMoves: "R U R' U' R' F R F' R' F R F' R U R' U' R' F R F'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Triple sledge"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U' R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-3",
        setupMoves: "r U R' U' r' F R2 U' R' U' R U R' F'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Wide opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-4",
        setupMoves: "R' U' R U R' F' R U R' U' R' F R2 U' R' U R",
        recognition: ["Pi OLL shape", "Diagonal swap", "Extended pattern"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R' F' R U R' U' R' F R2 U' R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-5",
        setupMoves: "R U R' U R U2 R' U' R U' L' U R' U' L",
        recognition: ["Pi OLL shape", "Diagonal swap", "J perm variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U' R U L U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-6",
        setupMoves: "R' U' R U' R' U2 R U R' U L U' R U L'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Mirror J variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "L U R' U' L' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-7",
        setupMoves: "R U R' U' R U R' U R U' R' U R U2 R' U' R U R'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Long sexy chain"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U' R' U2 R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-8",
        setupMoves: "R' U' R U R' U' R U' R' U R U' R' U2 R",
        recognition: ["Pi OLL shape", "Diagonal swap", "Inverse chain"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U R U2 R' U' R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-9",
        setupMoves: "F R' F' R U2 R U2 R' U' R U R' U' R U' R'",
        recognition: ["Pi OLL shape", "Diagonal swap", "F2L insert style"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R' F R F' R U2 R'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-10",
        setupMoves: "F' R F R' U2 R' U2 R U R' U' R U R' U R",
        recognition: ["Pi OLL shape", "Diagonal swap", "Mirror F2L insert"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R F' R' F R' U2 R",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-11",
        setupMoves: "R U2 R' U' R U' R' U R U' R' U' R U2 R'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Double anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U R U R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-12",
        setupMoves: "R' U2 R U R' U R U' R' U R U R' U2 R",
        recognition: ["Pi OLL shape", "Diagonal swap", "Double sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U' R' U' R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-13",
        setupMoves: "R U R' U' R U R' U' R U R' U2 R U' R'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Triple sexy"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U2 R U R' U R U' R' U R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-14",
        setupMoves: "R' U' R U R' U' R U R' U' R U2 R' U R",
        recognition: ["Pi OLL shape", "Diagonal swap", "Triple reverse sexy"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U2 R' U' R U' R' U R U' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-15",
        setupMoves: "F U R U' R' F' R U R' U R U2 R'",
        recognition: ["Pi OLL shape", "Diagonal swap", "OLL to sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F U R U' R' F'",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-16",
        setupMoves: "F' U' R' U R F R' U' R U' R' U2 R",
        recognition: ["Pi OLL shape", "Diagonal swap", "OLL to anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R F' U' R' U R F",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-17",
        setupMoves: "R U R' U' R U R' U' R U2 R' F R U R' U' F'",
        recognition: ["Pi OLL shape", "Diagonal swap", "Extended OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' F' R U2 R' U' R U R' U' R U' R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-DS-18",
        setupMoves: "R' U' R U R' U' R U R' U2 R F' R' U' R U F",
        recognition: ["Pi OLL shape", "Diagonal swap", "Mirror extended OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U F R' U2 R U R' U' R U R' U R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },

      // Pi Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "Pi-OS-1",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["Pi OLL shape", "Opposite swap", "No bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R2 U R' U R U2 R'",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-2",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["Pi OLL shape", "Opposite swap", "Mirror no bars"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R2 U' R U' R' U2 R",
            moveCount: 13,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-3",
        setupMoves: "R U R' U R' F R F' R U' R' U R U2 R'",
        recognition: ["Pi OLL shape", "Opposite swap", "Bar front"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-4",
        setupMoves: "R' U' R U' R B' R' B R' U R U' R' U2 R",
        recognition: ["Pi OLL shape", "Opposite swap", "Bar back"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-5",
        setupMoves: "R U R' U' R U' R' U2 R U' R' U R U R'",
        recognition: ["Pi OLL shape", "Opposite swap", "Left headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U R' U2 R U R' U' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-6",
        setupMoves: "R' U' R U R' U R U2 R' U R U' R' U' R",
        recognition: ["Pi OLL shape", "Opposite swap", "Right headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R U' R' U' R U2 R' U' R U R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-7",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: ["Pi OLL shape", "Opposite swap", "Double headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-8",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: [
          "Pi OLL shape",
          "Opposite swap",
          "Mirror double headlights",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-9",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["Pi OLL shape", "Opposite swap", "Block left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-10",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["Pi OLL shape", "Opposite swap", "Block right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-11",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["Pi OLL shape", "Opposite swap", "OLL 33 variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-12",
        setupMoves: "R U R' U' R' F R F' F R U' R' U' R U R' F'",
        recognition: ["Pi OLL shape", "Opposite swap", "Double OLL"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R' F R F' R U R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-13",
        setupMoves: "R U R' U R' F R F' R U2 R' U R U2 R'",
        recognition: ["Pi OLL shape", "Opposite swap", "Sledge pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U2 R' U' R' F R F' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-14",
        setupMoves: "R' U' R U' R B' R' B R' U2 R U' R' U2 R",
        recognition: ["Pi OLL shape", "Opposite swap", "Hedge pattern"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U2 R U R B' R' B R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-15",
        setupMoves: "R U R' U' R U' R' F R U R' U' R U R' U' F'",
        recognition: ["Pi OLL shape", "Opposite swap", "Checker front-left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U' R' U R U R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-16",
        setupMoves: "R' U' R U R' U R F' R' U' R U R' U' R U F",
        recognition: ["Pi OLL shape", "Opposite swap", "Checker front-right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U R U' R' U' R",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-17",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["Pi OLL shape", "Opposite swap", "All checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-OS-18",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U' R U R' U R",
        recognition: ["Pi OLL shape", "Opposite swap", "Mirror all checkers"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },

      // Pi Set - Solved Corners (CPLL Skip) - 14 cases
      {
        caseName: "Pi-Skip-1",
        setupMoves: "R U R' U' R U R' U' R U R' U' R U R'",
        recognition: ["Pi OLL shape", "Corners solved", "All edges wrong"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-2",
        setupMoves: "R' U' R U R' U' R U R' U' R U R' U' R",
        recognition: [
          "Pi OLL shape",
          "Corners solved",
          "All edges wrong reverse",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-3",
        setupMoves: "R U R' U' R U R' U' R U2 R'",
        recognition: ["Pi OLL shape", "Corners solved", "Adjacent edges front"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-4",
        setupMoves: "R' U' R U R' U' R U R' U2 R",
        recognition: ["Pi OLL shape", "Corners solved", "Adjacent edges back"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-5",
        setupMoves: "M2 U M2 U M2",
        recognition: ["Pi OLL shape", "Corners solved", "3-cycle front"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U' M2 U' M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-6",
        setupMoves: "M2 U' M2 U' M2",
        recognition: ["Pi OLL shape", "Corners solved", "3-cycle back"],
        difficulty: 3,
        frequency: 7,
        algorithms: [
          {
            notation: "M2 U M2 U M2",
            moveCount: 5,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-7",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R'",
        recognition: ["Pi OLL shape", "Corners solved", "Sune swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U' R' U R U R'",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-8",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R",
        recognition: ["Pi OLL shape", "Corners solved", "Anti-sune swap"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U R U' R' U' R",
            moveCount: 15,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-9",
        setupMoves: "M U M' U M U M' U M U2 M'",
        recognition: ["Pi OLL shape", "Corners solved", "M slice pattern"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M' U2 M U' M' U' M U' M' U' M",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-10",
        setupMoves: "M' U' M U' M' U' M U' M' U2 M",
        recognition: ["Pi OLL shape", "Corners solved", "Mirror M slice"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "M U2 M' U M U M' U M U M'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-11",
        setupMoves: "R U' R' U R U' R' U' R U R' U R U2 R'",
        recognition: ["Pi OLL shape", "Corners solved", "Three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R' U' R U R' U R",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-12",
        setupMoves: "R' U R U' R' U R U R' U' R U' R' U2 R",
        recognition: ["Pi OLL shape", "Corners solved", "Mirror three bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R U R' U' R U' R'",
            moveCount: 15,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-13",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["Pi OLL shape", "Corners solved", "Sledge insert"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi-Skip-14",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["Pi OLL shape", "Corners solved", "Hedge insert"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 72,
            isDefault: true,
          },
        ],
      },

      // Sune Set - Edge Permutation (EPLL) - 14 cases
      {
        caseName: "Sune-EPLL-Ua",
        setupMoves: "R U R' U R U2 R' M2 U M U2 M' U M2",
        recognition: ["Sune OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2 R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-EPLL-Ub",
        setupMoves: "R U R' U R U2 R' M2 U' M U2 M' U' M2",
        recognition: ["Sune OLL shape", "Ub perm - 3-cycle counter-clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "M2 U M U2 M' U M2 R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-EPLL-Z",
        setupMoves: "R U R' U R U2 R' M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["Sune OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M' U2 M2 U2 M U' M2 U' M2 R U2 R' U' R U' R'",
            moveCount: 16,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-EPLL-H",
        setupMoves: "R U R' U R U2 R' M2 U M2 U2 M2 U M2",
        recognition: ["Sune OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U' M2 U2 M2 U' M2 R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 90,
            isDefault: true,
          },
        ],
      },

      // Sune Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "Sune-AS-1",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Headlights front"],
        difficulty: 4,
        frequency: 7,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R'",
            moveCount: 11,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-2",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U2 R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Headlights back"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-3",
        setupMoves: "R U R' U R U2 R' F R U R' U' F'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Bar left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 13,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-4",
        setupMoves: "R U R' U R U2 R' F' U' F R U R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Bar right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R F' U F R U2 R' U' R U' R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-5",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["Sune OLL shape", "Adjacent swap", "Anti-sune cancel"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U R' U R",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-6",
        setupMoves: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Double sune pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-7",
        setupMoves: "F R U' R' U' R U R' F' R U2 R' U' R U' R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "OLL opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F R U' R' U' R U R' F'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-8",
        setupMoves: "R' F R F' R U R' U' R U R' U R U2 R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Sledge opener"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R U R' F' R U R' U' F",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-9",
        setupMoves: "r U R' U' r' F R F' R U2 R' U' R U' R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Wide r opener"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F R' F' r U R U' r'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-10",
        setupMoves: "l' U' L U l F' L' F L' U2 L U L' U L",
        recognition: ["Sune OLL shape", "Adjacent swap", "Wide l opener"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "L' U' L U' L' U2 L F' L F l' U' L' U l",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-11",
        setupMoves: "R U R' U R U' R' U R U' R' F' R U R' U' R' F R",
        recognition: ["Sune OLL shape", "Adjacent swap", "Sexy to J perm"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R' F' R2 U R U' R U' R' U R U R' U R U2 R'",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-12",
        setupMoves: "R' U' R U' R' U R U' R' U R F R' U' R U R F' R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Reverse to J perm"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R F R' U' R' U R2 F' R' U' R' U R U' R' U' R",
            moveCount: 17,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-13",
        setupMoves: "R U R' U' R U2 R' U' R U' R' U R U R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Mixed triggers"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U' R' U' R U R' U2 R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-14",
        setupMoves: "R' U' R U R' U2 R U R' U R U' R' U' R",
        recognition: ["Sune OLL shape", "Adjacent swap", "Reverse mixed"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U R U R' U' R U2 R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-15",
        setupMoves: "R U R' U R U2 R' U' R' F R F' R U R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Sune sledge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R F' R U R' U' F R U2 R' U' R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-16",
        setupMoves: "R U R' U R U2 R' U' R B' R' B R U R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "Sune hedge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R B R' U' R U B' R U2 R' U' R U' R'",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-17",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["Sune OLL shape", "Adjacent swap", "OLL 9 combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-AS-18",
        setupMoves: "R U R' U R U2 R' F' U' F U R U2 R'",
        recognition: ["Sune OLL shape", "Adjacent swap", "F move variant"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' F' U F R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Sune Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "Sune-DS-1",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["Sune OLL shape", "Diagonal swap", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R F' R U R' U' F R U' R' U' R U R' F'",
            moveCount: 18,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-2",
        setupMoves: "R U R' U' R' F R F' F R U' R' U' R U R' F'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Double sledge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R' F R F' R U R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-3",
        setupMoves: "R U R' U' L' U R U' L R' U R U2 R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "J perm variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' L' U R U' L R' U R U R'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-4",
        setupMoves: "R' U' R U L U' R' U L' R U' R' U2 R",
        recognition: ["Sune OLL shape", "Diagonal swap", "Mirror J variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U L U' R' U L' R U' R' U' R",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-5",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Long chain"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-6",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U R",
        recognition: ["Sune OLL shape", "Diagonal swap", "Inverse chain"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-7",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R' U R U2 R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Triple sune"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R' U' R U R' U R U2 R'",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-8",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R U' R' U2 R",
        recognition: ["Sune OLL shape", "Diagonal swap", "Triple anti-sune"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U R' U R U R' U' R U' R' U2 R",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-9",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Sune OLL"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-10",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: ["Sune OLL shape", "Diagonal swap", "Anti-sune OLL"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-11",
        setupMoves: "r U R' U' r' F R F' R U2 R' U' R U' R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Wide trigger"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F R' F' r U R U' r'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-12",
        setupMoves: "l' U' L U l F' L' F L' U2 L U L' U L",
        recognition: ["Sune OLL shape", "Diagonal swap", "Mirror wide"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "L' U' L U' L' U2 L F' L F l' U' L' U l",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-13",
        setupMoves: "R U R' U R' F R F' R U' R' U R U2 R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Sexy sledge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-14",
        setupMoves: "R' U' R U' R B' R' B R' U R U' R' U2 R",
        recognition: ["Sune OLL shape", "Diagonal swap", "Reverse hedge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-15",
        setupMoves: "F U R U' R' F' R U2 R' U' R U' R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "OLL front"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F U R U' R' F'",
            moveCount: 13,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-16",
        setupMoves: "F' U' R' U R F R' U2 R U R' U R",
        recognition: ["Sune OLL shape", "Diagonal swap", "OLL back"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F' U' R' U R F",
            moveCount: 13,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-17",
        setupMoves: "R U R' U R U2 R' R' U' R U' R' U2 R",
        recognition: ["Sune OLL shape", "Diagonal swap", "Sune anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-DS-18",
        setupMoves: "R' U' R U' R' U2 R R U R' U R U2 R'",
        recognition: ["Sune OLL shape", "Diagonal swap", "Anti-sune sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' R' U2 R U R' U R",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Sune Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "Sune-OS-1",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["Sune OLL shape", "Opposite swap", "No bars"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-2",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Mirror no bars"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U R' U R U2 R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-3",
        setupMoves: "R U R' U' R' F R F' R U2 R' U' R U' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Front bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-4",
        setupMoves: "R' U' R U R B' R' B R' U2 R U R' U R",
        recognition: ["Sune OLL shape", "Opposite swap", "Back bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-5",
        setupMoves: "R U R' U R U' R' U R U2 R' U' R U' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Left headlights"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U R U' R' U' R U R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-6",
        setupMoves: "R' U' R U' R' U R U' R' U2 R U R' U R",
        recognition: ["Sune OLL shape", "Opposite swap", "Right headlights"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R U' R' U R U R' U' R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-7",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Double headlights"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-8",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: [
          "Sune OLL shape",
          "Opposite swap",
          "Mirror double headlights",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-9",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["Sune OLL shape", "Opposite swap", "Block left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-10",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Block right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-11",
        setupMoves: "R U2 R' U' R U R' U' R U' R' F' R U R' U' R' F R",
        recognition: ["Sune OLL shape", "Opposite swap", "Long J perm"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R' F' R2 U R U' R' U R U R' U R U2 R'",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-12",
        setupMoves: "R' U2 R U R' U' R U R' U R F R' U' R U R F' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Mirror long J"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R F R' U' R' U R2 F' R' U' R' U R U' R' U2 R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-13",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Sledge pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-14",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["Sune OLL shape", "Opposite swap", "Hedge pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-15",
        setupMoves: "R U R' U R U2 R' U R U R' U' R U' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "Checker left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U' R U2 R' U' R U' R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-16",
        setupMoves: "R' U' R U' R' U2 R U' R' U' R U R' U R",
        recognition: ["Sune OLL shape", "Opposite swap", "Checker right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U R' U2 R U R' U R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-17",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["Sune OLL shape", "Opposite swap", "All checkers"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-OS-18",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U R",
        recognition: ["Sune OLL shape", "Opposite swap", "Mirror all checkers"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Sune Set - Solved Corners (CPLL Skip) - 14 cases
      {
        caseName: "Sune-Skip-1",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["Sune OLL shape", "Corners solved", "Pure sune"],
        difficulty: 3,
        frequency: 9,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R'",
            moveCount: 7,
            popularity: 98,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-2",
        setupMoves: "R U R' U R U2 R' U2 R U R' U R U2 R'",
        recognition: ["Sune OLL shape", "Corners solved", "Double sune"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U2 R U2 R' U' R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-3",
        setupMoves: "R U R' U R U2 R' U M2 U M U2 M' U M2",
        recognition: ["Sune OLL shape", "Corners solved", "Sune Ua"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2 U' R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-4",
        setupMoves: "R U R' U R U2 R' U' M2 U M U2 M' U M2",
        recognition: ["Sune OLL shape", "Corners solved", "Sune Ub"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2 U R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-5",
        setupMoves: "R U R' U R U2 R' M2 U M2 U2 M2 U M2",
        recognition: ["Sune OLL shape", "Corners solved", "Sune H"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M2 U2 M2 U' M2 R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-6",
        setupMoves: "R U R' U R U2 R' M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["Sune OLL shape", "Corners solved", "Sune Z"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M' U2 M2 U2 M U' M2 U' M2 R U2 R' U' R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-7",
        setupMoves: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
        recognition: ["Sune OLL shape", "Corners solved", "Sune swap left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-8",
        setupMoves: "R' U2 R U R' U R U R' U' R U' R' U2 R",
        recognition: ["Sune OLL shape", "Corners solved", "Sune swap right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-9",
        setupMoves: "R U R' U' R U' R' U2 R U2 R'",
        recognition: ["Sune OLL shape", "Corners solved", "Short sune"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U2 R U R' U R U' R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-10",
        setupMoves: "R' U' R U R' U R U2 R' U2 R",
        recognition: ["Sune OLL shape", "Corners solved", "Mirror short sune"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U2 R' U' R U' R' U R",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-11",
        setupMoves: "R U R' U R U' R' U R U' R' U R U2 R'",
        recognition: ["Sune OLL shape", "Corners solved", "Triple sexy sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-12",
        setupMoves: "R' U' R U' R' U R U' R' U R U' R' U2 R",
        recognition: [
          "Sune OLL shape",
          "Corners solved",
          "Triple reverse sune",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-13",
        setupMoves: "R U R' U R U2 R' F' R U R' U' R' F R",
        recognition: ["Sune OLL shape", "Corners solved", "Sledge combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' F R' F' R2 R U2 R' U' R U' R'",
            moveCount: 12,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Sune-Skip-14",
        setupMoves: "R U R' U R U2 R' F R' F' R2 U R'",
        recognition: ["Sune OLL shape", "Corners solved", "Hedge combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U' R2 F R F' R U2 R' U' R U' R'",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Anti-Sune Set - EPLL (All Corners Solved) - 14 cases
      {
        caseName: "AntiSune-EPLL-Ua",
        setupMoves: "R' U' R U' R' U2 R M2 U M U2 M' U M2",
        recognition: ["Anti-Sune OLL shape", "Ua perm - 3-cycle clockwise"],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2 R' U2 R U R' U R",
            moveCount: 14,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-EPLL-Ub",
        setupMoves: "R' U' R U' R' U2 R M2 U' M U2 M' U' M2",
        recognition: [
          "Anti-Sune OLL shape",
          "Ub perm - 3-cycle counter-clockwise",
        ],
        difficulty: 4,
        frequency: 8,
        algorithms: [
          {
            notation: "M2 U M U2 M' U M2 R' U2 R U R' U R",
            moveCount: 14,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-EPLL-Z",
        setupMoves: "R' U' R U' R' U2 R M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["Anti-Sune OLL shape", "Z perm - opposite edge swap"],
        difficulty: 5,
        frequency: 6,
        algorithms: [
          {
            notation: "M' U2 M2 U2 M U' M2 U' M2 R' U2 R U R' U R",
            moveCount: 16,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-EPLL-H",
        setupMoves: "R' U' R U' R' U2 R M2 U M2 U2 M2 U M2",
        recognition: ["Anti-Sune OLL shape", "H perm - parallel edge swap"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "M2 U' M2 U2 M2 U' M2 R' U2 R U R' U R",
            moveCount: 14,
            popularity: 90,
            isDefault: true,
          },
        ],
      },

      // Anti-Sune Set - Adjacent Corner Swap (AS) - 18 cases
      {
        caseName: "AntiSune-AS-1",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Adjacent swap",
          "Headlights front",
        ],
        difficulty: 4,
        frequency: 7,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U R' U R",
            moveCount: 11,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-2",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Adjacent swap",
          "Headlights back",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-3",
        setupMoves: "R' U' R U' R' U2 R F' U' F R' U' R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Bar left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' F U F' R' U2 R U R' U R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-4",
        setupMoves: "R' U' R U' R' U2 R F U F' R' U' R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Bar right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' F' U' F R' U2 R U R' U R",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-5",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Sune cancel"],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R'",
            moveCount: 11,
            popularity: 92,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-6",
        setupMoves: "R' U2 R U R' U R U R' U' R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Adjacent swap",
          "Double anti-sune pattern",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-7",
        setupMoves: "F' R' U R U R' U' R F R' U2 R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "OLL opener"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F' R' U R U R' U' R F",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-8",
        setupMoves: "R B' R' B R' U' R U R' U' R U' R' U2 R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Hedge opener"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U' R' U' R B R' U' R U B'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-9",
        setupMoves: "l' U' L U l F' L' F L' U2 L U L' U L",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Wide l opener"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "L' U' L U' L' U2 L F' L F l' U' L' U l",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-10",
        setupMoves: "r U R' U' r' F R F' R' U2 R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Wide r opener"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F R' F' r U R U' r'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-11",
        setupMoves: "R' U' R U' R' U R U' R' U R F R' U' R U R F' R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Adjacent swap",
          "Reverse to J perm",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R F R' U' R' U R2 F' R' U R U' R' U R U' R' U2 R",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-12",
        setupMoves: "R U R' U R U' R' U R U' R' F' R' U R U R' F R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Sexy to J perm"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R' F' R2 U R U' R U R' U R U R' U' R' U2 R",
            moveCount: 19,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-13",
        setupMoves: "R' U' R U R' U2 R U R' U R U' R' U' R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Mixed triggers"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U R U R' U' R U2 R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-14",
        setupMoves: "R U R' U' R U2 R' U' R U' R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "Reverse mixed"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U' R' U' R U R' U2 R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-15",
        setupMoves: "R' U' R U' R' U2 R U R' F R F' R' U' R",
        recognition: [
          "Anti-Sune OLL shape",
          "Adjacent swap",
          "Anti-sune sledge",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' F' R U' R' U F R' U2 R U R' U R",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-16",
        setupMoves: "R' U' R U' R' U2 R U R B' R' B R' U' R",
        recognition: [
          "Anti-Sune OLL shape",
          "Adjacent swap",
          "Anti-sune hedge",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' B R' U' R U B' R' U2 R U R' U R",
            moveCount: 16,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-17",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "OLL 9 combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-AS-18",
        setupMoves: "R' U' R U' R' U2 R F U F' U' R' U2 R",
        recognition: ["Anti-Sune OLL shape", "Adjacent swap", "F move variant"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U F U' F' R' U2 R U R' U R",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Anti-Sune Set - Diagonal Corner Swap (DS) - 18 cases
      {
        caseName: "AntiSune-DS-1",
        setupMoves: "F' R' U R U R' U' R F R' U' R U R B' R' B",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R B' R' B R' U' R U F' R' U R U R' U' R F",
            moveCount: 18,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-2",
        setupMoves: "R' U' R U R B' R' B F' R' U R U R' U' R F",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Double hedge"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R' U R U R' U' R F R B' R' B R' U' R U",
            moveCount: 18,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-3",
        setupMoves: "R' U' R U L U' R' U L' R U' R' U2 R",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "J perm variant"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U L' U R U' L R' U' R U R'",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-4",
        setupMoves: "R U R' U' L' U R U' L R' U R U2 R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Diagonal swap",
          "Mirror J variant",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' L U' R' U L' R U R' U' R",
            moveCount: 14,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-5",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Long chain"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-6",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U' R'",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Inverse chain"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-7",
        setupMoves: "R' U' R U' R' U2 R U' R' U R U' R' U R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Diagonal swap",
          "Triple anti-sune",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U R' U R U R' U' R U' R' U2 R",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-8",
        setupMoves: "R U R' U R U2 R' U R U' R' U R U' R' U R U2 R'",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Triple sune"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R' U' R U R' U R U2 R'",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-9",
        setupMoves: "R' U' R U' R' U2 R F' R' U' R U R' U' R U F",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Anti-sune OLL"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U F R' U2 R U R' U R",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-10",
        setupMoves: "R U R' U R U2 R' F R U R' U' R U R' U' F'",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Sune OLL"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F' R U2 R' U' R U' R'",
            moveCount: 17,
            popularity: 76,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-11",
        setupMoves: "l' U' L U l F' L' F L' U2 L U L' U L",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Wide trigger"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "L' U' L U' L' U2 L F' L F l' U' L' U l",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-12",
        setupMoves: "r U R' U' r' F R F' R' U2 R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Mirror wide"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F R' F' r U R U' r'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-13",
        setupMoves: "R' U' R U' R B' R' B R' U R U' R' U2 R",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Reverse hedge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-14",
        setupMoves: "R U R' U R' F R F' R U' R' U R U2 R'",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Sexy sledge"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-15",
        setupMoves: "F' U' R' U R F R' U2 R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "OLL front"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F' U' R' U R F",
            moveCount: 13,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-16",
        setupMoves: "F U R U' R' F' R U2 R' U' R U' R'",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "OLL back"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F U R U' R' F'",
            moveCount: 13,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-17",
        setupMoves: "R' U' R U' R' U2 R R U R' U R U2 R'",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Anti-sune sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' R' U2 R U R' U R",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-DS-18",
        setupMoves: "R U R' U R U2 R' R' U' R U' R' U2 R",
        recognition: ["Anti-Sune OLL shape", "Diagonal swap", "Sune anti-sune"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R R U2 R' U' R U' R'",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Anti-Sune Set - Opposite Corner Swap (OS) - 18 cases
      {
        caseName: "AntiSune-OS-1",
        setupMoves: "R U' R' U2 R U R' U2 R U R' U R U' R'",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "No bars"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 R U R' U R U2 R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-2",
        setupMoves: "R' U R U2 R' U' R U2 R' U' R U' R' U R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Mirror no bars"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-3",
        setupMoves: "R' U' R U R B' R' B R' U2 R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Front bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R B R' U' R U B' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-4",
        setupMoves: "R U R' U' R' F R F' R U2 R' U' R U' R'",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Back bar"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F' R U R' U' F R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-5",
        setupMoves: "R' U' R U' R' U R U' R' U2 R U R' U R",
        recognition: [
          "Anti-Sune OLL shape",
          "Opposite swap",
          "Left headlights",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R U' R' U R U R' U' R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-6",
        setupMoves: "R U R' U R U' R' U R U2 R' U' R U' R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Opposite swap",
          "Right headlights",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U R U' R' U' R U R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-7",
        setupMoves: "R' U' R F R' U2 R U R' U R F' R' U R",
        recognition: [
          "Anti-Sune OLL shape",
          "Opposite swap",
          "Double headlights",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R F R' U2 R U R' U R F' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-8",
        setupMoves: "R U R' F' R U2 R' U' R U' R' F R U' R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Opposite swap",
          "Mirror double headlights",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U2 R' U' R U' R' F R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-9",
        setupMoves: "R U' R2 D' l U2 l' D R2 U R'",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Block left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U' R2 D' l U2 l' D R2 U R'",
            moveCount: 11,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-10",
        setupMoves: "R' U R2 D r' U2 r D' R2 U' R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Block right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U R2 D r' U2 r D' R2 U' R",
            moveCount: 11,
            popularity: 88,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-11",
        setupMoves: "R' U2 R U R' U' R U R' U R F R' U' R U R F' R'",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Long J perm"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R F R' U' R' U R2 F' R' U' R' U R U' R' U2 R",
            moveCount: 17,
            popularity: 74,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-12",
        setupMoves: "R U2 R' U' R U R' U' R U' R' F' R' U R U R' F R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Mirror long J"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R' F' R2 U R U' R U R' U R U R' U' R' U2 R",
            moveCount: 19,
            popularity: 72,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-13",
        setupMoves: "R' U' R U' R' U R U' R B' R' B R' U2 R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Hedge pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R B R' U' R U B' R' U R U' R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-14",
        setupMoves: "R U R' U R U' R' U R' F R F' R U2 R'",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Sledge pattern"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' F' R U R' U' F R U' R' U R U' R'",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-15",
        setupMoves: "R' U' R U' R' U2 R U' R' U' R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Checker left"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U R' U2 R U R' U R",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-16",
        setupMoves: "R U R' U R U2 R' U R U R' U' R U' R'",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "Checker right"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U' R U2 R' U' R U' R'",
            moveCount: 15,
            popularity: 82,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-17",
        setupMoves: "R' U2 R U R' U' R U R' U' R U R' U R",
        recognition: ["Anti-Sune OLL shape", "Opposite swap", "All checkers"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-OS-18",
        setupMoves: "R U2 R' U' R U R' U' R U R' U' R U' R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Opposite swap",
          "Mirror all checkers",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 84,
            isDefault: true,
          },
        ],
      },

      // Anti-Sune Set - Solved Corners (CPLL Skip) - 14 cases
      {
        caseName: "AntiSune-Skip-1",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Pure anti-sune",
        ],
        difficulty: 3,
        frequency: 9,
        algorithms: [
          {
            notation: "R' U2 R U R' U R",
            moveCount: 7,
            popularity: 98,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-2",
        setupMoves: "R' U' R U' R' U2 R U2 R' U' R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Double anti-sune",
        ],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U2 R' U2 R U R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-3",
        setupMoves: "R' U' R U' R' U2 R U M2 U M U2 M' U M2",
        recognition: ["Anti-Sune OLL shape", "Corners solved", "Anti-sune Ua"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2 U' R' U2 R U R' U R",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-4",
        setupMoves: "R' U' R U' R' U2 R U' M2 U M U2 M' U M2",
        recognition: ["Anti-Sune OLL shape", "Corners solved", "Anti-sune Ub"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2 U R' U2 R U R' U R",
            moveCount: 14,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-5",
        setupMoves: "R' U' R U' R' U2 R M2 U M2 U2 M2 U M2",
        recognition: ["Anti-Sune OLL shape", "Corners solved", "Anti-sune H"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M2 U2 M2 U' M2 R' U2 R U R' U R",
            moveCount: 14,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-6",
        setupMoves: "R' U' R U' R' U2 R M2 U M2 U M' U2 M2 U2 M'",
        recognition: ["Anti-Sune OLL shape", "Corners solved", "Anti-sune Z"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "M' U2 M2 U2 M U' M2 U' M2 R' U2 R U R' U R",
            moveCount: 16,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-7",
        setupMoves: "R' U2 R U R' U R U R' U' R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Anti-sune swap left",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U R U R' U' R U' R' U2 R",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-8",
        setupMoves: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Anti-sune swap right",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 78,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-9",
        setupMoves: "R' U' R U R' U R U2 R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Short anti-sune",
        ],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R' U2 R U2 R' U' R U' R' U R",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-10",
        setupMoves: "R U R' U' R U' R' U2 R U2 R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Mirror short anti-sune",
        ],
        difficulty: 4,
        frequency: 6,
        algorithms: [
          {
            notation: "R U2 R' U2 R U R' U R U' R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-11",
        setupMoves: "R' U' R U' R' U R U' R' U R U' R' U2 R",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Triple reverse anti-sune",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U R' U R U' R' U R",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-12",
        setupMoves: "R U R' U R U' R' U R U' R' U R U2 R'",
        recognition: [
          "Anti-Sune OLL shape",
          "Corners solved",
          "Triple sexy anti-sune",
        ],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R' U R U' R'",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-13",
        setupMoves: "R' U' R U' R' U2 R F R' F' R2 U' R'",
        recognition: ["Anti-Sune OLL shape", "Corners solved", "Sledge combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R2 F R F' R' U2 R U R' U R",
            moveCount: 13,
            popularity: 84,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AntiSune-Skip-14",
        setupMoves: "R' U' R U' R' U2 R F' R U R' U' R' F R",
        recognition: ["Anti-Sune OLL shape", "Corners solved", "Hedge combo"],
        difficulty: 5,
        frequency: 5,
        algorithms: [
          {
            notation: "R' F R' F' R2 R' U2 R U R' U R",
            moveCount: 12,
            popularity: 86,
            isDefault: true,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < zbllData.length; i++) {
      const data = zbllData[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: zbllSetId,
        caseName: data.caseName,
        slug: createSlug(data.caseName),
        setupMoves: data.setupMoves,
        recognition: data.recognition,
        difficulty: data.difficulty,
        frequency: data.frequency,
        order: i + 1,
        createdAt: now,
      });

      for (const alg of data.algorithms) {
        await ctx.db.insert("algorithms", {
          caseId,
          notation: alg.notation,
          moveCount: alg.moveCount,
          popularity: alg.popularity,
          isDefault: alg.isDefault,
          createdAt: now,
        });
      }
    }

    return {
      message: "Successfully seeded ZBLL algorithms",
      count: zbllData.length,
    };
  },
});
