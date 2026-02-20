import { useEffect, useState, useMemo, useCallback } from "react";
import LeadActivityTimeline from "@/components/admin/LeadActivityTimeline";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  pipeline_stage: string | null; // crm_leads uses pipeline_stage, not status
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

// Use PIPELINE_STATUSES from LeadStatusBadge for consistency

const AdminLeads = () => {
  const navigate = useNavigate();
  const { user, isOwner, loading } = useAuth();

  const [leads, setLeads] = useState<Lead[]>([]);
  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sourceFilter, setSourceFilter] = useState<string>("all");
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>("all"); // website vs database
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [activeTab, setActiveTab] = useState<"leads" | "chats">("leads");
  const [leadDetailTab, setLeadDetailTab] = useState<"details" | "activity">("details");

  // Source type categories
  const WEBSITE_SOURCES = ['ai_chat_support', 'ai_matchmaker', 'contact_form', 'newsletter', 'inquiry_form', 'quiz', 'login', 'signup', 'book', 'video', 'ai_hub', 'property_inquiry', 'website', 'chat'];
  const DATABASE_SOURCES = ['csv_import', 'excel_import', 'manual_entry', 'broker_import', 'crm_import', 'import'];
  
  const getSourceCategory = useCallback((source: string | null) => {
    if (!source) return 'other';
    const s = source.toLowerCase();
    if (WEBSITE_SOURCES.some(ws => s.includes(ws)) || s.includes('chat') || s.includes('form') || s.includes('ai_') || s.includes('website')) return 'website';
    if (DATABASE_SOURCES.some(ds => s.includes(ds)) || s.includes('import')) return 'database';
    return 'other';
  }, []);
  
  const getSourceDisplayName = useCallback((source: string | null) => {
    if (!source) return 'Unknown';
    const sourceMap: Record<string, string> = {
      'ai_chat_support': 'Chat Widget',
      'ai_matchmaker': 'AI Matchmaker',
      'contact_form': 'Contact Form',
      'newsletter': 'Newsletter',
      'inquiry_form': 'Inquiry Form',
      'quiz': 'Property Quiz',
      'login': 'Login',
      'signup': 'Sign Up',
      'book': 'Book CTA',
      'video': 'Video Lead',
      'ai_hub': 'AI Hub',
      'property_inquiry': 'Property Inquiry',
      'csv_import': 'CSV Import',
      'excel_import': 'Excel Import',
      'manual_entry': 'Manual Entry',
      'broker_import': 'Broker Import',
      'crm_import': 'CRM Import',
      'website': 'Website',
      'chat': 'Chat',
    };
    return sourceMap[source] || source;
  }, []);
  // NOTE: Removed page-level redirect logic.
  // Access is now controlled by OwnerGuard at the route level.
  // If this component renders, OwnerGuard has already verified access.

  useEffect(() => {
    if (isOwner) {
      fetchData();
    }
  }, [isOwner]);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      // Use crm_leads table for plaintext PII data (Owner access)
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
    
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

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

  // Memoized filtered data for performance
  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch =
        (lead.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.email_lower?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
        (lead.phone_e164 || "").includes(searchQuery);
      const matchesStatus = statusFilter === "all" || lead.pipeline_stage === statusFilter;
      const matchesSource = sourceFilter === "all" || lead.lead_source_type === sourceFilter;
      const matchesSourceType = sourceTypeFilter === "all" || getSourceCategory(lead.lead_source_type) === sourceTypeFilter;
      return matchesSearch && matchesStatus && matchesSource && matchesSourceType;
    });
  }, [leads, searchQuery, statusFilter, sourceFilter, sourceTypeFilter, getSourceCategory]);

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

  // Stats calculations - memoized
  const stats = useMemo(() => {
    const today = new Date();
    const newToday = leads.filter((l) => {
      const leadDate = new Date(l.created_at);
      return leadDate.toDateString() === today.toDateString();
    }).length;
    
    const qualified = leads.filter((l) => l.pipeline_stage === "qualified").length;
    const junk = leads.filter((l) => l.pipeline_stage === "junk" || l.pipeline_stage === "disqualified" || l.pipeline_stage === "spam").length;
    
    return { newToday, qualified, junk };
  }, [leads]);

  const uniqueSources = useMemo(() => [...new Set(leads.map((l) => l.lead_source_type).filter(Boolean))], [leads]);

  // Handle tab switch
  const handleTabSwitch = useCallback((tab: "leads" | "chats") => {
    setActiveTab(tab);
  }, []);

  // Handle lead selection
  const handleSelectLead = useCallback((lead: Lead) => {
    setSelectedLead(lead);
    setLeadDetailTab("details");
  }, []);

  // Handle conversation selection
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

  if (!isOwner) {
    return null;
  }

  return (
    <div className="min-h-screen bg-zinc-950">
      {/* Header */}
      <header className="border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate("/admin")}
              className="text-gray-400 hover:text-white cursor-pointer active:scale-95 transition-all"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Admin
            </Button>
            <h1 className="text-white text-2xl font-bold" style={{ fontFamily: "Poppins, sans-serif" }}>
              Leads & Conversations
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              onClick={fetchData}
              className="border-zinc-700 text-white hover:bg-zinc-800 cursor-pointer active:scale-95 transition-all"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={exportToCSV}
              className="bg-gold hover:bg-gold/90 text-black cursor-pointer active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Premium Color-Coded Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
          {/* Total Leads - Gold */}
          <div className="bg-zinc-900 border-2 border-gold/60 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-gold/20 transform-gpu">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gold" />
              <span className="text-gray-400">Total Leads</span>
            </div>
            <p className="text-white text-3xl font-bold">{leads.length}</p>
            <p className="text-gold/70 text-sm mt-1">All time</p>
          </div>
          
          {/* Chat Conversations - Purple */}
          <div className="bg-zinc-900 border-2 border-purple-500/60 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/20 transform-gpu">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-purple-500" />
              <span className="text-gray-400">AI Chat Sessions</span>
            </div>
            <p className="text-white text-3xl font-bold">{conversations.length}</p>
            <p className="text-purple-400/70 text-sm mt-1">Website chats</p>
          </div>
          
          {/* New Today - Blue */}
          <div className="bg-zinc-900 border-2 border-blue-500/60 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/20 transform-gpu">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400">New Today</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.newToday}</p>
            <p className="text-blue-400/70 text-sm mt-1">Since midnight</p>
          </div>
          
          {/* Qualified - Green */}
          <div className="bg-zinc-900 border-2 border-green-500/60 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/20 transform-gpu">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-gray-400">Qualified</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.qualified}</p>
            <p className="text-green-400/70 text-sm mt-1">Ready for sales</p>
          </div>
          
          {/* Junk - Red */}
          <div className="bg-zinc-900 border-2 border-red-500/60 rounded-xl p-6 transition-all duration-300 hover:shadow-lg hover:shadow-red-500/20 transform-gpu">
            <div className="flex items-center gap-3 mb-2">
              <Trash2 className="w-5 h-5 text-red-500" />
              <span className="text-gray-400">Junk</span>
            </div>
            <p className="text-white text-3xl font-bold">{stats.junk}</p>
            <p className="text-red-400/70 text-sm mt-1">Disqualified</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => handleTabSwitch("leads")}
            className={`cursor-pointer active:scale-95 transition-all ${
              activeTab === "leads" 
                ? "bg-gold text-black hover:bg-gold/90" 
                : "border-zinc-700 text-white hover:bg-zinc-800"
            }`}
          >
            <Users className="w-4 h-4 mr-2" />
            Leads ({leads.length})
          </Button>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant={activeTab === "chats" ? "default" : "outline"}
                  onClick={() => handleTabSwitch("chats")}
                  className={`cursor-pointer active:scale-95 transition-all ${
                    activeTab === "chats" 
                      ? "bg-purple-600 text-white hover:bg-purple-600/90" 
                      : "border-zinc-700 text-white hover:bg-zinc-800"
                  }`}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  AI Chat Sessions ({conversations.length})
                </Button>
              </TooltipTrigger>
              <TooltipContent className="bg-zinc-800 border-zinc-700 text-white max-w-xs">
                <p>Website AI chat widget conversations where visitors interacted with the AI assistant</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

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
                  <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">🔴 Negative</div>
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
                {/* Source Type Filter (Website vs Database) */}
                <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                  <SelectTriggerDark className="w-44 cursor-pointer">
                    <SelectValue placeholder="Source Type" />
                  </SelectTriggerDark>
                  <SelectContentDark>
                    <SelectItemDark value="all">
                      <span className="flex items-center gap-2">📊 All Sources</span>
                    </SelectItemDark>
                    <SelectItemDark value="website">
                      <span className="flex items-center gap-2">🌐 Website Leads</span>
                    </SelectItemDark>
                    <SelectItemDark value="database">
                      <span className="flex items-center gap-2">💾 Database/Import</span>
                    </SelectItemDark>
                    <SelectItemDark value="other">
                      <span className="flex items-center gap-2">📁 Other</span>
                    </SelectItemDark>
                  </SelectContentDark>
                </Select>
                
                {/* Specific Source Filter */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTriggerDark className="w-48 cursor-pointer">
                    <SelectValue placeholder="Specific Source" />
                  </SelectTriggerDark>
                  <SelectContentDark className="max-h-64">
                    <SelectItemDark value="all">All Specific Sources</SelectItemDark>
                    <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Website</div>
                    {uniqueSources.filter(s => getSourceCategory(s) === 'website').map((source) => (
                      <SelectItemDark key={source} value={source!}>
                        {getSourceDisplayName(source)}
                      </SelectItemDark>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Database/Import</div>
                    {uniqueSources.filter(s => getSourceCategory(s) === 'database').map((source) => (
                      <SelectItemDark key={source} value={source!}>
                        {getSourceDisplayName(source)}
                      </SelectItemDark>
                    ))}
                    {uniqueSources.filter(s => getSourceCategory(s) === 'other').length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase mt-1">Other</div>
                        {uniqueSources.filter(s => getSourceCategory(s) === 'other').map((source) => (
                          <SelectItemDark key={source} value={source!}>
                            {getSourceDisplayName(source)}
                          </SelectItemDark>
                        ))}
                      </>
                    )}
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
              <Skeleton className="h-12 w-full bg-zinc-800" />
              <Skeleton className="h-12 w-full bg-zinc-800" />
              <Skeleton className="h-12 w-full bg-zinc-800" />
              <Skeleton className="h-12 w-full bg-zinc-800" />
              <Skeleton className="h-12 w-full bg-zinc-800" />
            </div>
          ) : activeTab === "leads" ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-zinc-950 sticky top-0">
                  <TableRow>
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
                      <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                        No leads found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLeads.map((lead) => (
                      <TableRow key={lead.id} className="border-t border-zinc-800 hover:bg-zinc-950/50 transition-colors">
                        <TableCell>
                          <div>
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
                          <Badge variant="outline" className="text-gray-300 border-zinc-700">
                            {getSourceDisplayName(lead.lead_source_type)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {lead.vip ? (
                            <Badge className="bg-gold/20 text-gold border-gold/30">VIP</Badge>
                          ) : (
                            <span className="text-gray-500">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="group flex items-center gap-1 cursor-pointer">
                                <LeadStatusBadge status={lead.pipeline_stage || "new"} size="sm" />
                                <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 bg-zinc-900 border-zinc-700" align="start">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-emerald-400 px-2 py-1">Positive</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateLeadStatus(lead.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">Neutral</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateLeadStatus(lead.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">🔴 Negative</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateLeadStatus(lead.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                                  >
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
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectLead(lead)}
                            className="text-gold hover:text-gold/80 cursor-pointer active:scale-95 transition-all"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
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
                      <TableCell colSpan={7} className="text-center text-gray-500 py-10">
                        No conversations found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredConversations.map((chat) => (
                      <TableRow key={chat.id} className="border-t border-zinc-800 hover:bg-zinc-950/50 transition-colors">
                        <TableCell>
                          <p className="text-white font-medium">{chat.user_name || "Anonymous"}</p>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                              <Mail className="w-3 h-3" />
                              {chat.user_email}
                            </div>
                            {chat.user_phone && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Phone className="w-3 h-3" />
                                {chat.user_phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-gray-300 border-zinc-700">
                            {chat.service_type || "General"}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span className="text-gray-400">
                            {Array.isArray(chat.messages) ? chat.messages.length : 0} messages
                          </span>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="group flex items-center gap-1 cursor-pointer">
                                <LeadStatusBadge status={chat.status || "new"} size="sm" />
                                <ChevronDown className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
                              </button>
                            </PopoverTrigger>
                            <PopoverContent className="w-56 p-2 bg-zinc-900 border-zinc-700" align="start">
                              <div className="space-y-1">
                                <p className="text-xs font-semibold text-emerald-400 px-2 py-1">Positive</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-blue-400 px-2 py-1 mt-2">Neutral</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">🔴 Negative</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors cursor-pointer"
                                  >
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
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSelectConversation(chat)}
                            className="text-gold hover:text-gold/80 cursor-pointer active:scale-95 transition-all"
                          >
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

      {/* Lead Detail Modal - Tabbed: Details + Activity Timeline */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="text-xl font-bold flex items-center gap-3">
              {selectedLead?.full_name || "Lead Details"}
              {selectedLead?.vip && (
                <Badge className="bg-gold/20 text-gold border-gold/30">VIP</Badge>
              )}
            </DialogTitle>
          </DialogHeader>

          {selectedLead && (
            <div className="flex flex-col flex-1 min-h-0 gap-4">
              {/* Tab bar */}
              <div className="flex gap-1 bg-zinc-950 rounded-lg p-1 flex-shrink-0 border border-zinc-800">
                <button
                  onClick={() => setLeadDetailTab("details")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    leadDetailTab === "details"
                      ? "bg-zinc-800 text-white shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Eye className="w-3.5 h-3.5" />
                    Lead Details
                  </span>
                </button>
                <button
                  onClick={() => setLeadDetailTab("activity")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-all ${
                    leadDetailTab === "activity"
                      ? "bg-gold text-black shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span className="flex items-center justify-center gap-2">
                    <Activity className="w-3.5 h-3.5" />
                    Activity Timeline
                  </span>
                </button>
              </div>

              {/* Tab Content */}
              <div className="flex-1 min-h-0 overflow-y-auto">
                {leadDetailTab === "details" ? (
                  <div className="space-y-5">
                    {/* Contact Quick Actions */}
                    <div className="flex flex-wrap gap-2 p-4 bg-zinc-950 rounded-xl border border-zinc-800">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`https://wa.me/${selectedLead.phone_e164?.replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
                                selectedLead.phone_e164
                                  ? 'bg-green-600 hover:bg-green-700 text-white'
                                  : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                              }`}
                              onClick={(e) => !selectedLead.phone_e164 && e.preventDefault()}
                            >
                              <MessageCircle className="w-4 h-4" />
                              WhatsApp
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            {selectedLead.phone_e164 ? `Message ${selectedLead.phone_e164}` : 'No phone available'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`tel:${selectedLead.phone_e164}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
                                selectedLead.phone_e164
                                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                  : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                              }`}
                              onClick={(e) => !selectedLead.phone_e164 && e.preventDefault()}
                            >
                              <PhoneCall className="w-4 h-4" />
                              Call
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            {selectedLead.phone_e164 ? `Call ${selectedLead.phone_e164}` : 'No phone available'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <a
                              href={`mailto:${selectedLead.email_lower}`}
                              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all cursor-pointer active:scale-95 ${
                                selectedLead.email_lower
                                  ? 'bg-purple-600 hover:bg-purple-700 text-white'
                                  : 'bg-zinc-800 text-gray-500 cursor-not-allowed'
                              }`}
                              onClick={(e) => !selectedLead.email_lower && e.preventDefault()}
                            >
                              <Mail className="w-4 h-4" />
                              Email
                            </a>
                          </TooltipTrigger>
                          <TooltipContent>
                            {selectedLead.email_lower ? `Email ${selectedLead.email_lower}` : 'No email available'}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
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
          messages: Array.isArray(selectedConversation.messages) 
            ? selectedConversation.messages
            : [],
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
