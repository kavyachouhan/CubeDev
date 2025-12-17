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

// This mutation seeds the database with EG-1 algorithms for 2x2
// EG-1 is used when the first layer has one corner twisted clockwise - 43 algorithms
export const seedEG1Algorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "EG-1 (2x2)"))
      .first();

    if (existing) {
      return { message: "EG-1 algorithms already seeded" };
    }

    const now = Date.now();

    // Create EG-1 set
    const eg1SetId = await ctx.db.insert("algorithmSets", {
      name: "EG-1",
      slug: "eg-1-2x2",
      category: "2x2",
      description:
        "EG-1 for 2x2 - 43 algorithms for solving when the first layer has one corner twisted clockwise. Part of the EG method.",
      caseCount: 43,
      difficulty: "advanced",
      puzzleType: "2x2x2",
      order: 11,
      isPublished: true,
      createdAt: now,
    });

    // EG-1 Cases - organized by orientation type similar to CLL
    // One corner of first layer is twisted clockwise
    const eg1Data = [
      // ===== ADJACENT SUNE (7 cases) =====
      {
        caseName: "EG1-S1",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["EG-1 Sune", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R2 U R' U R' U' R U' R2 U' R U' R'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-S2",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["EG-1 Sune", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R' U' R' U' R' U R U R2",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-S3",
        setupMoves: "F R U R' U' F'",
        recognition: ["EG-1 Sune", "Adjacent swap back-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U2 R U' R2 U2 R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-S4",
        setupMoves: "L' U' L U' L' U2 L",
        recognition: ["EG-1 Sune", "Adjacent swap front-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U2 R U R2 U2 R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-S5",
        setupMoves: "R U' R' U' R U R' U2 R U' R'",
        recognition: ["EG-1 Sune", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F U R U' R' U R U' R' F'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-S6",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["EG-1 Sune", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R2 U2 R U R' U R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-S7",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-1 Sune", "Opposite diagonal"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R2 U2 R' U' R U' R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },

      // ===== ADJACENT ANTISUNE (7 cases) =====
      {
        caseName: "EG1-AS1",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["EG-1 Antisune", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-AS2",
        setupMoves: "R' U2 R U R' U R",
        recognition: ["EG-1 Antisune", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' U' R U R' U' R U R' F",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-AS3",
        setupMoves: "L U L' U L U2 L'",
        recognition: ["EG-1 Antisune", "Adjacent swap back-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R2 U2 R U R' U R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-AS4",
        setupMoves: "F' L' U' L U F",
        recognition: ["EG-1 Antisune", "Adjacent swap front-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R2 U2 R' U' R U' R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-AS5",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-1 Antisune", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U2 R' U R2 U2 R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-AS6",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["EG-1 Antisune", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R2 U2 R U R' U R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-AS7",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["EG-1 Antisune", "Opposite diagonal"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R2 U2 R' U' R U' R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },

      // ===== H ORIENTATION (6 cases) =====
      {
        caseName: "EG1-H1",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["EG-1 H", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U2 F R U R' U' F'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-H2",
        setupMoves: "R U2 R' U' R U R' U' R U' R'",
        recognition: ["EG-1 H", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U R' U' R U' R' U' R U R' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-H3",
        setupMoves: "R U R' U R U2 R' U R U R' U R U2 R'",
        recognition: ["EG-1 H", "Adjacent swap back-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F R' F' R U R U R' U' R U R' U' R U' R'",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-H4",
        setupMoves: "L' U2 L U L' U' L U L' U L",
        recognition: ["EG-1 H", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U R' U' R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-H5",
        setupMoves: "F R U R' U' F' R U R' U R U2 R'",
        recognition: ["EG-1 H", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R U R' U R F R U R' U' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-H6",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-1 H", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R' U2 R U R' U R2 U' R'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },

      // ===== PI ORIENTATION (6 cases) =====
      {
        caseName: "EG1-Pi1",
        setupMoves: "R U2 R2 U' R2 U' R2 U2 R",
        recognition: ["EG-1 Pi", "No swap needed"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R2 U' R U' R' U2 R U' R' U2 R",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-Pi2",
        setupMoves: "F R U R' U' R U R' U' R U R' U' F'",
        recognition: ["EG-1 Pi", "Adjacent swap front-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U R U R' U' F'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-Pi3",
        setupMoves: "R' U' R' F R F' R",
        recognition: ["EG-1 Pi", "Adjacent swap back-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R' F R F' R U R U' R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-Pi4",
        setupMoves: "L F' L F L' U' L' U L' U L",
        recognition: ["EG-1 Pi", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' F U R U' R' U R U' R' F'",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-Pi5",
        setupMoves: "R' U2 R2 U R2 U R2 U2 R'",
        recognition: ["EG-1 Pi", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F R U R' U' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-Pi6",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["EG-1 Pi", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' R U R' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },

      // ===== U ORIENTATION (6 cases) =====
      {
        caseName: "EG1-U1",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["EG-1 U", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U R U2 R'",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-U2",
        setupMoves: "R2 D R' U2 R D' R' U2 R'",
        recognition: ["EG-1 U", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R2 D R' U2 R D' R' U2 R' U R U R'",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-U3",
        setupMoves: "R' U' R U' R' U2 R2 U R' U R U2 R'",
        recognition: ["EG-1 U", "Adjacent swap back-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U2 R' U' R U' R' U R U R' U R",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-U4",
        setupMoves: "L U L' U L U2 L2 U' L U' L' U2 L",
        recognition: ["EG-1 U", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U2 R U R' U R U' R' U' R U' R'",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-U5",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-1 U", "Adjacent swap back-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' L' U L U L' U' L F R U R' U R U2 R'",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-U6",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["EG-1 U", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' F R U R' U' F' R U' R'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },

      // ===== T ORIENTATION (6 cases) =====
      {
        caseName: "EG1-T1",
        setupMoves: "R U R' U' R' F R F'",
        recognition: ["EG-1 T", "No swap needed"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R' F R2 U' R' U' R U R' F2",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-T2",
        setupMoves: "L' U' L U L F' L' F",
        recognition: ["EG-1 T", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 L' U R U' R' L",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-T3",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["EG-1 T", "Adjacent swap back-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U R U' L' U R' U' L",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-T4",
        setupMoves: "F' L F L' U' L' U L",
        recognition: ["EG-1 T", "Adjacent swap front-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R U' L' U' R U R' L",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-T5",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["EG-1 T", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F' U",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-T6",
        setupMoves: "R' U' R' F R F' R",
        recognition: ["EG-1 T", "Diagonal swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R U R' U' F' U R",
            moveCount: 9,
            popularity: 90,
            isDefault: true,
          },
        ],
      },

      // ===== L ORIENTATION (5 cases) =====
      {
        caseName: "EG1-L1",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["EG-1 L", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U R U R' U R U' R' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-L2",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["EG-1 L", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R' F R U R' U' F'",
            moveCount: 18,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-L3",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-1 L", "Adjacent swap back-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F' R U R' U' R' F R2 U' R' U2 R",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-L4",
        setupMoves: "L' U' L U' L' U L U' L' U2 L",
        recognition: ["EG-1 L", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "L F L' U' L U L F' L2 U L U2 L'",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG1-L5",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["EG-1 L", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' F R U R' U' F'",
            moveCount: 18,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < eg1Data.length; i++) {
      const data = eg1Data[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: eg1SetId,
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
      message: "Successfully seeded EG-1 algorithms",
      count: eg1Data.length,
    };
  },
});
