import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import OwnerGuard from '@/components/OwnerGuard';
import PremiumBackendHeader from '@/components/ui/premium-backend-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
} from '@/components/ui/table';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Search, MessageCircle, Phone, Mail, UserPlus, Clock,
  CheckCircle2, Eye, Send, AlertTriangle, Archive, Filter,
  Building2, MapPin, Calendar, ArrowRight, ExternalLink,
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

type InquiryStatus = 'pending' | 'under_review' | 'response_sent' | 'completed' | 'unable_to_fulfill';

interface Inquiry {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  inquiry_type: string;
  subject: string;
  message: string | null;
  property_name: string | null;
  source: string | null;
  status: string;
  admin_notes: string | null;
  crm_lead_id: string | null;
  whatsapp_clicked_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

const STATUS_CONFIG: Record<InquiryStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: 'Inquiry Received', color: 'bg-amber-100 text-amber-800 border-amber-200', icon: <Clock className="w-3.5 h-3.5" /> },
  under_review: { label: 'Under Review', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Eye className="w-3.5 h-3.5" /> },
  response_sent: { label: 'Response Sent', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: <Send className="w-3.5 h-3.5" /> },
  completed: { label: 'Completed', color: 'bg-green-100 text-green-800 border-green-200', icon: <CheckCircle2 className="w-3.5 h-3.5" /> },
  unable_to_fulfill: { label: 'Unable to Fulfill', color: 'bg-red-100 text-red-800 border-red-200', icon: <AlertTriangle className="w-3.5 h-3.5" /> },
};

const PIPELINE_STAGES: InquiryStatus[] = ['pending', 'under_review', 'response_sent', 'completed'];

const InquiryManagementHub: React.FC = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [replyText, setReplyText] = useState('');
  const [adminNotes, setAdminNotes] = useState('');

  const { data: inquiries = [], isLoading } = useQuery({
    queryKey: ['admin-inquiries'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Inquiry[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, notes }: { id: string; status: string; notes?: string }) => {
      const update: Record<string, unknown> = { status, updated_at: new Date().toISOString() };
      if (notes !== undefined) update.admin_notes = notes;
      if (status === 'completed') update.resolved_at = new Date().toISOString();
      const { error } = await supabase.from('inquiries').update(update).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      toast.success('Inquiry updated');
    },
  });

  const generateLeadMutation = useMutation({
    mutationFn: async (inquiry: Inquiry) => {
      const { data, error } = await supabase.from('crm_leads').insert({
        full_name: inquiry.full_name,
        email: inquiry.email,
        phone: inquiry.phone,
        source: 'inquiry_hub',
        status: 'new',
        notes: `Inquiry: ${inquiry.subject}\n${inquiry.message || ''}`,
        property_interest: inquiry.property_name,
      }).select('id').single();
      if (error) throw error;
      await supabase.from('inquiries').update({ crm_lead_id: data.id }).eq('id', inquiry.id);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-inquiries'] });
      toast.success('Lead generated in CRM');
    },
  });

  const handleWhatsAppClick = (inquiry: Inquiry) => {
    const phone = inquiry.phone?.replace(/[^0-9]/g, '');
    if (!phone) { toast.error('No phone number available'); return; }
    const msg = encodeURIComponent(`Hello ${inquiry.full_name}, regarding your inquiry about "${inquiry.subject}" — `);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
    if (inquiry.status === 'pending') {
      updateStatusMutation.mutate({ id: inquiry.id, status: 'under_review' });
    }
    supabase.from('inquiries').update({ whatsapp_clicked_at: new Date().toISOString() }).eq('id', inquiry.id);
  };

  const filtered = useMemo(() => {
    return inquiries.filter(inq => {
      if (activeTab !== 'all' && inq.status !== activeTab) return false;
      if (typeFilter !== 'all' && inq.inquiry_type !== typeFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return (
          inq.full_name.toLowerCase().includes(q) ||
          inq.email.toLowerCase().includes(q) ||
          inq.subject.toLowerCase().includes(q) ||
          (inq.property_name || '').toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [inquiries, activeTab, typeFilter, search]);

  const counts = useMemo(() => {
    const c: Record<string, number> = { all: inquiries.length };
    inquiries.forEach(i => { c[i.status] = (c[i.status] || 0) + 1; });
    return c;
  }, [inquiries]);

  const inquiryTypes = useMemo(() => {
    const types = new Set(inquiries.map(i => i.inquiry_type));
    return Array.from(types);
  }, [inquiries]);

  const openDetail = (inq: Inquiry) => {
    setSelectedInquiry(inq);
    setAdminNotes(inq.admin_notes || '');
    setReplyText('');
  };

  return (
    <OwnerGuard>
      <div className="min-h-screen bg-gradient-to-b from-[#FDFBF7] to-[#F5F0E6]">
        <PremiumBackendHeader
          title="Inquiry Management Hub"
          subtitle={`${counts.all} total inquiries • ${counts.pending || 0} awaiting action`}
          backTo="/admin"
          backLabel="Owner Panel"
        />

        <div className="px-6 py-6 max-w-[1600px] mx-auto space-y-6">
          {/* Pipeline Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PIPELINE_STAGES.map(stage => {
              const cfg = STATUS_CONFIG[stage];
              return (
                <button
                  key={stage}
                  onClick={() => setActiveTab(stage)}
                  className={`p-4 rounded-2xl border-2 transition-all text-left ${
                    activeTab === stage
                      ? 'border-gold bg-gold/10 shadow-lg shadow-gold/10'
                      : 'border-gold/15 bg-white hover:border-gold/30'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {cfg.icon}
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{cfg.label}</span>
                  </div>
                  <p className="text-3xl font-bold text-black">{counts[stage] || 0}</p>
                </button>
              );
            })}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3 bg-white/80 backdrop-blur rounded-2xl border-2 border-gold/15 p-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <Input
                placeholder="Search by name, email, subject, property..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-[180px]">
                <Filter className="w-4 h-4 mr-2" />
                <SelectValue placeholder="Inquiry Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {inquiryTypes.map(t => (
                  <SelectItem key={t} value={t}>{t.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Tabs + Table */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="bg-white border-2 border-gold/15">
              <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              {PIPELINE_STAGES.map(s => (
                <TabsTrigger key={s} value={s}>
                  {STATUS_CONFIG[s].label} ({counts[s] || 0})
                </TabsTrigger>
              ))}
              <TabsTrigger value="unable_to_fulfill">
                Unable ({counts.unable_to_fulfill || 0})
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="mt-4">
              {isLoading ? (
                <div className="text-center py-20 text-zinc-400">Loading inquiries...</div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                  <Archive className="w-12 h-12 mx-auto text-zinc-300 mb-3" />
                  <p className="text-zinc-500">No inquiries found</p>
                </div>
              ) : (
                <div className="bg-white rounded-2xl border-2 border-gold/15 overflow-hidden shadow-sm">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Contact</TableHead>
                        <TableHead>Inquiry</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Property</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Received</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map(inq => {
                        const statusCfg = STATUS_CONFIG[inq.status as InquiryStatus] || STATUS_CONFIG.pending;
                        return (
                          <TableRow
                            key={inq.id}
                            className="cursor-pointer hover:bg-gold/5 transition-colors"
                            onClick={() => openDetail(inq)}
                          >
                            <TableCell>
                              <div>
                                <p className="font-semibold text-black">{inq.full_name}</p>
                                <p className="text-xs text-zinc-500">{inq.email}</p>
                                {inq.phone && <p className="text-xs text-zinc-400">{inq.phone}</p>}
                              </div>
                            </TableCell>
                            <TableCell>
                              <p className="font-medium text-black line-clamp-1">{inq.subject}</p>
                              {inq.message && <p className="text-xs text-zinc-500 line-clamp-1 mt-0.5">{inq.message}</p>}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className="capitalize text-xs">
                                {inq.inquiry_type.replace(/_/g, ' ')}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {inq.property_name ? (
                                <div className="flex items-center gap-1 text-sm">
                                  <Building2 className="w-3.5 h-3.5 text-gold" />
                                  <span className="line-clamp-1">{inq.property_name}</span>
                                </div>
                              ) : (
                                <span className="text-xs text-zinc-300">—</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge className={`${statusCfg.color} border gap-1`}>
                                {statusCfg.icon}
                                {statusCfg.label}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="text-xs text-zinc-500">
                                <p>{format(new Date(inq.created_at), 'MMM d, yyyy')}</p>
                                <p>{formatDistanceToNow(new Date(inq.created_at), { addSuffix: true })}</p>
                              </div>
                            </TableCell>
                            <TableCell className="text-right">
                              <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                                {inq.phone && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="text-green-600 hover:bg-green-50"
                                    onClick={() => handleWhatsAppClick(inq)}
                                    title="WhatsApp"
                                  >
                                    <MessageCircle className="w-4 h-4" />
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="text-gold hover:bg-gold/10"
                                  onClick={() => openDetail(inq)}
                                  title="View Details"
                                >
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>

        {/* Detail Dialog */}
        <Dialog open={!!selectedInquiry} onOpenChange={open => { if (!open) setSelectedInquiry(null); }}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            {selectedInquiry && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3">
                    <span className="text-xl">{selectedInquiry.subject}</span>
                    <Badge className={`${(STATUS_CONFIG[selectedInquiry.status as InquiryStatus] || STATUS_CONFIG.pending).color} border`}>
                      {(STATUS_CONFIG[selectedInquiry.status as InquiryStatus] || STATUS_CONFIG.pending).label}
                    </Badge>
                  </DialogTitle>
                </DialogHeader>

                <div className="space-y-5 mt-4">
                  {/* Contact Card */}
                  <div className="grid grid-cols-2 gap-4 p-4 bg-gradient-to-br from-gold/5 to-gold/10 rounded-xl border border-gold/20">
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Contact</p>
                      <p className="font-semibold text-black">{selectedInquiry.full_name}</p>
                      <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-600">
                        <Mail className="w-3.5 h-3.5" />
                        <a href={`mailto:${selectedInquiry.email}`} className="hover:text-gold">{selectedInquiry.email}</a>
                      </div>
                      {selectedInquiry.phone && (
                        <div className="flex items-center gap-1.5 mt-1 text-sm text-zinc-600">
                          <Phone className="w-3.5 h-3.5" />
                          <span>{selectedInquiry.phone}</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-1">Details</p>
                      <div className="space-y-1 text-sm">
                        <p><span className="text-zinc-500">Type:</span> <span className="capitalize">{selectedInquiry.inquiry_type.replace(/_/g, ' ')}</span></p>
                        <p><span className="text-zinc-500">Source:</span> {selectedInquiry.source}</p>
                        {selectedInquiry.property_name && (
                          <p className="flex items-center gap-1">
                            <Building2 className="w-3.5 h-3.5 text-gold" />
                            {selectedInquiry.property_name}
                          </p>
                        )}
                        <p className="flex items-center gap-1 text-zinc-400">
                          <Calendar className="w-3.5 h-3.5" />
                          {format(new Date(selectedInquiry.created_at), 'PPpp')}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Message */}
                  {selectedInquiry.message && (
                    <div className="p-4 bg-white rounded-xl border-2 border-gold/15">
                      <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Message</p>
                      <p className="text-sm text-black whitespace-pre-wrap">{selectedInquiry.message}</p>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="flex flex-wrap gap-2">
                    {selectedInquiry.phone && (
                      <Button
                        onClick={() => handleWhatsAppClick(selectedInquiry)}
                        className="bg-green-600 hover:bg-green-700 text-white gap-2"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="gap-2 border-gold/30 hover:bg-gold/10"
                      onClick={() => window.open(`mailto:${selectedInquiry.email}?subject=Re: ${encodeURIComponent(selectedInquiry.subject)}`, '_blank')}
                    >
                      <Mail className="w-4 h-4" /> Email
                    </Button>
                    {selectedInquiry.phone && (
                      <Button
                        variant="outline"
                        className="gap-2 border-gold/30 hover:bg-gold/10"
                        onClick={() => window.open(`tel:${selectedInquiry.phone}`)}
                      >
                        <Phone className="w-4 h-4" /> Call
                      </Button>
                    )}
                    {!selectedInquiry.crm_lead_id && (
                      <Button
                        variant="outline"
                        className="gap-2 border-blue-300 text-blue-700 hover:bg-blue-50"
                        onClick={() => generateLeadMutation.mutate(selectedInquiry)}
                        disabled={generateLeadMutation.isPending}
                      >
                        <UserPlus className="w-4 h-4" /> Generate Lead
                      </Button>
                    )}
                    {selectedInquiry.crm_lead_id && (
                      <Button
                        variant="outline"
                        className="gap-2 border-gold/30"
                        onClick={() => window.open(`/crm/leads/${selectedInquiry.crm_lead_id}`, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4" /> View in CRM
                      </Button>
                    )}
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <p className="text-xs text-zinc-500 uppercase tracking-wide mb-2">Owner Notes</p>
                    <Textarea
                      value={adminNotes}
                      onChange={e => setAdminNotes(e.target.value)}
                      placeholder="Add internal notes about this inquiry..."
                      rows={3}
                    />
                  </div>

                  {/* Status Update */}
                  <div className="flex items-center gap-3 pt-2 border-t border-gold/15">
                    <Select
                      value={selectedInquiry.status}
                      onValueChange={status => {
                        updateStatusMutation.mutate({ id: selectedInquiry.id, status, notes: adminNotes });
                        setSelectedInquiry({ ...selectedInquiry, status, admin_notes: adminNotes });
                      }}
                    >
                      <SelectTrigger className="w-[200px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
                          <SelectItem key={key} value={key}>{cfg.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={() => {
                        updateStatusMutation.mutate({ id: selectedInquiry.id, status: selectedInquiry.status, notes: adminNotes });
                        toast.success('Notes saved');
                      }}
                      className="bg-gold hover:bg-gold/90 text-white"
                    >
                      Save Notes
                    </Button>
                  </div>

                  {selectedInquiry.whatsapp_clicked_at && (
                    <p className="text-xs text-zinc-400 flex items-center gap-1">
                      <MessageCircle className="w-3 h-3" />
                      WhatsApp contacted {formatDistanceToNow(new Date(selectedInquiry.whatsapp_clicked_at), { addSuffix: true })}
                    </p>
                  )}
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </OwnerGuard>
  );
};

export default InquiryManagementHub;
