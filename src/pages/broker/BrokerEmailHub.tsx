import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useBrokerEmails, useBrokerEmailAccounts, useMarkEmailRead, useClassifyEmail, useConnectBrokerEmail, useSyncBrokerEmail, EMAIL_CATEGORIES, type EmailCategory } from "@/hooks/useBrokerEmails";
import { useBrokerOAuthApps } from "@/hooks/useBrokerOAuthApps";
import { Mail, Sparkles, Plug, Star, RefreshCw, KeyRound, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDisplayDate } from "@/utils/formatDate";
import { toast } from "sonner";

export default function BrokerEmailHub() {
  const location = useLocation();
  const navigate = useNavigate();
  const [category, setCategory] = useState<EmailCategory>("all");
  const emails = useBrokerEmails(category);
  const accounts = useBrokerEmailAccounts();
  const oauthApps = useBrokerOAuthApps();
  const markRead = useMarkEmailRead();
  const classify = useClassifyEmail();
  const connect = useConnectBrokerEmail();
  const sync = useSyncBrokerEmail();

  const hasGmailApp = !!oauthApps.data?.find((a) => a.provider === "gmail");
  const hasOutlookApp = !!oauthApps.data?.find((a) => a.provider === "outlook");
  const setupPath = `/broker/email/setup${location.search.includes("preview=1") ? "?preview=1" : ""}`;

  const tryConnect = (p: "gmail" | "outlook") => {
    const ok = p === "gmail" ? hasGmailApp : hasOutlookApp;
    if (!ok) {
      toast.info(`Opening Email Setup so you can add your ${p === "gmail" ? "Google" : "Microsoft"} OAuth credentials first.`);
      navigate(setupPath);
      return;
    }
    connect.mutate(p);
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">JBJ GLOBAL REAL ESTATE</div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1 flex items-center gap-2">
              <Mail className="h-6 w-6" /> Smart Inbox
            </h1>
            <p className="text-sm text-[#1A1A1A]/70 mt-1">
              Connect Gmail or Outlook. Incoming messages are auto-categorised by AI: client leads, new launches, commissions, HR, and more.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              asChild
              variant="primary"
              data-surface="emerald"
              className="jj-surface-emerald allow-white text-white [&_svg]:text-white [&_svg]:stroke-white hover:-translate-y-0.5 hover:brightness-110"
            >
              <Link to={setupPath}><KeyRound className="h-4 w-4 mr-1.5" /> Email Setup</Link>
            </Button>
            <Button
              onClick={() => tryConnect("gmail")}
              disabled={connect.isPending}
              data-surface="emerald"
              className="jj-surface-emerald allow-white text-white [&_svg]:text-white [&_svg]:stroke-white hover:-translate-y-0.5 hover:brightness-110"
            >
              <Plug className="h-4 w-4 mr-1.5" /> Connect Gmail
            </Button>
            <Button
              onClick={() => tryConnect("outlook")}
              disabled={connect.isPending}
              variant="primary"
              data-surface="emerald"
              className="jj-surface-emerald allow-white text-white [&_svg]:text-white [&_svg]:stroke-white hover:-translate-y-0.5 hover:brightness-110"
            >
              <Plug className="h-4 w-4 mr-1.5" /> Connect Outlook
            </Button>

          </div>
        </div>
        {!hasGmailApp && !hasOutlookApp && (
          <div className="mt-3 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              No OAuth credentials yet. Go to <Link to={setupPath} className="underline font-semibold">Email Setup</Link> and paste your Google or Microsoft Client ID & Secret to enable connecting your mailbox.
            </div>
          </div>
        )}
        {(accounts.data ?? []).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {accounts.data!.map((a: any) => (
              <span key={a.id} className="text-[11px] px-2 py-1 rounded-md bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A] inline-flex items-center gap-1.5">
                {a.provider} · {a.email_address} · {a.status}
                <button
                  onClick={() => sync.mutate(a.id)}
                  className="inline-flex items-center text-[#1A1A1A]/70 hover:text-[#1A1A1A] ml-1"
                  title="Sync now"
                >
                  <RefreshCw className={`h-3 w-3 ${sync.isPending ? "animate-spin" : ""}`} />
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      <nav className="flex flex-wrap gap-1.5">
        {EMAIL_CATEGORIES.map((c) => {
          const active = category === c;
          return (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`text-[11px] uppercase tracking-[0.12em] px-2.5 py-1 rounded-md border ${active ? "jj-surface-emerald allow-white border-white/20 text-white shadow-[0_10px_22px_-14px_rgba(6,78,59,0.75)]" : "bg-white border-[#B89555]/25 text-[#1A1A1A]/65 hover:bg-[#EFE6D6] hover:text-[#1A1A1A]"}`}
            >
              {c.replace(/_/g, " ")}
            </button>
          );
        })}
      </nav>

      <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 overflow-hidden">
        {emails.isLoading ? (
          <div className="p-10 text-center text-sm text-[#1A1A1A]/60">Loading…</div>
        ) : (emails.data ?? []).length === 0 ? (
          <div className="p-10 text-center text-sm text-[#1A1A1A]/65">
            No emails {category !== "all" ? `in "${category.replace(/_/g, " ")}"` : "yet"}.
            Connect an account to start syncing.
          </div>
        ) : (
          <ul className="divide-y divide-[#B89555]/15">
            {emails.data!.map((e: any) => (
              <li
                key={e.id}
                onClick={() => !e.is_read && markRead.mutate({ id: e.id, read: true })}
                className={`p-4 cursor-pointer transition-colors ${e.is_read ? "bg-transparent" : "bg-[#FDFBF7]"} hover:bg-[#F2EADA]`}
              >
                <div className="flex items-start gap-3">
                  <div className="h-9 w-9 rounded-md bg-[#EFE6D6] border border-[#B89555]/30 grid place-items-center shrink-0">
                    {e.is_starred ? <Star className="h-4 w-4 text-[#B89555]" /> : <Mail className="h-4 w-4 text-[#1A1A1A]" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-sm ${e.is_read ? "text-[#1A1A1A]/85" : "font-semibold text-[#1A1A1A]"} truncate`}>
                        {e.from_name || e.from_address || "Unknown sender"}
                      </span>
                      {e.ai_category && (
                        <span className="text-[10px] uppercase tracking-[0.12em] px-1.5 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A]/75">
                          {e.ai_category.replace(/_/g, " ")}
                        </span>
                      )}
                      <span className="ml-auto text-[11px] text-[#1A1A1A]/55 tabular-nums">{formatDisplayDate(e.received_at)}</span>
                    </div>
                    <div className={`text-sm mt-0.5 truncate ${e.is_read ? "text-[#1A1A1A]/75" : "text-[#1A1A1A]"}`}>
                      {e.subject || "(no subject)"}
                    </div>
                    {e.snippet && (
                      <div className="text-xs text-[#1A1A1A]/65 mt-1 line-clamp-2">{e.snippet}</div>
                    )}
                    {e.ai_summary && (
                      <div className="text-[11px] text-[#1A1A1A]/70 mt-1 italic">AI: {e.ai_summary}</div>
                    )}
                    {!e.ai_category && (
                      <button
                        onClick={(ev) => { ev.stopPropagation(); classify.mutate(e.id); }}
                        className="jj-surface-emerald allow-white mt-2 inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1.5 rounded-md border border-white/20 text-white hover:-translate-y-0.5 hover:brightness-110 transition-all"
                      >
                        <Sparkles className="h-3 w-3" /> Categorise with AI
                      </button>
                    )}
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
