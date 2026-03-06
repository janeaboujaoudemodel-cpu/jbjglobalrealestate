import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  Search, 
  ChevronLeft, 
  ChevronRight, 
  Phone, 
  Mail, 
  Plus,
  Filter,
  X,
  ExternalLink,
  MessageSquare,
  RefreshCw,
  Download,
  Calendar,
  StickyNote,
  Trash2,
  RotateCcw,
  ArchiveRestore
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PIPELINE_STATUSES } from "@/components/crm/LeadStatusBadge";
import InlineStatusSelect from "@/components/crm/InlineStatusSelect";
import AddNoteDialog from "@/components/crm/AddNoteDialog";
import DeleteLeadDialog from "@/components/crm/DeleteLeadDialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

interface Lead {
  id: string;
  full_name: string;
  email_lower: string | null;
  phone_e164: string | null;
  source: string | null;
  pipeline_stage: string;
  created_at: string;
  updated_at: string;
  last_activity?: string | null;
  tags: string[] | null;
  deleted_at?: string | null;
}

const PAGE_SIZE = 25;

// Complete source options
const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'import', label: 'Database Import' },
  { value: 'broker', label: 'Broker' },
  { value: 'referral', label: 'Referral' },
  { value: 'campaign', label: 'Campaign' },
  { value: 'manual', label: 'Manual Entry' },
  { value: 'third_party', label: 'Third-party Platform' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'social', label: 'Social Media' },
];

export default function CRMLeadsInbox() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Filters state
  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'all');
  const [sourceFilter, setSourceFilter] = useState(searchParams.get('source') || 'all');
  const [dateStart, setDateStart] = useState(searchParams.get('date_start') || '');
  const [dateEnd, setDateEnd] = useState(searchParams.get('date_end') || '');
  const [page, setPage] = useState(1);
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [activeView, setActiveView] = useState<'active' | 'deleted'>('active');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [leadToDelete, setLeadToDelete] = useState<Lead | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Update URL params
  useEffect(() => {
    const params = new URLSearchParams();
    if (search) params.set('search', search);
    if (statusFilter !== 'all') params.set('status', statusFilter);
    if (sourceFilter !== 'all') params.set('source', sourceFilter);
    if (dateStart) params.set('date_start', dateStart);
    if (dateEnd) params.set('date_end', dateEnd);
    setSearchParams(params, { replace: true });
  }, [search, statusFilter, sourceFilter, dateStart, dateEnd, setSearchParams]);

  // Fetch leads with filters
  const { data: leadsData, isLoading, isFetching } = useQuery({
    queryKey: ['crm-leads-inbox', debouncedSearch, statusFilter, sourceFilter, dateStart, dateEnd, page, activeView],
    queryFn: async () => {
      const selectFields = 'id, full_name, email_lower, phone_e164, source, pipeline_stage, created_at, updated_at, tags, deleted_at';
      
      let query = supabase
        .from('crm_leads')
        .select(selectFields, { count: 'exact' });

      // Filter by active/deleted
      if (activeView === 'deleted') {
        query = query.not('deleted_at', 'is', null);
      } else {
        query = query.is('deleted_at', null);
      }

      // Apply search filter
      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email_lower.ilike.%${debouncedSearch}%,phone_e164.ilike.%${debouncedSearch}%`);
      }

      // Apply status filter
      if (statusFilter !== 'all') {
        query = query.eq('pipeline_stage', statusFilter);
      }

      // Apply source filter
      if (sourceFilter !== 'all') {
        query = query.ilike('source', `%${sourceFilter}%`);
      }

      // Apply date range filter
      if (dateStart) {
        query = query.gte('created_at', new Date(dateStart + 'T00:00:00').toISOString());
      }
      if (dateEnd) {
        query = query.lte('created_at', new Date(dateEnd + 'T23:59:59.999').toISOString());
      }

      const from = (page - 1) * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      query = query
        .order('created_at', { ascending: false })
        .range(from, to);

      const { data, count, error } = await query;
      if (error) throw error;
      return { leads: data || [], total: count || 0 };
    },
    enabled: !!user,
  });

  const leads = leadsData?.leads || [];
  const totalLeads = leadsData?.total || 0;
  const totalPages = Math.ceil(totalLeads / PAGE_SIZE);

  const clearFilters = () => {
    setSearch('');
    setStatusFilter('all');
    setSourceFilter('all');
    setDateStart('');
    setDateEnd('');
    setPage(1);
  };

  const hasActiveFilters = search || statusFilter !== 'all' || sourceFilter !== 'all' || dateStart || dateEnd;

  const handleRefresh = () => {
    queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
    toast.success('Refreshed');
  };

  const handleExport = async () => {
    try {
      let query = supabase
        .from('crm_leads')
        .select('full_name, email_lower, phone_e164, source, pipeline_stage, created_at, updated_at, tags')
        .is('deleted_at', null);

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email_lower.ilike.%${debouncedSearch}%,phone_e164.ilike.%${debouncedSearch}%`);
      }
      if (statusFilter !== 'all') query = query.eq('pipeline_stage', statusFilter);
      if (sourceFilter !== 'all') query = query.ilike('source', `%${sourceFilter}%`);
      if (dateStart) query = query.gte('created_at', new Date(dateStart + 'T00:00:00').toISOString());
      if (dateEnd) query = query.lte('created_at', new Date(dateEnd + 'T23:59:59.999').toISOString());

      const { data } = await query.order('created_at', { ascending: false });
      
      if (!data || data.length === 0) {
        toast.error('No leads to export');
        return;
      }

      const headers = ['Name', 'Email', 'Phone', 'Source', 'Status', 'Created', 'Last Activity', 'Tags'];
      const csvRows = [
        headers.join(','),
        ...data.map(lead => [
          `"${(lead.full_name || '').replace(/"/g, '""')}"`,
          lead.email_lower || '',
          lead.phone_e164 || '',
          lead.source || '',
          lead.pipeline_stage || '',
          lead.created_at ? format(new Date(lead.created_at), 'yyyy-MM-dd') : '',
          lead.updated_at ? format(new Date(lead.updated_at), 'yyyy-MM-dd') : '',
          `"${(lead.tags || []).join(', ')}"`
        ].join(','))
      ];

      const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `leads-export-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`Exported ${data.length} leads`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('Failed to export');
    }
  };

  const openWhatsApp = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const cleanPhone = phone.replace('+', '');
    window.open(`https://wa.me/${cleanPhone}`, '_blank');
  };

  const openCall = (phone: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `tel:${phone}`;
  };

  const openEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.location.href = `mailto:${email}`;
  };

  const handleSoftDelete = async () => {
    if (!leadToDelete) return;
    try {
      const { error } = await supabase.rpc('crm_soft_delete_leads', {
        p_lead_ids: [leadToDelete.id],
      });
      if (error) throw error;
      toast.success('Lead moved to Recently Deleted');
      setDeleteDialogOpen(false);
      setLeadToDelete(null);
      queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const handleRestore = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('crm_restore_leads', {
        p_lead_ids: [leadId],
      });
      if (error) throw error;
      toast.success('Lead restored');
      queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
    } catch (err: any) {
      toast.error(`Restore failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const handlePermanentDelete = async (leadId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const { error } = await supabase.rpc('crm_hard_delete_leads', {
        p_lead_ids: [leadId],
      });
      if (error) throw error;
      toast.success('Lead permanently deleted');
      queryClient.invalidateQueries({ queryKey: ['crm-leads-inbox'] });
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || 'Unknown error'}`);
    }
  };

  const getLastActivity = (lead: Lead): string => {
    const activityDate = lead.last_activity || lead.updated_at;
    if (!activityDate) return '—';
    return formatDistanceToNow(new Date(activityDate), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8]">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-black">Leads Inbox</h1>
            <p className="text-black/60 text-sm">
              {totalLeads} lead{totalLeads !== 1 ? 's' : ''} total
              {hasActiveFilters && ' (filtered)'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isFetching}
              className="text-black/60 hover:text-black hover:bg-gold/10"
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleExport}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button
              variant="primary"
              onClick={() => navigate('/crm?action=new-lead')}
            >
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Active / Recently Deleted Tabs */}
        <Tabs value={activeView} onValueChange={(v) => { setActiveView(v as 'active' | 'deleted'); setPage(1); }} className="mb-6">
          <TabsList className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 p-1">
            <TabsTrigger value="active" className="tab-trigger-champagne text-black data-[state=active]:text-black px-6 py-2">
              All Leads
            </TabsTrigger>
            <TabsTrigger value="deleted" className="tab-trigger-champagne text-black data-[state=active]:text-black px-6 py-2">
              <Trash2 className="h-4 w-4 mr-2" />
              Recently Deleted
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filters */}
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: Search + Status + Source */}
              <div className="flex flex-col md:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-black/40" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10 bg-white/80 border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[200px] bg-white/80 border-2 border-gold/30 text-black">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30 max-h-[400px]">
                    <SelectItem value="all" className="text-black hover:bg-gold/10 font-medium focus:bg-gold/15 focus:text-black">
                      All Statuses
                    </SelectItem>
                    
                    {/* POSITIVE - Green */}
                    <div className="px-2 py-1.5 text-xs font-bold text-emerald-700 uppercase tracking-wide border-t border-gold/20 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Positive
                    </div>
                    {PIPELINE_STATUSES.filter(s => s.category === 'positive').map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 pl-4 focus:bg-gold/15 focus:text-black">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* NEUTRAL - Blue */}
                    <div className="px-2 py-1.5 text-xs font-bold text-blue-700 uppercase tracking-wide border-t border-gold/20 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-blue-500" />
                      Neutral
                    </div>
                    {PIPELINE_STATUSES.filter(s => s.category === 'neutral').map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 pl-4 focus:bg-gold/15 focus:text-black">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                    
                    {/* NEGATIVE - Red */}
                    <div className="px-2 py-1.5 text-xs font-bold text-red-700 uppercase tracking-wide border-t border-gold/20 mt-1 flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-red-500" />
                      Negative
                    </div>
                    {PIPELINE_STATUSES.filter(s => s.category === 'negative').map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 pl-4 focus:bg-gold/15 focus:text-black">
                        <div className="flex items-center gap-2">
                          <span className="w-2 h-2 rounded-full bg-red-500" />
                          {opt.label}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px] bg-white/80 border-2 border-gold/30 text-black">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/30">
                    {SOURCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-black hover:bg-gold/10 focus:bg-gold/15 focus:text-black">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2: Date Range */}
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex items-center gap-2 text-sm text-black/60">
                  <Calendar className="h-4 w-4" />
                  <span>Date range:</span>
                </div>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => { setDateStart(e.target.value); setPage(1); }}
                  className="w-full md:w-[160px] bg-white/80 border-2 border-gold/30 text-black"
                />
                <span className="text-black/40">to</span>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => { setDateEnd(e.target.value); setPage(1); }}
                  className="w-full md:w-[160px] bg-white/80 border-2 border-gold/30 text-black"
                />

                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-black/60 hover:text-black hover:bg-gold/10 ml-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info banner for deleted leads */}
        {activeView === 'deleted' && (
          <div className="mb-4 p-3 rounded-xl bg-amber-50 border-2 border-amber-200 text-amber-800 text-sm flex items-center gap-2">
            <ArchiveRestore className="h-4 w-4 shrink-0" />
            <span>Leads in this section will be permanently deleted after 30 days. You can restore them anytime before that.</span>
          </div>
        )}

        {/* Leads Table */}
        <Card className="border-2 border-gold/30 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 bg-gold/10" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="h-12 w-12 text-black/30 mx-auto mb-4" />
                <p className="text-black/60 mb-2">
                  {activeView === 'deleted' ? 'No deleted leads' : (hasActiveFilters ? 'No leads match your filters' : 'No leads yet')}
                </p>
                {hasActiveFilters && activeView === 'active' ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : activeView === 'active' ? (
                  <Button 
                    variant="primary"
                    onClick={() => navigate('/crm?action=new-lead')}
                    className="mt-2"
                  >
                    Add First Lead
                  </Button>
                ) : null}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-gold/20 hover:bg-transparent">
                        <TableHead className="text-black/70 font-bold">Name</TableHead>
                        <TableHead className="text-black/70 font-bold">Phone</TableHead>
                        <TableHead className="text-black/70 font-bold">Email</TableHead>
                        <TableHead className="text-black/70 font-bold">Source</TableHead>
                        <TableHead className="text-black/70 font-bold">Status</TableHead>
                        <TableHead className="text-black/70 font-bold">Created</TableHead>
                        {activeView === 'deleted' ? (
                          <TableHead className="text-black/70 font-bold">Deleted</TableHead>
                        ) : (
                          <TableHead className="text-black/70 font-bold">Last Activity</TableHead>
                        )}
                        <TableHead className="text-black/70 font-bold text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow 
                          key={lead.id}
                          className="border-gold/20 hover:bg-gold/5 cursor-pointer"
                          onClick={() => activeView === 'active' && navigate(`/crm/leads/${lead.id}`)}
                        >
                          <TableCell className="font-semibold text-black">
                            <div>
                              <p className="font-semibold">{lead.full_name}</p>
                              {lead.tags && lead.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {lead.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-gold/10 text-black/70 border-gold/20">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {lead.tags.length > 2 && (
                                    <span className="text-xs text-black/40">+{lead.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-black/70 text-sm font-mono">
                            {lead.phone_e164 || '—'}
                          </TableCell>
                          <TableCell className="text-black/70 text-sm truncate max-w-[180px]">
                            {lead.email_lower || '—'}
                          </TableCell>
                          <TableCell>
                            {lead.source ? (
                              <Badge variant="secondary" className="bg-gold/10 text-black/80 border-gold/20">
                                {lead.source}
                              </Badge>
                            ) : (
                              <span className="text-black/40">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <InlineStatusSelect 
                              leadId={lead.id} 
                              currentStatus={lead.pipeline_stage || 'new'} 
                            />
                          </TableCell>
                          <TableCell className="text-black/60 text-sm">
                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-black/60 text-sm">
                            {activeView === 'deleted' && lead.deleted_at
                              ? formatDistanceToNow(new Date(lead.deleted_at), { addSuffix: true })
                              : getLastActivity(lead)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {activeView === 'deleted' ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-emerald-700 hover:text-emerald-800 hover:bg-emerald-100"
                                    onClick={(e) => handleRestore(lead.id, e)}
                                    title="Restore"
                                  >
                                    <RotateCcw className="h-4 w-4 mr-1" />
                                    Restore
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-3 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={(e) => handlePermanentDelete(lead.id, e)}
                                    title="Delete Forever"
                                  >
                                    <Trash2 className="h-4 w-4 mr-1" />
                                    Delete Forever
                                  </Button>
                                </>
                              ) : (
                                <>
                                  {lead.phone_e164 && (
                                    <>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-green-700 hover:text-green-800 hover:bg-green-100"
                                        onClick={(e) => openWhatsApp(lead.phone_e164!, e)}
                                        title="WhatsApp"
                                      >
                                        <MessageSquare className="h-4 w-4" />
                                      </Button>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-blue-700 hover:text-blue-800 hover:bg-blue-100"
                                        onClick={(e) => openCall(lead.phone_e164!, e)}
                                        title="Call"
                                      >
                                        <Phone className="h-4 w-4" />
                                      </Button>
                                    </>
                                  )}
                                  {lead.email_lower && (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-purple-700 hover:text-purple-800 hover:bg-purple-100"
                                      onClick={(e) => openEmail(lead.email_lower!, e)}
                                      title="Email"
                                    >
                                      <Mail className="h-4 w-4" />
                                    </Button>
                                  )}
                                  <AddNoteDialog 
                                    leadId={lead.id} 
                                    leadName={lead.full_name}
                                    trigger={
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-amber-700 hover:text-amber-800 hover:bg-amber-100"
                                        title="Add Note"
                                      >
                                        <StickyNote className="h-4 w-4" />
                                      </Button>
                                    }
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-100"
                                    onClick={(e) => { e.stopPropagation(); setLeadToDelete(lead); setDeleteDialogOpen(true); }}
                                    title="Delete"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="h-8 px-2 text-gold hover:text-black hover:bg-gold/10"
                                    onClick={(e) => { e.stopPropagation(); navigate(`/crm/leads/${lead.id}`); }}
                                    title="Open"
                                  >
                                    Open
                                    <ExternalLink className="h-3 w-3 ml-1" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-gold/20">
                    <p className="text-sm text-black/60">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="text-black/60 hover:text-black hover:bg-gold/10 disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="text-black/60 hover:text-black hover:bg-gold/10 disabled:opacity-50"
                      >
                        Next
                        <ChevronRight className="h-4 w-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Dialog */}
      <DeleteLeadDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        leadName={leadToDelete?.full_name || 'this lead'}
        onConfirm={handleSoftDelete}
      />
    </div>
  );
}
