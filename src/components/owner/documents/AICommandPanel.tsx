/**
 * Phase F — AI Command Panel for the Documents & Forms hub.
 *
 * A small docked chat panel that interprets natural-language commands
 * against the envelopes already loaded in the hub. No backend AI call
 * is required for v1 — a deterministic intent parser handles the
 * common owner workflows, so it works instantly and offline.
 *
 * Supported intents:
 *   • "remind overdue"               → bulk reminder on sent ≥3d
 *   • "remind pending older than 7 days"
 *   • "export signed last 30 days"   → opens branded PDFs
 *   • "export signed this month"
 *   • "open <tab>"                   → switch tab
 *   • "show overdue"                 → switch to Pending + select overdue
 *   • "count <bucket>"               → quick stat
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { Sparkles, X, Send as SendIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

type Bucket =
  | "templates" | "documents" | "esign" | "drafts" | "generated"
  | "sent" | "submitted" | "signed" | "vault" | "deleted" | "assets";

interface Envelope {
  id: string;
  status?: string | null;
  created_at?: string | null;
  signed_document_url?: string | null;
  document_filename?: string | null;
  name?: string | null;
}

interface AICommandPanelProps {
  buckets: Record<string, Envelope[]>;
  setTab: (t: Bucket) => void;
  setSelected: (ids: Set<string>) => void;
  runBulkResendReminder: () => Promise<void> | void;
  runBulkExportPdfs: () => void;
  brandedHref: (rawUrl: string | undefined, filename?: string) => string;
}

type Msg = { role: "user" | "assistant"; text: string };

const ageDays = (iso?: string | null) =>
  iso ? Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000) : 0;

function parseDays(text: string, fallback: number): number {
  const m = text.match(/(\d+)\s*(?:d|day|days)/i);
  if (m) return Math.max(1, parseInt(m[1], 10));
  if (/this month/i.test(text)) return 31;
  if (/last month/i.test(text)) return 60;
  if (/today/i.test(text)) return 1;
  return fallback;
}

export function AICommandPanel(props: AICommandPanelProps) {
  const { buckets, setTab, setSelected, runBulkResendReminder, runBulkExportPdfs, brandedHref } = props;
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [input, setInput] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([
    {
      role: "assistant",
      text:
        "Hi — I can run bulk actions for you. Try:\n• remind overdue\n• remind pending older than 7 days\n• export signed last 30 days\n• show overdue\n• count signed",
    },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [msgs, open]);

  const sentList = buckets.sent || [];
  const signedList = buckets.signed || [];

  const overdueIds = useMemo(
    () => sentList.filter((e) => ageDays(e.created_at) >= 3).map((e) => e.id),
    [sentList],
  );

  const reply = (text: string) =>
    setMsgs((prev) => [...prev, { role: "assistant", text }]);

  async function handle(command: string) {
    const cmd = command.trim().toLowerCase();
    if (!cmd) return;
    setMsgs((prev) => [...prev, { role: "user", text: command.trim() }]);

    // count
    if (/^count\b/.test(cmd)) {
      const which = cmd.replace(/^count\s+/, "").trim();
      const target = (buckets as any)[which];
      if (Array.isArray(target)) return reply(`${which}: ${target.length} item(s).`);
      return reply(`Unknown bucket "${which}". Try drafts / sent / signed / submitted / deleted.`);
    }

    // open <tab>
    const openMatch = cmd.match(/^(?:open|go to|switch to)\s+(\w+)/);
    if (openMatch) {
      const t = openMatch[1] as Bucket;
      const valid: Bucket[] = ["templates","documents","esign","drafts","generated","sent","submitted","signed","vault","deleted","assets"];
      if (valid.includes(t)) { setTab(t); return reply(`Opened "${t}".`); }
      return reply(`I don't know the tab "${t}".`);
    }

    // show overdue
    if (/^show\s+overdue/.test(cmd) || /^select\s+overdue/.test(cmd)) {
      setTab("sent");
      setSelected(new Set(overdueIds));
      return reply(`Switched to Pending and selected ${overdueIds.length} overdue envelope(s) (≥3 days).`);
    }

    // remind overdue / remind pending older than N days
    if (/^remind\b/.test(cmd) || /reminder/.test(cmd)) {
      const days = /older than|>/.test(cmd) ? parseDays(cmd, 3) : (/overdue/.test(cmd) ? 3 : parseDays(cmd, 3));
      const ids = sentList.filter((e) => ageDays(e.created_at) >= days).map((e) => e.id);
      if (!ids.length) return reply(`No pending envelopes older than ${days} day(s).`);
      setTab("sent");
      setSelected(new Set(ids));
      reply(`Sending reminders to ${ids.length} signer(s) older than ${days} day(s)…`);
      setBusy(true);
      try { await runBulkResendReminder(); reply("Done."); }
      catch (e: any) { reply(`Failed: ${e?.message || "unknown error"}`); }
      finally { setBusy(false); }
      return;
    }

    // export signed [last N days|this month]
    if (/^export\b/.test(cmd) || /download/.test(cmd)) {
      const days = parseDays(cmd, 365);
      const rows = signedList.filter((e) =>
        e.signed_document_url && ageDays(e.created_at) <= days,
      );
      if (!rows.length) return reply(`No signed PDFs in the last ${days} day(s).`);
      setTab("signed");
      setSelected(new Set(rows.map((r) => r.id)));
      // Open directly through branded href — bypasses the bucket-bound selection so
      // the user sees the export even if the bucket button isn't visible yet.
      rows.forEach((e, i) =>
        setTimeout(
          () => window.open(brandedHref(e.signed_document_url || undefined, e.document_filename || `${e.name || "document"}.pdf`), "_blank", "noopener,noreferrer"),
          i * 120,
        ),
      );
      return reply(`Opening ${rows.length} signed PDF(s) from the last ${days} day(s).`);
    }

    return reply(
      "I didn't catch that. Try:\n• remind overdue\n• remind pending older than 7 days\n• export signed last 30 days\n• show overdue\n• count signed",
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full border border-[#B89555]/70 bg-[linear-gradient(135deg,#092C24_0%,#041512_55%,#1A1A1A_100%)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.18em] text-white shadow-[0_18px_45px_rgba(0,0,0,0.35)] transition hover:scale-[1.02] hover:border-[#E4C675]"
        aria-label="Open AI commands"
      >
        <Sparkles className="w-4 h-4 text-[#E4C675]" /> AI Assistant
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-[360px] max-w-[calc(100vw-2rem)] bg-[#FDFBF7] border border-[#B89555]/40 rounded-lg shadow-2xl flex flex-col" style={{ maxHeight: "70vh" }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/30">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B89555]" />
          <span className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A] font-semibold">Document Commands</span>
        </div>
        <button type="button" onClick={() => setOpen(false)} aria-label="Close" className="text-[#1A1A1A]/60 hover:text-[#1A1A1A]">
          <X className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
            <div className={`inline-block max-w-[90%] text-[13px] whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-[#EFE6D6] border border-[#B89555]/40 px-3 py-2 rounded-md text-[#1A1A1A]" : "text-[#1A1A1A]"}`}>
              {m.text}
            </div>
          </div>
        ))}
        <div ref={endRef} />
      </div>
      <form
        className="flex items-center gap-2 px-3 py-3 border-t border-[#B89555]/30"
        onSubmit={(e) => { e.preventDefault(); if (!busy) { handle(input); setInput(""); } }}
      >
        <Input
          autoFocus
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="e.g. remind pending older than 7 days"
          disabled={busy}
          className="h-9 text-sm bg-white"
        />
        <Button type="submit" size="sm" variant="gold" disabled={busy || !input.trim()}>
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <SendIcon className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
}

export default AICommandPanel;
