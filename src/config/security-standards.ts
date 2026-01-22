/**
 * JBJ Global Real Estate - Enterprise Security Standards
 * 
 * This file establishes the foundational security configuration that MUST be followed
 * for ALL development - pages, components, sections, API calls, database operations.
 * 
 * SECURITY PRINCIPLES:
 * 1. Defense in Depth - Multiple layers of security
 * 2. Least Privilege - Minimum access needed
 * 3. Zero Trust - Never trust, always verify
 * 4. Secure by Default - Security built into every feature
 */

// ============================================================================
// SECTION 1: INPUT VALIDATION PATTERNS
// ============================================================================

/**
 * Standard validation patterns for user inputs
 * Use these with zod schemas for all forms
 */
export const SECURITY_PATTERNS = {
  // Email - strict RFC 5322 subset
  EMAIL: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  
  // Phone - international format
  PHONE: /^\+?[1-9]\d{1,14}$/,
  
  // Name - letters, spaces, hyphens, apostrophes only
  NAME: /^[a-zA-Z\s\-']+$/,
  
  // UUID v4
  UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
  
  // URL - https only for external links
  SECURE_URL: /^https:\/\/[a-zA-Z0-9][a-zA-Z0-9-]*(\.[a-zA-Z0-9-]+)+/,
  
  // No script tags or dangerous patterns
  SAFE_TEXT: /^[^<>]*$/,
  
  // Currency - numbers with optional decimal
  CURRENCY: /^\d+(\.\d{1,2})?$/,
  
  // Emirates ID format
  EMIRATES_ID: /^784-\d{4}-\d{7}-\d{1}$/,
  
  // RERA number format
  RERA_NUMBER: /^[A-Z]{2,5}\d{5,10}$/i,
} as const;

/**
 * Maximum input lengths to prevent buffer overflow attacks
 */
export const MAX_INPUT_LENGTHS = {
  NAME: 100,
  EMAIL: 255,
  PHONE: 20,
  MESSAGE: 5000,
  DESCRIPTION: 10000,
  PASSWORD: 128,
  URL: 2048,
  FILE_NAME: 255,
  SEARCH_QUERY: 200,
  COMMENT: 2000,
  ADDRESS: 500,
  COMPANY_NAME: 200,
} as const;

// ============================================================================
// SECTION 2: DANGEROUS PROTOCOLS & PATTERNS TO BLOCK
// ============================================================================

/**
 * Protocols that must NEVER be allowed in URLs
 */
export const BLOCKED_PROTOCOLS = [
  'javascript:',
  'data:',
  'vbscript:',
  'file:',
  'ftp:',
  'about:',
  'blob:',
] as const;

/**
 * Patterns that indicate potential XSS attacks
 */
export const XSS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi, // onclick, onerror, etc.
  /expression\s*\(/gi,
  /eval\s*\(/gi,
  /document\.(cookie|location|write)/gi,
  /window\.(location|open)/gi,
] as const;

/**
 * SQL injection patterns to detect
 */
export const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|UNION|ALTER)\b)/gi,
  /(--|;|\/\*|\*\/)/g,
  /(\bOR\b|\bAND\b)\s+\d+\s*=\s*\d+/gi,
  /'.*(\bOR\b|\bAND\b).*'/gi,
] as const;

// ============================================================================
// SECTION 3: RATE LIMITING CONFIGURATION
// ============================================================================

export const RATE_LIMITS = {
  // API calls per minute per user
  API_CALLS_PER_MINUTE: 60,
  
  // Login attempts before temporary lock
  LOGIN_ATTEMPTS: 5,
  LOGIN_LOCKOUT_MINUTES: 15,
  
  // Form submissions per hour
  FORM_SUBMISSIONS_PER_HOUR: 10,
  
  // File uploads per day
  FILE_UPLOADS_PER_DAY: 50,
  
  // Email sends per hour (for bulk operations)
  EMAILS_PER_HOUR: 100,
  
  // AI tool usage per day
  AI_CALLS_PER_DAY: 200,
} as const;

// ============================================================================
// SECTION 4: FILE SECURITY
// ============================================================================

/**
 * Allowed file types for upload
 */
export const ALLOWED_FILE_TYPES = {
  IMAGES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  DOCUMENTS: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  SPREADSHEETS: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'text/csv'],
  PRESENTATIONS: ['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'],
} as const;

/**
 * Maximum file sizes (in bytes)
 */
export const MAX_FILE_SIZES = {
  IMAGE: 10 * 1024 * 1024, // 10MB
  DOCUMENT: 25 * 1024 * 1024, // 25MB
  VIDEO: 100 * 1024 * 1024, // 100MB
  AVATAR: 5 * 1024 * 1024, // 5MB
} as const;

/**
 * File extensions that are NEVER allowed
 */
export const BLOCKED_EXTENSIONS = [
  '.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.js', '.jar',
  '.msi', '.dll', '.scr', '.pif', '.com', '.hta', '.cpl',
] as const;

// ============================================================================
// SECTION 5: AUTHENTICATION & SESSION
// ============================================================================

export const AUTH_CONFIG = {
  // Session timeout in minutes
  SESSION_TIMEOUT_MINUTES: 480, // 8 hours
  
  // Refresh token before expiry (minutes)
  REFRESH_BEFORE_EXPIRY_MINUTES: 30,
  
  // Minimum password requirements
  PASSWORD_MIN_LENGTH: 8,
  PASSWORD_REQUIRE_UPPERCASE: true,
  PASSWORD_REQUIRE_LOWERCASE: true,
  PASSWORD_REQUIRE_NUMBER: true,
  PASSWORD_REQUIRE_SPECIAL: true,
  
  // MFA settings
  MFA_CODE_EXPIRY_MINUTES: 10,
  MFA_CODE_LENGTH: 6,
} as const;

// ============================================================================
// SECTION 6: CONTENT SECURITY POLICY
// ============================================================================

/**
 * Trusted domains for external resources
 */
export const TRUSTED_DOMAINS = [
  'jbj.ae',
  'jbjglobalrealestate.lovable.app',
  'supabase.co',
  'supabase.in',
  'googleapis.com',
  'gstatic.com',
  'google.com',
  'googletagmanager.com',
  'fonts.googleapis.com',
  'fonts.gstatic.com',
] as const;

/**
 * Domains allowed for image loading
 */
export const ALLOWED_IMAGE_DOMAINS = [
  ...TRUSTED_DOMAINS,
  'images.unsplash.com',
  'randomuser.me',
  'ui-avatars.com',
  'flagcdn.com',
] as const;

// ============================================================================
// SECTION 7: AUDIT LOGGING REQUIREMENTS
// ============================================================================

/**
 * Actions that MUST be logged for security auditing
 */
export const AUDITABLE_ACTIONS = [
  // Authentication
  'login_success',
  'login_failure',
  'logout',
  'password_reset',
  'mfa_enabled',
  'mfa_disabled',
  
  // Data access
  'view_pii',
  'export_data',
  'download_document',
  'access_sensitive_table',
  
  // Data modification
  'create_user',
  'update_user',
  'delete_user',
  'update_role',
  'modify_permissions',
  
  // Financial
  'view_salary',
  'view_commission',
  'view_bank_details',
  'process_payment',
  
  // Administrative
  'change_settings',
  'modify_rls_policy',
  'access_admin_panel',
  'impersonate_user',
] as const;

// ============================================================================
// SECTION 8: PII FIELDS REQUIRING SPECIAL HANDLING
// ============================================================================

/**
 * Fields that contain PII and require masking/encryption
 */
export const PII_FIELDS = [
  'email',
  'phone',
  'mobile',
  'whatsapp',
  'full_name',
  'first_name',
  'last_name',
  'family_name',
  'date_of_birth',
  'nationality',
  'passport_number',
  'emirates_id',
  'address',
  'ip_address',
  'bank_account',
  'iban',
  'credit_card',
  'salary',
  'cv_url',
  'id_document_url',
] as const;

/**
 * Tables containing sensitive data requiring extra protection
 */
export const SENSITIVE_TABLES = [
  'referral_partner_bank_vault',
  'employee_salaries',
  'vip_clients',
  'hr_employees',
  'hr_candidates',
  'crm_leads',
  'vapi_call_logs',
  'chat_history',
  'audit_logs',
  'banking_access_audit',
] as const;

// ============================================================================
// SECTION 9: ROLE-BASED ACCESS CONTROL
// ============================================================================

/**
 * Role hierarchy for access control
 * Higher index = more privileges
 */
export const ROLE_HIERARCHY = [
  'visitor',
  'user',
  'broker_member',
  'hr_admin',
  'listing_admin',
  'crm_admin',
  'admin',
  'owner',
  'founder',
] as const;

/**
 * Role permissions matrix
 */
export const ROLE_PERMISSIONS = {
  founder: ['*'], // All permissions
  owner: ['*'],
  admin: [
    'manage_users',
    'view_analytics',
    'manage_content',
    'view_leads',
    'manage_brokers',
    'access_crm',
    'view_reports',
  ],
  crm_admin: [
    'view_leads',
    'manage_leads',
    'access_crm',
    'view_reports',
    'export_leads',
  ],
  listing_admin: [
    'manage_listings',
    'approve_listings',
    'view_listings',
  ],
  hr_admin: [
    'manage_employees',
    'view_candidates',
    'manage_hiring',
  ],
  broker_member: [
    'access_crm',
    'view_own_leads',
    'use_ai_tools',
    'view_market_intel',
  ],
  user: [
    'view_properties',
    'submit_inquiry',
    'save_favorites',
  ],
  visitor: [
    'view_public_content',
  ],
} as const;

// ============================================================================
// SECTION 10: SECURITY HELPER FUNCTIONS
// ============================================================================

/**
 * Sanitize URL to prevent dangerous protocols
 */
export const sanitizeUrl = (url: string): string => {
  if (!url) return '#';
  const trimmed = url.trim().toLowerCase();
  
  for (const protocol of BLOCKED_PROTOCOLS) {
    if (trimmed.startsWith(protocol)) {
      console.warn(`[SECURITY] Blocked dangerous URL protocol: ${protocol}`);
      return '#';
    }
  }
  
  // Ensure https for external links
  if (url && !url.match(/^https?:\/\//i) && !url.startsWith('/') && !url.startsWith('#')) {
    return 'https://' + url;
  }
  
  return url;
};

/**
 * Check if input contains potential XSS
 */
export const containsXSS = (input: string): boolean => {
  if (!input) return false;
  return XSS_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Check if input contains potential SQL injection
 */
export const containsSQLInjection = (input: string): boolean => {
  if (!input) return false;
  return SQL_INJECTION_PATTERNS.some(pattern => pattern.test(input));
};

/**
 * Validate email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > MAX_INPUT_LENGTHS.EMAIL) return false;
  return SECURITY_PATTERNS.EMAIL.test(email);
};

/**
 * Validate phone format
 */
export const isValidPhone = (phone: string): boolean => {
  if (!phone || phone.length > MAX_INPUT_LENGTHS.PHONE) return false;
  return SECURITY_PATTERNS.PHONE.test(phone.replace(/[\s\-\(\)]/g, ''));
};

/**
 * Check if file extension is allowed
 */
export const isAllowedFileExtension = (filename: string): boolean => {
  const ext = '.' + filename.split('.').pop()?.toLowerCase();
  return !BLOCKED_EXTENSIONS.includes(ext as any);
};

/**
 * Mask PII for logging/display
 */
export const maskPII = (value: string, type: 'email' | 'phone' | 'name' | 'id'): string => {
  if (!value) return '***';
  
  switch (type) {
    case 'email':
      const [local, domain] = value.split('@');
      if (!domain) return '***@***';
      return `${local.charAt(0)}***@${domain}`;
    
    case 'phone':
      if (value.length < 4) return '***';
      return `***${value.slice(-4)}`;
    
    case 'name':
      return value.charAt(0) + '***';
    
    case 'id':
      if (value.length < 4) return '***';
      return `${value.slice(0, 2)}***${value.slice(-2)}`;
    
    default:
      return '***';
  }
};

/**
 * Generate a secure random token
 */
export const generateSecureToken = (length: number = 32): string => {
  const array = new Uint8Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
};

/**
 * Hash sensitive data for comparison (browser-compatible)
 */
export const hashForComparison = async (data: string): Promise<string> => {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);
  const hashBuffer = await crypto.subtle.digest('SHA-256', dataBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// ============================================================================
// SECTION 11: SECURITY HEADERS (for Edge Functions)
// ============================================================================

export const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
} as const;

// ============================================================================
// SECTION 12: CORS CONFIGURATION
// ============================================================================

export const CORS_CONFIG = {
  ALLOWED_ORIGINS: [
    'https://jbj.ae',
    'https://www.jbj.ae',
    'https://jbjglobalrealestate.lovable.app',
    'https://id-preview--357981e3-cd4c-4c0d-ad5b-a1a379078f50.lovable.app',
  ],
  ALLOWED_METHODS: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization', 'X-Requested-With'],
  MAX_AGE: 86400, // 24 hours
} as const;

// Export all for easy access
export const SECURITY_STANDARDS = {
  patterns: SECURITY_PATTERNS,
  maxLengths: MAX_INPUT_LENGTHS,
  blockedProtocols: BLOCKED_PROTOCOLS,
  xssPatterns: XSS_PATTERNS,
  sqlInjectionPatterns: SQL_INJECTION_PATTERNS,
  rateLimits: RATE_LIMITS,
  allowedFileTypes: ALLOWED_FILE_TYPES,
  maxFileSizes: MAX_FILE_SIZES,
  blockedExtensions: BLOCKED_EXTENSIONS,
  authConfig: AUTH_CONFIG,
  trustedDomains: TRUSTED_DOMAINS,
  allowedImageDomains: ALLOWED_IMAGE_DOMAINS,
  auditableActions: AUDITABLE_ACTIONS,
  piiFields: PII_FIELDS,
  sensitiveTables: SENSITIVE_TABLES,
  roleHierarchy: ROLE_HIERARCHY,
  rolePermissions: ROLE_PERMISSIONS,
  securityHeaders: SECURITY_HEADERS,
  corsConfig: CORS_CONFIG,
} as const;

export default SECURITY_STANDARDS;
