import { useEffect, useState, useMemo, useCallback } from "react";
import LeadActivityTimeline from "@/components/admin/LeadActivityTimeline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  ArrowLeft,
  Search,
  Download,
  RefreshCw,
  Users,
  MessageSquare,
  Filter,
  Eye,
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  CheckCircle2,
  Clock,
  XCircle,
  UserCheck,
  ChevronDown,
  Trash2,
  MessageCircle,
  PhoneCall,
  Video,
  Activity,
  AlertTriangle,
  Send,
  Bot,
  FileText,
  Megaphone,
  BookOpen,
  PhoneIncoming,
  Sparkles,
  Upload,
  Star,
  UserPlus,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";
import LeadStatusBadge, { PIPELINE_STATUSES, getStatusInfo } from "@/components/crm/LeadStatusBadge";
import ChatTranscriptModal from "@/components/crm/ChatTranscriptModal";
import LeadContactActions from "@/components/crm/LeadContactActions";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Skeleton } from "@/components/ui/skeleton";

// Updated interface to match crm_leads table schema
interface Lead {
  id: string;
  full_name: string | null;
  email_lower: string | null;
  phone_e164: string | null;
  lead_source_type: string | null;
  vip: boolean | null;
  pipeline_stage: string | null;
  created_at: string;
  updated_at: string;
}

interface ChatConversation {
  id: string;
  user_name: string | null;
  user_email: string;
  user_phone: string | null;
  messages: any;
  status: string;
  service_type: string | null;
  page_source: string | null;
  rating: number | null;
  rating_feedback: string | null;
  created_at: string;
  updated_at: string;
}

const AdminLeads = () => {
  const navigate = useNavigate();
  const { user, isOwner, loading } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all");
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "chats">("leads");
  const [leadDetailTab, setLeadDetailTab] = useState<"details" | "activity">("details");
  
  // Bulk selection state
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [aiBrokers, setAiBrokers] = useState<{id: string; name: string; status: string | null}[]>([]);

  // Source type categories
  const CHAT_SOURCES = ['ai_chat_support', 'chat_support', 'chat', 'live_chat'];
  const WEBSITE_SOURCES = ['ai_matchmaker', 'contact_form', 'newsletter', 'inquiry_form', 'quiz', 'login', 'signup', 'book', 'video', 'ai_hub', 'property_inquiry', 'website', 'landing_page', 'popup', 'popup_main', 'lead_capture', 'register_interest', 'ai_phone', 'ai_tool', 'market_report', 'matchmaker', 'property_recommendation'];
  const DATABASE_SOURCES = ['csv_import', 'excel_import', 'manual_entry', 'broker_import', 'crm_import', 'import'];
  
  const getSourceCategory = useCallback((source: string | null) => {
    if (!source) return 'other';
    const s = source.toLowerCase();
    if (CHAT_SOURCES.some(cs => s.includes(cs)) || s === 'chat') return 'chat';
    if (WEBSITE_SOURCES.some(ws => s.includes(ws)) || s.includes('form') || s.includes('ai_') || s.includes('website')) return 'website';
    if (DATABASE_SOURCES.some(ds => s.includes(ds)) || s.includes('import')) return 'database';
    return 'other';
  }, []);

  const needsAction = useCallback((lead: Lead) => {
    const stage = lead.pipeline_stage || 'new';
    return stage === 'new' || stage === 'followup' || stage === 'callback' || stage === 'no_answer';
  }, []);
  
  const getSourceDisplayName = useCallback((source: string | null) => {
    if (!source) return 'Unknown';
    const sourceMap: Record<string, string> = {
      'ai_chat_support': 'Chat Support', 'chat_support': 'Chat Support', 'chat': 'Chat', 'live_chat': 'Live Chat',
      'ai_matchmaker': 'AI Matchmaker', 'matchmaker': 'Matchmaker', 'contact_form': 'Contact Form',
      'newsletter': 'Newsletter', 'inquiry_form': 'Inquiry Form', 'quiz': 'Property Quiz',
      'login': 'Login', 'signup': 'Sign Up', 'book': 'Book Download', 'video': 'Video Lead',
      'ai_hub': 'AI Hub', 'ai_tool': 'AI Tool', 'ai_phone': 'AI Phone',
      'property_inquiry': 'Property Inquiry', 'property_recommendation': 'Property Recommendation',
      'market_report': 'Market Report', 'landing_page': 'Landing Page', 'popup': 'Pop-up',
      'popup_main': 'Main Page Pop-up', 'lead_capture': 'Lead Capture', 'register_interest': 'Register Interest',
      'csv_import': 'CSV Import', 'excel_import': 'Excel Import', 'manual_entry': 'Manual Entry',
      'broker_import': 'Broker Import', 'crm_import': 'CRM Import', 'website': 'Website',
    };
    return sourceMap[source] || source.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
  }, []);

  useEffect(() => {
    if (isOwner) {
      fetchData();
      fetchBrokers();
    }
  }, [isOwner]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [leadsResult, chatsResult] = await Promise.all([
        supabase
          .from("crm_leads")
          .select("id, full_name, email_lower, phone_e164, lead_source_type, vip, pipeline_stage, created_at, updated_at")
          .order("created_at", { ascending: false }),
        supabase
          .from("chat_conversations")
          .select("*")
          .order("created_at", { ascending: false }),
      ]);

      if (leadsResult.error) throw leadsResult.error;
      if (chatsResult.error) throw chatsResult.error;

      setLeads(leadsResult.data || []);
      setConversations(chatsResult.data || []);
    } catch (error: any) {
      toast.error(error.message || "Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchBrokers = useCallback(async () => {
    try {
      const { data } = await supabase
        .from("ai_brokers")
        .select("id, name, status")
        .order("name");
      setAiBrokers(data || []);
    } catch {}
  }, []);

  const updateLeadStatus = useCallback(async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({ pipeline_stage: newStatus })
        .eq("id", leadId);
      if (error) throw error;
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, pipeline_stage: newStatus } : lead
        )
      );
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  }, []);

  const toggleVip = useCallback(async (leadId: string, currentVip: boolean | null) => {
    const newVip = !currentVip;
    try {
      const { error } = await supabase
        .from("crm_leads")
        .update({ vip: newVip })
        .eq("id", leadId);
      if (error) throw error;
      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, vip: newVip } : lead
        )
      );
      toast.success(newVip ? "Marked as VIP ⭐" : "VIP removed");
    } catch (error: any) {
      toast.error(error.message || "Failed to update VIP status");
    }
  }, []);

  // Bulk actions
  const toggleSelectAll = useCallback(() => {
    if (selectedLeadIds.size === filteredLeads.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads.map(l => l.id)));
    }
  }, [selectedLeadIds]);

  const toggleSelectLead = useCallback((leadId: string) => {
    setSelectedLeadIds(prev => {
      const next = new Set(prev);
      if (next.has(leadId)) next.delete(leadId);
      else next.add(leadId);
      return next;
    });
  }, []);

  const bulkMarkVip = useCallback(async (vip: boolean) => {
    if (selectedLeadIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const ids = Array.from(selectedLeadIds);
      const { error } = await supabase
        .from("crm_leads")
        .update({ vip })
        .in("id", ids);
      if (error) throw error;
      setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, vip } : l));
      toast.success(`${ids.length} leads ${vip ? 'marked as VIP' : 'unmarked'}`);
      setSelectedLeadIds(new Set());
    } catch (error: any) {
      toast.error(error.message || "Bulk update failed");
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedLeadIds]);

  const bulkUpdateStatus = useCallback(async (status: string) => {
    if (selectedLeadIds.size === 0) return;
    setBulkActionLoading(true);
    try {
      const ids = Array.from(selectedLeadIds);
      const { error } = await supabase
        .from("crm_leads")
        .update({ pipeline_stage: status })
        .in("id", ids);
      if (error) throw error;
      setLeads(prev => prev.map(l => ids.includes(l.id) ? { ...l, pipeline_stage: status } : l));
      toast.success(`${ids.length} leads updated to ${getStatusInfo(status).label}`);
      setSelectedLeadIds(new Set());
    } catch (error: any) {
      toast.error(error.message || "Bulk update failed");
    } finally {
      setBulkActionLoading(false);
    }
  }, [selectedLeadIds]);

  const updateChatStatus = useCallback(async (chatId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("chat_conversations")
        .update({ status: newStatus })
        .eq("id", chatId);
      if (error) throw error;
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === chatId ? { ...chat, status: newStatus } : chat
        )
      );
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  }, []);

  const exportToCSV = useCallback(() => {
    const data = activeTab === "leads" ? filteredLeads : filteredConversations;
    if (data.length === 0) { toast.error("No data to export"); return; }
    let csvContent = "";
    if (activeTab === "leads") {
      csvContent = "Name,Email,Phone,Source,VIP,Stage,Created At\n";
      (data as Lead[]).forEach((lead) => {
        csvContent += `"${lead.full_name || ""}","${lead.email_lower || ""}","${lead.phone_e164 || ""}","${lead.lead_source_type || ""}","${lead.vip ? "Yes" : "No"}","${lead.pipeline_stage || "new"}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    } else {
      csvContent = "Name,Email,Phone,Service,Status,Messages,Rating,Created At\n";
      (data as ChatConversation[]).forEach((chat) => {
        const messageCount = Array.isArray(chat.messages) ? chat.messages.length : 0;
        csvContent += `"${chat.user_name || ""}","${chat.user_email}","${chat.user_phone || ""}","${chat.service_type || ""}","${chat.status}","${messageCount}","${chat.rating || ""}","${format(new Date(chat.created_at), "yyyy-MM-dd HH:mm")}"\n`;
      });
    }
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `${activeTab}-export-${format(new Date(), "yyyy-MM-dd")}.csv`;
    link.click();
    toast.success("Export completed");
  }, [activeTab]);

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.email_lower?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.phone_e164 || "").includes(searchQuery);
      const matchesStatus = statusFilter === "all" || lead.pipeline_stage === statusFilter;
      const matchesSource = sourceFilter === "all" || lead.lead_source_type === sourceFilter;
      const matchesSourceType = sourceTypeFilter === "all" 
        || (sourceTypeFilter === "needs_action" && needsAction(lead))
        || (sourceTypeFilter === "vip" && lead.vip)
        || getSourceCategory(lead.lead_source_type) === sourceTypeFilter;
      return matchesSearch && matchesStatus && matchesSource && matchesSourceType;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter, sourceTypeFilter, getSourceCategory, needsAction]);

  const filteredConversations = useMemo(() => {
    return conversations.filter((chat) => {
      const matchesSearch =
        (chat.user_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        chat.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (chat.user_phone || "").includes(searchQuery);
      const matchesStatus = statusFilter === "all" || chat.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [conversations, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const today = new Date();
    const newToday = leads.filter((l) => {
      const leadDate = new Date(l.created_at);
      return leadDate.toDateString() === today.toDateString();
    }).length;
    const qualified = leads.filter((l) => l.pipeline_stage === "qualified").length;
    const junk = leads.filter((l) => l.pipeline_stage === "junk" || l.pipeline_stage === "disqualified" || l.pipeline_stage === "spam").length;
    const vipCount = leads.filter(l => l.vip).length;
    const actionNeeded = leads.filter(l => needsAction(l)).length;
    return { newToday, qualified, junk, vipCount, actionNeeded };
  }, [leads, needsAction]);

  const uniqueSources = useMemo(() => [...new Set(leads.map((l) => l.lead_source_type).filter(Boolean))], [leads]);

  const handleTabSwitch = useCallback((tab: "leads" | "chats") => {
    setActiveTab(tab);
    setSelectedLeadIds(new Set());
  }, []);

  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setLeadDetailTab("details");
  }, []);

  const handleSelectConversation = useCallback((chat: ChatConversation) => {
    setSelectedConversation(chat);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!isOwner) return null;

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/admin")} className="text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-all">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Leads & Conversations
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={fetchData} className="border-zinc-700 text-white hover:bg-zinc-800 cursor-pointer active:scale-95 transition-all">
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button onClick={exportToCSV} className="bg-gold hover:bg-gold/90 text-black cursor-pointer active:scale-95 transition-all">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-6 gap-4 mb-8">
          <div className="bg-zinc-900 border-2 border-gold/60 rounded-xl p-5 hover:shadow-lg hover:shadow-gold/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gold" />
              <span className="text-gray-400 text-sm">Total</span>
            </div>
            <p className="text-white text-3xl font-bold">{leads.length}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-purple-500/60 rounded-xl p-5 hover:shadow-lg hover:shadow-purple-500/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span className="text-gray-400 text-sm">Chats</span>
            </div>
            <p className="text-white text-3xl font-bold">{conversations.length}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-blue-500/60 rounded-xl p-5 hover:shadow-lg hover:shadow-blue-500/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400 text-sm">New Today</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.newToday}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-amber-500/60 rounded-xl p-5 hover:shadow-lg hover:shadow-amber-500/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="text-gray-400 text-sm">Needs Action</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.actionNeeded}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-yellow-500/60 rounded-xl p-5 hover:shadow-lg hover:shadow-yellow-500/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <Star className="w-5 h-5 text-yellow-500" />
              <span className="text-gray-400 text-sm">VIP</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.vipCount}</p>
          </div>
          <div className="bg-zinc-900 border-2 border-green-500/60 rounded-xl p-5 hover:shadow-lg hover:shadow-green-500/20 transition-all">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-gray-400 text-sm">Qualified</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.qualified}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => handleTabSwitch("leads")}
            className={`cursor-pointer active:scale-95 transition-all ${activeTab === "leads" ? "bg-gold text-black hover:bg-gold/90" : "border-zinc-700 text-white hover:bg-zinc-800"}`}
          >
            <Users className="w-4 h-4 mr-2" />
            Leads ({leads.length})
          </Button>
          <Button
            variant={activeTab === "chats" ? "default" : "outline"}
            onClick={() => handleTabSwitch("chats")}
            className={`cursor-pointer active:scale-95 transition-all ${activeTab === "chats" ? "bg-purple-600 text-white hover:bg-purple-600/90" : "border-zinc-700 text-white hover:bg-zinc-800"}`}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            AI Chat Sessions ({conversations.length})
          </Button>
        </div>

        {/* Bulk Actions Bar */}
        {selectedLeadIds.size > 0 && (
          <div className="bg-gold/10 border border-gold/40 rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
            <p className="text-gold font-semibold text-sm">
              <CheckSquare className="w-4 h-4 inline mr-2" />
              {selectedLeadIds.size} lead{selectedLeadIds.size > 1 ? 's' : ''} selected
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <Button size="sm" onClick={() => bulkMarkVip(true)} disabled={bulkActionLoading}
                className="bg-yellow-600 hover:bg-yellow-700 text-white">
                <Star className="w-3 h-3 mr-1" /> Mark VIP
              </Button>
              <Button size="sm" onClick={() => bulkMarkVip(false)} disabled={bulkActionLoading}
                className="bg-zinc-700 hover:bg-zinc-600 text-white">
                <Star className="w-3 h-3 mr-1" /> Remove VIP
              </Button>
              <Popover>
                <PopoverTrigger asChild>
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-700 text-white" disabled={bulkActionLoading}>
                    <Activity className="w-3 h-3 mr-1" /> Change Status
                    <ChevronDown className="w-3 h-3 ml-1" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2 bg-zinc-900 border-zinc-700 z-[10001]" align="start">
                  <div className="space-y-1 max-h-72 overflow-y-auto">
                    <p className="text-xs font-semibold text-emerald-400 px-2 py-1">Positive</p>
                    {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                      <button key={status.value} onClick={() => bulkUpdateStatus(status.value)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-sm text-white">{status.label}</span>
                      </button>
                    ))}
                    <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">Neutral</p>
                    {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                      <button key={status.value} onClick={() => bulkUpdateStatus(status.value)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-sm text-white">{status.label}</span>
                      </button>
                    ))}
                    <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">Negative</p>
                    {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                      <button key={status.value} onClick={() => bulkUpdateStatus(status.value)}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        <span className="text-sm text-white">{status.label}</span>
                      </button>
                    ))}
                  </div>
                </PopoverContent>
              </Popover>
              {aiBrokers.length > 0 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white" disabled={bulkActionLoading}>
                      <UserPlus className="w-3 h-3 mr-1" /> Assign Broker
                      <ChevronDown className="w-3 h-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-56 p-2 bg-zinc-900 border-zinc-700 z-[10001]" align="start">
                    <div className="space-y-1 max-h-60 overflow-y-auto">
                      {aiBrokers.map(broker => (
                        <button key={broker.id} onClick={() => toast.success(`Assigned ${selectedLeadIds.size} leads to ${broker.name}`)}
                          className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                          <Bot className="w-3 h-3 text-emerald-400" />
                          <span className="text-sm text-white">{broker.name}</span>
                          <Badge variant="outline" className="ml-auto text-[9px] border-zinc-700 text-zinc-400">{broker.status}</Badge>
                        </button>
                      ))}
                    </div>
                  </PopoverContent>
                </Popover>
              )}
              <Button size="sm" variant="ghost" onClick={() => setSelectedLeadIds(new Set())} className="text-zinc-400 hover:text-white">
                Clear
              </Button>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <Input
                placeholder="Search by name, email, or phone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-zinc-950 border-zinc-700 text-white placeholder:text-gray-500"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTriggerDark className="w-48 cursor-pointer">
                  <SelectValue placeholder="Status" />
                </SelectTriggerDark>
                <SelectContentDark className="max-h-80">
                  <SelectItemDark value="all">All Statuses</SelectItemDark>
                  <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Positive</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                    <SelectItemDark key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItemDark>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Neutral</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                    <SelectItemDark key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItemDark>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">Negative</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                    <SelectItemDark key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>
            </div>
            {activeTab === "leads" && (
              <>
                <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                  <SelectTriggerDark className="w-52 cursor-pointer">
                    <SelectValue placeholder="Source Type" />
                  </SelectTriggerDark>
                  <SelectContentDark className="max-h-96">
                    <SelectItemDark value="all"><span className="flex items-center gap-2"><Filter className="w-3 h-3 text-gold" />All Sources</span></SelectItemDark>
                    <div className="px-2 py-1.5 text-xs font-bold text-gold uppercase tracking-wide border-t border-zinc-700/50 mt-1">Main Categories</div>
                    <SelectItemDark value="chat"><span className="flex items-center gap-2"><MessageSquare className="w-3 h-3 text-purple-400" />Chat Leads</span></SelectItemDark>
                    <SelectItemDark value="website"><span className="flex items-center gap-2"><Globe className="w-3 h-3 text-emerald-400" />Website Leads</span></SelectItemDark>
                    <SelectItemDark value="database"><span className="flex items-center gap-2"><Upload className="w-3 h-3 text-blue-400" />Database / Import</span></SelectItemDark>
                    <SelectItemDark value="vip"><span className="flex items-center gap-2"><Star className="w-3 h-3 text-yellow-400" />VIP Only</span></SelectItemDark>
                    <SelectItemDark value="needs_action"><span className="flex items-center gap-2"><AlertTriangle className="w-3 h-3 text-amber-400" />Needs Action</span></SelectItemDark>
                  </SelectContentDark>
                </Select>
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTriggerDark className="w-52 cursor-pointer">
                    <SelectValue placeholder="Specific Source" />
                  </SelectTriggerDark>
                  <SelectContentDark className="max-h-80">
                    <SelectItemDark value="all">All Specific Sources</SelectItemDark>
                    <div className="px-2 py-1.5 text-xs font-bold text-purple-400 uppercase tracking-wide border-t border-zinc-700/50 mt-1">Chat Sources</div>
                    {['ai_chat_support', 'chat_support', 'chat', 'live_chat'].map(s => {
                      const exists = uniqueSources.includes(s);
                      return (
                        <SelectItemDark key={s} value={s}>
                          <span className={`flex items-center gap-2 ${!exists ? 'opacity-50' : ''}`}>
                            <MessageSquare className="w-3 h-3 text-purple-400" />
                            {getSourceDisplayName(s)}
                            {!exists && <span className="text-[10px] text-zinc-500 ml-1">(0)</span>}
                          </span>
                        </SelectItemDark>
                      );
                    })}
                    <div className="px-2 py-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wide border-t border-zinc-700/50 mt-1">Website Sources</div>
                    {['landing_page', 'popup', 'popup_main', 'contact_form', 'register_interest', 'inquiry_form', 'newsletter', 'property_inquiry', 'property_recommendation', 'ai_matchmaker', 'matchmaker', 'ai_phone', 'ai_tool', 'ai_hub', 'market_report', 'book', 'video', 'quiz', 'signup', 'login', 'lead_capture', 'website'].map(s => {
                      const exists = uniqueSources.includes(s);
                      return (
                        <SelectItemDark key={s} value={s}>
                          <span className={`flex items-center gap-2 ${!exists ? 'opacity-50' : ''}`}>
                            <Globe className="w-3 h-3 text-emerald-400" />
                            {getSourceDisplayName(s)}
                            {!exists && <span className="text-[10px] text-zinc-500 ml-1">(0)</span>}
                          </span>
                        </SelectItemDark>
                      );
                    })}
                  </SelectContentDark>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1,2,3,4,5].map(i => <Skeleton key={i} className="h-12 w-full bg-zinc-800" />)}
            </div>
          ) : activeTab === "leads" ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-zinc-950 sticky top-0">
                  <TableRow>
                    <TableHead className="text-gray-400 w-10">
                      <Checkbox
                        checked={selectedLeadIds.size === filteredLeads.length && filteredLeads.length > 0}
                        onCheckedChange={toggleSelectAll}
                        className="border-zinc-600 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                      />
                    </TableHead>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Contact</TableHead>
                    <TableHead className="text-gray-400">Source</TableHead>
                    <TableHead className="text-gray-400">VIP</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLeads.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-gray-500 py-10">No leads found</TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => {
                      const isChat = getSourceCategory(lead.lead_source_type) === 'chat';
                      const alertNeeded = needsAction(lead);
                      const isSelected = selectedLeadIds.has(lead.id);
                      return (
                        <TableRow key={lead.id} className={`border-t border-zinc-800 hover:bg-zinc-950/50 transition-colors ${alertNeeded ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : ''} ${isSelected ? 'bg-gold/5' : ''}`}>
                          <TableCell>
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => toggleSelectLead(lead.id)}
                              className="border-zinc-600 data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                            />
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              {alertNeeded && <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 animate-pulse" />}
                              <p className="text-white font-medium">{lead.full_name || "—"}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 text-gray-300 text-sm">
                                <Mail className="w-3 h-3" />
                                {lead.email_lower || "—"}
                              </div>
                              {lead.phone_e164 && (
                                <div className="flex items-center gap-2 text-gray-400 text-sm">
                                  <Phone className="w-3 h-3" />
                                  {lead.phone_e164}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`border-zinc-700 ${isChat ? 'text-purple-300 border-purple-500/40 bg-purple-500/10' : 'text-gray-300'}`}>
                              {isChat && <MessageSquare className="w-3 h-3 mr-1" />}
                              {getSourceDisplayName(lead.lead_source_type)}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <button
                              onClick={() => toggleVip(lead.id, lead.vip)}
                              className="cursor-pointer active:scale-90 transition-transform"
                            >
                              {lead.vip ? (
                                <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                              ) : (
                                <Star className="w-5 h-5 text-zinc-600 hover:text-yellow-400 transition-colors" />
                              )}
                            </button>
                          </TableCell>
                          <TableCell>
                            <Popover>
                              <PopoverTrigger asChild>
                                <div className="group flex items-center gap-1 cursor-pointer">
                                  <LeadStatusBadge status={lead.pipeline_stage || "new"} size="sm" />
                                  <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                                </div>
                              </PopoverTrigger>
                              <PopoverContent className="w-56 p-2 bg-zinc-900 border-zinc-700 z-[10001]" align="start">
                                <div className="space-y-1 max-h-72 overflow-y-auto">
                                  <p className="text-xs font-semibold text-emerald-400 px-2 py-1">Positive</p>
                                  {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                                    <button key={status.value} onClick={() => updateLeadStatus(lead.id, status.value)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                                      <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                      <span className="text-sm text-white">{status.label}</span>
                                    </button>
                                  ))}
                                  <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">Neutral</p>
                                  {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                                    <button key={status.value} onClick={() => updateLeadStatus(lead.id, status.value)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                                      <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                      <span className="text-sm text-white">{status.label}</span>
                                    </button>
                                  ))}
                                  <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">Negative</p>
                                  {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                                    <button key={status.value} onClick={() => updateLeadStatus(lead.id, status.value)}
                                      className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                                      <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                      <span className="text-sm text-white">{status.label}</span>
                                    </button>
                                  ))}
                                </div>
                              </PopoverContent>
                            </Popover>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2 text-gray-400 text-sm">
                              <Calendar className="w-3 h-3" />
                              {format(new Date(lead.created_at), "MMM d, yyyy")}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-1 justify-end">
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={`https://wa.me/${lead.phone_e164?.replace(/[^0-9]/g, '')}`}
                                      target="_blank" rel="noopener noreferrer"
                                      className={`p-1.5 rounded-lg transition-all ${lead.phone_e164 ? 'text-green-400 hover:bg-green-600/20 cursor-pointer' : 'text-zinc-700 cursor-not-allowed'}`}
                                      onClick={(e) => !lead.phone_e164 && e.preventDefault()}>
                                      <MessageCircle className="w-4 h-4" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-white">WhatsApp</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={`tel:${lead.phone_e164}`}
                                      className={`p-1.5 rounded-lg transition-all ${lead.phone_e164 ? 'text-blue-400 hover:bg-blue-600/20 cursor-pointer' : 'text-zinc-700 cursor-not-allowed'}`}
                                      onClick={(e) => !lead.phone_e164 && e.preventDefault()}>
                                      <PhoneCall className="w-4 h-4" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-white">Call</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <a href={`mailto:${lead.email_lower}`}
                                      className={`p-1.5 rounded-lg transition-all ${lead.email_lower ? 'text-purple-400 hover:bg-purple-600/20 cursor-pointer' : 'text-zinc-700 cursor-not-allowed'}`}
                                      onClick={(e) => !lead.email_lower && e.preventDefault()}>
                                      <Mail className="w-4 h-4" />
                                    </a>
                                  </TooltipTrigger>
                                  <TooltipContent className="bg-zinc-800 border-zinc-700 text-white">Email</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                              <Button variant="ghost" size="sm" onClick={() => handleSelectLead(lead)}
                                className="text-gold hover:text-gold/80 cursor-pointer active:scale-95 transition-all">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          ) : (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-zinc-950 sticky top-0">
                  <TableRow>
                    <TableHead className="text-gray-400">User</TableHead>
                    <TableHead className="text-gray-400">Contact</TableHead>
                    <TableHead className="text-gray-400">Service</TableHead>
                    <TableHead className="text-gray-400">Messages</TableHead>
                    <TableHead className="text-gray-400">Status</TableHead>
                    <TableHead className="text-gray-400">Date</TableHead>
                    <TableHead className="text-gray-400 text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredConversations.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center text-gray-500 py-10">No conversations found</TableCell>
                    </TableRow>
                  ) : (
                    filteredConversations.map((chat) => (
                      <TableRow key={chat.id} className="border-t border-zinc-800 hover:bg-zinc-950/50 transition-colors">
                        <TableCell><p className="text-white font-medium">{chat.user_name || "Anonymous"}</p></TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-300 text-sm"><Mail className="w-3 h-3" />{chat.user_email}</div>
                            {chat.user_phone && <div className="flex items-center gap-2 text-gray-400 text-sm"><Phone className="w-3 h-3" />{chat.user_phone}</div>}
                          </div>
                        </TableCell>
                        <TableCell><Badge variant="outline" className="text-gray-300 border-zinc-700">{chat.service_type || "General"}</Badge></TableCell>
                        <TableCell><span className="text-gray-400">{Array.isArray(chat.messages) ? chat.messages.length : 0} messages</span></TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <div className="group flex items-center gap-1 cursor-pointer">
                                <LeadStatusBadge status={chat.status || "new"} size="sm" />
                                <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                              </div>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 bg-zinc-900 border-zinc-700 z-[10001]" align="start">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-emerald-400 px-2 py-1">Positive</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                                  <button key={status.value} onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">Neutral</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                                  <button key={status.value} onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">Negative</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                                  <button key={status.value} onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer">
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                              </div>
                            </PopoverContent>
                          </Popover>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <Calendar className="w-3 h-3" />
                            {format(new Date(chat.created_at), "MMM d, yyyy")}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="sm" onClick={() => handleSelectConversation(chat)} className="text-gold hover:text-gold/80 cursor-pointer active:scale-95 transition-all">
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </div>
      </main>

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              {selectedLead?.full_name || "Lead Details"}
              {selectedLead?.vip && (
                <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
                  <Star className="w-3 h-3 mr-1 fill-yellow-400" /> VIP
                </Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* VIP + Assign quick actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <Button size="sm" onClick={() => toggleVip(selectedLead.id, selectedLead.vip)}
                  className={selectedLead.vip 
                    ? "bg-yellow-600 hover:bg-yellow-700 text-white" 
                    : "bg-zinc-800 hover:bg-zinc-700 text-zinc-300"}>
                  <Star className={`w-3 h-3 mr-1 ${selectedLead.vip ? 'fill-white' : ''}`} />
                  {selectedLead.vip ? 'Remove VIP' : 'Mark as VIP'}
                </Button>
                <LeadStatusBadge status={selectedLead.pipeline_stage || "new"} size="md" />
              </div>

              {/* Tab bar */}
              <div className="flex gap-1 bg-zinc-950 rounded-lg p-1 flex-shrink-0 border border-zinc-800">
                <button onClick={() => setLeadDetailTab("details")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${leadDetailTab === "details" ? "bg-zinc-800 text-white shadow" : "text-zinc-400 hover:text-white"}`}>
                  <span className="flex items-center justify-center gap-2"><Eye className="w-3.5 h-3.5" />Lead Details</span>
                </button>
                <button onClick={() => setLeadDetailTab("activity")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${leadDetailTab === "activity" ? "bg-gold text-black shadow" : "text-zinc-400 hover:text-white"}`}>
                  <span className="flex items-center justify-center gap-2"><Activity className="w-3.5 h-3.5" />Activity Timeline</span>
                </button>
              </div>

              <div className="flex-1 min-h-0 overflow-y-auto">
                {leadDetailTab === "details" ? (
                  <div className="space-y-5">
                    {/* Contact Quick Actions */}
                    <div className="flex flex-wrap gap-2 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                      <a href={`https://wa.me/${selectedLead.phone_e164?.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 ${selectedLead.phone_e164 ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-zinc-800 text-gray-500 cursor-not-allowed'}`}
                        onClick={(e) => !selectedLead.phone_e164 && e.preventDefault()}>
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                      <a href={`tel:${selectedLead.phone_e164}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 ${selectedLead.phone_e164 ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-zinc-800 text-gray-500 cursor-not-allowed'}`}
                        onClick={(e) => !selectedLead.phone_e164 && e.preventDefault()}>
                        <PhoneCall className="w-4 h-4" /> Call
                      </a>
                      <a href={`mailto:${selectedLead.email_lower}`}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 ${selectedLead.email_lower ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-zinc-800 text-gray-500 cursor-not-allowed'}`}
                        onClick={(e) => !selectedLead.email_lower && e.preventDefault()}>
                        <Mail className="w-4 h-4" /> Email
                      </a>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-zinc-950 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Full Name</p>
                        <p className="text-white font-medium text-lg">{selectedLead.full_name || "Not provided"}</p>
                      </div>
                      <div className="p-3 bg-zinc-950 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Email</p>
                        <p className="text-white">{selectedLead.email_lower || "Not provided"}</p>
                      </div>
                      <div className="p-3 bg-zinc-950 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Phone</p>
                        <p className="text-white">{selectedLead.phone_e164 || "Not provided"}</p>
                      </div>
                      <div className="p-3 bg-zinc-950 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Source</p>
                        <Badge variant="outline" className="text-gray-300 border-zinc-700">
                          {getSourceDisplayName(selectedLead.lead_source_type)}
                        </Badge>
                      </div>
                      <div className="p-3 bg-zinc-950 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Status</p>
                        <LeadStatusBadge status={selectedLead.pipeline_stage || "new"} size="sm" />
                      </div>
                      <div className="p-3 bg-zinc-950 rounded-lg">
                        <p className="text-gray-400 text-sm mb-1">Created</p>
                        <p className="text-white">{format(new Date(selectedLead.created_at), "PPpp")}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <LeadActivityTimeline email={selectedLead.email_lower} />
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Transcript Modal */}
      <ChatTranscriptModal
        isOpen={!!selectedConversation}
        onClose={() => setSelectedConversation(null)}
        conversation={selectedConversation ? {
          id: selectedConversation.id,
          user_name: selectedConversation.user_name || "Anonymous",
          user_email: selectedConversation.user_email,
          user_phone: selectedConversation.user_phone,
          messages: Array.isArray(selectedConversation.messages) ? selectedConversation.messages : [],
          status: selectedConversation.status,
          service_type: selectedConversation.service_type,
          page_source: selectedConversation.page_source,
          rating: selectedConversation.rating,
          rating_feedback: selectedConversation.rating_feedback,
          created_at: selectedConversation.created_at,
          updated_at: selectedConversation.updated_at
        } : null}
      />
    </div>
  );
};

export default AdminLeads;