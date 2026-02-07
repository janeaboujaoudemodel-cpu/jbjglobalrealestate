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
  StickyNote
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";
import { PIPELINE_STATUSES } from "@/components/crm/LeadStatusBadge";
import InlineStatusSelect from "@/components/crm/InlineStatusSelect";
import AddNoteDialog from "@/components/crm/AddNoteDialog";

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
}

const PAGE_SIZE = 25;

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Statuses' },
  ...PIPELINE_STATUSES.map(s => ({ value: s.value, label: s.label }))
];

const SOURCE_OPTIONS = [
  { value: 'all', label: 'All Sources' },
  { value: 'website', label: 'Website' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'referral', label: 'Referral' },
  { value: 'social', label: 'Social Media' },
  { value: 'import', label: 'Import' },
  { value: 'manual', label: 'Manual Entry' },
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
    queryKey: ['crm-leads-inbox', debouncedSearch, statusFilter, sourceFilter, dateStart, dateEnd, page],
    queryFn: async () => {
      // Try with last_activity column first, fallback without it
      const selectFields = 'id, full_name, email_lower, phone_e164, source, pipeline_stage, created_at, updated_at, tags';
      
      let query = supabase
        .from('crm_leads')
        .select(selectFields, { count: 'exact' });

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

      // Apply date range filter (timezone-safe)
      if (dateStart) {
        const startDate = new Date(dateStart + 'T00:00:00');
        query = query.gte('created_at', startDate.toISOString());
      }
      if (dateEnd) {
        const endDate = new Date(dateEnd + 'T23:59:59.999');
        query = query.lte('created_at', endDate.toISOString());
      }

      // Pagination
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
        .select('full_name, email_lower, phone_e164, source, pipeline_stage, created_at, updated_at, tags');

      if (debouncedSearch) {
        query = query.or(`full_name.ilike.%${debouncedSearch}%,email_lower.ilike.%${debouncedSearch}%,phone_e164.ilike.%${debouncedSearch}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('pipeline_stage', statusFilter);
      }
      if (sourceFilter !== 'all') {
        query = query.ilike('source', `%${sourceFilter}%`);
      }
      if (dateStart) {
        const startDate = new Date(dateStart + 'T00:00:00');
        query = query.gte('created_at', startDate.toISOString());
      }
      if (dateEnd) {
        const endDate = new Date(dateEnd + 'T23:59:59.999');
        query = query.lte('created_at', endDate.toISOString());
      }

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

  const openEmail = (email: string, e: React.MouseEvent) => {
    e.stopPropagation();
    window.open(`mailto:${email}`, '_blank');
  };

  // Get last activity display value (use last_activity if exists, fallback to updated_at)
  const getLastActivity = (lead: Lead): string => {
    const activityDate = lead.last_activity || lead.updated_at;
    if (!activityDate) return '—';
    return formatDistanceToNow(new Date(activityDate), { addSuffix: true });
  };

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Leads Inbox</h1>
            <p className="text-zinc-400 text-sm">
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
              className="text-zinc-400 hover:text-white"
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
              onClick={() => navigate('/crm?action=new-lead')}
              className="bg-gold hover:bg-gold/90 text-black"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Lead
            </Button>
          </div>
        </div>

        {/* Filters */}
        <Card className="bg-zinc-900/80 border-zinc-800 mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col gap-3">
              {/* Row 1: Search + Status + Source */}
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                  <Input
                    placeholder="Search by name, email, or phone..."
                    value={search}
                    onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                    className="pl-10 bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500"
                  />
                </div>

                {/* Status Filter */}
                <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px] bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {STATUS_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-zinc-700">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Source Filter */}
                <Select value={sourceFilter} onValueChange={(v) => { setSourceFilter(v); setPage(1); }}>
                  <SelectTrigger className="w-full md:w-[180px] bg-zinc-800 border-zinc-700 text-white">
                    <SelectValue placeholder="Source" />
                  </SelectTrigger>
                  <SelectContent className="bg-zinc-800 border-zinc-700">
                    {SOURCE_OPTIONS.map(opt => (
                      <SelectItem key={opt.value} value={opt.value} className="text-white hover:bg-zinc-700">
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Row 2: Date Range */}
              <div className="flex flex-col md:flex-row gap-3 items-center">
                <div className="flex items-center gap-2 text-sm text-zinc-400">
                  <Calendar className="h-4 w-4" />
                  <span>Date range:</span>
                </div>
                <Input
                  type="date"
                  value={dateStart}
                  onChange={(e) => { setDateStart(e.target.value); setPage(1); }}
                  className="w-full md:w-[160px] bg-zinc-800 border-zinc-700 text-white"
                  placeholder="Start date"
                />
                <span className="text-zinc-500">to</span>
                <Input
                  type="date"
                  value={dateEnd}
                  onChange={(e) => { setDateEnd(e.target.value); setPage(1); }}
                  className="w-full md:w-[160px] bg-zinc-800 border-zinc-700 text-white"
                  placeholder="End date"
                />

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={clearFilters}
                    className="text-zinc-400 hover:text-white ml-auto"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card className="bg-zinc-900/80 border-zinc-800">
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-3">
                {Array.from({ length: 10 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 bg-zinc-800" />
                ))}
              </div>
            ) : leads.length === 0 ? (
              <div className="text-center py-16">
                <Filter className="h-12 w-12 text-zinc-600 mx-auto mb-4" />
                <p className="text-zinc-400 mb-2">
                  {hasActiveFilters ? 'No leads match your filters' : 'No leads yet'}
                </p>
                {hasActiveFilters ? (
                  <Button variant="secondary" size="sm" onClick={clearFilters}>
                    Clear Filters
                  </Button>
                ) : (
                  <Button 
                    onClick={() => navigate('/crm?action=new-lead')}
                    className="bg-gold hover:bg-gold/90 text-black mt-2"
                  >
                    Add First Lead
                  </Button>
                )}
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-zinc-800 hover:bg-transparent">
                        <TableHead className="text-zinc-400">Name</TableHead>
                        <TableHead className="text-zinc-400">Phone</TableHead>
                        <TableHead className="text-zinc-400">Email</TableHead>
                        <TableHead className="text-zinc-400">Source</TableHead>
                        <TableHead className="text-zinc-400">Status</TableHead>
                        <TableHead className="text-zinc-400">Created</TableHead>
                        <TableHead className="text-zinc-400">Last Activity</TableHead>
                        <TableHead className="text-zinc-400 text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leads.map((lead) => (
                        <TableRow 
                          key={lead.id}
                          className="border-zinc-800 hover:bg-zinc-800/50 cursor-pointer"
                          onClick={() => navigate(`/crm/leads/${lead.id}`)}
                        >
                          <TableCell className="font-medium text-white">
                            <div>
                              <p className="font-medium">{lead.full_name}</p>
                              {lead.tags && lead.tags.length > 0 && (
                                <div className="flex gap-1 mt-1">
                                  {lead.tags.slice(0, 2).map((tag, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-zinc-700 text-zinc-300">
                                      {tag}
                                    </Badge>
                                  ))}
                                  {lead.tags.length > 2 && (
                                    <span className="text-xs text-zinc-500">+{lead.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">
                            {lead.phone_e164 || '—'}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm truncate max-w-[180px]">
                            {lead.email_lower || '—'}
                          </TableCell>
                          <TableCell>
                            {lead.source ? (
                              <Badge variant="secondary" className="bg-zinc-700 text-zinc-300">
                                {lead.source}
                              </Badge>
                            ) : (
                              <span className="text-zinc-500">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={(e) => e.stopPropagation()}>
                            <InlineStatusSelect 
                              leadId={lead.id} 
                              currentStatus={lead.pipeline_stage || 'new'} 
                            />
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">
                            {formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })}
                          </TableCell>
                          <TableCell className="text-zinc-400 text-sm">
                            {getLastActivity(lead)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              {lead.phone_e164 && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-green-500 hover:text-green-400 hover:bg-green-500/10"
                                  onClick={(e) => openWhatsApp(lead.phone_e164!, e)}
                                  title="WhatsApp"
                                >
                                  <MessageSquare className="h-4 w-4" />
                                </Button>
                              )}
                              {lead.email_lower && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
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
                                    className="h-8 w-8 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10"
                                    title="Add Note"
                                  >
                                    <StickyNote className="h-4 w-4" />
                                  </Button>
                                }
                              />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-gold hover:text-gold hover:bg-gold/10"
                                onClick={(e) => { e.stopPropagation(); navigate(`/crm/leads/${lead.id}`); }}
                                title="Open"
                              >
                                Open
                                <ExternalLink className="h-3 w-3 ml-1" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-800">
                    <p className="text-sm text-zinc-400">
                      Page {page} of {totalPages}
                    </p>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="text-zinc-400 hover:text-white disabled:opacity-50"
                      >
                        <ChevronLeft className="h-4 w-4 mr-1" />
                        Previous
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="text-zinc-400 hover:text-white disabled:opacity-50"
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
    </div>
  );
}
