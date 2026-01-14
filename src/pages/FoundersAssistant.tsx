import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
import { EscalationAlertButton } from "@/components/ai/EscalationAlertButton";

// Olivia AI portrait
import oliviaPortrait from "@/assets/team/olivia-executive-assistant.png";

export default function FoundersAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("assistant");
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
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
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-[#0A0A0A]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-[#0A0A0A]">
        <div className="container mx-auto px-4 py-6 max-w-7xl">
          {/* Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/40 to-gold/10 blur-md animate-pulse" />
                  <div className="relative w-16 h-16 rounded-full border-2 border-gold/50 overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5">
                    <img 
                      src={oliviaPortrait} 
                      alt="Olivia AI" 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-green-500 border-2 border-[#0A0A0A] rounded-full animate-pulse" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    Olivia AI
                    <Badge className="bg-gold/20 text-gold border-gold/30 text-xs">
                      Founder's Assistant
                    </Badge>
                  </h1>
                  <p className="text-gray-400 text-sm">Your personal AI executive assistant • Available 24/7</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <EscalationAlertButton 
                  onViewAll={() => setActiveTab('escalations')}
                />
                <button
                  onClick={() => setIsNotificationOpen(!isNotificationOpen)}
                  className="relative p-3 rounded-full bg-[#1A1A1A] border border-gold/20 hover:border-gold/40 transition-all"
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

          {/* Task Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#0E0E0E] border-gold/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">🧭 Active Tasks</p>
                  <p className="text-2xl font-bold text-gold">{stats.activeTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0E0E0E] border-green-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">✅ Completed</p>
                  <p className="text-2xl font-bold text-green-400">{stats.completedTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0E0E0E] border-yellow-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">⏳ Pending</p>
                  <p className="text-2xl font-bold text-yellow-400">{stats.pendingTasks}</p>
                </div>
              </CardContent>
            </Card>
            <Card className="bg-[#0E0E0E] border-orange-500/20">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-xs text-gray-400">⚠️ Awaiting Approval</p>
                  <p className="text-2xl font-bold text-orange-400">{stats.awaitingApproval}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs - All 8 tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="w-full bg-[#0E0E0E] border border-gold/20 p-1 rounded-lg mb-6 flex flex-wrap gap-1">
              <TabsTrigger 
                value="assistant" 
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <MessageSquare className="h-4 w-4 mr-2" />
                Assistant
              </TabsTrigger>
              <TabsTrigger 
                value="tasks"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <CheckSquare className="h-4 w-4 mr-2" />
                Tasks
              </TabsTrigger>
              <TabsTrigger 
                value="team"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Users className="h-4 w-4 mr-2" />
                Team
              </TabsTrigger>
              <TabsTrigger 
                value="drafts"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <FileEdit className="h-4 w-4 mr-2" />
                Drafts
              </TabsTrigger>
              <TabsTrigger 
                value="ai-tools"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Wrench className="h-4 w-4 mr-2" />
                AI Tools
              </TabsTrigger>
              <TabsTrigger 
                value="hot-leads"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Flame className="h-4 w-4 mr-2" />
                Hot Leads
              </TabsTrigger>
              <TabsTrigger 
                value="activity"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Activity className="h-4 w-4 mr-2" />
                Activity
              </TabsTrigger>
              <TabsTrigger 
                value="video-meet"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Video className="h-4 w-4 mr-2" />
                Video Meet
              </TabsTrigger>
              <TabsTrigger 
                value="escalations"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Zap className="h-4 w-4 mr-2" />
                Escalations
              </TabsTrigger>
              <TabsTrigger 
                value="analytics"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Heart className="h-4 w-4 mr-2" />
                Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="collaboration"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Network className="h-4 w-4 mr-2" />
                Collaboration
              </TabsTrigger>
              <TabsTrigger 
                value="insights"
                className="flex-1 min-w-[100px] data-[state=active]:bg-gold data-[state=active]:text-black"
              >
                <Brain className="h-4 w-4 mr-2" />
                AI Insights
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
            </AnimatePresence>
          </Tabs>
        </div>

        {/* Notification Center Slide-over */}
        <FoundersNotificationCenter 
          isOpen={isNotificationOpen} 
          onClose={() => setIsNotificationOpen(false)}
          onUnreadCountChange={setUnreadCount}
        />
      </div>
    </MainLayout>
  );
}
