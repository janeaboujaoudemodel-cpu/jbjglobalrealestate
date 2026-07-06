import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  CheckSquare,
  Users,
  FileEdit,
  Wrench,
  Bell,
  Loader2,
  Flame,
  Activity,
  Video,
  Zap,
  Heart,
  Network,
  Brain,
  Search,
  StickyNote,
  Scale,
  ChevronDown,
  History,
  Plus,
  Save,
} from "lucide-react";
import FoundersChatPanel from "@/components/founders-assistant/FoundersChatPanel";
import FoundersTaskDashboard from "@/components/founders-assistant/FoundersTaskDashboard";
import FoundersTeamDirectory from "@/components/founders-assistant/FoundersTeamDirectory";
import FoundersDraftsPanel from "@/components/founders-assistant/FoundersDraftsPanel";
import FoundersAIToolsPanel from "@/components/founders-assistant/FoundersAIToolsPanel";
import FoundersNotificationCenter from "@/components/founders-assistant/FoundersNotificationCenter";
import FoundersHotLeadsPanel from "@/components/founders-assistant/FoundersHotLeadsPanel";
import FoundersActivityCenter from "@/components/founders-assistant/FoundersActivityCenter";
import FoundersVideoMeetPanel from "@/components/founders-assistant/FoundersVideoMeetPanel";
import FoundersEscalationsPanel from "@/components/founders-assistant/FoundersEscalationsPanel";
import FoundersEmotionAnalyticsPanel from "@/components/founders-assistant/FoundersEmotionAnalyticsPanel";
import FoundersCollaborationPanel from "@/components/founders-assistant/FoundersCollaborationPanel";
import FoundersInsightsPanel from "@/components/founders-assistant/FoundersInsightsPanel";
import FoundersNotesPanel from "@/components/founders-assistant/FoundersNotesPanel";
import { FoundersDecisionPanel } from "@/components/founders-assistant/FoundersDecisionPanel";
import { EscalationAlertButton } from "@/components/ai/EscalationAlertButton";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import amandaPortrait from "@/assets/team/amanda-clarke-executive-assistant.png";

// Tools organized by category
const TOOL_CATEGORIES = [
  {
    label: "AI Tools",
    items: [
      { value: 'ai-tools', icon: Wrench, label: 'AI Tools Hub' },
      { value: 'insights', icon: Brain, label: 'AI Insights' },
      { value: 'analytics', icon: Heart, label: 'Emotion Analytics' },
      { value: 'decisions', icon: Scale, label: 'Decision Engine' },
    ],
  },
  {
    label: "Workflow",
    items: [
      { value: 'tasks', icon: CheckSquare, label: 'Tasks' },
      { value: 'drafts', icon: FileEdit, label: 'Drafts' },
      { value: 'notes', icon: StickyNote, label: 'Notes' },
    ],
  },
  {
    label: "Communication",
    items: [
      { value: 'team', icon: Users, label: 'Team Directory' },
      { value: 'video-meet', icon: Video, label: 'Video Meet' },
      { value: 'collaboration', icon: Network, label: 'Collaboration' },
    ],
  },
  {
    label: "Activity & CRM",
    items: [
      { value: 'hot-leads', icon: Flame, label: 'Hot Leads' },
      { value: 'activity', icon: Activity, label: 'Activity Center' },
      { value: 'escalations', icon: Zap, label: 'Escalations' },
    ],
  },
];

export default function FoundersAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'assistant' | string>("assistant");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string | null>(null);
  const [chatSessionCount, setChatSessionCount] = useState(3);
  const [stats, setStats] = useState({
    activeTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    awaitingApproval: 0,
  });

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchStats();
      const channel = supabase
        .channel('founder-notifications')
        .on('postgres_changes', {
          event: '*',
          schema: 'public',
          table: 'assistant_communications',
        }, () => {
          fetchStats();
        })
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setShowCommandPalette(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  const fetchStats = async () => {
    try {
      const { data: tasks } = await supabase
        .from("assistant_tasks")
        .select("status")
        .eq("user_id", user?.id);

      if (tasks) {
        setStats({
          activeTasks: tasks.filter(t => t.status === 'in_progress').length,
          pendingTasks: tasks.filter(t => t.status === 'pending').length,
          completedTasks: tasks.filter(t => t.status === 'completed').length,
          awaitingApproval: tasks.filter(t => t.status === 'awaiting_approval').length,
        });
      }

      const { data: unread } = await supabase
        .from("assistant_communications")
        .select("id", { count: 'exact' })
        .eq("user_id", user?.id)
        .eq("is_read", false);

      setUnreadCount(unread?.length || 0);
    } catch (error) {
      console.error("Error fetching stats:", error);
    }
  };

  const handleStatClick = (filterStatus: string) => {
    setTaskFilterStatus(filterStatus);
    setActiveView('tasks');
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]">
        <Loader2 className="h-8 w-8 animate-spin text-[#1A1A1A]" />
      </div>
    );
  }

  const renderActiveView = () => {
    switch (activeView) {
      case 'assistant':
        return <FoundersChatPanel userName={user?.email?.split('@')[0]} fullScreen />;
      case 'tasks':
        return <FoundersTaskDashboard onStatsChange={fetchStats} initialFilter={taskFilterStatus} />;
      case 'team':
        return <FoundersTeamDirectory />;
      case 'drafts':
        return <FoundersDraftsPanel />;
      case 'ai-tools':
        return <FoundersAIToolsPanel />;
      case 'hot-leads':
        return <FoundersHotLeadsPanel />;
      case 'activity':
        return <FoundersActivityCenter />;
      case 'video-meet':
        return <FoundersVideoMeetPanel />;
      case 'escalations':
        return <FoundersEscalationsPanel />;
      case 'analytics':
        return <FoundersEmotionAnalyticsPanel />;
      case 'collaboration':
        return <FoundersCollaborationPanel />;
      case 'insights':
        return <FoundersInsightsPanel />;
      case 'notes':
        return <FoundersNotesPanel />;
      case 'decisions':
        return <FoundersDecisionPanel />;
      default:
        return <FoundersChatPanel userName={user?.email?.split('@')[0]} fullScreen />;
    }
  };

  const statCards = [
    { label: 'Active', count: stats.activeTasks, colorClass: 'bg-[#EFE6D6]/15 text-[#1A1A1A] border-[#B89555]/30', filter: 'in_progress' },
    { label: 'Done', count: stats.completedTasks, colorClass: 'jj-emerald-metallic allow-white text-white border-transparent', filter: 'completed' },
    { label: 'Pending', count: stats.pendingTasks, colorClass: 'bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30', filter: 'pending' },
    { label: 'Escalations', count: unreadCount, colorClass: 'bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30', filter: 'escalations' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6]" data-owner-batch-fix="founder-assistant">
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      <div className="flex flex-col h-screen">
        {/* Amanda header bar — with proper padding from parent shell */}
        <div className="flex-shrink-0 bg-[#FDFBF7]/80 backdrop-blur-sm border-b-2 border-[#B89555]/30 px-4 py-3 mt-1">
          <div className="grid grid-cols-1 xl:grid-cols-[minmax(180px,260px)_minmax(0,1fr)_auto] items-center gap-3 min-w-0">
            {/* Left: Amanda identity */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setActiveView('assistant')}
                className="flex items-center gap-2.5 hover:opacity-80 transition-opacity"
              >
                <div className="relative w-10 h-10 rounded-full border-2 border-[#B89555]/50 overflow-hidden">
                  <img src={amandaPortrait} alt="Amanda Clarke" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                  <span className="absolute bottom-0 right-0 w-2.5 h-2.5 jj-surface-emerald border-2 border-white rounded-full" />
                </div>
              <div className="hidden lg:block min-w-0">
                  <h1 className="text-sm font-bold text-foreground leading-tight">Amanda Clarke</h1>
                  <p className="text-[10px] text-muted-foreground">Executive Assistant • Online</p>
                </div>
              </button>
            </div>

            {/* Center: Action buttons row — New Chat, History, Save, Tools */}
            <div className="flex items-center gap-1.5 min-w-0 overflow-x-auto px-1 jj-scrollbar-gold">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setActiveView('assistant')}
                className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-[#EFE6D6]/10"
              >
                <Plus className="w-3.5 h-3.5" />
                <span className="hidden xl:inline whitespace-nowrap">New Chat</span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-[#EFE6D6]/10 relative"
              >
                <History className="w-3.5 h-3.5" />
                <span className="hidden xl:inline whitespace-nowrap">History</span>
                {chatSessionCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {chatSessionCount}
                  </span>
                )}
              </Button>

              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-8 gap-1.5 text-muted-foreground hover:text-foreground hover:bg-[#EFE6D6]/10"
              >
                <Save className="w-3.5 h-3.5" />
                <span className="hidden xl:inline whitespace-nowrap">Save</span>
              </Button>

              <div className="h-5 w-px bg-border mx-1" />

              {/* Tools dropdown — organized by category */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="text-xs h-8 gap-1 text-muted-foreground hover:text-foreground hover:bg-[#EFE6D6]/10">
                    <Wrench className="w-3.5 h-3.5" />
                    <span className="hidden xl:inline whitespace-nowrap">Tools</span>
                    <ChevronDown className="w-3 h-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="center" className="w-56 max-h-80 overflow-y-auto">
                  {TOOL_CATEGORIES.map((cat, catIdx) => (
                    <div key={cat.label}>
                      {catIdx > 0 && <DropdownMenuSeparator />}
                      <div className="px-2 py-1.5">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{cat.label}</span>
                      </div>
                      {cat.items.map(({ value, icon: Icon, label }) => (
                        <DropdownMenuItem
                          key={value}
                          onClick={() => { setActiveView(value); if (value !== 'tasks') setTaskFilterStatus(null); }}
                          className={cn(
                            "text-xs gap-2 cursor-pointer",
                            activeView === value && "bg-[#EFE6D6]/10 font-semibold"
                          )}
                        >
                          <Icon className="w-3.5 h-3.5" />
                          {label}
                        </DropdownMenuItem>
                      ))}
                    </div>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              <EscalationAlertButton onViewAll={() => setActiveView('escalations')} />
            </div>

            {/* Right: Search + Notifications */}
            <div className="flex items-center justify-end gap-2 min-w-0">
              <button
                onClick={() => setShowCommandPalette(true)}
                data-owner-neutral-control="true"
                className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background border border-[#B89555]/30 text-muted-foreground hover:border-[#B89555]/50 transition-all text-xs"
                style={{ background: '#FDFBF7', color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A' }}
              >
                <Search className="h-3.5 w-3.5 text-[#1A1A1A]" />
                <kbd className="px-1.5 py-0.5 bg-[#EFE6D6]/10 text-[#1A1A1A] text-[10px] rounded font-mono">⌘K</kbd>
              </button>
              
              <button
                onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                className="relative p-2 rounded-full bg-background border border-[#B89555]/30 hover:border-[#B89555]/50 transition-all"
              >
                <Bell className="h-4 w-4 text-[#1A1A1A]" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Status cards row — between header and chat */}
        <div className="flex-shrink-0 px-4 py-2 bg-gradient-to-r from-[#FDFBF7] to-[#F7F2EA] border-b border-[#B89555]/20">
          <div className="flex items-center gap-2 overflow-x-auto">
            {statCards.map((s) => (
              <button
                key={s.label}
                onClick={() => s.filter === 'escalations' ? setActiveView('escalations') : handleStatClick(s.filter)}
                data-owner-neutral-control={s.label === 'Pending' || s.label === 'Escalations' ? 'true' : undefined}
                style={s.label === 'Pending' || s.label === 'Escalations' ? { background: '#FDFBF7', backgroundImage: 'none', color: '#1A1A1A', WebkitTextFillColor: '#1A1A1A', borderColor: 'rgba(184,149,85,0.35)' } : undefined}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all hover:shadow-sm flex-shrink-0",
                  s.colorClass
                )}
              >
                <span className="text-base font-bold">{s.count}</span>
                <span className="text-[11px] font-medium">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Main content area */}
        <div className="flex-1 overflow-hidden">
          {activeView === 'assistant' ? (
            renderActiveView()
          ) : (
            <div className="h-full overflow-y-auto p-4 pb-24">
              <div className="max-w-7xl mx-auto">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveView('assistant')}
                  className="mb-4 text-xs text-muted-foreground hover:text-foreground"
                >
                  ← Back to Chat
                </Button>
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                  {renderActiveView()}
                </motion.div>
              </div>
            </div>
          )}
        </div>
      </div>

      <FloatingActionBar />

      <AnimatePresence>
        {isNotificationOpen && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-96 bg-card border-l-2 border-[#B89555]/30 shadow-xl z-50"
          >
            <FoundersNotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
