import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

/* ---------- Brokerages ---------- */
export const useBrokerages = () => useQuery({
  queryKey: ["crm-brokerages"],
  queryFn: async () => {
    const { data, error } = await supabase.from("crm_brokerages").select("*").order("updated_at", { ascending: false });
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-brokerages"] }); toast.success("Saved"); },
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
  queryFn: async () => {
    const { data, error } = await supabase.from("crm_developer_registry").select("*").order("developer_name");
    if (error) throw error;
    return data || [];
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
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["crm-dev-registry"] }); toast.success("Saved"); },
    onError: (e: any) => toast.error(e.message),
  });
};

/* ---------- Owner Settings ---------- */
export const useOwnerSettings = () => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["crm-owner-settings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase.from("crm_owner_settings").select("*").eq("owner_id", user!.id).maybeSingle();
      if (error) throw error;
      return data || { owner_id: user!.id, drive_doc_pack_url: "", signature_html: "", cc_jane_enabled: true, cc_email: "info.jane@thegmail.com", reply_to_email: "contact@jbj.ae", from_name: "JBJ Global Real Estate" };
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

export const useSendDeveloperRegistration = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (vars: { developerId: string; overrideEmail?: string; overrideMessage?: string }) => {
      const { data, error } = await supabase.functions.invoke("crm-send-developer-registration", { body: vars });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => { qc.invalidateQueries({ queryKey: ["crm-dev-registry"] }); toast.success(`Email sent to ${data.recipient}`); },
    onError: (e: any) => toast.error(e.message || "Send failed"),
  });
};

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
