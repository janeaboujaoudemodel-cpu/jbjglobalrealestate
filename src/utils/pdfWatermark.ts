/**
 * PDF Watermarking Utility
 * Adds dynamic watermarks to PDF documents for intellectual property protection
 */

export interface WatermarkOptions {
  userEmail?: string;
  userId?: string;
  timestamp?: Date;
  documentId?: string;
}

/**
 * Generates a unique watermark ID for tracking
 */
export const generateWatermarkId = (): string => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `JBJ-${timestamp}-${random}`.toUpperCase();
};

/**
 * Creates watermark text for PDF documents
 */
export const createWatermarkText = (options: WatermarkOptions = {}): string => {
  const watermarkId = generateWatermarkId();
  const timestamp = (options.timestamp || new Date()).toISOString();
  const userInfo = options.userEmail ? ` | ${options.userEmail}` : '';
  
  return `© JBJ Global Real Estate | ${watermarkId}${userInfo} | ${timestamp}`;
};

/**
 * Generates a download URL with watermark tracking parameters
 */
export const getWatermarkedDownloadUrl = (
  originalUrl: string, 
  options: WatermarkOptions = {}
): string => {
  const watermarkId = generateWatermarkId();
  const url = new URL(originalUrl, window.location.origin);
  
  // Add watermark tracking parameters
  url.searchParams.set('wm', watermarkId);
  if (options.userId) {
    url.searchParams.set('uid', options.userId);
  }
  url.searchParams.set('ts', Date.now().toString());
  
  return url.toString();
};

/**
 * Logs document download for tracking purposes
 */
export const logDocumentDownload = async (
  documentId: string,
  documentType: string,
  watermarkId: string,
  userId?: string,
  userEmail?: string
): Promise<void> => {
  // Log to DLP audit table
  try {
    const { logExportEvent } = await import("@/utils/dlpExportLogger");
    await logExportEvent({
      exportType: "document_download",
      exportFormat: "pdf",
      recordCount: 1,
      containsPii: false,
      watermarkId,
      fieldsExported: [documentType],
    });
  } catch (err) {
    console.error("[DLP] Document download log failed:", err);
  }
};

/**
 * Creates a copyright overlay text for documents
 */
export const getCopyrightOverlay = (): string => {
  const year = new Date().getFullYear();
  return `CONFIDENTIAL - © ${year} JBJ Global Real Estate - All Rights Reserved - Unauthorized Distribution Prohibited`;
};

/**
 * Validates if a watermark ID is in the correct format
 */
export const isValidWatermarkId = (watermarkId: string): boolean => {
  const pattern = /^JBJ-[A-Z0-9]+-[A-Z0-9]+$/;
  return pattern.test(watermarkId);
};
