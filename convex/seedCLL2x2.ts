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

// This mutation seeds the database with CLL (Corners of Last Layer) algorithms for 2x2
// CLL is used after solving the first layer on a 2x2 cube - 42 algorithms
export const seedCLL2x2Algorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "CLL (2x2)"))
      .first();

    if (existing) {
      return { message: "CLL 2x2 algorithms already seeded" };
    }

    const now = Date.now();

    // Create CLL 2x2 set
    const cllSetId = await ctx.db.insert("algorithmSets", {
      name: "CLL",
      slug: "cll-2x2",
      category: "2x2",
      description:
        "Corners of Last Layer for 2x2 - 42 algorithms to solve the last layer corners in one step after solving the first layer",
      caseCount: 42,
      difficulty: "intermediate",
      puzzleType: "2x2x2",
      order: 10,
      isPublished: true,
      createdAt: now,
    });

    // CLL Cases grouped by corner orientation type
    // 7 orientation groups: Sune, Antisune, H, Pi, U, T, L
    const cllData = [
      // ===== SUNE CASES (6 cases) =====
      {
        caseName: "S1",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["Sune orientation", "All corners solved"],
        difficulty: 3,
        frequency: 5,
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
        caseName: "S2",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["Sune orientation", "Adjacent swap right"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "F R' F' R U2 R U2 R'",
            moveCount: 8,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "S3",
        setupMoves: "L' U2 L U L' U L",
        recognition: ["Sune orientation", "Adjacent swap left"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U2 L U L' U L",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R U R' U R U2 R' U' R U' L' U R' U' L",
            moveCount: 15,
            popularity: 60,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "S4",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["Sune orientation", "Diagonal swap"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "S5",
        setupMoves: "R' F R F' R U' R' U R U' R' U2 R U' R'",
        recognition: ["Sune orientation", "Back adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R F' R U' R' U R U' R' U2 R U' R'",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
          {
            notation: "F R U R' U' R U R' U' F'",
            moveCount: 10,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "S6",
        setupMoves: "R U' L' U R' U' L",
        recognition: ["Sune orientation", "Front adjacent swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' L' U R' U' L",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },

      // ===== ANTISUNE CASES (6 cases) =====
      {
        caseName: "AS1",
        setupMoves: "R U' R' U' R U R' U' R U2 R'",
        recognition: ["Antisune orientation", "All corners solved"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS2",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["Antisune orientation", "Adjacent swap right"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R2 D R' U R D' R' U R' U' R U' R'",
            moveCount: 13,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "AS3",
        setupMoves: "L U2 L' U' L U' L'",
        recognition: ["Antisune orientation", "Adjacent swap left"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L U2 L' U' L U' L'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS4",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["Antisune orientation", "Diagonal swap"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS5",
        setupMoves: "R' U R U2 R' U R U2 R' U2 R",
        recognition: ["Antisune orientation", "Back adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' L' U' L U' L' U L U' L' U2 L F",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
          {
            notation: "R' U R U2 R' U R U2 R' U2 R",
            moveCount: 11,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "AS6",
        setupMoves: "L' U R U' L U R'",
        recognition: ["Antisune orientation", "Front adjacent swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U R U' L U R'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },

      // ===== H CASES (4 cases) =====
      {
        caseName: "H1",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["H orientation", "All corners solved"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "F R U R' U' R U R' U' R U R' U' F'",
            moveCount: 14,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "H2",
        setupMoves: "R U2 R' U' R U R' U' R U' R'",
        recognition: ["H orientation", "Adjacent swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "F R U' R' U R U2 R' U' R U R' U' F'",
            moveCount: 14,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "H3",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["H orientation", "Diagonal swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F'",
            moveCount: 10,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H4",
        setupMoves: "R U R' U R U2 R' F R U R' U' F'",
        recognition: ["H orientation", "Opposite adjacent swap"],
        difficulty: 5,
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

      // ===== PI CASES (6 cases) =====
      {
        caseName: "Pi1",
        setupMoves: "R U2 R2 U' R2 U' R2 U2 R",
        recognition: ["Pi orientation", "All corners solved"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R2 U' R2 U' R2 U2 R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "F R U R' U' R U R' U' F'",
            moveCount: 10,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "Pi2",
        setupMoves: "R' U' R' F R F' R U' R' U2 R",
        recognition: ["Pi orientation", "Adjacent swap right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R' F R F' R U' R' U2 R",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
          {
            notation: "F R' F' R U2 F R' F' R U2 R",
            moveCount: 11,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "Pi3",
        setupMoves: "R U2 R' U' R U R' U2 L' U R U' R' L",
        recognition: ["Pi orientation", "Adjacent swap left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U2 L' U R U' R' L",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
          {
            notation: "R' F R F' R U2 R' U' F R' F' R",
            moveCount: 12,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "Pi4",
        setupMoves: "F R U R' U' F' R' U' R U' R' U2 R",
        recognition: ["Pi orientation", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U R' U' F' R' U' R U' R' U2 R",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
          {
            notation: "R' F R F' R' F R F' R U R' U' R U R'",
            moveCount: 15,
            popularity: 65,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "Pi5",
        setupMoves: "R U2 R' U' R U' R' U2 R' U' R U' R' U2 R",
        recognition: ["Pi orientation", "Back adjacent swap"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U R' U' R U R' U' F'",
            moveCount: 15,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi6",
        setupMoves: "R U R' U R U' R' U R U' R' U R U2 R'",
        recognition: ["Pi orientation", "Front adjacent swap"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R2 U R' U' R U R' U' F' R U' R'",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
        ],
      },

      // ===== U CASES (6 cases) =====
      {
        caseName: "U1",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["U orientation", "All corners solved"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R2 D R' U2 R D' R' U2 R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R2 F2 R U2 R U2 R' F2 R U' R' U R",
            moveCount: 13,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "U2",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["U orientation", "Adjacent swap right"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U2 R' U' R U R' U R U2 R'",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
          {
            notation: "F R U R' U' F' R U R' U R U2 R'",
            moveCount: 13,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "U3",
        setupMoves: "L U L' U L U2 L'",
        recognition: ["U orientation", "Adjacent swap left"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L U L' U L U2 L'",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R' U2 R' D' R U2 R' D R2",
            moveCount: 9,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "U4",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["U orientation", "Diagonal swap"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F'",
            moveCount: 9,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U5",
        setupMoves: "R2 D' R U2 R' D R U2 R",
        recognition: ["U orientation", "Back adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R2 D' R U2 R' D R U2 R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "U6",
        setupMoves: "R' U' R U' R' U R U' R' U2 R",
        recognition: ["U orientation", "Front adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
          {
            notation: "R U R' F' R U R' U' R' F R U' R' F R F'",
            moveCount: 16,
            popularity: 60,
            isDefault: false,
          },
        ],
      },

      // ===== T CASES (6 cases) =====
      {
        caseName: "T1",
        setupMoves: "R U R' U' R' F R F'",
        recognition: ["T orientation", "All corners solved"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R' F R F'",
            moveCount: 8,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T2",
        setupMoves: "L' U' L U L F' L' F",
        recognition: ["T orientation", "Adjacent swap right"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L' U' L U L F' L' F",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R U R D R' U R D' R2",
            moveCount: 9,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "T3",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["T orientation", "Adjacent swap left"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R' F' R U R U' R'",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T4",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["T orientation", "Diagonal swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
          {
            notation: "R2 D' R U' R' D R U' R' U R' U R U' R",
            moveCount: 15,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "T5",
        setupMoves: "R' F R F' R U R' U' R U R' U' R U R'",
        recognition: ["T orientation", "Back adjacent swap"],
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
        caseName: "T6",
        setupMoves: "R U' R' U' R U R D R' U' R D' R2",
        recognition: ["T orientation", "Front adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U' R U R D R' U' R D' R2",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
          {
            notation: "R' U R U2 R' U' R U2 R' U R",
            moveCount: 11,
            popularity: 80,
            isDefault: false,
          },
        ],
      },

      // ===== L CASES (6 cases) =====
      {
        caseName: "L1",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["L orientation", "All corners solved"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F'",
            moveCount: 9,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L2",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["L orientation", "Adjacent swap right"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R' F' R U R U' R'",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L3",
        setupMoves: "R U R' U R U' R' U R U' R' U R U2 R'",
        recognition: ["L orientation", "Adjacent swap left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U' R' U R U2 R'",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
          {
            notation: "R' U' R U' R' U R U' R' U2 R",
            moveCount: 11,
            popularity: 85,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "L4",
        setupMoves: "R U2 R' U' R U' R' U2 R U R' U R U2 R'",
        recognition: ["L orientation", "Diagonal swap"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' R U R' U' F'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
          {
            notation: "R U2 R' U' R U' R' U2 R U R' U R U2 R'",
            moveCount: 15,
            popularity: 65,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "L5",
        setupMoves: "R' U' R U R' U2 R U R' U R",
        recognition: ["L orientation", "Back adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U R' U2 R U R' U R",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L6",
        setupMoves: "R U R' U' R U2 R' U' R U R'",
        recognition: ["L orientation", "Front adjacent swap"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R U2 R' U' R U R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },

      // ===== SOLVED CORNER ORIENTATION (2 additional cases for permutation) =====
      {
        caseName: "O1",
        setupMoves: "R U R' F' R U R' U' R' F R2 U' R'",
        recognition: ["All corners oriented", "Adjacent swap"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' F' R U R' U' R' F R2 U' R'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      {
        caseName: "O2",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["All corners oriented", "Diagonal swap"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 75,
            isDefault: true,
          },
          {
            notation: "R U R' U' R' F R2 U' R' U R U R' U' F'",
            moveCount: 15,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < cllData.length; i++) {
      const data = cllData[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: cllSetId,
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
      message: "Successfully seeded CLL 2x2 algorithms",
      count: cllData.length,
    };
  },
});
