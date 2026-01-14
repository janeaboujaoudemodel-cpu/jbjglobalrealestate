/**
 * AI Communication Service - JBJ Global Real Estate
 * Centralized service for all AI interactions across channels
 */

import { supabase } from "@/integrations/supabase/client";
import { AI_PERSONALITIES, MESSAGE_TEMPLATES, EMAIL_SIGNATURE, JBJ_COMPANY_INFO } from "@/config/ai-personalities";
import type { AIPersonality } from "@/config/ai-personalities";

export interface AIMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  recipientId?: string;
  recipientName?: string;
  channel: 'chat' | 'whatsapp' | 'email' | 'video' | 'call';
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown>;
  isAI: boolean;
}

export interface CommunicationResult {
  success: boolean;
  messageId?: string;
  response?: string;
  error?: string;
}

export interface LeadEngagementContext {
  leadId: string;
  leadName: string;
  leadEmail?: string;
  leadPhone?: string;
  lastContactDate?: Date;
  daysSinceContact?: number;
  status: string;
}

// Log all AI actions for audit trail
async function logAIAction(
  aiId: string,
  aiName: string,
  action: string,
  targetId?: string,
  details?: Record<string, unknown>
): Promise<void> {
  try {
    await supabase.from('crm_audit_logs').insert({
      actor_user_id: null, // AI action
      entity_type: 'ai_action',
      entity_id: targetId,
      action,
      details: {
        ai_id: aiId,
        ai_name: aiName,
        ...details,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Failed to log AI action:', error);
  }
}

// Get AI personality by ID or role
export function getAIPersonality(idOrRole: string): AIPersonality | undefined {
  return AI_PERSONALITIES[idOrRole] || 
    Object.values(AI_PERSONALITIES).find(p => p.role.toLowerCase() === idOrRole.toLowerCase());
}

// Generate contextual greeting based on time
export function getContextualGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}

// Format AI response with proper structure
export function formatAIResponse(
  personality: AIPersonality,
  content: string,
  includeSignature = true
): string {
  let response = content;
  
  // Ensure JBJ branding is mentioned once
  if (!response.includes('JBJ Global Real Estate')) {
    response = response.replace(/\.$/, '') + ' — JBJ Global Real Estate.';
  }
  
  if (includeSignature) {
    response += `\n\n${personality.signature}`;
  }
  
  return response;
}

// Check if action is within AI's permission boundary
export function canPerformAction(personality: AIPersonality, action: string): boolean {
  if (personality.permissions.includes('all')) return true;
  return personality.permissions.includes(action);
}

// Generate welcome message for new lead
export function generateWelcomeMessage(
  brokerPersonality: AIPersonality,
  clientName: string
): string {
  return MESSAGE_TEMPLATES.newLeadWelcome(clientName, brokerPersonality.name);
}

// Generate follow-up message based on days since contact
export function generateFollowUpMessage(
  context: LeadEngagementContext
): { message: string; urgency: 'low' | 'medium' | 'high' } {
  const days = context.daysSinceContact || 0;
  
  if (days <= 1) {
    return {
      message: MESSAGE_TEMPLATES.followUp24h(context.leadName),
      urgency: 'low',
    };
  }
  
  if (days <= 3) {
    return {
      message: MESSAGE_TEMPLATES.followUp3d(context.leadName),
      urgency: 'medium',
    };
  }
  
  return {
    message: `Dear ${context.leadName},\n\nWe noticed it's been a while since we connected. If you're still interested in Dubai properties, we'd be happy to assist you.\n\nPlease let us know if there's anything we can help with.\n\nBest regards,\nJBJ Global Real Estate`,
    urgency: 'high',
  };
}

// Process internal AI message
export async function processInternalMessage(
  senderAI: AIPersonality,
  recipientId: string,
  message: string,
  channelId: string
): Promise<CommunicationResult> {
  try {
    // Log the action
    await logAIAction(senderAI.id, senderAI.name, 'internal_message', recipientId, {
      channel: channelId,
      message_preview: message.substring(0, 100),
    });

    return {
      success: true,
      response: `Message from ${senderAI.name} processed successfully.`,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process message',
    };
  }
}

// Generate daily summary for AI employees
export async function generateDailySummary(aiId: string, date: Date): Promise<string> {
  const personality = getAIPersonality(aiId);
  if (!personality) {
    return 'AI employee not found.';
  }

  const dateStr = date.toISOString().split('T')[0];
  
  // Fetch activity for the day
  const { data: activities } = await supabase
    .from('crm_audit_logs')
    .select('*')
    .eq('entity_type', 'ai_action')
    .gte('created_at', `${dateStr}T00:00:00`)
    .lt('created_at', `${dateStr}T23:59:59`)
    .order('created_at', { ascending: true });

  const aiActivities = activities?.filter(a => 
    (a.details as Record<string, unknown>)?.ai_id === aiId
  ) || [];

  // Group activities by type
  const activitySummary = aiActivities.reduce((acc, activity) => {
    const action = activity.action || 'unknown';
    acc[action] = (acc[action] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Format summary
  const summaryParts = Object.entries(activitySummary).map(
    ([action, count]) => `${count} ${action.replace(/_/g, ' ')}`
  );

  if (summaryParts.length === 0) {
    return `${personality.name} (${personality.role}): No activities recorded today.`;
  }

  return `${personality.name} (${personality.role}): ${summaryParts.join(', ')}.`;
}

// Validate message doesn't contain restricted content
export function validateMessageContent(content: string): {
  valid: boolean;
  reason?: string;
} {
  const restrictedPatterns = [
    { pattern: /guaranteed? return/i, reason: 'Cannot guarantee investment returns' },
    { pattern: /financial advice/i, reason: 'Cannot provide financial advice' },
    { pattern: /legal advice/i, reason: 'Cannot provide legal advice' },
    { pattern: /competitor/i, reason: 'Should not mention competitors' },
  ];

  for (const { pattern, reason } of restrictedPatterns) {
    if (pattern.test(content)) {
      return { valid: false, reason };
    }
  }

  return { valid: true };
}

// Handle AI response to out-of-scope requests
export function handleOutOfScopeRequest(personality: AIPersonality, requestType: string): string {
  return `This action is not permitted for my role. Please confirm with the Admin or Founder.`;
}

// Emotional intelligence response adjustment
export function adjustToneForContext(
  content: string,
  clientTone: 'neutral' | 'frustrated' | 'excited' | 'confused'
): string {
  switch (clientTone) {
    case 'frustrated':
      return `I understand your concerns, and I truly appreciate your patience. ${content}`;
    case 'excited':
      return `That's wonderful to hear! ${content}`;
    case 'confused':
      return `Let me clarify that for you. ${content} Does that help?`;
    default:
      return content;
  }
}

// Emergency escalation check
export function checkEscalationNeeded(
  context: LeadEngagementContext
): { needed: boolean; reason?: string; escalateTo?: string } {
  if (context.daysSinceContact && context.daysSinceContact >= 7) {
    return {
      needed: true,
      reason: 'No response for 7+ days',
      escalateTo: 'admin',
    };
  }

  return { needed: false };
}

// Get AI broker for lead based on assignment rules
export async function getAssignedAIBroker(
  leadId: string
): Promise<AIPersonality | null> {
  try {
    const { data: lead } = await supabase
      .from('crm_leads')
      .select('assigned_ai_employee_id')
      .eq('id', leadId)
      .single();

    if (!lead?.assigned_ai_employee_id) return null;

    // Check if assigned to AI broker
    const { data: aiBroker } = await supabase
      .from('ai_brokers')
      .select('*')
      .eq('id', lead.assigned_ai_employee_id)
      .single();

    if (aiBroker) {
      // Map to personality
      if (aiBroker.name === 'James Morgan') {
        return AI_PERSONALITIES.james_morgan;
      }
      if (aiBroker.name === 'Maya Khalid') {
        return AI_PERSONALITIES.maya_khalid;
      }
    }

    return null;
  } catch {
    return null;
  }
}

export default {
  getAIPersonality,
  getContextualGreeting,
  formatAIResponse,
  canPerformAction,
  generateWelcomeMessage,
  generateFollowUpMessage,
  processInternalMessage,
  generateDailySummary,
  validateMessageContent,
  handleOutOfScopeRequest,
  adjustToneForContext,
  checkEscalationNeeded,
  getAssignedAIBroker,
};
