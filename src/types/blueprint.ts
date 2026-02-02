/**
 * Master Blueprint Data Models
 * Source of truth for all data structures per the Master Blueprint specification
 */

// ============= D1) Listing Schema =============
export interface Listing {
  id: string;
  status: 'available' | 'under_offer' | 'rented' | 'sold';
  purpose: 'buy' | 'rent';
  title: string;
  description: string;
  price: number;
  currency: 'AED';
  location: {
    area: string;
    community: string;
    address: string;
    lat: number;
    lng: number;
  };
  propertyType: 'apartment' | 'villa' | 'townhouse' | 'penthouse' | 'plot' | 'commercial';
  bedrooms: number;
  bathrooms: number;
  sizeSqFt: number;
  images: string[];
  videoUrl: string | null;
  virtualTourUrl: string | null;
  amenities: string[];
  developer: string | null;
  projectName: string | null;
  agent: ListingAgent;
  createdAt: string; // ISO date
  updatedAt: string; // ISO date
  referenceCode: string;
}

export interface ListingAgent {
  id: string;
  name: string;
  photoUrl: string;
  phone: string;
  whatsapp: string;
  email: string;
  languages: string[];
}

// ============= D2) Area Schema =============
export interface Area {
  slug: string;
  name: string;
  summary: string;
  highlights: string[];
  avgPrices: {
    buy: number | null;
    rent: number | null;
  };
  map: {
    lat: number;
    lng: number;
    zoom: number;
  };
  faq: AreaFAQ[];
}

export interface AreaFAQ {
  q: string;
  a: string;
}

// ============= D3) Lead Schema =============
export type LeadFormType = 'inquiry' | 'valuation' | 'landlord' | 'investor' | 'contact' | 'viewing' | 'shortlist';
export type LeadPreferredContact = 'whatsapp' | 'call' | 'email';
export type LeadTimeline = 'immediate' | '1_3_months' | '3_6_months' | '6_plus';

export interface Lead {
  id: string;
  formType: LeadFormType;
  createdAt: string; // ISO date
  name: string;
  phone: string;
  email: string | null;
  preferredContact: LeadPreferredContact;
  message: string | null;
  listingId: string | null;
  area: string | null;
  budget: string | null;
  bedrooms: string | null;
  timeline: LeadTimeline;
  consents: LeadConsents;
  source: LeadSource;
}

export interface LeadConsents {
  privacyAccepted: boolean;
  marketingOptIn: boolean;
}

export interface LeadSource {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  referrer: string | null;
}

// ============= Form Field Configurations =============
export interface FormFieldConfig {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'select' | 'textarea' | 'checkbox' | 'date';
  required: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  validation?: {
    pattern?: RegExp;
    message?: string;
  };
}

// ============= Valuation Form Fields =============
export const valuationFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+971 50 123 4567' },
  { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'your@email.com' },
  { 
    name: 'propertyType', 
    label: 'Property Type', 
    type: 'select', 
    required: true,
    options: [
      { value: 'apartment', label: 'Apartment' },
      { value: 'villa', label: 'Villa' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'penthouse', label: 'Penthouse' },
      { value: 'plot', label: 'Plot' },
      { value: 'commercial', label: 'Commercial' },
    ]
  },
  { name: 'area', label: 'Area / Community', type: 'text', required: true, placeholder: 'e.g., Downtown Dubai' },
  { name: 'bedrooms', label: 'Bedrooms', type: 'text', required: false, placeholder: 'Number of bedrooms' },
  { name: 'size', label: 'Size (sq ft)', type: 'text', required: false, placeholder: 'Approximate size' },
  {
    name: 'condition',
    label: 'Property Condition',
    type: 'select',
    required: false,
    options: [
      { value: 'excellent', label: 'Excellent' },
      { value: 'good', label: 'Good' },
      { value: 'needs_work', label: 'Needs Work' },
    ]
  },
  {
    name: 'timeline',
    label: 'When do you want to sell?',
    type: 'select',
    required: true,
    options: [
      { value: 'immediate', label: 'Immediately' },
      { value: '1_3_months', label: '1-3 Months' },
      { value: '3_6_months', label: '3-6 Months' },
      { value: '6_plus', label: '6+ Months' },
    ]
  },
  { name: 'message', label: 'Additional Notes', type: 'textarea', required: false, placeholder: 'Any additional information...' },
];

// ============= Landlord Form Fields =============
export const landlordFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+971 50 123 4567' },
  { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'your@email.com' },
  { 
    name: 'propertyType', 
    label: 'Property Type', 
    type: 'select', 
    required: true,
    options: [
      { value: 'apartment', label: 'Apartment' },
      { value: 'villa', label: 'Villa' },
      { value: 'townhouse', label: 'Townhouse' },
      { value: 'penthouse', label: 'Penthouse' },
    ]
  },
  { name: 'area', label: 'Area / Community', type: 'text', required: true, placeholder: 'e.g., Dubai Marina' },
  { name: 'bedrooms', label: 'Bedrooms', type: 'text', required: false, placeholder: 'Number of bedrooms' },
  { name: 'desiredRent', label: 'Desired Rent (AED)', type: 'text', required: false, placeholder: 'Expected annual rent' },
  { name: 'availabilityDate', label: 'Availability Date', type: 'date', required: false },
  {
    name: 'servicesNeeded',
    label: 'Services Needed',
    type: 'select',
    required: false,
    options: [
      { value: 'tenant_find', label: 'Tenant Finding Only' },
      { value: 'full_management', label: 'Full Property Management' },
    ]
  },
];

// ============= Investor Form Fields =============
export const investorFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+971 50 123 4567' },
  { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'your@email.com' },
  { name: 'preferredAreas', label: 'Preferred Areas', type: 'text', required: false, placeholder: 'e.g., Downtown, Marina' },
  { name: 'budgetRange', label: 'Budget Range', type: 'text', required: false, placeholder: 'e.g., AED 1M - 3M' },
  {
    name: 'strategy',
    label: 'Investment Strategy',
    type: 'select',
    required: false,
    options: [
      { value: 'flip', label: 'Flip / Quick Resale' },
      { value: 'rental_yield', label: 'Rental Yield' },
      { value: 'off_plan', label: 'Off-Plan Investment' },
    ]
  },
];

// ============= Shortlist Form Fields =============
export const shortlistFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+971 50 123 4567' },
  { name: 'budget', label: 'Budget (AED)', type: 'text', required: false, placeholder: 'e.g., 1,500,000' },
  { name: 'bedrooms', label: 'Bedrooms', type: 'text', required: false, placeholder: 'e.g., 2-3' },
  { name: 'preferredAreas', label: 'Preferred Areas', type: 'text', required: false, placeholder: 'e.g., Downtown, Marina' },
  {
    name: 'timeline',
    label: 'When do you need to move?',
    type: 'select',
    required: false,
    options: [
      { value: 'immediate', label: 'Immediately' },
      { value: '1_3_months', label: '1-3 Months' },
      { value: '3_6_months', label: '3-6 Months' },
      { value: '6_plus', label: '6+ Months' },
    ]
  },
];

// ============= Viewing Form Fields =============
export const viewingFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+971 50 123 4567' },
  { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'your@email.com' },
  { name: 'preferredDate', label: 'Preferred Date', type: 'date', required: false },
  { name: 'preferredTime', label: 'Preferred Time', type: 'text', required: false, placeholder: 'e.g., Morning, Afternoon' },
  { name: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'Any questions or special requests...' },
];

// ============= Contact Form Fields =============
export const contactFormFields: FormFieldConfig[] = [
  { name: 'name', label: 'Full Name', type: 'text', required: true, placeholder: 'Your full name' },
  { name: 'phone', label: 'Phone Number', type: 'tel', required: true, placeholder: '+971 50 123 4567' },
  { name: 'email', label: 'Email Address', type: 'email', required: false, placeholder: 'your@email.com' },
  {
    name: 'reason',
    label: 'How can we help?',
    type: 'select',
    required: false,
    options: [
      { value: 'buy', label: 'I want to buy a property' },
      { value: 'rent', label: 'I want to rent a property' },
      { value: 'sell', label: 'I want to sell my property' },
      { value: 'management', label: 'Property management services' },
      { value: 'other', label: 'Other inquiry' },
    ]
  },
  { name: 'message', label: 'Message', type: 'textarea', required: false, placeholder: 'How can we help you today?' },
];

// ============= SEO Page Configurations =============
export interface PageSEO {
  title: string;
  metaDescription: string;
  h1: string;
  schema?: 'Organization' | 'LocalBusiness' | 'ItemList' | 'RealEstateListing' | 'Place' | 'Article';
}

export const blueprintPagesSEO: Record<string, PageSEO> = {
  home: {
    title: 'Real Estate Broker in Dubai | Buy, Rent, Sell with JBJ Global Real Estate',
    metaDescription: 'Browse Dubai listings, request a valuation, or list your property with a trusted local brokerage.',
    h1: 'Dubai Real Estate, Made Simple',
    schema: 'Organization',
  },
  buyListings: {
    title: 'Dubai Properties for Sale | JBJ Global Real Estate',
    metaDescription: 'Search Dubai homes for sale. Filter by area, price, bedrooms, and property type.',
    h1: 'Properties for Sale in Dubai',
    schema: 'ItemList',
  },
  rentListings: {
    title: 'Dubai Properties for Rent | JBJ Global Real Estate',
    metaDescription: 'Search Dubai homes for rent. Filter by area, price, bedrooms, and property type.',
    h1: 'Properties for Rent in Dubai',
    schema: 'ItemList',
  },
  sellWithUs: {
    title: 'Sell Your Property in Dubai | Valuation & Marketing | JBJ Global Real Estate',
    metaDescription: 'Get a pricing strategy and marketing plan to sell your Dubai property faster.',
    h1: 'Sell Your Property with Confidence',
  },
  valuation: {
    title: 'Request a Free Property Valuation | JBJ Global Real Estate',
    metaDescription: 'Get a free property valuation from our Dubai real estate experts.',
    h1: 'Request a Free Valuation',
  },
  propertyManagement: {
    title: 'Property Management in Dubai | JBJ Global Real Estate',
    metaDescription: 'Professional property management services in Dubai. Tenant placement, renewals, and maintenance.',
    h1: 'Property Management in Dubai',
  },
  areasIndex: {
    title: 'Dubai Areas We Cover | JBJ Global Real Estate',
    metaDescription: 'Explore Dubai neighborhoods and communities. Find properties in your preferred area.',
    h1: 'Dubai Areas We Cover',
    schema: 'Place',
  },
  buyerGuide: {
    title: 'Buying Property in Dubai: Step-by-Step Guide | JBJ Global Real Estate',
    metaDescription: 'Complete guide to buying property in Dubai. Steps, costs, and expert advice.',
    h1: 'Buying Property in Dubai: Step-by-Step',
    schema: 'Article',
  },
  tenantGuide: {
    title: 'Renting in Dubai: What You Need | JBJ Global Real Estate',
    metaDescription: 'Essential guide to renting property in Dubai. Documents, costs, and tenant rights.',
    h1: 'Renting in Dubai: What You Need',
    schema: 'Article',
  },
  sellerGuide: {
    title: 'Selling in Dubai: Timeline, Costs, Tips | JBJ Global Real Estate',
    metaDescription: 'Complete guide to selling property in Dubai. Timeline, costs, and expert tips.',
    h1: 'Selling in Dubai: Timeline, Costs, Tips',
    schema: 'Article',
  },
  landlordGuide: {
    title: 'Landlord Guide: Renting Out Your Dubai Property | JBJ Global Real Estate',
    metaDescription: 'Guide to renting out your Dubai property. Tenant screening, pricing, and management.',
    h1: 'Landlord Guide: Renting Out Your Dubai Property',
    schema: 'Article',
  },
  newDevelopments: {
    title: 'New Developments in Dubai | JBJ Global Real Estate',
    metaDescription: 'Explore off-plan and new launch projects in Dubai. Payment plans and availability.',
    h1: 'New Developments in Dubai',
    schema: 'ItemList',
  },
  investorServices: {
    title: 'Investor Services in Dubai | JBJ Global Real Estate',
    metaDescription: 'Investment advisory services for Dubai real estate. Deal flow, ROI analysis, and market insights.',
    h1: 'Investor Services in Dubai',
  },
  aboutUs: {
    title: 'About JBJ Global Real Estate | Dubai Real Estate Brokerage',
    metaDescription: 'Learn about JBJ Global Real Estate, a trusted Dubai brokerage focused on transparency and results.',
    h1: 'About JBJ Global Real Estate',
    schema: 'Organization',
  },
  contact: {
    title: 'Contact Us | JBJ Global Real Estate',
    metaDescription: 'Get in touch with JBJ Global Real Estate. WhatsApp, phone, or email us today.',
    h1: 'Contact Us',
    schema: 'LocalBusiness',
  },
};

// ============= Tracking Events =============
export const trackingEvents = {
  // Home page
  home_search_submit: 'home_search_submit',
  home_whatsapp_click: 'home_whatsapp_click',
  home_call_click: 'home_call_click',
  
  // Buy listings
  buy_filter_apply: 'buy_filter_apply',
  listing_card_whatsapp_click: 'listing_card_whatsapp_click',
  buy_shortlist_submit: 'buy_shortlist_submit',
  
  // Listing detail
  listing_whatsapp_click: 'listing_whatsapp_click',
  listing_call_click: 'listing_call_click',
  viewing_form_submit: 'viewing_form_submit',
  
  // Areas
  areas_search: 'areas_search',
  area_card_click: 'area_card_click',
  area_shortlist_submit: 'area_shortlist_submit',
  area_buy_click: 'area_buy_click',
  area_rent_click: 'area_rent_click',
  
  // Guides
  buyer_guide_lead_submit: 'buyer_guide_lead_submit',
  
  // Rent
  rent_filter_apply: 'rent_filter_apply',
  rent_shortlist_submit: 'rent_shortlist_submit',
  
  // Sell
  sell_valuation_click: 'sell_valuation_click',
  valuation_submit: 'valuation_submit',
  
  // Property Management
  pm_list_click: 'pm_list_click',
  landlord_submit: 'landlord_submit',
  
  // New Developments
  newdev_lead_submit: 'newdev_lead_submit',
  development_inquiry_submit: 'development_inquiry_submit',
  
  // Investors
  investor_join_click: 'investor_join_click',
  investor_submit: 'investor_submit',
  
  // Team
  team_whatsapp_click: 'team_whatsapp_click',
  
  // Contact
  contact_submit: 'contact_submit',
  contact_whatsapp_click: 'contact_whatsapp_click',
  contact_call_click: 'contact_call_click',
  
  // Blog
  blog_post_click: 'blog_post_click',
  blog_cta_click: 'blog_cta_click',
  
  // Cookies
  cookie_accept: 'cookie_accept',
  cookie_reject: 'cookie_reject',
  cookie_customize_save: 'cookie_customize_save',
  
  // Thank you
  thank_you_view: 'thank_you_view',
} as const;

export type TrackingEvent = keyof typeof trackingEvents;
