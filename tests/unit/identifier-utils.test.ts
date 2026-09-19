import { describe, expect, it } from "vitest";
import {
  canOpenWcaProfile,
  isCubeDevIdentifier,
  isWcaIdentifier,
  normalizeIdentifier,
} from "@/lib/identifier-utils";

describe("normalizeIdentifier", () => {
  it("trims and uppercases", () => {
    expect(normalizeIdentifier("  2018abcd01 ")).toBe("2018ABCD01");
  });
});

describe("isWcaIdentifier", () => {
  it("accepts canonical WCA IDs", () => {
    expect(isWcaIdentifier("2018TEST01")).toBe(true);
    expect(isWcaIdentifier("2018test01")).toBe(true);
  });

  it("rejects missing, short, unicode, and CubeDev IDs", () => {
    expect(isWcaIdentifier(undefined)).toBe(false);
    expect(isWcaIdentifier("")).toBe(false);
    expect(isWcaIdentifier("2018TEST")).toBe(false);
    expect(isWcaIdentifier("CD26ABC01")).toBe(false);
    expect(isWcaIdentifier("2018测试01")).toBe(false);
  });
});

describe("isCubeDevIdentifier / canOpenWcaProfile", () => {
  it("accepts CD + year + 3 letters + 2 digits", () => {
    expect(isCubeDevIdentifier("CD26ABC01")).toBe(true);
    expect(isCubeDevIdentifier("cd26abc01")).toBe(true);
  });

  it("rejects WCA IDs and junk", () => {
    expect(isCubeDevIdentifier("2018TEST01")).toBe(false);
    expect(isCubeDevIdentifier("CD2ABC01")).toBe(false);
    expect(isCubeDevIdentifier("")).toBe(false);
  });

  it("only opens WCA profiles for WCA IDs", () => {
    expect(canOpenWcaProfile("2018TEST01")).toBe(true);
    expect(canOpenWcaProfile("CD26ABC01")).toBe(false);
  });
});
