import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface ChatSession {
  id: string;
  title: string;
  summary: string | null;
  message_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ChatMessage {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  mentions: string[] | null;
  attachments: any;
  task_status: string | null;
  created_at: string;
}

export function useFounderChatSessions() {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Load sessions
  const loadSessions = useCallback(async () => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('founder_chat_sessions')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false });
    
    if (!error && data) {
      setSessions(data as ChatSession[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    loadSessions();
  }, [loadSessions]);

  // Load messages for active session
  const loadMessages = useCallback(async (sessionId: string) => {
    if (!user?.id) return;
    const { data, error } = await supabase
      .from('founder_chat_messages')
      .select('*')
      .eq('session_id', sessionId)
      .eq('user_id', user.id)
      .order('created_at', { ascending: true });
    
    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
  }, [user?.id]);

  useEffect(() => {
    if (activeSessionId) {
      loadMessages(activeSessionId);
    } else {
      setMessages([]);
    }
  }, [activeSessionId, loadMessages]);

  // Create new session
  const createSession = useCallback(async (title?: string): Promise<string | null> => {
    if (!user?.id) return null;
    const { data, error } = await supabase
      .from('founder_chat_sessions')
      .insert({ user_id: user.id, title: title || 'New Chat' })
      .select()
      .single();
    
    if (error) {
      toast.error('Failed to create chat session');
      return null;
    }
    const session = data as ChatSession;
    setSessions(prev => [session, ...prev]);
    setActiveSessionId(session.id);
    setMessages([]);
    return session.id;
  }, [user?.id]);

  // Save a message to the DB
  const saveMessage = useCallback(async (
    sessionId: string,
    role: 'user' | 'assistant',
    content: string,
    mentions?: string[],
    attachments?: any,
    taskStatus?: string
  ) => {
    if (!user?.id) return;
    
    const { data, error } = await supabase
      .from('founder_chat_messages')
      .insert({
        session_id: sessionId,
        user_id: user.id,
        role,
        content,
        mentions: mentions || null,
        attachments: attachments || null,
        task_status: taskStatus || null,
      })
      .select()
      .single();
    
    if (!error && data) {
      setMessages(prev => [...prev, data as ChatMessage]);
      
      // Update session message count and timestamp
      await supabase
        .from('founder_chat_sessions')
        .update({ 
          message_count: messages.length + 1,
          updated_at: new Date().toISOString()
        })
        .eq('id', sessionId);
    }
  }, [user?.id, messages.length]);

  // Update session title
  const updateSessionTitle = useCallback(async (sessionId: string, title: string) => {
    await supabase
      .from('founder_chat_sessions')
      .update({ title })
      .eq('id', sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, title } : s));
  }, []);

  // Delete session
  const deleteSession = useCallback(async (sessionId: string) => {
    const { error } = await supabase
      .from('founder_chat_sessions')
      .delete()
      .eq('id', sessionId);
    
    if (!error) {
      setSessions(prev => prev.filter(s => s.id !== sessionId));
      if (activeSessionId === sessionId) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success('Chat deleted');
    }
  }, [activeSessionId]);

  // Bulk delete
  const bulkDeleteSessions = useCallback(async (ids: string[]) => {
    const { error } = await supabase
      .from('founder_chat_sessions')
      .delete()
      .in('id', ids);
    
    if (!error) {
      setSessions(prev => prev.filter(s => !ids.includes(s.id)));
      if (activeSessionId && ids.includes(activeSessionId)) {
        setActiveSessionId(null);
        setMessages([]);
      }
      toast.success(`${ids.length} chats deleted`);
    }
  }, [activeSessionId]);

  // Clear all chats
  const clearAllSessions = useCallback(async () => {
    if (!user?.id) return;
    const { error } = await supabase
      .from('founder_chat_sessions')
      .delete()
      .eq('user_id', user.id);
    
    if (!error) {
      setSessions([]);
      setActiveSessionId(null);
      setMessages([]);
      toast.success('All chats cleared');
    }
  }, [user?.id]);

  // Save summary for a session
  const saveSummary = useCallback(async (sessionId: string, summary: string) => {
    await supabase
      .from('founder_chat_sessions')
      .update({ summary })
      .eq('id', sessionId);
    setSessions(prev => prev.map(s => s.id === sessionId ? { ...s, summary } : s));
  }, []);

  return {
    sessions,
    activeSessionId,
    setActiveSessionId,
    messages,
    setMessages,
    loading,
    createSession,
    saveMessage,
    updateSessionTitle,
    deleteSession,
    bulkDeleteSessions,
    clearAllSessions,
    saveSummary,
    loadSessions,
  };
}
