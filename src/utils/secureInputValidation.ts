/**
 * Secure Input Validation Utilities
 * 
 * MANDATORY: Use these validators for ALL user inputs across the application.
 * These functions implement defense-in-depth security patterns.
 */

import DOMPurify from 'dompurify';
import { 
  SECURITY_PATTERNS, 
  MAX_INPUT_LENGTHS, 
  containsXSS, 
  containsSQLInjection,
  sanitizeUrl as baseSanitizeUrl,
  isValidEmail,
  isValidPhone,
  isAllowedFileExtension,
  maskPII
} from '@/config/security-standards';

// Re-export for convenience
export { maskPII, isValidEmail, isValidPhone, isAllowedFileExtension };

/**
 * Sanitize HTML content using DOMPurify
 * ALWAYS use this before rendering user content with dangerouslySetInnerHTML
 */
export const sanitizeHtml = (dirty: string): string => {
  if (!dirty) return '';
  
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br', 'ul', 'ol', 'li', 'span'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'class'],
    ALLOW_DATA_ATTR: false,
    ADD_ATTR: ['rel'],
    FORCE_BODY: true,
  });
};

/**
 * Sanitize HTML for markdown-style content (bold, links)
 */
export const sanitizeMarkdownHtml = (dirty: string): string => {
  if (!dirty) return '';
  
  // First sanitize with DOMPurify
  const sanitized = DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['strong', 'em', 'b', 'i', 'a', 'br', 'p'],
    ALLOWED_ATTR: ['href', 'class'],
  });
  
  // Additional check for any remaining dangerous patterns
  if (containsXSS(sanitized)) {
    console.warn('[SECURITY] XSS pattern detected after sanitization');
    return DOMPurify.sanitize(dirty, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  }
  
  return sanitized;
};

/**
 * Sanitize plain text input (no HTML allowed)
 */
export const sanitizeText = (input: string, maxLength?: number): string => {
  if (!input) return '';
  
  // Remove all HTML tags
  let clean = DOMPurify.sanitize(input, { ALLOWED_TAGS: [], ALLOWED_ATTR: [] });
  
  // Trim and limit length
  clean = clean.trim();
  if (maxLength && clean.length > maxLength) {
    clean = clean.substring(0, maxLength);
  }
  
  return clean;
};

/**
 * Sanitize URL - blocks dangerous protocols
 */
export const sanitizeUrl = (url: string): string => {
  return baseSanitizeUrl(url);
};

/**
 * Sanitize email input
 */
export const sanitizeEmail = (email: string): string => {
  if (!email) return '';
  
  const cleaned = email.trim().toLowerCase();
  
  if (cleaned.length > MAX_INPUT_LENGTHS.EMAIL) {
    return '';
  }
  
  if (!isValidEmail(cleaned)) {
    return '';
  }
  
  return cleaned;
};

/**
 * Sanitize phone input
 */
export const sanitizePhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digit characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  if (cleaned.length > MAX_INPUT_LENGTHS.PHONE) {
    return '';
  }
  
  return cleaned;
};

/**
 * Sanitize name input
 */
export const sanitizeName = (name: string): string => {
  if (!name) return '';
  
  // Only allow letters, spaces, hyphens, apostrophes
  let cleaned = name.replace(/[^a-zA-Z\s\-']/g, '').trim();
  
  if (cleaned.length > MAX_INPUT_LENGTHS.NAME) {
    cleaned = cleaned.substring(0, MAX_INPUT_LENGTHS.NAME);
  }
  
  return cleaned;
};

/**
 * Validate and sanitize form data object
 */
export interface FormValidationResult {
  isValid: boolean;
  sanitizedData: Record<string, unknown>;
  errors: Record<string, string>;
  securityWarnings: string[];
}

export const validateFormData = (
  data: Record<string, unknown>,
  schema: Record<string, { type: string; required?: boolean; maxLength?: number }>
): FormValidationResult => {
  const result: FormValidationResult = {
    isValid: true,
    sanitizedData: {},
    errors: {},
    securityWarnings: [],
  };
  
  for (const [key, rules] of Object.entries(schema)) {
    const value = data[key];
    const stringValue = String(value ?? '');
    
    // Check required
    if (rules.required && !value) {
      result.errors[key] = `${key} is required`;
      result.isValid = false;
      continue;
    }
    
    // Check for XSS
    if (containsXSS(stringValue)) {
      result.securityWarnings.push(`Potential XSS detected in ${key}`);
      result.errors[key] = 'Invalid input detected';
      result.isValid = false;
      continue;
    }
    
    // Check for SQL injection
    if (containsSQLInjection(stringValue)) {
      result.securityWarnings.push(`Potential SQL injection detected in ${key}`);
      result.errors[key] = 'Invalid input detected';
      result.isValid = false;
      continue;
    }
    
    // Sanitize based on type
    switch (rules.type) {
      case 'email':
        result.sanitizedData[key] = sanitizeEmail(stringValue);
        if (rules.required && !result.sanitizedData[key]) {
          result.errors[key] = 'Invalid email format';
          result.isValid = false;
        }
        break;
      
      case 'phone':
        result.sanitizedData[key] = sanitizePhone(stringValue);
        break;
      
      case 'name':
        result.sanitizedData[key] = sanitizeName(stringValue);
        break;
      
      case 'url':
        result.sanitizedData[key] = sanitizeUrl(stringValue);
        break;
      
      case 'html':
        result.sanitizedData[key] = sanitizeHtml(stringValue);
        break;
      
      case 'text':
      default:
        result.sanitizedData[key] = sanitizeText(stringValue, rules.maxLength);
        break;
    }
  }
  
  // Log security warnings
  if (result.securityWarnings.length > 0) {
    console.warn('[SECURITY] Form validation warnings:', result.securityWarnings);
  }
  
  return result;
};

/**
 * Escape HTML entities for safe display
 */
export const escapeHtml = (unsafe: string): string => {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
};

/**
 * Unescape HTML entities
 */
export const unescapeHtml = (safe: string): string => {
  if (!safe) return '';
  return safe
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");
};

/**
 * Validate file upload security
 */
export interface FileValidationResult {
  isValid: boolean;
  error?: string;
  securityWarning?: string;
}

export const validateFileUpload = (
  file: File,
  allowedTypes: string[],
  maxSizeBytes: number
): FileValidationResult => {
  // Check extension
  if (!isAllowedFileExtension(file.name)) {
    return {
      isValid: false,
      error: 'File type not allowed',
      securityWarning: `Blocked potentially dangerous file: ${file.name}`,
    };
  }
  
  // Check MIME type
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'File type not supported',
    };
  }
  
  // Check size
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File too large. Maximum size: ${Math.round(maxSizeBytes / 1024 / 1024)}MB`,
    };
  }
  
  // Check for double extensions (potential bypass attempt)
  const parts = file.name.split('.');
  if (parts.length > 2) {
    const suspiciousExtensions = ['exe', 'bat', 'cmd', 'sh', 'js', 'vbs'];
    for (const ext of parts.slice(0, -1)) {
      if (suspiciousExtensions.includes(ext.toLowerCase())) {
        return {
          isValid: false,
          error: 'Invalid file name',
          securityWarning: `Potential double extension attack: ${file.name}`,
        };
      }
    }
  }
  
  return { isValid: true };
};

/**
 * Create a secure external link (with noopener noreferrer)
 */
export const createSecureExternalLink = (url: string): { href: string; target: string; rel: string } => {
  return {
    href: sanitizeUrl(url),
    target: '_blank',
    rel: 'noopener noreferrer',
  };
};

/**
 * Rate limiting helper for client-side protection
 */
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, limit: number, windowMs: number): boolean => {
  const now = Date.now();
  const record = rateLimitMap.get(key);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= limit) {
    return false;
  }
  
  record.count++;
  return true;
};

export default {
  sanitizeHtml,
  sanitizeMarkdownHtml,
  sanitizeText,
  sanitizeUrl,
  sanitizeEmail,
  sanitizePhone,
  sanitizeName,
  validateFormData,
  escapeHtml,
  unescapeHtml,
  validateFileUpload,
  createSecureExternalLink,
  checkRateLimit,
  maskPII,
  isValidEmail,
  isValidPhone,
  isAllowedFileExtension,
};
