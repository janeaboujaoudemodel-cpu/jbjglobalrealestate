import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ---------- Brokerages ---------- */
export const useBrokerages = () => useQuery({
  queryKey: ["crm-brokerages"],
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  placeholderData: (prev) => prev,
  queryFn: async () => {
    // Paginate past Supabase's default 1000-row cap so the entire directory loads.
    const PAGE = 1000;
    const all: any[] = [];
    for (let from = 0; ; from += PAGE) {
      const { data, error } = await supabase
        .from("crm_brokerages")
        .select("*")
        .order("updated_at", { ascending: false })
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const batch = data || [];
      all.push(...batch);
      if (batch.length < PAGE) break;
      if (from > 200_000) break; // hard safety stop
    }
    return all;
  },
});

/* ---------- Brokerage Agents (lazy, cached per brokerage) ---------- */
export const useBrokerageAgents = (brokerageId?: string | null) => useQuery({
  queryKey: ["crm-brokerage-agents", brokerageId],
  enabled: !!brokerageId,
  staleTime: 60_000,
  placeholderData: (prev) => prev,
  queryFn: async () => {
    const { data, error } = await (supabase as any)
      .from("crm_brokerage_agents")
      .select("*")
      .eq("brokerage_id", brokerageId)
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertBrokerage = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, owner_id: payload.owner_id || user!.id };
      const { data, error } = payload.id
        ? await supabase.from("crm_brokerages").update(row).eq("id", payload.id).select().single()
        : await supabase.from("crm_brokerages").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (saved: any) => {
      const prev = qc.getQueryData<any[]>(["crm-brokerages"]);
      if (saved && Array.isArray(prev)) {
        const i = prev.findIndex((r) => r.id === saved.id);
        const next = i >= 0 ? prev.map((r) => r.id === saved.id ? { ...r, ...saved } : r) : [saved, ...prev];
        qc.setQueryData(["crm-brokerages"], next);
      } else {
        qc.invalidateQueries({ queryKey: ["crm-brokerages"] });
      }
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteBrokerage = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_brokerages").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-brokerages"] }); toast.success("Deleted"); },
  });
};

/* ---------- Clients ---------- */
export const useClients = () => useQuery({
  queryKey: ["crm-clients"],
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  placeholderData: (prev) => prev,
  queryFn: async () => {
    const { data, error } = await supabase.from("crm_clients").select("*").order("updated_at", { ascending: false });
    if (error) throw error;
    return data || [];
  },
});

export const useUpsertClient = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, owner_id: payload.owner_id || user!.id };
      const { data, error } = payload.id
        ? await supabase.from("crm_clients").update(row).eq("id", payload.id).select().single()
        : await supabase.from("crm_clients").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-clients"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
};

export const useDeleteClient = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("crm_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-clients"] }); toast.success("Deleted"); },
  });
};

/* ---------- Developer Registry ---------- */
export const useDeveloperRegistry = () => useQuery({
  queryKey: ["crm-dev-registry"],
  staleTime: 60_000,
  refetchOnWindowFocus: false,
  placeholderData: (prev) => prev,
  queryFn: async () => {
    // Paginate past server-side row caps so the full registry (hundreds/thousands) is returned.
    const PAGE = 1000;
    const all: any[] = [];
    let from = 0;
    // Hard ceiling to avoid runaway loops; lifts the previous ~93/1000 visible cap.
    while (from < 50000) {
      const { data, error } = await supabase
        .from("crm_developer_registry")
        .select("*")
        .order("developer_name")
        .range(from, from + PAGE - 1);
      if (error) throw error;
      const batch = data || [];
      all.push(...batch);
      if (batch.length < PAGE) break;
      from += PAGE;
    }
    return all;
  },
});

export const useSeedDeveloperRegistry = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.rpc("seed_crm_developer_registry", { p_owner_id: user!.id });
      if (error) throw error;
      return data;
    },
    onSuccess: (count) => { qc.invalidateQueries({ queryKey: ["crm-dev-registry"] }); toast.success(`${count} developers ready in registry`); },
    onError: (e: any) => toast.error(e.message),
  });
};

/**
 * Imports the entire `developers` catalog into the owner's `crm_developer_registry`.
 * Pages through the catalog (Supabase JS caps a single request at 1000 rows) and
 * upserts on the unique (owner_id, developer_slug) constraint so re-running is safe
 * and never overwrites existing curated entries.
 */
export const useImportAllDevelopersToRegistry = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (opts: { silent?: boolean } = {}) => {
      if (!user) throw new Error("Not signed in");
      const silent = !!opts.silent;

      const slugify = (n: string) =>
        n.toLowerCase().replace(/[^a-z0-9 -]/g, "").replace(/\s+/g, "-");

      // Fetch the existing registry so we can dedupe by NAME (not just slug),
      // preventing aliases like "aldar" / "aldar-properties" / "developed-by-aldar-properties"
      // from creating multiple cards for the same developer.
      const existingNames = new Set<string>();
      const existingSlugs = new Set<string>();
      {
        const PAGE = 1000;
        let from = 0;
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { data, error } = await supabase
            .from("crm_developer_registry")
            .select("developer_name, developer_slug")
            .eq("owner_id", user.id)
            .range(from, from + PAGE - 1);
          if (error) throw error;
          (data || []).forEach((r: any) => {
            if (r.developer_name) existingNames.add(String(r.developer_name).trim().toLowerCase());
            if (r.developer_slug) existingSlugs.add(String(r.developer_slug).toLowerCase());
          });
          if (!data || data.length < PAGE) break;
          from += PAGE;
        }
      }

      const PAGE = 1000;
      let from = 0;
      let imported = 0;
      let scanned = 0;

      const toastId = silent ? undefined : toast.loading("Syncing developer catalog…", {
        description: "Adding any missing developers to your registry.",
      });

      try {
        // eslint-disable-next-line no-constant-condition
        while (true) {
          const { data: devs, error } = await supabase
            .from("developers")
            .select("name, slug, website_url, headquarters, logo_url, logo_url_processed, logo_url_dark")
            .or("is_hidden.is.null,is_hidden.eq.false")
            .order("name", { ascending: true })
            .range(from, from + PAGE - 1);
          if (error) throw error;
          if (!devs || devs.length === 0) break;
          scanned += devs.length;

          const rows = devs
            .filter((d: any) => d.name && String(d.name).trim().length > 0)
            .filter((d: any) => {
              const nameKey = String(d.name).trim().toLowerCase();
              const slugKey = (d.slug && d.slug.length > 0 ? d.slug : slugify(d.name)).toLowerCase();
              if (existingNames.has(nameKey) || existingSlugs.has(slugKey)) return false;
              // Mark as taken so two catalog rows with the same normalized name don't both insert.
              existingNames.add(nameKey);
              existingSlugs.add(slugKey);
              return true;
            })
            .map((d: any) => ({
              owner_id: user.id,
              developer_name: d.name,
              developer_slug: d.slug && d.slug.length > 0 ? d.slug : slugify(d.name),
              website: d.website_url ?? null,
              office_address: d.headquarters ?? null,
              logo_url: d.logo_url_processed ?? d.logo_url ?? d.logo_url_dark ?? null,
              developer_contact: {},
              status: "not_started",
              required_docs_complete: false,
              priority: "medium",
            }));

          if (rows.length > 0) {
            const { error: upErr } = await supabase
              .from("crm_developer_registry")
              .upsert(rows as any, {
                onConflict: "owner_id,developer_slug",
                ignoreDuplicates: true,
              });
            if (upErr) throw upErr;
            imported += rows.length;
          }

          if (toastId) toast.loading(`Syncing developers… ${imported.toLocaleString()} added`, {
            id: toastId,
          });

          if (devs.length < PAGE) break;
          from += PAGE;
        }

        return { imported, scanned, toastId, silent };
      } catch (e) {
        if (toastId) toast.error("Sync failed", {
          id: toastId,
          description: (e as any)?.message || "Please try again in a moment.",
        });
        throw e;
      }
    },
    onSuccess: ({ imported, scanned, toastId, silent }) => {
      qc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
      if (toastId && !silent) {
        if (imported > 0) {
          toast.success(`Synced ${imported.toLocaleString()} new developer${imported === 1 ? "" : "s"}`, {
            id: toastId,
            description: `${scanned.toLocaleString()} catalog entries scanned. Duplicates skipped.`,
          });
        } else {
          toast.success("Registry already up to date", { id: toastId });
        }
      }
    },
    onError: () => {},
  });
};

export const useUpsertDeveloperRegistry = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, owner_id: payload.owner_id || user!.id };
      const { data, error } = payload.id
        ? await supabase.from("crm_developer_registry").update(row).eq("id", payload.id).select().single()
        : await supabase.from("crm_developer_registry").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (saved: any) => {
      const prev = qc.getQueryData<any[]>(["crm-dev-registry"]);
      if (saved && Array.isArray(prev)) {
        const i = prev.findIndex((r) => r.id === saved.id);
        const next = i >= 0 ? prev.map((r) => r.id === saved.id ? { ...r, ...saved } : r) : [saved, ...prev];
        qc.setQueryData(["crm-dev-registry"], next);
      } else {
        qc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
      }
      toast.success("Saved");
    },
    onError: (e: any) => toast.error(e.message),
  });
};

/**
 * Researches missing developer fields (phone, email, office, website, point of contact)
 * via master catalog → Perplexity → Firecrawl → AI inference, and records the source
 * for each filled field in `field_sources`.
 */
// Wrap an edge-function invoke with a hard client-side timeout so spinners
// never run forever when the function hangs / network stalls.
async function invokeWithTimeout<T = any>(name: string, body: any, ms = 90_000): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`${name} timed out after ${Math.round(ms / 1000)}s — try a smaller batch or retry.`)), ms),
  );
  const call = supabase.functions.invoke(name, { body }).then(({ data, error }) => {
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as T;
  });
  return await Promise.race([call, timeout]);
}

export const useEnrichDeveloperRegistry = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ids?: string[]; useWeb?: boolean; batchSize?: number } = {}) => {
      const data = await invokeWithTimeout<any>("enrich-developer-registry", input);
      return data as { processed: number; results: Array<{ id: string; name: string; filled?: string[]; error?: string }>; message?: string };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
      const filled = (data.results || []).reduce((sum, r) => sum + (r.filled?.length ?? 0), 0);
      if (data.processed === 0) {
        toast.success(data.message || "Nothing left to enrich");
      } else {
        toast.success(`Researched ${data.processed} developer${data.processed === 1 ? "" : "s"} · ${filled} field${filled === 1 ? "" : "s"} updated`);
      }
    },
    onError: (e: any) => toast.error(e.message || "Enrichment failed"),
  });
};

/**
 * Pulls every licensed UAE real-estate brokerage from RERA / DMT / municipality
 * registries via Perplexity grounded search, normalizes phone/website/address,
 * and upserts into crm_brokerages without overwriting curated data.
 */
export const useSeedUaeBrokerageDirectory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { emirates?: string[]; target_per_emirate?: number } = {}) => {
      const data = await invokeWithTimeout<any>("seed-uae-brokerage-directory", input, 120_000);
      return data as { ok: true; summary: Record<string, { fetched: number; inserted: number; updated: number; skipped: number }> };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crm-brokerages"] });
      const totals = Object.values(data.summary).reduce(
        (a, s) => ({ inserted: a.inserted + s.inserted, updated: a.updated + s.updated }),
        { inserted: 0, updated: 0 },
      );
      toast.success(`Synced UAE directory · +${totals.inserted} new, ${totals.updated} updated`);
    },
    onError: (e: any) => toast.error(e.message || "Sync failed"),
  });
};

/**
 * Fills missing phone/email/website/office on brokerages via Perplexity + Firecrawl + AI extract.
 */
export const useEnrichUaeBrokerageDirectory = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { ids?: string[]; reverify?: boolean; batchSize?: number } = {}) => {
      const data = await invokeWithTimeout<any>("enrich-uae-brokerage-directory", input, 120_000);
      return data as { processed: number; timedOut?: boolean; results: Array<{ id: string; name: string; filled: string[] }> };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crm-brokerages"] });
      const filled = (data.results || []).reduce((s, r) => s + (r.filled?.length ?? 0), 0);
      toast.success(`Researched ${data.processed} brokerage${data.processed === 1 ? "" : "s"} · ${filled} field${filled === 1 ? "" : "s"} filled`);
    },
    onError: (e: any) => toast.error(e.message || "Enrichment failed"),
  });
};

/* ---------- Owner Settings ---------- */
export const useOwnerSettings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crm-owner-settings", user?.id],
    enabled: !!user,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_owner_settings").select("*").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      const base: any = data || {
        owner_id: user!.id,
        drive_doc_pack_url: "",
        signature_html: "",
        cc_jane_enabled: true,
        cc_email: "",
        reply_to_email: "contact@jbj.ae",
        from_name: "JBJ Global Real Estate",
        saved_sender_emails: ["contact@jbj.ae"],
        saved_cc_emails: [],
        active_cc_emails: [],
        brokerage_drive_doc_pack_url: "",
        brokerage_reply_to_email: "",
        brokerage_from_name: "Amra · JBJ Global Real Estate",
        brokerage_saved_sender_emails: [],
        brokerage_saved_cc_emails: [],
        brokerage_active_cc_emails: [],
        saved_test_to_emails: [],
        saved_test_cc_emails: [],
      };
      const arr = (v: any) => (Array.isArray(v) ? v : []);
      return {
        ...base,
        saved_sender_emails: arr(base.saved_sender_emails),
        saved_cc_emails: arr(base.saved_cc_emails),
        active_cc_emails: arr(base.active_cc_emails),
        brokerage_saved_sender_emails: arr(base.brokerage_saved_sender_emails),
        brokerage_saved_cc_emails: arr(base.brokerage_saved_cc_emails),
        brokerage_active_cc_emails: arr(base.brokerage_active_cc_emails),
        saved_test_to_emails: arr(base.saved_test_to_emails),
        saved_test_cc_emails: arr(base.saved_test_cc_emails),
        brokerage_from_name: base.brokerage_from_name || "Amra · JBJ Global Real Estate",
      };
    },
  });
};

export const useUpsertOwnerSettings = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, owner_id: user!.id };
      const { data, error } = await supabase.from("crm_owner_settings").upsert(row, { onConflict: "owner_id" }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-owner-settings"] }); toast.success("Settings saved"); },
    onError: (e: any) => toast.error(e.message),
  });
};

/* ---------- Quick status updater (inline dropdown) ---------- */
export const useQuickStatusUpdate = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vars: { entityType: "brokerage" | "client" | "developer_registry"; id: string; status: string; previousStatus?: string }) => {
      const tableMap = {
        brokerage: "crm_brokerages",
        client: "crm_clients",
        developer_registry: "crm_developer_registry",
      } as const;
      const table = tableMap[vars.entityType];
      const { error } = await (supabase.from(table) as any)
        .update({ status: vars.status, last_interaction_at: new Date().toISOString() })
        .eq("id", vars.id);
      if (error) throw error;
      await supabase.from("crm_relationship_status_history" as any).insert({
        owner_id: user!.id,
        entity_type: vars.entityType,
        entity_id: vars.id,
        from_status: vars.previousStatus || null,
        to_status: vars.status,
        source: "manual",
        changed_by: user!.id,
      });
      return { ok: true };
    },
    // Optimistic: patch only the affected row in its own cache. No cross-entity invalidation.
    onMutate: async (vars) => {
      const keyMap = {
        brokerage: ["crm-brokerages"],
        client: ["crm-clients"],
        developer_registry: ["crm-dev-registry"],
      } as const;
      const key = keyMap[vars.entityType];
      await qc.cancelQueries({ queryKey: key });
      const prev = qc.getQueryData<any[]>(key);
      if (Array.isArray(prev)) {
        qc.setQueryData<any[]>(key, prev.map((r) => r.id === vars.id ? { ...r, status: vars.status, last_interaction_at: new Date().toISOString() } : r));
      }
      return { prev, key };
    },
    onError: (e: any, _vars, ctx) => {
      if (ctx?.prev && ctx.key) qc.setQueryData(ctx.key, ctx.prev);
      toast.error(e?.message || "Failed to update status");
    },
    onSuccess: () => { toast.success("Status updated"); },
  });
};

export type RegistrationVariant = "developer_registration" | "developer_confirm_registered";
export type BrokerageVariant = "brokerage_partnership_intro" | "brokerage_breakfast_invite";
export type AnyEmailVariant = RegistrationVariant | BrokerageVariant;

export type BrokerageGroupStatus =
  | "prospective"
  | "existing"
  | "priority"
  | "active"
  | "nda"
  | "custom";

export interface BrokerageOutreachPersonalization {
  contactName?: string;
  contactFirstName?: string;
  groupStatus?: BrokerageGroupStatus;
  groupStatusLabelOverride?: string;
  preferredSlotId?: string;
  preferredEventTimeOverride?: string;
  /** Citi Developer e-catalogue project key (amra | allura | aveline | agua | arya). Defaults to amra. */
  featuredProjectKey?: string;
}

export const useSendBrokerageOutreach = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      brokerageId?: string;
      variant?: BrokerageVariant;
      testRecipient?: string;
      testBrokerageName?: string;
      overrideEmail?: string;
      fromEmailOverride?: string;
      ccEmailOverride?: string;
      personalization?: BrokerageOutreachPersonalization;
      silent?: boolean;
    }) => {
      const { silent, ...payload } = vars;
      const { data, error } = await supabase.functions.invoke("crm-send-brokerage-outreach", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, silent };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crm-brokerages"] });
      if (!data?.silent) {
        toast.success(data?.test ? `Test email sent to ${data.recipient}` : `Email sent to ${data.recipient}`);
      }
    },
    onError: (e: any) => toast.error(e.message || "Send failed"),
  });
};

/* ---------- Upcoming breakfast slots (for personalization picker) ---------- */
export const useUpcomingBreakfastSlots = () =>
  useQuery({
    queryKey: ["breakfast-slots-upcoming"],
    queryFn: async () => {
      const nowIso = new Date().toISOString();
      const { data, error } = await supabase
        .from("breakfast_slots")
        .select("id, slot_at, capacity")
        .gt("slot_at", nowIso)
        .order("slot_at", { ascending: true })
        .limit(8);
      if (error) throw error;
      return (data || []) as Array<{ id: string; slot_at: string; capacity: number | null }>;
    },
    staleTime: 60_000,
  });

/* ---------- Pre-send registration check (brokerage outreach) ---------- */
export type BrokerageCheckReasonCode =
  | "do_not_contact"
  | "already_partner"
  | "previous_breakfast_invite"
  | "previous_partnership_intro"
  | "lead_exists"
  | "client_exists"
  | "registered_broker";

export interface BrokerageCheckReason {
  code: BrokerageCheckReasonCode;
  label: string;
  matchedTable?: string;
  matchedId?: string;
  matchedEmail?: string;
}

export interface BrokerageCheckResult {
  brokerageId: string;
  status: "ok" | "warn" | "block";
  reasons: BrokerageCheckReason[];
}

export const useCheckBrokerageRegistration = () =>
  useMutation({
    mutationFn: async (vars: {
      brokerageIds: string[];
      variant: BrokerageVariant;
    }): Promise<BrokerageCheckResult[]> => {
      if (!vars.brokerageIds.length) return [];
      const { data, error } = await supabase.functions.invoke(
        "crm-check-brokerage-registration",
        { body: vars },
      );
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return (data?.results || []) as BrokerageCheckResult[];
    },
    onError: (e: any) => toast.error(e.message || "Pre-send check failed"),
  });

export const useSendDeveloperRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: {
      developerId?: string;
      variant?: RegistrationVariant;
      testRecipient?: string;
      testDeveloperName?: string;
      overrideEmail?: string;
      fromEmailOverride?: string;
      ccEmailOverride?: string;
      silent?: boolean; // suppress per-row toast in bulk loops
    }) => {
      const { silent, ...payload } = vars;
      const { data, error } = await supabase.functions.invoke("crm-send-developer-registration", { body: payload });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return { ...data, silent };
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["crm-dev-registry"] });
      if (!data?.silent) {
        toast.success(data?.test ? `Test email sent to ${data.recipient}` : `Email sent to ${data.recipient}`);
      }
    },
    onError: (e: any) => toast.error(e.message || "Send failed"),
  });
};

/* ---------- Email Templates (locked branded HTML) ---------- */
export const useEmailTemplate = (variant: AnyEmailVariant) =>
  useQuery({
    queryKey: ["crm-email-template", variant],
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    placeholderData: (prev) => prev,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("crm_email_templates").select("*").eq("variant", variant).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

export const useUpsertEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { variant: AnyEmailVariant; subject: string; html: string }) => {
      const { data, error } = await supabase
        .from("crm_email_templates")
        .update({ subject: vars.subject, html: vars.html })
        .eq("variant", vars.variant)
        .is("locked_at", null)
        .select().maybeSingle();
      if (error) throw error;
      if (!data) throw new Error("Template is locked. Unlock to edit.");
      return data;
    },
    onSuccess: (_d, v) => {
      qc.invalidateQueries({ queryKey: ["crm-email-template", v.variant] });
      toast.success("Template saved");
    },
    onError: (e: any) => toast.error(e.message || "Save failed"),
  });
};

export const useLockEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variant: AnyEmailVariant) => {
      const { data: { user } } = await supabase.auth.getUser();
      const { error } = await supabase
        .from("crm_email_templates")
        .update({ locked_at: new Date().toISOString(), locked_by: user?.id })
        .eq("variant", variant);
      if (error) throw error;
    },
    onSuccess: (_d, variant) => {
      qc.invalidateQueries({ queryKey: ["crm-email-template", variant] });
      toast.success("Template locked. It can no longer be edited.");
    },
    onError: (e: any) => toast.error(e.message || "Lock failed"),
  });
};

export const useUnlockEmailTemplate = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (variant: AnyEmailVariant) => {
      const { error } = await supabase
        .from("crm_email_templates")
        .update({ locked_at: null, locked_by: null })
        .eq("variant", variant);
      if (error) throw error;
    },
    onSuccess: (_d, variant) => {
      qc.invalidateQueries({ queryKey: ["crm-email-template", variant] });
      toast.success("Template unlocked — you can now edit it.");
    },
    onError: (e: any) => toast.error(e.message || "Unlock failed"),
  });
};
export const useEmailDeliveryStatus = (recipientEmails: string[]) =>
  useQuery({
    queryKey: ["crm-email-delivery", recipientEmails.sort().join(",")],
    enabled: recipientEmails.length > 0,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("email_send_log")
        .select("recipient_email,status,template_name,created_at,error_message,message_id")
        .in("recipient_email", recipientEmails)
        .in("template_name", ["developer_registration", "developer_confirm_registered"])
        .order("created_at", { ascending: false })
        .limit(1000);
      if (error) throw error;
      // Latest status per recipient_email
      const map = new Map<string, any>();
      const history = new Map<string, any[]>();
      (data || []).forEach((row: any) => {
        if (!map.has(row.recipient_email)) map.set(row.recipient_email, row);
        const arr = history.get(row.recipient_email) || [];
        arr.push(row);
        history.set(row.recipient_email, arr);
      });
      return { latest: map, history };
    },
  });

/* ---------- Reminders ---------- */
export const useReminders = (filters?: { brokerage_id?: string; client_id?: string; dev_registry_id?: string }) =>
  useQuery({
    queryKey: ["crm-reminders", filters],
    queryFn: async () => {
      let q = supabase.from("crm_relationship_reminders").select("*").order("due_at");
      if (filters?.brokerage_id) q = q.eq("brokerage_id", filters.brokerage_id);
      if (filters?.client_id) q = q.eq("client_id", filters.client_id);
      if (filters?.dev_registry_id) q = q.eq("dev_registry_id", filters.dev_registry_id);
      const { data, error } = await q;
      if (error) throw error;
      return data || [];
    },
  });

export const useUpsertReminder = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (payload: any) => {
      const row = { ...payload, owner_id: payload.owner_id || user!.id };
      const { data, error } = payload.id
        ? await supabase.from("crm_relationship_reminders").update(row).eq("id", payload.id).select().single()
        : await supabase.from("crm_relationship_reminders").insert(row).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-reminders"] }); toast.success("Reminder saved"); },
    onError: (e: any) => toast.error(e.message),
  });
};

/* ---------- Brokerage unified Remind: reminder + task + calendar + note ---------- */
export const useBrokerageRemind = () => {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (vars: {
      brokerageId: string;
      brokerageName: string;
      daysFromNow?: number;
      title?: string;
      body?: string;
    }) => {
      if (!user) throw new Error("Not signed in");
      const days = vars.daysFromNow ?? 7;
      const due = new Date();
      due.setDate(due.getDate() + days);
      const dueIso = due.toISOString();
      const title = vars.title || `Follow up with ${vars.brokerageName}`;
      const body =
        vars.body ||
        `Check status with ${vars.brokerageName}. If no reply, send a second message and log outcome.`;

      // 1. Relationship reminder (drives the CRM reminders list)
      await supabase.from("crm_relationship_reminders").insert({
        owner_id: user.id,
        kind: "follow_up",
        title,
        body,
        due_at: dueIso,
        brokerage_id: vars.brokerageId,
      });

      // 2. Owner task (drives Tasks dashboard)
      await supabase.from("admin_tasks").insert({
        user_id: user.id,
        title,
        description: body,
        category: "Brokerage Follow-up",
        priority: "medium",
        status: "pending",
        due_date: dueIso,
      });

      // 3 + 4. Brokerage calendar event + note (drives the agency activity log)
      await (supabase as any).from("crm_brokerage_actions").insert([
        {
          owner_id: user.id,
          brokerage_id: vars.brokerageId,
          action_type: "calendar_event",
          title,
          body,
          due_at: dueIso,
          created_by: user.id,
          metadata: { source: "remind_button" },
        },
        {
          owner_id: user.id,
          brokerage_id: vars.brokerageId,
          action_type: "note",
          title: "Reminder created",
          body: `Follow-up scheduled for ${due.toLocaleDateString()} (${days}d).`,
          created_by: user.id,
          metadata: { source: "remind_button", due_at: dueIso },
        },
      ]);

      // 5. Update brokerage row so the next-action chip surfaces in the list
      await (supabase.from("crm_brokerages") as any)
        .update({
          next_followup_at: dueIso,
          next_action_at: dueIso,
          next_action_note: title,
        })
        .eq("id", vars.brokerageId);

      return { ok: true, dueIso };
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["crm-brokerages"] });
      qc.invalidateQueries({ queryKey: ["crm-reminders"] });
      qc.invalidateQueries({ queryKey: ["crm-brokerage-actions"] });
      toast.success("Reminder logged", {
        description: "Reminder, task, calendar event & note created.",
        action: {
          label: "View activity",
          onClick: () => { window.location.href = "/owner/crm/relationships/activity"; },
        },
      });
    },
    onError: (e: any) => toast.error(e.message || "Could not create reminder"),
  });
};
