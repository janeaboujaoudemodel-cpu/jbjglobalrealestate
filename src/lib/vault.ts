/**
 * Secure Vault SDK — client helper.
 *
 * All sensitive uploads go through two edge functions:
 *   - vault-upload-url  → returns a 2-minute signed PUT URL (and pre-creates the DB row)
 *   - vault-signed-url  → returns a 60-second signed GET URL (and audits every read)
 *
 * The bucket "user-vault" is PRIVATE; no public URLs are ever produced.
 */
import { supabase } from "@/integrations/supabase/client";

export type VaultCategory =
  | "identity"
  | "property"
  | "contract"
  | "financial"
  | "other";

export type VaultDocument = {
  id: string;
  user_id: string;
  category: VaultCategory;
  display_name: string;
  doc_type: string | null;
  storage_path: string;
  mime_type: string | null;
  size_bytes: number | null;
  issue_date: string | null;
  expiry_date: string | null;
  verified: boolean;
  created_at: string;
};

export const VAULT_MAX_BYTES = 25 * 1024 * 1024;
export const VAULT_ALLOWED_MIME = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
];

async function sha256Hex(file: File): Promise<string> {
  const buf = await file.arrayBuffer();
  const hash = await crypto.subtle.digest("SHA-256", buf);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Upload a sensitive file → returns the created document row. */
export async function uploadVaultFile(opts: {
  file: File;
  category: VaultCategory;
  docType?: string;
  displayName?: string;
}): Promise<VaultDocument> {
  const { file, category, docType, displayName } = opts;

  if (file.size > VAULT_MAX_BYTES) throw new Error("File exceeds 25 MB cap.");
  if (!VAULT_ALLOWED_MIME.includes(file.type))
    throw new Error("Unsupported file type. Use PDF, JPG, PNG, WEBP, or HEIC.");

  // 1) Request a signed PUT URL + DB row
  const { data: ticket, error: ticketErr } = await supabase.functions.invoke(
    "vault-upload-url",
    {
      body: {
        category,
        doc_type: docType ?? null,
        display_name: displayName ?? file.name,
        mime_type: file.type,
        size_bytes: file.size,
      },
    },
  );
  if (ticketErr || !ticket?.upload_url) {
    throw new Error(ticketErr?.message ?? "Could not start secure upload.");
  }

  // 2) PUT the bytes directly to storage using the signed token
  const { error: putErr } = await supabase.storage
    .from("user-vault")
    .uploadToSignedUrl(ticket.storage_path, ticket.token, file, {
      contentType: file.type,
      upsert: false,
    });
  if (putErr) throw putErr;

  // 3) Record integrity hash on the row
  const sha = await sha256Hex(file);
  const { data: row, error: updErr } = await supabase
    .from("vault_documents")
    .update({ sha256: sha })
    .eq("id", ticket.document_id)
    .select("*")
    .single();
  if (updErr) throw updErr;
  return row as VaultDocument;
}

/** Ask the edge function for a 60-second signed URL to view/download a doc. */
export async function getVaultSignedUrl(
  documentId: string,
): Promise<{ url: string; expires_at: string }> {
  const { data, error } = await supabase.functions.invoke("vault-signed-url", {
    body: { document_id: documentId },
  });
  if (error || !data?.signed_url) {
    throw new Error(error?.message ?? "Could not generate secure link.");
  }
  return { url: data.signed_url as string, expires_at: data.expires_at as string };
}

export async function listMyVaultDocuments(): Promise<VaultDocument[]> {
  const { data, error } = await supabase
    .from("vault_documents")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VaultDocument[];
}

export async function deleteVaultDocument(id: string): Promise<void> {
  const { data: doc, error: gErr } = await supabase
    .from("vault_documents")
    .select("storage_path")
    .eq("id", id)
    .single();
  if (gErr) throw gErr;
  // Storage delete (RLS allows self/owner)
  await supabase.storage.from("user-vault").remove([doc.storage_path]);
  const { error } = await supabase.from("vault_documents").delete().eq("id", id);
  if (error) throw error;
}

// ── Properties (drive VIP ranking) ────────────────────────────
export type VaultProperty = {
  id: string;
  user_id: string;
  project_name: string;
  developer_name: string | null;
  area: string | null;
  emirate: string | null;
  unit_number: string | null;
  bedrooms: number | null;
  size_sqft: number | null;
  purchase_price_aed: number;
  purchase_date: string | null;
  handover_date: string | null;
  status: string;
  title_deed_doc_id: string | null;
  verified: boolean;
  created_at: string;
};

export async function listMyVaultProperties(): Promise<VaultProperty[]> {
  const { data, error } = await supabase
    .from("vault_properties")
    .select("*")
    .order("purchase_price_aed", { ascending: false });
  if (error) throw error;
  return (data ?? []) as VaultProperty[];
}

export async function createVaultProperty(
  p: Omit<VaultProperty, "id" | "user_id" | "created_at" | "verified">,
): Promise<VaultProperty> {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) throw new Error("Sign in required.");
  const { data, error } = await supabase
    .from("vault_properties")
    .insert({ ...p, user_id: u.user.id })
    .select("*")
    .single();
  if (error) throw error;
  return data as VaultProperty;
}

export async function deleteVaultProperty(id: string): Promise<void> {
  const { error } = await supabase.from("vault_properties").delete().eq("id", id);
  if (error) throw error;
}

// ── Ranking ───────────────────────────────────────────────────
export type VaultRanking = {
  user_id: string;
  total_invested_aed: number;
  property_count: number;
  verified_count: number;
  vip_tier: "bronze" | "silver" | "gold" | "platinum" | "diamond";
  rank_position: number | null;
};

export async function getMyVaultRanking(): Promise<VaultRanking | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u?.user) return null;
  const { data } = await supabase
    .from("vault_investor_ranking")
    .select("*")
    .eq("user_id", u.user.id)
    .maybeSingle();
  return (data as VaultRanking) ?? null;
}

export const VIP_LABEL: Record<VaultRanking["vip_tier"], string> = {
  diamond: "Diamond",
  platinum: "Platinum",
  gold: "Gold",
  silver: "Silver",
  bronze: "Bronze",
};

export function formatAed(n: number): string {
  if (!Number.isFinite(n)) return "AED 0";
  return "AED " + Math.round(n).toLocaleString("en-AE");
}
