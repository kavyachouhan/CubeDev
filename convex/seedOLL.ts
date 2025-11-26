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

// This mutation seeds the database with OLL (Orientation of Last Layer) algorithms
export const seedOLLAlgorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "OLL"))
      .first();

    if (existing) {
      return { message: "OLL algorithms already seeded" };
    }

    const now = Date.now();

    // Create OLL set
    const ollSetId = await ctx.db.insert("algorithmSets", {
      name: "OLL",
      slug: "oll",
      category: "CFOP",
      description:
        "Orientation of Last Layer - 57 algorithms to orient all pieces on the last layer",
      caseCount: 57,
      difficulty: "advanced",
      order: 2,
      isPublished: true,
      createdAt: now,
    });

    // OLL Cases and Algorithms (All 57 cases)
    const ollData = [
      // Dot Cases (4 cases)
      {
        caseName: "OLL 1",
        setupMoves: "R U2 R2 F R F' U2 R' F R F'",
        recognition: ["No edges oriented", "Dot pattern"],
        difficulty: 7,
        frequency: 2,
        algorithms: [
          {
            notation: "R U2 R2 F R F' U2 R' F R F'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 2",
        setupMoves: "F R U R' U' F' f R U R' U' f'",
        recognition: ["No edges oriented", "Symmetric dot"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "F R U R' U' F' f R U R' U' f'",
            moveCount: 12,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 3",
        setupMoves: "f R U R' U' f' U' F R U R' U' F'",
        recognition: ["No edges oriented", "Horizontal line in middle"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "f R U R' U' f' U' F R U R' U' F'",
            moveCount: 13,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 4",
        setupMoves: "f R U R' U' f' U F R U R' U' F'",
        recognition: ["No edges oriented", "Vertical line in middle"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "f R U R' U' f' U F R U R' U' F'",
            moveCount: 12,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // I Shape Cases (4 cases)
      {
        caseName: "OLL 5",
        setupMoves: "r' U2 R U R' U r",
        recognition: ["Two opposite edges oriented", "Small L shape"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r' U2 R U R' U r",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 6",
        setupMoves: "r U2 R' U' R U' r'",
        recognition: ["Two opposite edges oriented", "Mirror L shape"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r U2 R' U' R U' r'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      // L Shape Cases (10 cases)
      {
        caseName: "OLL 7",
        setupMoves: "r U R' U R U2 r'",
        recognition: ["Two edges oriented on left", "Small L"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r U R' U R U2 r'",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 8",
        setupMoves: "r' U' R U' R' U2 r",
        recognition: ["Two edges oriented on right", "Small L mirror"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "r' U' R U' R' U2 r",
            moveCount: 7,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 9",
        setupMoves: "R U R' U' R' F R2 U R' U' F'",
        recognition: ["Two edges on back", "Big L shape"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R' F R2 U R' U' F'",
            moveCount: 11,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 10",
        setupMoves: "R U R' U R' F R F' R U2 R'",
        recognition: ["Two edges on back", "Big L mirror"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R' F R F' R U2 R'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // P Shape Cases (4 cases)
      {
        caseName: "OLL 11",
        setupMoves: "r U R' U R' F R F' R U2 r'",
        recognition: ["Three edges oriented", "P shape on right"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "r U R' U R' F R F' R U2 r'",
            moveCount: 11,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 12",
        setupMoves: "F R U R' U' F' U F R U R' U' F'",
        recognition: ["Three edges oriented", "P shape on left"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "F R U R' U' F' U F R U R' U' F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      // T Shape Cases (4 cases)
      {
        caseName: "OLL 13",
        setupMoves: "F U R U' R' F'",
        recognition: ["Three edges oriented", "T shape"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "F U R U' R' F'",
            moveCount: 6,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 14",
        setupMoves: "R' F R U R' F' R F U' F'",
        recognition: ["Three edges oriented", "Wide T shape"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R' F R U R' F' R F U' F'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // C Shape Cases (2 cases)
      {
        caseName: "OLL 15",
        setupMoves: "r' U' r R' U' R U r' U r",
        recognition: ["Two adjacent edges oriented", "C shape"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "r' U' r R' U' R U r' U r",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 16",
        setupMoves: "r U r' R U R' U' r U' r'",
        recognition: ["Two adjacent edges oriented", "C shape mirror"],
        difficulty: 5,
        frequency: 4,
        algorithms: [
          {
            notation: "r U r' R U R' U' r U' r'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // W Shape Cases (2 cases)
      {
        caseName: "OLL 17",
        setupMoves: "R U R' U R' F R F' U2 R' F R F'",
        recognition: ["Two adjacent edges oriented", "W shape"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R' F R F' U2 R' F R F'",
            moveCount: 13,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 18",
        setupMoves: "r U R' U R U2 r2 U' R U' R' U2 r",
        recognition: ["Two adjacent edges oriented", "W shape variation"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "r U R' U R U2 r2 U' R U' R' U2 r",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      // Corners Oriented Cases (4 cases)
      {
        caseName: "OLL 19",
        setupMoves: "R' U2 F R U R' U' F2 U2 F R",
        recognition: ["All corners oriented", "Four oriented edges"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R' U2 F R U R' U' F2 U2 F R",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 20",
        setupMoves: "r U R' U' r' F R F'",
        recognition: ["All corners oriented", "Two oriented edges"],
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
      // Line Cases (6 cases)
      {
        caseName: "OLL 21",
        setupMoves: "F R U R' U' F'",
        recognition: ["Two opposite edges oriented", "Cross shape"],
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
        caseName: "OLL 22",
        setupMoves: "R U2 R2 U' R2 U' R2 U2 R",
        recognition: ["Two opposite edges oriented", "Bar"],
        difficulty: 4,
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
        caseName: "OLL 23",
        setupMoves: "R2 D R' U2 R D' R' U2 R'",
        recognition: ["Three edges oriented", "Headlights on left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R2 D R' U2 R D' R' U2 R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 24",
        setupMoves: "r U R' U' r' F R F'",
        recognition: ["Three edges oriented", "Headlights on right"],
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
        caseName: "OLL 25",
        setupMoves: "F' r U R' U' r' F R",
        recognition: ["Three edges oriented", "X pattern"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F' r U R' U' r' F R",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 26",
        setupMoves: "R U2 R' U' R U' R'",
        recognition: ["Three edges oriented", "Anti-sune"],
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
        caseName: "OLL 27",
        setupMoves: "R U R' U R U2 R'",
        recognition: ["Three edges oriented", "Sune"],
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
      // Lightning Bolt Cases (8 cases)
      {
        caseName: "OLL 28",
        setupMoves: "r U R' U' r' R U R U' R'",
        recognition: ["One edge oriented", "Lightning bolt"],
        difficulty: 5,
        frequency: 3,
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
        caseName: "OLL 29",
        setupMoves: "R U R' U' R U' R' F' U' F R U R'",
        recognition: ["One edge oriented", "Square on right"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R U' R' F' U' F R U R'",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 30",
        setupMoves: "F U R U2 R' U' R U R' F'",
        recognition: ["One edge oriented", "Square on left"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F U R U2 R' U' R U R' F'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 31",
        setupMoves: "R' U' F U R U' R' F' R",
        recognition: ["One edge oriented", "P shape with bar"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' F U R U' R' F' R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 32",
        setupMoves: "L U F' U' L' U L F L'",
        recognition: ["One edge oriented", "P shape mirror"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L U F' U' L' U L F L'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 33",
        setupMoves: "R U R' U' R' F R F'",
        recognition: ["One edge oriented", "T shape variant"],
        difficulty: 4,
        frequency: 4,
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
        caseName: "OLL 34",
        setupMoves: "R U R2 U' R' F R U R U' F'",
        recognition: ["One edge oriented", "C with bar"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R2 U' R' F R U R U' F'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 35",
        setupMoves: "R U2 R2 F R F' R U2 R'",
        recognition: ["One edge oriented", "Fish shape"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R2 F R F' R U2 R'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // All Edges Oriented Cases (8 cases)
      {
        caseName: "OLL 36",
        setupMoves: "L' U' L U' L' U L U L F' L' F",
        recognition: ["All edges oriented", "W pattern"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "L' U' L U' L' U L U L F' L' F",
            moveCount: 12,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 37",
        setupMoves: "F R U' R' U' R U R' F'",
        recognition: ["All edges oriented", "Fish shape"],
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
        caseName: "OLL 38",
        setupMoves: "R U R' U R U' R' U' R' F R F'",
        recognition: ["All edges oriented", "W with bar"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U R U' R' U' R' F R F'",
            moveCount: 12,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 39",
        setupMoves: "L F' L' U' L U F U' L'",
        recognition: ["All edges oriented", "Big lightning"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "L F' L' U' L U F U' L'",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 40",
        setupMoves: "R' F R U R' U' F' U R",
        recognition: ["All edges oriented", "Big lightning mirror"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R' F R U R' U' F' U R",
            moveCount: 9,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 41",
        setupMoves: "R U R' U R U2 R' F R U R' U' F'",
        recognition: ["All edges oriented", "Awkward shape"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U R U2 R' F R U R' U' F'",
            moveCount: 13,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 42",
        setupMoves: "R' U' R U' R' U2 R F R U R' U' F'",
        recognition: ["All edges oriented", "Awkward mirror"],
        difficulty: 6,
        frequency: 2,
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
        caseName: "OLL 43",
        setupMoves: "F' U' L' U L F",
        recognition: ["All edges oriented", "P with block"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "F' U' L' U L F",
            moveCount: 6,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 44",
        setupMoves: "F U R U' R' F'",
        recognition: ["All edges oriented", "P with block mirror"],
        difficulty: 3,
        frequency: 5,
        algorithms: [
          {
            notation: "F U R U' R' F'",
            moveCount: 6,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      // Corner Permutation Cases (12 cases)
      {
        caseName: "OLL 45",
        setupMoves: "F R U R' U' F'",
        recognition: ["All edges oriented", "T shape"],
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
        caseName: "OLL 46",
        setupMoves: "R' U' R' F R F' U R",
        recognition: ["All edges oriented", "C shape"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R' U' R' F R F' U R",
            moveCount: 8,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 47",
        setupMoves: "R' U' R' F R F' R' F R F' U R",
        recognition: ["All edges oriented", "L with bar"],
        difficulty: 6,
        frequency: 3,
        algorithms: [
          {
            notation: "R' U' R' F R F' R' F R F' U R",
            moveCount: 12,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 48",
        setupMoves: "F R U R' U' R U R' U' F'",
        recognition: ["All edges oriented", "Symmetric"],
        difficulty: 5,
        frequency: 3,
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
        caseName: "OLL 49",
        setupMoves: "r U' r2 U r2 U r2 U' r",
        recognition: ["All edges oriented", "Small L"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "r U' r2 U r2 U r2 U' r",
            moveCount: 9,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 50",
        setupMoves: "r' U r2 U' r2 U' r2 U r'",
        recognition: ["All edges oriented", "Small L mirror"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "r' U r2 U' r2 U' r2 U r'",
            moveCount: 9,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 51",
        setupMoves: "F U R U' R' U R U' R' F'",
        recognition: ["All edges oriented", "I shape"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F U R U' R' U R U' R' F'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 52",
        setupMoves: "R U R' U R U' y R U' R' F'",
        recognition: ["All edges oriented", "Small L extended"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U R U' y R U' R' F'",
            moveCount: 10,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 53",
        setupMoves: "r' U' R U' R' U R U' R' U2 r",
        recognition: ["All edges oriented", "Small frown"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "r' U' R U' R' U R U' R' U2 r",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 54",
        setupMoves: "r U R' U R U' R' U R U2 r'",
        recognition: ["All edges oriented", "Small frown mirror"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "r U R' U R U' R' U R U2 r'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 55",
        setupMoves: "R U2 R2 U' R U' R' U2 F R F'",
        recognition: ["All edges oriented", "I with bar"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R U2 R2 U' R U' R' U2 F R F'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 56",
        setupMoves: "r U r' U R U' R' U R U' R' r U' r'",
        recognition: ["All edges oriented", "Headlights"],
        difficulty: 7,
        frequency: 2,
        algorithms: [
          {
            notation: "r U r' U R U' R' U R U' R' r U' r'",
            moveCount: 14,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "OLL 57",
        setupMoves: "R U R' U' r R' U R U' r'",
        recognition: ["All edges oriented", "Arrow"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' r R' U R U' r'",
            moveCount: 10,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < ollData.length; i++) {
      const data = ollData[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: ollSetId,
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
      message: "Successfully seeded OLL algorithms",
      count: ollData.length,
    };
  },
});
