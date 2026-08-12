import React from "react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Mail, Inbox as InboxIcon, Send as SendIcon, FileText, Trash2, Archive, ShieldAlert,
  RefreshCw, Loader2, Search, Star, Sparkles, Plus, Gauge, Broom,
} from "lucide-react";
import { cn } from "@/lib/utils";
import InboxMessageList from "./inbox/InboxMessageList";
import InboxReader from "./inbox/InboxReader";
import {
  DEFAULT_FILTERS, callInbox, useInboxAccounts, useInboxEmails,
  type InboxEmail, type InboxFilters, type InboxFolder,
} from "./inbox/useInboxData";

const FOLDERS: { key: InboxFolder; label: string; icon: React.ElementType }[] = [
  { key: "inbox", label: "Inbox", icon: InboxIcon },
  { key: "sent", label: "Sent", icon: SendIcon },
  { key: "drafts", label: "Drafts", icon: FileText },
  { key: "archive", label: "Archive", icon: Archive },
  { key: "spam", label: "Spam", icon: ShieldAlert },
  { key: "trash", label: "Trash", icon: Trash2 },
];

const CATEGORIES = [
  "lead", "client", "developer", "partner", "internal",
  "vendor", "recruitment", "legal", "finance", "marketing", "spam", "other",
];

const AdminInbox: React.FC = () => {
  const { accounts, loading: accountsLoading, reload: reloadAccounts } = useInboxAccounts();
  const [filters, setFilters] = React.useState<InboxFilters>(DEFAULT_FILTERS);
  const [searchDraft, setSearchDraft] = React.useState("");
  const { emails, total, loading, reload } = useInboxEmails(filters);
  const [selected, setSelected] = React.useState<InboxEmail | null>(null);
  const [checkedIds, setCheckedIds] = React.useState<string[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchDraft })), 350);
    return () => clearTimeout(t);
  }, [searchDraft]);

  React.useEffect(() => {
    if (selected && !emails.some((e) => e.id === selected.id)) setSelected(null);
    if (selected) {
      const fresh = emails.find((e) => e.id === selected.id);
      if (fresh && fresh !== selected) setSelected(fresh);
    }
  }, [emails, selected]);

  const patch = (next: Partial<InboxFilters>) => setFilters((f) => ({ ...f, ...next }));

  const run = async (key: string, fn: () => Promise<unknown>, success: string) => {
    setBusy(key);
    try {
      await fn();
      toast.success(success);
      reload();
      void reloadAccounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(null);
    }
  };

  const syncAll = () =>
    run(
      "sync",
      async () => {
        const results = await Promise.allSettled([
          callInbox("inbox-sync", { maxPerFolder: 40 }),
          callInbox("inbox-outlook-sync", { maxPerFolder: 40 }),
          callInbox("inbox-hostinger-sync", { maxPerFolder: 40 }),
        ]);
        const failures = results.filter((r) => r.status === "rejected");
        if (failures.length === results.length) {
          throw new Error((failures[0] as PromiseRejectedResult).reason?.message ?? "All syncs failed");
        }
      },
      "Mailbox sync finished",
    );

  const bulk = (action: string, success: string) =>
    run(action, () => callInbox("inbox-mirror", { emailIds: checkedIds, action }), success).then(() =>
      setCheckedIds([]),
    );

  const openEmail = (email: InboxEmail) => {
    setSelected(email);
    if (email.is_unread) {
      void callInbox("inbox-mirror", { emailIds: [email.id], action: "read" }).then(reload).catch(() => {});
    }
  };

  return (
    <div className="mx-auto w-full max-w-[1700px] px-4 py-6">
      <header className="mb-4 flex flex-wrap items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black">
          <Mail className="h-5 w-5 text-white" />
        </div>
        <div className="min-w-0">
          <h1 className="text-xl font-bold text-[#0F172A]">Admin Email Inbox</h1>
          <p className="text-xs text-[#0F172A]/70">
            All JBJ Global Real Estate mailboxes in one desk — every action mirrors to the real mailbox.
          </p>
        </div>
        <div className="ml-auto flex flex-wrap gap-2">
          <Button size="sm" variant="outline" className="whitespace-nowrap" disabled={busy !== null} onClick={syncAll}>
            {busy === "sync" ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
            Sync now
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() => run("sla", () => callInbox("inbox-sla-check"), "SLA states refreshed")}
          >
            <Gauge className="mr-1.5 h-4 w-4" /> SLA sweep
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="whitespace-nowrap"
            disabled={busy !== null}
            onClick={() => run("cleanup", () => callInbox("inbox-cleanup-run", { dryRun: true }), "Cleanup preview generated")}
          >
            <Broom className="mr-1.5 h-4 w-4" /> Cleanup preview
          </Button>
        </div>
      </header>

      <div className="grid gap-4 lg:grid-cols-[260px_minmax(0,1fr)] xl:grid-cols-[260px_420px_minmax(0,1fr)]">
        {/* Mailbox rail */}
        <aside className="space-y-3">
          <Card className="border-black/10">
            <CardContent className="space-y-1 p-3">
              <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#0F172A]/60">
                Mailboxes
              </p>
              <button
                type="button"
                onClick={() => patch({ accountId: "all" })}
                className={cn(
                  "flex w-full items-center justify-between gap-2 rounded-md px-2 py-2 text-left text-sm",
                  filters.accountId === "all" ? "bg-[#064E3B] text-white" : "hover:bg-black/5 text-[#0F172A]",
                )}
              >
                <span className="truncate font-semibold">All mailboxes</span>
              </button>
              {accountsLoading ? (
                <Skeleton className="h-9 w-full" />
              ) : accounts.length === 0 ? (
                <p className="px-2 py-2 text-xs text-[#0F172A]/70">
                  No mailbox linked yet. Use “Link mailbox” below.
                </p>
              ) : (
                accounts.map((account) => (
                  <button
                    key={account.id}
                    type="button"
                    onClick={() => patch({ accountId: account.id })}
                    className={cn(
                      "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm",
                      filters.accountId === account.id ? "bg-[#064E3B] text-white" : "hover:bg-black/5 text-[#0F172A]",
                    )}
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate font-semibold">{account.email_address}</span>
                      <span className={cn("block truncate text-[11px]", filters.accountId === account.id ? "text-white/75" : "text-[#0F172A]/60")}>
                        {account.provider}
                        {account.last_synced_at
                          ? ` · synced ${formatDistanceToNow(new Date(account.last_synced_at), { addSuffix: true })}`
                          : " · never synced"}
                      </span>
                    </span>
                    {(account.unread_count ?? 0) > 0 && (
                      <Badge className="border-transparent bg-[#B8860B] text-white">{account.unread_count}</Badge>
                    )}
                  </button>
                ))
              )}

              <div className="pt-2">
                <Select
                  onValueChange={(provider) =>
                    run("link", () => callInbox("inbox-connect-account", { provider }), "Mailbox linked and first sync started")
                  }
                >
                  <SelectTrigger className="h-9 whitespace-nowrap">
                    <SelectValue placeholder="Link mailbox" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gmail">Gmail (connector)</SelectItem>
                    <SelectItem value="outlook">Outlook (Microsoft)</SelectItem>
                    <SelectItem value="imap">Hostinger (IMAP)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="border-black/10">
            <CardContent className="space-y-1 p-3">
              <p className="px-1 pb-1 text-[11px] font-semibold uppercase tracking-wide text-[#0F172A]/60">Folders</p>
              {FOLDERS.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => patch({ folder: key })}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-2 text-left text-sm font-semibold whitespace-nowrap",
                    filters.folder === key ? "bg-[#064E3B] text-white" : "hover:bg-black/5 text-[#0F172A]",
                  )}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {label}
                </button>
              ))}
            </CardContent>
          </Card>
        </aside>

        {/* Message list */}
        <Card className="flex min-h-0 flex-col overflow-hidden border-black/10">
          <div className="shrink-0 space-y-2 border-b border-black/10 p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-2.5 h-4 w-4 text-[#0F172A]/50" />
              <Input
                value={searchDraft}
                onChange={(e) => setSearchDraft(e.target.value)}
                placeholder="Search sender, subject or body"
                className="h-9 pl-8"
              />
            </div>
            <div className="flex flex-wrap gap-1.5">
              <Button
                size="sm"
                variant={filters.unreadOnly ? "default" : "outline"}
                className={cn("h-7 whitespace-nowrap px-2 text-xs", filters.unreadOnly && "bg-[#064E3B] text-white hover:bg-[#053f30]")}
                onClick={() => patch({ unreadOnly: !filters.unreadOnly })}
              >
                Unread
              </Button>
              <Button
                size="sm"
                variant={filters.starredOnly ? "default" : "outline"}
                className={cn("h-7 whitespace-nowrap px-2 text-xs", filters.starredOnly && "bg-[#064E3B] text-white hover:bg-[#053f30]")}
                onClick={() => patch({ starredOnly: !filters.starredOnly })}
              >
                <Star className="mr-1 h-3 w-3" /> Starred
              </Button>
              <Button
                size="sm"
                variant={filters.awaitingReply ? "default" : "outline"}
                className={cn("h-7 whitespace-nowrap px-2 text-xs", filters.awaitingReply && "bg-[#064E3B] text-white hover:bg-[#053f30]")}
                onClick={() => patch({ awaitingReply: !filters.awaitingReply })}
              >
                Awaiting reply
              </Button>
              <Select value={filters.category} onValueChange={(v) => patch({ category: v })}>
                <SelectTrigger className="h-7 w-[140px] whitespace-nowrap text-xs">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={filters.urgency} onValueChange={(v) => patch({ urgency: v })}>
                <SelectTrigger className="h-7 w-[124px] whitespace-nowrap text-xs">
                  <SelectValue placeholder="Urgency" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All urgency</SelectItem>
                  {["critical", "high", "normal", "low"].map((u) => (
                    <SelectItem key={u} value={u}>{u}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#0F172A]/60">
                {total} message{total === 1 ? "" : "s"}
              </p>
              {checkedIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  <Button size="sm" variant="outline" className="h-7 whitespace-nowrap px-2 text-xs" disabled={busy !== null} onClick={() => bulk("read", "Marked read")}>
                    Mark read
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 whitespace-nowrap px-2 text-xs" disabled={busy !== null} onClick={() => bulk("archive", "Archived")}>
                    Archive
                  </Button>
                  <Button size="sm" variant="outline" className="h-7 whitespace-nowrap px-2 text-xs" disabled={busy !== null} onClick={() => bulk("trash", "Moved to trash")}>
                    Trash
                  </Button>
                </div>
              )}
            </div>
          </div>
          <div className="min-h-0 flex-1 overflow-y-auto" style={{ maxHeight: "70vh" }}>
            <InboxMessageList
              emails={emails}
              loading={loading}
              selectedId={selected?.id ?? null}
              checkedIds={checkedIds}
              onOpen={openEmail}
              onToggleCheck={(id) =>
                setCheckedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
              }
            />
          </div>
        </Card>

        {/* Reader */}
        <Card className="flex min-h-0 flex-col overflow-hidden border-black/10 xl:col-auto lg:col-span-2 xl:col-span-1" style={{ maxHeight: "82vh" }}>
          <InboxReader email={selected} onChanged={reload} />
        </Card>
      </div>

      <p className="mt-4 flex items-center gap-2 text-[11px] text-[#0F172A]/60">
        <Sparkles className="h-3.5 w-3.5 text-[#B8860B]" />
        AI is assistive only — it triages and drafts, never sends without your approval.
      </p>
    </div>
  );
};

export default AdminInbox;
