// Centralized stats to ensure consistency across all pages
// COMPLIANCE NOTE: Only verified, factual claims should be used
// DLD Fine Risk: AED 50,000 for false/misleading information

export const COMPANY_STATS = {
  yearsInDubai: {
    end: 12,
    suffix: '+',
    prefix: '',
    label: 'Years Experience',
    note: 'Founder experience since 2014',
  },
  brokersTrainedBy: {
    end: 4800,
    suffix: '+',
    prefix: '',
    label: 'Brokers Trained',
    note: 'By Founder (2014-2026)',
  },
  socialFollowers: {
    end: 1000000,
    suffix: '+',
    prefix: '',
    label: 'Social Followers',
    note: 'All Platforms Combined',
  },
  teamManaged: {
    end: 147,
    suffix: '+',
    prefix: '',
    label: 'Team Members',
    note: 'Current Team Size',
  },
};

// Legacy alias for backward compatibility
export const COMPANY_STATS_LEGACY = {
  yearsExperience: COMPANY_STATS.yearsInDubai,
  brokersTrainedBy: COMPANY_STATS.brokersTrainedBy,
  clientSatisfaction: COMPANY_STATS.socialFollowers,
  teamMembers: COMPANY_STATS.teamManaged,
};

// Contact information - OFFICIAL JBJ GLOBAL REAL ESTATE
// [LOCKED] EMAIL RULE: ALL EMAILS MUST BE FULL CAPITAL LETTERS (e.g., CONTACT@JBJ.AE)
// This is a LOCKED rule - never use lowercase for email addresses
export const CONTACT_INFO = {
  phone: '+971 54 716 7107',
  phoneRaw: '+971547167107',
  email: 'CONTACT@JBJ.AE',
  emailCapitalized: 'CONTACT@JBJ.AE',
  privacyEmail: 'PRIVACY@JBJ.AE',
  supportEmail: 'SUPPORT@JBJ.AE',
  careersEmail: 'CAREERS@JBJ.AE',
  partnershipsEmail: 'PARTNERSHIPS@JBJ.AE',
  securityEmail: 'SECURITY@JBJ.AE',
  happinessEmail: 'HAPPINESS@JBJ.AE',
  whatsappNumber: '971547167107',
  whatsappMessage: "Hi JBJ Global Real Estate, I am contacting you from the JBJ Global Digital Platform and would like support with my property enquiry.",
  address: 'Downtown Dubai, UAE',
  inquiryFormUrl: 'https://jbj.ae/property-inquiry-form/',
  companyDescriptor: 'JBJ Global Real Estate',
  companyFull: 'JBJ Global Real Estate L.L.C S.O.C.',
  founder: 'Jane Bou Jaoude',
  founderArabic: 'جاين بو جودة',
  founderBilingual: 'Jane Bou Jaoude (جاين بو جودة)',
  domain: 'JBJ.AE',
};

// Generate WhatsApp URL
export const getWhatsAppUrl = (customMessage?: string) => {
  const message = encodeURIComponent(customMessage || CONTACT_INFO.whatsappMessage);
  return `https://api.whatsapp.com/send?phone=${CONTACT_INFO.whatsappNumber}&text=${message}`;
};

// Generate call URL
export const getCallUrl = () => `tel:${CONTACT_INFO.phoneRaw}`;

// Generate email URL
export const getEmailUrl = () => `mailto:${CONTACT_INFO.email}`;
