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

// This mutation seeds the database with EG-2 algorithms for 2x2
// EG-2 is used when the first layer has one corner twisted counter-clockwise - 43 algorithms
export const seedEG2Algorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "EG-2 (2x2)"))
      .first();

    if (existing) {
      return { message: "EG-2 algorithms already seeded" };
    }

    const now = Date.now();

    // Create EG-2 set
    const eg2SetId = await ctx.db.insert("algorithmSets", {
      name: "EG-2",
      slug: "eg-2-2x2",
      category: "2x2",
      description:
        "EG-2 for 2x2 - 43 algorithms for solving when the first layer has one corner twisted counter-clockwise. Part of the EG method.",
      caseCount: 43,
      difficulty: "advanced",
      puzzleType: "2x2x2",
      order: 12,
      isPublished: true,
      createdAt: now,
    });

    // EG-2 Cases - organized by orientation type similar to CLL
    // One corner of first layer is twisted counter-clockwise
    const eg2Data = [
      // ===== ADJACENT SUNE (7 cases) =====
      {
        caseName: "EG2-S1",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["EG-2 Sune", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R2 U R' U R U2 R' U R U R'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-S2",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["EG-2 Sune", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U R' U' R U' R2",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-S3",
        setupMoves: "F R U R' U' F'",
        recognition: ["EG-2 Sune", "Adjacent swap back-right"],
        difficulty: 5,
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
        caseName: "EG2-S4",
        setupMoves: "L' U' L U' L' U2 L",
        recognition: ["EG-2 Sune", "Adjacent swap front-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U2 R' U' R2 U2 R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-S5",
        setupMoves: "R U' R' U' R U R' U2 R U' R'",
        recognition: ["EG-2 Sune", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F' U' R' U R U' R' U R F",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-S6",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["EG-2 Sune", "Diagonal swap"],
        difficulty: 5,
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
      {
        caseName: "EG2-S7",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-2 Sune", "Opposite diagonal"],
        difficulty: 6,
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

      // ===== ADJACENT ANTISUNE (7 cases) =====
      {
        caseName: "EG2-AS1",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["EG-2 Antisune", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-AS2",
        setupMoves: "R' U2 R U R' U R",
        recognition: ["EG-2 Antisune", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F U R' U' R U R' U' R F'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-AS3",
        setupMoves: "L U L' U L U2 L'",
        recognition: ["EG-2 Antisune", "Adjacent swap back-right"],
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
        caseName: "EG2-AS4",
        setupMoves: "F' L' U' L U F",
        recognition: ["EG-2 Antisune", "Adjacent swap front-left"],
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
        caseName: "EG2-AS5",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-2 Antisune", "Adjacent swap back-left"],
        difficulty: 6,
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
        caseName: "EG2-AS6",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["EG-2 Antisune", "Diagonal swap"],
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
        caseName: "EG2-AS7",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["EG-2 Antisune", "Opposite diagonal"],
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
        caseName: "EG2-H1",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["EG-2 H", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U R' U R U2 F R U R' U' F'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-H2",
        setupMoves: "R U2 R' U' R U R' U' R U' R'",
        recognition: ["EG-2 H", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R' U' R U R' U R U R' U' R F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-H3",
        setupMoves: "R U R' U R U2 R' U R U R' U R U2 R'",
        recognition: ["EG-2 H", "Adjacent swap back-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F' R F R' U' R' U' R U R' U' R U R U R'",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-H4",
        setupMoves: "L' U2 L U L' U' L U L' U L",
        recognition: ["EG-2 H", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U' R U R' U R U' R' U2 R",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-H5",
        setupMoves: "F R U R' U' F' R U R' U R U2 R'",
        recognition: ["EG-2 H", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F R U R' U' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-H6",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-2 H", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R U' R U2 R' U' R U' R2 U R",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },

      // ===== PI ORIENTATION (6 cases) =====
      {
        caseName: "EG2-Pi1",
        setupMoves: "R U2 R2 U' R2 U' R2 U2 R",
        recognition: ["EG-2 Pi", "No swap needed"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R2 U R' U R U2 R' U R U2 R'",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-Pi2",
        setupMoves: "F R U R' U' R U R' U' R U R' U' F'",
        recognition: ["EG-2 Pi", "Adjacent swap front-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U R' F R2 U R' U' R' U' R U F'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-Pi3",
        setupMoves: "R' U' R' F R F' R",
        recognition: ["EG-2 Pi", "Adjacent swap back-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' F R' F' R U' R' U R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-Pi4",
        setupMoves: "L F' L F L' U' L' U L' U L",
        recognition: ["EG-2 Pi", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U F' U' R' U R U' R' U R F",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-Pi5",
        setupMoves: "R' U2 R2 U R2 U R2 U2 R'",
        recognition: ["EG-2 Pi", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F R U R' U' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-Pi6",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["EG-2 Pi", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' R' U' R U R' U' R U R' U' R F",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },

      // ===== U ORIENTATION (6 cases) =====
      {
        caseName: "EG2-U1",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["EG-2 U", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R' U' R U' R' U2 R",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-U2",
        setupMoves: "R2 D R' U2 R D' R' U2 R'",
        recognition: ["EG-2 U", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R2 D' R U2 R' D R U2 R U' R' U' R",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-U3",
        setupMoves: "R' U' R U' R' U2 R2 U R' U R U2 R'",
        recognition: ["EG-2 U", "Adjacent swap back-right"],
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
        caseName: "EG2-U4",
        setupMoves: "L U L' U L U2 L2 U' L U' L' U2 L",
        recognition: ["EG-2 U", "Adjacent swap front-left"],
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
        caseName: "EG2-U5",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-2 U", "Adjacent swap back-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F L U' L' U' L U L' F' R' U' R U' R' U2 R",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-U6",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["EG-2 U", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R U F R' U' R U F' R' U R",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },

      // ===== T ORIENTATION (6 cases) =====
      {
        caseName: "EG2-T1",
        setupMoves: "R U R' U' R' F R F'",
        recognition: ["EG-2 T", "No swap needed"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F' R F' R2 U R U R' U' R F2",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-T2",
        setupMoves: "L' U' L U L F' L' F",
        recognition: ["EG-2 T", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U2 R U R' U' R U2 L U' R' U R L'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-T3",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["EG-2 T", "Adjacent swap back-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R U' R U L U' R' U L'",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-T4",
        setupMoves: "F' L F L' U' L' U L",
        recognition: ["EG-2 T", "Adjacent swap front-left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U L U R' U' R L'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-T5",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["EG-2 T", "Adjacent swap back-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "U' R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 16,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-T6",
        setupMoves: "R' U' R' F R F' R",
        recognition: ["EG-2 T", "Diagonal swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R F' U' R U R' U' F R'",
            moveCount: 9,
            popularity: 90,
            isDefault: true,
          },
        ],
      },

      // ===== L ORIENTATION (5 cases) =====
      {
        caseName: "EG2-L1",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["EG-2 L", "No swap needed"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' R' U R U' R' U' R U' R' U R F",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-L2",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["EG-2 L", "Adjacent swap front-right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R F R U R' U' F'",
            moveCount: 18,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-L3",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["EG-2 L", "Adjacent swap back-right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R F R' U' R U R F' R2 U R U2 R'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-L4",
        setupMoves: "L' U' L U' L' U L U' L' U2 L",
        recognition: ["EG-2 L", "Adjacent swap front-left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "L' F' L U L' U' L' F L2 U' L' U2 L",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "EG2-L5",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["EG-2 L", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U R F R U R' U' F'",
            moveCount: 18,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < eg2Data.length; i++) {
      const data = eg2Data[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: eg2SetId,
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
      message: "Successfully seeded EG-2 algorithms",
      count: eg2Data.length,
    };
  },
});
