import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import MainLayout from "@/components/MainLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { motion } from "framer-motion";
import {
  Brain,
  Mail,
  Phone,
  MessageSquare,
  Instagram,
  Linkedin,
  Facebook,
  AlertTriangle,
  CheckCircle,
  Clock,
  Users,
  FileText,
  Settings,
  Plus,
  Trash2,
  BookOpen,
  Filter,
  Bell,
  Zap,
  Eye,
  Send,
  RefreshCw,
  Loader2,
  Sparkles,
  Search,
  LayoutDashboard,
  Upload,
  Video,
  Mic
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import ExecutiveChatPanel from "@/components/executive/ExecutiveChatPanel";
import IntegrationWizard from "@/components/executive/IntegrationWizard";
import SocialMediaGrid from "@/components/executive/SocialMediaGrid";
import { CommandPalette } from "@/components/ui/command-palette";
import { FloatingActionBar } from "@/components/ui/floating-action-bar";

// RENAMED: Executive AI → Admin Command Center
type CommCategory = 'important' | 'routine' | 'recruitment' | 'flagged' | 'spam';
type CommChannel = 'email' | 'whatsapp' | 'instagram' | 'facebook' | 'linkedin' | 'phone' | 'sms';
type AIStatus = 'pending' | 'auto_responded' | 'flagged_for_review' | 'human_responded' | 'ignored';

interface Communication {
  id: string;
  channel: CommChannel;
  category: CommCategory;
  sender_name: string | null;
  sender_identifier: string;
  subject: string | null;
  content: string;
  received_at: string;
  ai_status: AIStatus;
  ai_response: string | null;
  ai_confidence_score: number | null;
  ai_reasoning: string | null;
  human_response: string | null;
  is_read: boolean;
}

interface LearnedResponse {
  id: string;
  trigger_keywords: string[];
  trigger_category: CommCategory | null;
  response_template: string;
  is_auto_respond: boolean;
  use_count: number;
  is_active: boolean;
}

interface IgnoreRule {
  id: string;
  rule_name: string;
  rule_type: string;
  rule_value: string;
  action: string;
  target_category: CommCategory | null;
  is_active: boolean;
  match_count: number;
}

const categoryColors: Record<CommCategory, string> = {
  important: "bg-red-500",
  routine: "bg-green-500",
  recruitment: "bg-blue-500",
  flagged: "bg-yellow-500",
  spam: "bg-gray-500"
};

const channelIcons: Record<CommChannel, React.ReactNode> = {
  email: <Mail className="h-4 w-4" />,
  whatsapp: <MessageSquare className="h-4 w-4" />,
  instagram: <Instagram className="h-4 w-4" />,
  facebook: <Facebook className="h-4 w-4" />,
  linkedin: <Linkedin className="h-4 w-4" />,
  phone: <Phone className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />
};

const statusConfig: Record<AIStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800 border-yellow-300", icon: <Clock className="h-3 w-3" /> },
  auto_responded: { label: "Auto Responded", color: "bg-green-100 text-green-800 border-green-300", icon: <Zap className="h-3 w-3" /> },
  flagged_for_review: { label: "Needs Review", color: "bg-red-100 text-red-800 border-red-300", icon: <AlertTriangle className="h-3 w-3" /> },
  human_responded: { label: "You Responded", color: "bg-blue-100 text-blue-800 border-blue-300", icon: <CheckCircle className="h-3 w-3" /> },
  ignored: { label: "Ignored", color: "bg-gray-100 text-gray-800 border-gray-300", icon: <Eye className="h-3 w-3" /> }
};

export default function ExecutiveAssistant() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  
  const [activeTab, setActiveTab] = useState("inbox");
  const [selectedCategory, setSelectedCategory] = useState<CommCategory | "all">("all");
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [learnedResponses, setLearnedResponses] = useState<LearnedResponse[]>([]);
  const [ignoreRules, setIgnoreRules] = useState<IgnoreRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedComm, setSelectedComm] = useState<Communication | null>(null);
  const [humanResponse, setHumanResponse] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [integrationWizard, setIntegrationWizard] = useState<{
    isOpen: boolean;
    type: 'email' | 'phone' | 'whatsapp' | 'social';
  }>({ isOpen: false, type: 'email' });
  const [globalSearch, setGlobalSearch] = useState("");
  
  // New response form
  const [newResponseKeywords, setNewResponseKeywords] = useState("");
  const [newResponseTemplate, setNewResponseTemplate] = useState("");
  const [newResponseAutoReply, setNewResponseAutoReply] = useState(false);
  const [newResponseCategory, setNewResponseCategory] = useState<CommCategory | "">("");
  
  // New ignore rule form
  const [newRuleName, setNewRuleName] = useState("");
  const [newRuleType, setNewRuleType] = useState("keyword");
  const [newRuleValue, setNewRuleValue] = useState("");
  const [newRuleAction, setNewRuleAction] = useState("archive");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchData();
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

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch communications
      const { data: comms } = await supabase
        .from("assistant_communications")
        .select("*")
        .order("received_at", { ascending: false });
      
      // Fetch learned responses
      const { data: responses } = await supabase
        .from("assistant_learned_responses")
        .select("*")
        .order("priority", { ascending: false });
      
      // Fetch ignore rules
      const { data: rules } = await supabase
        .from("assistant_ignore_rules")
        .select("*")
        .order("created_at", { ascending: false });
      
      setCommunications(comms || []);
      setLearnedResponses(responses || []);
      setIgnoreRules(rules || []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  const addLearnedResponse = async () => {
    if (!newResponseKeywords.trim() || !newResponseTemplate.trim()) {
      toast.error("Please fill in keywords and response template");
      return;
    }

    try {
      const keywords = newResponseKeywords.split(",").map(k => k.trim().toLowerCase());
      
      const { error } = await supabase
        .from("assistant_learned_responses")
        .insert({
          user_id: user!.id,
          trigger_keywords: keywords,
          trigger_category: newResponseCategory || null,
          response_template: newResponseTemplate,
          is_auto_respond: newResponseAutoReply
        });

      if (error) throw error;
      
      toast.success("Response template added! AI will learn from this.");
      setNewResponseKeywords("");
      setNewResponseTemplate("");
      setNewResponseAutoReply(false);
      setNewResponseCategory("");
      fetchData();
    } catch (error) {
      console.error("Error adding response:", error);
      toast.error("Failed to add response");
    }
  };

  const addIgnoreRule = async () => {
    if (!newRuleName.trim() || !newRuleValue.trim()) {
      toast.error("Please fill in rule name and value");
      return;
    }

    try {
      const { error } = await supabase
        .from("assistant_ignore_rules")
        .insert({
          user_id: user!.id,
          rule_name: newRuleName,
          rule_type: newRuleType,
          rule_value: newRuleValue.toLowerCase(),
          action: newRuleAction,
          target_category: newRuleAction === "move_to_category" ? "recruitment" : null
        });

      if (error) throw error;
      
      toast.success("Ignore rule added!");
      setNewRuleName("");
      setNewRuleValue("");
      fetchData();
    } catch (error) {
      console.error("Error adding rule:", error);
      toast.error("Failed to add rule");
    }
  };

  const deleteLearnedResponse = async (id: string) => {
    try {
      await supabase.from("assistant_learned_responses").delete().eq("id", id);
      toast.success("Response deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const deleteIgnoreRule = async (id: string) => {
    try {
      await supabase.from("assistant_ignore_rules").delete().eq("id", id);
      toast.success("Rule deleted");
      fetchData();
    } catch (error) {
      toast.error("Failed to delete");
    }
  };

  const handleHumanResponse = async () => {
    if (!selectedComm || !humanResponse.trim()) return;

    try {
      await supabase
        .from("assistant_communications")
        .update({
          human_response: humanResponse,
          ai_status: "human_responded",
          human_reviewed_at: new Date().toISOString()
        })
        .eq("id", selectedComm.id);

      // Log this for AI learning
      await supabase.from("assistant_ai_logs").insert({
        user_id: user!.id,
        communication_id: selectedComm.id,
        action_taken: "human_response_provided",
        reasoning: "User provided manual response for AI to learn from",
        was_correct: false // AI was uncertain, human stepped in
      });

      toast.success("Response saved! AI will learn from this.");
      setHumanResponse("");
      setSelectedComm(null);
      fetchData();
    } catch (error) {
      toast.error("Failed to save response");
    }
  };

  const markAsCategory = async (commId: string, category: CommCategory) => {
    try {
      await supabase
        .from("assistant_communications")
        .update({ category })
        .eq("id", commId);
      
      toast.success(`Marked as ${category}`);
      fetchData();
    } catch (error) {
      toast.error("Failed to update");
    }
  };

  const filteredComms = communications.filter(c => 
    selectedCategory === "all" || c.category === selectedCategory
  );

  const stats = {
    total: communications.length,
    important: communications.filter(c => c.category === "important").length,
    flagged: communications.filter(c => c.ai_status === "flagged_for_review").length,
    autoResponded: communications.filter(c => c.ai_status === "auto_responded").length,
    recruitment: communications.filter(c => c.category === "recruitment").length
  };

  if (authLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <Loader2 className="h-8 w-8 animate-spin text-gold" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
        {/* Command Palette */}
        <CommandPalette isOpen={showCommandPalette} onClose={() => setShowCommandPalette(false)} />
        
        <div className="container mx-auto px-4 py-8 max-w-7xl pb-24">
          {/* Premium Header */}
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between flex-wrap gap-4 bg-white/80 backdrop-blur-sm border-2 border-gold/30 rounded-2xl p-4 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <div className="flex items-center gap-4">
                <div className="p-4 rounded-2xl bg-gradient-to-br from-gold/20 to-gold/5 border-2 border-gold/30">
                  <LayoutDashboard className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-black">JBJ Admin Command Center</h1>
                  <p className="text-zinc-500">Your intelligent command center for team management</p>
                </div>
              </div>
              
              {/* Global Search */}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowCommandPalette(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border-2 border-gold/30 text-zinc-500 hover:border-gold/50 transition-all"
                >
                  <Search className="h-4 w-4 text-gold" />
                  <span className="text-sm">Search across all tools...</span>
                  <kbd className="ml-2 px-2 py-0.5 bg-gold/10 text-gold text-xs rounded font-mono">⌘K</kbd>
                </button>
                <Button
                  onClick={() => setIsChatOpen(true)}
                  variant="primary"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Admin
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards - Premium White/Gold Theme */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-zinc-500">Total</p>
                    <p className="text-2xl font-bold text-black">{stats.total}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center">
                    <Mail className="h-5 w-5 text-gold" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-red-500/30 shadow-[0_4px_20px_rgba(239,68,68,0.1)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-red-600">Important</p>
                    <p className="text-2xl font-bold text-red-600">{stats.important}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-yellow-500/30 shadow-[0_4px_20px_rgba(234,179,8,0.1)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-yellow-600">Needs Review</p>
                    <p className="text-2xl font-bold text-yellow-600">{stats.flagged}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-yellow-500/10 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-green-500/30 shadow-[0_4px_20px_rgba(34,197,94,0.1)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-green-600">Auto Handled</p>
                    <p className="text-2xl font-bold text-green-600">{stats.autoResponded}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                    <Zap className="h-5 w-5 text-green-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card className="bg-white border-2 border-blue-500/30 shadow-[0_4px_20px_rgba(59,130,246,0.1)]">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">HR Requests</p>
                    <p className="text-2xl font-bold text-blue-600">{stats.recruitment}</p>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-blue-500" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs - Premium Theme */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white/80 border-2 border-gold/30 p-1 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
              <TabsTrigger value="inbox" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
                <Mail className="h-4 w-4 mr-2" />
                Inbox
              </TabsTrigger>
              <TabsTrigger value="responses" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
                <Brain className="h-4 w-4 mr-2" />
                AI Responses
              </TabsTrigger>
              <TabsTrigger value="rules" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
                <Filter className="h-4 w-4 mr-2" />
                Rules
              </TabsTrigger>
              <TabsTrigger value="integrations" className="data-[state=active]:bg-gold data-[state=active]:text-black text-black">
                <Settings className="h-4 w-4 mr-2" />
                Integrations
              </TabsTrigger>
            </TabsList>

            {/* Inbox Tab */}
            <TabsContent value="inbox" className="space-y-4">
              <div className="flex items-center gap-2 flex-wrap">
                <Badge
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === 'all' ? 'bg-gold text-black' : 'bg-white text-black border-2 border-gold/30'}`}
                  onClick={() => setSelectedCategory('all')}
                >
                  All ({stats.total})
                </Badge>
                <Badge
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === 'important' ? 'bg-red-500 text-white' : 'bg-red-50 text-red-600 border-2 border-red-200'}`}
                  onClick={() => setSelectedCategory('important')}
                >
                  Important ({stats.important})
                </Badge>
                <Badge
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === 'routine' ? 'bg-green-500 text-white' : 'bg-green-50 text-green-600 border-2 border-green-200'}`}
                  onClick={() => setSelectedCategory('routine')}
                >
                  Routine
                </Badge>
                <Badge
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === 'recruitment' ? 'bg-blue-500 text-white' : 'bg-blue-50 text-blue-600 border-2 border-blue-200'}`}
                  onClick={() => setSelectedCategory('recruitment')}
                >
                  HR ({stats.recruitment})
                </Badge>
                <Badge
                  className={`cursor-pointer px-4 py-2 ${selectedCategory === 'flagged' ? 'bg-yellow-500 text-white' : 'bg-yellow-50 text-yellow-600 border-2 border-yellow-200'}`}
                  onClick={() => setSelectedCategory('flagged')}
                >
                  Flagged ({stats.flagged})
                </Badge>
              </div>

              <ScrollArea className="h-[600px]">
                <div className="space-y-3">
                  {filteredComms.map((comm) => (
                    <Card
                      key={comm.id}
                      className={`cursor-pointer hover:border-gold/50 transition-all bg-white border-2 ${!comm.is_read ? 'border-gold/40 shadow-[0_4px_20px_rgba(200,167,102,0.15)]' : 'border-gold/20'}`}
                      onClick={() => setSelectedComm(comm)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
                              {channelIcons[comm.channel]}
                            </div>
                            <div>
                              <p className="font-semibold text-black">{comm.sender_name || comm.sender_identifier}</p>
                              <p className="text-sm text-zinc-600 line-clamp-2">{comm.subject || comm.content}</p>
                              <p className="text-xs text-zinc-400 mt-1">
                                {new Date(comm.received_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <Badge className={`${statusConfig[comm.ai_status].color} flex items-center gap-1`}>
                              {statusConfig[comm.ai_status].icon}
                              {statusConfig[comm.ai_status].label}
                            </Badge>
                            {comm.ai_confidence_score && (
                              <span className="text-xs text-zinc-400">
                                {Math.round(comm.ai_confidence_score * 100)}% confident
                              </span>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </ScrollArea>
            </TabsContent>

            {/* Responses Tab */}
            <TabsContent value="responses" className="space-y-6">
              <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-2">
                    <Plus className="h-5 w-5 text-gold" />
                    Add Response Template
                  </CardTitle>
                  <CardDescription className="text-zinc-500">
                    Teach the AI how to respond to specific types of messages
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-black">Trigger Keywords (comma-separated)</Label>
                      <Input
                        placeholder="e.g., price, availability, viewing"
                        value={newResponseKeywords}
                        onChange={(e) => setNewResponseKeywords(e.target.value)}
                        className="bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-black">Category Filter (optional)</Label>
                      <Select value={newResponseCategory} onValueChange={(v) => setNewResponseCategory(v as CommCategory)}>
                        <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                          <SelectValue placeholder="Any category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Any category</SelectItem>
                          <SelectItem value="important">Important</SelectItem>
                          <SelectItem value="routine">Routine</SelectItem>
                          <SelectItem value="recruitment">HR/Recruitment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-black">Response Template</Label>
                    <Textarea
                      placeholder="Enter your response template..."
                      value={newResponseTemplate}
                      onChange={(e) => setNewResponseTemplate(e.target.value)}
                      className="min-h-[100px] bg-white border-2 border-gold/30 text-black placeholder:text-zinc-400"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={newResponseAutoReply}
                        onCheckedChange={setNewResponseAutoReply}
                      />
                      <Label className="text-black">Auto-send response</Label>
                    </div>
                    <Button onClick={addLearnedResponse} variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Template
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing responses */}
              <div className="grid gap-4">
                {learnedResponses.map((response) => (
                  <Card key={response.id} className="bg-white border-2 border-gold/30">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {response.trigger_keywords.map((kw) => (
                              <Badge key={kw} variant="outline" className="border-gold/30 text-black">{kw}</Badge>
                            ))}
                            {response.is_auto_respond && (
                              <Badge className="bg-green-100 text-green-800 border-green-300">Auto-reply</Badge>
                            )}
                          </div>
                          <p className="text-sm text-zinc-600 line-clamp-2">{response.response_template}</p>
                          <p className="text-xs text-zinc-400 mt-2">Used {response.use_count} times</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteLearnedResponse(response.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Rules Tab */}
            <TabsContent value="rules" className="space-y-6">
              <Card className="bg-white border-2 border-gold/30 shadow-[0_4px_20px_rgba(200,167,102,0.1)]">
                <CardHeader>
                  <CardTitle className="text-black flex items-center gap-2">
                    <Filter className="h-5 w-5 text-gold" />
                    Add Ignore/Filter Rule
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-black">Rule Name</Label>
                      <Input
                        placeholder="e.g., Block marketing emails"
                        value={newRuleName}
                        onChange={(e) => setNewRuleName(e.target.value)}
                        className="bg-white border-2 border-gold/30 text-black"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-black">Rule Type</Label>
                      <Select value={newRuleType} onValueChange={setNewRuleType}>
                        <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="keyword">Keyword</SelectItem>
                          <SelectItem value="sender">Sender Contains</SelectItem>
                          <SelectItem value="subject">Subject Contains</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-black">Action</Label>
                      <Select value={newRuleAction} onValueChange={setNewRuleAction}>
                        <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="archive">Archive</SelectItem>
                          <SelectItem value="delete">Delete</SelectItem>
                          <SelectItem value="move_to_category">Move to HR</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Input
                      placeholder="Enter value to match..."
                      value={newRuleValue}
                      onChange={(e) => setNewRuleValue(e.target.value)}
                      className="flex-1 bg-white border-2 border-gold/30 text-black"
                    />
                    <Button onClick={addIgnoreRule} variant="primary">
                      <Plus className="h-4 w-4 mr-2" />
                      Add Rule
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Existing rules */}
              <div className="grid gap-4">
                {ignoreRules.map((rule) => (
                  <Card key={rule.id} className="bg-white border-2 border-gold/30">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-black">{rule.rule_name}</p>
                          <p className="text-sm text-zinc-500">
                            {rule.rule_type}: "{rule.rule_value}" → {rule.action}
                          </p>
                          <p className="text-xs text-zinc-400">Matched {rule.match_count} times</p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteIgnoreRule(rule.id)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            {/* Integrations Tab */}
            <TabsContent value="integrations">
              <SocialMediaGrid onConnectPlatform={(platform) => console.log('Connect platform:', platform)} />
            </TabsContent>
          </Tabs>
        </div>

        {/* Floating Action Bar */}
        <FloatingActionBar />

        {/* Communication Detail Dialog */}
        <Dialog open={!!selectedComm} onOpenChange={() => setSelectedComm(null)}>
          <DialogContent className="max-w-2xl bg-white border-2 border-gold/30">
            <DialogHeader>
              <DialogTitle className="text-black flex items-center gap-2">
                {selectedComm && channelIcons[selectedComm.channel]}
                {selectedComm?.sender_name || selectedComm?.sender_identifier}
              </DialogTitle>
            </DialogHeader>
            {selectedComm && (
              <div className="space-y-4">
                <div className="p-4 bg-gradient-to-r from-[#FDFBF7] to-white rounded-lg border border-gold/20">
                  <p className="text-black whitespace-pre-wrap">{selectedComm.content}</p>
                </div>
                
                {selectedComm.ai_response && (
                  <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-800 mb-2">AI Suggested Response:</p>
                    <p className="text-green-700">{selectedComm.ai_response}</p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-black">Your Response</Label>
                  <Textarea
                    placeholder="Type your response..."
                    value={humanResponse}
                    onChange={(e) => setHumanResponse(e.target.value)}
                    className="min-h-[100px] bg-white border-2 border-gold/30 text-black"
                  />
                  <Button onClick={handleHumanResponse} variant="primary">
                    <Send className="h-4 w-4 mr-2" />
                    Send & Teach AI
                  </Button>
                </div>

                <div className="flex items-center gap-2 pt-4 border-t border-gold/20">
                  <span className="text-sm text-zinc-500">Quick actions:</span>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAsCategory(selectedComm.id, 'important')}
                  >
                    Mark Important
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAsCategory(selectedComm.id, 'routine')}
                  >
                    Mark Routine
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => markAsCategory(selectedComm.id, 'recruitment')}
                  >
                    Move to HR
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Chat Panel */}
        <ExecutiveChatPanel isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

        {/* Integration Wizard */}
        <IntegrationWizard
          isOpen={integrationWizard.isOpen}
          onClose={() => setIntegrationWizard({ isOpen: false, type: 'email' })}
          integrationType={integrationWizard.type as 'email' | 'phone' | 'whatsapp' | 'social'}
          onConnected={() => {
            setIntegrationWizard({ isOpen: false, type: 'email' });
            toast.success('Integration connected successfully!');
          }}
        />
      </div>
    </MainLayout>
  );
}
