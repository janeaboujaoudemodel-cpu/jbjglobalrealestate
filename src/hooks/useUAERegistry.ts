import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export type UAEEmirate = "Abu Dhabi" | "Dubai" | "Sharjah" | "Ajman" | "Ras Al Khaimah" | "Fujairah" | "Umm Al Quwain";
export type OutreachStatus =
  | "Not Contacted" | "Test Sent" | "Contacted" | "Replied" | "Follow-up Needed"
  | "Documents Requested" | "Documents Sent" | "Registered" | "Declined" | "No Response";

export type RegistryRecordType = "developer" | "brokerage";

export const EMIRATES: UAEEmirate[] = [
  "Abu Dhabi", "Dubai", "Sharjah", "Ajman", "Ras Al Khaimah", "Fujairah", "Umm Al Quwain",
];

export const OUTREACH_STATUSES: OutreachStatus[] = [
  "Not Contacted", "Test Sent", "Contacted", "Replied", "Follow-up Needed",
  "Documents Requested", "Documents Sent", "Registered", "Declined", "No Response",
];

const TBL = (t: RegistryRecordType) => (t === "developer" ? "uae_dev_registry" : "uae_brk_registry");

export function useRegistryList(type: RegistryRecordType, emirate?: UAEEmirate) {
  return useQuery({
    queryKey: ["uae-registry", type, emirate ?? "all"],
    queryFn: async () => {
      let q = (supabase as any).from(TBL(type)).select("*").order("created_at", { ascending: false });
      if (emirate) q = q.eq("emirate_section", emirate);
      const { data, error } = await q;
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegistryRecord(type: RegistryRecordType, id?: string) {
  return useQuery({
    queryKey: ["uae-registry", type, "detail", id],
    enabled: !!id,
    queryFn: async () => {
      const { data, error } = await (supabase as any).from(TBL(type)).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data;
    },
  });
}

export function useRegistrySources(type: RegistryRecordType, id?: string) {
  return useQuery({
    queryKey: ["uae-registry-sources", type, id],
    enabled: !!id,
    queryFn: async () => {
      const col = type === "developer" ? "developer_id" : "brokerage_id";
      const { data, error } = await (supabase as any).from("uae_registry_sources").select("*").eq(col, id).order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useRegistryLog(type: RegistryRecordType, id?: string) {
  return useQuery({
    queryKey: ["uae-registry-log", type, id],
    enabled: !!id,
    queryFn: async () => {
      const col = type === "developer" ? "developer_id" : "brokerage_id";
      const { data, error } = await (supabase as any).from("uae_registry_log").select("*").eq(col, id).order("occurred_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Find an existing master record by name/website/phone before insert. */
export async function findExistingCompany(
  type: RegistryRecordType,
  name?: string | null,
  website?: string | null,
  phone?: string | null,
): Promise<string | null> {
  if (!name && !website && !phone) return null;
  const { data, error } = await (supabase as any).rpc("find_existing_company", {
    p_kind: type,
    p_name: name ?? null,
    p_website: website ?? null,
    p_phone: phone ?? null,
  });
  if (error) return null;
  return (data as string | null) ?? null;
}

export function useCreateRecord(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Record<string, unknown>) => {
      const refKey = type === "developer" ? "developer_ref" : "brokerage_ref";
      const ref = (payload[refKey] as string) || `${type === "developer" ? "DEV" : "BRK"}-${Date.now()}`;

      // Dedup gate: check name/website/phone first
      const phoneCandidate =
        (payload.outreach_phone as string | undefined) ||
        (Array.isArray(payload.main_phone_numbers) ? (payload.main_phone_numbers as string[])[0] : undefined);
      const existingId = await findExistingCompany(
        type,
        (payload.brand_name as string) ?? (payload.legal_company_name as string),
        payload.website as string | undefined,
        phoneCandidate ?? null,
      );

      if (existingId) {
        const { data, error } = await (supabase as any)
          .from(TBL(type))
          .update(payload)
          .eq("id", existingId)
          .select()
          .single();
        if (error) throw error;
        return { ...data, __merged: true };
      }

      const { data, error } = await (supabase as any).from(TBL(type)).insert({ ...payload, [refKey]: ref }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      qc.invalidateQueries({ queryKey: ["uae-registry", type] });
      toast.success(data?.__merged ? "Merged into existing record" : "Record created");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to create"),
  });
}

// ----- CSV / Excel ingestion -------------------------------------------

const HEADER_MAP: Record<string, string> = {
  "company name": "brand_name",
  "brand": "brand_name",
  "brand name": "brand_name",
  "legal name": "legal_company_name",
  "legal company name": "legal_company_name",
  "emirate": "emirate_section",
  "license": "license_number",
  "license number": "license_number",
  "license authority": "regulator_or_authority",
  "regulator": "regulator_or_authority",
  "website": "website",
  "instagram": "instagram_url",
  "linkedin": "linkedin_url",
  "google maps": "office_google_maps_url",
  "office address": "headquarters_address",
  "address": "headquarters_address",
  "phone": "__phone",
  "phone number": "__phone",
  "email": "__email",
  "company size": "company_size_estimated",
  "number of brokers": "number_of_brokers",
  "specialization": "__specialization",
  "primary market": "primary_market",
  "notes": "notes",
};

function parseCsv(text: string): Record<string, string>[] {
  const lines = text.replace(/\r\n/g, "\n").split("\n").filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];
  const splitLine = (line: string): string[] => {
    const out: string[] = [];
    let cur = "", inQ = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQ && line[i + 1] === '"') { cur += '"'; i++; } else { inQ = !inQ; }
      } else if (ch === "," && !inQ) { out.push(cur); cur = ""; }
      else cur += ch;
    }
    out.push(cur);
    return out.map((s) => s.trim());
  };
  const headers = splitLine(lines[0]).map((h) => h.toLowerCase().trim());
  return lines.slice(1).map((line) => {
    const cols = splitLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, i) => { row[h] = cols[i] ?? ""; });
    return row;
  });
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const URL_RE = /^https?:\/\/[^\s]+$/i;

export function useImportRegistryCsv(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (file: File) => {
      const text = await file.text();
      const rows = parseCsv(text);
      const result = { inserted: 0, updated: 0, rejected: [] as Array<{ row: number; reason: string }> };

      for (let i = 0; i < rows.length; i++) {
        const raw = rows[i];
        const mapped: Record<string, any> = {};
        let phone: string | null = null;
        let email: string | null = null;
        let specialization: string[] | null = null;

        for (const [k, v] of Object.entries(raw)) {
          const target = HEADER_MAP[k];
          if (!target || !v) continue;
          if (target === "__phone") phone = v;
          else if (target === "__email") email = v;
          else if (target === "__specialization") specialization = v.split(/[;|,]/).map((s) => s.trim()).filter(Boolean);
          else if (target === "number_of_brokers") mapped[target] = parseInt(v, 10) || null;
          else mapped[target] = v;
        }

        if (!mapped.brand_name && !mapped.legal_company_name) {
          result.rejected.push({ row: i + 2, reason: "Missing company/brand name" }); continue;
        }
        if (!mapped.brand_name) mapped.brand_name = mapped.legal_company_name;
        if (!mapped.legal_company_name) mapped.legal_company_name = mapped.brand_name;
        if (!mapped.emirate_section) mapped.emirate_section = "Dubai";
        if (mapped.website && !URL_RE.test(mapped.website)) {
          result.rejected.push({ row: i + 2, reason: `Invalid website: ${mapped.website}` }); continue;
        }
        if (email && !EMAIL_RE.test(email)) {
          result.rejected.push({ row: i + 2, reason: `Invalid email: ${email}` }); continue;
        }
        if (specialization) mapped.specialization = specialization;
        if (email) {
          mapped.main_email_addresses = [email];
          if (type === "brokerage") mapped.outreach_email = email; else mapped.registration_email = email;
        }
        if (phone) {
          mapped.main_phone_numbers = [phone];
          if (type === "brokerage") mapped.outreach_phone = phone;
        }

        const existingId = await findExistingCompany(type, mapped.brand_name, mapped.website, phone);
        try {
          if (existingId) {
            const { error } = await (supabase as any).from(TBL(type)).update(mapped).eq("id", existingId);
            if (error) throw error;
            result.updated++;
          } else {
            const refKey = type === "developer" ? "developer_ref" : "brokerage_ref";
            const ref = `${type === "developer" ? "DEV" : "BRK"}-${Date.now()}-${i}`;
            const { error } = await (supabase as any).from(TBL(type)).insert({ ...mapped, [refKey]: ref });
            if (error) throw error;
            result.inserted++;
          }
        } catch (e: any) {
          result.rejected.push({ row: i + 2, reason: e.message ?? "Insert failed" });
        }
      }

      return result;
    },
    onSuccess: (r) => {
      qc.invalidateQueries({ queryKey: ["uae-registry", type] });
      toast.success(`Imported: ${r.inserted} new, ${r.updated} updated, ${r.rejected.length} rejected`);
    },
    onError: (e: any) => toast.error(e.message ?? "Import failed"),
  });
}

export function useUpdateRecord(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Record<string, unknown> }) => {
      const { data, error } = await (supabase as any).from(TBL(type)).update(patch).eq("id", id).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["uae-registry", type] });
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to save"),
  });
}

export function useAddSource(type: RegistryRecordType) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { recordId: string; source_name: string; source_url: string; fields_verified: string[]; priority_tier?: number; snippet?: string }) => {
      const col = type === "developer" ? "developer_id" : "brokerage_id";
      const { data, error } = await (supabase as any).from("uae_registry_sources").insert({
        [col]: payload.recordId,
        source_name: payload.source_name,
        source_url: payload.source_url,
        fields_verified: payload.fields_verified,
        priority_tier: payload.priority_tier ?? 1,
        snippet: payload.snippet,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ["uae-registry-sources", type, vars.recordId] });
      toast.success("Source added");
    },
    onError: (e: any) => toast.error(e.message ?? "Failed to add source"),
  });
}

export async function sendRegistrationEmail(payload: {
  recordType: RegistryRecordType;
  recordId: string;
  language?: "en" | "ar";
  contactPersonName: string;
  recipientEmail: string;
  isTestSend?: boolean;
  attachmentNames?: string[];
}) {
  const { data, error } = await (supabase as any).functions.invoke("uae-registry-send", { body: payload });
  if (error) throw error;
  return data;
}
