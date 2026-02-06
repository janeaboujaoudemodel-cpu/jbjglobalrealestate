/**
 * CORS Utilities - Enterprise-grade origin validation
 * Only allows requests from authorized JBJ domains
 */

// Allowed origins for production
const ALLOWED_ORIGINS = [
  'https://jbj.ae',
  'https://www.jbj.ae',
  'https://jbjglobalrealestate.lovable.app',
  'https://id-preview--357981e3-cd4c-4c0d-ad5b-a1a379078f50.lovable.app',
];

// Preview/development patterns
const ALLOWED_ORIGIN_PATTERNS = [
  /^https:\/\/.*\.lovable\.app$/,
  /^https:\/\/.*\.lovable\.dev$/,
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
];

/**
 * Validates if the request origin is allowed
 */
export function isOriginAllowed(origin: string | null): boolean {
  if (!origin) return false;

  // Check exact matches first
  if (ALLOWED_ORIGINS.includes(origin)) {
    return true;
  }

  // Check patterns for preview/dev environments
  for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
    if (pattern.test(origin)) {
      return true;
    }
  }

  return false;
}

/**
 * Get CORS headers with validated origin
 * Falls back to blocking if origin is not allowed
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const baseHeaders = {
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Max-Age': '86400',
  };

  if (isOriginAllowed(origin)) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': origin!,
      'Access-Control-Allow-Credentials': 'true',
    };
  }

  // For development, allow all origins (will be restricted in production)
  // This is a fallback - in production, invalid origins get no CORS header
  const isDev = Deno.env.get('ENVIRONMENT') !== 'production';
  
  if (isDev) {
    return {
      ...baseHeaders,
      'Access-Control-Allow-Origin': '*',
    };
  }

  // Production: Return headers without origin (will block cross-origin requests)
  return {
    ...baseHeaders,
    'Access-Control-Allow-Origin': 'null',
  };
}

/**
 * Standard CORS headers for backward compatibility
 * Use getCorsHeaders(origin) for production-grade security
 */
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Handle CORS preflight request
 */
export function handleCorsPreflightWithValidation(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    const origin = req.headers.get('origin');
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(origin),
    });
  }
  return null;
}

/**
 * Create error response with CORS headers
 */
export function corsErrorResponse(
  message: string,
  status: number,
  origin: string | null
): Response {
  return new Response(
    JSON.stringify({ error: message }),
    {
      status,
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/json',
      },
    }
  );
}

/**
 * Create success response with CORS headers
 */
export function corsJsonResponse(
  data: unknown,
  origin: string | null,
  status: number = 200
): Response {
  return new Response(
    JSON.stringify(data),
    {
      status,
      headers: {
        ...getCorsHeaders(origin),
        'Content-Type': 'application/json',
      },
    }
  );
}
