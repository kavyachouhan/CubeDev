import { Client, Storage, ID } from "appwrite";

// Initialize Appwrite client
const client = new Client()
  .setEndpoint(
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1",
  )
  .setProject(process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "");

const storage = new Storage(client);

// Bucket ID for journal media
const JOURNAL_BUCKET_ID =
  process.env.NEXT_PUBLIC_APPWRITE_JOURNAL_BUCKET_ID || "";

export interface UploadResult {
  fileId: string;
  url: string;
}

/**
 * Upload a file to Appwrite storage
 * @param file - The file to upload
 * @returns Object containing fileId and viewable URL
 */
export async function uploadJournalMedia(file: File): Promise<UploadResult> {
  if (!JOURNAL_BUCKET_ID) {
    throw new Error("Appwrite journal bucket ID not configured");
  }

  const fileId = ID.unique();

  await storage.createFile(JOURNAL_BUCKET_ID, fileId, file);

  // Get the file view URL
  const url = getFileViewUrl(fileId);

  return { fileId, url };
}

/**
 * Delete a file from Appwrite storage
 * @param fileId - The file ID to delete
 */
export async function deleteJournalMedia(fileId: string): Promise<void> {
  if (!JOURNAL_BUCKET_ID) {
    throw new Error("Appwrite journal bucket ID not configured");
  }

  await storage.deleteFile(JOURNAL_BUCKET_ID, fileId);
}

/**
 * Get the view URL for a file
 * @param fileId - The file ID
 * @returns The URL to view the file
 */
export function getFileViewUrl(fileId: string): string {
  if (!JOURNAL_BUCKET_ID) return "";

  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

  return `${endpoint}/storage/buckets/${JOURNAL_BUCKET_ID}/files/${fileId}/view?project=${projectId}`;
}

/**
 * Get the download URL for a file (useful for video playback)
 * @param fileId - The file ID
 * @returns The URL to download the file
 */
export function getFileDownloadUrl(fileId: string): string {
  if (!JOURNAL_BUCKET_ID) return "";

  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

  return `${endpoint}/storage/buckets/${JOURNAL_BUCKET_ID}/files/${fileId}/download?project=${projectId}`;
}

/**
 * Extract file ID from an Appwrite storage URL
 * @param url - The Appwrite storage URL
 * @returns The file ID or null if not found
 */
export function extractFileIdFromUrl(url: string): string | null {
  // Match patterns like /files/{fileId}/view or /files/{fileId}/download
  const match = url.match(/\/files\/([^/]+)\/(view|download|preview)/);
  return match ? match[1] : null;
}

/**
 * Check if a URL or file ID points to a video file based on URL patterns
 * This is used when we don't have access to the MIME type
 * @param url - The URL to check
 * @returns true if the URL likely points to a video
 */
export function isVideoUrl(url: string): boolean {
  // Check for common video extensions in the URL
  const videoExtensions = [".mp4", ".webm", ".mov", ".avi", ".mkv", ".m4v"];
  const lowerUrl = url.toLowerCase();
  return videoExtensions.some((ext) => lowerUrl.includes(ext));
}

/**
 * Get a preview URL for an image file
 * @param fileId - The file ID
 * @param width - Optional width for resizing
 * @param height - Optional height for resizing
 * @returns The URL to preview the image
 */
export function getFilePreviewUrl(
  fileId: string,
  width?: number,
  height?: number,
): string {
  if (!JOURNAL_BUCKET_ID) return "";

  const endpoint =
    process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT || "https://cloud.appwrite.io/v1";
  const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID || "";

  let url = `${endpoint}/storage/buckets/${JOURNAL_BUCKET_ID}/files/${fileId}/preview?project=${projectId}`;

  if (width) url += `&width=${width}`;
  if (height) url += `&height=${height}`;

  return url;
}

/**
 * Check if a file is an image based on its MIME type
 * @param file - The file to check
 * @returns true if the file is an image
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith("image/");
}

/**
 * Check if a file is a video based on its MIME type
 * @param file - The file to check
 * @returns true if the file is a video
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith("video/");
}

/**
 * Validate file size (max 50MB for videos, 10MB for images)
 * @param file - The file to validate
 * @returns true if file size is valid
 */
export function validateFileSize(file: File): boolean {
  const maxSizeImage = 10 * 1024 * 1024; // 10MB
  const maxSizeVideo = 50 * 1024 * 1024; // 50MB

  if (isImageFile(file)) {
    return file.size <= maxSizeImage;
  }
  if (isVideoFile(file)) {
    return file.size <= maxSizeVideo;
  }
  return false;
}

/**
 * Get accepted file types for the file input
 */
export const ACCEPTED_MEDIA_TYPES =
  "image/jpeg,image/png,image/gif,image/webp,video/mp4,video/webm,video/quicktime";