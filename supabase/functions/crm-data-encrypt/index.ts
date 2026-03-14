
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AES-256-GCM helpers
async function getEncryptionKey(): Promise<CryptoKey | null> {
  const rawKey = Deno.env.get("CRM_ENCRYPTION_KEY");
  if (!rawKey) return null;
  const keyBytes = new Uint8Array(
    rawKey.match(/.{1,2}/g)!.map((b: string) => parseInt(b, 16))
  );
  return crypto.subtle.importKey("raw", keyBytes, { name: "AES-GCM" }, false, [
    "encrypt",
    "decrypt",
  ]);
}

async function encrypt(
  key: CryptoKey,
  plaintext: string
): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    encoded
  );
  // Format: base64(iv):base64(ciphertext)
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(
    String.fromCharCode(...new Uint8Array(ciphertext))
  );
  return `${ivB64}:${ctB64}`;
}

async function decrypt(
  key: CryptoKey,
  combined: string
): Promise<string> {
  const [ivB64, ctB64] = combined.split(":");
  const iv = new Uint8Array(
    atob(ivB64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const ciphertext = new Uint8Array(
    atob(ctB64)
      .split("")
      .map((c) => c.charCodeAt(0))
  );
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv },
    key,
    ciphertext
  );
  return new TextDecoder().decode(plaintext);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create user-context client to verify identity
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Service client for DB operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check owner role
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();

    const isOwner = roleData?.role === "owner" || user.email === Deno.env.get("OWNER_EMAIL");

    const { action, fields, recordId, records } = await req.json();

    // Get encryption key
    const encKey = await getEncryptionKey();

    if (!encKey) {
      return new Response(
        JSON.stringify({
          error: "CRM_ENCRYPTION_KEY not configured",
          key_missing: true,
          message: "Encryption key has not been set up yet. Add the CRM_ENCRYPTION_KEY secret to enable encryption.",
        }),
        { status: 503, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "encrypt") {
      // Encrypt provided fields
      const encrypted: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields as Record<string, string>)) {
        if (value) {
          encrypted[key] = await encrypt(encKey, value);
        }
      }
      return new Response(JSON.stringify({ encrypted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "decrypt") {
      // Only owner/admin can decrypt
      if (!isOwner) {
        // Log access denied
        await serviceClient.from("encryption_audit_log").insert({
          user_id: user.id,
          action: "access_denied",
          data_class: "crm_lead",
          record_id: recordId || "unknown",
          details: { reason: "insufficient_role" },
        });
        return new Response(
          JSON.stringify({ error: "Insufficient permissions to decrypt" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const decrypted: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields as Record<string, string>)) {
        if (value) {
          try {
            decrypted[key] = await decrypt(encKey, value);
          } catch {
            decrypted[key] = "[decryption_failed]";
          }
        }
      }

      // Log successful decrypt
      await serviceClient.from("encryption_audit_log").insert({
        user_id: user.id,
        action: "decrypt",
        data_class: "crm_lead",
        record_id: recordId || "bulk",
        details: { fields: Object.keys(fields) },
      });

      return new Response(JSON.stringify({ decrypted }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "migrate") {
      // Owner-only: bulk encrypt existing plaintext data
      if (!isOwner) {
        return new Response(
          JSON.stringify({ error: "Owner only" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Fetch leads with plaintext data that hasn't been encrypted yet
      const { data: leads, error: leadsError } = await serviceClient
        .from("crm_leads")
        .select("id, phone_e164, email_lower, notes")
        .is("phone_encrypted", null)
        .limit(100);

      if (leadsError) {
        return new Response(
          JSON.stringify({ error: leadsError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      let migrated = 0;
      for (const lead of leads || []) {
        const updates: Record<string, string | null> = {};
        if (lead.phone_e164) {
          updates.phone_encrypted = await encrypt(encKey, lead.phone_e164);
        }
        if (lead.email_lower) {
          updates.email_encrypted = await encrypt(encKey, lead.email_lower);
        }
        if (lead.notes) {
          updates.notes_encrypted = await encrypt(encKey, lead.notes);
        }

        if (Object.keys(updates).length > 0) {
          await serviceClient
            .from("crm_leads")
            .update(updates)
            .eq("id", lead.id);
          migrated++;
        }
      }

      // Log migration
      await serviceClient.from("encryption_audit_log").insert({
        user_id: user.id,
        action: "encrypt",
        data_class: "crm_lead",
        record_id: "bulk_migration",
        details: { migrated_count: migrated, batch_size: (leads || []).length },
      });

      return new Response(
        JSON.stringify({
          success: true,
          migrated,
          remaining: (leads || []).length === 100 ? "more batches needed" : "complete",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "status") {
      // Check if encryption key is configured
      return new Response(
        JSON.stringify({
          key_configured: !!encKey,
          algorithm: "AES-256-GCM",
          key_source: "CRM_ENCRYPTION_KEY (server secret)",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action. Use: encrypt, decrypt, migrate, status" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
