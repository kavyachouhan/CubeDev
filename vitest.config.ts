import path from "node:path";
import { defineConfig } from "vitest/config";

const alias = { "@": path.resolve(__dirname, ".") };

export default defineConfig({
  resolve: { alias },
  test: {
    setupFiles: ["./tests/setup/env.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json-summary"],
      include: ["lib/**/*.ts", "convex/**/*.ts", "app/api/**/*.ts"],
      exclude: [
        "convex/_generated/**",
        "convex/seed*.ts",
        "convex/updateZBLL.ts",
        "**/*.test.ts",
      ],
    },
    projects: [
      {
        resolve: { alias },
        test: {
          name: "node",
          include: [
            "tests/unit/**/*.test.ts",
            "tests/api/**/*.test.ts",
            "tests/security/**/*.test.ts",
          ],
          exclude: ["tests/security/**/*.convex.test.ts"],
          environment: "node",
          setupFiles: ["./tests/setup/env.ts"],
        },
      },
      {
        resolve: { alias },
        test: {
          name: "convex",
          include: [
            "tests/convex/**/*.test.ts",
            "tests/security/**/*.convex.test.ts",
          ],
          environment: "edge-runtime",
          setupFiles: ["./tests/setup/env.ts"],
          server: {
            deps: {
              inline: ["convex-test"],
            },
          },
          testTimeout: 30000,
        },
      },
    ],
  },
});