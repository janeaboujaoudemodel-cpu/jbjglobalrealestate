/**
 * JBJ AI Emotion Detection & Urgency Classification Engine
 * Detects emotional tone, classifies urgency, and provides adaptive responses
 */

// ============================================
// EMOTION TYPES & INTERFACES
// ============================================

export type EmotionType = 
  | 'angry' 
  | 'frustrated' 
  | 'urgent' 
  | 'positive' 
  | 'excited' 
  | 'sad' 
  | 'disappointed' 
  | 'confused' 
  | 'neutral' 
  | 'happy' 
  | 'satisfied';

export type UrgencyLevel = 'critical' | 'high' | 'normal' | 'low';

export interface EmotionAnalysis {
  emotion: EmotionType;
  confidence: number; // 0-100
  urgency: UrgencyLevel;
  sentiment: number; // -1 to +1
  keywords: string[];
  suggestedTone: ToneResponse;
  shouldEscalate: boolean;
  escalationReason?: string;
}

export interface ToneResponse {
  style: 'empathetic' | 'reassuring' | 'enthusiastic' | 'supportive' | 'professional' | 'warm';
  prefix?: string;
  suffix?: string;
  responseDeadlineMinutes: number;
}

// ============================================
// EMOTION KEYWORD PATTERNS
// ============================================

export const EMOTION_PATTERNS: Record<EmotionType, {
  keywords: string[];
  phrases: string[];
  weight: number;
}> = {
  angry: {
    keywords: ['angry', 'furious', 'outraged', 'mad', 'livid', 'unacceptable'],
    phrases: [
      'this is unacceptable',
      'i am not happy',
      'terrible service',
      'worst experience',
      'completely disappointed',
      'how dare you',
      'i demand',
      'sue you',
      'legal action',
    ],
    weight: 1.0,
  },
  frustrated: {
    keywords: ['frustrated', 'annoyed', 'irritated', 'upset', 'bothered'],
    phrases: [
      'still waiting',
      'no reply',
      'why no response',
      'been waiting for',
      'how long does it take',
      'third time asking',
      'already told you',
      'keep repeating',
      'still not resolved',
    ],
    weight: 0.9,
  },
  urgent: {
    keywords: ['urgent', 'asap', 'immediately', 'emergency', 'critical', 'now'],
    phrases: [
      'right now',
      'as soon as possible',
      'very urgent',
      'time sensitive',
      'deadline today',
      'meeting in',
      'need this today',
      'cannot wait',
      'must have by',
    ],
    weight: 0.95,
  },
  positive: {
    keywords: ['perfect', 'amazing', 'wonderful', 'excellent', 'fantastic', 'great'],
    phrases: [
      'thank you so much',
      'really appreciate',
      'you are the best',
      'great work',
      'well done',
      'impressed by',
      'exceeded expectations',
    ],
    weight: 0.7,
  },
  excited: {
    keywords: ['excited', 'thrilled', 'delighted', 'eager', 'enthusiastic'],
    phrases: [
      'can\'t wait',
      'so excited',
      'looking forward',
      'this is amazing',
      'love this',
      'exactly what i wanted',
    ],
    weight: 0.7,
  },
  sad: {
    keywords: ['sad', 'heartbroken', 'devastated', 'unhappy'],
    phrases: [
      'very sad',
      'breaks my heart',
      'difficult time',
      'hard to accept',
    ],
    weight: 0.8,
  },
  disappointed: {
    keywords: ['disappointed', 'letdown', 'underwhelmed', 'dissatisfied'],
    phrases: [
      'expected better',
      'not what i expected',
      'falls short',
      'could have been better',
      'not satisfied',
      'below expectations',
    ],
    weight: 0.85,
  },
  confused: {
    keywords: ['confused', 'unclear', 'lost', 'puzzled', 'unsure'],
    phrases: [
      'don\'t understand',
      'what do you mean',
      'can you explain',
      'not clear',
      'i\'m confused',
      'makes no sense',
      'help me understand',
      'what does this mean',
    ],
    weight: 0.6,
  },
  neutral: {
    keywords: [],
    phrases: [],
    weight: 0.3,
  },
  happy: {
    keywords: ['happy', 'pleased', 'glad', 'content', 'satisfied'],
    phrases: [
      'very happy',
      'glad to hear',
      'pleased with',
      'good to know',
    ],
    weight: 0.65,
  },
  satisfied: {
    keywords: ['satisfied', 'content', 'fulfilled'],
    phrases: [
      'thanks a lot',
      'really appreciate',
      'well done',
      'great job',
      'means a lot',
    ],
    weight: 0.65,
  },
};

// ============================================
// URGENCY KEYWORD PATTERNS
// ============================================

export const URGENCY_PATTERNS: Record<UrgencyLevel, {
  keywords: string[];
  phrases: string[];
  responseDeadlineMinutes: number;
}> = {
  critical: {
    keywords: ['emergency', 'critical', 'failure', 'urgent', 'asap', 'immediately'],
    phrases: [
      'system failure',
      'meeting in 10',
      'server issue',
      'urgent help',
      'need now',
      'this is critical',
      'cannot function',
      'legal matter',
      'security issue',
    ],
    responseDeadlineMinutes: 10,
  },
  high: {
    keywords: ['urgently', 'important', 'priority', 'pressing'],
    phrases: [
      'respond urgently',
      'client waiting',
      'payment due today',
      'deadline tomorrow',
      'need by end of day',
      'high priority',
      'please hurry',
    ],
    responseDeadlineMinutes: 30,
  },
  normal: {
    keywords: ['please', 'when possible', 'check', 'review', 'schedule'],
    phrases: [
      'please review',
      'let\'s check',
      'can we schedule',
      'would like to discuss',
      'when you have time',
    ],
    responseDeadlineMinutes: 120,
  },
  low: {
    keywords: ['fyi', 'later', 'whenever', 'no rush', 'optional'],
    phrases: [
      'for your information',
      'no rush',
      'when you can',
      'for later',
      'just sharing',
      'no pressure',
    ],
    responseDeadlineMinutes: 480,
  },
};

// ============================================
// TONE RESPONSE TEMPLATES
// ============================================

export const TONE_RESPONSES: Record<EmotionType, ToneResponse> = {
  angry: {
    style: 'empathetic',
    prefix: 'I completely understand your frustration, and I sincerely apologize for any inconvenience.',
    suffix: 'I have prioritized your request and will personally ensure this is resolved.',
    responseDeadlineMinutes: 15,
  },
  frustrated: {
    style: 'reassuring',
    prefix: 'I truly understand your concerns, and I apologize for the delay.',
    suffix: 'Let me resolve this right away — you\'ll receive an update within the next 15 minutes.',
    responseDeadlineMinutes: 15,
  },
  urgent: {
    style: 'professional',
    prefix: 'Understood. Marking this as urgent now.',
    suffix: 'You\'ll receive a confirmation once completed.',
    responseDeadlineMinutes: 10,
  },
  positive: {
    style: 'warm',
    prefix: 'Thank you so much for your kind words!',
    suffix: 'It\'s always a pleasure assisting you.',
    responseDeadlineMinutes: 60,
  },
  excited: {
    style: 'enthusiastic',
    prefix: 'That\'s wonderful to hear!',
    suffix: 'We\'re thrilled to be part of your journey.',
    responseDeadlineMinutes: 60,
  },
  sad: {
    style: 'empathetic',
    prefix: 'I\'m truly sorry to hear about your situation.',
    suffix: 'Please know that we\'re here to support you in any way we can.',
    responseDeadlineMinutes: 30,
  },
  disappointed: {
    style: 'reassuring',
    prefix: 'I\'m sorry we didn\'t meet your expectations.',
    suffix: 'Please allow me to make this right for you.',
    responseDeadlineMinutes: 30,
  },
  confused: {
    style: 'supportive',
    prefix: 'Of course — let me clarify this for you step by step.',
    suffix: 'Does that help? Please let me know if you need any further explanation.',
    responseDeadlineMinutes: 60,
  },
  neutral: {
    style: 'professional',
    prefix: '',
    suffix: '',
    responseDeadlineMinutes: 120,
  },
  happy: {
    style: 'warm',
    prefix: 'I\'m glad to hear that!',
    suffix: 'Thank you for trusting JBJ Global Real Estate.',
    responseDeadlineMinutes: 60,
  },
  satisfied: {
    style: 'warm',
    prefix: 'Thank you for the kind words — it means a lot!',
    suffix: 'We look forward to continuing to serve you.',
    responseDeadlineMinutes: 60,
  },
};

// ============================================
// ESCALATION ROUTING RULES
// ============================================

export interface EscalationRule {
  condition: (analysis: EmotionAnalysis) => boolean;
  targets: string[];
  reason: string;
  priority: UrgencyLevel;
  responseDeadlineMinutes: number;
}

export const ESCALATION_RULES: EscalationRule[] = [
  {
    condition: (a) => a.emotion === 'angry' && a.confidence >= 70,
    targets: ['christopher_adams', 'jessica', 'amanda_clarke'],
    reason: 'Client expressed significant dissatisfaction',
    priority: 'high',
    responseDeadlineMinutes: 10,
  },
  {
    condition: (a) => a.urgency === 'critical',
    targets: ['amanda_clarke', 'founder'],
    reason: 'Critical urgency detected',
    priority: 'critical',
    responseDeadlineMinutes: 10,
  },
  {
    condition: (a) => a.emotion === 'frustrated' && a.confidence >= 80,
    targets: ['christopher_adams', 'amanda_clarke'],
    reason: 'Client showing signs of frustration',
    priority: 'high',
    responseDeadlineMinutes: 15,
  },
  {
    condition: (a) => a.sentiment <= -0.7,
    targets: ['jessica', 'christopher_adams'],
    reason: 'Negative sentiment detected',
    priority: 'high',
    responseDeadlineMinutes: 15,
  },
];

// ============================================
// DETECTION FUNCTIONS
// ============================================

export function analyzeMessage(message: string): EmotionAnalysis {
  const lowerMessage = message.toLowerCase();
  const words = lowerMessage.split(/\s+/);
  
  // Calculate emotion scores
  const emotionScores: Record<EmotionType, number> = {} as Record<EmotionType, number>;
  const matchedKeywords: string[] = [];
  
  for (const [emotion, patterns] of Object.entries(EMOTION_PATTERNS) as [EmotionType, typeof EMOTION_PATTERNS[EmotionType]][]) {
    let score = 0;
    
    // Check keywords
    for (const keyword of patterns.keywords) {
      if (words.includes(keyword)) {
        score += patterns.weight * 20;
        matchedKeywords.push(keyword);
      }
    }
    
    // Check phrases
    for (const phrase of patterns.phrases) {
      if (lowerMessage.includes(phrase)) {
        score += patterns.weight * 30;
        matchedKeywords.push(phrase);
      }
    }
    
    emotionScores[emotion] = score;
  }
  
  // Find dominant emotion
  let dominantEmotion: EmotionType = 'neutral';
  let maxScore = 0;
  
  for (const [emotion, score] of Object.entries(emotionScores)) {
    if (score > maxScore) {
      maxScore = score;
      dominantEmotion = emotion as EmotionType;
    }
  }
  
  // Calculate confidence
  const confidence = Math.min(100, maxScore);
  
  // Calculate sentiment score (-1 to +1)
  const negativeEmotions: EmotionType[] = ['angry', 'frustrated', 'sad', 'disappointed'];
  const positiveEmotions: EmotionType[] = ['positive', 'excited', 'happy', 'satisfied'];
  
  let sentiment = 0;
  if (negativeEmotions.includes(dominantEmotion)) {
    sentiment = -1 * (confidence / 100);
  } else if (positiveEmotions.includes(dominantEmotion)) {
    sentiment = confidence / 100;
  }
  
  // Determine urgency
  const urgency = detectUrgency(lowerMessage, words);
  
  // Get tone response
  const suggestedTone = TONE_RESPONSES[dominantEmotion];
  
  // Check if escalation is needed
  const analysis: EmotionAnalysis = {
    emotion: dominantEmotion,
    confidence,
    urgency,
    sentiment,
    keywords: matchedKeywords,
    suggestedTone,
    shouldEscalate: false,
  };
  
  // Apply escalation rules
  for (const rule of ESCALATION_RULES) {
    if (rule.condition(analysis)) {
      analysis.shouldEscalate = true;
      analysis.escalationReason = rule.reason;
      break;
    }
  }
  
  return analysis;
}

function detectUrgency(lowerMessage: string, words: string[]): UrgencyLevel {
  // Check from highest to lowest urgency
  const levels: UrgencyLevel[] = ['critical', 'high', 'normal', 'low'];
  
  for (const level of levels) {
    const patterns = URGENCY_PATTERNS[level];
    
    // Check keywords
    for (const keyword of patterns.keywords) {
      if (words.includes(keyword)) {
        return level;
      }
    }
    
    // Check phrases
    for (const phrase of patterns.phrases) {
      if (lowerMessage.includes(phrase)) {
        return level;
      }
    }
  }
  
  return 'normal';
}

// ============================================
// RESPONSE GENERATION
// ============================================

export function generateAdaptiveResponse(
  baseContent: string,
  analysis: EmotionAnalysis,
  senderName: string = 'Your advisor'
): string {
  const tone = analysis.suggestedTone;
  let response = baseContent;
  
  // Add empathetic prefix
  if (tone.prefix) {
    response = `${tone.prefix}\n\n${response}`;
  }
  
  // Add closing suffix
  if (tone.suffix) {
    response = `${response}\n\n${tone.suffix}`;
  }
  
  return response;
}

// ============================================
// OFF-HOURS DETECTION
// ============================================

export function isOffHours(): boolean {
  const hour = new Date().getHours();
  const day = new Date().getDay();
  
  // Off hours: before 9 AM, after 6 PM, or weekends
  return hour < 9 || hour >= 18 || day === 0 || day === 6;
}

export function getOffHoursResponse(urgency: UrgencyLevel): string {
  if (urgency === 'critical') {
    return 'Thank you for your urgent message. Our team has been alerted and will respond immediately. For critical emergencies, please call +971 54 717 6710.';
  }
  
  return 'Thank you for your message. Our team is currently offline, but I\'ve marked this as important. You\'ll receive a response first thing tomorrow morning.\n\nKind regards,\nJBJ Global Real Estate';
}

// ============================================
// SENTIMENT ICON MAPPING
// ============================================

export function getEmotionIcon(emotion: EmotionType): string {
  const icons: Record<EmotionType, string> = {
    angry: '[ANGRY]',
    frustrated: '[FRUSTRATED]',
    urgent: '[URGENT]',
    positive: '[POSITIVE]',
    excited: '[EXCITED]',
    sad: '[SAD]',
    disappointed: '[DISAPPOINTED]',
    confused: '[CONFUSED]',
    neutral: '[NEUTRAL]',
    happy: '[HAPPY]',
    satisfied: '[SATISFIED]',
  };
  
  return icons[emotion] || '[NEUTRAL]';
}

export function getUrgencyColor(urgency: UrgencyLevel): string {
  const colors: Record<UrgencyLevel, string> = {
    critical: 'hsl(var(--destructive))',
    high: 'hsl(25 95% 53%)', // Orange
    normal: 'hsl(142 76% 36%)', // Green
    low: 'hsl(var(--muted-foreground))',
  };
  
  return colors[urgency];
}

export function getUrgencyLabel(urgency: UrgencyLevel): string {
  const labels: Record<UrgencyLevel, string> = {
    critical: '[CRITICAL]',
    high: '[HIGH]',
    normal: '[NORMAL]',
    low: '[LOW]',
  };
  
  return labels[urgency];
}

// ============================================
// EXPORTS
// ============================================

export default {
  analyzeMessage,
  generateAdaptiveResponse,
  isOffHours,
  getOffHoursResponse,
  getEmotionIcon,
  getUrgencyColor,
  getUrgencyLabel,
  EMOTION_PATTERNS,
  URGENCY_PATTERNS,
  TONE_RESPONSES,
  ESCALATION_RULES,
};
