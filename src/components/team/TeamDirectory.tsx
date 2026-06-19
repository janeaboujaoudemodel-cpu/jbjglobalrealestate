import { useState, useMemo } from "react";
import { useCompanyDirectory, type DirectoryEntry } from "@/hooks/useCompanyDirectory";
import { useDirectThread, useSendDirectMessage } from "@/hooks/useDirectMessages";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Crown, Search } from "lucide-react";
import { formatDisplayDate } from "@/utils/formatDate";

export default function TeamDirectory() {
  const { user } = useAuth();
  const dir = useCompanyDirectory();
  const [q, setQ] = useState("");
  const [peer, setPeer] = useState<DirectoryEntry | null>(null);

  const entries = useMemo(() => {
    const list = (dir.data ?? []).filter((e) => e.user_id !== user?.id);
    if (!q.trim()) return list;
    const t = q.toLowerCase();
    return list.filter(
      (e) =>
        e.full_name?.toLowerCase().includes(t) ||
        e.title?.toLowerCase().includes(t) ||
        e.department?.toLowerCase().includes(t)
    );
  }, [dir.data, q, user?.id]);

  // auto-select founder by default
  const defaultPeer = peer ?? entries.find((e) => e.is_founder) ?? entries[0] ?? null;

  return (
    <div className="grid md:grid-cols-[280px_1fr] gap-4 min-h-[480px]">
      <aside className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 p-3 space-y-2">
        <div className="relative">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#1A1A1A]/50" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search team…"
            className="pl-7 bg-white border-[#B89555]/30 text-[#1A1A1A] h-9"
          />
        </div>
        <div className="space-y-1 max-h-[440px] overflow-y-auto">
          {dir.isLoading ? (
            <div className="text-xs text-[#1A1A1A]/60 p-2">Loading…</div>
          ) : entries.length === 0 ? (
            <div className="text-xs text-[#1A1A1A]/60 p-2">No teammates yet.</div>
          ) : (
            entries.map((e) => {
              const active = defaultPeer?.user_id === e.user_id;
              return (
                <button
                  key={e.user_id}
                  onClick={() => setPeer(e)}
                  className={`w-full text-left p-2 rounded-lg flex items-center gap-2 transition-colors ${active ? "bg-[#EFE6D6] border border-[#B89555]/45" : "hover:bg-[#EFE6D6]/50 border border-transparent"}`}
                >
                  <div className="h-8 w-8 rounded-full bg-[#EFE6D6] border border-[#B89555]/35 grid place-items-center text-[10px] font-semibold text-[#1A1A1A] shrink-0">
                    {e.avatar_initials || (e.full_name || "JB").slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-[#1A1A1A] truncate flex items-center gap-1">
                      {e.full_name}
                      {e.is_founder && <Crown className="h-3 w-3 text-[#B89555]" />}
                    </div>
                    <div className="text-[11px] text-[#1A1A1A]/65 truncate">{e.title}{e.department ? ` · ${e.department}` : ""}</div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </aside>

      <DirectChatPane peer={defaultPeer} />
    </div>
  );
}

function DirectChatPane({ peer }: { peer: DirectoryEntry | null }) {
  const thread = useDirectThread(peer?.user_id ?? null);
  const send = useSendDirectMessage();
  const { user } = useAuth();
  const [draft, setDraft] = useState("");

  if (!peer) {
    return (
      <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 grid place-items-center text-sm text-[#1A1A1A]/60 min-h-[480px]">
        Pick a teammate to start chatting.
      </section>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    await send.mutateAsync({ recipientUserId: peer.user_id, message: text });
  };

  return (
    <section className="rounded-xl bg-[#F7F2EA] border border-[#B89555]/25 flex flex-col min-h-[480px]">
      <header className="px-4 py-3 border-b border-[#B89555]/25 flex items-center gap-3">
        <div className="h-9 w-9 rounded-full bg-[#EFE6D6] border border-[#B89555]/35 grid place-items-center text-[11px] font-semibold text-[#1A1A1A]">
          {peer.avatar_initials || peer.full_name.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-[#1A1A1A] flex items-center gap-1">
            {peer.full_name}
            {peer.is_founder && <Crown className="h-3.5 w-3.5 text-[#B89555]" />}
          </div>
          <div className="text-[11px] text-[#1A1A1A]/65 truncate">{peer.title}{peer.department ? ` · ${peer.department}` : ""}</div>
        </div>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {thread.isLoading ? (
          <div className="text-xs text-[#1A1A1A]/60">Loading…</div>
        ) : (thread.data ?? []).length === 0 ? (
          <div className="text-xs text-[#1A1A1A]/60 text-center py-10">Say hi to {peer.full_name.split(" ")[0]} — they'll receive your message in-app.</div>
        ) : (
          (thread.data ?? []).map((m: any) => {
            const mine = m.user_id === user?.id;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap break-words ${mine ? "bg-[#0A0A0A] text-white" : "bg-white border border-[#B89555]/25 text-[#1A1A1A]"}`}>
                  {m.message}
                  <div className={`text-[10px] mt-1 ${mine ? "text-white/65" : "text-[#1A1A1A]/55"}`}>{formatDisplayDate(m.created_at)}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form onSubmit={submit} className="border-t border-[#B89555]/25 p-3 flex gap-2">
        <Input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder={`Message ${peer.full_name.split(" ")[0]}…`}
          className="bg-white border-[#B89555]/30 text-[#1A1A1A]"
        />
        <Button type="submit" disabled={!draft.trim() || send.isPending} className="bg-[#0A0A0A] hover:bg-[#1F1F1F] text-white" data-allow-dark-cta>
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </section>
  );
}
