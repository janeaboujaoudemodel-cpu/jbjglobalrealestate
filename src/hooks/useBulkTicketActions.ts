import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useBulkUpdateTicketStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      ticketIds,
      status,
    }: {
      ticketIds: string[];
      status: string;
    }) => {
      if (ticketIds.length === 0) {
        throw new Error('No tickets selected');
      }

      const { error } = await supabase
        .from('support_tickets')
        .update({ status, updated_at: new Date().toISOString() })
        .in('id', ticketIds);

      if (error) throw error;
      return ticketIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-detail'] });
      toast.success(`Updated ${count} ticket${count > 1 ? 's' : ''}`);
    },
    onError: (error) => {
      console.error('Failed to update tickets:', error);
      toast.error('Failed to update tickets');
    },
  });
}

export function useBulkDeleteTickets() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (ticketIds: string[]) => {
      if (ticketIds.length === 0) {
        throw new Error('No tickets selected');
      }

      // First delete messages for these tickets
      const { error: messagesError } = await supabase
        .from('support_ticket_messages')
        .delete()
        .in('ticket_id', ticketIds);

      if (messagesError) {
        console.error('Error deleting ticket messages:', messagesError);
        // Continue anyway - messages might not exist
      }

      // Then delete the tickets
      const { error } = await supabase
        .from('support_tickets')
        .delete()
        .in('id', ticketIds);

      if (error) throw error;
      return ticketIds.length;
    },
    onSuccess: (count) => {
      queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
      queryClient.invalidateQueries({ queryKey: ['support-ticket-detail'] });
      toast.success(`Deleted ${count} ticket${count > 1 ? 's' : ''}`);
    },
    onError: (error) => {
      console.error('Failed to delete tickets:', error);
      toast.error('Failed to delete tickets');
    },
  });
}
