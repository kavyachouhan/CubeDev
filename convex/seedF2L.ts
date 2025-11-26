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

// This mutation seeds the database with F2L (First Two Layers) algorithms
export const seedF2LAlgorithms = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if already seeded
    const existing = await ctx.db
      .query("algorithmSets")
      .filter((q) => q.eq(q.field("name"), "F2L"))
      .first();

    if (existing) {
      return { message: "F2L algorithms already seeded" };
    }

    const now = Date.now();

    // Create F2L set
    const f2lSetId = await ctx.db.insert("algorithmSets", {
      name: "F2L",
      slug: "f2l",
      category: "CFOP",
      description:
        "First Two Layers - 42 algorithms to efficiently pair and insert corners with edges",
      caseCount: 42,
      difficulty: "intermediate",
      order: 4,
      isPublished: true,
      createdAt: now,
    });

    // F2L Cases and Algorithms
    const f2lData = [
      // Basic Cases - Corner and edge separated
      {
        caseName: "F2L 1",
        setupMoves: "U R U' R'",
        recognition: ["Corner in top", "Edge in top", "Both white facing up"],
        difficulty: 2,
        frequency: 5,
        algorithms: [
          {
            notation: "U R U' R'",
            moveCount: 4,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 2",
        setupMoves: "F' U' F",
        recognition: ["Corner in top", "Edge in top", "Basic case mirror"],
        difficulty: 2,
        frequency: 5,
        algorithms: [
          {
            notation: "F' U' F",
            moveCount: 3,
            popularity: 95,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 3",
        setupMoves: "U' R U R'",
        recognition: ["Corner white right", "Edge white top"],
        difficulty: 2,
        frequency: 5,
        algorithms: [
          {
            notation: "U' R U R'",
            moveCount: 4,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 4",
        setupMoves: "U' F' U F",
        recognition: ["Corner white left", "Edge white top"],
        difficulty: 2,
        frequency: 5,
        algorithms: [
          {
            notation: "U' F' U F",
            moveCount: 4,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 5",
        setupMoves: "R U R' U' R U R'",
        recognition: ["Corner white up", "Edge colored top"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U' R U R'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 6",
        setupMoves: "F' U' F U F' U' F",
        recognition: ["Corner white up mirror", "Edge colored top"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "F' U' F U F' U' F",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 7",
        setupMoves: "U' R U' R' U R U R'",
        recognition: ["Corner colored right", "Edge white front"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U' R U' R' U R U R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 8",
        setupMoves: "U F' U F U' F' U' F",
        recognition: ["Corner colored left", "Edge white front"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U F' U F U' F' U' F",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 9",
        setupMoves: "U R U2 R' U R U' R'",
        recognition: ["Both pieces white up", "Not matching"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U R U2 R' U R U' R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 10",
        setupMoves: "U' F' U2 F U' F' U F",
        recognition: ["Both pieces white up mirror"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U' F' U2 F U' F' U F",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // Corner in slot, edge in top
      {
        caseName: "F2L 11",
        setupMoves: "R U' R' U' R U R' U' R U R'",
        recognition: ["Corner in slot white front", "Edge in top"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U' R U R' U' R U R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 12",
        setupMoves: "R U R' U R U' R'",
        recognition: ["Corner in slot correctly", "Edge needs insert"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U R U' R'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 13",
        setupMoves: "R U' R' U R U' R'",
        recognition: ["Corner in slot", "Edge white top"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "R U' R' U R U' R'",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 14",
        setupMoves: "F' U F U' F' U F",
        recognition: ["Corner in slot left", "Edge white top"],
        difficulty: 3,
        frequency: 4,
        algorithms: [
          {
            notation: "F' U F U' F' U F",
            moveCount: 7,
            popularity: 90,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 15",
        setupMoves: "U' R U2 R' U2 R U' R'",
        recognition: ["Corner white right in slot", "Edge setup needed"],
        difficulty: 4,
        frequency: 3,
        algorithms: [
          {
            notation: "U' R U2 R' U2 R U' R'",
            moveCount: 8,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 16",
        setupMoves: "U F' U2 F U2 F' U F",
        recognition: ["Corner white left in slot", "Edge setup needed"],
        difficulty: 4,
        frequency: 3,
        algorithms: [
          {
            notation: "U F' U2 F U2 F' U F",
            moveCount: 8,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      // Edge in slot, corner in top
      {
        caseName: "F2L 17",
        setupMoves: "R U R' U' U' R U R' U' R U R'",
        recognition: ["Edge in slot wrong", "Corner in top"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' U' R U R' U' R U R'",
            moveCount: 12,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 18",
        setupMoves: "R U' R' U R U' R' U R U' R'",
        recognition: ["Edge in slot correct", "Corner white up"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U' R' U R U' R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 19",
        setupMoves: "U R U2 R' U F' U' F",
        recognition: ["Edge in slot", "Corner colored up"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U R U2 R' U F' U' F",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 20",
        setupMoves: "U' F' U2 F U' R U R'",
        recognition: ["Edge in slot mirror", "Corner colored up"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U' F' U2 F U' R U R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      // Both in slot incorrectly
      {
        caseName: "F2L 21",
        setupMoves: "R U' R' U2 F' U' F",
        recognition: ["Both in slot", "Edge flipped"],
        difficulty: 4,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U2 F' U' F",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 22",
        setupMoves: "F' U F U2 R U R'",
        recognition: ["Both in slot mirror", "Edge flipped"],
        difficulty: 4,
        frequency: 3,
        algorithms: [
          {
            notation: "F' U F U2 R U R'",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 23",
        setupMoves: "R U' R' U R U' R' U2 R U' R'",
        recognition: ["Both in slot", "Corner twisted"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U' R' U2 R U' R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 24",
        setupMoves: "F' U F U' F' U F U2 F' U F",
        recognition: ["Both in slot", "Corner twisted mirror"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' U F U' F' U F U2 F' U F",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      // Weird cases
      {
        caseName: "F2L 25",
        setupMoves: "R U2 R' U' R U R'",
        recognition: ["Corner and edge separated", "Special orientation"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U2 R' U' R U R'",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 26",
        setupMoves: "F' U2 F U F' U' F",
        recognition: ["Corner and edge separated mirror"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "F' U2 F U F' U' F",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 27",
        setupMoves: "R U R' U' R U R' U' R U R'",
        recognition: ["Paired incorrectly", "Need reorientation"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R U R' U' R U R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 28",
        setupMoves: "F' U' F U F' U' F U F' U' F",
        recognition: ["Paired incorrectly mirror"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "F' U' F U F' U' F U F' U' F",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      // Advanced insertion cases
      {
        caseName: "F2L 29",
        setupMoves: "R U' R' U' R U R' U R U' R'",
        recognition: ["Tricky pair", "Multiple U moves"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U' R U R' U R U' R'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 30",
        setupMoves: "R U R' U2 R U' R'",
        recognition: ["Setup and insert"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "R U R' U2 R U' R'",
            moveCount: 7,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 31",
        setupMoves: "R U2 R' U2 R U' R'",
        recognition: ["Double setup"],
        difficulty: 4,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U2 R U' R'",
            moveCount: 7,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 32",
        setupMoves: "R U R' U' U' R U2 R' U' R U R'",
        recognition: ["Complex reorientation"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R U R' U' U' R U2 R' U' R U R'",
            moveCount: 12,
            popularity: 70,
            isDefault: true,
          },
        ],
      },
      // More advanced cases
      {
        caseName: "F2L 33",
        setupMoves: "R U' R' U2 R U2 R' U R U' R'",
        recognition: ["Advanced pairing"],
        difficulty: 6,
        frequency: 2,
        algorithms: [
          {
            notation: "R U' R' U2 R U2 R' U R U' R'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 34",
        setupMoves: "U' R U R' U2 R U' R'",
        recognition: ["Setup with U prime"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U' R U R' U2 R U' R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 35",
        setupMoves: "U R U2 R' U' R U R'",
        recognition: ["Alternative basic"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U R U2 R' U' R U R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 36",
        setupMoves: "U' R U' R' U2 R U' R'",
        recognition: ["Modified basic"],
        difficulty: 4,
        frequency: 4,
        algorithms: [
          {
            notation: "U' R U' R' U2 R U' R'",
            moveCount: 8,
            popularity: 85,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 37",
        setupMoves: "R U R' U2 R U R' U R U' R'",
        recognition: ["Extended pair"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U2 R U R' U R U' R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 38",
        setupMoves: "R U' R' U R U2 R' U R U' R'",
        recognition: ["Varied approach"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U R U2 R' U R U' R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 39",
        setupMoves: "R U R' U' R U' R' U R U R'",
        recognition: ["Alternate insertion"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U' R U' R' U R U R'",
            moveCount: 11,
            popularity: 80,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 40",
        setupMoves: "R U2 R' U' R U' R' U R U' R'",
        recognition: ["Complex setup"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U2 R' U' R U' R' U R U' R'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 41",
        setupMoves: "R U' R' U' R U2 R' U' R U R'",
        recognition: ["Tricky orientation"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U' R' U' R U2 R' U' R U R'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
      {
        caseName: "F2L 42",
        setupMoves: "R U R' U2 R U' R' U' R U R'",
        recognition: ["Final case"],
        difficulty: 5,
        frequency: 3,
        algorithms: [
          {
            notation: "R U R' U2 R U' R' U' R U R'",
            moveCount: 11,
            popularity: 75,
            isDefault: true,
          },
        ],
      },
    ];

    // Insert all cases and algorithms
    for (let i = 0; i < f2lData.length; i++) {
      const data = f2lData[i];

      const caseId = await ctx.db.insert("algorithmCases", {
        setId: f2lSetId,
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
      message: "Successfully seeded F2L algorithms",
      count: f2lData.length,
    };
  },
});
