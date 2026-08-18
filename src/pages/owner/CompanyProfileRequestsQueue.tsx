/**
 * Owner queue for public "Request company profile" submissions.
 *
 * Every request is stored in public.company_profile_requests, raises an in-app
 * alert (header bell) for owners/admins and emails CONTACT@JBJ.AE.
 * From here the owner attaches the PDF and sends it in one click: the file is
 * saved on the developer (so the public page shows Download from then on) and
 * emailed to the requester as an attachment.
 */
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ClickableDiv } from "@/components/a11y/ClickableDiv";
import {
  FileText, Mail, Phone, User, Loader2, Send, Upload, CheckCircle2, Clock, Building2, RefreshCw,
} from "lucide-react";

const BUCKET = "developer-profiles";

interface RequestRow {
  id: string;
  developer_id: string;
  requester_name: string | null;
  requester_email: string | null;
  requester_phone: string | null;
  message: string | null;
  status: string;
  created_at: string;
  fulfilled_at: string | null;
  sent_to_email: string | null;
}

export default function CompanyProfileRequestsQueue() {
  const qc = useQueryClient();
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("request");
  const [note, setNote] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [sending, setSending] = useState(false);

  const { data: requests = [], isLoading, refetch } = useQuery({
    queryKey: ["company-profile-requests"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("company_profile_requests")
        .select("id, developer_id, requester_name, requester_email, requester_phone, message, status, created_at, fulfilled_at, sent_to_email")
        .order("created_at", { ascending: false })
        .limit(200);
      if (error) throw error;
      return (data || []) as RequestRow[];
    },
  });

  const devIds = useMemo(() => Array.from(new Set(requests.map((r) => r.developer_id))), [requests]);

  const { data: developers = {} } = useQuery({
    queryKey: ["company-profile-request-developers", devIds.join(",")],
    enabled: devIds.length > 0,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id, name, slug")
        .in("id", devIds);
      if (error) throw error;
      const map: Record<string, { name: string; slug: string | null }> = {};
      (data || []).forEach((d: any) => { map[d.id] = { name: d.name, slug: d.slug }; });
      return map;
    },
  });

  const selected = requests.find((r) => r.id === selectedId) || null;

  const { data: existingDoc } = useQuery({
    queryKey: ["company-profile-existing-doc", selected?.developer_id],
    enabled: !!selected?.developer_id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_documents")
        .select("id, file_name, storage_path, is_public")
        .eq("developer_id", selected!.developer_id)
        .eq("doc_type", "company_profile")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const select = (id: string | null) => {
    setNote("");
    setFile(null);
    const next = new URLSearchParams(params);
    if (id) next.set("request", id); else next.delete("request");
    setParams(next, { replace: true });
  };

  const send = async () => {
    if (!selected) return;
    if (!file && !existingDoc?.storage_path) {
      toast.error("Attach the company profile PDF first");
      return;
    }
    setSending(true);
    try {
      let storagePath: string | undefined;
      let fileName: string | undefined;
      let fileSize: number | undefined;

      if (file) {
        const safe = file.name.replace(/[^\w.\-]+/g, "-");
        storagePath = `${selected.developer_id}/${Date.now()}-${safe}`;
        const { error: upErr } = await supabase.storage
          .from(BUCKET)
          .upload(storagePath, file, { contentType: file.type || "application/pdf", upsert: false });
        if (upErr) throw upErr;
        fileName = file.name;
        fileSize = file.size;
      }

      const { data, error } = await supabase.functions.invoke("company-profile-fulfill", {
        body: {
          requestId: selected.id,
          storagePath,
          fileName,
          fileSize,
          documentId: !storagePath ? existingDoc?.id : undefined,
          message: note || undefined,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      toast.success("Profile emailed and saved on the developer page");
      setFile(null);
      setNote("");
      qc.invalidateQueries({ queryKey: ["company-profile-requests"] });
      qc.invalidateQueries({ queryKey: ["company-profile-existing-doc", selected.developer_id] });
      qc.invalidateQueries({ queryKey: ["developer-company-profile", selected.developer_id] });
    } catch (e: any) {
      toast.error(e?.message || "Could not send the profile");
    } finally {
      setSending(false);
    }
  };

  const pending = requests.filter((r) => r.status === "pending");
  const answered = requests.filter((r) => r.status !== "pending");

  const filter = (params.get("filter") || "all") as "all" | "pending" | "answered";
  const setFilter = (f: "all" | "pending" | "answered") => {
    const next = new URLSearchParams(params);
    if (f === "all") next.delete("filter"); else next.set("filter", f);
    setParams(next, { replace: true });
  };
  const visible = filter === "pending" ? pending : filter === "answered" ? answered : requests;

  const EMERALD = "linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000 100%)";

  return (
    <div className="p-4 md:p-6 space-y-5">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Cormorant Garamond', serif" }}>
            Company Profile Requests
          </h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            Every public request lands here, alerts you in the header bell and emails CONTACT@JBJ.AE.
          </p>
        </div>
        <button
          onClick={() => refetch()}
          data-emerald="true"
          data-no-contrast-guard
          data-on-dark
          className="allow-white inline-flex items-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold"
          style={{ backgroundImage: EMERALD, backgroundColor: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
        >
          <RefreshCw className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
          <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>Refresh</span>
        </button>
      </div>

      {/* Clickable KPI filters */}
      <div className="flex flex-wrap gap-3">
        {([
          { key: "pending", label: "Pending", value: pending.length, icon: Clock },
          { key: "answered", label: "Answered", value: answered.length, icon: CheckCircle2 },
          { key: "all", label: "Total", value: requests.length, icon: FileText },
        ] as const).map((s) => {
          const active = filter === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setFilter(s.key)}
              data-surface="light"
              data-no-contrast-guard
              className="text-left rounded-xl px-4 py-3 min-w-[150px] transition-shadow hover:shadow-md"
              style={{
                background: "#FDFBF7",
                border: `1px solid ${active ? "#064E3B" : "rgba(184,149,85,0.4)"}`,
                boxShadow: active ? "0 0 0 2px rgba(6,78,59,0.12)" : undefined,
              }}
            >
              <span className="flex items-center gap-2 text-[11px] uppercase tracking-[0.16em]" style={{ color: "rgba(26,26,26,0.6)" }}>
                <s.icon className="w-3.5 h-3.5" style={{ color: "#064E3B", stroke: "#064E3B" }} /> {s.label}
              </span>
              <span className="block text-2xl font-semibold mt-1" style={{ color: "#064E3B", WebkitTextFillColor: "#064E3B" }}>{s.value}</span>
            </button>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-5 items-start">
        {/* List */}
        <div className="rounded-xl overflow-hidden" data-surface="light" data-no-contrast-guard style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.4)" }}>
          {isLoading ? (
            <div className="p-8 flex items-center justify-center text-[#1A1A1A]/60">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
          ) : visible.length === 0 ? (
            <div className="p-8 text-center text-sm" style={{ color: "rgba(26,26,26,0.6)" }}>
              {requests.length === 0 ? "No requests yet." : "No requests in this view."}
            </div>
          ) : (
            <div className="divide-y divide-[#B89555]/25">
              {visible.map((r) => {
                const dev = developers[r.developer_id];
                const isSel = r.id === selectedId;
                return (
                  <ClickableDiv
                    key={r.id}
                    onClick={() => select(r.id)}
                    data-surface="light"
                    data-no-contrast-guard
                    className="w-full text-left px-4 py-3 cursor-pointer transition-colors"
                    style={{ background: isSel ? "rgba(6,78,59,0.07)" : "#FDFBF7" }}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 text-sm font-semibold" style={{ color: "#064E3B", WebkitTextFillColor: "#064E3B" }}>
                          <Building2 className="w-4 h-4 shrink-0" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                          <span className="break-words">{dev?.name || "Developer"}</span>
                        </div>
                        <div className="mt-1 text-xs break-words" style={{ color: "rgba(26,26,26,0.78)" }}>
                          {r.requester_name || "—"} · {r.requester_email || "no email"}
                          {r.requester_phone ? ` · ${r.requester_phone}` : ""}
                        </div>
                        <div className="mt-1 text-[11px]" style={{ color: "rgba(26,26,26,0.55)" }}>
                          {new Date(r.created_at).toLocaleString("en-GB")}
                        </div>
                      </div>
                      <span
                        data-no-contrast-guard
                        className="shrink-0 px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide"
                        style={
                          r.status === "pending"
                            ? { background: "#FEF3C7", color: "#92400E", WebkitTextFillColor: "#92400E" }
                            : { backgroundImage: EMERALD, backgroundColor: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }
                        }
                      >
                        {r.status}
                      </span>
                    </div>
                  </ClickableDiv>
                );
              })}
            </div>
          )}
        </div>

        {/* Detail / send panel */}
        <div className="rounded-xl p-4 lg:sticky lg:top-4" data-surface="light" data-no-contrast-guard style={{ background: "#FDFBF7", border: "1px solid rgba(184,149,85,0.4)" }}>
          {!selected ? (
            <div className="py-8 px-2 text-center">
              <div
                data-emerald="true"
                data-no-contrast-guard
                className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                style={{ backgroundImage: EMERALD, backgroundColor: "#064E3B" }}
              >
                <FileText className="w-6 h-6" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
              </div>
              <p className="mt-4 text-base font-semibold" style={{ color: "#064E3B", WebkitTextFillColor: "#064E3B" }}>
                Nothing selected yet
              </p>
              <p className="mt-1.5 text-sm leading-relaxed" style={{ color: "rgba(26,26,26,0.7)" }}>
                Pick a request from the list to see the requester's email and phone, attach the company
                profile PDF and send it in one click.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="text-[11px] uppercase tracking-[0.18em]" style={{ color: "rgba(26,26,26,0.6)" }}>Request detail</div>
              <div className="text-lg font-semibold break-words" style={{ color: "#064E3B", WebkitTextFillColor: "#064E3B" }}>
                {developers[selected.developer_id]?.name || "Developer"}
              </div>
              <div className="space-y-1.5 text-sm" style={{ color: "rgba(26,26,26,0.85)" }}>
                <div className="flex items-center gap-2"><User className="w-4 h-4" style={{ color: "#064E3B", stroke: "#064E3B" }} /> {selected.requester_name || "—"}</div>
                <div className="flex items-center gap-2 break-all">
                  <Mail className="w-4 h-4 shrink-0" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                  {selected.requester_email ? (
                    <a href={`mailto:${selected.requester_email}`} className="underline" style={{ color: "#064E3B" }}>{selected.requester_email}</a>
                  ) : "—"}
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-4 h-4 shrink-0" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                  {selected.requester_phone ? (
                    <>
                      <a href={`tel:${selected.requester_phone.replace(/[^\d+]/g, "")}`} className="underline" style={{ color: "#064E3B" }}>
                        {selected.requester_phone}
                      </a>
                      <a
                        href={`https://wa.me/${selected.requester_phone.replace(/\D/g, "")}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-[11px] font-semibold underline"
                        style={{ color: "#064E3B" }}
                      >
                        WhatsApp
                      </a>
                    </>
                  ) : "—"}
                </div>
              </div>
              {selected.message && (
                <p className="text-sm bg-white rounded-md border border-[#B89555]/30 p-2 whitespace-pre-wrap" style={{ color: "rgba(26,26,26,0.8)" }}>
                  {selected.message}
                </p>
              )}

              <div className="rounded-md border border-[#B89555]/30 bg-white p-3 text-sm">
                {existingDoc?.storage_path ? (
                  <div className="flex items-start gap-2" style={{ color: "#064E3B" }}>
                    <FileText className="w-4 h-4 mt-0.5" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                    <span className="break-words">
                      Saved on this developer: <strong>{existingDoc.file_name || "company profile"}</strong>
                    </span>
                  </div>
                ) : (
                  <span style={{ color: "rgba(26,26,26,0.7)" }}>No profile saved for this developer yet — attach one below.</span>
                )}
              </div>

              <label className="block">
                <span className="text-[11px] uppercase tracking-[0.16em]" style={{ color: "rgba(26,26,26,0.6)" }}>
                  {existingDoc?.storage_path ? "Replace with a new PDF (optional)" : "Attach company profile PDF"}
                </span>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setFile(e.target.files?.[0] || null)}
                  className="mt-1 w-full text-sm rounded-md border border-[#B89555]/40 bg-white p-2"
                />
              </label>

              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={2000}
                placeholder="Optional note to include in the email"
                className="w-full rounded-md border border-[#B89555]/40 bg-white p-2 text-sm text-[#1A1A1A]"
              />

              <button
                onClick={send}
                disabled={sending}
                data-emerald="true"
                data-no-contrast-guard
                data-on-dark
                className="allow-white w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-sm font-semibold disabled:opacity-60"
                style={{ backgroundImage: EMERALD, backgroundColor: "#064E3B", color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
              >
                {sending
                  ? <Loader2 className="w-4 h-4 animate-spin" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />
                  : <Send className="w-4 h-4" style={{ color: "#FFFFFF", stroke: "#FFFFFF" }} />}
                <span className="allow-white" style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}>
                  Send profile to {selected.requester_email || "requester"}
                </span>
              </button>

              <p className="text-[11px] flex items-start gap-1.5" style={{ color: "rgba(26,26,26,0.6)" }}>
                <Upload className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#064E3B", stroke: "#064E3B" }} />
                Sending attaches the PDF to the email and publishes it on the developer page, so the
                request button is replaced by a Download button from now on.
              </p>

              {selected.status !== "pending" && (
                <p className="text-[11px] flex items-center gap-1.5" style={{ color: "#065F46" }}>
                  <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#065F46", stroke: "#065F46" }} />
                  Already answered{selected.fulfilled_at ? ` on ${new Date(selected.fulfilled_at).toLocaleString("en-GB")}` : ""}
                  {selected.sent_to_email ? ` to ${selected.sent_to_email}` : ""}.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
