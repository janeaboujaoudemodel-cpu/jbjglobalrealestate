import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

  const token = authHeader.replace("Bearer ", "");
  const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);

  if (claimsError || !claimsData?.claims) {
    return { authenticated: false, error: "Invalid or expired token" };
  }

  const userId = claimsData.claims.sub as string;
  const email = claimsData.claims.email as string;

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
 * Returns a 401 Unauthorized response with CORS headers
 */
export function unauthorizedResponse(message: string = "Unauthorized"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

/**
 * Returns a 403 Forbidden response with CORS headers
 */
export function forbiddenResponse(message: string = "Access denied"): Response {
  return new Response(
    JSON.stringify({ error: message }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
