import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { allTeamMembers, TeamMember } from '@/config/team-members';
import { toast } from 'sonner';

export interface ChatMessage {
  id: string;
  sender_id: string;
  sender_type: 'user' | 'employee';
  recipient_id: string;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface EmployeeStatus {
  id: string;
  employee_name: string;
  status: 'online' | 'busy' | 'away' | 'offline';
  last_active_at: string;
  is_typing: boolean;
  current_activity: string | null;
}

const RESPONSE_DELAYS = {
  min: 2000,
  max: 6000,
  typing: 1500,
};

export const useEmployeeChat = (selectedEmployeeId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<Map<string, EmployeeStatus>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  const getEmployee = useCallback((id: string): TeamMember | undefined => {
    return allTeamMembers.find(m => m.id === id);
  }, []);

  // Fetch messages for selected employee
  const fetchMessages = useCallback(async () => {
    if (!selectedEmployeeId) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('employee_chat_messages')
      .select('*')
      .or(`recipient_id.eq.${selectedEmployeeId},sender_id.eq.${selectedEmployeeId}`)
      .order('created_at', { ascending: true });

    if (!error && data) {
      setMessages(data as ChatMessage[]);
    }
    setLoading(false);
  }, [selectedEmployeeId]);

  // Initialize employee statuses
  const initializeStatuses = useCallback(() => {
    const statuses = new Map<string, EmployeeStatus>();
    allTeamMembers.forEach(member => {
      const statusOptions: ('online' | 'busy' | 'away')[] = ['online', 'busy', 'away'];
      const weights = [0.6, 0.25, 0.15]; // 60% online, 25% busy, 15% away
      const rand = Math.random();
      let status: 'online' | 'busy' | 'away' = 'online';
      if (rand > weights[0]) status = 'busy';
      if (rand > weights[0] + weights[1]) status = 'away';

      statuses.set(member.id, {
        id: member.id,
        employee_name: member.name,
        status,
        last_active_at: new Date().toISOString(),
        is_typing: false,
        current_activity: status === 'busy' ? 'In a meeting' : null,
      });
    });
    setEmployeeStatuses(statuses);
  }, []);

  // Send message with AI-powered response
  const sendMessage = useCallback(async (content: string) => {
    if (!selectedEmployeeId || !content.trim()) return;
    const employee = getEmployee(selectedEmployeeId);
    if (!employee) return;

    // Insert user message
    const { data: userMsg, error: userError } = await supabase
      .from('employee_chat_messages')
      .insert({
        sender_id: 'current-user',
        sender_type: 'user',
        recipient_id: selectedEmployeeId,
        message: content.trim(),
      })
      .select()
      .single();

    if (userError) {
      console.error('Error sending message:', userError);
      toast.error('Failed to send message');
      return;
    }

    setMessages(prev => [...prev, userMsg as ChatMessage]);

    // Show typing indicator
    const typingDelay = Math.random() * 1000 + 800;
    setTimeout(() => {
      setIsTyping(true);
      setEmployeeStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(selectedEmployeeId);
        if (status) updated.set(selectedEmployeeId, { ...status, is_typing: true });
        return updated;
      });
    }, typingDelay);

    // Call AI edge function for response
    const responseDelay = Math.random() * (RESPONSE_DELAYS.max - RESPONSE_DELAYS.min) + RESPONSE_DELAYS.min;

    setTimeout(async () => {
      let aiReply: string;

      try {
        const { data, error } = await supabase.functions.invoke('employee-chat', {
          body: {
            message: content,
            employee_name: employee.name,
            employee_role: employee.role,
            employee_department: employee.department,
            conversation_history: messages.slice(-8),
          },
        });

        if (error) throw error;
        aiReply = data?.reply || getFallbackResponse(employee, content);
      } catch (err) {
        console.error('AI response error:', err);
        aiReply = getFallbackResponse(employee, content);
      }

      setIsTyping(false);
      setEmployeeStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(selectedEmployeeId);
        if (status) updated.set(selectedEmployeeId, { ...status, is_typing: false, last_active_at: new Date().toISOString() });
        return updated;
      });

      // Save AI response to DB
      const { data: employeeMsg, error: employeeError } = await supabase
        .from('employee_chat_messages')
        .insert({
          sender_id: selectedEmployeeId,
          sender_type: 'employee',
          recipient_id: 'current-user',
          message: aiReply,
        })
        .select()
        .single();

      if (!employeeError && employeeMsg) {
        setMessages(prev => [...prev, employeeMsg as ChatMessage]);
      }
    }, typingDelay + responseDelay);

  }, [selectedEmployeeId, getEmployee, messages]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedEmployeeId) return;
    const channel = supabase
      .channel(`emp-chat-${selectedEmployeeId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'employee_chat_messages',
      }, (payload) => {
        const newMsg = payload.new as ChatMessage;
        // Avoid duplicates
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedEmployeeId]);

  useEffect(() => { fetchMessages(); }, [fetchMessages]);
  useEffect(() => { initializeStatuses(); }, [initializeStatuses]);

  return { messages, employeeStatuses, isTyping, loading, sendMessage, getEmployee };
};

// Fallback responses when AI is unavailable
function getFallbackResponse(employee: TeamMember, message: string): string {
  const lower = message.toLowerCase();
  const name = employee.name.split(' ')[0];

  if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
    return `Hello! This is ${name}. How can I assist you today?`;
  }
  if (lower.includes('thank')) {
    return `You're welcome! Happy to help. Let me know if there's anything else you need.`;
  }
  if (lower.includes('?')) {
    return `Great question. Let me check on that and get back to you with a detailed answer shortly.`;
  }
  if (lower.includes('please') || lower.includes('need') || lower.includes('can you')) {
    return `Absolutely, I'll get on this right away. You'll have an update within the hour.`;
  }
  return `Understood. I'll take care of this and keep you updated on the progress.`;
}
