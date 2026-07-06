/**
 * Developer File Validation Utility
 * Keeps upload filenames safe while allowing owner project materials without
 * app-level type or size restrictions. Storage/backend policies remain the
 * real boundary; this utility should not block legitimate brochures, media,
 * spreadsheets, archives, or developer packs.
 */

export const MAX_FILE_SIZE_BYTES = Number.POSITIVE_INFINITY;
export const MAX_SESSION_SIZE_BYTES = Number.POSITIVE_INFINITY;
const MAX_FILENAME_LENGTH = 200;

export interface FileValidationResult {
  isValid: boolean;
  sanitizedName: string;
  rejectionReason: string | null;
  riskFlags: string[];
}

/**
 * Sanitize a filename to prevent path traversal, null bytes, and unicode exploits.
 */
export function sanitizeFileName(name: string): string {
  let safe = name;

  // Strip null bytes
  safe = safe.replace(/\0/g, '');

  // Strip path traversal sequences
  safe = safe.replace(/\.\.\//g, '').replace(/\.\.\\/g, '');
  safe = safe.replace(/^\.+/, '');

  // Strip unicode control characters
  // eslint-disable-next-line no-control-regex
  safe = safe.replace(/[\x00-\x1f\x7f-\x9f]/g, '');

  // Replace non-safe characters with underscores
  safe = safe.replace(/[^a-zA-Z0-9._\-() ]/g, '_');

  // Collapse multiple underscores/spaces
  safe = safe.replace(/_{2,}/g, '_').replace(/\s{2,}/g, ' ').trim();

  // Truncate to max length while preserving extension
  if (safe.length > MAX_FILENAME_LENGTH) {
    const dotIdx = safe.lastIndexOf('.');
    if (dotIdx > 0) {
      const ext = safe.slice(dotIdx);
      safe = safe.slice(0, MAX_FILENAME_LENGTH - ext.length) + ext;
    } else {
      safe = safe.slice(0, MAX_FILENAME_LENGTH);
    }
  }

  // Final fallback
  if (!safe || safe === '.' || safe === '..') {
    safe = `file_${Date.now()}`;
  }

  return safe;
}

/**
 * Validate a single file for upload.
 */
export function validateFile(
  file: File,
  sessionFileNames: string[] = [],
  sessionTotalBytes: number = 0
): FileValidationResult {
  const riskFlags: string[] = [];
  const sanitizedName = sanitizeFileName(file.name);

  // Owner project uploads intentionally do not block by extension/MIME/size.
  // Keep non-blocking flags only for operator visibility.
  const lowerName = sanitizedName.toLowerCase();
  if (sessionFileNames.some(n => n.toLowerCase() === lowerName)) {
    riskFlags.push('duplicate_filename');
  }

  // 5. Check for suspicious patterns
  if (file.name !== sanitizedName) {
    riskFlags.push('filename_sanitized');
  }

  if (/\.\w+\.\w+$/.test(file.name)) {
    riskFlags.push('double_extension');
  }

  return {
    isValid: true,
    sanitizedName,
    rejectionReason: null,
    riskFlags,
  };
}

/**
 * Validate a batch of files.
 */
export function validateFiles(
  files: File[],
  existingSessionFileNames: string[] = [],
  existingSessionBytes: number = 0
): { valid: Array<{ file: File; result: FileValidationResult }>; rejected: Array<{ file: File; result: FileValidationResult }> } {
  const valid: Array<{ file: File; result: FileValidationResult }> = [];
  const rejected: Array<{ file: File; result: FileValidationResult }> = [];
  const sessionNames = [...existingSessionFileNames];
  let totalBytes = existingSessionBytes;

  for (const file of files) {
    const result = validateFile(file, sessionNames, totalBytes);
    if (result.isValid) {
      valid.push({ file, result });
      sessionNames.push(result.sanitizedName);
      totalBytes += file.size;
    } else {
      rejected.push({ file, result });
    }
  }

  return { valid, rejected };
}
