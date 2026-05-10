/**
 * Subscribers Panel Component
 * Displays and manages newsletter subscribers
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, 
  Mail, 
  Calendar, 
  Search, 
  Download, 
  UserPlus,
  CheckCircle,
  XCircle,
  MoreHorizontal,
  Trash2,
  RefreshCw,
  UserMinus,
  Send
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface Subscriber {
  id: string;
  email: string;
  source: string | null;
  is_active: boolean;
  created_at: string;
}

interface SubscribersPanelProps {
  count: number;
}

const SubscribersPanel: React.FC<SubscribersPanelProps> = ({ count }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const queryClient = useQueryClient();

  const { data: subscribers, isLoading, refetch } = useQuery({
    queryKey: ['newsletter-subscribers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);
      
      if (error) throw error;
      return data as Subscriber[];
    },
  });

  const handleExport = () => {
    if (!subscribers || subscribers.length === 0) {
      toast.error('No subscribers to export');
      return;
    }

    const csv = [
      ['Email', 'Source', 'Status', 'Subscribed Date'].join(','),
      ...subscribers.map(s => [
        s.email,
        s.source || 'Direct',
        s.is_active ? 'Active' : 'Inactive',
        format(new Date(s.created_at), 'yyyy-MM-dd')
      ].join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscribers_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Subscribers exported');
  };

  const handleToggleStatus = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .update({ is_active: !currentStatus })
      .eq('id', id);

    if (error) {
      toast.error('Failed to update subscriber');
    } else {
      toast.success(currentStatus ? 'Subscriber deactivated' : 'Subscriber activated');
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscriber-count'] });
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase
      .from('newsletter_subscribers')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Failed to delete subscriber');
    } else {
      toast.success('Subscriber removed');
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
      queryClient.invalidateQueries({ queryKey: ['newsletter-subscriber-count'] });
    }
  };

  const filteredSubscribers = subscribers?.filter(s =>
    s.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeCount = subscribers?.filter(s => s.is_active).length || 0;

  // Bulk selection helpers
  const allSelected = filteredSubscribers && filteredSubscribers.length > 0 && selectedIds.length === filteredSubscribers.length;
  const someSelected = selectedIds.length > 0;

  const handleSelectAll = (checked: boolean) => {
    if (checked && filteredSubscribers) {
      setSelectedIds(filteredSubscribers.map(s => s.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedIds(prev => [...prev, id]);
    } else {
      setSelectedIds(prev => prev.filter(i => i !== id));
    }
  };

  const handleBulkDeactivate = async () => {
    for (const id of selectedIds) {
      await supabase.from('newsletter_subscribers').update({ is_active: false }).eq('id', id);
    }
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
    toast.success(`${selectedIds.length} subscribers deactivated`);
  };

  const handleBulkDelete = async () => {
    for (const id of selectedIds) {
      await supabase.from('newsletter_subscribers').delete().eq('id', id);
    }
    setSelectedIds([]);
    queryClient.invalidateQueries({ queryKey: ['newsletter-subscribers'] });
    queryClient.invalidateQueries({ queryKey: ['newsletter-subscriber-count'] });
    toast.success(`${selectedIds.length} subscribers deleted`);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F7F2EA]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100">
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{count}</p>
              <p className="text-xs text-[#1A1A1A]/60">Total Subscribers</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F7F2EA]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{activeCount}</p>
              <p className="text-xs text-[#1A1A1A]/60">Active</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl border-2 border-[#B89555]/30 bg-gradient-to-br from-white/90 via-white/70 to-[#F7F2EA]"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-100">
              <XCircle className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{(subscribers?.length || 0) - activeCount}</p>
              <p className="text-xs text-[#1A1A1A]/60">Inactive</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/50" />
          <Input
            placeholder="Search by email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64 bg-[#FDFBF7] border-[#B89555]/30"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#EFE6D6]/10">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button variant="outline" size="sm" onClick={handleExport} className="border-[#B89555]/40 bg-[#FDFBF7] hover:bg-[#EFE6D6]/10">
            <Download className="h-4 w-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-4 border-[#B89555] border-t-transparent rounded-full" />
        </div>
      ) : filteredSubscribers?.length === 0 ? (
        <div className="text-center py-12 border-2 border-[#B89555]/30 rounded-xl bg-gradient-to-br from-white/80 via-white/60 to-[#F7F2EA]">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-100 flex items-center justify-center">
            <UserPlus className="h-8 w-8 text-purple-600" />
          </div>
          <h3 className="font-semibold mb-2 text-[#1A1A1A]">No subscribers yet</h3>
          <p className="text-sm text-[#1A1A1A]/60">
            Subscribers will appear here when users sign up for your newsletter.
          </p>
        </div>
      ) : (
        <div className="border-2 border-[#B89555]/30 rounded-xl overflow-hidden bg-[#FDFBF7]">
          <Table>
            <TableHeader>
              <TableRow className="border-b-2 border-[#B89555]/20 bg-[#EFE6D6]/5">
                <TableHead className="text-[#1A1A1A] font-semibold">Email</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Source</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Status</TableHead>
                <TableHead className="text-[#1A1A1A] font-semibold">Subscribed</TableHead>
                <TableHead className="text-right text-[#1A1A1A] font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubscribers?.map((subscriber) => (
                <TableRow key={subscriber.id} className="border-b border-[#B89555]/10 hover:bg-[#EFE6D6]/5 transition-colors">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-[#1A1A1A]/50" />
                      <span className="text-[#1A1A1A]">{subscriber.email}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-[#1A1A1A]/70">{subscriber.source || 'Direct'}</TableCell>
                  <TableCell>
                    <Badge className={subscriber.is_active ? 'bg-green-100 text-green-700' : 'bg-[#F7F2EA] text-[#1A1A1A]/70'}>
                      {subscriber.is_active ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-[#1A1A1A]/70">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(subscriber.created_at), 'MMM d, yyyy')}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="hover:bg-[#EFE6D6]/10">
                          <MoreHorizontal className="h-4 w-4 text-[#1A1A1A]" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-[#FDFBF7] border-2 border-[#B89555]/30">
                        <DropdownMenuItem 
                          onClick={() => handleToggleStatus(subscriber.id, subscriber.is_active)}
                          className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
                        >
                          {subscriber.is_active ? (
                            <>
                              <XCircle className="h-4 w-4 mr-2" />
                              Deactivate
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-2" />
                              Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDelete(subscriber.id)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
};

export default SubscribersPanel;
