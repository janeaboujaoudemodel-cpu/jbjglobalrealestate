import { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  History,
  Plus,
  Search,
  X,
  MessageCircle,
  Loader2,
  Sparkle,
  ArrowRight,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { ChatHistoryItem, SERVICES, getTimeAgo } from "./types";
import ChatAuroraBackground from "./ChatAuroraBackground";

interface ChatThreadsPanelProps {
  open: boolean;
  threads: ChatHistoryItem[];
  isLoading: boolean;
  activeThreadId: string | null;
  onClose: () => void;
  onNewThread: () => void;
  onResumeThread: (thread: ChatHistoryItem) => void;
  onRefresh?: () => void;
}

/** Human title for a thread — first thing the visitor actually said. */
export const threadTitle = (thread: ChatHistoryItem): string => {
  const firstUser = thread.messages?.find((m) => m.role === "user")?.content?.trim();
  if (firstUser) {
    const oneLine = firstUser.replace(/\s+/g, " ");
    return oneLine.length > 52 ? `${oneLine.slice(0, 52)}…` : oneLine;
  }
  return SERVICES.find((s) => s.id === thread.service_type)?.label || "General enquiry";
};

const threadPreview = (thread: ChatHistoryItem): string => {
  const last = thread.messages?.[thread.messages.length - 1]?.content?.trim();
  if (!last) return "No messages yet";
  const oneLine = last.replace(/\s+/g, " ");
  return oneLine.length > 88 ? `${oneLine.slice(0, 88)}…` : oneLine;
};

const dayLabel = (date: Date): string => {
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  const ts = date.getTime();
  if (ts >= startOfToday) return "Today";
  if (ts >= startOfToday - 86400000) return "Yesterday";
  if (ts >= startOfToday - 7 * 86400000) return "Earlier this week";
  if (ts >= startOfToday - 30 * 86400000) return "This month";
  return "Older";
};

const ChatThreadsPanel = ({
  open,
  threads,
  isLoading,
  activeThreadId,
  onClose,
  onNewThread,
  onResumeThread,
  onRefresh,
}: ChatThreadsPanelProps) => {
  const [search, setSearch] = useState("");

  const groups = useMemo(() => {
    const q = search.trim().toLowerCase();
    const filtered = threads.filter((t) => {
      if (!q) return true;
      const serviceName = SERVICES.find((s) => s.id === t.service_type)?.label || "General";
      return (
        threadTitle(t).toLowerCase().includes(q) ||
        serviceName.toLowerCase().includes(q) ||
        (t.status || "").toLowerCase().includes(q) ||
        (t.messages || []).some((m) => m.content.toLowerCase().includes(q))
      );
    });

    const buckets = new Map<string, ChatHistoryItem[]>();
    filtered.forEach((t) => {
      const label = dayLabel(new Date(t.updated_at));
      const list = buckets.get(label) ?? [];
      list.push(t);
      buckets.set(label, list);
    });
    return Array.from(buckets.entries());
  }, [threads, search]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          key="jbj-chat-threads"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: "spring", damping: 26, stiffness: 280 }}
          className="absolute inset-0 z-30 flex min-h-0 flex-col overflow-hidden"
          style={{
            background:
              "linear-gradient(180deg, rgba(255,255,255,0.97) 0%, rgba(247,242,234,0.95) 50%, rgba(239,230,214,0.97) 100%)",
            backdropFilter: "blur(18px) saturate(150%)",
            WebkitBackdropFilter: "blur(18px) saturate(150%)",
          }}
        >
          <ChatAuroraBackground />

          {/* Header */}
          <div className="relative z-10 shrink-0 border-b border-[#B89555]/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <div className="jbj-chat-pulse-ring flex h-9 w-9 items-center justify-center rounded-full border border-[#B89555]/60 bg-[#FDFBF7]">
                <History className="h-4 w-4 text-[#1A1A1A]" />
              </div>
              <div className="min-w-0 flex-1">
                <h4 className="text-sm font-bold text-[#1A1A1A]">Your conversations</h4>
                <p className="text-[11px] text-[#1A1A1A]/70">
                  Resume any recent thread — titles, timestamps and full context restored
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#B89555]/60 bg-[#FDFBF7] text-[#1A1A1A] transition-colors hover:bg-[#EFE6D6]/60"
                aria-label="Close conversation list"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-4">
            <button
              type="button"
              onClick={onNewThread}
              className="group mb-4 flex w-full items-center gap-3 rounded-2xl border border-[#B89555]/45 bg-gradient-to-r from-[#FDFBF7] to-[#EFE6D6]/70 p-4 text-left shadow-[0_10px_24px_-18px_rgba(26,26,26,0.45)] transition-all hover:border-[#B89555] hover:shadow-[0_14px_30px_-18px_rgba(26,26,26,0.5)]"
            >
              <span className="flex h-10 w-10 items-center justify-center rounded-full border border-[#B89555]/50 bg-[#FDFBF7]">
                <Plus className="h-5 w-5 text-[#1A1A1A]" />
              </span>
              <span className="flex-1">
                <span className="block text-sm font-semibold text-[#1A1A1A]">Start a new conversation</span>
                <span className="block text-[11px] text-[#1A1A1A]/70">
                  AI concierge, instant answers, human handover any time
                </span>
              </span>
              <ArrowRight className="h-4 w-4 text-[#1A1A1A] transition-transform group-hover:translate-x-0.5" />
            </button>

            {threads.length > 3 && (
              <div className="relative mb-3">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#1A1A1A]/60" />
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search your conversations…"
                  className="h-9 border-[#B89555]/40 bg-[#FDFBF7]/80 pl-9 text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#1A1A1A]/60 hover:text-[#1A1A1A]"
                    aria-label="Clear search"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}

            {isLoading ? (
              <div className="space-y-2">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="h-20 animate-pulse rounded-xl border border-[#B89555]/25 bg-[#FDFBF7]/70"
                  />
                ))}
                <div className="flex items-center justify-center gap-2 pt-2 text-xs text-[#1A1A1A]/70">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" /> Loading your threads…
                </div>
              </div>
            ) : groups.length === 0 ? (
              <div className="rounded-2xl border border-[#B89555]/30 bg-[#FDFBF7]/80 p-8 text-center">
                <MessageCircle className="mx-auto mb-3 h-6 w-6 text-[#1A1A1A]/60" />
                <p className="text-sm text-[#1A1A1A]">
                  {search ? "No conversations match that search" : "No previous conversations yet"}
                </p>
                <p className="mt-1 text-xs text-[#1A1A1A]/70">
                  Start one above — everything you send is saved so you can pick it up later.
                </p>
                {onRefresh && !search && (
                  <button
                    type="button"
                    onClick={onRefresh}
                    className="mt-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#1A1A1A] underline decoration-[#B89555] underline-offset-4"
                  >
                    Refresh
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {groups.map(([label, items]) => (
                  <section key={label}>
                    <p className="mb-2 flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#1A1A1A]/65">
                      <Clock className="h-3 w-3" /> {label}
                    </p>
                    <div className="space-y-2">
                      {items.map((thread, index) => {
                        const service = SERVICES.find((s) => s.id === thread.service_type);
                        const ServiceIcon = service?.icon || MessageCircle;
                        const updatedAt = new Date(thread.updated_at);
                        const isActive = thread.id === activeThreadId;

                        return (
                          <motion.button
                            key={thread.id}
                            type="button"
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: Math.min(index * 0.04, 0.24) }}
                            onClick={() => onResumeThread(thread)}
                            className={`w-full rounded-xl border p-3 text-left transition-all ${
                              isActive
                                ? "border-[#B89555] bg-[#EFE6D6]/70 shadow-[0_10px_24px_-18px_rgba(26,26,26,0.5)]"
                                : "border-[#B89555]/30 bg-[#FDFBF7]/85 hover:border-[#B89555]/70 hover:bg-[#FDFBF7]"
                            }`}
                          >
                            <div className="flex items-start gap-3">
                              <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[#B89555]/40 bg-[#FDFBF7]">
                                <ServiceIcon className="h-4 w-4 text-[#1A1A1A]" />
                              </span>
                              <span className="min-w-0 flex-1">
                                <span className="flex items-baseline justify-between gap-2">
                                  <span className="truncate text-sm font-semibold text-[#1A1A1A]">
                                    {threadTitle(thread)}
                                  </span>
                                  <span className="shrink-0 text-[10px] text-[#1A1A1A]/65">
                                    {getTimeAgo(updatedAt)}
                                  </span>
                                </span>
                                <span className="mt-1 block text-xs leading-snug text-[#1A1A1A]/75">
                                  {threadPreview(thread)}
                                </span>
                                <span className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-[#1A1A1A]/70">
                                  <span className="rounded border border-[#B89555]/35 bg-[#EFE6D6]/60 px-1.5 py-0.5 font-medium text-[#1A1A1A]">
                                    {service?.label || "General"}
                                  </span>
                                  <span>{thread.messages?.length || 0} messages</span>
                                  <span className="text-[#1A1A1A]/60">
                                    {updatedAt.toLocaleString(undefined, {
                                      day: "numeric",
                                      month: "short",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                  {isActive && (
                                    <span className="inline-flex items-center gap-1 font-semibold text-[#1A1A1A]">
                                      <Sparkle className="h-3 w-3" /> Current
                                    </span>
                                  )}
                                </span>
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ChatThreadsPanel;
