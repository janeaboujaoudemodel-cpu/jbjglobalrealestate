import { createClient } from "npm:@supabase/supabase-js@2";

// Allowed origins for CORS
const ALLOWED_ORIGINS = [
  'https://jbj.ae',
  'https://www.jbj.ae',
  'https://jbjglobalrealestate.lovable.app',
  'https://id-preview--357981e3-cd4c-4c0d-ad5b-a1a379078f50.lovable.app',
];

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
  if (ALLOWED_ORIGINS.includes(origin)) return true;
  for (const pattern of ALLOWED_ORIGIN_PATTERNS) {
    if (pattern.test(origin)) return true;
  }
  return false;
}

/**
 * Get CORS headers with validated origin
 */
export function getCorsHeaders(origin: string | null): Record<string, string> {
  const baseHeaders = {
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  };

  if (isOriginAllowed(origin)) {
    return {
      ...baseHeaders,
      "Access-Control-Allow-Origin": origin!,
      "Access-Control-Allow-Credentials": "true",
    };
  }

  // Fallback for development
  return {
    ...baseHeaders,
    "Access-Control-Allow-Origin": "*",
  };
}

// Legacy corsHeaders for backward compatibility
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

export interface AuthResult {
  authenticated: boolean;
  userId?: string;
  email?: string;
  isEmployee?: boolean;
  error?: string;
}

/**
 * Validates the request has a valid JWT and the user is a registered employee.
 * Returns user info if valid, error details if not.
 */
export async function validateEmployeeAuth(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  
  if (!authHeader?.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing or invalid Authorization header" };
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Create client with user's auth token
  const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });

  // Get user from the authenticated client
  const { data: { user }, error: userError } = await supabaseAuth.auth.getUser();

  if (userError || !user) {
    return { authenticated: false, error: "Invalid or expired token" };
  }

  const userId = user.id;
  const email = user.email || "";

  // Use service role to check if user is a registered employee
  const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
  
  const { data: employeeProfile, error: profileError } = await supabaseService
    .from("crm_users_profile")
    .select("id, user_id, is_active, crm_role")
    .eq("user_id", userId)
    .eq("is_active", true)
    .single();

  if (profileError || !employeeProfile) {
    // Also check user_roles for admin/owner as fallback
    const { data: roleData } = await supabaseService
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .in("role", ["admin", "owner"]);

    if (!roleData || roleData.length === 0) {
      return { 
        authenticated: true, 
        userId, 
        email, 
        isEmployee: false, 
        error: "Access denied: Not a registered employee" 
      };
    }
  }

  return {
    authenticated: true,
    userId,
    email,
    isEmployee: true,
  };
}

/**
 * Lightweight JWT verification — confirms the caller has a valid Supabase user
 * session, without requiring employee/role membership. Use for endpoints that
 * burn third-party API credits or must not be hit by anonymous traffic.
 */
export async function requireAuthenticatedUser(req: Request): Promise<AuthResult> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { authenticated: false, error: "Missing or invalid Authorization header" };
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
  const client = createClient(supabaseUrl, supabaseAnonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await client.auth.getUser();
  if (error || !data?.user) {
    return { authenticated: false, error: "Invalid or expired token" };
  }
  return { authenticated: true, userId: data.user.id, email: data.user.email ?? "" };
}

/**
 * Returns a 401 Unauthorized response with CORS headers
 */
export function unauthorizedResponse(message: string = "Unauthorized", origin?: string | null): Response {
  const headers = origin ? getCorsHeaders(origin) : corsHeaders;
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...headers, "Content-Type": "application/json" } }
  );
}

/**
 * Returns a 403 Forbidden response with CORS headers
 */
export function forbiddenResponse(message: string = "Access denied", origin?: string | null): Response {
  const headers = origin ? getCorsHeaders(origin) : corsHeaders;
  return new Response(
    JSON.stringify({ error: message }),
    { status: 403, headers: { ...headers, "Content-Type": "application/json" } }
  );
}

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
