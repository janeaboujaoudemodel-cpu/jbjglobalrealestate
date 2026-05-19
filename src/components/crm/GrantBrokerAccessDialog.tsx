import { useEffect, useMemo, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DatePopover } from "@/components/ui/date-popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Search, UserPlus, Check, Info, UserPlus2 } from "lucide-react";
import { isFeatureEnabled } from "@/config/featureFlags";
import { UnifiedBrokerPicker, type UnifiedBrokerSelection } from "@/components/crm/UnifiedBrokerPicker";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  sourceDatabaseId: string;
  sourceDatabaseName: string;
  onGranted?: () => void;
}

type BrokerRow = {
  id: string;
  full_name: string | null;
  email_lower: string | null;
  current_company: string | null;
  user_id: string | null;
  broker_type: string | null;
};

const inputCls =
  "bg-white border border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 " +
  "focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#B89555]/30 " +
  "hover:border-[#B89555]/50 transition-colors";

const selectCls =
  "h-9 w-full rounded-md border border-[#B89555]/30 bg-white text-sm px-2 text-[#1A1A1A] " +
  "focus:border-[#1A1A1A] focus:outline-none focus:ring-2 focus:ring-[#B89555]/30";

export default function GrantBrokerAccessDialog({
  open, onOpenChange, sourceDatabaseId, sourceDatabaseName, onGranted,
}: Props) {
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [busy, setBusy] = useState(false);

  // --- Existing broker state ---
  const [brokers, setBrokers] = useState<BrokerRow[]>([]);
  const [loadingBrokers, setLoadingBrokers] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedBroker, setSelectedBroker] = useState<BrokerRow | null>(null);

  // --- New broker state ---
  const [n_fullName, setNFullName] = useState("");
  const [n_email, setNEmail] = useState("");
  const [n_phone, setNPhone] = useState("");
  const [n_company, setNCompany] = useState("");
  const [n_nationality, setNNationality] = useState("");
  const [n_languages, setNLanguages] = useState("");
  const [n_role, setNRole] = useState("");
  const [n_brokerage, setNBrokerage] = useState("");
  const [n_notes, setNNotes] = useState("");

  // --- Shared access state ---
  const [scope, setScope] = useState<"internal" | "external">("external");
  const [perm, setPerm] = useState<"view" | "edit">("view");
  const [expiresAt, setExpiresAt] = useState<Date | undefined>(undefined);
  const [accessNotes, setAccessNotes] = useState("");
  const [sendInvite, setSendInvite] = useState(true);

  // --- Phase 3 visibility scope ---
  const [direction, setDirection] = useState<"broker_to_owner_only" | "bidirectional">("broker_to_owner_only");
  const [windowMode, setWindowMode] = useState<"all" | "today" | "last_7" | "last_30" | "custom" | "from_date">("all");
  const [winStart, setWinStart] = useState<Date | undefined>();
  const [winEnd, setWinEnd] = useState<Date | undefined>();
  const [statusFilterText, setStatusFilterText] = useState("");

  // Load existing brokers
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingBrokers(true);
    supabase
      .from("crm_brokers")
      .select("id, full_name, email_lower, current_company, user_id, broker_type")
      .order("full_name", { ascending: true, nullsFirst: false })
      .limit(500)
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) toast.error(`Could not load brokers: ${error.message}`);
        setBrokers((data ?? []) as BrokerRow[]);
        setLoadingBrokers(false);
      });
    return () => { cancelled = true; };
  }, [open]);

  // Reset on close
  useEffect(() => {
    if (!open) {
      setTab("existing");
      setSelectedBroker(null);
      setSearch("");
      setNFullName(""); setNEmail(""); setNPhone(""); setNCompany("");
      setNNationality(""); setNLanguages(""); setNRole(""); setNBrokerage(""); setNNotes("");
      setScope("external"); setPerm("view"); setExpiresAt(undefined);
      setAccessNotes(""); setSendInvite(true);
      setDirection("broker_to_owner_only"); setWindowMode("all");
      setWinStart(undefined); setWinEnd(undefined); setStatusFilterText("");
    }
  }, [open]);

  const filteredBrokers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return brokers.slice(0, 50);
    return brokers
      .filter((b) =>
        (b.full_name ?? "").toLowerCase().includes(q) ||
        (b.email_lower ?? "").toLowerCase().includes(q) ||
        (b.current_company ?? "").toLowerCase().includes(q),
      )
      .slice(0, 50);
  }, [brokers, search]);

  const submit = async () => {
    let email: string;
    let displayName: string | undefined;

    if (tab === "existing") {
      if (!selectedBroker) { toast.error("Select a broker first"); return; }
      if (!selectedBroker.email_lower) { toast.error("Selected broker has no email on record"); return; }
      email = selectedBroker.email_lower;
      displayName = selectedBroker.full_name ?? undefined;
    } else {
      if (!n_email.trim()) { toast.error("Email is required"); return; }
      if (!n_fullName.trim()) { toast.error("Full name is required"); return; }
      email = n_email.trim();
      displayName = n_fullName.trim();
    }

    setBusy(true);
    try {
      const statusFilter = statusFilterText
        .split(",").map(s => s.trim()).filter(Boolean);
      const { data, error } = await supabase.functions.invoke("crm-grant-broker-access", {
        body: {
          source_database_id: sourceDatabaseId,
          broker_email: email,
          broker_display_name: displayName,
          permission_level: perm,
          broker_scope: scope,
          expires_at: expiresAt ? expiresAt.toISOString() : null,
          notes: accessNotes.trim() || null,
          send_invite: sendInvite,
          // Phase 3 — visibility rule
          visibility_direction: direction,
          date_window_mode: windowMode,
          date_window_start: windowMode === "custom" || windowMode === "from_date"
            ? (winStart ? winStart.toISOString() : null) : null,
          date_window_end: windowMode === "custom"
            ? (winEnd ? winEnd.toISOString() : null) : null,
          status_filter: statusFilter.length ? statusFilter : null,
          new_broker_profile: tab === "new" ? {
            full_name: n_fullName.trim(),
            phone_e164: n_phone.trim() || null,
            current_company: n_company.trim() || null,
            nationality: n_nationality.trim() || null,
            languages: n_languages.split(",").map(s => s.trim()).filter(Boolean),
            role_title: n_role.trim() || null,
            current_brokerage_name: n_brokerage.trim() || null,
            notes: n_notes.trim() || null,
          } : null,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(
        (data as any)?.broker_created
          ? "Broker account created — invitation sent"
          : "Access granted to existing broker",
      );
      onGranted?.();
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e?.message ?? "Could not grant access");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="crm-scope max-w-2xl w-[calc(100vw-2rem)] sm:w-auto max-h-[90vh] overflow-y-auto bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <ShieldCheck className="h-4 w-4 text-[#B89555]" /> Give Broker Access
          </DialogTitle>
          <DialogDescription className="text-xs text-[#1A1A1A]/60 mt-1 truncate">{sourceDatabaseName}</DialogDescription>
        </DialogHeader>

        <Tabs value={tab} onValueChange={(v) => setTab(v as "existing" | "new")}>
          <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30 p-1">
            <TabsTrigger
              value="existing"
              className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555] text-[#1A1A1A]/70"
            >
              <Search className="h-3.5 w-3.5 mr-1.5" /> Existing broker
            </TabsTrigger>
            <TabsTrigger
              value="new"
              className="data-[state=active]:bg-[#EFE6D6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border data-[state=active]:border-[#B89555] text-[#1A1A1A]/70"
            >
              <UserPlus className="h-3.5 w-3.5 mr-1.5" /> New broker
            </TabsTrigger>
          </TabsList>

          {/* ─────────── EXISTING BROKER ─────────── */}
          <TabsContent value="existing" className="space-y-3 mt-3">
            <Input
              autoFocus
              placeholder="Search by name, email or company…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={inputCls}
            />
            <div className="max-h-56 overflow-y-auto rounded-md border border-[#B89555]/30 bg-white divide-y divide-[#B89555]/15">
              {loadingBrokers ? (
                <div className="p-6 text-center text-xs text-[#1A1A1A]/60 flex items-center justify-center gap-2">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading brokers…
                </div>
              ) : filteredBrokers.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#1A1A1A]/60">
                  No brokers match — try the "New broker" tab.
                </div>
              ) : (
                filteredBrokers.map((b) => {
                  const isSel = selectedBroker?.id === b.id;
                  return (
                    <button
                      key={b.id}
                      type="button"
                      onClick={() => setSelectedBroker(b)}
                      className={cn(
                        "w-full text-left px-3 py-2 flex items-center gap-2 transition-colors",
                        isSel
                          ? "bg-[#EFE6D6] border-l-2 border-[#B89555]"
                          : "hover:bg-[#F7F2EA]",
                      )}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium text-[#1A1A1A] truncate">
                          {b.full_name || "Unnamed broker"}
                        </div>
                        <div className="text-[11px] text-[#1A1A1A]/60 truncate">
                          {b.email_lower ?? "no email"}
                          {b.current_company ? ` · ${b.current_company}` : ""}
                        </div>
                      </div>
                      {isSel && <Check className="h-4 w-4 text-[#1A1A1A] shrink-0" />}
                    </button>
                  );
                })
              )}
            </div>
            {selectedBroker && (
              <div className="text-[11px] text-[#1A1A1A]/70 px-1">
                Selected: <span className="font-medium text-[#1A1A1A]">{selectedBroker.full_name ?? selectedBroker.email_lower}</span>
              </div>
            )}
          </TabsContent>

          {/* ─────────── NEW BROKER ─────────── */}
          <TabsContent value="new" className="mt-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label className="text-xs text-[#1A1A1A]/80">Full name *</Label>
                <Input value={n_fullName} onChange={(e) => setNFullName(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Email *</Label>
                <Input type="email" value={n_email} onChange={(e) => setNEmail(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Phone</Label>
                <Input value={n_phone} onChange={(e) => setNPhone(e.target.value)} placeholder="+971…" className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Company</Label>
                <Input value={n_company} onChange={(e) => setNCompany(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Brokerage</Label>
                <Input value={n_brokerage} onChange={(e) => setNBrokerage(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Nationality</Label>
                <Input value={n_nationality} onChange={(e) => setNNationality(e.target.value)} className={inputCls} />
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Languages (comma-sep)</Label>
                <Input value={n_languages} onChange={(e) => setNLanguages(e.target.value)} placeholder="English, Arabic" className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-[#1A1A1A]/80">Role / position</Label>
                <Input value={n_role} onChange={(e) => setNRole(e.target.value)} className={inputCls} />
              </div>
              <div className="sm:col-span-2">
                <Label className="text-xs text-[#1A1A1A]/80">Notes</Label>
                <Textarea rows={2} value={n_notes} onChange={(e) => setNNotes(e.target.value)} className={inputCls} />
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* ─────────── ACCESS SCOPE (shared) ─────────── */}
        <div className="mt-2 pt-3 border-t border-[#B89555]/20 space-y-3">
          <div className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/60 font-semibold">
            Access settings
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Scope</Label>
              <Select value={scope} onValueChange={(v) => setScope(v as any)}>
                <SelectTrigger className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="crm-scope bg-[#FDFBF7] border-[#B89555]/30">
                  <SelectItem value="external">External (Partner)</SelectItem>
                  <SelectItem value="internal">Internal (JBJ)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Permission</Label>
              <Select value={perm} onValueChange={(v) => setPerm(v as any)}>
                <SelectTrigger className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="crm-scope bg-[#FDFBF7] border-[#B89555]/30">
                  <SelectItem value="view">View only</SelectItem>
                  <SelectItem value="edit">Edit</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Phase 3 — Visibility scope */}
          <div className="rounded-md border border-[#B89555]/30 bg-[#F7F2EA] p-3 space-y-3">
            <div className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/60 font-semibold">
              Visibility scope
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Direction</Label>
                <Select value={direction} onValueChange={(v) => setDirection(v as any)}>
                  <SelectTrigger className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="crm-scope bg-[#FDFBF7] border-[#B89555]/30">
                    <SelectItem value="broker_to_owner_only">Broker → Owner only (default)</SelectItem>
                    <SelectItem value="bidirectional">Bidirectional (broker sees owner edits)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-[#1A1A1A]/80">Time window</Label>
                <Select value={windowMode} onValueChange={(v) => setWindowMode(v as any)}>
                  <SelectTrigger className="h-9 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="crm-scope bg-[#FDFBF7] border-[#B89555]/30">
                    <SelectItem value="all">All time</SelectItem>
                    <SelectItem value="today">Today only</SelectItem>
                    <SelectItem value="last_7">Last 7 days</SelectItem>
                    <SelectItem value="last_30">Last 30 days</SelectItem>
                    <SelectItem value="from_date">From a date → present</SelectItem>
                    <SelectItem value="custom">Custom range</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {(windowMode === "custom" || windowMode === "from_date") && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-xs text-[#1A1A1A]/80">Start date</Label>
                  <DatePopover value={winStart} onChange={setWinStart} placeholder="Pick a start date" />
                </div>
                {windowMode === "custom" && (
                  <div>
                    <Label className="text-xs text-[#1A1A1A]/80">End date</Label>
                    <DatePopover value={winEnd} onChange={setWinEnd} placeholder="Pick an end date" />
                  </div>
                )}
              </div>
            )}

            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Status filter (optional, comma-separated)</Label>
              <Input
                value={statusFilterText}
                onChange={(e) => setStatusFilterText(e.target.value)}
                placeholder="new, contacted, qualified"
                className={inputCls}
              />
              <p className="text-[10px] text-[#1A1A1A]/50 mt-1">
                Restrict broker visibility to leads in these pipeline stages only. Leave empty to allow all.
              </p>
            </div>

            <p className="text-[10px] text-[#1A1A1A]/60 leading-relaxed">
              Owner edits remain invisible to the broker unless this grant is set to bidirectional or you explicitly share individual leads.
            </p>
          </div>


          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Expires (optional)</Label>
            <DatePopover
              value={expiresAt}
              onChange={setExpiresAt}
              placeholder="No expiration — pick a date"
              disablePast
            />
          </div>

          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Notes (optional)</Label>
            <Textarea rows={2} value={accessNotes} onChange={(e) => setAccessNotes(e.target.value)} className={inputCls} />
          </div>

          <label className="flex items-center gap-2 text-xs text-[#1A1A1A]/80 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={sendInvite}
              onChange={(e) => setSendInvite(e.target.checked)}
              className="accent-[#1A1A1A] h-3.5 w-3.5"
            />
            Send branded invitation email with onboarding link
          </label>
        </div>

        <DialogFooter className="mt-2 flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA] w-full sm:w-auto">Cancel</Button>
          <Button onClick={submit} disabled={busy}
            className="bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555] w-full sm:w-auto">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Grant access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
