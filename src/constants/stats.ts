// Centralized stats to ensure consistency across all pages
// COMPLIANCE NOTE: Only verified, factual claims should be used
// DLD Fine Risk: AED 50,000 for false/misleading information

export const COMPANY_STATS = {
  yearsInDubai: {
    end: 6,
    suffix: '+',
    prefix: '',
    label: 'Years in Dubai',
    note: 'Founder active since 2020',
  },
  brokersTrainedBy: {
    end: 2800,
    suffix: '+',
    prefix: '',
    label: 'Brokers Trained',
    note: 'By Founder (2022-2024)',
  },
  socialFollowers: {
    end: 1000000,
    suffix: '+',
    prefix: '',
    label: 'Social Followers',
    note: 'All Platforms Combined',
  },
  teamManaged: {
    end: 495,
    suffix: '+',
    prefix: '',
    label: 'Team Managed',
    note: 'Operations Experience',
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
export const CONTACT_INFO = {
  phone: '+971 56 591 1000',
  phoneRaw: '+971565911000',
  email: 'Contact@JBJ.ae',
  emailCapitalized: 'Contact@JBJ.ae',
  privacyEmail: 'Privacy@JBJ.ae',
  whatsappNumber: '971565911000',
  whatsappMessage: "Hi, I'm interested in learning more about property brokerage services with JBJ Global Real Estate.",
  address: 'Downtown Dubai, UAE',
  inquiryFormUrl: 'https://jbj.ae/property-inquiry-form/',
  companyDescriptor: 'JBJ Global Real Estate',
  companyFull: 'JBJ Global Real Estate L.L.C S.O.C.',
  founder: 'Jane Abou Jaoude',
  domain: 'JBJ.ae',
};

// Generate WhatsApp URL
export const getWhatsAppUrl = (customMessage?: string) => {
  const message = encodeURIComponent(customMessage || CONTACT_INFO.whatsappMessage);
  return `https://wa.me/${CONTACT_INFO.whatsappNumber}?text=${message}`;
};

// Generate call URL
export const getCallUrl = () => `tel:${CONTACT_INFO.phoneRaw}`;

// Generate email URL
export const getEmailUrl = () => `mailto:${CONTACT_INFO.email}`;
