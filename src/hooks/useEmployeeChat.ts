import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { allTeamMembers, TeamMember } from '@/config/team-members';

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
  min: 3000,  // 3 seconds minimum
  max: 15000, // 15 seconds maximum
  typing: 2000 // 2 seconds typing indicator
};

const AI_RESPONSE_TEMPLATES: Record<string, string[]> = {
  greeting: [
    "Hello! How can I assist you today?",
    "Hi there! I'm here to help. What do you need?",
    "Good to hear from you! How may I be of service?"
  ],
  acknowledgment: [
    "I understand. Let me look into that for you.",
    "Got it! I'll check on this right away.",
    "Noted. I'll work on this and get back to you shortly."
  ],
  question: [
    "Could you please provide more details?",
    "I'd be happy to help. Can you elaborate a bit more?",
    "Let me understand better - what specifically would you like to know?"
  ],
  task: [
    "I'll get started on this right away.",
    "Consider it done. I'll update you once completed.",
    "I'm on it! You'll have an update within the hour."
  ],
  closing: [
    "Is there anything else I can help you with?",
    "Let me know if you need anything else!",
    "Happy to help anytime. Just reach out!"
  ]
};

export const useEmployeeChat = (selectedEmployeeId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [employeeStatuses, setEmployeeStatuses] = useState<Map<string, EmployeeStatus>>(new Map());
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(false);

  // Get employee details
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
  const initializeStatuses = useCallback(async () => {
    const statuses = new Map<string, EmployeeStatus>();
    
    // Set random statuses for employees
    allTeamMembers.forEach(member => {
      const statusOptions: ('online' | 'busy' | 'away')[] = ['online', 'busy', 'away'];
      const randomStatus = statusOptions[Math.floor(Math.random() * statusOptions.length)];
      
      statuses.set(member.id, {
        id: member.id,
        employee_name: member.name,
        status: randomStatus,
        last_active_at: new Date().toISOString(),
        is_typing: false,
        current_activity: randomStatus === 'busy' ? 'In a meeting' : null
      });
    });
    
    setEmployeeStatuses(statuses);
  }, []);

  // Generate AI response based on message content
  const generateAIResponse = useCallback((userMessage: string, employee: TeamMember): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    // Detect message type
    let responseType: keyof typeof AI_RESPONSE_TEMPLATES = 'acknowledgment';
    
    if (lowerMessage.includes('hello') || lowerMessage.includes('hi') || lowerMessage.includes('hey')) {
      responseType = 'greeting';
    } else if (lowerMessage.includes('?')) {
      responseType = 'question';
    } else if (lowerMessage.includes('please') || lowerMessage.includes('need') || lowerMessage.includes('can you')) {
      responseType = 'task';
    } else if (lowerMessage.includes('thank')) {
      responseType = 'closing';
    }
    
    const templates = AI_RESPONSE_TEMPLATES[responseType];
    const baseResponse = templates[Math.floor(Math.random() * templates.length)];
    
    // Add role-specific context
    const roleContext = getRoleSpecificResponse(employee, userMessage);
    
    return roleContext ? `${baseResponse}\n\n${roleContext}` : baseResponse;
  }, []);

  const getRoleSpecificResponse = (employee: TeamMember, message: string): string => {
    const department = employee.department?.toLowerCase() || '';
    const role = employee.role?.toLowerCase() || '';
    
    if (department.includes('sales') || role.includes('broker') || role.includes('consultant')) {
      return `As your ${employee.role}, I'm tracking all leads and client interactions. I'll coordinate with the team to ensure we deliver exceptional service.`;
    }
    if (department.includes('hr')) {
      return `I'll make sure to follow our HR protocols and keep all documentation updated. Let me know if you need any team-related reports.`;
    }
    if (department.includes('marketing')) {
      return `I'll align this with our current marketing strategy and brand guidelines. Should I prepare a brief for your review?`;
    }
    if (department.includes('finance')) {
      return `I'll review the financial implications and prepare the necessary documentation. All records will be updated accordingly.`;
    }
    if (department.includes('legal')) {
      return `I'll ensure full compliance with UAE regulations and our internal policies. Let me prepare the relevant documentation.`;
    }
    if (department.includes('it')) {
      return `I'll check our systems and implement any necessary changes. Security and data integrity are my top priorities.`;
    }
    
    return '';
  };

  // Send message and get AI response
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
        message: content.trim()
      })
      .select()
      .single();

    if (userError) {
      console.error('Error sending message:', userError);
      return;
    }

    setMessages(prev => [...prev, userMsg as ChatMessage]);

    // Update employee status to show notification received
    const currentStatus = employeeStatuses.get(selectedEmployeeId);
    if (currentStatus) {
      // Simulate notification to director
      const director = allTeamMembers.find(m => m.id === employee.reportsTo);
      if (director) {
        console.log(`Notifying ${director.name} that ${employee.name} has a new message from the Founder.`);
      }
    }

    // Show typing indicator after realistic delay
    const notificationDelay = Math.random() * 2000 + 1000; // 1-3 seconds
    setTimeout(() => {
      setIsTyping(true);
      
      // Update status to show typing
      setEmployeeStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(selectedEmployeeId);
        if (status) {
          updated.set(selectedEmployeeId, { ...status, is_typing: true });
        }
        return updated;
      });
    }, notificationDelay);

    // Generate and send AI response after realistic delay
    const responseDelay = Math.random() * (RESPONSE_DELAYS.max - RESPONSE_DELAYS.min) + RESPONSE_DELAYS.min;
    
    setTimeout(async () => {
      setIsTyping(false);
      
      // Update status to stop typing
      setEmployeeStatuses(prev => {
        const updated = new Map(prev);
        const status = updated.get(selectedEmployeeId);
        if (status) {
          updated.set(selectedEmployeeId, { ...status, is_typing: false, last_active_at: new Date().toISOString() });
        }
        return updated;
      });

      const aiResponse = generateAIResponse(content, employee);
      
      const { data: employeeMsg, error: employeeError } = await supabase
        .from('employee_chat_messages')
        .insert({
          sender_id: selectedEmployeeId,
          sender_type: 'employee',
          recipient_id: 'current-user',
          message: aiResponse
        })
        .select()
        .single();

      if (!employeeError && employeeMsg) {
        setMessages(prev => [...prev, employeeMsg as ChatMessage]);
      }
    }, notificationDelay + responseDelay);

  }, [selectedEmployeeId, getEmployee, employeeStatuses, generateAIResponse]);

  // Real-time subscription
  useEffect(() => {
    if (!selectedEmployeeId) return;

    const channel = supabase
      .channel(`chat-${selectedEmployeeId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'employee_chat_messages',
          filter: `recipient_id=eq.${selectedEmployeeId}`
        },
        (payload) => {
          setMessages(prev => [...prev, payload.new as ChatMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedEmployeeId]);

  useEffect(() => {
    fetchMessages();
  }, [fetchMessages]);

  useEffect(() => {
    initializeStatuses();
  }, [initializeStatuses]);

  return {
    messages,
    employeeStatuses,
    isTyping,
    loading,
    sendMessage,
    getEmployee
  };
};
