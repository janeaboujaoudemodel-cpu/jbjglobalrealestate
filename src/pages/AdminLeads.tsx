import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
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
} from "lucide-react";
import { format } from "date-fns";
import LeadStatusBadge, { PIPELINE_STATUSES, getStatusInfo } from "@/components/crm/LeadStatusBadge";

interface Lead {
  id: string;
  full_name: string | null;
  email: string;
  phone: string | null;
  nationality: string | null;
  language: string | null;
  current_location: string | null;
  age_range: string | null;
  source: string;
  page_source: string | null;
  status: string | null;
  consent_privacy: boolean | null;
  consent_accurate: boolean | null;
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
  const { user, isAdmin, loading } = useAuth();

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

  // Source type categories
  const WEBSITE_SOURCES = ['ai_chat_support', 'ai_matchmaker', 'contact_form', 'newsletter', 'inquiry_form', 'quiz', 'login', 'signup', 'book', 'video', 'ai_hub', 'property_inquiry'];
  const DATABASE_SOURCES = ['csv_import', 'excel_import', 'manual_entry', 'broker_import', 'crm_import'];
  
  const getSourceCategory = (source: string) => {
    if (WEBSITE_SOURCES.includes(source) || source.includes('chat') || source.includes('form') || source.includes('ai_')) return 'website';
    if (DATABASE_SOURCES.includes(source) || source.includes('import')) return 'database';
    return 'other';
  };
  
  const getSourceDisplayName = (source: string) => {
    const sourceMap: Record<string, string> = {
      'ai_chat_support': '💬 Chat Widget',
      'ai_matchmaker': '🤖 AI Matchmaker',
      'contact_form': '📝 Contact Form',
      'newsletter': '📧 Newsletter',
      'inquiry_form': '📋 Inquiry Form',
      'quiz': '🎯 Property Quiz',
      'login': '🔑 Login',
      'signup': '✨ Sign Up',
      'book': '📖 Book CTA',
      'video': '🎬 Video Lead',
      'ai_hub': '🧠 AI Hub',
      'property_inquiry': '🏠 Property Inquiry',
      'csv_import': '📂 CSV Import',
      'excel_import': '📊 Excel Import',
      'manual_entry': '✍️ Manual Entry',
      'broker_import': '👔 Broker Import',
      'crm_import': '💼 CRM Import',
    };
    return sourceMap[source] || source;
  };
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    } else if (!loading && user && !isAdmin) {
      toast.error("You don't have admin access");
      navigate("/");
    }
  }, [user, isAdmin, loading, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchData();
    }
  }, [isAdmin]);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [leadsResult, chatsResult] = await Promise.all([
        supabase
          .from("leads")
          .select("*")
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
  };

  const updateLeadStatus = async (leadId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .eq("id", leadId);

      if (error) throw error;

      setLeads((prev) =>
        prev.map((lead) =>
          lead.id === leadId ? { ...lead, status: newStatus } : lead
        )
      );
      toast.success("Status updated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update status");
    }
  };

  const updateChatStatus = async (chatId: string, newStatus: string) => {
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
  };

  const exportToCSV = () => {
    const data = activeTab === "leads" ? filteredLeads : filteredConversations;
    
    if (data.length === 0) {
      toast.error("No data to export");
      return;
    }

    let csvContent = "";
    
    if (activeTab === "leads") {
      csvContent = "Name,Email,Phone,Nationality,Language,Location,Age Range,Source,Status,Created At\n";
      (data as Lead[]).forEach((lead) => {
        csvContent += `"${lead.full_name || ""}","${lead.email}","${lead.phone || ""}","${lead.nationality || ""}","${lead.language || ""}","${lead.current_location || ""}","${lead.age_range || ""}","${lead.source}","${lead.status || "new"}","${format(new Date(lead.created_at), "yyyy-MM-dd HH:mm")}"\n`;
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
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      (lead.full_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (lead.phone || "").includes(searchQuery);
    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    const matchesSource = sourceFilter === "all" || lead.source === sourceFilter;
    const matchesSourceType = sourceTypeFilter === "all" || getSourceCategory(lead.source) === sourceTypeFilter;
    return matchesSearch && matchesStatus && matchesSource && matchesSourceType;
  });

  const filteredConversations = conversations.filter((chat) => {
    const matchesSearch =
      (chat.user_name?.toLowerCase() || "").includes(searchQuery.toLowerCase()) ||
      chat.user_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (chat.user_phone || "").includes(searchQuery);
    const matchesStatus = statusFilter === "all" || chat.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // getStatusBadge is replaced by LeadStatusBadge component

  const uniqueSources = [...new Set(leads.map((l) => l.source))];

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
      </div>
    );
  }

  if (!isAdmin) {
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
              className="text-gray-400 hover:text-white"
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
              className="border-zinc-700 text-white hover:bg-zinc-800"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
            <Button
              onClick={exportToCSV}
              className="bg-gold hover:bg-gold/90 text-black"
            >
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Users className="w-5 h-5 text-gold" />
              <span className="text-gray-400">Total Leads</span>
            </div>
            <p className="text-white text-3xl font-bold">{leads.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <MessageSquare className="w-5 h-5 text-gold" />
              <span className="text-gray-400">Chat Conversations</span>
            </div>
            <p className="text-white text-3xl font-bold">{conversations.length}</p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <span className="text-gray-400">New Today</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {leads.filter((l) => {
                const today = new Date();
                const leadDate = new Date(l.created_at);
                return leadDate.toDateString() === today.toDateString();
              }).length}
            </p>
          </div>
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <div className="flex items-center gap-3 mb-2">
              <UserCheck className="w-5 h-5 text-green-500" />
              <span className="text-gray-400">Qualified</span>
            </div>
            <p className="text-white text-3xl font-bold">
              {leads.filter((l) => l.status === "qualified").length}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <Button
            variant={activeTab === "leads" ? "default" : "outline"}
            onClick={() => setActiveTab("leads")}
            className={activeTab === "leads" ? "bg-gold text-black" : "border-zinc-700 text-white"}
          >
            <Users className="w-4 h-4 mr-2" />
            Leads ({leads.length})
          </Button>
          <Button
            variant={activeTab === "chats" ? "default" : "outline"}
            onClick={() => setActiveTab("chats")}
            className={activeTab === "chats" ? "bg-gold text-black" : "border-zinc-700 text-white"}
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Chat Transcripts ({conversations.length})
          </Button>
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
                <SelectTrigger className="w-48 bg-zinc-950 border-zinc-700 text-white">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-700 max-h-80">
                  <SelectItem value="all">All Statuses</SelectItem>
                  <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Positive</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Neutral</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-amber-400 uppercase mt-1">Follow-up</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'warning').map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                  <div className="px-2 py-1 text-xs font-semibold text-red-400 uppercase mt-1">Negative</div>
                  {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                    <SelectItem key={status.value} value={status.value}>
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full ${status.color}`} />
                        {status.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {activeTab === "leads" && (
              <>
                {/* Source Type Filter (Website vs Database) */}
                <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                  <SelectTrigger className="w-44 bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue placeholder="Source Type" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700">
                    <SelectItem value="all">
                      <span className="flex items-center gap-2">📊 All Sources</span>
                    </SelectItem>
                    <SelectItem value="website">
                      <span className="flex items-center gap-2">🌐 Website Leads</span>
                    </SelectItem>
                    <SelectItem value="database">
                      <span className="flex items-center gap-2">💾 Database/Import</span>
                    </SelectItem>
                    <SelectItem value="other">
                      <span className="flex items-center gap-2">📁 Other</span>
                    </SelectItem>
                  </SelectContent>
                </Select>
                
                {/* Specific Source Filter */}
                <Select value={sourceFilter} onValueChange={setSourceFilter}>
                  <SelectTrigger className="w-48 bg-zinc-950 border-zinc-700 text-white">
                    <SelectValue placeholder="Specific Source" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-900 border-zinc-700 max-h-64">
                    <SelectItem value="all">All Specific Sources</SelectItem>
                    <div className="px-2 py-1 text-xs font-semibold text-emerald-400 uppercase">Website</div>
                    {uniqueSources.filter(s => getSourceCategory(s) === 'website').map((source) => (
                      <SelectItem key={source} value={source}>
                        {getSourceDisplayName(source)}
                      </SelectItem>
                    ))}
                    <div className="px-2 py-1 text-xs font-semibold text-blue-400 uppercase mt-1">Database/Import</div>
                    {uniqueSources.filter(s => getSourceCategory(s) === 'database').map((source) => (
                      <SelectItem key={source} value={source}>
                        {getSourceDisplayName(source)}
                      </SelectItem>
                    ))}
                    {uniqueSources.filter(s => getSourceCategory(s) === 'other').length > 0 && (
                      <>
                        <div className="px-2 py-1 text-xs font-semibold text-gray-400 uppercase mt-1">Other</div>
                        {uniqueSources.filter(s => getSourceCategory(s) === 'other').map((source) => (
                          <SelectItem key={source} value={source}>
                            {getSourceDisplayName(source)}
                          </SelectItem>
                        ))}
                      </>
                    )}
                  </SelectContent>
                </Select>
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-gold" />
            </div>
          ) : activeTab === "leads" ? (
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader className="bg-zinc-950 sticky top-0">
                  <TableRow>
                    <TableHead className="text-gray-400">Name</TableHead>
                    <TableHead className="text-gray-400">Contact</TableHead>
                    <TableHead className="text-gray-400">Location</TableHead>
                    <TableHead className="text-gray-400">Source</TableHead>
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
                      <TableRow key={lead.id} className="border-t border-zinc-800 hover:bg-zinc-950/50">
                        <TableCell>
                          <div>
                            <p className="text-white font-medium">{lead.full_name || "—"}</p>
                            <p className="text-gray-500 text-sm">{lead.nationality || "—"}</p>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2 text-gray-300 text-sm">
                              <Mail className="w-3 h-3" />
                              {lead.email}
                            </div>
                            {lead.phone && (
                              <div className="flex items-center gap-2 text-gray-400 text-sm">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2 text-gray-400 text-sm">
                            <MapPin className="w-3 h-3" />
                            {lead.current_location || "—"}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-gray-300 border-zinc-700">
                            {lead.source}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Popover>
                            <PopoverTrigger asChild>
                              <button className="group flex items-center gap-1">
                                <LeadStatusBadge status={lead.status || "new"} size="sm" />
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
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
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
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-amber-400 px-2 py-1 mt-2">Follow-up</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'warning').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateLeadStatus(lead.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">Negative</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateLeadStatus(lead.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
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
                            onClick={() => setSelectedLead(lead)}
                            className="text-gold hover:text-gold/80"
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
                      <TableRow key={chat.id} className="border-t border-zinc-800 hover:bg-zinc-950/50">
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
                              <button className="group flex items-center gap-1">
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
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
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
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-amber-400 px-2 py-1 mt-2">Follow-up</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'warning').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
                                  >
                                    <span className={`w-2 h-2 rounded-full ${status.color}`} />
                                    <span className="text-sm text-white">{status.label}</span>
                                  </button>
                                ))}
                                <p className="text-xs font-semibold text-red-400 px-2 py-1 mt-2">Negative</p>
                                {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(status => (
                                  <button
                                    key={status.value}
                                    onClick={() => updateChatStatus(chat.id, status.value)}
                                    className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-zinc-800 text-left transition-colors"
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
                            onClick={() => setSelectedConversation(chat)}
                            className="text-gold hover:text-gold/80"
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

      {/* Lead Detail Modal */}
      <Dialog open={!!selectedLead} onOpenChange={() => setSelectedLead(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Lead Details</DialogTitle>
          </DialogHeader>
          {selectedLead && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">Full Name</p>
                  <p className="text-white font-medium">{selectedLead.full_name || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white">{selectedLead.email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white">{selectedLead.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Nationality</p>
                  <p className="text-white">{selectedLead.nationality || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Language</p>
                  <p className="text-white">{selectedLead.language || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Location</p>
                  <p className="text-white">{selectedLead.current_location || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Age Range</p>
                  <p className="text-white">{selectedLead.age_range || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Source</p>
                  <Badge variant="outline" className="text-gray-300 border-zinc-700">
                    {selectedLead.source}
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Page Source</p>
                  <p className="text-white text-sm">{selectedLead.page_source || "—"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Created</p>
                  <p className="text-white">{format(new Date(selectedLead.created_at), "PPpp")}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 pt-4 border-t border-zinc-800">
                <div className="flex items-center gap-2">
                  {selectedLead.consent_privacy ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-gray-400 text-sm">Privacy Policy Consent</span>
                </div>
                <div className="flex items-center gap-2">
                  {selectedLead.consent_accurate ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                  ) : (
                    <XCircle className="w-4 h-4 text-red-500" />
                  )}
                  <span className="text-gray-400 text-sm">Data Accuracy Consent</span>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Chat Transcript Modal */}
      <Dialog open={!!selectedConversation} onOpenChange={() => setSelectedConversation(null)}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Chat Transcript</DialogTitle>
          </DialogHeader>
          {selectedConversation && (
            <div className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-gray-400 text-sm mb-1">User</p>
                  <p className="text-white font-medium">{selectedConversation.user_name || "Anonymous"}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Email</p>
                  <p className="text-white">{selectedConversation.user_email}</p>
                </div>
                <div>
                  <p className="text-gray-400 text-sm mb-1">Phone</p>
                  <p className="text-white">{selectedConversation.user_phone || "—"}</p>
                </div>
              </div>
              <div>
                <p className="text-gray-400 text-sm mb-2">Conversation</p>
                <ScrollArea className="h-[400px] bg-zinc-950 rounded-lg p-4">
                  <div className="space-y-4">
                    {Array.isArray(selectedConversation.messages) ? (
                      selectedConversation.messages.map((msg: any, index: number) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg px-4 py-2 ${
                              msg.role === "user"
                                ? "bg-gold/20 text-gold"
                                : "bg-zinc-800 text-white"
                            }`}
                          >
                            <p className="text-xs text-gray-500 mb-1">
                              {msg.role === "user" ? "User" : "Assistant"}
                            </p>
                            <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-500 text-center">No messages</p>
                    )}
                  </div>
                </ScrollArea>
              </div>
              {selectedConversation.rating && (
                <div className="flex items-center gap-2 pt-4 border-t border-zinc-800">
                  <span className="text-gray-400 text-sm">Rating:</span>
                  <span className="text-gold font-medium">{selectedConversation.rating}/5</span>
                  {selectedConversation.rating_feedback && (
                    <span className="text-gray-400 text-sm">
                      — {selectedConversation.rating_feedback}
                    </span>
                  )}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminLeads;
