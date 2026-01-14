/**
 * Smart Escalation Service - JBJ Global Real Estate
 * Handles intelligent escalation routing based on emotion detection
 */

import { supabase } from '@/integrations/supabase/client';
import { getPersonalityById } from '@/config/ai-personalities';
import {
  analyzeMessage,
  generateAdaptiveResponse,
  isOffHours,
  getOffHoursResponse,
  getEmotionIcon,
  getUrgencyLabel,
  type EmotionAnalysis,
  type UrgencyLevel,
  type EmotionType,
  ESCALATION_RULES,
} from '@/config/emotion-detection-engine';

// ============================================
// TYPES & INTERFACES
// ============================================

export interface EscalationEvent {
  id: string;
  triggeredAt: Date;
  sourceChannel: 'chat' | 'whatsapp' | 'email' | 'crm';
  senderId?: string;
  senderName?: string;
  senderType: 'client' | 'team' | 'ai';
  originalMessage: string;
  emotionAnalysis: EmotionAnalysis;
  escalatedTo: string[];
  status: 'pending' | 'acknowledged' | 'resolved';
  responseDeadline: Date;
  resolutionNotes?: string;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export interface NotificationItem {
  id: string;
  type: 'message' | 'alert' | 'task' | 'emotion' | 'escalation';
  title: string;
  description: string;
  timestamp: Date;
  urgency: UrgencyLevel;
  emotionIcon?: string;
  senderName?: string;
  isRead: boolean;
  responseDeadline?: Date;
  actionUrl?: string;
}

export interface SmartResponse {
  content: string;
  tone: string;
  shouldEscalate: boolean;
  escalationTargets?: string[];
  escalationReason?: string;
  responseDeadlineMinutes: number;
  emotionContext: {
    emotion: EmotionType;
    confidence: number;
    sentiment: number;
  };
}

// ============================================
// ESCALATION QUEUE MANAGEMENT
// ============================================

const escalationQueue: EscalationEvent[] = [];

export function addToEscalationQueue(event: EscalationEvent): void {
  escalationQueue.push(event);
}

export function getEscalationQueue(): EscalationEvent[] {
  return [...escalationQueue].sort((a, b) => {
    // Sort by urgency, then by deadline
    const urgencyOrder: Record<UrgencyLevel, number> = {
      critical: 0,
      high: 1,
      normal: 2,
      low: 3,
    };
    
    const urgencyDiff = urgencyOrder[a.emotionAnalysis.urgency] - urgencyOrder[b.emotionAnalysis.urgency];
    if (urgencyDiff !== 0) return urgencyDiff;
    
    return a.responseDeadline.getTime() - b.responseDeadline.getTime();
  });
}

export function acknowledgeEscalation(eventId: string, userId: string): boolean {
  const event = escalationQueue.find(e => e.id === eventId);
  if (event) {
    event.status = 'acknowledged';
    return true;
  }
  return false;
}

export function resolveEscalation(eventId: string, userId: string, notes: string): boolean {
  const event = escalationQueue.find(e => e.id === eventId);
  if (event) {
    event.status = 'resolved';
    event.resolvedAt = new Date();
    event.resolvedBy = userId;
    event.resolutionNotes = notes;
    return true;
  }
  return false;
}

// ============================================
// MESSAGE PROCESSING
// ============================================

export async function processIncomingMessage(
  message: string,
  senderId: string,
  senderName: string,
  senderType: 'client' | 'team' | 'ai',
  channel: 'chat' | 'whatsapp' | 'email' | 'crm'
): Promise<SmartResponse> {
  // Analyze the message
  const analysis = analyzeMessage(message);
  
  // Check for off-hours
  if (isOffHours() && senderType === 'client') {
    const offHoursMessage = getOffHoursResponse(analysis.urgency);
    
    // Still escalate if urgent
    if (analysis.urgency === 'critical' || analysis.urgency === 'high') {
      await createEscalationEvent(
        message,
        analysis,
        senderId,
        senderName,
        senderType,
        channel
      );
    }
    
    return {
      content: offHoursMessage,
      tone: 'professional',
      shouldEscalate: analysis.shouldEscalate,
      escalationTargets: analysis.shouldEscalate ? getEscalationTargets(analysis) : undefined,
      escalationReason: analysis.escalationReason,
      responseDeadlineMinutes: analysis.suggestedTone.responseDeadlineMinutes,
      emotionContext: {
        emotion: analysis.emotion,
        confidence: analysis.confidence,
        sentiment: analysis.sentiment,
      },
    };
  }
  
  // Create escalation event if needed
  if (analysis.shouldEscalate) {
    await createEscalationEvent(
      message,
      analysis,
      senderId,
      senderName,
      senderType,
      channel
    );
  }
  
  return {
    content: '',
    tone: analysis.suggestedTone.style,
    shouldEscalate: analysis.shouldEscalate,
    escalationTargets: analysis.shouldEscalate ? getEscalationTargets(analysis) : undefined,
    escalationReason: analysis.escalationReason,
    responseDeadlineMinutes: analysis.suggestedTone.responseDeadlineMinutes,
    emotionContext: {
      emotion: analysis.emotion,
      confidence: analysis.confidence,
      sentiment: analysis.sentiment,
    },
  };
}

function getEscalationTargets(analysis: EmotionAnalysis): string[] {
  for (const rule of ESCALATION_RULES) {
    if (rule.condition(analysis)) {
      return rule.targets;
    }
  }
  return ['christopher_adams'];
}

async function createEscalationEvent(
  message: string,
  analysis: EmotionAnalysis,
  senderId: string,
  senderName: string,
  senderType: 'client' | 'team' | 'ai',
  channel: 'chat' | 'whatsapp' | 'email' | 'crm'
): Promise<EscalationEvent> {
  const targets = getEscalationTargets(analysis);
  const deadlineMinutes = analysis.suggestedTone.responseDeadlineMinutes;
  
  const event: EscalationEvent = {
    id: crypto.randomUUID(),
    triggeredAt: new Date(),
    sourceChannel: channel,
    senderId,
    senderName,
    senderType,
    originalMessage: message,
    emotionAnalysis: analysis,
    escalatedTo: targets,
    status: 'pending',
    responseDeadline: new Date(Date.now() + deadlineMinutes * 60 * 1000),
  };
  
  addToEscalationQueue(event);
  
  // Log to database
  await logEscalation(event);
  
  return event;
}

async function logEscalation(event: EscalationEvent): Promise<void> {
  try {
    const targetNames = event.escalatedTo
      .map(id => getPersonalityById(id)?.name || id)
      .join(', ');
    
    await supabase.from('crm_audit_logs').insert({
      entity_type: 'escalation',
      entity_id: event.id,
      action: 'smart_escalation',
      details: {
        sender_name: event.senderName,
        sender_type: event.senderType,
        channel: event.sourceChannel,
        emotion: event.emotionAnalysis.emotion,
        confidence: event.emotionAnalysis.confidence,
        urgency: event.emotionAnalysis.urgency,
        sentiment: event.emotionAnalysis.sentiment,
        escalated_to: targetNames,
        reason: event.emotionAnalysis.escalationReason,
        response_deadline: event.responseDeadline.toISOString(),
        message_preview: event.originalMessage.substring(0, 200),
      },
    });
  } catch (error) {
    console.error('Failed to log escalation:', error);
  }
}

// ============================================
// NOTIFICATION GENERATION
// ============================================

export function createNotificationFromEscalation(event: EscalationEvent): NotificationItem {
  const urgencyLabel = getUrgencyLabel(event.emotionAnalysis.urgency);
  const emotionIcon = getEmotionIcon(event.emotionAnalysis.emotion);
  
  return {
    id: event.id,
    type: 'escalation',
    title: `${urgencyLabel} Client Escalation`,
    description: `${event.senderName || 'Client'}: Detected ${event.emotionAnalysis.emotion} tone (${event.emotionAnalysis.confidence}% confidence). ${event.emotionAnalysis.escalationReason || ''}`,
    timestamp: event.triggeredAt,
    urgency: event.emotionAnalysis.urgency,
    emotionIcon,
    senderName: event.senderName,
    isRead: false,
    responseDeadline: event.responseDeadline,
    actionUrl: `/crm/escalations/${event.id}`,
  };
}

export function createEmotionNotification(
  analysis: EmotionAnalysis,
  senderName: string,
  channel: string
): NotificationItem {
  const emotionIcon = getEmotionIcon(analysis.emotion);
  
  return {
    id: crypto.randomUUID(),
    type: 'emotion',
    title: `Emotion Detected: ${analysis.emotion}`,
    description: `${senderName} via ${channel} — ${analysis.confidence}% confidence. ${analysis.shouldEscalate ? 'Escalation recommended.' : ''}`,
    timestamp: new Date(),
    urgency: analysis.urgency,
    emotionIcon,
    senderName,
    isRead: false,
    responseDeadline: new Date(Date.now() + analysis.suggestedTone.responseDeadlineMinutes * 60 * 1000),
  };
}

// ============================================
// ADAPTIVE RESPONSE ENHANCEMENT
// ============================================

export function enhanceResponseWithEmotion(
  baseContent: string,
  analysis: EmotionAnalysis,
  aiName: string
): string {
  return generateAdaptiveResponse(baseContent, analysis, aiName);
}

export function formatEscalationAlert(event: EscalationEvent): string {
  const targetNames = event.escalatedTo
    .map(id => getPersonalityById(id)?.name || id)
    .join(', ');
  
  const emotionIcon = getEmotionIcon(event.emotionAnalysis.emotion);
  const urgencyLabel = getUrgencyLabel(event.emotionAnalysis.urgency);
  
  return `⚠️ Urgent Client Escalation — detected ${event.emotionAnalysis.emotion} tone ${emotionIcon} from ${event.senderName || 'client'}.
Assigned to ${targetNames}. Response required within ${Math.ceil((event.responseDeadline.getTime() - Date.now()) / 60000)} mins.
Urgency: ${urgencyLabel}`;
}

export function formatInternalAlert(
  analysis: EmotionAnalysis,
  targetRole: string,
  senderName: string
): string {
  const targetName = getPersonalityById(targetRole)?.name || targetRole;
  const emotionIcon = getEmotionIcon(analysis.emotion);
  
  return `@${targetName} — please note, ${senderName} sounded ${analysis.emotion} ${emotionIcon} (${analysis.confidence}% tone confidence). Approach with ${analysis.suggestedTone.style} response.`;
}

// ============================================
// SECOND-LEVEL ESCALATION
// ============================================

export function checkSecondLevelEscalation(): EscalationEvent[] {
  const now = Date.now();
  const fifteenMinutesAgo = now - 15 * 60 * 1000;
  
  return escalationQueue.filter(event => {
    if (event.status !== 'pending') return false;
    
    const triggeredAt = event.triggeredAt.getTime();
    return triggeredAt <= fifteenMinutesAgo;
  });
}

export async function triggerSecondLevelEscalation(event: EscalationEvent): Promise<void> {
  // Escalate directly to CEO
  if (!event.escalatedTo.includes('founder')) {
    event.escalatedTo.push('founder');
  }
  
  // Log second-level escalation
  await supabase.from('crm_audit_logs').insert({
    entity_type: 'escalation',
    entity_id: event.id,
    action: 'second_level_escalation',
    details: {
      original_escalation_time: event.triggeredAt.toISOString(),
      reason: 'No response within 15 minutes',
      escalated_to: 'CEO',
    },
  });
}

// ============================================
// CHANNEL-SPECIFIC TONE ADJUSTMENTS
// ============================================

export function adjustToneForChannel(
  content: string,
  analysis: EmotionAnalysis,
  channel: 'email' | 'whatsapp' | 'chat' | 'video' | 'call'
): string {
  switch (channel) {
    case 'email':
      // Formal and composed
      return content;
    
    case 'whatsapp':
      // Short and polite, more conversational
      return content.replace(/\n\n/g, '\n').substring(0, 500);
    
    case 'chat':
      // Quick, structured, solution-oriented
      return content.split('\n').slice(0, 3).join('\n');
    
    case 'video':
    case 'call':
      // Calm, empathetic speech synthesis ready
      return content;
    
    default:
      return content;
  }
}

// ============================================
// VIP DETECTION
// ============================================

export async function checkVIPStatus(leadId: string): Promise<{
  isVIP: boolean;
  reason?: string;
}> {
  try {
    const { data: lead } = await supabase
      .from('crm_leads')
      .select('vip, tags')
      .eq('id', leadId)
      .maybeSingle();
    
    if (!lead) return { isVIP: false };
    
    // Check if VIP flag is set
    if (lead.vip === true) {
      return { isVIP: true, reason: 'VIP flagged lead' };
    }
    
    // Check tags for VIP indicators
    const tags = lead.tags || [];
    if (tags.some((tag: string) => tag.toLowerCase().includes('vip') || tag.toLowerCase().includes('priority'))) {
      return { isVIP: true, reason: 'High-priority tagged lead' };
    }
    
    return { isVIP: false };
  } catch {
    return { isVIP: false };
  }
}

// ============================================
// EXPORTS
// ============================================

export {
  analyzeMessage,
  getEmotionIcon,
  getUrgencyLabel,
  type EmotionAnalysis,
  type UrgencyLevel,
  type EmotionType,
} from '@/config/emotion-detection-engine';

export default {
  processIncomingMessage,
  addToEscalationQueue,
  getEscalationQueue,
  acknowledgeEscalation,
  resolveEscalation,
  createNotificationFromEscalation,
  createEmotionNotification,
  enhanceResponseWithEmotion,
  formatEscalationAlert,
  formatInternalAlert,
  checkSecondLevelEscalation,
  triggerSecondLevelEscalation,
  adjustToneForChannel,
  checkVIPStatus,
};
