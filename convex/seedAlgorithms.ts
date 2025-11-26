import { v } from "convex/values";
import { mutation } from "./_generated/server";

// Helper function to create URL-friendly slugs
function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]+/g, "") // Remove non-word chars except hyphens
    .replace(/--+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-+/, "") // Trim hyphens from start
    .replace(/-+$/, ""); // Trim hyphens from end
}

// This mutation seeds the database with PLL algorithms
export const seedPLLAlgorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "PLL"))
      .first();

    if (existing) {
      return { message: "PLL algorithms already seeded" };
    }

    const now = Date.now();

    // Create PLL set
    const pllSetId = await ctx.db.insert("algorithmSets", {
      name: "PLL",
      slug: "pll",
      category: "CFOP",
      description:
        "Permutation of Last Layer - 21 algorithms to solve the last layer after OLL",
      caseCount: 21,
      difficulty: "intermediate",
      order: 1,
      isPublished: true,
      createdAt: now,
    });

    // PLL Cases and Algorithms
    const pllData = [
      // Aa Perm
      {
        caseName: "Aa Perm",
        setupMoves: "x R' U R' D2 R U' R' D2 R2 x'",
        recognition: [
          "Three edges solved",
          "Headlights on left",
          "Two corners need swap on right",
        ],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "x R' U R' D2 R U' R' D2 R2 x'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R' F R' B2 R F' R' B2 R2",
            moveCount: 9,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // Ab Perm
      {
        caseName: "Ab Perm",
        setupMoves: "x R2 D2 R U R' D2 R U' R x'",
        recognition: [
          "Three edges solved",
          "Headlights on right",
          "Two corners need swap on left",
        ],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "x R2 D2 R U R' D2 R U' R x'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R2 B2 R F R' B2 R F' R",
            moveCount: 9,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // E Perm
      {
        caseName: "E Perm",
        setupMoves: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
        recognition: ["No edges solved", "Headlights on opposite sides"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "x' R U' R' D R U R' D' R U R' D R U' R' D' x",
            moveCount: 15,
            popularity: 80,
            isDefault: true,
          },
          {
            notation: "R B' R F R' B R F' R' F R' B' R F' R B R2",
            moveCount: 17,
            popularity: 60,
            isDefault: false,
          },
        ],
      },
      // F Perm
      {
        caseName: "F Perm",
        setupMoves: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
        recognition: ["Two edges solved on opposite sides", "No headlights"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' F' R U R' U' R' F R2 U' R' U' R U R' U R",
            moveCount: 18,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R' U2 R' U' y R' U' R' U y' R U R' U R",
            moveCount: 13,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // Ga Perm
      {
        caseName: "Ga Perm",
        setupMoves: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
        recognition: ["Two adjacent edges solved", "Block on left"],
        difficulty: 7,
        frequency: 4,
        algorithms: [
          {
            notation: "R2 U R' U R' U' R U' R2 D U' R' U R D'",
            moveCount: 15,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R2 u R' U R' U' R u' R2 y' R' U R",
            moveCount: 12,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      // Gb Perm
      {
        caseName: "Gb Perm",
        setupMoves: "R' U' R U D' R2 U R' U R U' R U' R2 D",
        recognition: ["Two adjacent edges solved", "Block on right"],
        difficulty: 7,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R U D' R2 U R' U R U' R U' R2 D",
            moveCount: 15,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R' U' R y R2 u R' U R U' R u' R2",
            moveCount: 12,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      // Gc Perm
      {
        caseName: "Gc Perm",
        setupMoves: "R2 U' R U' R U R' U R2 D' U R U' R' D",
        recognition: ["Two adjacent edges solved", "Bar on front"],
        difficulty: 7,
        frequency: 4,
        algorithms: [
          {
            notation: "R2 U' R U' R U R' U R2 D' U R U' R' D",
            moveCount: 15,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R2 F2 R U2 R U2 R' F R U R' U' R' F R2",
            moveCount: 15,
            popularity: 60,
            isDefault: false,
          },
        ],
      },
      // Gd Perm
      {
        caseName: "Gd Perm",
        setupMoves: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
        recognition: ["Two adjacent edges solved", "Bar on back"],
        difficulty: 7,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' D R2 U' R U' R' U R' U R2 D'",
            moveCount: 15,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R U R' y' R2 u' R U' R' U R' u R2",
            moveCount: 12,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      // H Perm
      {
        caseName: "H Perm",
        setupMoves: "M2 U M2 U2 M2 U M2",
        recognition: [
          "Opposite edge pairs swapped",
          "Opposite corner pairs swapped",
        ],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U M2 U2 M2 U M2",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
          {
            notation: "M2 U' M2 U2 M2 U' M2",
            moveCount: 7,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      // Ja Perm
      {
        caseName: "Ja Perm",
        setupMoves: "R' U L' U2 R U' R' U2 R L",
        recognition: ["Three edges solved", "Bar on left"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U L' U2 R U' R' U2 R L",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "L' U' L F L' U' L U L F' L2 U L",
            moveCount: 13,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // Jb Perm
      {
        caseName: "Jb Perm",
        setupMoves: "R U R' F' R U R' U' R' F R2 U' R'",
        recognition: ["Three edges solved", "Bar on right"],
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
            notation: "R U2 R' U' R U2 L' U R' U' L",
            moveCount: 11,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // Na Perm
      {
        caseName: "Na Perm",
        setupMoves: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
        recognition: ["Four edges need cycling", "Headlights on front"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U R U R' F' R U R' U' R' F R2 U' R' U2 R U' R'",
            moveCount: 22,
            popularity: 75,
            isDefault: true,
          },
          {
            notation: "z U R' D R2 U' R D' U R' D R2 U' R D' z'",
            moveCount: 13,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
      // Nb Perm
      {
        caseName: "Nb Perm",
        setupMoves: "R' U L' U2 R U' L R' U L' U2 R U' L",
        recognition: ["Four edges need cycling", "Headlights on back"],
        difficulty: 8,
        frequency: 2,
        algorithms: [
          {
            notation: "R' U L' U2 R U' L R' U L' U2 R U' L",
            moveCount: 14,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "z D' R U' R2 D R' U D' R U' R2 D R' U z'",
            moveCount: 13,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      // Ra Perm
      {
        caseName: "Ra Perm",
        setupMoves: "R U' R' U' R U R D R' U' R D' R' U2 R'",
        recognition: ["Bar on left", "Block on bottom right"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U' R U R D R' U' R D' R' U2 R'",
            moveCount: 15,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R U R' F' R U2 R' U2 R' F R U R U2 R'",
            moveCount: 15,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // Rb Perm
      {
        caseName: "Rb Perm",
        setupMoves: "R' U2 R U2 R' F R U R' U' R' F' R2",
        recognition: ["Bar on right", "Block on bottom left"],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U2 R U2 R' F R U R' U' R' F' R2",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R' U2 R' D' R U' R' D R U R U' R' U' R",
            moveCount: 15,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // T Perm
      {
        caseName: "T Perm",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["Headlights on left", "Block on right"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 90,
            isDefault: true,
          },
          {
            notation: "R2 U R2 U' R2 U' D R2 U' R2 U R2 D'",
            moveCount: 13,
            popularity: 65,
            isDefault: false,
          },
        ],
      },
      // Ua Perm
      {
        caseName: "Ua Perm",
        setupMoves: "M2 U M U2 M' U M2",
        recognition: ["Three edges need cycling clockwise", "Bar in back"],
        difficulty: 4,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U M U2 M' U M2",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R U' R U R U R U' R' U' R2",
            moveCount: 11,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      // Ub Perm
      {
        caseName: "Ub Perm",
        setupMoves: "M2 U' M U2 M' U' M2",
        recognition: [
          "Three edges need cycling counter-clockwise",
          "Bar in back",
        ],
        difficulty: 4,
        frequency: 5,
        algorithms: [
          {
            notation: "M2 U' M U2 M' U' M2",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "R2 U R U R' U' R' U' R' U R'",
            moveCount: 11,
            popularity: 75,
            isDefault: false,
          },
        ],
      },
      // V Perm
      {
        caseName: "V Perm",
        setupMoves: "R' U R' U' y R' F' R2 U' R' U R' F R F",
        recognition: ["Bar on left", "One solved corner"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U R' U' y R' F' R2 U' R' U R' F R F",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
          {
            notation: "R U' R U R' D R D' R U' D R2 U R2 D' R2",
            moveCount: 16,
            popularity: 65,
            isDefault: false,
          },
        ],
      },
      // Y Perm
      {
        caseName: "Y Perm",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["Bar on left", "Headlights on right diagonal"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "F R' F R2 U' R' U' R U R' F' R U R' U' F'",
            moveCount: 16,
            popularity: 70,
            isDefault: false,
          },
        ],
      },
      // Z Perm
      {
        caseName: "Z Perm",
        setupMoves: "M' U M2 U M2 U M' U2 M2",
        recognition: [
          "Adjacent edge pairs swapped",
          "Adjacent corner pairs swapped",
        ],
        difficulty: 6,
        frequency: 4,
        algorithms: [
          {
            notation: "M' U M2 U M2 U M' U2 M2",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
          {
            notation: "M2 U M2 U M' U2 M2 U2 M'",
            moveCount: 9,
            popularity: 80,
            isDefault: false,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < pllData.length; i++) {
      const data = pllData[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: pllSetId,
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
      message: "Successfully seeded PLL algorithms",
      count: pllData.length,
    };
  },
});
