import { describe, expect, it } from "vitest";
import {
  extractFileIdFromUrl,
  getFileViewUrl,
  isImageFile,
  isVideoFile,
  isVideoUrl,
  validateFileSize,
} from "@/lib/appwrite-storage";

function file(name: string, type: string, size: number) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("journal media validation", () => {
  it("accepts images up to 10MB and videos up to 50MB", () => {
    expect(validateFileSize(file("a.png", "image/png", 10 * 1024 * 1024))).toBe(
      true,
    );
    expect(
      validateFileSize(file("a.png", "image/png", 10 * 1024 * 1024 + 1)),
    ).toBe(false);
    expect(validateFileSize(file("a.mp4", "video/mp4", 50 * 1024 * 1024))).toBe(
      true,
    );
    expect(
      validateFileSize(file("a.mp4", "video/mp4", 50 * 1024 * 1024 + 1)),
    ).toBe(false);
  });

  it("rejects empty and non-media types", () => {
    expect(validateFileSize(file("x.exe", "application/octet-stream", 10))).toBe(
      false,
    );
    expect(isImageFile(file("a.png", "image/png", 1))).toBe(true);
    expect(isVideoFile(file("a.mp4", "video/mp4", 1))).toBe(true);
  });

  it("parses Appwrite URLs and video extensions", () => {
    expect(
      extractFileIdFromUrl(
        "https://cloud.appwrite.io/v1/storage/buckets/b/files/abc123/view?project=p",
      ),
    ).toBe("abc123");
    expect(extractFileIdFromUrl("https://example.com/nope")).toBeNull();
    expect(isVideoUrl("https://cdn.example/clip.mp4")).toBe(true);
    expect(getFileViewUrl("file-1")).toContain("/files/file-1/view");
  });
});
