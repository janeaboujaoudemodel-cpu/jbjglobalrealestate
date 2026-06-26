/**
 * ConfirmRegistrationLauncher — smart selection modal for the
 * "Confirm Registration Status" workflow (Developer CRM).
 *
 * Filters crm_developer_registry rows to ONLY those eligible for a
 * registration-status confirmation email:
 *   - Already contacted (outreach_count > 0) OR contract signed
 *     (contract_signed_at is set) OR registration docs submitted
 *     (required_docs_complete = true)
 *   - Excluding registered / commission-eligible / no-email rows
 *   - Excluding do_not_contact and rows confirmed in the last 24h
 *
 * Manual override: search-and-add panel for any developer in the registry,
 * including already-registered ones — flagged with a warning chip.
 *
 * On "Continue → Review & Send" hands the chosen list to BulkSendDialog
 * with the variant locked to `developer_confirm_registered`.
 */
import { useMemo, useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Search, ShieldCheck, AlertTriangle, X, UserPlus, Mail, ArrowRight, CheckSquare, Square } from "lucide-react";
import { toast } from "sonner";

type DevRow = {
  id: string;
  developer_name?: string | null;
  developer_email?: string | null;
  status?: string | null;
  registration_status?: string | null;
  outreach_count?: number | null;
  contract_signed_at?: string | null;
  required_docs_complete?: boolean | null;
  do_not_contact?: boolean | null;
  registration_confirmation_sent_at?: string | null;
  registered_at?: string | null;
  emirate?: string | null;
};

const REGISTERED_STATES = new Set([
  "registered",
  "confirmed_registered",
  "commission_eligible",
]);

function isAlreadyRegistered(d: DevRow): boolean {
  if (REGISTERED_STATES.has(String(d.status || "").toLowerCase())) return true;
  if (REGISTERED_STATES.has(String(d.registration_status || "").toLowerCase())) return true;
  if (d.registered_at) return true;
  return false;
}

function recentlyConfirmed(d: DevRow, hours = 24): boolean {
  if (!d.registration_confirmation_sent_at) return false;
  const ago = Date.now() - new Date(d.registration_confirmation_sent_at).getTime();
  return ago < hours * 3600 * 1000;
}

function isEligibleByDefault(d: DevRow): boolean {
  if (!d.developer_email) return false;
  if (d.do_not_contact) return false;
  if (isAlreadyRegistered(d)) return false;
  if (recentlyConfirmed(d)) return false;
  const hadOutreach = (d.outreach_count ?? 0) > 0;
  const hasContract = !!d.contract_signed_at;
  const docsDone = !!d.required_docs_complete;
  return hadOutreach || hasContract || docsDone;
}

function statusLabel(d: DevRow): { label: string; tone: string; tip: string } {
  if (isAlreadyRegistered(d)) return { label: "Registered", tone: "emerald", tip: "Already registered — excluded by default" };
  if (d.do_not_contact) return { label: "Do Not Contact", tone: "red", tip: "Marked do-not-contact" };
  if (recentlyConfirmed(d)) return { label: "Awaiting Confirmation", tone: "blue", tip: "Confirmation email sent in last 24h" };
  if (d.contract_signed_at) return { label: "Contract Signed", tone: "amber", tip: "Contract signed — confirmation pending" };
  if ((d.outreach_count ?? 0) > 0) return { label: "Pending Registration", tone: "amber", tip: "Outreach sent — awaiting reply" };
  if (d.required_docs_complete) return { label: "Follow-up Needed", tone: "amber", tip: "Docs submitted, no outbound yet" };
  return { label: "No Response", tone: "neutral", tip: "No outreach started" };
}

const TONE_CLASS: Record<string, string> = {
  emerald: "jj-emerald-soft text-[color:var(--emerald-1)] border-[color:var(--emerald-1)]/30",
  amber: "bg-amber-100 text-amber-900 border-amber-300",
  blue: "bg-blue-100 text-blue-900 border-blue-300",
  red: "bg-red-100 text-red-900 border-red-300",
  neutral: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/40",
};

export function ConfirmRegistrationLauncher({
  open,
  onOpenChange,
  developers,
  onContinue,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  /** Full data set from useCRMRelationships().devs (already loaded) */
  developers: DevRow[];
  /** Called with the final selected list when owner clicks Continue. */
  onContinue: (selected: DevRow[]) => void;
}) {
  const eligible = useMemo(
    () => developers.filter(isEligibleByDefault),
    [developers],
  );

  const [chosen, setChosen] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideSearch, setOverrideSearch] = useState("");

  // Pre-select all eligible whenever the modal opens / data refreshes
  useEffect(() => {
    if (open) setChosen(new Set(eligible.map((d) => d.id)));
  }, [open, eligible]);

  const visibleEligible = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return eligible;
    return eligible.filter(
      (d) =>
        (d.developer_name || "").toLowerCase().includes(q) ||
        (d.developer_email || "").toLowerCase().includes(q) ||
        (d.emirate || "").toLowerCase().includes(q),
    );
  }, [eligible, search]);

  const overrideMatches = useMemo(() => {
    const q = overrideSearch.trim().toLowerCase();
    if (q.length < 2) return [];
    return developers
      .filter(
        (d) =>
          ((d.developer_name || "").toLowerCase().includes(q) ||
            (d.developer_email || "").toLowerCase().includes(q)) &&
          d.developer_email,
      )
      .slice(0, 12);
  }, [developers, overrideSearch]);

  const toggle = (id: string) =>
    setChosen((p) => {
      const n = new Set(p);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });

  const selectAllVisible = () =>
    setChosen((p) => {
      const n = new Set(p);
      visibleEligible.forEach((d) => n.add(d.id));
      return n;
    });
  const clearAll = () => setChosen(new Set());

  const overrideAdds = useMemo(
    () =>
      Array.from(chosen).filter((id) => {
        const d = developers.find((x) => x.id === id);
        return d ? !isEligibleByDefault(d) : false;
      }),
    [chosen, developers],
  );

  const handleContinue = () => {
    const finalList = developers.filter((d) => chosen.has(d.id));
    if (finalList.length === 0) {
      toast.error("Select at least one developer to confirm");
      return;
    }
    onContinue(finalList);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[1100px] w-[97vw] bg-[#FDFBF7] max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-[#1A1A1A]" />
            Confirm Registration Status
            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40">
              Smart audience
            </span>
          </DialogTitle>
        </DialogHeader>

        <div className="rounded-xl border border-[#B89555]/40 bg-[#F7F2EA] px-4 py-3 text-xs text-[#1A1A1A]/80">
          <strong className="text-[#1A1A1A]">Default audience:</strong> developers who were already
          contacted, signed a contract, or submitted registration documents — and are not yet
          marked Registered. Already-registered developers are excluded by default; use the manual
          override below to include them.
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter eligible developers (name, email, emirate)…"
              className="pl-8 h-9"
            />
          </div>
          <Button size="sm" variant="outline" onClick={selectAllVisible} className="border-[#B89555]/40">
            <CheckSquare className="w-3.5 h-3.5 mr-1" /> Select all visible
          </Button>
          <Button size="sm" variant="outline" onClick={clearAll} className="border-[#B89555]/40">
            <Square className="w-3.5 h-3.5 mr-1" /> Clear
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setOverrideOpen((v) => !v)}
            className="border-[#B89555]/40"
          >
            <UserPlus className="w-3.5 h-3.5 mr-1" /> Manual override
          </Button>
        </div>

        {/* Manual override panel */}
        {overrideOpen && (
          <div className="mt-2 rounded-xl border-2 border-amber-300 bg-amber-50 p-3">
            <div className="flex items-start gap-2 text-xs text-amber-900 mb-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>
                <strong>Manual override:</strong> add any developer (including already-registered
                ones). They will be flagged in the next step so you can confirm before sending.
              </span>
            </div>
            <Input
              value={overrideSearch}
              onChange={(e) => setOverrideSearch(e.target.value)}
              placeholder="Search developer to add…"
              className="h-9 bg-white"
            />
            {overrideSearch.length >= 2 && (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-lg border border-amber-200 bg-white divide-y divide-amber-100">
                {overrideMatches.length === 0 && (
                  <div className="px-3 py-2 text-xs text-[#1A1A1A]/60">No matches with email on file.</div>
                )}
                {overrideMatches.map((d) => {
                  const already = chosen.has(d.id);
                  const reg = isAlreadyRegistered(d);
                  return (
                    <button
                      type="button"
                      key={d.id}
                      onClick={() => toggle(d.id)}
                      className="w-full px-3 py-2 flex items-start justify-between gap-3 hover:bg-amber-50 text-left overflow-visible"
                      data-developer-option
                    >
                      <div className="min-w-0 flex-1 overflow-visible">
                        <div data-developer-name className="text-sm font-semibold text-[#1A1A1A] whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">
                          {d.developer_name}
                        </div>
                        <div className="text-[11px] text-[#1A1A1A]/60 truncate">{d.developer_email}</div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {reg && (
                          <Badge variant="outline" className="border-[color:var(--emerald-1)]/30 jj-emerald-soft text-[color:var(--emerald-1)] text-[10px]">
                            Registered
                          </Badge>
                        )}
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded ${
 already ? "bg-[#1A1A1A] text-white" : "bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40"
 }`}
                        >
                          {already ? "Added" : "Add"}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Eligible table */}
        <div className="mt-3 overflow-hidden rounded-xl border border-[#B89555]/30">
          <table className="min-w-full text-sm">
            <thead className="bg-[#F7F2EA] text-[#1A1A1A]">
              <tr>
                <th className="text-left px-3 py-2 font-semibold w-8">&nbsp;</th>
                <th className="text-left px-3 py-2 font-semibold">Developer</th>
                <th className="text-left px-3 py-2 font-semibold">Email</th>
                <th className="text-left px-3 py-2 font-semibold">Status</th>
                <th className="text-right px-3 py-2 font-semibold">Outreach</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#B89555]/20 bg-[#FDFBF7]">
              {visibleEligible.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[#1A1A1A]/60 text-xs">
                    No eligible developers match your filter.
                  </td>
                </tr>
              )}
              {visibleEligible.map((d) => {
                const sel = chosen.has(d.id);
                const s = statusLabel(d);
                return (
                  <tr
                    key={d.id}
                    onClick={() => toggle(d.id)}
                    className={`cursor-pointer ${sel ? "bg-[#EFE6D6]/40" : "hover:bg-[#F7F2EA]/60"}`}
                  >
                    <td className="px-3 py-2">
                      <input
                        type="checkbox"
                        checked={sel}
                        onChange={() => toggle(d.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="accent-[#1A1A1A]"
                      />
                    </td>
                    <td className="px-3 py-2 font-semibold text-[#1A1A1A]">{d.developer_name}</td>
                    <td className="px-3 py-2 text-[#1A1A1A]/80 text-xs">
                      <span className="inline-flex items-center gap-1">
                        <Mail className="w-3 h-3" />
                        {d.developer_email}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span
                        title={s.tip}
                        className={`text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full border ${TONE_CLASS[s.tone]}`}
                      >
                        {s.label}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-right text-[#1A1A1A]/70 text-xs tabular-nums">
                      {d.outreach_count ?? 0}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Override summary */}
        {overrideAdds.length > 0 && (
          <div className="mt-3 rounded-xl border-2 border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              <strong>{overrideAdds.length}</strong>{" "}
              already-registered or out-of-scope developer{overrideAdds.length === 1 ? "" : "s"}{" "}
              added via manual override — confirm in the next step before sending.
            </span>
          </div>
        )}

        <DialogFooter className="mt-4">
          <div className="flex-1 text-xs text-[#1A1A1A]/70">
            <strong className="text-[#1A1A1A]">{chosen.size}</strong> selected ·{" "}
            {eligible.length} eligible by default · {developers.length} total
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="w-3.5 h-3.5 mr-1" /> Cancel
          </Button>
          <Button variant="gold" onClick={handleContinue} disabled={chosen.size === 0}>
            Continue · Review &amp; Send <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default ConfirmRegistrationLauncher;
