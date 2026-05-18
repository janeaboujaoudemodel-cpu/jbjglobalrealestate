import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, ShieldCheck, Search, UserPlus, CalendarIcon, Check } from "lucide-react";

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
          // New-broker intake — backend stores these on crm_brokers when creating
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
      <DialogContent className="max-w-2xl bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1A1A1A]">
            <ShieldCheck className="h-4 w-4 text-[#B89555]" /> Give Broker Access
          </DialogTitle>
          <p className="text-xs text-[#1A1A1A]/60 mt-1 truncate">{sourceDatabaseName}</p>
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
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2">
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
              <div className="col-span-2">
                <Label className="text-xs text-[#1A1A1A]/80">Role / position</Label>
                <Input value={n_role} onChange={(e) => setNRole(e.target.value)} className={inputCls} />
              </div>
              <div className="col-span-2">
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
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Scope</Label>
              <select value={scope} onChange={(e) => setScope(e.target.value as any)} className={selectCls}>
                <option value="external">External (Partner)</option>
                <option value="internal">Internal (JBJ)</option>
              </select>
            </div>
            <div>
              <Label className="text-xs text-[#1A1A1A]/80">Permission</Label>
              <select value={perm} onChange={(e) => setPerm(e.target.value as any)} className={selectCls}>
                <option value="view">View only</option>
                <option value="edit">Edit</option>
              </select>
            </div>
          </div>

          <div>
            <Label className="text-xs text-[#1A1A1A]/80">Expires (optional)</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal h-9 bg-white border-[#B89555]/30 text-[#1A1A1A]",
                    "hover:bg-[#F7F2EA] hover:border-[#B89555]/50",
                    !expiresAt && "text-[#1A1A1A]/50",
                  )}
                >
                  <CalendarIcon className="mr-2 h-3.5 w-3.5 text-[#1A1A1A]/60" />
                  {expiresAt ? format(expiresAt, "PPP") : <span>No expiration — pick a date</span>}
                  {expiresAt && (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); setExpiresAt(undefined); }}
                      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); setExpiresAt(undefined); } }}
                      className="ml-auto text-[10px] text-[#1A1A1A]/60 hover:text-[#1A1A1A] underline cursor-pointer"
                    >
                      clear
                    </span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent
                align="start"
                className="w-auto p-0 bg-[#FDFBF7] border-[#B89555]/30"
              >
                <Calendar
                  mode="single"
                  selected={expiresAt}
                  onSelect={setExpiresAt}
                  disabled={(d) => d < new Date(new Date().setHours(0, 0, 0, 0))}
                  initialFocus
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
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
              className="accent-[#B89555] h-3.5 w-3.5"
            />
            Send branded invitation email with onboarding link
          </label>
        </div>

        <DialogFooter className="mt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}
            className="border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#F7F2EA]">Cancel</Button>
          <Button onClick={submit} disabled={busy}
            className="bg-[#EFE6D6] hover:bg-[#E7DCC7] text-[#1A1A1A] border border-[#B89555]">
            {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <ShieldCheck className="h-4 w-4 mr-2" />}
            Grant access
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
