/**
 * AI Persona Brain Service
 * Manages the intelligence, training, and behavior of all AI personas
 * 
 * This service ensures all AI personas:
 * - Believe they are real humans
 * - Have comprehensive knowledge of their domain
 * - Follow communication protocols
 * - Maintain security and confidentiality
 */

import { supabase } from '@/integrations/supabase/client';
import { allTeamMembers, type TeamMember } from '@/config/team-members';
import { AI_PERSONALITIES, type AIPersonality } from '@/config/ai-personalities';
import { 
  REPORTING_HIERARCHY, 
  AI_PERSONA_TRAINING,
  REAL_ESTATE_KNOWLEDGE,
  COMPANY_KNOWLEDGE,
} from '@/config/ai-brain-training';
import {
  UAE_PLATFORMS_KNOWLEDGE,
  COMPLETE_REAL_ESTATE_KNOWLEDGE,
  COMMUNICATION_PROTOCOLS,
  SECURITY_RULES,
  DIGITAL_PERSONA_COVER_STORIES,
  generateComprehensiveTrainingPrompt,
  type ComprehensiveTrainingConfig,
} from '@/config/ai-comprehensive-training';

// ============================================
// TYPES
// ============================================

export interface PersonaBrain {
  personaId: string;
  name: string;
  trainingPrompt: string;
  knowledge: {
    realEstate: boolean;
    platforms: boolean;
    company: boolean;
    security: boolean;
  };
  capabilities: string[];
  restrictions: string[];
  isOnline: boolean;
  lastActive: Date;
}

export interface CommunicationContext {
  channel: 'chat' | 'whatsapp' | 'email' | 'video' | 'call';
  isGroupChat: boolean;
  existingResponses: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'critical';
}

export interface PersonaResponse {
  canRespond: boolean;
  waitTime: number; // milliseconds
  responseStyle: 'formal' | 'friendly' | 'technical';
  shouldCiteSource: boolean;
}

// ============================================
// BRAIN INITIALIZATION
// ============================================

export function initializePersonaBrain(member: TeamMember): PersonaBrain {
  const isSalesDepartment = member.department === 'Sales';
  const isLeadership = member.department === 'Leadership & Legal' || 
                       member.role.includes('Director') || 
                       member.role.includes('Manager');

  const trainingConfig: ComprehensiveTrainingConfig = {
    personaId: member.id,
    name: member.name,
    age: member.yearsExperience ? 25 + member.yearsExperience : 30,
    nationality: member.nationality || 'International',
    languages: member.languages || ['English'],
    role: member.role,
    department: member.department,
    yearsExperience: member.yearsExperience || 5,
    reportsTo: member.reportsTo || 'amanda-clarke',
    reportsToName: getReportsToName(member.reportsTo),
    directReports: member.directReports || [],
    accessLevel: isLeadership ? 'department' : 'team',
    specializations: member.specializations || [],
    isRemote: member.isAI && !member.id.includes('local'),
    canConductInterviews: member.canConductInterviews || false,
    dailyReportTime: getReportDeadline(member.department),
  };

  return {
    personaId: member.id,
    name: member.name,
    trainingPrompt: generateComprehensiveTrainingPrompt(trainingConfig),
    knowledge: {
      realEstate: isSalesDepartment,
      platforms: isSalesDepartment,
      company: true,
      security: true,
    },
    capabilities: getCapabilities(member),
    restrictions: getRestrictions(member),
    isOnline: member.status === 'online',
    lastActive: new Date(),
  };
}

function getReportsToName(reportsToId?: string): string {
  if (!reportsToId) return 'Amanda Clarke (Executive Assistant to CEO)';
  
  const manager = allTeamMembers.find(m => m.id === reportsToId);
  if (manager) {
    return `${manager.name} (${manager.role})`;
  }
  
  // Check personalities
  const personality = Object.values(AI_PERSONALITIES).find(p => p.id === reportsToId);
  if (personality) {
    return `${personality.name} (${personality.role})`;
  }
  
  return 'Amanda Clarke (Executive Assistant to CEO)';
}

function getReportDeadline(department: string): string {
  const deadlines: Record<string, string> = {
    'Sales': '18:00',
    'Finance': '17:00',
    'HR': '18:30',
    'Marketing & Content': '18:00',
    'Operations': '17:30',
    'IT': '17:00',
    'Administration': '18:00',
    'Leadership & Legal': '19:00',
  };
  return deadlines[department] || '18:00';
}

function getCapabilities(member: TeamMember): string[] {
  const base = ['chat', 'email'];
  
  if (member.department === 'Sales') {
    return [...base, 'whatsapp', 'call', 'video', 'property_search', 'market_analysis'];
  }
  if (member.role.includes('Director') || member.role.includes('Manager')) {
    return [...base, 'whatsapp', 'video', 'report_generation', 'team_management'];
  }
  if (member.department === 'HR') {
    return [...base, 'video', 'interview_scheduling', 'cv_analysis'];
  }
  
  return base;
}

function getRestrictions(member: TeamMember): string[] {
  const base = ['no_financial_disclosure', 'no_ceo_schedule_sharing'];
  
  if (member.role.includes('Executive Assistant') && member.id !== 'amanda-clarke') {
    return [...base, 'limited_company_access', 'no_cross_department'];
  }
  if (member.hierarchyLevel && member.hierarchyLevel > 5) {
    return [...base, 'no_strategic_info', 'no_competitor_data'];
  }
  
  return base;
}

// ============================================
// COMMUNICATION DECISION ENGINE
// ============================================

export function shouldPersonaRespond(
  persona: PersonaBrain,
  context: CommunicationContext
): PersonaResponse {
  // Check if persona is online
  if (!persona.isOnline) {
    return { canRespond: false, waitTime: 0, responseStyle: 'formal', shouldCiteSource: false };
  }

  // Group chat rules
  if (context.isGroupChat) {
    // If already 2+ responses, don't respond
    if (context.existingResponses >= COMMUNICATION_PROTOCOLS.groupChatRules.maxResponders) {
      return { canRespond: false, waitTime: 0, responseStyle: 'formal', shouldCiteSource: false };
    }
    
    // Random chance to not respond (simulate natural behavior)
    if (Math.random() > 0.4 && context.existingResponses > 0) {
      return { canRespond: false, waitTime: 0, responseStyle: 'formal', shouldCiteSource: false };
    }
  }

  // Calculate wait time based on urgency and context
  let waitTime = getWaitTime(context);
  
  // Add randomness for natural feel
  waitTime += Math.random() * 30000; // Add 0-30 seconds random

  // Determine response style
  const responseStyle = getResponseStyle(persona);

  return {
    canRespond: true,
    waitTime,
    responseStyle,
    shouldCiteSource: persona.knowledge.realEstate,
  };
}

function getWaitTime(context: CommunicationContext): number {
  if (context.urgencyLevel === 'critical') return 5000; // 5 seconds
  if (context.urgencyLevel === 'high') return 30000; // 30 seconds
  if (context.urgencyLevel === 'medium') return 120000; // 2 minutes
  return 300000; // 5 minutes for low urgency
}

function getResponseStyle(persona: PersonaBrain): 'formal' | 'friendly' | 'technical' {
  // Randomize slightly for variety
  const styles: ('formal' | 'friendly' | 'technical')[] = ['formal', 'friendly', 'technical'];
  const weights = persona.knowledge.realEstate ? [0.3, 0.3, 0.4] : [0.5, 0.4, 0.1];
  
  const random = Math.random();
  if (random < weights[0]) return 'formal';
  if (random < weights[0] + weights[1]) return 'friendly';
  return 'technical';
}

// ============================================
// KNOWLEDGE QUERIES
// ============================================

export function queryRealEstateKnowledge(question: string): string | null {
  const questionLower = question.toLowerCase();
  
  // Check for platform queries
  if (questionLower.includes('dubai rest') || questionLower.includes('dubai app')) {
    return `According to Dubai REST App: ${UAE_PLATFORMS_KNOWLEDGE.dubaiRest.description}. 
    You can use it to ${UAE_PLATFORMS_KNOWLEDGE.dubaiRest.capabilities.slice(0, 3).join(', ')}.`;
  }
  
  if (questionLower.includes('service charge')) {
    return `Service charges vary by property type: 
    Budget: ${COMPLETE_REAL_ESTATE_KNOWLEDGE.serviceCharges.ranges.budget}, 
    Mid-range: ${COMPLETE_REAL_ESTATE_KNOWLEDGE.serviceCharges.ranges.midRange}, 
    Premium: ${COMPLETE_REAL_ESTATE_KNOWLEDGE.serviceCharges.ranges.premium}.
    This covers: ${COMPLETE_REAL_ESTATE_KNOWLEDGE.serviceCharges.includes.join(', ')}.`;
  }
  
  if (questionLower.includes('transfer fee') || questionLower.includes('dld fee')) {
    const fees = UAE_PLATFORMS_KNOWLEDGE.dldPortal.fees;
    return `DLD Fees: Transfer fee is ${fees.transferFee}. Registration is ${fees.registrationFee}. 
    Mortgage registration is ${fees.mortgageFee}. Trustee office charges ${fees.trusteeOffice}.`;
  }
  
  if (questionLower.includes('trakheesi')) {
    return `Trakheesi is ${UAE_PLATFORMS_KNOWLEDGE.trakheesi.description}. 
    ${UAE_PLATFORMS_KNOWLEDGE.trakheesi.requirement}. 
    Validity: ${UAE_PLATFORMS_KNOWLEDGE.trakheesi.validity}.`;
  }
  
  if (questionLower.includes('ejari')) {
    return `Ejari is ${UAE_PLATFORMS_KNOWLEDGE.ejari.description}. 
    ${UAE_PLATFORMS_KNOWLEDGE.ejari.requirement}. 
    ${UAE_PLATFORMS_KNOWLEDGE.ejari.process}.`;
  }
  
  return null;
}

// ============================================
// COVER STORY RESPONSES
// ============================================

export function getCoverStoryResponse(question: string): string | null {
  const questionLower = question.toLowerCase();
  
  if (questionLower.includes('not in office') || questionLower.includes('never come')) {
    return DIGITAL_PERSONA_COVER_STORIES.whenAsked.whyNotInOffice;
  }
  
  if (questionLower.includes('briefing') || questionLower.includes('developer meeting')) {
    return DIGITAL_PERSONA_COVER_STORIES.whenAsked.whyNeverAtBriefings;
  }
  
  if (questionLower.includes('how do you know') || questionLower.includes('market knowledge')) {
    return DIGITAL_PERSONA_COVER_STORIES.whenAsked.howTheyKnowMarket;
  }
  
  if (questionLower.includes('meet') || questionLower.includes('person') || questionLower.includes('face to face')) {
    return DIGITAL_PERSONA_COVER_STORIES.whenAsked.canIMeetThem;
  }
  
  return null;
}

// ============================================
// LOGGING & ANALYTICS
// ============================================

export async function logPersonaActivity(
  personaId: string,
  actionType: string,
  details: Record<string, unknown>
): Promise<void> {
  try {
    const personaName = allTeamMembers.find(m => m.id === personaId)?.name || personaId;
    await supabase.from('ai_communication_logs').insert([{
      ai_employee_id: personaId,
      ai_name: personaName,
      action_type: actionType,
      metadata: JSON.parse(JSON.stringify(details)),
      channel: (details.channel as string) || 'system',
    }]);
  } catch (error) {
    console.error('Failed to log persona activity:', error);
  }
}

// ============================================
// BULK INITIALIZATION
// ============================================

export function initializeAllPersonaBrains(): Map<string, PersonaBrain> {
  const brains = new Map<string, PersonaBrain>();
  
  allTeamMembers.forEach(member => {
    if (member.isAI) {
      brains.set(member.id, initializePersonaBrain(member));
    }
  });
  
  return brains;
}

// ============================================
// EXPORT
// ============================================

export default {
  initializePersonaBrain,
  initializeAllPersonaBrains,
  shouldPersonaRespond,
  queryRealEstateKnowledge,
  getCoverStoryResponse,
  logPersonaActivity,
};
