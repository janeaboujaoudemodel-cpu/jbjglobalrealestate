import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================================================================
// INPUT VALIDATION SCHEMA (Zod)
// ============================================================================
const CreateCrmUserSchema = z.object({
  email: z.string().email().max(255).transform(v => v.trim().toLowerCase()),
  password: z.string().min(12).max(128),
  displayName: z.string().min(2).max(100).transform(v => v.trim()),
  crmRole: z.enum([
    'agent', 'broker', 'team_lead', 'manager', 'senior_manager',
    'director', 'vp', 'admin', 'owner_admin', 'founder'
  ]),
  jobTitle: z.string().max(100).optional(),
  phone: z.string().max(20).optional(),
});

// ============================================================================
// ROLE HIERARCHY (who can create whom)
// ============================================================================
const PRIVILEGED_ROLES = ['owner_admin', 'founder'] as const;
const ADMIN_ROLES = ['owner_admin', 'founder', 'admin'] as const;

// Only these roles can call this function at all
const ALLOWED_CALLER_ROLES = ['owner_admin', 'founder', 'admin'] as const;

// Role assignment permissions
const ROLE_PERMISSIONS: Record<string, string[]> = {
  'founder': ['agent', 'broker', 'team_lead', 'manager', 'senior_manager', 'director', 'vp', 'admin', 'owner_admin', 'founder'],
  'owner_admin': ['agent', 'broker', 'team_lead', 'manager', 'senior_manager', 'director', 'vp', 'admin'],
  'admin': ['agent', 'broker', 'team_lead', 'manager', 'senior_manager'],
};

// ============================================================================
// RATE LIMITING CONFIG
// ============================================================================
const RATE_LIMIT_WINDOW_MS = 3600000; // 1 hour
const MAX_REQUESTS_PER_WINDOW = 10;

// ============================================================================
// MAIN HANDLER
// ============================================================================
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Admin client for privileged operations
  const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  // Helper for JSON responses
  const jsonResponse = (data: object, status: number) =>
    new Response(JSON.stringify(data), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  // Audit log helper
  const auditLog = async (details: object, userId?: string, userEmail?: string) => {
    try {
      await supabaseAdmin.from("audit_logs").insert({
        action_type: "create",
        resource_type: "user",
        description: "CRM user creation attempt",
        details,
        ip_address: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        user_agent: req.headers.get("user-agent") || null,
        user_id: userId || null,
        user_email: userEmail || null,
      });
    } catch (e) {
      console.error("Audit log error:", e);
    }
  };

  try {
    // =========================================================================
    // STEP 1: AUTHENTICATION - Require valid JWT
    // =========================================================================
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      await auditLog({ 
        result: "BLOCKED", 
        reason: "No authorization header",
        ip: req.headers.get("x-forwarded-for") 
      });
      console.warn("[CREATE-CRM-USER] BLOCKED: No auth header");
      return jsonResponse({ error: "Unauthorized - No token provided" }, 401);
    }

    // Validate JWT and get caller identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
    
    if (claimsError || !claimsData?.claims?.sub) {
      await auditLog({ 
        result: "BLOCKED", 
        reason: "Invalid JWT token",
        ip: req.headers.get("x-forwarded-for") 
      });
      return jsonResponse({ error: "Unauthorized - Invalid token" }, 401);
    }

    const callerId = claimsData.claims.sub as string;
    const callerEmail = claimsData.claims.email as string;

    // =========================================================================
    // STEP 2: AUTHORIZATION - Verify caller has admin/owner role
    // =========================================================================
    const { data: callerProfile, error: profileError } = await supabaseAdmin
      .from("crm_users_profile")
      .select("crm_role, is_active, display_name")
      .eq("user_id", callerId)
      .single();

    if (profileError || !callerProfile) {
      await auditLog({
        result: "BLOCKED",
        reason: "Caller has no CRM profile",
        caller_id: callerId,
        caller_email: callerEmail,
      });
      return jsonResponse({ error: "Forbidden - Not a CRM staff member" }, 403);
    }

    if (!callerProfile.is_active) {
      await auditLog({
        result: "BLOCKED",
        reason: "Caller account is inactive",
        caller_id: callerId,
        caller_email: callerEmail,
        caller_role: callerProfile.crm_role,
      });
      return jsonResponse({ error: "Forbidden - Account is inactive" }, 403);
    }

    const callerRole = callerProfile.crm_role as string;

    if (!ALLOWED_CALLER_ROLES.includes(callerRole as any)) {
      await auditLog({
        result: "BLOCKED",
        reason: "Caller role not authorized to create users",
        caller_id: callerId,
        caller_email: callerEmail,
        caller_role: callerRole,
      });
      return jsonResponse({ error: "Forbidden - Insufficient privileges" }, 403);
    }

    // =========================================================================
    // STEP 3: RATE LIMITING (based on audit logs)
    // =========================================================================
    const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS).toISOString();
    
    const { count: recentAttemptCount } = await supabaseAdmin
      .from("audit_logs")
      .select("*", { count: "exact", head: true })
      .eq("resource_type", "user")
      .eq("user_id", callerId)
      .gte("created_at", windowStart);

    if (recentAttemptCount && recentAttemptCount >= MAX_REQUESTS_PER_WINDOW) {
      await auditLog({
        result: "BLOCKED",
        reason: "Rate limit exceeded",
        caller_role: callerRole,
        attempt_count: recentAttemptCount,
      }, callerId, callerEmail);
      console.warn(`[CREATE-CRM-USER] RATE LIMITED: ${callerEmail}`);
      return jsonResponse({ error: "Rate limit exceeded. Max 10 users per hour." }, 429);
    }

    // =========================================================================
    // STEP 4: INPUT VALIDATION (Zod)
    // =========================================================================
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ error: "Invalid JSON body" }, 400);
    }

    const validation = CreateCrmUserSchema.safeParse(body);
    if (!validation.success) {
      await auditLog({
        result: "BLOCKED",
        reason: "Input validation failed",
        caller_id: callerId,
        caller_email: callerEmail,
        caller_role: callerRole,
        validation_errors: validation.error.flatten(),
      });
      return jsonResponse({ 
        error: "Validation failed", 
        details: validation.error.flatten() 
      }, 400);
    }

    const { email, password, displayName, crmRole, jobTitle, phone } = validation.data;

    // =========================================================================
    // STEP 5: ROLE ESCALATION PREVENTION
    // =========================================================================
    const allowedRolesToAssign = ROLE_PERMISSIONS[callerRole] || [];
    
    if (!allowedRolesToAssign.includes(crmRole)) {
      await auditLog({
        result: "BLOCKED",
        reason: "Role escalation attempt",
        caller_id: callerId,
        caller_email: callerEmail,
        caller_role: callerRole,
        target_email: email,
        requested_role: crmRole,
        allowed_roles: allowedRolesToAssign,
      });
      return jsonResponse({ 
        error: `Forbidden - Cannot assign role '${crmRole}'. Your role '${callerRole}' can only assign: ${allowedRolesToAssign.join(", ")}` 
      }, 403);
    }

    // =========================================================================
    // STEP 6: EMAIL DOMAIN VALIDATION
    // =========================================================================
    if (!email.endsWith("@jbj.ae")) {
      await auditLog({
        result: "BLOCKED",
        reason: "Invalid email domain",
        caller_id: callerId,
        caller_email: callerEmail,
        caller_role: callerRole,
        target_email: email,
      });
      return jsonResponse({ error: "Staff emails must be @jbj.ae" }, 400);
    }

    // =========================================================================
    // STEP 7: CREATE OR UPDATE USER
    // =========================================================================
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email?.toLowerCase() === email);

    let userId: string;
    let isNewUser = false;

    if (existingUser) {
      // Update existing user
      const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        user_metadata: { full_name: displayName, force_password_change: true },
      });

      if (updateError) {
        await auditLog({
          result: "ERROR",
          reason: "Failed to update existing user",
          caller_id: callerId,
          caller_email: callerEmail,
          caller_role: callerRole,
          target_email: email,
          error: updateError.message,
        });
        return jsonResponse({ error: updateError.message }, 400);
      }
      userId = existingUser.id;
    } else {
      // Create new user
      const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: displayName, force_password_change: true },
      });

      if (createError) {
        await auditLog({
          result: "ERROR",
          reason: "Failed to create new user",
          caller_id: callerId,
          caller_email: callerEmail,
          caller_role: callerRole,
          target_email: email,
          error: createError.message,
        });
        return jsonResponse({ error: createError.message }, 400);
      }
      userId = newUser.user.id;
      isNewUser = true;
    }

    // =========================================================================
    // STEP 8: CREATE PROFILES
    // =========================================================================
    await supabaseAdmin.from("profiles").upsert({
      id: userId,
      email,
      full_name: displayName,
      phone_number: phone,
    });

    const { error: crmError } = await supabaseAdmin.from("crm_users_profile").upsert({
      user_id: userId,
      crm_role: crmRole,
      is_active: true,
      display_name: displayName,
      job_title: jobTitle,
      phone,
      email,
      force_password_change: true,
    }, { onConflict: "user_id" });

    if (crmError) {
      await auditLog({
        result: "ERROR",
        reason: "Failed to create CRM profile",
        caller_id: callerId,
        caller_email: callerEmail,
        caller_role: callerRole,
        target_email: email,
        target_user_id: userId,
        error: crmError.message,
      });
      return jsonResponse({ error: crmError.message }, 400);
    }

    // =========================================================================
    // STEP 9: SUCCESS AUDIT LOG
    // =========================================================================
    await auditLog({
      result: "SUCCESS",
      action: isNewUser ? "created" : "updated",
      caller_id: callerId,
      caller_email: callerEmail,
      caller_role: callerRole,
      caller_name: callerProfile.display_name,
      target_user_id: userId,
      target_email: email,
      target_role: crmRole,
      target_name: displayName,
    });

    console.log(`[CREATE-CRM-USER] ${callerEmail} (${callerRole}) ${isNewUser ? "created" : "updated"} ${email} as ${crmRole}`);

    return jsonResponse({
      success: true,
      user: { id: userId, email, displayName, crmRole },
      action: isNewUser ? "created" : "updated",
    }, 200);

  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[CREATE-CRM-USER] Error:", msg);
    return jsonResponse({ error: msg }, 500);
  }
});
