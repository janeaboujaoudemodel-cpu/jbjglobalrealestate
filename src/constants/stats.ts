// Centralized stats to ensure consistency across all pages
// These values MUST match everywhere they are used

export const COMPANY_STATS = {
  portfolioValue: {
    end: 2,
    suffix: 'B+',
    prefix: 'AED ',
    label: 'Portfolio Value',
  },
  yearsExperience: {
    end: 12,
    suffix: '+',
    prefix: '',
    label: 'Years Experience',
  },
  propertiesSold: {
    end: 3900,
    suffix: '+',
    prefix: '',
    label: 'Properties Sold',
  },
  propertiesManaged: {
    end: 4200,
    suffix: '+',
    prefix: '',
    label: 'Properties Managed',
  },
  industryAwards: {
    end: 25,
    suffix: '+',
    prefix: '',
    label: 'Industry Awards',
  },
  clientSatisfaction: {
    end: 98,
    suffix: '%',
    prefix: '',
    label: 'Client Satisfaction',
  },
  countriesServed: {
    end: 92,
    suffix: '+',
    prefix: '',
    label: 'Countries Served',
  },
};

// Contact information - use everywhere
export const CONTACT_INFO = {
  phone: '+971 56 591 1000',
  phoneRaw: '+971565911000',
  email: 'invest@jjglobalcapital.com',
  emailCapitalized: 'Invest@JJGlobalCapital.com',
  whatsappNumber: '971565911000',
  whatsappMessage: "Hi, I'm interested in learning more about property brokerage services with JJ Global Capital.",
  address: 'Downtown Dubai, UAE',
  inquiryFormUrl: 'https://jjglobalcapital.com/property-investment-inquiry-form/',
  holdingGroupUrl: 'https://jjholdinggroup.com',
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
