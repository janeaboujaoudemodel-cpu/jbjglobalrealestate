/**
 * AI Intent Classification System - JBJ Global Real Estate
 * Classifies leads into Buy, Sell, Rent, Broker, and Partner Services
 */

// ============================================
// INTENT TYPES
// ============================================

export type LeadIntent = 
  | 'buy' 
  | 'sell' 
  | 'rent' 
  | 'broker_registration' 
  | 'partner_services';

export type PartnerServiceType = 
  | 'mortgage' 
  | 'legal' 
  | 'company_setup' 
  | 'visa_golden' 
  | 'visa_investor' 
  | 'visa_schengen'
  | null;

export type RentalUserType = 'tenant' | 'landlord' | null;

export interface IntentClassification {
  intent: LeadIntent;
  confidence: number;
  partnerServiceType?: PartnerServiceType;
  rentalUserType?: RentalUserType;
  keywords: string[];
}

// ============================================
// KEYWORD MAPPINGS
// ============================================

export const INTENT_KEYWORDS = {
  buy: [
    'buy', 'purchase', 'invest', 'investment', 'looking to buy', 'want to buy',
    'buying property', 'off-plan', 'offplan', 'new launch', 'investor',
    'capital appreciation', 'property investment', 'freehold', 'own', 'ownership',
    'first home', 'second home', 'holiday home', 'vacation property',
    'roi', 'yield', 'returns', 'golden visa property'
  ],
  sell: [
    'sell', 'selling', 'list my property', 'want to sell', 'looking to sell',
    'property valuation', 'market price', 'home value', 'property worth',
    'list for sale', 'sale listing', 'seller', 'selling property',
    'exit strategy', 'dispose', 'offload'
  ],
  rent: [
    'rent', 'rental', 'tenant', 'landlord', 'renting',
    'monthly rent', 'annual rent', 'looking to rent', 'want to rent',
    'short term', 'long term', 'furnished', 'unfurnished', 'move in',
    'ejari', 'dewa', 'tenancy', 'tenancy contract', 'rental agreement',
    'property management', 'let', 'letting'
  ],
  broker_registration: [
    'become a broker', 'join as broker', 'broker registration', 'agent career',
    'real estate career', 'work as broker', 'broker application', 'agent registration',
    'join jbj', 'join the team', 'career in real estate', 'broker opportunity'
  ],
  partner_services: [
    'mortgage', 'home loan', 'bank loan', 'financing', 'finance',
    'legal', 'lawyer', 'attorney', 'contract', 'documentation', 'poa',
    'company setup', 'business setup', 'free zone', 'mainland', 'trade license',
    'visa', 'golden visa', 'investor visa', 'residence', 'residency', 'schengen',
    'immigration', 'emirates id'
  ]
};

export const PARTNER_SERVICE_KEYWORDS = {
  mortgage: ['mortgage', 'home loan', 'bank loan', 'financing', 'finance', 'ltv', 'pre-approval'],
  legal: ['legal', 'lawyer', 'attorney', 'contract', 'mou', 'spa', 'poa', 'power of attorney', 'documentation'],
  company_setup: ['company setup', 'business setup', 'free zone', 'mainland', 'trade license', 'corporate'],
  visa_golden: ['golden visa', '2 million', 'aed 2m', '2m property'],
  visa_investor: ['investor visa', 'residence visa', 'residency'],
  visa_schengen: ['schengen', 'europe visa', 'eu visa']
};

export const RENTAL_TENANT_KEYWORDS = [
  'looking for apartment', 'looking for villa', 'need to rent', 'want to rent',
  'move in', 'relocating', 'relocation', 'moving to dubai', 'new to dubai',
  'monthly budget', 'can pay', 'my budget', 'furnished apartment', 'studio',
  'apartment for rent', 'villa for rent', 'townhouse for rent'
];

export const RENTAL_LANDLORD_KEYWORDS = [
  'list my property', 'rent out', 'rent my', 'tenant for', 'find tenant',
  'my property', 'own property', 'vacant property', 'investment property',
  'rental income', 'letting', 'property management', 'manage my property'
];

// ============================================
// CLASSIFICATION FUNCTION
// ============================================

export function classifyIntent(message: string): IntentClassification {
  const lowerMessage = message.toLowerCase();
  const foundKeywords: string[] = [];
  
  const scores: Record<LeadIntent, number> = {
    buy: 0,
    sell: 0,
    rent: 0,
    broker_registration: 0,
    partner_services: 0
  };

  // Score each intent based on keyword matches
  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    for (const keyword of keywords) {
      if (lowerMessage.includes(keyword)) {
        scores[intent as LeadIntent] += keyword.split(' ').length; // Multi-word keywords score higher
        foundKeywords.push(keyword);
      }
    }
  }

  // Find the highest scoring intent
  let maxScore = 0;
  let primaryIntent: LeadIntent = 'buy'; // Default to buy
  
  for (const [intent, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      primaryIntent = intent as LeadIntent;
    }
  }

  // Calculate confidence (0-1)
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const confidence = totalScore > 0 ? maxScore / totalScore : 0.5;

  // Determine partner service type if applicable
  let partnerServiceType: PartnerServiceType = null;
  if (primaryIntent === 'partner_services') {
    for (const [service, keywords] of Object.entries(PARTNER_SERVICE_KEYWORDS)) {
      for (const keyword of keywords) {
        if (lowerMessage.includes(keyword)) {
          partnerServiceType = service as PartnerServiceType;
          break;
        }
      }
      if (partnerServiceType) break;
    }
  }

  // Determine rental user type if rental intent
  let rentalUserType: RentalUserType = null;
  if (primaryIntent === 'rent') {
    const tenantScore = RENTAL_TENANT_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
    const landlordScore = RENTAL_LANDLORD_KEYWORDS.filter(k => lowerMessage.includes(k)).length;
    
    if (landlordScore > tenantScore) {
      rentalUserType = 'landlord';
    } else if (tenantScore > 0) {
      rentalUserType = 'tenant';
    }
  }

  return {
    intent: primaryIntent,
    confidence,
    partnerServiceType,
    rentalUserType,
    keywords: foundKeywords
  };
}

// ============================================
// SELL VS RENT DISAMBIGUATION
// ============================================

export function needsSellRentClarification(message: string): boolean {
  const lowerMessage = message.toLowerCase();
  const ambiguousPhrases = [
    'list my property',
    'list property',
    'put my property',
    'i have a property',
    'i own a property',
    'my property is vacant',
    'vacant property'
  ];
  
  return ambiguousPhrases.some(phrase => lowerMessage.includes(phrase));
}

export const SELL_RENT_CLARIFICATION_PROMPT = 
  "I'd be happy to help with your property! Just to make sure I guide you correctly - are you looking to **sell** the property or **rent** it out?";

// ============================================
// RENTAL QUALIFICATION QUESTIONS
// ============================================

export interface RentalQualificationData {
  rentalUserType?: 'tenant' | 'landlord';
  budgetMin?: number;
  budgetMax?: number;
  preferredAreas?: string[];
  propertyType?: 'apartment' | 'villa' | 'townhouse' | 'commercial' | 'studio';
  rentalDuration?: 'short_term' | 'long_term';
  moveInTimeline?: string;
  bedrooms?: number;
  furnished?: boolean;
}

export const RENTAL_QUALIFICATION_QUESTIONS = {
  rentalUserType: {
    question: "Are you a **tenant** looking to rent a property, or a **landlord** looking to rent out your property?",
    options: ['Tenant - Looking to rent', 'Landlord - Want to rent out my property']
  },
  budget: {
    tenant: "What's your **monthly budget range** for rent? (e.g., AED 5,000 - 10,000)",
    landlord: "What's your **expected monthly rent** for the property?"
  },
  preferredAreas: {
    question: "Which **areas** are you interested in? (e.g., Dubai Marina, Downtown, JVC, Business Bay)",
    examples: ['Dubai Marina', 'Downtown Dubai', 'JBR', 'Business Bay', 'JVC', 'Palm Jumeirah', 'Dubai Hills']
  },
  propertyType: {
    question: "What **type of property** are you looking for?",
    options: ['Studio', 'Apartment', 'Villa', 'Townhouse', 'Commercial Space']
  },
  rentalDuration: {
    question: "Are you looking for a **short-term** (less than 1 year) or **long-term** rental?",
    options: ['Short-term (< 1 year)', 'Long-term (1+ years)']
  },
  moveInTimeline: {
    question: "When do you need to **move in**? (e.g., Immediately, Within 1 month, Flexible)",
    examples: ['Immediately', 'Within 1 month', 'Within 3 months', 'Flexible']
  }
};

// ============================================
// BROKER SPECIALIZATION MATCHING
// ============================================

export type BrokerSpecialization = 'sales' | 'rentals' | 'off_plan' | 'secondary' | 'commercial' | 'vip';

export function getBrokerSpecializationForIntent(
  intent: LeadIntent,
  rentalUserType?: RentalUserType
): BrokerSpecialization[] {
  switch (intent) {
    case 'buy':
      return ['sales', 'off_plan', 'secondary'];
    case 'sell':
      return ['sales', 'secondary'];
    case 'rent':
      if (rentalUserType === 'landlord') {
        return ['rentals', 'sales']; // Landlords might also sell
      }
      return ['rentals'];
    case 'broker_registration':
      return []; // HR handles this, not brokers
    case 'partner_services':
      return []; // Operations handles partner introductions
    default:
      return ['sales']; // Default to sales
  }
}

export function getPipelineForIntent(intent: LeadIntent): string {
  switch (intent) {
    case 'buy':
      return 'buy_pipeline';
    case 'sell':
      return 'sell_pipeline';
    case 'rent':
      return 'rent_pipeline';
    case 'broker_registration':
      return 'hr_pipeline';
    case 'partner_services':
      return 'partner_services_pipeline';
    default:
      return 'general_pipeline';
  }
}

// ============================================
// COMPLIANCE LANGUAGE
// ============================================

export const COMPLIANCE_LANGUAGE = {
  introduction: "I'm an AI assistant for JBJ GLOBAL REAL ESTATE.",
  licensed_services: "JBJ GLOBAL REAL ESTATE is licensed for BUY, SELL & RENT.",
  partner_services: "This service is provided through licensed partners.",
  partner_intro_template: (service: string) => 
    `JBJ GLOBAL REAL ESTATE facilitates introductions to licensed partners for ${service}.`,
  
  // Prohibited phrases that AI must NEVER use
  prohibited_phrases: [
    "We provide visa services",
    "We handle mortgage approvals", 
    "We process legal documents",
    "We offer mortgage services",
    "Our legal team",
    "Our visa team",
    "Our mortgage team",
    "We can handle your visa",
    "We will process your mortgage"
  ]
};

export default {
  classifyIntent,
  needsSellRentClarification,
  getBrokerSpecializationForIntent,
  getPipelineForIntent,
  INTENT_KEYWORDS,
  RENTAL_QUALIFICATION_QUESTIONS,
  COMPLIANCE_LANGUAGE,
  SELL_RENT_CLARIFICATION_PROMPT
};
