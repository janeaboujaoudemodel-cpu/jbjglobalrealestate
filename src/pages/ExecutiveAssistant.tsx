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
  Loader2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
  pending: { label: "Pending", color: "bg-yellow-100 text-yellow-800", icon: <Clock className="h-3 w-3" /> },
  auto_responded: { label: "Auto Responded", color: "bg-green-100 text-green-800", icon: <Zap className="h-3 w-3" /> },
  flagged_for_review: { label: "Needs Review", color: "bg-red-100 text-red-800", icon: <AlertTriangle className="h-3 w-3" /> },
  human_responded: { label: "You Responded", color: "bg-blue-100 text-blue-800", icon: <CheckCircle className="h-3 w-3" /> },
  ignored: { label: "Ignored", color: "bg-gray-100 text-gray-800", icon: <Eye className="h-3 w-3" /> }
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
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
              <Brain className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h1 className="text-3xl font-bold">AI Executive Assistant</h1>
              <p className="text-muted-foreground">Your intelligent communication command center</p>
            </div>
          </div>
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Mail className="h-8 w-8 text-muted-foreground/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-red-600">Important</p>
                  <p className="text-2xl font-bold text-red-600">{stats.important}</p>
                </div>
                <Bell className="h-8 w-8 text-red-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-yellow-600">Needs Review</p>
                  <p className="text-2xl font-bold text-yellow-600">{stats.flagged}</p>
                </div>
                <AlertTriangle className="h-8 w-8 text-yellow-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-green-600">Auto Handled</p>
                  <p className="text-2xl font-bold text-green-600">{stats.autoResponded}</p>
                </div>
                <Zap className="h-8 w-8 text-green-500/50" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-blue-600">Recruitment</p>
                  <p className="text-2xl font-bold text-blue-600">{stats.recruitment}</p>
                </div>
                <Users className="h-8 w-8 text-blue-500/50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:inline-grid">
            <TabsTrigger value="inbox" className="gap-2">
              <Mail className="h-4 w-4" />
              <span className="hidden sm:inline">Inbox</span>
            </TabsTrigger>
            <TabsTrigger value="training" className="gap-2">
              <BookOpen className="h-4 w-4" />
              <span className="hidden sm:inline">Train AI</span>
            </TabsTrigger>
            <TabsTrigger value="rules" className="gap-2">
              <Filter className="h-4 w-4" />
              <span className="hidden sm:inline">Rules</span>
            </TabsTrigger>
            <TabsTrigger value="integrations" className="gap-2">
              <Settings className="h-4 w-4" />
              <span className="hidden sm:inline">Connect</span>
            </TabsTrigger>
          </TabsList>

          {/* Inbox Tab */}
          <TabsContent value="inbox" className="space-y-4">
            {/* Category Filter */}
            <div className="flex flex-wrap gap-2">
              <Button 
                variant={selectedCategory === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory("all")}
              >
                All
              </Button>
              {(["important", "flagged", "routine", "recruitment", "spam"] as CommCategory[]).map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedCategory(cat)}
                  className="capitalize"
                >
                  <span className={`w-2 h-2 rounded-full mr-2 ${categoryColors[cat]}`} />
                  {cat}
                </Button>
              ))}
            </div>

            {/* Communications List */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Communications</CardTitle>
                  <CardDescription>
                    {filteredComms.length} messages • AI handles routine, flags uncertain
                  </CardDescription>
                </div>
                <Button variant="outline" size="sm" onClick={fetchData}>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : filteredComms.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No communications yet</p>
                    <p className="text-sm">Connect your channels to start receiving messages</p>
                  </div>
                ) : (
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-3">
                      {filteredComms.map((comm) => (
                        <motion.div
                          key={comm.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className={`p-4 rounded-lg border cursor-pointer transition-all hover:shadow-md ${
                            !comm.is_read ? "bg-primary/5 border-primary/20" : "bg-card"
                          }`}
                          onClick={() => setSelectedComm(comm)}
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="flex items-center gap-3">
                              <div className="p-2 rounded-full bg-muted">
                                {channelIcons[comm.channel]}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">
                                    {comm.sender_name || comm.sender_identifier}
                                  </span>
                                  <span className={`w-2 h-2 rounded-full ${categoryColors[comm.category]}`} />
                                </div>
                                <p className="text-sm text-muted-foreground line-clamp-1">
                                  {comm.subject || comm.content.substring(0, 60)}...
                                </p>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <Badge className={statusConfig[comm.ai_status].color}>
                                {statusConfig[comm.ai_status].icon}
                                <span className="ml-1">{statusConfig[comm.ai_status].label}</span>
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(comm.received_at).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                          
                          {comm.ai_status === "flagged_for_review" && (
                            <div className="mt-3 p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 text-sm">
                              <AlertTriangle className="h-4 w-4 inline mr-2 text-yellow-600" />
                              <span className="text-yellow-800 dark:text-yellow-200">
                                AI needs your guidance: {comm.ai_reasoning || "Uncertain how to respond"}
                              </span>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Training Tab */}
          <TabsContent value="training" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BookOpen className="h-5 w-5" />
                  Teach Your AI
                </CardTitle>
                <CardDescription>
                  Add response templates. When AI sees these keywords, it will use your template.
                  Enable "Auto Reply" for AI to respond automatically without asking.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Trigger Keywords (comma separated)</Label>
                    <Input
                      placeholder="pricing, cost, how much, rates"
                      value={newResponseKeywords}
                      onChange={(e) => setNewResponseKeywords(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Category (optional)</Label>
                    <Select value={newResponseCategory} onValueChange={(v) => setNewResponseCategory(v as CommCategory)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Any category" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="important">Important</SelectItem>
                        <SelectItem value="routine">Routine</SelectItem>
                        <SelectItem value="recruitment">Recruitment</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label>Response Template</Label>
                  <Textarea
                    placeholder="Thank you for your inquiry about pricing. Our rates start from AED X for Y service. Would you like to schedule a consultation?"
                    value={newResponseTemplate}
                    onChange={(e) => setNewResponseTemplate(e.target.value)}
                    rows={4}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Switch
                      checked={newResponseAutoReply}
                      onCheckedChange={setNewResponseAutoReply}
                    />
                    <Label>Auto Reply (AI responds without asking)</Label>
                  </div>
                  <Button onClick={addLearnedResponse}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Template
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Existing Templates */}
            <Card>
              <CardHeader>
                <CardTitle>Your Response Templates ({learnedResponses.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {learnedResponses.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No templates yet. Add one above to start training your AI.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {learnedResponses.map((resp) => (
                      <div key={resp.id} className="p-4 rounded-lg border bg-card">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="flex flex-wrap gap-1">
                                {resp.trigger_keywords.map((kw, i) => (
                                  <Badge key={i} variant="secondary" className="text-xs">
                                    {kw}
                                  </Badge>
                                ))}
                              </div>
                              {resp.is_auto_respond && (
                                <Badge className="bg-green-100 text-green-800">
                                  <Zap className="h-3 w-3 mr-1" />
                                  Auto
                                </Badge>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {resp.response_template}
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              Used {resp.use_count} times
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteLearnedResponse(resp.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Filter className="h-5 w-5" />
                  Ignore & Filter Rules
                </CardTitle>
                <CardDescription>
                  Tell AI what to ignore, archive, or move to recruitment folder.
                  These messages won't clutter your important inbox.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label>Rule Name</Label>
                    <Input
                      placeholder="Marketing emails"
                      value={newRuleName}
                      onChange={(e) => setNewRuleName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={newRuleType} onValueChange={setNewRuleType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="keyword">Keyword</SelectItem>
                        <SelectItem value="sender">Sender</SelectItem>
                        <SelectItem value="domain">Domain</SelectItem>
                        <SelectItem value="subject_pattern">Subject Pattern</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      placeholder="unsubscribe, newsletter"
                      value={newRuleValue}
                      onChange={(e) => setNewRuleValue(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Action</Label>
                    <Select value={newRuleAction} onValueChange={setNewRuleAction}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="archive">Archive (hide)</SelectItem>
                        <SelectItem value="move_to_category">Move to Recruitment</SelectItem>
                        <SelectItem value="delete">Delete</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={addIgnoreRule}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Rule
                </Button>
              </CardContent>
            </Card>

            {/* Existing Rules */}
            <Card>
              <CardHeader>
                <CardTitle>Active Rules ({ignoreRules.length})</CardTitle>
              </CardHeader>
              <CardContent>
                {ignoreRules.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No rules yet. Add one above to start filtering.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {ignoreRules.map((rule) => (
                      <div key={rule.id} className="p-4 rounded-lg border bg-card flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{rule.rule_name}</span>
                            <Badge variant="outline">{rule.rule_type}</Badge>
                            <Badge variant="secondary">{rule.action}</Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mt-1">
                            Match: "{rule.rule_value}" • Used {rule.match_count} times
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteIgnoreRule(rule.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Integrations Tab */}
          <TabsContent value="integrations" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Email Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                      <Mail className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <CardTitle>Email</CardTitle>
                      <CardDescription>Gmail & Hostinger</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect your email accounts to let AI read, categorize, and respond.
                  </p>
                  <Badge variant="outline" className="mb-4">Not Connected</Badge>
                  <div className="space-y-2 text-sm">
                    <p>📋 You need:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Gmail: Enable Gmail API in Google Cloud Console</li>
                      <li>Hostinger: Get IMAP credentials from hosting panel</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Phone Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30">
                      <Phone className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <CardTitle>Phone Calls</CardTitle>
                      <CardDescription>VAPI.ai Integration</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Forward your UAE number to VAPI AI agent for 24/7 answering.
                  </p>
                  <Badge variant="outline" className="mb-4">Not Connected</Badge>
                  <div className="space-y-2 text-sm">
                    <p>📋 You need:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>VAPI.ai account & API key</li>
                      <li>Set up call forwarding: Etisalat *100</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                      <MessageSquare className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle>WhatsApp</CardTitle>
                      <CardDescription>Meta Business API</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Connect WhatsApp Business to auto-respond to inquiries.
                  </p>
                  <Badge variant="outline" className="mb-4">Not Connected</Badge>
                  <div className="space-y-2 text-sm">
                    <p>📋 You need:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Meta Business Account (verified)</li>
                      <li>WhatsApp Business API access (2-4 weeks approval)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {/* Social Media Integration */}
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-100 dark:bg-pink-900/30">
                      <Instagram className="h-6 w-6 text-pink-600" />
                    </div>
                    <div>
                      <CardTitle>Social Media</CardTitle>
                      <CardDescription>Instagram, Facebook, LinkedIn</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Manage all social DMs and comments from one place.
                  </p>
                  <Badge variant="outline" className="mb-4">Not Connected</Badge>
                  <div className="space-y-2 text-sm">
                    <p>📋 You need:</p>
                    <ul className="list-disc list-inside text-muted-foreground">
                      <li>Meta Business Suite (Instagram, Facebook)</li>
                      <li>LinkedIn Sales Navigator API (optional)</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Communication Detail Modal */}
        <Dialog open={!!selectedComm} onOpenChange={() => setSelectedComm(null)}>
          <DialogContent className="max-w-2xl">
            {selectedComm && (
              <>
                <DialogHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-muted">
                      {channelIcons[selectedComm.channel]}
                    </div>
                    <div>
                      <DialogTitle>
                        {selectedComm.sender_name || selectedComm.sender_identifier}
                      </DialogTitle>
                      <DialogDescription>
                        {selectedComm.sender_identifier} • {new Date(selectedComm.received_at).toLocaleString()}
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>
                
                <div className="space-y-4">
                  {selectedComm.subject && (
                    <div>
                      <Label className="text-muted-foreground">Subject</Label>
                      <p className="font-medium">{selectedComm.subject}</p>
                    </div>
                  )}
                  
                  <div>
                    <Label className="text-muted-foreground">Message</Label>
                    <div className="p-4 rounded-lg bg-muted/50 mt-1">
                      <p className="whitespace-pre-wrap">{selectedComm.content}</p>
                    </div>
                  </div>

                  {selectedComm.ai_response && (
                    <div>
                      <Label className="text-muted-foreground">AI Response</Label>
                      <div className="p-4 rounded-lg bg-green-50 dark:bg-green-900/20 mt-1">
                        <p className="whitespace-pre-wrap">{selectedComm.ai_response}</p>
                      </div>
                    </div>
                  )}

                  {selectedComm.ai_status === "flagged_for_review" && (
                    <div className="p-4 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium text-yellow-800 dark:text-yellow-200">
                          AI needs your help
                        </span>
                      </div>
                      <p className="text-sm text-yellow-700 dark:text-yellow-300">
                        {selectedComm.ai_reasoning || "I'm not sure how to respond to this message. Please provide a response, and I'll learn from it."}
                      </p>
                    </div>
                  )}

                  <div className="space-y-2">
                    <Label>Your Response (AI will learn from this)</Label>
                    <Textarea
                      placeholder="Type your response here..."
                      value={humanResponse}
                      onChange={(e) => setHumanResponse(e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsCategory(selectedComm.id, "important")}
                      >
                        <Bell className="h-4 w-4 mr-1" />
                        Important
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsCategory(selectedComm.id, "recruitment")}
                      >
                        <Users className="h-4 w-4 mr-1" />
                        Recruitment
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsCategory(selectedComm.id, "spam")}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Spam
                      </Button>
                    </div>
                    <Button onClick={handleHumanResponse} disabled={!humanResponse.trim()}>
                      <Send className="h-4 w-4 mr-2" />
                      Send & Teach AI
                    </Button>
                  </div>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}
