/**
 * Owner queue for Advisory Desk tickets.
 *
 * A ticket exists only when an identified visitor explicitly transferred their
 * chat to JBJ. Each row carries the full identity (name, email, phone), what
 * they were searching for, and the AI transcript. The owner answers from here
 * by email, by WhatsApp, or both.
 */
import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mail, Phone, User, Loader2, Send, CheckCircle2, Clock, MessageCircle, RefreshCw, Search,
} from "lucide-react";

interface TicketRow {
  id: string;
  user_id: string | null;
  visitor_name: string | null;
  visitor_email: string | null;
  visitor_phone: string | null;
  query: string;
  source: string | null;
  page_source: string | null;
  transcript: string | null;
  status: string;
  created_at: string;
  resolved_at: string | null;
}

type Channel = "email" | "whatsapp" | "both";

export default function AdvisoryDeskQueue() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("request");
  const [reply, setReply] = useState("");
  const [channel, setChannel] = useState<Channel>("email");
  const [sending, setSending] = useState(false);

  const { data: tickets = [], isLoading, refetch } = useQuery({
    queryKey: ["advisory-desk-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advisory_desk_requests")
        .select(
          "id, user_id, visitor_name, visitor_email, visitor_phone, query, source, page_source, transcript, status, created_at, resolved_at",
        )
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as TicketRow[];
    },
  });

  const selected = tickets.find((t) => t.id === selectedId) || null;
  const waDigits = (selected?.visitor_phone || "").replace(/\D/g, "");

  const send = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("advisory-desk-reply", {
        body: { requestId: selected.id, message: reply.trim(), channel },
      });
      if (error) throw error;
      if (channel !== "email" && waDigits) {
        const link = `https://wa.me/${waDigits}?text=${encodeURIComponent(reply.trim())}`;
        window.open(link, "_blank", "noopener,noreferrer");
      }
      toast.success("Reply sent");
      setReply("");
      await qc.invalidateQueries({ queryKey: ["advisory-desk-requests"] });
      void data;
    } catch (e: any) {
      toast.error(e?.message || "Could not send the reply");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Advisory Desk</h1>
          <p className="text-sm text-muted-foreground">
            Visitors who asked JBJ to take over their chat — answer by email, WhatsApp, or both.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="jj-surface-emerald text-white inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold"
        >
          <RefreshCw className="h-4 w-4 text-white" /> Refresh
        </button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)]">
        {/* Ticket list */}
        <div className="space-y-2">
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading tickets…
            </div>
          )}
          {!isLoading && tickets.length === 0 && (
            <p className="text-sm text-muted-foreground">No open tickets.</p>
          )}
          {tickets.map((t) => {
            const active = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => setParams({ request: t.id })}
                className={`w-full rounded-xl border p-4 text-left transition-colors ${
                  active ? "jj-surface-emerald text-white border-transparent" : "border-border bg-card hover:border-primary/40"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className={`text-sm font-semibold ${active ? "text-white" : "text-foreground"}`}>
                    {t.visitor_name || t.visitor_email || "Visitor"}
                  </span>
                  <span className={`inline-flex items-center gap-1 text-[11px] ${active ? "text-white/80" : "text-muted-foreground"}`}>
                    {t.status === "open" ? <Clock className="h-3 w-3" /> : <CheckCircle2 className="h-3 w-3" />}
                    {t.status}
                  </span>
                </div>
                <p className={`mt-1 text-xs ${active ? "text-white/85" : "text-muted-foreground"}`}>
                  {t.visitor_email} {t.visitor_phone ? `· ${t.visitor_phone}` : ""}
                </p>
                <p className={`mt-2 text-sm ${active ? "text-white" : "text-foreground/90"}`}>{t.query}</p>
                <p className={`mt-2 text-[11px] ${active ? "text-white/70" : "text-muted-foreground"}`}>
                  {new Date(t.created_at).toLocaleString()} · {t.source || "chat"}
                </p>
              </button>
            );
          })}
        </div>

        {/* Detail + reply */}
        <div className="rounded-xl border border-border bg-card p-5">
          {!selected ? (
            <p className="text-sm text-muted-foreground">Select a ticket to answer it.</p>
          ) : (
            <div className="space-y-5">
              <div className="grid gap-2 sm:grid-cols-2">
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <User className="h-4 w-4 text-muted-foreground" /> {selected.visitor_name || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Mail className="h-4 w-4 text-muted-foreground" /> {selected.visitor_email || "—"}
                </p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Phone className="h-4 w-4 text-muted-foreground" /> {selected.visitor_phone || "Not provided"}
                </p>
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <Search className="h-4 w-4 text-muted-foreground" /> {selected.page_source || "—"}
                </p>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">What they searched for</p>
                <p className="mt-1 whitespace-pre-wrap text-sm text-foreground">{selected.query}</p>
              </div>

              {selected.transcript && (
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">AI chat transcript</p>
                  <pre className="mt-1 max-h-64 overflow-auto whitespace-pre-wrap rounded-lg bg-muted p-3 text-xs text-foreground">
                    {selected.transcript}
                  </pre>
                </div>
              )}

              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Answer this visitor</p>
                <div className="flex flex-wrap gap-2">
                  {(["email", "whatsapp", "both"] as Channel[]).map((c) => (
                    <button
                      key={c}
                      onClick={() => setChannel(c)}
                      disabled={c !== "email" && !waDigits}
                      className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition-colors disabled:opacity-40 ${
                        channel === c ? "jj-surface-emerald text-white" : "border border-border bg-background text-foreground"
                      }`}
                    >
                      {c === "whatsapp" ? "WhatsApp" : c === "both" ? "Email + WhatsApp" : "Email"}
                    </button>
                  ))}
                </div>
                <textarea
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  rows={6}
                  placeholder="Write your answer to the visitor…"
                  className="w-full rounded-lg border border-border bg-background p-3 text-sm text-foreground"
                />
                <button
                  onClick={send}
                  disabled={sending || !reply.trim()}
                  className="jj-surface-emerald inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                >
                  {sending ? <Loader2 className="h-4 w-4 animate-spin text-white" /> : <Send className="h-4 w-4 text-white" />}
                  Send reply
                </button>
                {channel !== "email" && (
                  <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MessageCircle className="h-3.5 w-3.5" /> WhatsApp opens in a new tab with your message pre-typed.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
