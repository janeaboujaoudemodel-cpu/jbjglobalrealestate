import { useState } from "react";
import { useHRAnnouncements, useMarkAnnouncementRead } from "@/hooks/useHRAnnouncements";
import { useTeamChannelMessages, useSendChannelMessage } from "@/hooks/useTeamChat";
import { Megaphone, Hash, Pin, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatDisplayDate } from "@/utils/formatDate";

type Tab = "hr" | "team";

export default function BrokerMessages() {
  const [tab, setTab] = useState<Tab>("hr");
  const announcements = useHRAnnouncements();
  const teamMessages = useTeamChannelMessages("team_general");
  const send = useSendChannelMessage();
  const markRead = useMarkAnnouncementRead();
  const [draft, setDraft] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await send.mutateAsync({ channel: "team_general", message: text });
  };

  return (
    <div className="space-y-5 p-4 md:p-6">
      <div className="rounded-2xl bg-[#F7F2EA] border border-[#B89555]/25 p-5 md:p-6">
        <div className="text-[10px] uppercase tracking-[0.22em] text-[#1A1A1A]/55">JBJ GLOBAL REAL ESTATE</div>
        <h1 className="text-2xl md:text-3xl font-semibold text-[#1A1A1A] mt-1">Messages</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">
          HR announcements from the company and live conversation with your team.
        </p>
      </div>

      <nav className="flex flex-wrap gap-1 border-b border-[#B89555]/25">
        {([
          { id: "hr", label: "HR Announcements", icon: Megaphone },
          { id: "team", label: "Team Channel", icon: Hash },
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
                  dangerouslySetInnerHTML={{ __html: a.body_html }}
                />
              </article>
            ))
          )}
        </section>
      )}

      {tab === "team" && (
        <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 flex flex-col" style={{ minHeight: 480 }}>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {teamMessages.isLoading ? (
              <div className="text-sm text-[#1A1A1A]/60">Loading…</div>
            ) : (teamMessages.data ?? []).length === 0 ? (
              <div className="text-sm text-[#1A1A1A]/60 text-center py-10">
                No messages in #general yet. Be the first to say hello.
              </div>
            ) : (
              teamMessages.data!.map((m: any) => (
                <div key={m.id} className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/30 grid place-items-center text-[10px] font-semibold text-[#1A1A1A] shrink-0">
                    {(m.employee_name || "?").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-[#1A1A1A]">{m.employee_name}</span>
                      <span className="text-[11px] text-[#1A1A1A]/55">{formatDisplayDate(m.created_at)}</span>
                    </div>
                    <p className="text-sm text-[#1A1A1A]/85 whitespace-pre-wrap break-words">{m.message}</p>
                  </div>
                </div>
              ))
            )}
          </div>
          <form onSubmit={submit} className="border-t border-[#B89555]/25 p-3 flex gap-2">
            <Input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Message #general…"
              className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
            />
            <Button type="submit" disabled={!draft.trim() || send.isPending} className="bg-[#102540] hover:bg-[#1a3d63] text-white" data-allow-dark-cta>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}
    </div>
  );
}
