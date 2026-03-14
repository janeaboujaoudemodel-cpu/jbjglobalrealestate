/**
 * Developer File Validation Utility
 * Enforces file type whitelist, size limits, filename sanitization, and duplicate detection.
 */

// Allowed MIME types and extensions
const ALLOWED_TYPES: Record<string, string[]> = {
  'application/pdf': ['.pdf'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp'],
  'video/mp4': ['.mp4'],
  'application/zip': ['.zip'],
  'application/x-zip-compressed': ['.zip'],
  'image/svg+xml': ['.svg'],
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': ['.pptx'],
};

const ALLOWED_EXTENSIONS = new Set(
  Object.values(ALLOWED_TYPES).flat().map(e => e.toLowerCase())
);

// Max 50MB per file, 200MB per session
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024;
export const MAX_SESSION_SIZE_BYTES = 200 * 1024 * 1024;
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
 * Get file extension from a filename (lowercase).
 */
function getExtension(name: string): string {
  const dotIdx = name.lastIndexOf('.');
  if (dotIdx < 0) return '';
  return name.slice(dotIdx).toLowerCase();
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
  const ext = getExtension(file.name);

  // 1. Check file type
  const typeAllowed = ALLOWED_TYPES[file.type] || ALLOWED_EXTENSIONS.has(ext);
  if (!typeAllowed) {
    return {
      isValid: false,
      sanitizedName,
      rejectionReason: `File type "${ext || file.type}" is not allowed. Accepted: PDF, DOCX, XLSX, JPG, PNG, WEBP, MP4, ZIP, SVG, PPTX.`,
      riskFlags: ['blocked_file_type'],
    };
  }

  // 2. Check file size
  if (file.size > MAX_FILE_SIZE_BYTES) {
    return {
      isValid: false,
      sanitizedName,
      rejectionReason: `File exceeds 50MB limit (${(file.size / 1024 / 1024).toFixed(1)}MB).`,
      riskFlags: ['oversized_file'],
    };
  }

  // 3. Check session total size
  if (sessionTotalBytes + file.size > MAX_SESSION_SIZE_BYTES) {
    return {
      isValid: false,
      sanitizedName,
      rejectionReason: `Session upload limit of 200MB would be exceeded.`,
      riskFlags: ['session_limit_exceeded'],
    };
  }

  // 4. Check for duplicate filename in session
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
