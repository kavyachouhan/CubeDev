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

// This mutation seeds the database with COLL (Corners and Orientation of Last Layer) algorithms
export const seedCOLLAlgorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "COLL"))
      .first();

    if (existing) {
      return { message: "COLL algorithms already seeded" };
    }

    const now = Date.now();

    // Create COLL set
    const collSetId = await ctx.db.insert("algorithmSets", {
      name: "COLL",
      slug: "coll",
      category: "CFOP",
      description:
        "Corners and Orientation of Last Layer - 42 algorithms to solve corners while edges are already oriented",
      caseCount: 42,
      difficulty: "advanced",
      puzzleType: "3x3x3",
      order: 3,
      isPublished: true,
      createdAt: now,
    });

    // COLL Cases grouped by edge permutation type
    const collData = [
      // AS - Adjacent Swap (7 cases)
      {
        caseName: "AS1",
        setupMoves: "R U R' U' R' F R2 U' R' U' R U R' F'",
        recognition: ["Two adjacent corners swapped", "Headlights on left"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U' R' U' R U R' F'",
            moveCount: 14,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS2",
        setupMoves: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
        recognition: ["Two adjacent corners swapped", "Headlights on right"],
        difficulty: 7,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U' R U R' F' R U R' U' R' F R F'",
            moveCount: 17,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS3",
        setupMoves: "r U R' U' r' R U R U' R'",
        recognition: ["Two adjacent corners swapped", "Bar on back"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' R U R U' R'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS4",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["Two adjacent corners swapped", "Sune variant"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS5",
        setupMoves: "R U2 R' U' R U R' U' R U' R'",
        recognition: ["Two adjacent corners swapped", "Anti-sune variant"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "AS6",
        setupMoves: "R U R' U R U2 R' F R U R' U' F'",
        recognition: ["Two adjacent corners swapped", "Double sune"],
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
        caseName: "AS7",
        setupMoves: "R U2 R2 F R F' U2 R' F R F'",
        recognition: ["Two adjacent corners swapped", "Dot pattern"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R2 F R F' U2 R' F R F'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      // H - Headlights (4 cases)
      {
        caseName: "H1",
        setupMoves: "R U R' U R U' R' U R U2 R'",
        recognition: ["Opposite corners swapped", "Sune with headlights"],
        difficulty: 4,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U' R' U R U2 R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H2",
        setupMoves: "R U2 R' U' R U R' U' R U' R'",
        recognition: ["Opposite corners swapped", "Anti-sune with headlights"],
        difficulty: 4,
        frequency: 5,
        algorithms: [
          {
            notation: "R U2 R' U' R U R' U' R U' R'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H3",
        setupMoves: "F R U' R' U R U2 R' U' R U R' U' F'",
        recognition: ["Opposite corners swapped", "Symmetric"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U' R' U R U2 R' U' R U R' U' F'",
            moveCount: 14,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "H4",
        setupMoves: "R U R' U R U' y R U' R' F'",
        recognition: ["Opposite corners swapped", "Double headlights"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' y R U' R' F'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // L - Front diagonal swap (12 cases)
      {
        caseName: "L1",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["Diagonal corners swapped", "Anti-sune"],
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
        caseName: "L2",
        setupMoves: "F R U' R' U R U R' U R U' R' F'",
        recognition: ["Diagonal corners swapped", "Double sexy"],
        difficulty: 6,
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
        caseName: "L3",
        setupMoves: "R' F R U R U' R2 F' R2 U' R' U R U R'",
        recognition: ["Diagonal corners swapped", "Complex pattern"],
        difficulty: 7,
        frequency: 2,
        algorithms: [
          {
            notation: "R' F R U R U' R2 F' R2 U' R' U R U R'",
            moveCount: 15,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L4",
        setupMoves: "r U R' U' r' F R F'",
        recognition: ["Diagonal corners swapped", "Wide move sexy"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' F R F'",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L5",
        setupMoves: "R' F2 r U r' F R",
        recognition: ["Diagonal corners swapped", "Short alg"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F2 r U r' F R",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L6",
        setupMoves: "R U R' U R U' R' U' R' F R F'",
        recognition: ["Diagonal corners swapped", "Mixed pattern"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' R' U' R' F R F'",
            moveCount: 12,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      // More L cases
      {
        caseName: "L7",
        setupMoves: "R U R' U' R' F R2 U R' U' F'",
        recognition: ["Diagonal corners swapped", "T-perm variant"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U R' U' F'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L8",
        setupMoves: "r U R' U' r' R U R U' R'",
        recognition: ["Diagonal corners swapped", "Lightning bolt"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' R U R U' R'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L9",
        setupMoves: "R' U' R U' R' U2 R F R U R' U' F'",
        recognition: ["Diagonal corners swapped", "Bowtie"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R F R U R' U' F'",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L10",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["Diagonal corners swapped", "Sune"],
        difficulty: 3,
        frequency: 5,
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
        caseName: "L11",
        setupMoves: "f R U R' U' R U R' U' f'",
        recognition: ["Diagonal corners swapped", "Sledgehammer"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "f R U R' U' R U R' U' f'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "L12",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["Diagonal corners swapped", "Simple"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R' F' R U R U' R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // Pi - No corner swap (9 cases)
      {
        caseName: "Pi1",
        setupMoves: "R U2 R2 U' R2 U' R2 U2 R",
        recognition: ["No corner swap", "Bar"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R2 U' R2 U' R2 U2 R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi2",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["No corner swap", "Double sexy move"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi3",
        setupMoves: "R' U' F U R U' R' F' R",
        recognition: ["No corner swap", "Knight move"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' F U R U' R' F' R",
            moveCount: 9,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi4",
        setupMoves: "r U R' U' r' F R F'",
        recognition: ["No corner swap", "Wide OLL"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' F R F'",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi5",
        setupMoves: "R U R' U R' F R F' R U2 R'",
        recognition: ["No corner swap", "P shape"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R' F R F' R U2 R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi6",
        setupMoves: "R' F R U R' F' R y' R U' R'",
        recognition: ["No corner swap", "Niklas"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R U R' F' R y' R U' R'",
            moveCount: 10,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi7",
        setupMoves: "R U2 R' U' R U' R' F R U R' U' F'",
        recognition: ["No corner swap", "Extended"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' F R U R' U' F'",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi8",
        setupMoves: "R U R' U' R' F R F'",
        recognition: ["No corner swap", "Sledgehammer"],
        difficulty: 4,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U' R' F R F'",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "Pi9",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["No corner swap", "Cross"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "F R U R' U' R U R' U' F'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // T - Adjacent corners same (10 cases)
      {
        caseName: "T1",
        setupMoves: "R U R' U' R' F R F'",
        recognition: ["Two corners same on front", "Sledgehammer"],
        difficulty: 4,
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
        setupMoves: "F R U R' U' F'",
        recognition: ["Two corners same on front", "Sexy sledge"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' F'",
            moveCount: 6,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T3",
        setupMoves: "r U R' U' r' R U R U' R'",
        recognition: ["Two corners same on back", "Lightning"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U' r' R U R U' R'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T4",
        setupMoves: "r' U' R U' R' U2 r",
        recognition: ["Two corners same on right", "Double wide"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r' U' R U' R' U2 r",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T5",
        setupMoves: "r U R' U R U2 r'",
        recognition: ["Two corners same on left", "Double wide mirror"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U R U2 r'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T6",
        setupMoves: "F R' F' R U R U' R'",
        recognition: ["Two corners same diagonal", "Square"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F R' F' R U R U' R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T7",
        setupMoves: "R' U' R U' R' U2 R",
        recognition: ["Two corners same diagonal", "Anti-sune short"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "R' U' R U' R' U2 R",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T8",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["Two corners same diagonal", "Sune short"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "R U R' U R U2 R'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T9",
        setupMoves: "R U R' U' R' F R2 U R' U' F'",
        recognition: ["Two corners same opposite", "T-perm top"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U R' U' F'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "T10",
        setupMoves: "F R U R' U' F'",
        recognition: ["Two corners same opposite", "Cross"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "F R U R' U' F'",
            moveCount: 6,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < collData.length; i++) {
      const data = collData[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: collSetId,
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
      message: "Successfully seeded COLL algorithms",
      count: collData.length,
    };
  },
});
