import { useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface ChatLogEntry {
  session_id: string;
  role: 'user' | 'assistant';
  message: string;
  source: string;
  source_page?: string;
  user_name?: string;
  user_email?: string;
  user_phone?: string;
  metadata?: Record<string, any>;
}

export function useChatHistoryLogger() {
  const { user } = useAuth();

  const logChat = useCallback(async (entry: ChatLogEntry) => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .insert({
          session_id: entry.session_id,
          role: entry.role,
          message: entry.message,
          source: entry.source,
          source_page: entry.source_page || window.location.pathname,
          user_id: user?.id || null,
          user_name: entry.user_name,
          user_email: entry.user_email || user?.email,
          user_phone: entry.user_phone,
          metadata: entry.metadata || {}
        });

      if (error) {
        console.error('Error logging chat:', error);
      }
    } catch (err) {
      console.error('Chat logging failed:', err);
    }
  }, [user]);

  const logConversation = useCallback(async (
    sessionId: string,
    messages: Array<{ role: 'user' | 'assistant'; content: string }>,
    source: string,
    userInfo?: { name?: string; email?: string; phone?: string }
  ) => {
    try {
      const entries = messages.map(msg => ({
        session_id: sessionId,
        role: msg.role,
        message: msg.content,
        source,
        source_page: window.location.pathname,
        user_id: user?.id || null,
        user_name: userInfo?.name,
        user_email: userInfo?.email || user?.email,
        user_phone: userInfo?.phone,
        metadata: {}
      }));

      const { error } = await supabase
        .from('chat_history')
        .insert(entries);

      if (error) {
        console.error('Error logging conversation:', error);
      }
    } catch (err) {
      console.error('Conversation logging failed:', err);
    }
  }, [user]);

  const flagChat = useCallback(async (
    chatId: string, 
    reason: string,
    flaggedBy: string
  ) => {
    try {
      const { error } = await supabase
        .from('chat_history')
        .update({
          is_flagged: true,
          flag_reason: reason,
          flagged_at: new Date().toISOString(),
          flagged_by: flaggedBy
        })
        .eq('id', chatId);

      if (error) {
        console.error('Error flagging chat:', error);
      }
    } catch (err) {
      console.error('Flag chat failed:', err);
    }
  }, []);

  const getChatHistory = useCallback(async (
    filters?: {
      source?: string;
      userId?: string;
      dateFrom?: string;
      dateTo?: string;
      flaggedOnly?: boolean;
    }
  ) => {
    try {
      let query = supabase
        .from('chat_history')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (filters?.source) {
        query = query.eq('source', filters.source);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters?.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters?.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }
      if (filters?.flaggedOnly) {
        query = query.eq('is_flagged', true);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching chat history:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('Fetch chat history failed:', err);
      return [];
    }
  }, []);

  return {
    logChat,
    logConversation,
    flagChat,
    getChatHistory
  };
}
