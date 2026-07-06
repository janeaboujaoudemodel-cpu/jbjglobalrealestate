/**
 * Owner Unified Inbox - JBJ Global Real Estate
 * Single inbox merging all communication channels
 */

import { useState, useEffect, type CSSProperties } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import DeveloperActionsRail from "@/components/owner-inbox/DeveloperActionsRail";
import { supabase } from "@/integrations/supabase/client";


import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Mail,
  Instagram,
  Facebook,
  Globe,
  Mic,
  Search,
  Bell,
  Clock,
  CheckCircle,
  AlertTriangle,
  User,
  LinkIcon,
  Plus,
  RefreshCw,
  Sparkles,
} from "lucide-react";
import useOwnerInbox, { 
  CommThread, 
  ThreadStatus, 
  ChannelType,
  InboxFilters 
} from "@/hooks/useOwnerInbox";
import { formatDistanceToNow } from "date-fns";
import OwnerInboxThread from "@/components/owner-inbox/OwnerInboxThread";
import InboxAICommandPanel from "@/components/owner-inbox/InboxAICommandPanel";
import InboxBulkActionsBar from "@/components/owner-inbox/InboxBulkActionsBar";
import { Checkbox } from "@/components/ui/checkbox";
import { CATEGORY_META, clientCategorize } from "@/hooks/useCommAITriage";
import useCommAITriage from "@/hooks/useCommAITriage";

const channelIcons: Record<string, React.ReactNode> = {
  whatsapp: <MessageSquare className="h-4 w-4 text-green-500" />,
  email_gmail: <Mail className="h-4 w-4 text-red-500" />,
  email_hostinger: <Mail className="h-4 w-4 text-blue-500" />,
  instagram: <Instagram className="h-4 w-4 text-pink-500" />,
  facebook: <Facebook className="h-4 w-4 text-blue-600" />,
  website_chat: <Globe className="h-4 w-4 text-[#1A1A1A]" />,
  voice: <Mic className="h-4 w-4 text-purple-500" />,
};

const channelTabs: { value: ChannelType | 'all'; label: string; icon: React.ReactNode }[] = [
  { value: 'all', label: 'All', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'whatsapp', label: 'WhatsApp', icon: <MessageSquare className="h-4 w-4" /> },
  { value: 'email_gmail', label: 'Gmail', icon: <Mail className="h-4 w-4" /> },
  { value: 'email_hostinger', label: 'Hostinger', icon: <Mail className="h-4 w-4" /> },
  { value: 'instagram', label: 'Instagram', icon: <Instagram className="h-4 w-4" /> },
  { value: 'facebook', label: 'Facebook', icon: <Facebook className="h-4 w-4" /> },
  { value: 'website_chat', label: 'Website', icon: <Globe className="h-4 w-4 text-[#1A1A1A]" /> },
  { value: 'voice', label: 'Voice', icon: <Mic className="h-4 w-4" /> },
];

const statusConfig: Record<ThreadStatus, { label: string; color: string; icon: React.ReactNode }> = {
  new: { label: "New", color: "bg-blue-500/10 text-blue-500 border-blue-500/30", icon: <Bell className="h-3 w-3" /> },
  needs_reply: { label: "Needs Reply", color: "bg-red-500/10 text-red-500 border-red-500/30", icon: <AlertTriangle className="h-3 w-3" /> },
  waiting: { label: "Waiting", color: "bg-yellow-500/10 text-yellow-500 border-yellow-500/30", icon: <Clock className="h-3 w-3" /> },
  follow_up_due: { label: "Follow-up Due", color: "bg-orange-500/10 text-orange-500 border-orange-500/30", icon: <Bell className="h-3 w-3" /> },
  closed: { label: "Closed", color: "jj-surface-emerald-soft text-green-500 border-[color:var(--emerald-1)]/30/30", icon: <CheckCircle className="h-3 w-3" /> },
};

type ActiveStatFilter = 'none' | 'unread' | 'needs_reply' | 'new' | 'follow_up_due';

export default function OwnerInbox() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialChannel = (searchParams.get("channel") as ChannelType | null) ?? null;
  const initialChannelId = searchParams.get("channelId");
  const [activeStatFilter, setActiveStatFilter] = useState<ActiveStatFilter>('none');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filters, setFilters] = useState<InboxFilters>({
    status: 'all',
    channel: initialChannel ?? 'all',
    channelId: initialChannelId ?? 'all',
    assistant: 'all',
    search: '',
    unreadOnly: false,
  });
  const [selectedThread, setSelectedThread] = useState<CommThread | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [aiFilterIds, setAiFilterIds] = useState<Set<string> | null>(null);
  const [aiFilterLabel, setAiFilterLabel] = useState<string>("");
  
  const {
    threads,
    channels,
    threadsLoading,
    stats,
    visibleStats,
    perChannelCounts,
    refetchThreads,
    updateThreadStatus,
    markAsRead,
    bulkUpdateAsync,
    isUpdating,
  } = useOwnerInbox(filters);
  const { triage } = useCommAITriage();

  // Background batch triage: classify up to 8 unprocessed threads so category
  // chips populate without manually opening each email.
  useEffect(() => {
    if (!threads.length) return;
    const targets = threads.filter(t => !t.ai_processed_at).slice(0, 8);
    if (!targets.length) return;
    let cancelled = false;
    (async () => {
      for (const t of targets) {
        if (cancelled) break;
        try { await triage.mutateAsync({ threadId: t.id }); } catch { /* skip */ }
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threads.length]);

  // Channel-tab badge helpers — derived from GLOBAL per-channel counts so
  // they stay consistent whether or not the user has applied a status filter.
  const totalUnreadAll = Object.values(perChannelCounts as Record<string, { unread: number }>)
    .reduce((sum, v) => sum + (v?.unread || 0), 0);
  const channelUnreadCounts: Record<string, number> = {};
  for (const [k, v] of Object.entries(perChannelCounts as Record<string, { unread: number }>)) {
    if (k.startsWith('type:')) channelUnreadCounts[k.slice(5)] = v.unread;
  }

  // Select first unread thread on load
  useEffect(() => {
    if (threads.length > 0 && !selectedThread) {
      const firstUnread = threads.find(t => t.unread_count > 0);
      if (firstUnread) {
        setSelectedThread(firstUnread);
      }
    }
  }, [threads, selectedThread]);

  // One-shot Gmail autoconnect on mount, plus background polling every 60s
  // for the active channel scope. Realtime postgres_changes also refetches
  // immediately when new rows arrive — polling is the safety net.
  useEffect(() => {
    let cancelled = false;
    let inFlight = false;
    const runSync = async (scopeChannelId?: string) => {
      if (inFlight) return;
      inFlight = true;
      try {
        const body: { channel_id?: string } = scopeChannelId && scopeChannelId !== 'all'
          ? { channel_id: scopeChannelId }
          : {};
        await supabase.functions.invoke('comm-inbound-sync', { body });
        if (!cancelled) refetchThreads();
      } catch (e) {
        console.warn('[inbox] background sync skipped:', e);
      } finally {
        inFlight = false;
      }
    };
    (async () => {
      try {
        await supabase.functions.invoke('comm-gmail-autoconnect', { body: {} });
      } catch (e) {
        console.warn('[inbox] gmail autoconnect skipped:', e);
      }
      if (cancelled) return;
      // First sync ~1.5s after mount (don't block initial paint)
      setTimeout(() => { if (!cancelled) runSync(filters.channelId); }, 1500);
      refetchThreads();
    })();
    // Phase H — Gmail-modify reflection: 15s poll (was 60s)
    const poll = setInterval(() => {
      if (!cancelled && document.visibilityState === 'visible') runSync(filters.channelId);
    }, 15_000);
    // Refresh on tab focus / network reconnect so Gmail changes reflect instantly
    const onFocus = () => { if (!cancelled) runSync(filters.channelId); };
    const onVisible = () => { if (!cancelled && document.visibilityState === 'visible') runSync(filters.channelId); };
    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      clearInterval(poll);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
      document.removeEventListener('visibilitychange', onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.channelId]);



  const handleThreadSelect = (thread: CommThread) => {
    setSelectedThread(thread);
    if (thread.unread_count > 0) {
      markAsRead(thread.id);
    }
  };

  const handleStatCardClick = (filter: ActiveStatFilter) => {
    if (activeStatFilter === filter) {
      // Toggle off
      setActiveStatFilter('none');
      setFilters(prev => ({ ...prev, status: 'all', unreadOnly: false }));
    } else {
      setActiveStatFilter(filter);
      switch (filter) {
        case 'unread':
          setFilters(prev => ({ ...prev, status: 'all', unreadOnly: true }));
          break;
        case 'needs_reply':
          setFilters(prev => ({ ...prev, status: 'needs_reply', unreadOnly: false }));
          break;
        case 'new':
          setFilters(prev => ({ ...prev, status: 'new', unreadOnly: false }));
          break;
        case 'follow_up_due':
          setFilters(prev => ({ ...prev, status: 'follow_up_due', unreadOnly: false }));
          break;
      }
    }
  };

  const handleChannelTabClick = (channel: ChannelType | 'all', channelId: string | 'all' = 'all') => {
    setFilters(prev => ({ ...prev, channel, channelId }));
  };

  // Build per-Gmail-account tabs so each connected Gmail keeps its own inbox section.
  const gmailChannels = channels.filter(c => c.channel_type === 'email_gmail');
  const dynamicChannelTabs = (() => {
    if (gmailChannels.length <= 1) return channelTabs;
    // Replace the single 'Gmail' tab with one tab per connected Gmail account.
    const idx = channelTabs.findIndex(t => t.value === 'email_gmail');
    const before = channelTabs.slice(0, idx);
    const after = channelTabs.slice(idx + 1);
    const perAccount = gmailChannels.map(ch => {
      const localPart = (ch.identifier || '').split('@')[0] || ch.display_name || 'account';
      return {
        value: 'email_gmail' as const,
        channelId: ch.id,
        label: `Gmail · ${localPart}`,
        icon: <Mail className="h-4 w-4 text-red-500" />,
      };
    });
    return [...before, ...perAccount, ...after] as Array<{
      value: ChannelType | 'all';
      channelId?: string;
      label: string;
      icon: React.ReactNode;
    }>;
  })();

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] overflow-x-hidden">
        <div className="container mx-auto px-4 py-6 max-w-6xl" data-owner-batch-fix="inbox">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 bg-[#FDFBF7]/80 backdrop-blur-sm border border-[#B89555]/20 rounded-2xl p-4 shadow-sm">
              <div className="flex items-center gap-4 min-w-0">
                <div className="p-3 rounded-xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-[#B89555]/30">
                  <MessageSquare className="h-6 w-6 text-[#1A1A1A]" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1A1A1A]">Unified Inbox</h1>
                  <p className="text-[#1A1A1A]/70 text-sm">Jane Bou Jaoude — All communications in one place</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2 flex-wrap justify-end">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={async () => {
                    // Scope sync to the active channel when one is selected so
                    // Refresh is fast and never times out.
                    const body: { channel_id?: string } = filters.channelId && filters.channelId !== "all"
                      ? { channel_id: filters.channelId }
                      : {};
                    try { await supabase.functions.invoke("comm-gmail-autoconnect", { body: {} }); } catch { /* noop */ }
                    try { await supabase.functions.invoke("comm-inbound-sync", { body }); } catch { /* noop */ }
                    refetchThreads();
                  }}
                  disabled={threadsLoading}
                  className="border-[#B89555]/30 whitespace-nowrap min-w-[112px]"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${threadsLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/owner/settings/communication')}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Connect Channel
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards with Active 3D States */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
            <StatsCard label="Total" value={stats.total} icon={<MessageSquare className="h-4 w-4" />} isActive={false} onClick={() => {}} />
            <StatsCard label="Unread" value={stats.unread} icon={<Bell className="h-4 w-4" />} variant="warning" isActive={activeStatFilter === 'unread'} onClick={() => handleStatCardClick('unread')} />
            <StatsCard label="Needs Reply" value={stats.needsReply} icon={<AlertTriangle className="h-4 w-4" />} variant="danger" isActive={activeStatFilter === 'needs_reply'} onClick={() => handleStatCardClick('needs_reply')} />
            <StatsCard label="New" value={stats.new} icon={<Sparkles className="h-4 w-4" />} variant="info" isActive={activeStatFilter === 'new'} onClick={() => handleStatCardClick('new')} />
            <StatsCard label="Follow-up Due" value={stats.followUpDue} icon={<Clock className="h-4 w-4" />} variant="orange" isActive={activeStatFilter === 'follow_up_due'} onClick={() => handleStatCardClick('follow_up_due')} />
          </div>

          {/* Channel Tabs - Header Bar with Badges */}
          <div className="flex items-center gap-1 mb-4 overflow-x-auto pb-1 border-b-2 border-[#B89555]/10 scrollbar-thin max-w-full">
            {dynamicChannelTabs.map((tab) => {
              const tabChannelId = (tab as { channelId?: string }).channelId;
              const isActive = tabChannelId
                ? filters.channelId === tabChannelId
                : filters.channel === tab.value && (filters.channelId === 'all' || !filters.channelId);
              const unreadCount = tabChannelId
                ? (perChannelCounts[`id:${tabChannelId}`]?.unread ?? 0)
                : tab.value === 'all'
                  ? totalUnreadAll
                  : (channelUnreadCounts[tab.value] || 0);
              return (
                <button
                  key={`${tab.value}-${tabChannelId ?? 'all'}`}
                  onClick={() => handleChannelTabClick(tab.value, tabChannelId ?? 'all')}
                  data-emerald-action={isActive ? "true" : undefined}
                  data-emerald-ok={isActive ? "pill" : undefined}
                  style={isActive ? {
                    color: '#FFFFFF',
                    WebkitTextFillColor: '#FFFFFF',
                    transitionProperty: 'background, background-color, border-color, box-shadow, transform',
                  } as CSSProperties : undefined}
                  className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap duration-200 border-b-2 -mb-[2px] rounded-t-lg flex-shrink-0 ${
 isActive
 ? 'jj-emerald-action border-transparent !text-white font-bold shadow-sm [&_*]:!text-white'
 : 'transition-all border-transparent text-[#1A1A1A]/70 hover:text-[#1A1A1A] hover:bg-[#EFE6D6]/20'
 }`}
                >
                  {tab.icon}
                  <span style={isActive ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } as CSSProperties : undefined}>{tab.label}</span>
                  {unreadCount > 0 && (
                    <span style={isActive ? { color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' } as CSSProperties : undefined} className={`ml-1 min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center ${
 isActive ? 'bg-white/20 !text-white border border-white/80' : 'bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/25'
 }`}>
                      {unreadCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Search & Status Filters */}
          <div className="flex flex-wrap items-center gap-3 mb-3">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/70" />
              <Input
                placeholder="Search contacts..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className="pl-10 border-[#B89555]/30"
              />
            </div>
            {(activeStatFilter !== 'none' || categoryFilter !== 'all') && (
              <span className="text-xs text-[#1A1A1A]/60">
                Showing {visibleStats.total} of {stats.total}
              </span>
            )}
          </div>

          {/* AI Category Filter */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-thin max-w-full">
            <button
              onClick={() => setCategoryFilter('all')}
              data-emerald-action={categoryFilter === 'all' ? "true" : undefined}
              data-emerald-ok={categoryFilter === 'all' ? "pill" : undefined}
              data-inbox-category-pill={categoryFilter === 'all' ? "active" : "idle"}
              style={categoryFilter === 'all'
                ? { background: 'var(--jj-emerald-ombre)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', borderColor: 'transparent', transitionProperty: 'background, background-color, border-color, box-shadow, transform' } as CSSProperties
                : { background: '#FDFBF7', backgroundImage: 'none', color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A', borderColor: 'rgba(184,149,85,0.35)' } as CSSProperties}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
 categoryFilter === 'all'
 ? 'jj-emerald-action !text-white border-transparent [&_*]:!text-white'
 : 'transition bg-transparent text-[#1A1A1A]/70 border-[#B89555]/20 hover:bg-[#EFE6D6]/30'
 }`}
            >All categories</button>
            {Object.entries(CATEGORY_META).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategoryFilter(key)}
                data-emerald-action={categoryFilter === key ? "true" : undefined}
                data-emerald-ok={categoryFilter === key ? "pill" : undefined}
                data-inbox-category-pill={categoryFilter === key ? "active" : "idle"}
                style={categoryFilter === key
                  ? { background: 'var(--jj-emerald-ombre)', color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', borderColor: 'transparent', transitionProperty: 'background, background-color, border-color, box-shadow, transform' } as CSSProperties
                  : { background: '#FDFBF7', backgroundImage: 'none', color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A', borderColor: 'rgba(184,149,85,0.35)' } as CSSProperties}
                className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${
 categoryFilter === key
 ? 'jj-emerald-action !text-white border-transparent [&_*]:!text-white'
 : 'transition bg-transparent text-[#1A1A1A]/70 border-[#B89555]/20 hover:bg-[#EFE6D6]/30'
 }`}
              >{meta.label}</button>
            ))}
          </div>

          {/* Developer Required Actions Rail */}
          <div className="mb-4">
            <DeveloperActionsRail />
          </div>

          {/* AI Command + AI filter chip */}
          <div className="mb-3 flex items-center gap-2 flex-wrap">
            <InboxAICommandPanel
              threads={threads}
              selectedIds={Array.from(selectedIds)}
              onApplyFilter={(ids, label) => { setAiFilterIds(new Set(ids)); setAiFilterLabel(label); }}
              onBulkMarkRead={async (ids) => { await bulkUpdateAsync({ threadIds: ids, patch: { unread_count: 0 } }); }}
              onBulkSetStatus={async (ids, status) => { await bulkUpdateAsync({ threadIds: ids, patch: { status } }); }}
            />
            {aiFilterIds && (
              <button
                onClick={() => { setAiFilterIds(null); setAiFilterLabel(""); }}
                className="text-xs px-2 py-1 rounded-full bg-[#EFE6D6] border border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/70"
              >AI filter: {aiFilterLabel || `${aiFilterIds.size} matches`} · clear</button>
            )}
          </div>

          {/* Bulk action toolbar (visible when threads selected) */}
          <InboxBulkActionsBar
            selectedCount={selectedIds.size}
            onClear={() => setSelectedIds(new Set())}
            onMarkRead={async () => {
              await bulkUpdateAsync({ threadIds: Array.from(selectedIds), patch: { unread_count: 0 } });
              setSelectedIds(new Set());
            }}
            onSetStatus={async (status) => {
              await bulkUpdateAsync({ threadIds: Array.from(selectedIds), patch: { status } });
              setSelectedIds(new Set());
            }}
            disabled={isUpdating}
          />

          {/* Main Content - Split View */}
          <div className="grid grid-cols-1 2xl:grid-cols-[minmax(300px,420px)_minmax(0,1fr)] gap-4 min-h-[640px] max-w-full" style={{ height: 'min(calc(100vh - 300px), 980px)' }}>
            {/* Thread List */}
            <div className="min-h-0 min-w-0 overflow-hidden">
              <Card className="border border-[#B89555]/20 bg-[#FDFBF7]/90 backdrop-blur-sm h-full overflow-hidden shadow-sm">
                <ScrollArea className="h-full">
                  {threadsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="flex items-start gap-3 p-3">
                          <Skeleton className="h-10 w-10 rounded-full" />
                          <div className="flex-1 space-y-2">
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-3 w-full" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : threads.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                      <MessageSquare className="h-12 w-12 text-[#1A1A1A]/70 mb-4" />
                      <p className="text-[#1A1A1A]/70 font-medium">No conversations yet</p>
                      <p className="text-[#1A1A1A]/70 text-sm mt-1">Connect channels to start receiving messages</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gold/10">
                      {threads
                        .filter(t => categoryFilter === 'all' || clientCategorize(t) === categoryFilter)
                        .filter(t => !aiFilterIds || aiFilterIds.has(t.id))
                        .map((thread) => (
                        <ThreadListItem
                          key={thread.id}
                          thread={thread}
                          isSelected={selectedThread?.id === thread.id}
                          isChecked={selectedIds.has(thread.id)}
                          onToggleCheck={() => {
                            setSelectedIds(prev => {
                              const next = new Set(prev);
                              if (next.has(thread.id)) next.delete(thread.id); else next.add(thread.id);
                              return next;
                            });
                          }}
                          onClick={() => handleThreadSelect(thread)}
                        />
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </Card>
            </div>

            {/* Thread Detail */}
            <div className="min-h-0 min-w-0 overflow-hidden">
              {selectedThread ? (
                <OwnerInboxThread
                  thread={selectedThread}
                  onStatusChange={(status) => updateThreadStatus({ threadId: selectedThread.id, status })}
                  onClose={() => setSelectedThread(null)}
                />
              ) : (
                <Card className="border border-[#B89555]/20 bg-[#FDFBF7]/90 backdrop-blur-sm h-full flex items-center justify-center shadow-sm">
                  <div className="text-center p-8">
                    <MessageSquare className="h-16 w-16 text-[#1A1A1A]/70 mx-auto mb-4" />
                    <p className="text-[#1A1A1A]/70 font-medium">Select a conversation</p>
                    <p className="text-[#1A1A1A]/70 text-sm mt-1">Choose a thread from the list to view messages</p>
                  </div>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Stats Card Component with Active 3D State
function StatsCard({ 
  label, 
  value, 
  icon, 
  variant = 'default',
  isActive,
  onClick,
}: { 
  label: string; 
  value: number; 
  icon: React.ReactNode;
  variant?: 'default' | 'warning' | 'danger' | 'info' | 'orange';
  isActive: boolean;
  onClick: () => void;
}) {
  const baseVariants = {
    default: "border-[#B89555]/30 bg-[#FDFBF7]",
    warning: "border-yellow-500/30 bg-yellow-50",
    danger: "border-red-500/30 bg-red-50",
    info: "border-blue-500/30 bg-blue-50",
    orange: "border-orange-500/30 bg-orange-50",
  };

  const activeVariants = {
    default: "border-[#B89555] bg-[#EFE6D6]/15 shadow-[0_4px_16px_rgba(200,167,102,0.4)] scale-[1.03]",
    warning: "border-yellow-500 bg-yellow-100 shadow-[0_4px_16px_rgba(234,179,8,0.4)] scale-[1.03]",
    danger: "border-red-500 bg-red-100 shadow-[0_4px_16px_rgba(239,68,68,0.4)] scale-[1.03]",
    info: "border-blue-500 bg-blue-100 shadow-[0_4px_16px_rgba(184,149,85,0.4)] scale-[1.03]",
    orange: "border-orange-500 bg-orange-100 shadow-[0_4px_16px_rgba(249,115,22,0.4)] scale-[1.03]",
  };

  const iconColors = {
    default: "text-[#1A1A1A]",
    warning: "text-yellow-600",
    danger: "text-red-600",
    info: "text-blue-600",
    orange: "text-orange-600",
  };

  const isClickable = variant !== 'default';

  return (
    <Card 
      className={`${isActive ? activeVariants[variant] : baseVariants[variant]} border-2 transition-all duration-300 ${
 isClickable ? 'cursor-pointer hover:scale-[1.02]' : ''
 }`}
      onClick={isClickable ? onClick : undefined}
    >
      <CardContent className="p-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-[#1A1A1A]/70">{label}</p>
            <p className="text-xl font-bold text-[#1A1A1A]">{value}</p>
          </div>
          <div className={`p-2 rounded-lg bg-[#FDFBF7]/50 ${iconColors[variant]}`}>
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Thread List Item Component
function ThreadListItem({
  thread,
  isSelected,
  isChecked,
  onToggleCheck,
  onClick,
}: {
  thread: CommThread;
  isSelected: boolean;
  isChecked?: boolean;
  onToggleCheck?: () => void;
  onClick: () => void;
}) {
  const status = statusConfig[thread.status];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`p-3 cursor-pointer transition-all hover:bg-[#EFE6D6]/5 ${
 isSelected ? 'bg-[#EFE6D6]/10 border-l-4 border-l-gold' : ''
 } ${isChecked ? 'bg-[#EFE6D6]/30' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-start gap-3">
        {onToggleCheck && (
          <div onClick={(e) => { e.stopPropagation(); onToggleCheck(); }} className="pt-2">
            <Checkbox checked={!!isChecked} className="h-4 w-4" />
          </div>
        )}
        <div className="relative">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-gold/20 to-gold/5 flex items-center justify-center border border-[#B89555]/20">
            {thread.contact_avatar_url ? (
              <img src={thread.contact_avatar_url} alt="" className="w-full h-full rounded-full object-cover"  loading="lazy" decoding="async" />
            ) : (
              <User className="h-5 w-5 text-[#1A1A1A]" />
            )}
          </div>
          <div className="absolute -bottom-1 -right-1 p-0.5 bg-[#FDFBF7] rounded-full">
            {channelIcons[thread.channel_type] || <Globe className="h-3 w-3" />}
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <span className="font-medium text-[#1A1A1A] truncate">
              {thread.contact_name || thread.contact_identifier}
            </span>
            {thread.unread_count > 0 && (
              <span className="flex-shrink-0 w-5 h-5 rounded-full bg-[#EFE6D6] text-[#1A1A1A] text-xs font-bold flex items-center justify-center">
                {thread.unread_count}
              </span>
            )}
          </div>
          
          <p className="text-sm text-[#1A1A1A]/70 truncate mt-0.5">
            {thread.last_message_preview || 'No messages yet'}
          </p>

          <div className="flex items-center justify-between mt-2 gap-2">
            <div className="flex items-center gap-1 flex-wrap">
              <Badge className={`text-[10px] px-1.5 py-0.5 border ${status.color}`}>
                {status.icon}
                <span className="ml-1">{status.label}</span>
              </Badge>
              {(() => {
                const cat = clientCategorize(thread);
                return CATEGORY_META[cat] ? (
                  <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${CATEGORY_META[cat].color}`}>
                    {CATEGORY_META[cat].label}
                  </Badge>
                ) : null;
              })()}
            </div>
            {thread.last_message_at && (
              <span className="text-[10px] text-[#1A1A1A]/70 shrink-0">
                {formatDistanceToNow(new Date(thread.last_message_at), { addSuffix: true })}
              </span>
            )}
          </div>

          {thread.lead && (
            <div className="flex items-center gap-1 mt-1.5 text-[10px] text-[color:var(--emerald-1)]">
              <LinkIcon className="h-3 w-3" />
              <span className="truncate">{thread.lead.full_name}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}