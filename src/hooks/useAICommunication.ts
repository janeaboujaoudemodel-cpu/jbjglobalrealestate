/**
 * AI Communication Hook - JBJ Global Real Estate
 * React hook for AI-powered communication features
 */

import { useState, useCallback } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { AI_PERSONALITIES, MESSAGE_TEMPLATES } from "@/config/ai-personalities";
import aiCommunicationService, { 
  LeadEngagementContext,
  CommunicationResult 
} from "@/services/ai-communication-service";
import { toast } from "sonner";

interface AIBrokerMessage {
  id: string;
  brokerId: string;
  brokerName: string;
  leadId: string;
  channel: 'whatsapp' | 'email' | 'call';
  content: string;
  timestamp: Date;
  status: 'pending' | 'sent' | 'delivered' | 'failed';
}

export function useAICommunication() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Send message via AI Broker
  const sendAIBrokerMessage = useCallback(async (
    brokerId: string,
    leadId: string,
    message: string,
    channel: 'whatsapp' | 'email' | 'call'
  ): Promise<CommunicationResult> => {
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('broker-chat', {
        body: {
          broker_id: brokerId,
          lead_id: leadId,
          message,
          channel,
          client_identifier: leadId,
        },
      });

      if (fnError) throw fnError;

      if (data?.success) {
        toast.success('Message sent successfully');
        return {
          success: true,
          messageId: data.message_id,
          response: data.response,
        };
      }

      throw new Error(data?.error || 'Failed to send message');
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Communication failed';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Generate and send welcome message to new lead
  const sendWelcomeMessage = useCallback(async (
    leadId: string,
    leadName: string,
    leadPhone: string,
    assignedBrokerId: string
  ): Promise<CommunicationResult> => {
    setLoading(true);

    try {
      // Get broker details
      const { data: broker } = await supabase
        .from('ai_brokers')
        .select('name, personality_prompt')
        .eq('id', assignedBrokerId)
        .single();

      if (!broker) {
        throw new Error('Assigned broker not found');
      }

      const personality = broker.name === 'James Morgan' 
        ? AI_PERSONALITIES.james_morgan 
        : AI_PERSONALITIES.maya_khalid;

      const welcomeMessage = aiCommunicationService.generateWelcomeMessage(
        personality,
        leadName
      );

      return await sendAIBrokerMessage(
        assignedBrokerId,
        leadId,
        welcomeMessage,
        'whatsapp'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send welcome message';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [sendAIBrokerMessage]);

  // Process follow-up for lead
  const processLeadFollowUp = useCallback(async (
    context: LeadEngagementContext,
    brokerId: string,
    brokerName: string = 'Your Property Advisor'
  ): Promise<CommunicationResult> => {
    setLoading(true);

    try {
      const { message, urgency } = aiCommunicationService.generateFollowUpMessage(context, brokerName);

      // Log the follow-up attempt
      console.log(`Processing ${urgency} urgency follow-up for lead ${context.leadId}`);

      return await sendAIBrokerMessage(
        brokerId,
        context.leadId,
        message,
        'whatsapp'
      );
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to process follow-up';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, [sendAIBrokerMessage]);

  // Get AI response for chat
  const getAIResponse = useCallback(async (
    message: string,
    conversationContext: string[],
    personalityId: string
  ): Promise<string | null> => {
    setLoading(true);

    try {
      const personality = AI_PERSONALITIES[personalityId];
      if (!personality) {
        throw new Error('AI personality not found');
      }

      const { data, error: fnError } = await supabase.functions.invoke('ai-chat', {
        body: {
          messages: [
            { role: 'system', content: personality.systemPrompt },
            ...conversationContext.map((msg, i) => ({
              role: i % 2 === 0 ? 'user' : 'assistant',
              content: msg,
            })),
            { role: 'user', content: message },
          ],
          max_tokens: 500,
        },
      });

      if (fnError) throw fnError;

      return data?.response || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get AI response';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Check escalation requirements for a lead
  const checkEscalation = useCallback(async (
    leadId: string
  ): Promise<{ needed: boolean; reason?: string }> => {
    try {
      const { data: lead } = await supabase
        .from('crm_leads')
        .select('full_name, updated_at, tags')
        .eq('id', leadId)
        .single();

      if (!lead) return { needed: false };

      // Use updated_at as last contact proxy
      const lastContact = lead.updated_at 
        ? new Date(lead.updated_at) 
        : null;
      
      const daysSinceContact = lastContact 
        ? Math.floor((Date.now() - lastContact.getTime()) / (1000 * 60 * 60 * 24))
        : undefined;

      // Determine status from tags
      const status = lead.tags?.includes('hot') ? 'hot' : 
                    lead.tags?.includes('new') ? 'new' : 'active';

      const context: LeadEngagementContext = {
        leadId,
        leadName: lead.full_name,
        lastContactDate: lastContact || undefined,
        daysSinceContact,
        status,
      };

      return aiCommunicationService.checkEscalationNeeded(context);
    } catch {
      return { needed: false };
    }
  }, []);

  // Compose email with AI assistance
  const composeAIEmail = useCallback(async (
    leadId: string,
    subject: string,
    context: string,
    brokerId: string
  ): Promise<{ subject: string; body: string } | null> => {
    setLoading(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-email-composer', {
        body: {
          lead_id: leadId,
          subject,
          context,
          broker_id: brokerId,
        },
      });

      if (fnError) throw fnError;

      return data?.email || null;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to compose email';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  // Send deal closed congratulations
  const sendDealClosedMessage = useCallback(async (
    leadId: string,
    leadName: string,
    brokerId: string,
    brokerName: string = 'Your Property Advisor'
  ): Promise<CommunicationResult> => {
    const message = MESSAGE_TEMPLATES.dealClosed(leadName, brokerName);

    return await sendAIBrokerMessage(
      brokerId,
      leadId,
      message,
      'whatsapp'
    );
  }, [sendAIBrokerMessage]);

  return {
    loading,
    error,
    sendAIBrokerMessage,
    sendWelcomeMessage,
    processLeadFollowUp,
    getAIResponse,
    checkEscalation,
    composeAIEmail,
    sendDealClosedMessage,
  };
}

export default useAICommunication;
