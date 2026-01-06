// Centralized stats to ensure consistency across all pages
// COMPLIANCE NOTE: Only verified, factual claims should be used

export const COMPANY_STATS = {
  yearsExperience: {
    end: 5,
    suffix: '+',
    prefix: '',
    label: 'Years in Dubai',
  },
  brokersTrainedBy: {
    end: 2800,
    suffix: '+',
    prefix: '',
    label: 'Brokers Trained',
  },
  clientSatisfaction: {
    end: 98,
    suffix: '%',
    prefix: '',
    label: 'Client Satisfaction',
  },
  teamMembers: {
    end: 10,
    suffix: '+',
    prefix: '',
    label: 'Team Members',
  },
};

// Contact information - use everywhere
export const CONTACT_INFO = {
  phone: '+971 56 591 1000',
  phoneRaw: '+971565911000',
  email: 'contact@jjglobalcapital.com',
  emailCapitalized: 'contact@jjglobalcapital.com',
  privacyEmail: 'privacy@jjglobalcapital.com',
  whatsappNumber: '971565911000',
  whatsappMessage: "Hi, I'm interested in learning more about property brokerage services with JJ Global Capital.",
  address: 'Downtown Dubai, UAE',
  inquiryFormUrl: 'https://jjglobalcapital.com/property-inquiry-form/',
  companyDescriptor: 'JJ Global Capital | Real Estate Brokerage',
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
