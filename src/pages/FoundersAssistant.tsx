import { useState, useEffect } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
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
  Save,
  ChevronDown,
  History,
  Plus,
  X,
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
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import amandaPortrait from "@/assets/team/amanda-clarke-executive-assistant.png";

const MORE_TOOLS = [
  { value: 'tasks', icon: CheckSquare, label: 'Tasks' },
  { value: 'team', icon: Users, label: 'Team' },
  { value: 'drafts', icon: FileEdit, label: 'Drafts' },
  { value: 'ai-tools', icon: Wrench, label: 'AI Tools' },
  { value: 'hot-leads', icon: Flame, label: 'Hot Leads' },
  { value: 'activity', icon: Activity, label: 'Activity' },
  { value: 'video-meet', icon: Video, label: 'Video Meet' },
  { value: 'escalations', icon: Zap, label: 'Escalations' },
  { value: 'analytics', icon: Heart, label: 'Analytics' },
  { value: 'collaboration', icon: Network, label: 'Collaboration' },
  { value: 'insights', icon: Brain, label: 'AI Insights' },
  { value: 'notes', icon: StickyNote, label: 'Notes' },
  { value: 'decisions', icon: Scale, label: 'Decisions' },
];

export default function FoundersAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeView, setActiveView] = useState<'assistant' | string>("assistant");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [taskFilterStatus, setTaskFilterStatus] = useState<string | null>(null);
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
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <Loader2 className="h-8 w-8 animate-spin text-[hsl(var(--gold))]" />
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      <div className="flex flex-col h-screen">
        {/* Compact top toolbar */}
        <div className="flex-shrink-0 bg-white/80 backdrop-blur-sm border-b-2 border-[hsl(var(--gold))]/30 px-4 py-2 flex items-center justify-between gap-3">
          {/* Left: Amanda identity + New Chat + History */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveView('assistant')}
              className="flex items-center gap-2 hover:opacity-80 transition-opacity"
            >
              <div className="relative w-9 h-9 rounded-full border-2 border-[hsl(var(--gold))]/50 overflow-hidden">
                <img src={amandaPortrait} alt="Amanda Clarke" className="w-full h-full object-cover" />
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 border-2 border-white rounded-full" />
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-bold text-black leading-tight">Amanda Clarke</h1>
                <p className="text-[10px] text-zinc-500">Executive Assistant</p>
              </div>
            </button>

            <div className="h-6 w-px bg-[hsl(var(--gold))]/30" />

            {/* More Tools dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="text-xs text-zinc-600 hover:text-black hover:bg-[hsl(var(--gold))]/10 h-8 gap-1">
                  <ChevronDown className="w-3.5 h-3.5" />
                  Tools
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-52">
                {MORE_TOOLS.map(({ value, icon: Icon, label }) => (
                  <DropdownMenuItem
                    key={value}
                    onClick={() => { setActiveView(value); if (value !== 'tasks') setTaskFilterStatus(null); }}
                    className={`text-xs gap-2 ${activeView === value ? 'bg-gradient-to-r from-[#F5EBD7] to-[#D4C4A8] font-semibold' : ''}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Center: Task stats (compact) */}
          <div className="hidden md:flex items-center gap-2">
            {[
              { label: 'Active', count: stats.activeTasks, color: 'text-[hsl(var(--gold))]', filter: 'in_progress' },
              { label: 'Done', count: stats.completedTasks, color: 'text-green-600', filter: 'completed' },
              { label: 'Pending', count: stats.pendingTasks, color: 'text-amber-600', filter: 'pending' },
            ].map(s => (
              <button
                key={s.label}
                onClick={() => handleStatClick(s.filter)}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-[hsl(var(--gold))]/10 transition-colors"
              >
                <span className={`text-sm font-bold ${s.color}`}>{s.count}</span>
                <span className="text-[10px] text-zinc-500">{s.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowCommandPalette(true)}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-[hsl(var(--gold))]/30 text-zinc-500 hover:border-[hsl(var(--gold))]/50 transition-all text-xs"
            >
              <Search className="h-3.5 w-3.5 text-[hsl(var(--gold))]" />
              <kbd className="px-1.5 py-0.5 bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] text-[10px] rounded font-mono">⌘K</kbd>
            </button>
            
            <EscalationAlertButton onViewAll={() => setActiveView('escalations')} />
            
            <button
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="relative p-2 rounded-full bg-white border border-[hsl(var(--gold))]/30 hover:border-[hsl(var(--gold))]/50 transition-all"
            >
              <Bell className="h-4 w-4 text-[hsl(var(--gold))]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-white text-[10px] flex items-center justify-center font-bold">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Main content area - full remaining height */}
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
                  className="mb-4 text-xs text-zinc-600 hover:text-black"
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
            className="fixed right-0 top-0 h-full w-96 bg-white border-l-2 border-[hsl(var(--gold))]/30 shadow-xl z-50"
          >
            <FoundersNotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
