import { useState } from "react";
import DOMPurify from "dompurify";
import { useHRAnnouncements, useMarkAnnouncementRead } from "@/hooks/useHRAnnouncements";
import { Megaphone, Hash, Pin, Inbox } from "lucide-react";
import TeamDirectory from "@/components/team/TeamDirectory";
import BrokerRequestsTab from "@/components/team/BrokerRequestsTab";
import { formatDisplayDate } from "@/utils/formatDate";

type Tab = "team" | "hr" | "requests";

export default function BrokerMessages() {
  const [tab, setTab] = useState<Tab>("team");
  const announcements = useHRAnnouncements();
  const markRead = useMarkAnnouncementRead();

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">JBJ GLOBAL REAL ESTATE</div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1">Messages</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          Direct chat with the JBJ team, HR announcements, and a place to send internal requests.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-[#B89555]/25">
        {([
          { id: "team", label: "Team Channel", icon: Hash },
          { id: "hr", label: "HR Announcements", icon: Megaphone },
          { id: "requests", label: "Requests", icon: Inbox },
        ] as const).map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`px-3 py-2 text-sm rounded-t-md inline-flex items-center gap-2 border-b-2 ${active ? "border-[#B89555] text-[#1A1A1A] bg-[#EFE6D6]/60" : "border-transparent text-[#1A1A1A]/65 hover:text-[#1A1A1A]"}`}
            >
              <Icon className="h-3.5 w-3.5" /> {t.label}
            </button>
          );
        })}
      </nav>

      {tab === "team" && <TeamDirectory />}

      {tab === "hr" && (
        <section className="space-y-3">
          {announcements.isLoading ? (
            <div className="text-sm text-[#1A1A1A]/60">Loading…</div>
          ) : (announcements.data ?? []).length === 0 ? (
            <div className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-8 text-center text-sm text-[#1A1A1A]/70">
              No announcements yet — when the company publishes one it will appear here.
            </div>
          ) : (
            announcements.data!.map((a) => (
              <article
                key={a.id}
                onClick={() => markRead.mutate(a.id)}
                className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-4 hover:border-[#B89555]/55 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2 flex-wrap">
                  {a.pin && <Pin className="h-3.5 w-3.5 text-[#B89555]" />}
                  <span className="text-[10px] uppercase tracking-[0.16em] px-2 py-0.5 rounded bg-[#EFE6D6] border border-[#B89555]/35 text-[#1A1A1A]/75">
                    {a.category}
                  </span>
                  <span className="text-[11px] text-[#1A1A1A]/60">
                    {a.published_at ? formatDisplayDate(a.published_at) : formatDisplayDate(a.created_at)}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-[#1A1A1A] mt-2">{a.title}</h3>
                <div
                  className="text-sm text-[#1A1A1A]/80 mt-2 prose prose-sm max-w-none"
                  // SECURITY: HR announcements are authored in-house but
                  // sanitize defensively to neutralize any stored XSS.
                  dangerouslySetInnerHTML={{
                    __html: DOMPurify.sanitize(a.body_html ?? "", {
                      USE_PROFILES: { html: true },
                      FORBID_TAGS: ["script", "style", "iframe", "object", "embed", "form"],
                      FORBID_ATTR: ["onerror", "onload", "onclick", "onmouseover", "onfocus", "onblur", "formaction"],
                    }),
                  }}
                />
              </article>
            ))
          )}
        </section>
      )}

      {tab === "requests" && <BrokerRequestsTab />}
    </div>
  );
}
