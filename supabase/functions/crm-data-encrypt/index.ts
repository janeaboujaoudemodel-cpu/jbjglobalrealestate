
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── AES-256-GCM helpers ──

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

async function encrypt(key: CryptoKey, plaintext: string): Promise<string> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encoded = new TextEncoder().encode(plaintext);
  const ciphertext = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, encoded);
  const ivB64 = btoa(String.fromCharCode(...iv));
  const ctB64 = btoa(String.fromCharCode(...new Uint8Array(ciphertext)));
  return `${ivB64}:${ctB64}`;
}

async function decrypt(key: CryptoKey, combined: string): Promise<string> {
  const [ivB64, ctB64] = combined.split(":");
  const iv = new Uint8Array(atob(ivB64).split("").map((c) => c.charCodeAt(0)));
  const ciphertext = new Uint8Array(atob(ctB64).split("").map((c) => c.charCodeAt(0)));
  const plaintext = await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ciphertext);
  return new TextDecoder().decode(plaintext);
}

// ── Safe error response ──

function safeError(status: number, message: string, extra?: Record<string, unknown>) {
  return new Response(
    JSON.stringify({ error: message, ...(extra || {}) }),
    { status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

function jsonOk(data: unknown) {
  return new Response(JSON.stringify(data), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── Supported data targets ──

type DataTarget = "crm_leads" | "hr_employees" | "resale_listings";

const TARGET_CONFIG: Record<DataTarget, {
  plainFields: string[];
  encryptedFields: string[];
  dataClass: string;
}> = {
  crm_leads: {
    plainFields: ["phone_e164", "email_lower", "notes"],
    encryptedFields: ["phone_encrypted", "email_encrypted", "notes_encrypted"],
    dataClass: "crm_lead",
  },
  hr_employees: {
    plainFields: ["phone", "email", "cv_url"],
    encryptedFields: ["phone_encrypted", "email_encrypted", "cv_url_encrypted"],
    dataClass: "hr_employee",
  },
  // resale_listings plaintext PII columns have been removed; encryption is
  // now performed at write time via the client-side crm-data-encrypt helper
  // before insert. No server-side backfill target remains.
};

// ── Main handler ──

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return safeError(401, "Unauthorized");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) return safeError(401, "Invalid token");

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check owner role
    const { data: roleData } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .single();
    const isOwner = roleData?.role === "owner" || user.email === Deno.env.get("OWNER_EMAIL");

    const body = await req.json();
    const { action, fields, recordId, target } = body;
    const dataTarget: DataTarget = target && TARGET_CONFIG[target as DataTarget] ? (target as DataTarget) : "crm_leads";
    const config = TARGET_CONFIG[dataTarget];

    // Get encryption key
    const encKey = await getEncryptionKey();
    if (!encKey) {
      return safeError(503, "Encryption key not configured", { key_missing: true });
    }

    // ── ENCRYPT ──
    if (action === "encrypt") {
      const encrypted: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields as Record<string, string>)) {
        if (value) encrypted[key] = await encrypt(encKey, value);
      }
      return jsonOk({ encrypted });
    }

    // ── DECRYPT ──
    if (action === "decrypt") {
      if (!isOwner) {
        await serviceClient.from("encryption_audit_log").insert({
          user_id: user.id, action: "access_denied", data_class: config.dataClass,
          record_id: recordId || "unknown", details: { reason: "insufficient_role" },
        });
        return safeError(403, "Insufficient permissions to decrypt");
      }

      const decrypted: Record<string, string> = {};
      for (const [key, value] of Object.entries(fields as Record<string, string>)) {
        if (value) {
          try { decrypted[key] = await decrypt(encKey, value); }
          catch { decrypted[key] = "[decryption_failed]"; }
        }
      }

      await serviceClient.from("encryption_audit_log").insert({
        user_id: user.id, action: "decrypt", data_class: config.dataClass,
        record_id: recordId || "bulk", details: { fields: Object.keys(fields), target: dataTarget },
      });
      return jsonOk({ decrypted });
    }

    // ── MIGRATE — bulk encrypt plaintext rows ──
    if (action === "migrate") {
      if (!isOwner) return safeError(403, "Owner only");

      const selectFields = ["id", ...config.plainFields].join(", ");
      const { data: rows, error: fetchErr } = await serviceClient
        .from(dataTarget)
        .select(selectFields)
        .is(config.encryptedFields[0], null)
        .limit(100);

      if (fetchErr) return safeError(500, "Failed to fetch records for migration");

      let migrated = 0;
      for (const row of rows || []) {
        const updates: Record<string, string | null> = {};
        for (let i = 0; i < config.plainFields.length; i++) {
          const plainVal = row[config.plainFields[i]];
          if (plainVal) {
            updates[config.encryptedFields[i]] = await encrypt(encKey, plainVal);
          }
        }
        if (Object.keys(updates).length > 0) {
          await serviceClient.from(dataTarget).update(updates).eq("id", row.id);
          migrated++;
        }
      }

      await serviceClient.from("encryption_audit_log").insert({
        user_id: user.id, action: "encrypt", data_class: config.dataClass,
        record_id: "bulk_migration",
        details: { migrated_count: migrated, batch_size: (rows || []).length, target: dataTarget },
      });

      // Update encryption_status if migration complete
      if ((rows || []).length < 100) {
        await serviceClient
          .from("encryption_status")
          .update({ is_encrypted: true, risk_level: "low", notes: "Encrypted via bulk migration" })
          .eq("table_name", dataTarget)
          .eq("is_encrypted", false);
      }

      return jsonOk({
        success: true, migrated, target: dataTarget,
        remaining: (rows || []).length === 100 ? "more batches needed" : "complete",
      });
    }

    // ── STATUS ──
    if (action === "status") {
      return jsonOk({
        key_configured: true,
        algorithm: "AES-256-GCM",
        key_source: "CRM_ENCRYPTION_KEY (server secret)",
        supported_targets: Object.keys(TARGET_CONFIG),
      });
    }

    return safeError(400, "Invalid action. Use: encrypt, decrypt, migrate, status");
  } catch (_err) {
    // Never leak internal details
    return safeError(500, "Internal server error");
  }
});
