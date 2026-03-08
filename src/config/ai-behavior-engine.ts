/**
 * AI Behavior Engine - JBJ Global Real Estate
 * Comprehensive behavior logic, escalation flows, and decision rules
 * Based on the JBJ AI Behavior & Action Logic Blueprint
 */

import { AI_PERSONALITIES, getPersonalityById, getTimeBasedGreeting } from './ai-personalities';
import type { AIPersonality } from './ai-personalities';

// ============================================
// BEHAVIOR RULES (GLOBAL)
// ============================================

export const GLOBAL_BEHAVIOR_RULES = {
  // 1. Every AI employee operates within clear boundaries based on their role
  roleBasedBoundaries: true,
  
  // 2. Only the Founder & CEO account can view, delete, or perform bulk actions
  founderOnlyActions: ['delete', 'bulk_delete', 'suspend', 'view_all'],
  
  // 3. The Admin account can monitor but cannot delete or suspend employees or leads
  adminRestrictions: ['delete', 'suspend', 'bulk_actions'],
  
  // 4. Every AI persona responds in real time (<10 seconds) with human-style pauses
  maxResponseTimeMs: 10000,
  typingSimulationDelay: { min: 500, max: 2000 },
  
  // 5. All messages use natural, professional English following the JBJ tone guidelines
  requireJBJTone: true,
  
  // 6. No employee duplicates or overlaps tasks with another unless specifically assigned
  preventTaskDuplication: true,
  
  // 7. Each employee automatically escalates issues to the next level when required
  autoEscalation: true,
  
  // 8. Every action (chat, email, reminder, schedule) must be logged in CRM timeline view
  logAllActions: true,
};

// ============================================
// ROLE-BASED DECISION LOGIC
// ============================================

export interface DecisionRule {
  id: string;
  role: string;
  trigger: string;
  condition: (context: DecisionContext) => boolean;
  action: (context: DecisionContext) => DecisionAction;
  priority: number;
}

export interface DecisionContext {
  roleId: string;
  event: string;
  data: Record<string, unknown>;
  timestamp: Date;
  leadId?: string;
  userId?: string;
  daysSinceLastContact?: number;
  capacityPercent?: number;
}

export interface DecisionAction {
  type: 'notify' | 'reassign' | 'escalate' | 'pause' | 'schedule' | 'remind' | 'log' | 'broadcast';
  targetRoles: string[];
  message: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  data?: Record<string, unknown>;
}

// ============================================
// FOUNDER & CEO DECISION LOGIC
// ============================================

export const FOUNDER_DECISION_RULES: DecisionRule[] = [
  {
    id: 'founder_major_issue',
    role: 'founder',
    trigger: 'system_issue',
    condition: (ctx) => ctx.data.severity === 'major',
    action: () => ({
      type: 'notify',
      targetRoles: ['founder'],
      message: 'Major CRM issue detected. Automation paused pending review.',
      priority: 'critical',
    }),
    priority: 1,
  },
  {
    id: 'founder_high_priority_lead',
    role: 'founder',
    trigger: 'lead_marked_high_priority',
    condition: (ctx) => ctx.data.priority === 'high',
    action: (ctx) => ({
      type: 'notify',
      targetRoles: ['founder', 'james_morgan'],
      message: `High Priority Lead: ${ctx.data.leadName} requires immediate attention.`,
      priority: 'high',
    }),
    priority: 2,
  },
  {
    id: 'founder_daily_summary',
    role: 'founder',
    trigger: 'daily_report',
    condition: () => true,
    action: () => ({
      type: 'notify',
      targetRoles: ['founder'],
      message: 'Daily summary: Sales performance, leads, and HR updates available.',
      priority: 'low',
    }),
    priority: 10,
  },
];

// ============================================
// EXECUTIVE ASSISTANT (AMANDA CLARKE) DECISION LOGIC
// ============================================

export const AMANDA_DECISION_RULES: DecisionRule[] = [
  {
    id: 'amanda_no_confirmation',
    role: 'amanda_clarke',
    trigger: 'meeting_invite',
    condition: (ctx) => {
      const hoursSinceInvite = ctx.data.hoursSinceInvite as number || 0;
      return hoursSinceInvite >= 3 && !ctx.data.confirmed;
    },
    action: (ctx) => ({
      type: 'remind',
      targetRoles: [ctx.data.inviteeRole as string],
      message: `Gentle reminder: Please confirm your meeting scheduled for ${ctx.data.meetingTime}.`,
      priority: 'medium',
    }),
    priority: 1,
  },
  {
    id: 'amanda_ceo_missed_update',
    role: 'amanda_clarke',
    trigger: 'ceo_update_missed',
    condition: (ctx) => ctx.data.missedUpdate === true,
    action: (ctx) => ({
      type: 'schedule',
      targetRoles: ['founder'],
      message: `Rescheduled: "${ctx.data.taskTitle}" - logged as Missed Follow-up.`,
      priority: 'medium',
      data: { reschedule: true },
    }),
    priority: 2,
  },
  {
    id: 'amanda_schedule_conflict',
    role: 'amanda_clarke',
    trigger: 'schedule_conflict',
    condition: () => true,
    action: (ctx) => ({
      type: 'notify',
      targetRoles: ['founder'],
      message: `Schedule conflict detected. Proposed alternative: ${ctx.data.proposedSlot}.`,
      priority: 'medium',
    }),
    priority: 3,
  },
];

// ============================================
// HEAD OF SALES (JAMES MORGAN) DECISION LOGIC
// ============================================

export const SALES_DECISION_RULES: DecisionRule[] = [
  {
    id: 'sales_lead_untouched_24h',
    role: 'james_morgan',
    trigger: 'lead_status_check',
    condition: (ctx) => {
      const daysSince = ctx.daysSinceLastContact || 0;
      return daysSince >= 1 && ctx.data.status === 'New';
    },
    action: (ctx) => ({
      type: 'reassign',
      targetRoles: ['james_morgan'],
      message: `Lead "${ctx.data.leadName}" untouched for 24h. Auto-reassigning.`,
      priority: 'high',
    }),
    priority: 1,
  },
  {
    id: 'sales_negotiation_reminder',
    role: 'james_morgan',
    trigger: 'deal_stage_change',
    condition: (ctx) => ctx.data.stage === 'Negotiation',
    action: () => ({
      type: 'schedule',
      targetRoles: ['james_morgan'],
      message: 'Negotiation phase: Follow-up reminder set every 12 hours.',
      priority: 'medium',
      data: { reminderIntervalHours: 12 },
    }),
    priority: 2,
  },
  {
    id: 'sales_broker_inactive',
    role: 'james_morgan',
    trigger: 'broker_activity_check',
    condition: (ctx) => ctx.data.inactiveDays as number >= 3,
    action: (ctx) => ({
      type: 'notify',
      targetRoles: ['founder', 'jessica'],
      message: `Broker "${ctx.data.brokerName}" inactive for ${ctx.data.inactiveDays} days.`,
      priority: 'high',
    }),
    priority: 3,
  },
];

// ============================================
// FRONT DESK (DANIEL BROOKS) DECISION LOGIC
// ============================================

export const FRONT_DESK_DECISION_RULES: DecisionRule[] = [
  {
    id: 'frontdesk_route_career',
    role: 'daniel_brooks',
    trigger: 'new_message',
    condition: (ctx) => {
      const msg = (ctx.data.message as string || '').toLowerCase();
      return msg.includes('career') || msg.includes('job') || msg.includes('apply') || msg.includes('cv');
    },
    action: () => ({
      type: 'notify',
      targetRoles: ['jessica', 'hannah'],
      message: 'Career inquiry received. Routing to HR department.',
      priority: 'medium',
    }),
    priority: 1,
  },
  {
    id: 'frontdesk_route_sales',
    role: 'daniel_brooks',
    trigger: 'new_message',
    condition: (ctx) => {
      const msg = (ctx.data.message as string || '').toLowerCase();
      return msg.includes('buy') || msg.includes('property') || msg.includes('apartment') || msg.includes('villa');
    },
    action: () => ({
      type: 'notify',
      targetRoles: ['james_morgan'],
      message: 'Property inquiry received. Routing to Sales team.',
      priority: 'medium',
    }),
    priority: 2,
  },
  {
    id: 'frontdesk_unanswered_5min',
    role: 'daniel_brooks',
    trigger: 'message_check',
    condition: (ctx) => {
      const minsSinceMessage = ctx.data.minutesSinceMessage as number || 0;
      return minsSinceMessage >= 5 && !ctx.data.responded;
    },
    action: () => ({
      type: 'escalate',
      targetRoles: ['christopher_adams'],
      message: 'Message unanswered for 5+ minutes. Escalating to CRM Manager.',
      priority: 'high',
    }),
    priority: 3,
  },
];

// ============================================
// HR MANAGER (JESSICA) DECISION LOGIC
// ============================================

export const HR_DECISION_RULES: DecisionRule[] = [
  {
    id: 'hr_duplicate_cv',
    role: 'jessica',
    trigger: 'cv_upload',
    condition: (ctx) => ctx.data.isDuplicate === true,
    action: () => ({
      type: 'log',
      targetRoles: ['jessica'],
      message: 'Duplicate CV detected. Auto-merged with existing record.',
      priority: 'low',
    }),
    priority: 1,
  },
  {
    id: 'hr_candidate_selected',
    role: 'jessica',
    trigger: 'candidate_status_change',
    condition: (ctx) => ctx.data.status === 'Selected',
    action: (ctx) => ({
      type: 'schedule',
      targetRoles: ['jessica', 'hannah'],
      message: `Candidate "${ctx.data.candidateName}" selected. Onboarding checklist generated.`,
      priority: 'medium',
      data: { generateOnboarding: true },
    }),
    priority: 2,
  },
  {
    id: 'hr_candidate_inactive_7d',
    role: 'jessica',
    trigger: 'candidate_activity_check',
    condition: (ctx) => ctx.data.inactiveDays as number >= 7,
    action: (ctx) => ({
      type: 'log',
      targetRoles: ['jessica'],
      message: `Candidate "${ctx.data.candidateName}" inactive for 7 days. Moving to Archived.`,
      priority: 'low',
      data: { moveToArchived: true },
    }),
    priority: 3,
  },
];

// ============================================
// HR ASSISTANT (HANNAH) DECISION LOGIC
// ============================================

export const HR_ASSISTANT_DECISION_RULES: DecisionRule[] = [
  {
    id: 'hannah_cv_ack',
    role: 'hannah',
    trigger: 'cv_received',
    condition: () => true,
    action: (ctx) => ({
      type: 'notify',
      targetRoles: ['hannah'],
      message: `CV acknowledgement email sent to ${ctx.data.candidateEmail}.`,
      priority: 'low',
    }),
    priority: 1,
  },
  {
    id: 'hannah_missed_reminders',
    role: 'hannah',
    trigger: 'interview_reminder_check',
    condition: (ctx) => ctx.data.missedReminders as number >= 2,
    action: (ctx) => ({
      type: 'log',
      targetRoles: ['hannah', 'jessica'],
      message: `Candidate "${ctx.data.candidateName}" marked as Unresponsive.`,
      priority: 'medium',
      data: { markUnresponsive: true },
    }),
    priority: 2,
  },
  {
    id: 'hannah_interview_confirmed',
    role: 'hannah',
    trigger: 'interview_confirmed',
    condition: () => true,
    action: (ctx) => ({
      type: 'schedule',
      targetRoles: ['jessica'],
      message: `Interview scheduled for ${ctx.data.candidateName}. HR Manager notified.`,
      priority: 'medium',
    }),
    priority: 3,
  },
];

// ============================================
// DIGITAL ASSISTANT DECISION LOGIC
// ============================================

export const DIGITAL_ASSISTANT_DECISION_RULES: DecisionRule[] = [
  {
    id: 'digital_data_mismatch',
    role: 'digital_assistant',
    trigger: 'data_sync',
    condition: (ctx) => ctx.data.mismatchFound === true,
    action: () => ({
      type: 'notify',
      targetRoles: ['christopher_adams'],
      message: 'Data mismatch detected. Reprocessing and notifying CRM Manager.',
      priority: 'medium',
    }),
    priority: 1,
  },
  {
    id: 'digital_duplicate_leads',
    role: 'digital_assistant',
    trigger: 'lead_check',
    condition: (ctx) => (ctx.data.duplicateCount as number || 0) > 3,
    action: () => ({
      type: 'log',
      targetRoles: ['digital_assistant'],
      message: 'Multiple duplicate leads detected. Auto-cleaning and generating report.',
      priority: 'medium',
      data: { autoClean: true },
    }),
    priority: 2,
  },
];

// ============================================
// CRM MANAGER (CHRISTOPHER) DECISION LOGIC
// ============================================

export const CRM_DECISION_RULES: DecisionRule[] = [
  {
    id: 'crm_unknown_source',
    role: 'christopher_adams',
    trigger: 'lead_added',
    condition: (ctx) => !ctx.data.source || ctx.data.source === 'unknown',
    action: () => ({
      type: 'notify',
      targetRoles: ['james_morgan'],
      message: 'Lead source unknown. Tagged as "Unverified" - Sales team alerted.',
      priority: 'medium',
      data: { tagUnverified: true },
    }),
    priority: 1,
  },
  {
    id: 'crm_low_conversion',
    role: 'christopher_adams',
    trigger: 'weekly_check',
    condition: (ctx) => (ctx.data.conversionRate as number || 0) < 5,
    action: () => ({
      type: 'schedule',
      targetRoles: ['james_morgan'],
      message: 'Conversion rate below 5% for 7 days. Meeting scheduled with Sales Director.',
      priority: 'high',
      data: { scheduleMeeting: true },
    }),
    priority: 2,
  },
];

// ============================================
// FINANCE (LAYLA) DECISION LOGIC
// ============================================

export const FINANCE_DECISION_RULES: DecisionRule[] = [
  {
    id: 'finance_commission_error',
    role: 'layla_ahmed',
    trigger: 'commission_calc',
    condition: (ctx) => ctx.data.calculationError === true,
    action: () => ({
      type: 'log',
      targetRoles: ['layla_ahmed'],
      message: 'Commission formula error detected. Auto-corrected and accountant notified.',
      priority: 'medium',
      data: { autoCorrect: true },
    }),
    priority: 1,
  },
  {
    id: 'finance_overdue_payment',
    role: 'layla_ahmed',
    trigger: 'payment_check',
    condition: (ctx) => (ctx.data.overdueDays as number || 0) > 7,
    action: () => ({
      type: 'escalate',
      targetRoles: ['founder'],
      message: 'Payment overdue for 7+ days. Escalating to CEO.',
      priority: 'high',
    }),
    priority: 2,
  },
];

// ============================================
// ESCALATION FLOW
// ============================================

export const ESCALATION_CHAIN = [
  { level: 1, roles: ['broker', 'staff'], escalateTo: 'christopher_adams' },
  { level: 2, roles: ['christopher_adams'], escalateTo: 'james_morgan' },
  { level: 3, roles: ['james_morgan', 'maya_khalid', 'jessica'], escalateTo: 'amanda_clarke' },
  { level: 4, roles: ['amanda_clarke'], escalateTo: 'founder' },
];

export function getEscalationTarget(currentRole: string): string {
  for (const chain of ESCALATION_CHAIN) {
    if (chain.roles.includes(currentRole)) {
      return chain.escalateTo;
    }
  }
  return 'founder';
}

export function formatEscalationLog(fromRole: string, toRole: string, reason: string): string {
  const fromName = getPersonalityById(fromRole)?.name || fromRole;
  return `[ESCALATION] Escalated by ${fromName}: ${reason}`;
}

// ============================================
// COMMUNICATION LOGIC
// ============================================

export const COMMUNICATION_ROUTING = {
  career: ['jessica', 'hannah'],
  job: ['jessica', 'hannah'],
  apply: ['jessica', 'hannah'],
  cv: ['jessica', 'hannah'],
  buy: ['james_morgan'],
  property: ['james_morgan'],
  apartment: ['james_morgan'],
  villa: ['james_morgan'],
  investment: ['james_morgan', 'layla_ahmed'],
  payment: ['layla_ahmed'],
  commission: ['layla_ahmed'],
  marketing: ['maya_khalid'],
  campaign: ['maya_khalid'],
  content: ['emma_torres'],
};

export function routeMessage(message: string): string[] {
  const lowerMsg = message.toLowerCase();
  const targets: Set<string> = new Set();
  
  for (const [keyword, roles] of Object.entries(COMMUNICATION_ROUTING)) {
    if (lowerMsg.includes(keyword)) {
      roles.forEach(role => targets.add(role));
    }
  }
  
  // Default to front desk if no specific routing
  if (targets.size === 0) {
    targets.add('daniel_brooks');
  }
  
  return Array.from(targets);
}

// ============================================
// RESPONSE TIMING
// ============================================

export const RESPONSE_TIMING = {
  internal: {
    maxMs: 10000,
    typingDelayMs: { min: 500, max: 1500 },
  },
  client: {
    maxMs: 30000,
    typingDelayMs: { min: 1000, max: 3000 },
  },
};

export function simulateTypingDelay(isInternal: boolean): Promise<void> {
  const timing = isInternal ? RESPONSE_TIMING.internal : RESPONSE_TIMING.client;
  const delay = Math.random() * (timing.typingDelayMs.max - timing.typingDelayMs.min) + timing.typingDelayMs.min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

// ============================================
// REPORT SCHEDULE
// ============================================

export const REPORT_SCHEDULE = {
  sales: { hour: 8, minute: 0, roles: ['james_morgan', 'founder'] },
  hr: { hour: 9, minute: 0, roles: ['jessica', 'founder'] },
  finance: { hour: 10, minute: 0, roles: ['layla_ahmed', 'founder'] },
  system: { hour: 20, minute: 0, roles: ['digital_assistant', 'founder', 'christopher_adams'] },
};

// ============================================
// CAPACITY MANAGEMENT
// ============================================

export function getCapacityStatus(current: number, max: number): {
  percent: number;
  status: 'normal' | 'warning' | 'critical';
  action?: string;
} {
  const percent = (current / max) * 100;
  
  if (percent >= 100) {
    return { percent, status: 'critical', action: 'Auto-reassign to available broker' };
  }
  if (percent >= 80) {
    return { percent, status: 'warning', action: 'Warn broker about capacity' };
  }
  return { percent, status: 'normal' };
}

// ============================================
// ALL DECISION RULES COMBINED
// ============================================

export const ALL_DECISION_RULES: DecisionRule[] = [
  ...FOUNDER_DECISION_RULES,
  ...AMANDA_DECISION_RULES,
  ...SALES_DECISION_RULES,
  ...FRONT_DESK_DECISION_RULES,
  ...HR_DECISION_RULES,
  ...HR_ASSISTANT_DECISION_RULES,
  ...DIGITAL_ASSISTANT_DECISION_RULES,
  ...CRM_DECISION_RULES,
  ...FINANCE_DECISION_RULES,
];

// ============================================
// DECISION ENGINE
// ============================================

export function processDecision(context: DecisionContext): DecisionAction | null {
  const applicableRules = ALL_DECISION_RULES
    .filter(rule => rule.trigger === context.event)
    .filter(rule => !rule.role || rule.role === context.roleId)
    .filter(rule => rule.condition(context))
    .sort((a, b) => a.priority - b.priority);
  
  if (applicableRules.length === 0) return null;
  
  return applicableRules[0].action(context);
}

// ============================================
// PERMISSION CHECKS
// ============================================

export function canPerformAction(roleId: string, action: string): boolean {
  // Founder can do everything
  if (roleId === 'founder') return true;
  
  // Check founder-only actions
  if (GLOBAL_BEHAVIOR_RULES.founderOnlyActions.includes(action)) {
    return false;
  }
  
  // Check admin restrictions
  if (roleId === 'admin' && GLOBAL_BEHAVIOR_RULES.adminRestrictions.includes(action)) {
    return false;
  }
  
  const personality = getPersonalityById(roleId);
  if (!personality) return false;
  
  if (personality.permissions.includes('all')) return true;
  
  return personality.permissions.includes(action);
}

// ============================================
// LOGGING
// ============================================

export interface ActionLog {
  timestamp: Date;
  actorId: string;
  actorName: string;
  action: string;
  targetId?: string;
  details: string;
  escalatedBy?: string;
}

export function createActionLog(
  actorId: string,
  action: string,
  details: string,
  targetId?: string,
  escalatedBy?: string
): ActionLog {
  const actor = getPersonalityById(actorId);
  return {
    timestamp: new Date(),
    actorId,
    actorName: actor?.name || actorId,
    action,
    targetId,
    details,
    escalatedBy,
  };
}

export default {
  GLOBAL_BEHAVIOR_RULES,
  ALL_DECISION_RULES,
  ESCALATION_CHAIN,
  COMMUNICATION_ROUTING,
  RESPONSE_TIMING,
  REPORT_SCHEDULE,
  processDecision,
  getEscalationTarget,
  formatEscalationLog,
  routeMessage,
  simulateTypingDelay,
  getCapacityStatus,
  canPerformAction,
  createActionLog,
};
