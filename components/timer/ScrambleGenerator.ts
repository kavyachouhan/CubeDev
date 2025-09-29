"use client";

export interface ScrambleGenerator {
  generateScramble: (event: string) => Promise<string>;
}

export class CubingScrambleGenerator implements ScrambleGenerator {
  async generateScramble(event: string): Promise<string> {
    try {
      // Dynamically import cubing.js to avoid increasing initial bundle size
      const { randomScrambleForEvent } = await import("cubing/scramble");

      // Map event names to cubing.js event codes
      const eventMap: Record<string, string> = {
        "333": "333",
        "222": "222",
        "444": "444",
        "555": "555",
        "666": "666",
        "777": "777",
        "333oh": "333oh",
        "333bld": "333bf",
        "444bld": "444bf",
        "555bld": "555bf",
        "333mbld": "333mbf",
        "333fm": "333fm",
        pyram: "pyram",
        minx: "minx",
        skewb: "skewb",
        clock: "clock",
        sq1: "sq1",
      };

      const cubingEvent = eventMap[event] || "333";
      const scramble = await randomScrambleForEvent(cubingEvent);
      return scramble.toString();
    } catch (error) {
      console.error("Failed to generate scramble:", error);
      // Fallback: generate a random scramble manually
      return this.generateFallbackScramble(event);
    }
  }

  private generateFallbackScramble(event: string): string {
    const moves = ["R", "L", "U", "D", "F", "B"];
    const modifiers = ["", "'", "2"];

    const scrambleLength =
      event === "222"
        ? 9
        : event === "444"
          ? 40
          : event === "555"
            ? 60
            : event === "666"
              ? 80
              : event === "777"
                ? 100
                : event === "pyram"
                  ? 10
                  : event === "minx"
                    ? 70
                    : event === "skewb"
                      ? 10
                      : event === "sq1"
                        ? 12
                        : 20;

    let scramble = "";
    let lastMove = "";

    for (let i = 0; i < scrambleLength; i++) {
      let move;
      do {
        move = moves[Math.floor(Math.random() * moves.length)];
      } while (move === lastMove);

      const modifier = modifiers[Math.floor(Math.random() * modifiers.length)];
      scramble += move + modifier + " ";
      lastMove = move;
    }

    return scramble.trim();
  }
}

export const scrambleGenerator = new CubingScrambleGenerator();