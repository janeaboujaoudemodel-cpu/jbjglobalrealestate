import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import type { SupportTicket, SupportTicketMessage } from './useSupportTickets';

export interface AISuggestion {
  type: 'quick_resolution' | 'needs_info' | 'acknowledgment';
  title: string;
  message: string;
}

export interface AITicketSuggestionsResult {
  suggestions: AISuggestion[];
}

export function useAITicketSuggestions() {
  const [isLoading, setIsLoading] = useState(false);
  const [suggestions, setSuggestions] = useState<AISuggestion[]>([]);
  const [error, setError] = useState<string | null>(null);

  const generateSuggestions = async (
    ticket: SupportTicket,
    messages: SupportTicketMessage[]
  ) => {
    setIsLoading(true);
    setError(null);
    setSuggestions([]);

    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        'ai-ticket-reply-suggest',
        {
          body: {
            ticket: {
              ticketNumber: ticket.ticket_number,
              subject: ticket.subject,
              description: ticket.description,
              category: ticket.service_category,
              priority: ticket.priority,
              customerName: ticket.full_name,
              previousMessages: messages.map(m => ({
                sender_type: m.sender_type,
                message: m.message,
              })),
            },
          },
        }
      );

      if (fnError) {
        throw fnError;
      }

      if (data?.suggestions && Array.isArray(data.suggestions)) {
        setSuggestions(data.suggestions);
      } else if (data?.error) {
        throw new Error(data.error);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate suggestions';
      console.error('AI suggestion error:', err);
      setError(errorMessage);
      
      // Show toast for rate limit errors
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        toast.error('AI service is busy. Please try again in a moment.');
      } else if (errorMessage.includes('credits') || errorMessage.includes('402')) {
        toast.error('AI service unavailable. Please contact support.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const clearSuggestions = () => {
    setSuggestions([]);
    setError(null);
  };

  return {
    isLoading,
    suggestions,
    error,
    generateSuggestions,
    clearSuggestions,
  };
}
