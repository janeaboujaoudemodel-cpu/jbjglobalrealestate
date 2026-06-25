/**
 * CRMFloatingInsightsWidget
 *
 * Minimized floating pill anchored to the top-right of the JBJ CRM header.
 * When expanded, drops down a compact insights panel (positioned visually
 * above the Overview / body area) summarising flagged leads.
 *
 * - Minimized: small pill showing flag icon + "Flagged" + count badge
 * - Expanded:  card with reason breakdown + top 5 most recent flagged leads
 *              + CTA to open the full Flagged tab
 *
 * Design follows the Champagne-Gold standard (ink on champagne, 1px gold hairline).
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, Flag, X, ChevronRight, Phone, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type FlaggedRow = {
  id: string;
  full_name: string | null;
  phone_e164: string | null;
  email_lower: string | null;
  flag_reasons: string[] | null;
  created_at: string;
};

const REASON_LABELS: Record<string, string> = {
  missing_phone: "Missing phone",
  missing_email: "Missing email",
  invalid_phone_format: "Invalid phone",
  invalid_email_format: "Invalid email",
  duplicate_phone: "Duplicate phone",
  duplicate_email: "Duplicate email",
};

interface Props {
  flaggedCount: number;
  onOpenFlagged: () => void;
}

export default function CRMFloatingInsightsWidget({ flaggedCount, onOpenFlagged }: Props) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<FlaggedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  // Close on outside click / Esc
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  // Fetch top flagged leads on first open
  useEffect(() => {
    if (!open || rows.length > 0) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data } = await supabase
        .from("crm_leads")
        .select("id, full_name, phone_e164, email_lower, flag_reasons, created_at")
        .eq("flagged", true)
        .order("created_at", { ascending: false })
        .limit(6);
      if (!cancelled) {
        setRows((data as FlaggedRow[]) || []);
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [open, rows.length]);

  // Reason breakdown (from loaded rows; small sample for the snapshot)
  const reasonBreakdown = useMemo(() => {
    const acc: Record<string, number> = {};
    for (const r of rows) {
      for (const reason of r.flag_reasons || []) {
        acc[reason] = (acc[reason] || 0) + 1;
      }
    }
    return Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 4);
  }, [rows]);

  const hasFlags = flaggedCount > 0;

  return (
    <div ref={wrapRef} className="relative z-30">
      {/* Minimized pill */}
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-label="Toggle flagged leads insights"
          data-surface="emerald"
          data-emerald-ok="button"
          className={[
            "jj-surface-emerald inline-flex h-10 min-w-[148px] items-center justify-center gap-2 rounded-xl px-4 text-xs font-semibold",
            "border-transparent transition-transform hover:-translate-y-0.5 shadow-sm",
          open
              ? ""
            : hasFlags
                ? ""
                : "",
        ].join(" ")}
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        <span>Flagged Insights</span>
        <span
          className={[
            "inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] tabular-nums",
            hasFlags
              ? "bg-white/20 text-white border border-white/70"
              : "bg-[#EFE6D6] text-[#1A1A1A]/70 border border-[#B89555]/30",
          ].join(" ")}
        >
          {flaggedCount}
        </span>
      </button>

      {/* Expanded panel */}
      {open && (
        <div
          role="dialog"
          aria-label="Flagged leads insights"
          className="absolute right-0 mt-2 w-[360px] max-w-[92vw] rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] shadow-xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#B89555]/20 bg-[#F7F2EA]">
            <div className="flex items-center gap-2">
              <Flag className="h-4 w-4 text-[#B89555]" />
              <span className="text-sm font-semibold text-[#1A1A1A]">Flagged Leads</span>
              <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1.5 rounded-full text-[10px] font-semibold tabular-nums bg-[#1A1A1A] text-[#FDFBF7] border border-[#B89555]">
                {flaggedCount}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close insights"
              className="p-1 rounded-full hover:bg-[#EFE6D6] text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Reason breakdown */}
          {reasonBreakdown.length > 0 && (
            <div className="px-4 py-3 border-b border-[#B89555]/15">
              <div className="text-[10px] uppercase tracking-wider text-[#1A1A1A]/60 font-semibold mb-2">
                Top reasons (recent)
              </div>
              <div className="flex flex-wrap gap-1.5">
                {reasonBreakdown.map(([reason, count]) => (
                  <span
                    key={reason}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/30"
                  >
                    {REASON_LABELS[reason] || reason}
                    <span className="font-semibold tabular-nums">{count}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Recent flagged leads */}
          <div className="max-h-[260px] overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-xs text-[#1A1A1A]/60 text-center">Loading…</div>
            )}
            {!loading && rows.length === 0 && (
              <div className="px-4 py-6 text-xs text-[#1A1A1A]/60 text-center">
                No flagged leads.
              </div>
            )}
            {!loading && rows.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => { setOpen(false); onOpenFlagged(); }}
                className="w-full text-left px-4 py-2.5 border-b border-[#B89555]/10 hover:bg-[#F7F2EA] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium text-[#1A1A1A] truncate">
                      {r.full_name || "(no name)"}
                    </div>
                    <div className="flex items-center gap-3 mt-0.5 text-[11px] text-[#1A1A1A]/60">
                      {r.phone_e164 && (
                        <span className="inline-flex items-center gap-1 truncate"><Phone className="h-3 w-3" />{r.phone_e164}</span>
                      )}
                      {r.email_lower && (
                        <span className="inline-flex items-center gap-1 truncate"><Mail className="h-3 w-3" />{r.email_lower}</span>
                      )}
                    </div>
                    {r.flag_reasons && r.flag_reasons.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {r.flag_reasons.slice(0, 2).map((reason) => (
                          <span
                            key={reason}
                            className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-[#EFE6D6] text-[#1A1A1A]/80 border border-[#B89555]/25"
                          >
                            {REASON_LABELS[reason] || reason}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="h-3.5 w-3.5 text-[#1A1A1A]/40 shrink-0" />
                </div>
              </button>
            ))}
          </div>

          {/* Footer CTA */}
          <button
            type="button"
            onClick={() => { setOpen(false); onOpenFlagged(); }}
            className="w-full px-4 py-2.5 text-xs font-semibold text-[#1A1A1A] bg-[#F7F2EA] hover:bg-[#EFE6D6] border-t border-[#B89555]/30 transition-colors inline-flex items-center justify-center gap-1.5"
          >
            Open Flagged tab
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
