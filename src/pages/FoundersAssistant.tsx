import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Settings,
  Home,
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
import { FileText } from "lucide-react";

// Amanda Clarke - Founder's Executive Assistant portrait
import amandaPortrait from "@/assets/team/amanda-clarke-executive-assistant.png";

export default function FoundersAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assistant");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
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

  // Keyboard shortcut for command palette
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

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        <Loader2 className="h-8 w-8 animate-spin text-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
      {/* Command Palette */}
      <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
      
      <div className="px-4 pt-6 pb-24 max-w-7xl mx-auto">
          {/* Premium Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/80 backdrop-blur-sm border-2 border-gold/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 blur-md animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full border-2 border-gold/50 overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5">
                    <img 
                      src={amandaPortrait} 
                      alt="Amanda Clarke" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-white rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-black flex items-center gap-2">
                    Amanda Clarke
                    <Badge className="bg-gold/10 text-gold border-gold/30 text-xs">
                      Founder's Executive Assistant
                    </Badge>
                  </h1>
                  <p className="text-zinc-500 text-sm">Your personal executive assistant • Available 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Search */}
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gold/30 text-zinc-500 hover:border-gold/50 transition-all"
                >
                  <Search className="h-4 w-4 text-gold" />
                  <span className="text-sm">Search...</span>
                  <kbd className="ml-2 px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-mono">⌘K</kbd>
                </button>
                
                <EscalationAlertButton 
                  onViewAll={() => setActiveTab('escalations')}
                />
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-3 rounded-full bg-white border-2 border-gold/30 hover:border-gold/50 transition-all"
                >
                  <Bell className="h-5 w-5 text-gold" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-white text-xs flex items-center justify-center font-bold">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
              </div>
            </div>
          </motion.div>

          {/* Task Stats Cards - Premium Champagne Theme */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card 
              className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)] cursor-pointer hover:border-gold/50 hover:shadow-[0_8px_30px_rgba(200,167,102,0.2)] transition-all"
              onClick={() => setActiveTab('tasks')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Active Tasks</p>
                  <p className="text-2xl font-bold text-gold">{stats.activeTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-white border-2 border-green-500/30 shadow-[0_4px_20px_rgba(34,197,94,0.1)] cursor-pointer hover:border-green-500/50 transition-all"
              onClick={() => setActiveTab('tasks')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Completed</p>
                  <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-white border-2 border-amber-500/30 shadow-[0_4px_20px_rgba(245,158,11,0.1)] cursor-pointer hover:border-amber-500/50 transition-all"
              onClick={() => setActiveTab('tasks')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Pending</p>
                  <p className="text-2xl font-bold text-amber-600">{stats.pendingTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card 
              className="bg-white border-2 border-orange-500/30 shadow-[0_4px_20px_rgba(249,115,22,0.1)] cursor-pointer hover:border-orange-500/50 transition-all"
              onClick={() => setActiveTab('tasks')}
            >
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-zinc-500">Awaiting Approval</p>
                  <p className="text-2xl font-bold text-orange-600">{stats.awaitingApproval}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs - Premium White/Gold Theme */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-white/80 border-2 border-gold/30 p-1.5 rounded-xl mb-8 flex flex-wrap justify-center gap-1 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <TabsTrigger 
                value="assistant" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Assistant
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="team"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Users className="h-4 w-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger 
                value="drafts"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Drafts
              </TabsTrigger>
              <TabsTrigger 
                value="ai-tools"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Wrench className="h-4 w-4 mr-2" />
                AI Tools
              </TabsTrigger>
              <TabsTrigger 
                value="hot-leads"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Flame className="h-4 w-4 mr-2" />
                Hot Leads
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="video-meet"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Meet
              </TabsTrigger>
              <TabsTrigger 
                value="escalations"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Zap className="h-4 w-4 mr-2" />
                Escalations
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Heart className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="collaboration"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Network className="h-4 w-4 mr-2" />
                Collaboration
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
              </TabsTrigger>
              <TabsTrigger 
                value="notes"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger 
                value="decisions"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F5EBD7] data-[state=active]:via-[#E8DCC8] data-[state=active]:to-[#D4C4A8] data-[state=active]:text-black data-[state=active]:border-gold/40 text-black"
              >
                <Brain className="h-4 w-4 mr-2" />
                Decisions
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              <TabsContent value="assistant" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersChatPanel userName={user?.email?.split('@')[0]} />
                </motion.div>
              </TabsContent>

              <TabsContent value="tasks" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersTaskDashboard onStatsChange={fetchStats} />
                </motion.div>
              </TabsContent>

              <TabsContent value="team" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersTeamDirectory />
                </motion.div>
              </TabsContent>

              <TabsContent value="drafts" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersDraftsPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="ai-tools" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersAIToolsPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="hot-leads" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersHotLeadsPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersActivityCenter />
                </motion.div>
              </TabsContent>

              <TabsContent value="video-meet" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersVideoMeetPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="escalations" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersEscalationsPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersEmotionAnalyticsPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="collaboration" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersCollaborationPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="insights" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersInsightsPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="notes" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersNotesPanel />
                </motion.div>
              </TabsContent>

              <TabsContent value="decisions" className="mt-0">
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                >
                  <FoundersDecisionPanel />
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Floating Action Bar */}
        <FloatingActionBar />

        {/* Notification Panel */}
        <AnimatePresence>
          {isNotificationOpen && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              className="fixed right-0 top-0 h-full w-96 bg-white border-l-2 border-gold/30 shadow-xl z-50"
            >
              <FoundersNotificationCenter isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
  );
}
