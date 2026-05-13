/**
 * Owner Inbox Hook - JBJ Global Real Estate
 * Manages unified inbox data for Owner AI Communications OS
 */

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

// Types
export type ChannelType = 'whatsapp' | 'email_gmail' | 'email_hostinger' | 'instagram' | 'facebook' | 'website_chat' | 'voice';
export type ThreadStatus = 'new' | 'needs_reply' | 'waiting' | 'follow_up_due' | 'closed';
export type AssistantType = 'owner' | 'company';
export type MessageDirection = 'inbound' | 'outbound';

export interface CommChannel {
  id: string;
  user_id: string;
  channel_type: ChannelType;
  assistant_type: AssistantType;
  display_name: string;
  identifier: string;
  is_active: boolean;
  last_sync_at: string | null;
  sync_status: string;
  settings: Record<string, unknown>;
  created_at: string;
}

export interface CommThread {
  id: string;
  user_id: string;
  channel_id: string | null;
  channel_type: string;
  assistant_type: AssistantType;
  contact_name: string | null;
  contact_identifier: string;
  contact_avatar_url: string | null;
  lead_id: string | null;
  status: ThreadStatus;
  unread_count: number;
  last_message_preview: string | null;
  last_message_at: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
  // Joined data
  lead?: {
    id: string;
    full_name: string;
  } | null;
}

export interface CommMessage {
  id: string;
  thread_id: string;
  user_id: string;
  direction: MessageDirection;
  sender_name: string | null;
  sender_identifier: string;
  content: string;
  content_type: string;
  voice_url: string | null;
  voice_duration_seconds: number | null;
  attachments: unknown[];
  is_ai_generated: boolean;
  ai_model_used: string | null;
  sent_at: string | null;
  delivered_at: string | null;
  read_at: string | null;
  status: string;
  created_at: string;
}

export interface InboxFilters {
  status?: ThreadStatus | 'all';
  channel?: ChannelType | 'all';
  channelId?: string | 'all';
  assistant?: AssistantType | 'all';
  search?: string;
  linkedOnly?: boolean;
  unreadOnly?: boolean;
}

const channelIcons: Record<ChannelType, string> = {
  whatsapp: '💬',
  email_gmail: '📧',
  email_hostinger: '📧',
  instagram: '📸',
  facebook: '👤',
  website_chat: '🌐',
  voice: '🎙️',
};

export function useOwnerInbox(filters: InboxFilters = {}) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Fetch threads
  const {
    data: threads = [],
    isLoading: threadsLoading,
    error: threadsError,
    refetch: refetchThreads,
  } = useQuery({
    queryKey: ['owner-inbox-threads', filters],
    queryFn: async () => {
      if (!user?.id) return [];

      let query = supabase
        .from('owner_comm_threads')
        .select(`
          *,
          lead:crm_leads(id, full_name)
        `)
        .order('last_message_at', { ascending: false, nullsFirst: false });

      // Apply filters
      if (filters.status && filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.channel && filters.channel !== 'all') {
        query = query.eq('channel_type', filters.channel);
      }
      if (filters.assistant && filters.assistant !== 'all') {
        query = query.eq('assistant_type', filters.assistant);
      }
      if (filters.linkedOnly) {
        query = query.not('lead_id', 'is', null);
      }
      if (filters.unreadOnly) {
        query = query.gt('unread_count', 0);
      }
      if (filters.search) {
        query = query.or(`contact_name.ilike.%${filters.search}%,contact_identifier.ilike.%${filters.search}%`);
      }

      const { data, error } = await query.limit(100);
      if (error) throw error;
      return data as CommThread[];
    },
    enabled: !!user?.id,
    staleTime: 30000,
  });

  // Fetch channels (include inactive to show all historical data)
  const { data: channels = [] } = useQuery({
    queryKey: ['owner-comm-channels'],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('owner_comm_channels')
        .select('*')
        .order('display_name');
      if (error) throw error;
      return data as CommChannel[];
    },
    enabled: !!user?.id,
    staleTime: 60000,
  });

  // Update thread status
  const updateThreadStatus = useMutation({
    mutationFn: async ({ threadId, status }: { threadId: string; status: ThreadStatus }) => {
      const { error } = await supabase
        .from('owner_comm_threads')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-inbox-threads'] });
      toast.success('Thread status updated');
    },
    onError: () => {
      toast.error('Failed to update status');
    },
  });

  // Link thread to lead
  const linkToLead = useMutation({
    mutationFn: async ({ threadId, leadId }: { threadId: string; leadId: string }) => {
      const { error } = await supabase
        .from('owner_comm_threads')
        .update({ lead_id: leadId, updated_at: new Date().toISOString() })
        .eq('id', threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-inbox-threads'] });
      toast.success('Linked to lead');
    },
    onError: () => {
      toast.error('Failed to link');
    },
  });

  // Mark as read
  const markAsRead = useMutation({
    mutationFn: async (threadId: string) => {
      const { error } = await supabase
        .from('owner_comm_threads')
        .update({ unread_count: 0, updated_at: new Date().toISOString() })
        .eq('id', threadId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-inbox-threads'] });
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel('owner-inbox-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'owner_comm_threads',
        },
        () => {
          refetchThreads();
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'owner_comm_messages',
        },
        () => {
          refetchThreads();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetchThreads]);

  // Stats
  const stats = {
    total: threads.length,
    unread: threads.filter(t => t.unread_count > 0).length,
    needsReply: threads.filter(t => t.status === 'needs_reply').length,
    new: threads.filter(t => t.status === 'new').length,
    followUpDue: threads.filter(t => t.status === 'follow_up_due').length,
  };

  return {
    threads,
    channels,
    threadsLoading,
    threadsError,
    stats,
    channelIcons,
    refetchThreads,
    updateThreadStatus: updateThreadStatus.mutate,
    linkToLead: linkToLead.mutate,
    markAsRead: markAsRead.mutate,
    isUpdating: updateThreadStatus.isPending || linkToLead.isPending,
  };
}

// Hook for thread messages
export function useThreadMessages(threadId: string | null) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const {
    data: messages = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['owner-thread-messages', threadId],
    queryFn: async () => {
      if (!threadId || !user?.id) return [];
      const { data, error } = await supabase
        .from('owner_comm_messages')
        .select('*')
        .eq('thread_id', threadId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return data as CommMessage[];
    },
    enabled: !!threadId && !!user?.id,
  });

  // Real-time subscription for messages
  useEffect(() => {
    if (!threadId || !user?.id) return;

    const channel = supabase
      .channel(`thread-messages-${threadId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'owner_comm_messages',
          filter: `thread_id=eq.${threadId}`,
        },
        () => {
          refetch();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [threadId, user?.id, refetch]);

  // Send message
  const sendMessage = useMutation({
    mutationFn: async ({
      content,
      contentType = 'text',
      voiceUrl,
      isAiGenerated = false,
    }: {
      content: string;
      contentType?: string;
      voiceUrl?: string;
      isAiGenerated?: boolean;
    }) => {
      if (!threadId || !user?.id) throw new Error('No thread selected');

      // Get thread info for sender details
      const { data: thread } = await supabase
        .from('owner_comm_threads')
        .select('contact_identifier, channel_type')
        .eq('id', threadId)
        .single();

      const { data, error } = await supabase
        .from('owner_comm_messages')
        .insert({
          thread_id: threadId,
          user_id: user.id,
          direction: 'outbound',
          sender_name: 'Jane Bou Jaoude',
          sender_identifier: thread?.contact_identifier || user.email || 'owner',
          content,
          content_type: contentType,
          voice_url: voiceUrl,
          is_ai_generated: isAiGenerated,
          status: 'sent',
          sent_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      // Update thread
      await supabase
        .from('owner_comm_threads')
        .update({
          last_message_preview: content.substring(0, 100),
          last_message_at: new Date().toISOString(),
          status: 'waiting',
        })
        .eq('id', threadId);

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['owner-thread-messages', threadId] });
      queryClient.invalidateQueries({ queryKey: ['owner-inbox-threads'] });
      toast.success('Message sent');
    },
    onError: () => {
      toast.error('Failed to send message');
    },
  });

  return {
    messages,
    isLoading,
    error,
    refetch,
    sendMessage: sendMessage.mutate,
    isSending: sendMessage.isPending,
  };
}

export default useOwnerInbox;
