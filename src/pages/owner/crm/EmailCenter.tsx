/**
 * EmailCenter — JBJ-related inbox command center.
 * Real-estate only mail from the connected Gmail, classified into
 * actionable categories with one-click follow-ups and CRM auto-sync.
 *
 * Every automated send BCCs infoo.jane@gmail.com.
 */
import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IconTile } from "@/components/ui/icon-tile";
import {
  Mail,
  RefreshCw,
  Inbox,
  FileSignature,
  Handshake,
  Briefcase,
  FileQuestion,
  Sparkles,
  ShieldCheck,
  Paperclip,
  ExternalLink,
  Archive,
  Send,
  Rocket,
  Banknote,
  CalendarRange,
  FolderOpen,
  Users,
} from "lucide-react";
import {
  useEmailInboxItems,
  useInboxCategoryCounts,
  useSyncJbjInbox,
  useSendRegistrationConfirmation,
  useArchiveInboxItem,
  type InboxCategory,
  type InboxStatus,
} from "@/hooks/useEmailInboxItems";

type Tone = "gold" | "purple" | "blue" | "amber" | "emerald" | "rose" | "ink";

const CATEGORIES: Array<{ id: InboxCategory; label: string; tone: Tone; icon: typeof Mail }> = [
  { id: "overview",           label: "Overview",            tone: "gold",    icon: Inbox },
  { id: "contracts",          label: "Signed Contracts",    tone: "purple",  icon: FileSignature },
  { id: "registrations",      label: "Registrations",       tone: "blue",    icon: ShieldCheck },
  { id: "brokerages",         label: "Brokerages",          tone: "emerald", icon: Users },
  { id: "new_launches",       label: "New Launches",        tone: "rose",    icon: Rocket },
  { id: "projects_inventory", label: "Projects & Inventory",tone: "amber",   icon: FolderOpen },
  { id: "commission",         label: "Commission",          tone: "emerald", icon: Banknote },
  { id: "events",             label: "Events",              tone: "amber",   icon: CalendarRange },
  { id: "opportunities",      label: "Opportunities",       tone: "amber",   icon: Sparkles },
  { id: "partnerships",       label: "Partnerships",        tone: "emerald", icon: Handshake },
  { id: "careers",            label: "Careers",             tone: "rose",    icon: Briefcase },
  { id: "other",              label: "Other",               tone: "ink",     icon: FileQuestion },
];

const STATUS_CHIP: Record<string, { label: string; cls: string }> = {
  awaiting_you:   { label: "Awaiting you",   cls: "bg-amber-100 text-amber-900 border-amber-300" },
  awaiting_them:  { label: "Awaiting them",  cls: "bg-blue-100 text-blue-900 border-blue-300" },
  signed:         { label: "Signed",         cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  registered:     { label: "Registered",     cls: "bg-emerald-100 text-emerald-900 border-emerald-300" },
  needs_review:   { label: "Needs review",   cls: "bg-rose-100 text-rose-900 border-rose-300" },
  needs_document: { label: "Needs document", cls: "bg-rose-100 text-rose-900 border-rose-300" },
  info_only:      { label: "Info",           cls: "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]/30" },
};

const STATUS_FILTERS: Array<{ id: "all" | InboxStatus; label: string }> = [
  { id: "all",            label: "All" },
  { id: "awaiting_you",   label: "Awaiting you" },
  { id: "awaiting_them",  label: "Awaiting them" },
  { id: "signed",         label: "Signed" },
  { id: "registered",     label: "Registered" },
  { id: "needs_document", label: "Needs document" },
  { id: "needs_review",   label: "Needs review" },
];

export default function EmailCenter() {
  const [active, setActive] = useState<InboxCategory>("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | InboxStatus>("all");
  const [showArchived, setShowArchived] = useState(false);
  const { data: items = [], isLoading } = useEmailInboxItems(active, { showArchived });
  const { data: counts = {} } = useInboxCategoryCounts();
  const sync = useSyncJbjInbox();
  const sendConfirm = useSendRegistrationConfirmation();
  const archive = useArchiveInboxItem();

  const grouped = useMemo(
    () => (statusFilter === "all" ? items : items.filter((i) => i.status === statusFilter)),
    [items, statusFilter],
  );

  return (
    <div className="space-y-4">
      {/* Header */}
      <Card className="bg-[#F7F2EA] border-[#B89555]/30">
        <CardHeader className="pb-3 border-b border-[#B89555]/15">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <CardTitle className="flex items-center gap-2 text-[#1A1A1A] text-lg">
              <IconTile icon={Mail} tone="gold" size="sm" />
              Email Command Center
              <span className="text-xs font-normal text-[#1A1A1A]/60">
                Real-estate only · auto-BCC infoo.jane@gmail.com on every send
              </span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowArchived((v) => !v)}
                className={[
                  "h-8 px-3 rounded-md text-xs font-medium border transition-colors",
                  showArchived
                    ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                    : "bg-transparent text-[#1A1A1A]/70 border-[#B89555]/40 hover:bg-[#EFE6D6]/60 hover:text-[#1A1A1A]",
                ].join(" ")}
                title={showArchived ? "Show active inbox" : "Show archived (non real-estate) items"}
              >
                {showArchived ? "Showing archived" : `Archived (${(counts as any).archived ?? 0})`}
              </button>
              <Button
                size="sm"
                variant="outline"
                disabled={sync.isPending}
                onClick={() => sync.mutate()}
                className="h-8 text-xs border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/60"
              >
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${sync.isPending ? "animate-spin" : ""}`} />
                Sync inbox now
              </Button>
            </div>
        </CardHeader>
        <CardContent className="p-3">
          {/* Category tabs */}
          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map((c) => {
              const Icon = c.icon;
              const isActive = active === c.id;
              const n = counts[c.id] ?? 0;
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setActive(c.id)}
                  className={[
                    "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[13px] font-medium border transition-colors",
                    isActive
                      ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                      : "bg-transparent text-[#1A1A1A]/70 border-transparent hover:bg-[#EFE6D6]/60 hover:text-[#1A1A1A]",
                  ].join(" ")}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {c.label}
                  {n > 0 && (
                    <span className="ml-1 inline-flex items-center justify-center min-w-[1.125rem] h-[18px] px-1 rounded-full text-[10px] font-semibold tabular-nums bg-[#FDFBF7] text-[#1A1A1A] border border-[#B89555]/40">
                      {n}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Status sub-filter */}
          <div className="mt-3 pt-3 border-t border-[#B89555]/15 flex flex-wrap items-center gap-1.5">
            <span className="text-[11px] uppercase tracking-wide text-[#1A1A1A]/55 mr-1">Filter</span>
            {STATUS_FILTERS.map((f) => {
              const isActive = statusFilter === f.id;
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => setStatusFilter(f.id)}
                  className={[
                    "inline-flex items-center px-2.5 py-1 rounded-full text-[12px] font-medium border transition-colors",
                    isActive
                      ? "bg-[#EFE6D6] text-[#1A1A1A] border-[#B89555]"
                      : "bg-transparent text-[#1A1A1A]/70 border-[#B89555]/20 hover:bg-[#EFE6D6]/60",
                  ].join(" ")}
                >
                  {f.label}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Items */}
      {isLoading ? (
        <div className="text-sm text-[#1A1A1A]/60 px-4 py-8 text-center">Loading…</div>
      ) : grouped.length === 0 ? (
        <Card className="bg-[#FDFBF7] border-[#B89555]/20">
          <CardContent className="py-12 text-center text-sm text-[#1A1A1A]/70">
            <Inbox className="h-8 w-8 mx-auto mb-2 text-[#1A1A1A]/40" />
            No JBJ-related emails yet in this category. Click <strong>Sync inbox now</strong> to pull the latest from Gmail.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {grouped.map((it) => {
            const chip = STATUS_CHIP[it.status] ?? STATUS_CHIP.info_only;
            const cat = CATEGORIES.find((c) => c.id === it.category) ?? CATEGORIES[CATEGORIES.length - 1];
            const Icon = cat.icon;
            const isRegistration = it.category === "registrations" || it.category === "contracts";
            return (
              <Card key={it.id} className="bg-[#FDFBF7] border border-[#B89555]/60 shadow-[0_1px_0_rgba(184,149,85,0.15),0_2px_8px_rgba(26,26,26,0.04)] hover:shadow-[0_2px_0_rgba(184,149,85,0.25),0_4px_16px_rgba(26,26,26,0.06)] transition-shadow">
                <CardContent className="p-3">
                  <div className="flex items-start gap-3">
                    <IconTile icon={Icon} tone={cat.tone} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <div className="text-sm font-semibold text-[#1A1A1A] truncate">
                          {it.raw_subject || "(no subject)"}
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Badge variant="outline" className={`${chip.cls} border font-semibold text-[10px]`}>{chip.label}</Badge>
                          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A] text-[10px] uppercase tracking-wide">
                            {cat.label}
                          </Badge>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-[#1A1A1A]/70 truncate">
                        From <strong>{it.from_name || it.from_email}</strong> · {it.from_email}
                        {it.received_at && <> · {new Date(it.received_at).toLocaleString()}</>}
                      </div>
                      {it.snippet && (
                        <div className="mt-1 text-xs text-[#1A1A1A]/80 line-clamp-2">
                          {it.snippet}
                        </div>
                      )}
                      {it.attachments && it.attachments.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[11px] text-[#1A1A1A]/75">
                          <Paperclip className="h-3 w-3" />
                          {it.attachments.slice(0, 3).map((a, i) => (
                            <span key={i} className="px-1.5 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/30">
                              {a.filename}
                            </span>
                          ))}
                          {it.attachments.length > 3 && <span>+{it.attachments.length - 3} more</span>}
                        </div>
                      )}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {it.action_required && (
                          <Badge variant="outline" className="bg-amber-50 border-amber-300 text-amber-900 text-[10px]">
                            Action: {it.action_required}
                          </Badge>
                        )}
                        {it.linked_contract_url && (
                          <a
                            href={it.linked_contract_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-[#1A1A1A] underline underline-offset-2"
                          >
                            <ExternalLink className="h-3 w-3" /> Open contract link
                          </a>
                        )}
                      </div>
                      <div className="mt-2.5 flex flex-wrap gap-2">
                        {it.gmail_thread_id && (
                          <Button
                            asChild
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs border-[#B89555]/40"
                          >
                            <a
                              href={`https://mail.google.com/mail/u/0/#inbox/${it.gmail_thread_id}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <Mail className="h-3 w-3 mr-1" /> Open in Gmail
                            </a>
                          </Button>
                        )}
                        {isRegistration && it.linked_developer_id && it.status !== "registered" && (
                          <>
                            <Button
                              size="sm"
                              variant="gold"
                              className="h-7 text-xs"
                              disabled={sendConfirm.isPending}
                              onClick={() => sendConfirm.mutate({ developer_id: it.linked_developer_id!, variant: "registration_confirm" })}
                            >
                              <Send className="h-3 w-3 mr-1" />
                              Ask developer to confirm registration
                            </Button>
                            {it.status === "signed" && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-7 text-xs border-[#B89555]/40"
                                disabled={sendConfirm.isPending}
                                onClick={() => sendConfirm.mutate({ developer_id: it.linked_developer_id!, variant: "request_signed_doc" })}
                              >
                                Request signed document
                              </Button>
                            )}
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-xs text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                          onClick={() => archive.mutate(it.id)}
                        >
                          <Archive className="h-3 w-3 mr-1" /> Archive
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
