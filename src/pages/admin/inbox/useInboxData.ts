import React from "react";
import { supabase } from "@/integrations/supabase/client";

export type InboxFolder = "inbox" | "sent" | "drafts" | "trash" | "archive" | "spam";

export interface InboxAccount {
  id: string;
  provider: "gmail" | "outlook" | "imap";
  email_address: string;
  display_name: string | null;
  status: string;
  unread_count: number | null;
  last_synced_at: string | null;
}

export interface InboxEmail {
  id: string;
  gmail_id: string;
  thread_id: string | null;
  account_id: string | null;
  provider: string;
  from_name: string | null;
  from_email: string | null;
  to_email: string | null;
  cc_email: string | null;
  subject: string | null;
  snippet: string | null;
  received_at: string;
  is_unread: boolean;
  is_starred: boolean;
  is_responded: boolean;
  is_ignored: boolean;
  has_attachments: boolean;
  folder: InboxFolder;
  labels: string[];
  category: string | null;
  division: string | null;
  urgency: string | null;
  sentiment: string | null;
  ai_summary: string | null;
  requires_reply: boolean;
  sla_state: string | null;
  sla_due_at: string | null;
}

export interface InboxFilters {
  folder: InboxFolder;
  accountId: string | "all";
  search: string;
  unreadOnly: boolean;
  starredOnly: boolean;
  awaitingReply: boolean;
  category: string | "all";
  urgency: string | "all";
}

export const DEFAULT_FILTERS: InboxFilters = {
  folder: "inbox",
  accountId: "all",
  search: "",
  unreadOnly: false,
  starredOnly: false,
  awaitingReply: false,
  category: "all",
  urgency: "all",
};

const EMAIL_COLUMNS =
  "id, gmail_id, thread_id, account_id, provider, from_name, from_email, to_email, cc_email, subject, snippet, received_at, is_unread, is_starred, is_responded, is_ignored, has_attachments, folder, labels, category, division, urgency, sentiment, ai_summary, requires_reply, sla_state, sla_due_at";

export function useInboxAccounts() {
  const [accounts, setAccounts] = React.useState<InboxAccount[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    const { data } = await supabase
      .from("inbox_accounts")
      .select("id, provider, email_address, display_name, status, unread_count, last_synced_at")
      .order("created_at", { ascending: true });
    setAccounts((data as InboxAccount[]) ?? []);
    setLoading(false);
  }, []);

  React.useEffect(() => {
    void load();
    const channel = supabase
      .channel("inbox-accounts-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "inbox_accounts" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { accounts, loading, reload: load };
}

export function useInboxEmails(filters: InboxFilters, pageSize = 60) {
  const [emails, setEmails] = React.useState<InboxEmail[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    setLoading(true);
    let query = supabase
      .from("inbox_emails")
      .select(EMAIL_COLUMNS, { count: "exact" })
      .eq("folder", filters.folder)
      .order("received_at", { ascending: false })
      .limit(pageSize);

    if (filters.accountId !== "all") query = query.eq("account_id", filters.accountId);
    if (filters.unreadOnly) query = query.eq("is_unread", true);
    if (filters.starredOnly) query = query.eq("is_starred", true);
    if (filters.awaitingReply) query = query.eq("requires_reply", true).eq("is_responded", false);
    if (filters.category !== "all") query = query.eq("category", filters.category);
    if (filters.urgency !== "all") query = query.eq("urgency", filters.urgency);
    if (filters.search.trim()) {
      const term = `%${filters.search.trim()}%`;
      query = query.or(
        `subject.ilike.${term},from_email.ilike.${term},from_name.ilike.${term},snippet.ilike.${term}`,
      );
    }

    const { data, count } = await query;
    setEmails((data as InboxEmail[]) ?? []);
    setTotal(count ?? 0);
    setLoading(false);
  }, [filters, pageSize]);

  React.useEffect(() => {
    void load();
  }, [load]);

  React.useEffect(() => {
    const channel = supabase
      .channel("inbox-emails-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "inbox_emails" }, () => {
        void load();
      })
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [load]);

  return { emails, total, loading, reload: load };
}

export async function callInbox<T = unknown>(fn: string, body: Record<string, unknown> = {}) {
  const { data, error } = await supabase.functions.invoke(fn, { body });
  if (error) {
    let detail = error.message;
    const ctx = (error as { context?: Response }).context;
    if (ctx && typeof ctx.text === "function") {
      try {
        detail = await ctx.text();
      } catch {
        /* keep original */
      }
    }
    throw new Error(detail);
  }
  return data as T;
}
