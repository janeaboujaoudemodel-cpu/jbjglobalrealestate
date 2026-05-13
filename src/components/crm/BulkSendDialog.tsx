import { useState, useMemo, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, FlaskConical, AlertTriangle, Lock, Unlock, CheckCircle2, XCircle, Clock, Eye, ListChecks, ShieldCheck, ShieldAlert, ShieldX, Loader2, UserCog, ChevronDown, ChevronUp, Search, UserMinus, UserPlus } from "lucide-react";
import { toast } from "sonner";
import {
  useSendDeveloperRegistration,
  useSendBrokerageOutreach,
  useEmailTemplate,
  useCheckBrokerageRegistration,
  useUpcomingBreakfastSlots,
  type RegistrationVariant,
  type BrokerageVariant,
  type AnyEmailVariant,
  type BrokerageCheckResult,
  type BrokerageGroupStatus,
  type BrokerageOutreachPersonalization,
} from "@/hooks/useCRMRelationships";
import { CITI_PROJECT_LIST, DEFAULT_FEATURED_PROJECT, getCitiProject, type CitiProjectKey } from "@/config/citi-projects";

type EntityType = "developer" | "brokerage";

const VARIANT_LABELS_DEV: Record<RegistrationVariant, string> = {
  developer_registration: "New registration request",
  developer_confirm_registered: "Confirm we are already registered",
};
const VARIANT_LABELS_BRK: Record<BrokerageVariant, string> = {
  brokerage_partnership_intro: "Partnership intro · Private breakfast",
  brokerage_breakfast_invite: "Breakfast invitation · RSVP",
};

const STATUS_LABEL: Record<string, string> = {
  not_started: "Not Started",
  pending_application: "Pending Application",
  documents_required: "Documents Required",
  under_review: "Under Review",
  registered: "Registered",
  rejected: "Rejected",
  expired: "Expired",
  // brokerage-side
  prospect: "Prospect",
  introduced: "Introduced",
  active: "Active partner",
  paused: "Paused",
};

const STATUS_PILL: Record<string, string> = {
  not_started: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
  pending_application: "bg-amber-100 text-amber-900 border-amber-300",
  documents_required: "bg-orange-100 text-orange-900 border-orange-300",
  under_review: "bg-blue-100 text-blue-900 border-blue-300",
  registered: "bg-emerald-100 text-emerald-900 border-emerald-300",
  rejected: "bg-red-100 text-red-900 border-red-300",
  expired: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
  prospect: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
  introduced: "bg-blue-100 text-blue-900 border-blue-300",
  active: "bg-emerald-100 text-emerald-900 border-emerald-300",
  paused: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30",
};

const GROUP_STATUS_OPTIONS: Array<{ value: BrokerageGroupStatus; label: string }> = [
  { value: "prospective", label: "Prospective Partner" },
  { value: "existing", label: "Existing Relationship" },
  { value: "priority", label: "Priority Partner" },
  { value: "active", label: "Active Channel Partner" },
  { value: "nda", label: "NDA-Signed Partner" },
  { value: "custom", label: "Custom label…" },
];

const formatSlotLabelLocal = (iso: string) => {
  try {
    return new Intl.DateTimeFormat("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: "Asia/Dubai",
    }).format(new Date(iso)) + " (GST)";
  } catch {
    return iso;
  }
};

const autoDetectGroupStatus = (r: any): BrokerageGroupStatus => {
  const stage = String(r?.outreach_stage || "").toLowerCase();
  const tags: string[] = Array.isArray(r?.tags) ? r.tags.map((t: any) => String(t).toLowerCase()) : [];
  if (String(r?.nda_status || "").toLowerCase() === "signed") return "nda";
  if (stage === "active") return "active";
  if (tags.includes("vip") || tags.includes("priority")) return "priority";
  if (r?.is_existing_match) return "existing";
  return "prospective";
};

interface Recipient {
  id: string;
  // developer fields
  developer_name?: string;
  developer_email?: string;
  // brokerage fields
  company_name?: string;
  email?: string;
  primary_contact?: any;
  // shared
  last_outreach_at?: string | null;
  status?: string;
}

type RowStatus = "queued" | "sending" | "ok" | "fail";

const getName = (r: Recipient, entityType: EntityType) =>
  entityType === "brokerage"
    ? r.company_name || "Brokerage"
    : r.developer_name || "Developer";

const getEmail = (r: Recipient, entityType: EntityType) =>
  entityType === "brokerage"
    ? (r.primary_contact?.email || r.email || "")
    : (r.developer_email || "");

export const BulkSendDialog = ({
  open, onOpenChange, selected, defaultTestEmail, entityType = "developer",
  initialVariant, title, lockVariant = false,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  selected: Recipient[];
  defaultTestEmail: string;
  entityType?: EntityType;
  initialVariant?: AnyEmailVariant;
  title?: string;
  lockVariant?: boolean;
}) => {
  const sendDev = useSendDeveloperRegistration();
  const sendBrk = useSendBrokerageOutreach();
  const send = entityType === "brokerage" ? sendBrk : sendDev;
  const checkBrk = useCheckBrokerageRegistration();

  const VARIANT_LABELS = (entityType === "brokerage" ? VARIANT_LABELS_BRK : VARIANT_LABELS_DEV) as Record<string, string>;
  const defaultVariant: AnyEmailVariant =
    initialVariant ??
    (entityType === "brokerage" ? "brokerage_partnership_intro" : "developer_registration");

  const [variant, setVariant] = useState<AnyEmailVariant>(defaultVariant);
  // Reset variant when entityType or initialVariant changes
  useEffect(() => { setVariant(defaultVariant); }, [entityType, initialVariant]); // eslint-disable-line react-hooks/exhaustive-deps
  const [skipRecent, setSkipRecent] = useState(true);
  const [testEmail, setTestEmail] = useState(defaultTestEmail);
  const [useCustomTestEmail, setUseCustomTestEmail] = useState(false);
  const [running, setRunning] = useState(false);
  const [statuses, setStatuses] = useState<Record<string, { status: RowStatus; error?: string }>>({});
  const [previewDevId, setPreviewDevId] = useState<string>("");
  const [showPreview, setShowPreview] = useState(true);
  const [borderedCard, setBorderedCard] = useState(false);
  const [reviewing, setReviewing] = useState(false);

  // Manual exclusion list (owner ticks rows out of the broadcast)
  const [excludedIds, setExcludedIds] = useState<Set<string>>(new Set());
  const [refineSearch, setRefineSearch] = useState("");

  // Pre-flight registration check (brokerage only).
  // Map of brokerageId → result. `null` value = "OK to send" but record exists.
  const [checks, setChecks] = useState<Record<string, BrokerageCheckResult>>({});
  const [checkRanFor, setCheckRanFor] = useState<string>(""); // signature of last-checked target set
  // Per-row override of "warn" rows — owner explicitly approved sending despite warnings.
  const [warnOverrides, setWarnOverrides] = useState<Record<string, boolean>>({});

  // Personalization (brokerage only). Per-recipient overrides; bulk defaults
  // applied on top of auto-derived values.
  const isBrokerageEntity = entityType === "brokerage";
  const { data: upcomingSlots = [] } = useUpcomingBreakfastSlots();
  const [bulkPreferredSlotId, setBulkPreferredSlotId] = useState<string>("");
  const [bulkGroupStatus, setBulkGroupStatus] = useState<BrokerageGroupStatus | "">("");
  const [bulkFeaturedProjectKey, setBulkFeaturedProjectKey] = useState<CitiProjectKey>(DEFAULT_FEATURED_PROJECT);
  const [perRowPersonalization, setPerRowPersonalization] = useState<
    Record<string, BrokerageOutreachPersonalization>
  >({});
  const [expandedPersonalize, setExpandedPersonalize] = useState<Record<string, boolean>>({});

  const resolvePersonalization = (r: Recipient): BrokerageOutreachPersonalization | undefined => {
    if (!isBrokerageEntity) return undefined;
    const row = perRowPersonalization[r.id] || {};
    const detected = autoDetectGroupStatus(r);
    const groupStatus =
      row.groupStatus ?? (bulkGroupStatus || undefined) ?? detected;
    const slotId = row.preferredSlotId ?? (bulkPreferredSlotId || undefined);
    const contactName = row.contactName ?? (r.primary_contact?.name || "");
    const featuredProjectKey = (row.featuredProjectKey as CitiProjectKey) || bulkFeaturedProjectKey;
    const out: BrokerageOutreachPersonalization = {
      contactName: contactName || undefined,
      groupStatus,
      preferredSlotId: slotId || undefined,
      groupStatusLabelOverride: row.groupStatusLabelOverride,
      preferredEventTimeOverride: row.preferredEventTimeOverride,
      featuredProjectKey,
    };
    return out;
  };


  // Keep testEmail in sync if owner email changes (and they haven't overridden)
  useEffect(() => {
    if (!useCustomTestEmail) setTestEmail(defaultTestEmail);
  }, [defaultTestEmail, useCustomTestEmail]);

  const { data: template } = useEmailTemplate(variant);

  const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const targets = useMemo(() => selected.filter((d) =>
    !!getEmail(d, entityType) && (!skipRecent || !d.last_outreach_at || new Date(d.last_outreach_at).getTime() < sevenDaysAgo)
  ), [selected, skipRecent, entityType]);
  const skipped = selected.length - targets.length;

  // Skip reason breakdown
  const skipBreakdown = useMemo(() => {
    let noEmail = 0, recent = 0;
    for (const d of selected) {
      if (!getEmail(d, entityType)) { noEmail++; continue; }
      if (skipRecent && d.last_outreach_at && new Date(d.last_outreach_at).getTime() >= sevenDaysAgo) {
        recent++;
      }
    }
    return { noEmail, recent };
  }, [selected, skipRecent, entityType]);

  // Status breakdown for the eligible recipients
  const statusBreakdown = useMemo(() => {
    const c: Record<string, number> = {};
    targets.forEach((t) => {
      const k = t.status || "not_started";
      c[k] = (c[k] || 0) + 1;
    });
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  }, [targets]);

  // Reset review state if selection or filter changes
  useEffect(() => {
    setReviewing(false);
    setChecks({});
    setCheckRanFor("");
    setWarnOverrides({});
    setExcludedIds(new Set());
    setRefineSearch("");
  }, [variant, skipRecent, selected.length]);

  // Compute per-id check breakdown.
  const checkBreakdown = useMemo(() => {
    let ok = 0, warn = 0, block = 0;
    targets.forEach((t) => {
      const r = checks[t.id];
      if (!r) return;
      if (r.status === "ok") ok++;
      else if (r.status === "warn") warn++;
      else block++;
    });
    return { ok, warn, block };
  }, [checks, targets]);

  // The list of recipients we will actually send to: ok rows + warn rows the
  // owner has explicitly overridden. Block rows are always excluded. When the
  // check hasn't run yet (e.g. dev flow), fall back to all targets.
  const isBrokerageFlow = entityType === "brokerage";
  const checksReady =
    !isBrokerageFlow ||
    (Object.keys(checks).length > 0 &&
      targets.every((t) => !!checks[t.id]));

  const effectiveTargets = useMemo(() => {
    const base = (() => {
      if (!isBrokerageFlow || Object.keys(checks).length === 0) return targets;
      return targets.filter((t) => {
        const r = checks[t.id];
        if (!r) return true;
        if (r.status === "ok") return true;
        if (r.status === "warn") return !!warnOverrides[t.id];
        return false; // block
      });
    })();
    return base.filter((t) => !excludedIds.has(t.id));
  }, [targets, checks, warnOverrides, isBrokerageFlow, excludedIds]);

  const refinedTargets = useMemo(
    () => targets.filter((t) => !excludedIds.has(t.id)),
    [targets, excludedIds],
  );

  const filteredRefineList = useMemo(() => {
    const q = refineSearch.trim().toLowerCase();
    if (!q) return targets;
    return targets.filter((t) => {
      const name = getName(t, entityType).toLowerCase();
      const email = getEmail(t, entityType).toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [targets, refineSearch, entityType]);

  useEffect(() => {
    if (!previewDevId && (targets[0] || selected[0])) {
      setPreviewDevId((targets[0] || selected[0]).id);
    }
  }, [targets, selected, previewDevId]);

  const previewDev = selected.find((d) => d.id === previewDevId) || selected[0];

  // Substitution map used to render preview HTML/subject for the selected recipient.
  const GROUP_LABELS_LOCAL: Record<BrokerageGroupStatus, string> = {
    prospective: "Prospective Partner",
    existing: "Existing Relationship",
    priority: "Priority Partner",
    active: "Active Channel Partner",
    nda: "NDA-Signed Partner",
    custom: "Channel Partner",
  };
  const GROUP_LINES_LOCAL: Record<BrokerageGroupStatus, string> = {
    prospective:
      "We'd love to introduce CITI Developer to your team.",
    existing:
      "Given the relationship our teams already share, I wanted to deepen the conversation directly with your leadership.",
    priority:
      "As one of the priority brokerages on our shortlist, I'd like to reserve a private session for your team.",
    active:
      "As one of our active channel partners, I'd like to set aside time for a strategic review with your leadership.",
    nda:
      "Building on the NDA already in place between our firms, I'd like to walk your leadership through what's coming next.",
    custom:
      "I'd like to host your leadership for a private briefing tailored to your team.",
  };

  const previewVars = useMemo<Record<string, string>>(() => {
    const name = getName(previewDev || ({} as Recipient), entityType);
    const firstNameOf = (s?: string) => (s ? s.trim().split(/\s+/)[0] : "");
    if (entityType !== "brokerage") {
      return { developer_name: name };
    }
    const personal = previewDev ? resolvePersonalization(previewDev) : undefined;
    const contactFull =
      personal?.contactName ||
      previewDev?.primary_contact?.name ||
      "";
    const groupKey: BrokerageGroupStatus =
      personal?.groupStatus || autoDetectGroupStatus(previewDev || {});
    const groupLabel =
      personal?.groupStatusLabelOverride ||
      GROUP_LABELS_LOCAL[groupKey];
    const groupLine = GROUP_LINES_LOCAL[groupKey];
    const slot = upcomingSlots.find((s) => s.id === personal?.preferredSlotId);
    const slotLabel = slot
      ? formatSlotLabelLocal(slot.slot_at)
      : (personal?.preferredEventTimeOverride || "");
    const brokerageLocation =
      (previewDev as any)?.office_location || (previewDev as any)?.emirate || "Dubai";
    const project = getCitiProject(personal?.featuredProjectKey);
    return {
      brokerage_name: name,
      brokerage_location: brokerageLocation,
      contact_first_name: firstNameOf(contactFull) || "Team",
      contact_full_name: contactFull || name,
      contact_title: previewDev?.primary_contact?.title || "",
      group_status_label: groupLabel,
      group_status_line: groupLine,
      preferred_event_time_label: slotLabel,
      preferred_event_time_iso: slot?.slot_at || "",
      owner_first_name: "Jane",
      reply_to: "contact@jbj.ae",
      cc_email: "infoo.jane@gmail.com",
      from_name: "JBJ Global Real Estate",
      represented_developer_name: "City Developer",
      booking_url: "#preview",
      project_name: project.name,
      project_url: project.url,
      project_tagline: project.tagline,
      project_offer_html: project.offerHtml || "",
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewDev, entityType, perRowPersonalization, bulkPreferredSlotId, bulkGroupStatus, bulkFeaturedProjectKey, upcomingSlots]);

  const renderPreview = (s: string) => {
    const conditional = s.replace(
      /\{\{#if\s+(\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g,
      (_, k, inner) => (previewVars[k] && String(previewVars[k]).trim().length > 0 ? inner : ""),
    );
    return conditional.replace(/\{\{(\w+)\}\}/g, (_, k) => previewVars[k] ?? `{{${k}}}`);
  };

  const previewHtml = useMemo(() => {
    if (!template?.html) return "<div style='padding:24px;font-family:Inter,sans-serif;color:#666'>Loading template…</div>";
    const rendered = renderPreview(String(template.html));
    if (!borderedCard) return rendered;
    // Preview-only: re-apply the original bordered look on .jbj-flat. Does NOT affect the bytes that get sent.
    const overrideStyle = `<style>.jbj-flat{padding:18px 20px !important;background:#FDFBF7 !important;border:1px solid #B89555 !important;border-radius:12px !important;margin-top:22px !important;}</style>`;
    return rendered.includes("</head>")
      ? rendered.replace("</head>", `${overrideStyle}</head>`)
      : overrideStyle + rendered;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, previewVars, borderedCard]);

  const previewSubject = useMemo(() => {
    if (!template?.subject) return "";
    return renderPreview(String(template.subject));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template, previewVars]);

  const sendTest = async () => {
    const recipient = useCustomTestEmail ? testEmail : defaultTestEmail;
    if (!recipient || !recipient.includes("@")) {
      toast.error("No valid registered email — set one in Owner Settings or use a custom address");
      return;
    }
    if (entityType === "brokerage") {
      await sendBrk.mutateAsync({
        variant: variant as BrokerageVariant,
        testRecipient: recipient,
        testBrokerageName: previewDev?.company_name || targets[0]?.company_name || selected[0]?.company_name,
      });
    } else {
      await sendDev.mutateAsync({
        variant: variant as RegistrationVariant,
        testRecipient: recipient,
        testDeveloperName: previewDev?.developer_name || targets[0]?.developer_name || selected[0]?.developer_name,
      });
    }
  };

  const runRegistrationCheck = async () => {
    if (!isBrokerageFlow || targets.length === 0) return;
    const sig = targets.map((t) => t.id).sort().join("|") + "::" + variant;
    if (sig === checkRanFor && Object.keys(checks).length > 0) return; // already fresh
    try {
      const results = await checkBrk.mutateAsync({
        brokerageIds: targets.map((t) => t.id),
        variant: variant as BrokerageVariant,
      });
      const map: Record<string, BrokerageCheckResult> = {};
      results.forEach((r) => { map[r.brokerageId] = r; });
      setChecks(map);
      setCheckRanFor(sig);
      setWarnOverrides({}); // reset overrides after a fresh check
    } catch (e) {
      // hook surfaces the toast — leave checks empty so UI shows "not yet run"
    }
  };

  const sendAll = async () => {
    if (!targets.length) { toast.error("No eligible recipients"); return; }

    // Step 1 of the review flow: run the registration check (brokerage only).
    if (isBrokerageFlow && !reviewing) {
      await runRegistrationCheck();
      setReviewing(true);
      return;
    }
    // Dev flow keeps original behaviour (single review step with no check).
    if (!isBrokerageFlow && !reviewing) { setReviewing(true); return; }

    const sendList = effectiveTargets;
    if (!sendList.length) {
      toast.error("Nothing to send — all rows are blocked or unapproved");
      return;
    }
    setReviewing(false);
    setRunning(true);
    const init: Record<string, { status: RowStatus }> = {};
    sendList.forEach((t) => { init[t.id] = { status: "queued" }; });
    setStatuses(init);

    let ok = 0, fail = 0;
    for (let i = 0; i < sendList.length; i++) {
      const t = sendList[i];
      setStatuses((p) => ({ ...p, [t.id]: { status: "sending" } }));
      try {
        if (entityType === "brokerage") {
          await sendBrk.mutateAsync({
            brokerageId: t.id,
            variant: variant as BrokerageVariant,
            personalization: resolvePersonalization(t),
            silent: true,
          });
        } else {
          await sendDev.mutateAsync({ developerId: t.id, variant: variant as RegistrationVariant, silent: true });
        }
        ok++;
        setStatuses((p) => ({ ...p, [t.id]: { status: "ok" } }));
      } catch (e: any) {
        fail++;
        setStatuses((p) => ({ ...p, [t.id]: { status: "fail", error: e?.message || "Failed" } }));
      }
      await new Promise((r) => setTimeout(r, 900));
    }
    toast.success(`Done. Sent: ${ok}, Failed: ${fail}`);
    setRunning(false);
  };

  const closeAndReset = () => {
    if (running) return;
    setStatuses({});
    setChecks({});
    setCheckRanFor("");
    setWarnOverrides({});
    onOpenChange(false);
  };


  return (
    <Dialog open={open} onOpenChange={(v) => !running && onOpenChange(v)}>
      <DialogContent className="max-w-[1500px] w-[97vw] bg-[#FDFBF7] max-h-[94vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-[#1A1A1A] flex items-center gap-2">
            {entityType === "brokerage" ? "Send Brokerage Outreach" : "Send Registration Email"}
            {template?.locked_at ? (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                <Lock className="w-3 h-3" />Locked
              </span>
            ) : (
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[#F7F2EA] text-[#1A1A1A] border border-[#B89555]/30 flex items-center gap-1">
                <Unlock className="w-3 h-3" />Draft
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 lg:grid-cols-[340px_minmax(0,1fr)]">
          <div className="space-y-4 min-w-0">
          {/* Variant */}
          <div>
            <Label className="text-xs text-[#1A1A1A]">Email variant</Label>
            <div className="grid grid-cols-2 gap-2 mt-1">
              {(Object.keys(VARIANT_LABELS) as AnyEmailVariant[]).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setVariant(v)}
                  disabled={running}
                  className={`text-xs px-3 py-2 rounded-lg border-2 text-left transition ${
                    variant === v ? "bg-[#1A1A1A] text-white border-[#1A1A1A]" : "bg-[#FDFBF7] text-[#1A1A1A] border-[#1A1A1A]/10 hover:border-[#1A1A1A]/30"
                  }`}
                >
                  {VARIANT_LABELS[v]}
                </button>
              ))}
            </div>
          </div>

          {/* Test send (left col) — always sends to your registered email by default */}
          <div className="border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FAF5EA]">
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A] mb-2">
              <FlaskConical className="w-4 h-4" /> <strong>Step 1 — Send test to yourself first</strong>
            </div>
            <div className="text-[11px] text-[#1A1A1A]/70 mb-2">
              Test will be sent to your registered email:&nbsp;
              <strong className="text-[#1A1A1A]">{defaultTestEmail || "—"}</strong>
            </div>
            {useCustomTestEmail ? (
              <div className="flex gap-2">
                <Input value={testEmail} onChange={(e) => setTestEmail(e.target.value)} placeholder="your@email" className="flex-1" />
                <Button variant="outline" onClick={sendTest} disabled={send.isPending || running}>
                  <FlaskConical className="w-3 h-3 mr-1" />Send TEST
                </Button>
              </div>
            ) : (
              <Button variant="outline" onClick={sendTest} disabled={send.isPending || running || !defaultTestEmail} className="w-full">
                <FlaskConical className="w-3 h-3 mr-1" />Send TEST to {defaultTestEmail || "your inbox"}
              </Button>
            )}
            <button
              type="button"
              onClick={() => setUseCustomTestEmail((v) => !v)}
              className="text-[10px] underline text-[#1A1A1A]/70 mt-2 hover:text-[#1A1A1A]"
            >
              {useCustomTestEmail ? "Use my registered email" : "Use a different address"}
            </button>
          </div>

          {/* Broadcast config (left col) */}
          <div className="space-y-2 border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FDFBF7]">
            <div className="text-xs text-[#1A1A1A]"><strong>Step 2 — Broadcast</strong></div>
            <div className="flex items-center justify-between text-sm text-[#1A1A1A]">
              <span>Selected {entityType === "brokerage" ? "brokerages" : "developers"}</span>
              <span className="font-bold">{selected.length}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#1A1A1A] flex items-center gap-2">
                <Switch checked={skipRecent} onCheckedChange={setSkipRecent} disabled={running} />
                Skip developers contacted in last 7 days
              </span>
              {skipped > 0 && <span className="text-amber-700 text-xs flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{skipped} skipped</span>}
            </div>
            <div className="flex items-center justify-between text-sm pt-2 border-t border-[#1A1A1A]/10">
              <span className="text-[#1A1A1A] font-semibold">Will send to</span>
              <span className="font-bold text-emerald-700">{targets.length}</span>
            </div>
          </div>

          {/* Personalization (brokerage only) — bulk defaults */}
          {isBrokerageEntity && (
            <div className="space-y-2 border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FDFBF7]">
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                <UserCog className="w-4 h-4" /><strong>Personalization defaults</strong>
              </div>
              <div className="text-[11px] text-[#1A1A1A]/70">Applied to every recipient unless overridden per row. Contact name auto-fills from each brokerage record.</div>
              <div>
                <Label className="text-[11px] text-[#1A1A1A]">Featured project (e-catalogue link)</Label>
                <Select value={bulkFeaturedProjectKey} onValueChange={(v) => setBulkFeaturedProjectKey(v as CitiProjectKey)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {CITI_PROJECT_LIST.map((p) => (
                      <SelectItem key={p.key} value={p.key} className="text-xs">
                        {p.name}{p.isFocus ? " · Focus" : ""}{p.offerHtml && p.key !== "amra" ? " · Promo" : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-[10px] text-[#1A1A1A]/60 mt-1">{getCitiProject(bulkFeaturedProjectKey).tagline}</div>
              </div>
              <div>
                <Label className="text-[11px] text-[#1A1A1A]">Group / partnership status</Label>
                <Select value={bulkGroupStatus || "__auto"} onValueChange={(v) => setBulkGroupStatus(v === "__auto" ? "" : (v as BrokerageGroupStatus))}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__auto" className="text-xs">Auto-detect per recipient</SelectItem>
                    {GROUP_STATUS_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[11px] text-[#1A1A1A]">Preferred event time</Label>
                <Select value={bulkPreferredSlotId || "__none"} onValueChange={(v) => setBulkPreferredSlotId(v === "__none" ? "" : v)}>
                  <SelectTrigger className="h-8 text-xs mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="__none" className="text-xs">Let them pick a time</SelectItem>
                    {upcomingSlots.map((s) => (
                      <SelectItem key={s.id} value={s.id} className="text-xs">{formatSlotLabelLocal(s.slot_at)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Status breakdown of eligible recipients */}
          <div className="space-y-2 border border-[#1A1A1A]/10 rounded-xl p-3 bg-[#FDFBF7]">
            <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
              <ListChecks className="w-4 h-4" /><strong>Recipient breakdown</strong>
            </div>
            {statusBreakdown.length === 0 ? (
              <div className="text-xs text-[#1A1A1A]/70 py-1">No eligible recipients to send to.</div>
            ) : (
              <div className="space-y-1.5">
                {statusBreakdown.map(([s, n]) => (
                  <div key={s} className="flex items-center justify-between text-xs">
                    <span className={`px-2 py-0.5 rounded-full border font-semibold ${STATUS_PILL[s] || "bg-[#F7F2EA] text-[#1A1A1A] border-[#B89555]/30"}`}>
                      {STATUS_LABEL[s] || s}
                    </span>
                    <span className="font-bold text-[#1A1A1A]">{n}</span>
                  </div>
                ))}
              </div>
            )}
            {(skipBreakdown.noEmail > 0 || skipBreakdown.recent > 0) && (
              <div className="pt-2 mt-2 border-t border-[#1A1A1A]/10 space-y-1 text-xs text-[#1A1A1A]/70">
                <div className="font-semibold text-[#1A1A1A] mb-0.5">Skipped:</div>
                {skipBreakdown.noEmail > 0 && (
                  <div className="flex justify-between"><span>Missing email</span><span className="font-bold">{skipBreakdown.noEmail}</span></div>
                )}
                {skipBreakdown.recent > 0 && (
                  <div className="flex justify-between"><span>Contacted in last 7 days</span><span className="font-bold">{skipBreakdown.recent}</span></div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div className="space-y-4 min-w-0">
          {/* Email Preview */}
          <div className="border border-[#1A1A1A]/10 rounded-xl bg-[#FDFBF7] overflow-hidden">
            <div className="flex items-center justify-between px-3 py-2 border-b border-[#1A1A1A]/10 bg-[#FAF5EA]">
              <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                <Eye className="w-4 h-4" /><strong>Email preview</strong>
              </div>
              <div className="flex items-center gap-2">
                {selected.length > 0 && (
                  <Select value={previewDevId} onValueChange={setPreviewDevId}>
                    <SelectTrigger className="h-7 text-xs w-[200px]"><SelectValue placeholder="Preview as…" /></SelectTrigger>
                    <SelectContent>
                      {selected.map((d) => (
                        <SelectItem key={d.id} value={d.id} className="text-xs">{getName(d, entityType)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                {entityType === "brokerage" && (
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-7 text-xs"
                    title="Preview only — does not affect the email that gets sent"
                    onClick={() => setBorderedCard((b) => !b)}
                  >
                    {borderedCard ? "◼ Bordered card" : "◻ Bordered card"}
                  </Button>
                )}
                <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setShowPreview((s) => !s)}>
                  {showPreview ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
            {showPreview && (
              <>
                <div className="px-3 py-2 text-xs border-b border-[#1A1A1A]/10 bg-[#FDFBF7]">
                  <div className="text-[#1A1A1A]"><strong>Subject:</strong> {previewSubject}</div>
                  <div className="text-[#1A1A1A]/70 mt-0.5">
                    <strong className="text-[#1A1A1A]">To:</strong> {(previewDev && getEmail(previewDev, entityType)) || "—"} · <strong className="text-[#1A1A1A]">Variant:</strong> {VARIANT_LABELS[variant]}
                  </div>
                </div>
                <iframe
                  title="email-preview"
                  srcDoc={previewHtml}
                  sandbox=""
                  className="block w-full h-[78vh] min-h-[640px] bg-[#FDFBF7] rounded-b-xl border-0"
                />
              </>
            )}
          </div>

          {/* Refine recipients — Include / Exclude */}
          {!running && targets.length > 0 && (
            <div className="border border-[#1A1A1A]/10 rounded-xl bg-[#FDFBF7] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1A1A1A]/10 bg-[#FAF5EA]">
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <ListChecks className="w-4 h-4" />
                  <strong>Refine recipients</strong>
                  <span className="text-[10px] text-[#1A1A1A]/70">— include / exclude before sending</span>
                </div>
                <div className="flex items-center gap-2 text-[11px]">
                  <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                    {refinedTargets.length} included
                  </span>
                  {excludedIds.size > 0 && (
                    <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 font-bold">
                      {excludedIds.size} excluded
                    </span>
                  )}
                </div>
              </div>
              <div className="px-3 py-2 flex items-center gap-2 border-b border-[#1A1A1A]/10">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-2 top-1/2 -translate-y-1/2 text-[#1A1A1A]/50" />
                  <Input
                    value={refineSearch}
                    onChange={(e) => setRefineSearch(e.target.value)}
                    placeholder={`Search ${entityType === "brokerage" ? "agencies" : "developers"} by name or email…`}
                    className="h-8 text-xs pl-7"
                  />
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setExcludedIds(new Set())}
                  disabled={excludedIds.size === 0}
                >
                  Reset
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs"
                  onClick={() => setExcludedIds(new Set(targets.map((t) => t.id)))}
                >
                  Exclude all
                </Button>
              </div>
              <div className="max-h-[260px] overflow-y-auto divide-y divide-black/5">
                {filteredRefineList.length === 0 ? (
                  <div className="px-3 py-3 text-xs text-[#1A1A1A]/70">No matches.</div>
                ) : (
                  filteredRefineList.map((t) => {
                    const excluded = excludedIds.has(t.id);
                    return (
                      <div key={t.id} className="flex items-center justify-between px-3 py-1.5 text-xs">
                        <div className="flex items-center gap-2 min-w-0">
                          <input
                            type="checkbox"
                            checked={!excluded}
                            onChange={(e) => {
                              setExcludedIds((p) => {
                                const next = new Set(p);
                                if (e.target.checked) next.delete(t.id);
                                else next.add(t.id);
                                return next;
                              });
                            }}
                            className="accent-emerald-600"
                          />
                          <span className="font-semibold text-[#1A1A1A] truncate">{getName(t, entityType)}</span>
                          <span className="text-[#1A1A1A]/70 truncate">{getEmail(t, entityType)}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            setExcludedIds((p) => {
                              const next = new Set(p);
                              if (excluded) next.delete(t.id);
                              else next.add(t.id);
                              return next;
                            })
                          }
                          className={`text-[10px] uppercase tracking-wider font-bold flex items-center gap-1 px-2 py-0.5 rounded-full border ${
                            excluded
                              ? "bg-red-50 text-red-700 border-red-200"
                              : "bg-emerald-50 text-emerald-700 border-emerald-200"
                          }`}
                        >
                          {excluded ? <><UserPlus className="w-3 h-3" />Include</> : <><UserMinus className="w-3 h-3" />Exclude</>}
                        </button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* Pre-flight registration check (brokerage only) */}
          {isBrokerageFlow && (reviewing || Object.keys(checks).length > 0 || checkBrk.isPending) && !running && (
            <div className="border border-[#1A1A1A]/10 rounded-xl bg-[#FDFBF7] overflow-hidden">
              <div className="flex items-center justify-between px-3 py-2 border-b border-[#1A1A1A]/10 bg-[#FAF5EA]">
                <div className="flex items-center gap-2 text-xs text-[#1A1A1A]">
                  <ShieldCheck className="w-4 h-4 text-emerald-700" />
                  <strong>Pre-flight CRM registration check</strong>
                </div>
                {checksReady && Object.keys(checks).length > 0 && (
                  <div className="flex items-center gap-2 text-[11px]">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-bold">
                      {checkBreakdown.ok} ready
                    </span>
                    {checkBreakdown.warn > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-bold">
                        {checkBreakdown.warn} warn
                      </span>
                    )}
                    {checkBreakdown.block > 0 && (
                      <span className="px-2 py-0.5 rounded-full bg-red-100 text-red-900 border border-red-300 font-bold">
                        {checkBreakdown.block} blocked
                      </span>
                    )}
                  </div>
                )}
              </div>
              {checkBrk.isPending ? (
                <div className="px-3 py-4 flex items-center gap-2 text-xs text-[#1A1A1A]/70">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking each brokerage against existing CRM leads, clients, brokers and prior outreach…
                </div>
              ) : Object.keys(checks).length === 0 ? (
                <div className="px-3 py-3 text-xs text-[#1A1A1A]/70 flex items-center justify-between gap-2">
                  <span>Not yet run. Click "Review &amp; send" below to scan for duplicates.</span>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={runRegistrationCheck}>
                    Run check now
                  </Button>
                </div>
              ) : (
                <div className="max-h-[260px] overflow-y-auto divide-y divide-black/5">
                  {targets.map((t) => {
                    const r = checks[t.id];
                    if (!r) return null;
                    const Icon =
                      r.status === "ok" ? ShieldCheck :
                      r.status === "warn" ? ShieldAlert : ShieldX;
                    const tone =
                      r.status === "ok" ? "text-emerald-700" :
                      r.status === "warn" ? "text-amber-700" : "text-red-700";
                    return (
                      <div key={t.id} className="px-3 py-2 text-xs">
                        <div className="flex items-center justify-between gap-2 min-w-0">
                          <div className="flex items-center gap-2 min-w-0">
                            <Icon className={`w-4 h-4 ${tone}`} />
                            <span className="font-semibold text-[#1A1A1A] truncate">{getName(t, entityType)}</span>
                            <span className="text-[#1A1A1A]/70 truncate">{getEmail(t, entityType)}</span>
                          </div>
                          {r.status === "warn" && (
                            <label className="flex items-center gap-1 text-[10px] text-[#1A1A1A]/70 cursor-pointer shrink-0">
                              <input
                                type="checkbox"
                                checked={!!warnOverrides[t.id]}
                                onChange={(e) =>
                                  setWarnOverrides((p) => ({ ...p, [t.id]: e.target.checked }))
                                }
                                className="accent-amber-600"
                              />
                              <span>Send anyway</span>
                            </label>
                          )}
                          {r.status === "block" && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-red-700 shrink-0">
                              Blocked
                            </span>
                          )}
                          {r.status === "ok" && (
                            <span className="text-[10px] uppercase tracking-wider font-bold text-emerald-700 shrink-0">
                              OK to send
                            </span>
                          )}
                        </div>
                        {r.reasons.length > 0 && (
                          <ul className={`mt-1 ml-6 list-disc text-[11px] ${tone}`}>
                            {r.reasons.map((re, idx) => (
                              <li key={idx}>{re.label}</li>
                            ))}
                          </ul>
                        )}
                        {/* Per-row personalization */}
                        <div className="ml-6 mt-1.5">
                          <button
                            type="button"
                            onClick={() => setExpandedPersonalize((p) => ({ ...p, [t.id]: !p[t.id] }))}
                            className="inline-flex items-center gap-1 text-[10px] text-[#1A1A1A]/70 hover:text-[#1A1A1A]"
                          >
                            {expandedPersonalize[t.id] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            Customize for this recipient
                          </button>
                          {expandedPersonalize[t.id] && (
                            <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-2 p-2 bg-[#FAF5EA] border border-[#1A1A1A]/10 rounded-lg">
                              <div>
                                <Label className="text-[10px] text-[#1A1A1A]">Contact name</Label>
                                <Input
                                  className="h-7 text-xs mt-0.5"
                                  value={perRowPersonalization[t.id]?.contactName ?? (t.primary_contact?.name || "")}
                                  onChange={(e) => setPerRowPersonalization((p) => ({ ...p, [t.id]: { ...p[t.id], contactName: e.target.value } }))}
                                  placeholder="Full name"
                                />
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#1A1A1A]">Group status</Label>
                                <Select
                                  value={perRowPersonalization[t.id]?.groupStatus || "__inherit"}
                                  onValueChange={(v) => setPerRowPersonalization((p) => ({ ...p, [t.id]: { ...p[t.id], groupStatus: v === "__inherit" ? undefined : (v as BrokerageGroupStatus) } }))}
                                >
                                  <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__inherit" className="text-xs">Use default</SelectItem>
                                    {GROUP_STATUS_OPTIONS.map((o) => (
                                      <SelectItem key={o.value} value={o.value} className="text-xs">{o.label}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div>
                                <Label className="text-[10px] text-[#1A1A1A]">Preferred time</Label>
                                <Select
                                  value={perRowPersonalization[t.id]?.preferredSlotId || "__inherit"}
                                  onValueChange={(v) => setPerRowPersonalization((p) => ({ ...p, [t.id]: { ...p[t.id], preferredSlotId: v === "__inherit" ? undefined : v } }))}
                                >
                                  <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__inherit" className="text-xs">Use default</SelectItem>
                                    {upcomingSlots.map((s) => (
                                      <SelectItem key={s.id} value={s.id} className="text-xs">{formatSlotLabelLocal(s.slot_at)}</SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                              <div className="md:col-span-3">
                                <Label className="text-[10px] text-[#1A1A1A]">Featured project</Label>
                                <Select
                                  value={(perRowPersonalization[t.id]?.featuredProjectKey as string) || "__inherit"}
                                  onValueChange={(v) => setPerRowPersonalization((p) => ({ ...p, [t.id]: { ...p[t.id], featuredProjectKey: v === "__inherit" ? undefined : v } }))}
                                >
                                  <SelectTrigger className="h-7 text-xs mt-0.5"><SelectValue /></SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="__inherit" className="text-xs">Use default ({getCitiProject(bulkFeaturedProjectKey).name})</SelectItem>
                                    {CITI_PROJECT_LIST.map((p) => (
                                      <SelectItem key={p.key} value={p.key} className="text-xs">
                                        {p.name}{p.isFocus ? " · Focus" : ""}{p.offerHtml && p.key !== "amra" ? " · Promo" : ""}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Per-recipient progress */}
          {(running || Object.keys(statuses).length > 0) && (
            <div className="border border-[#1A1A1A]/10 rounded-xl bg-[#FDFBF7]">
              <div className="px-3 py-2 border-b border-[#1A1A1A]/10 text-xs text-[#1A1A1A] bg-[#FAF5EA]">
                <strong>Live send progress</strong>
              </div>
              <div className="max-h-[260px] overflow-y-auto divide-y divide-black/5">
                {targets.map((t) => {
                  const s = statuses[t.id]?.status || "queued";
                  const err = statuses[t.id]?.error;
                  const icon =
                    s === "ok" ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> :
                    s === "fail" ? <XCircle className="w-4 h-4 text-red-600" /> :
                    s === "sending" ? <Clock className="w-4 h-4 text-amber-600 animate-pulse" /> :
                    <Clock className="w-4 h-4 text-[#1A1A1A]/70" />;
                  return (
                    <div key={t.id} className="flex items-center justify-between px-3 py-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        {icon}
                        <span className="font-semibold text-[#1A1A1A] truncate">{getName(t, entityType)}</span>
                        <span className="text-[#1A1A1A]/70 truncate">{getEmail(t, entityType)}</span>
                      </div>
                      <span className={`uppercase tracking-wider font-bold ${
                        s === "ok" ? "text-emerald-700" :
                        s === "fail" ? "text-red-700" :
                        s === "sending" ? "text-amber-700" : "text-[#1A1A1A]/70"
                      }`}>
                        {s === "ok" ? "sent" : s === "fail" ? (err || "failed") : s}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
        </div>

        {reviewing && !running && (
          <div className="mt-3 border-2 border-amber-400 bg-amber-50 rounded-xl p-3 text-sm text-[#1A1A1A]">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="font-bold mb-1">Confirm bulk send</div>
                <div className="text-xs leading-relaxed">
                  About to send <strong>"{VARIANT_LABELS[variant]}"</strong> to <strong className="text-emerald-700">{effectiveTargets.length}</strong> {entityType === "brokerage" ? "brokerage" : "developer"}{effectiveTargets.length === 1 ? "" : "s"}
                  {excludedIds.size > 0 && (
                    <span> · <strong className="text-red-700">{excludedIds.size} excluded</strong> by you</span>
                  )}.
                  {statusBreakdown.length > 0 && (
                    <span> Includes:{" "}
                      {statusBreakdown.map(([s, n], i) => (
                        <span key={s}>
                          <strong>{n} {STATUS_LABEL[s] || s}</strong>{i < statusBreakdown.length - 1 ? ", " : ""}
                        </span>
                      ))}.
                    </span>
                  )}
                  {skipped > 0 && <span> {skipped} will be skipped ({skipBreakdown.noEmail > 0 && `${skipBreakdown.noEmail} no email`}{skipBreakdown.noEmail > 0 && skipBreakdown.recent > 0 && ", "}{skipBreakdown.recent > 0 && `${skipBreakdown.recent} contacted recently`}).</span>}
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={closeAndReset} disabled={running}>
            {Object.keys(statuses).length > 0 && !running ? "Close" : "Cancel"}
          </Button>
          {reviewing && !running && (
            <Button variant="outline" onClick={() => setReviewing(false)}>
              Back
            </Button>
          )}
          <Button onClick={sendAll} disabled={running || !refinedTargets.length || (reviewing && effectiveTargets.length === 0)} className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A]">
            <Send className="w-3 h-3 mr-1" />
            {running
              ? "Sending…"
              : reviewing
                ? `Confirm & send to ${effectiveTargets.length}`
                : `Review & send (${refinedTargets.length}${excludedIds.size > 0 ? ` · ${excludedIds.size} excluded` : ""})`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
