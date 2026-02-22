import type { BookData } from '@/components/books/BookShelf';

// Book cover imports
import investorEducationCover from '@/assets/books/investor-education-cover.jpg';
import marketIntelligenceCover from '@/assets/books/market-intelligence-cover.jpg';
import goldenVisaCover from '@/assets/books/golden-visa-cover.jpg';
import buyerGuideCover from '@/assets/books/buyer-guide-cover.jpg';
import sellerGuideCover from '@/assets/books/seller-guide-cover.jpg';
import landlordGuideCover from '@/assets/books/landlord-guide-cover.jpg';
import rentGuideCover from '@/assets/books/rent-guide-cover.jpg';
import tenantGuideCover from '@/assets/books/tenant-guide-cover.jpg';
import brokerEducationCover from '@/assets/books/broker-education-cover.jpg';
import brokerCertificationCover from '@/assets/books/broker-certification-cover.jpg';
import brokerFaqCover from '@/assets/books/broker-faq-cover.jpg';
import investorFaqCover from '@/assets/books/investor-faq-cover.jpg';
import landlordFaqCover from '@/assets/books/landlord-faq-cover.jpg';
import sellerFaqCover from '@/assets/books/seller-faq-cover.jpg';
import buyerFaqCover from '@/assets/books/buyer-faq-cover.jpg';
import tenantFaqCover from '@/assets/books/tenant-faq-cover.jpg';

// ─── Shared Books (used by both investor & broker) ───

const investorEducationBook: BookData = {
  title: 'Investor Education Guide',
  cover: investorEducationCover,
  href: '/investor-education',
  category: 'education',
  tableOfContents: [
    { title: 'Introduction to Dubai Real Estate Investment', duration: '15 min' },
    { title: 'Understanding Property Types & Freehold Zones', duration: '20 min' },
    { title: 'Legal Framework for Foreign Investors', duration: '25 min' },
    { title: 'Due Diligence & Property Verification', duration: '20 min' },
    { title: 'Financing Options & Mortgage Guidelines', duration: '25 min' },
    { title: 'ROI Analysis & Rental Yield Calculations', duration: '30 min' },
    { title: 'Off-Plan vs Ready Properties', duration: '20 min' },
    { title: 'Tax Implications & Fees Structure', duration: '15 min' },
    { title: 'Exit Strategies & Resale Market', duration: '20 min' },
    { title: 'Building a Diversified Property Portfolio', duration: '25 min' },
  ],
};

const marketIntelligenceBook: BookData = {
  title: 'Market Intelligence Report',
  cover: marketIntelligenceCover,
  href: '/market-intelligence',
  category: 'report',
  tableOfContents: [
    { title: 'Dubai Market Overview 2024–2025', duration: '20 min' },
    { title: 'Key Market Indicators & Trends', duration: '25 min' },
    { title: 'Area Performance Rankings', duration: '20 min' },
    { title: 'Supply & Demand Analysis', duration: '25 min' },
    { title: 'Price Index by Asset Type', duration: '15 min' },
    { title: 'Rental Market Dynamics', duration: '20 min' },
    { title: 'Government Initiatives & Regulatory Updates', duration: '15 min' },
    { title: 'Infrastructure & Mega Projects Impact', duration: '20 min' },
    { title: 'Forecast & Investment Outlook', duration: '25 min' },
  ],
};

const goldenVisaBook: BookData = {
  title: 'Golden Visa UAE Guide',
  cover: goldenVisaCover,
  href: '/guides/golden-visa-uae',
  category: 'guide',
  tableOfContents: [
    { title: 'What is the UAE Golden Visa?', duration: '10 min' },
    { title: 'Eligibility Categories & Requirements', duration: '20 min' },
    { title: 'Property Investment Pathway (AED 2M+)', duration: '20 min' },
    { title: 'Application Process Step-by-Step', duration: '25 min' },
    { title: 'Required Documents Checklist', duration: '10 min' },
    { title: 'Family Sponsorship Under Golden Visa', duration: '15 min' },
    { title: 'Renewal & Compliance', duration: '15 min' },
    { title: 'Benefits & Privileges', duration: '10 min' },
    { title: 'Common Mistakes to Avoid', duration: '10 min' },
    { title: 'FAQs & Official Resources', duration: '10 min' },
  ],
};

const buyerGuideBook: BookData = {
  title: "Buyer's Guide to Dubai",
  cover: buyerGuideCover,
  href: '/buyer-guide',
  category: 'guide',
  tableOfContents: [
    { title: 'Getting Started: Buying Property in Dubai', duration: '15 min' },
    { title: 'Choosing the Right Location', duration: '20 min' },
    { title: 'Understanding Freehold vs Leasehold', duration: '15 min' },
    { title: 'The Buying Process: From Offer to Handover', duration: '30 min' },
    { title: 'Payment Plans & Financing Options', duration: '20 min' },
    { title: 'Dubai Land Department Registration', duration: '15 min' },
    { title: 'Fees, Taxes & Hidden Costs', duration: '20 min' },
    { title: 'Off-Plan Purchase Guide', duration: '20 min' },
    { title: 'Post-Purchase: Handover & Snagging', duration: '15 min' },
    { title: 'Buyer Rights & Consumer Protection', duration: '15 min' },
  ],
};

const sellerGuideBook: BookData = {
  title: "Seller's Guide to Dubai",
  cover: sellerGuideCover,
  href: '/seller-guide',
  category: 'guide',
  tableOfContents: [
    { title: 'Preparing Your Property for Sale', duration: '15 min' },
    { title: 'Property Valuation & Pricing Strategy', duration: '20 min' },
    { title: 'Choosing the Right Listing Agent', duration: '15 min' },
    { title: 'Marketing Your Property Effectively', duration: '20 min' },
    { title: 'Legal Requirements & NOC Process', duration: '25 min' },
    { title: 'Negotiation Strategies', duration: '15 min' },
    { title: 'Transfer Process at DLD', duration: '20 min' },
    { title: 'Fees & Settlement Breakdown', duration: '15 min' },
    { title: 'Handling Tenanted Properties', duration: '15 min' },
    { title: 'Capital Gains & Tax Considerations', duration: '10 min' },
  ],
};

const landlordGuideBook: BookData = {
  title: 'Landlord Guide to Dubai',
  cover: landlordGuideCover,
  href: '/landlord-guide',
  category: 'guide',
  tableOfContents: [
    { title: 'Becoming a Landlord in Dubai', duration: '15 min' },
    { title: 'Rental Market Overview', duration: '20 min' },
    { title: 'Setting the Right Rental Price', duration: '15 min' },
    { title: 'Tenant Screening & Selection', duration: '20 min' },
    { title: 'Ejari Registration & Tenancy Contracts', duration: '25 min' },
    { title: 'Property Management Options', duration: '15 min' },
    { title: 'Maintenance & Repairs Responsibilities', duration: '15 min' },
    { title: 'Rental Disputes & RDSC Process', duration: '20 min' },
    { title: 'Rental Increase Rules (RERA Calculator)', duration: '15 min' },
    { title: 'Tax & Service Charge Obligations', duration: '10 min' },
  ],
};

const rentGuideBook: BookData = {
  title: "Renter's Guide to Dubai",
  cover: rentGuideCover,
  href: '/rent-guide',
  category: 'guide',
  tableOfContents: [
    { title: 'Renting in Dubai: Getting Started', duration: '15 min' },
    { title: 'Finding the Right Neighborhood', duration: '20 min' },
    { title: 'Understanding Rental Contracts', duration: '20 min' },
    { title: 'Ejari Registration Explained', duration: '15 min' },
    { title: 'Security Deposits & Cheque Payments', duration: '15 min' },
    { title: 'DEWA & Utility Setup', duration: '10 min' },
    { title: 'Tenant Rights Under Dubai Law', duration: '20 min' },
    { title: 'Rental Disputes Resolution', duration: '15 min' },
    { title: 'Renewal, Increases & Eviction Rules', duration: '20 min' },
    { title: 'Moving In & Moving Out Checklist', duration: '10 min' },
  ],
};

const tenantGuideBook: BookData = {
  title: 'Tenant Guide to Dubai',
  cover: tenantGuideCover,
  href: '/tenant-guide',
  category: 'guide',
  tableOfContents: [
    { title: 'Tenant Rights & Responsibilities', duration: '15 min' },
    { title: 'Understanding Your Lease Agreement', duration: '20 min' },
    { title: 'Ejari Registration Requirements', duration: '15 min' },
    { title: 'Maintenance Request Procedures', duration: '10 min' },
    { title: 'Security Deposit Protection', duration: '10 min' },
    { title: 'Rent Payment Methods & Schedules', duration: '15 min' },
    { title: 'Dealing with Landlord Disputes', duration: '20 min' },
    { title: 'Rental Increase Limits (RERA Index)', duration: '15 min' },
    { title: 'Subletting & Early Termination', duration: '15 min' },
    { title: 'End of Tenancy & Move-Out Process', duration: '10 min' },
  ],
};

// ─── FAQ Books ───

const investorFaqBook: BookData = {
  title: 'Investor FAQ Handbook',
  cover: investorFaqCover,
  href: '/investor-faq',
  category: 'faq',
  tableOfContents: [
    { title: 'General Investment Questions', duration: '10 min' },
    { title: 'Legal & Ownership FAQs', duration: '15 min' },
    { title: 'Financing & Mortgage FAQs', duration: '15 min' },
    { title: 'Off-Plan Investment FAQs', duration: '10 min' },
    { title: 'Rental Income & ROI FAQs', duration: '10 min' },
    { title: 'Tax & Fee FAQs', duration: '10 min' },
    { title: 'Visa & Residency FAQs', duration: '10 min' },
    { title: 'Property Management FAQs', duration: '10 min' },
  ],
};

const buyerFaqBook: BookData = {
  title: 'Buyer FAQ Handbook',
  cover: buyerFaqCover,
  href: '/buyer-faq',
  category: 'faq',
  tableOfContents: [
    { title: 'Before You Buy: Common Questions', duration: '10 min' },
    { title: 'Pricing & Negotiation FAQs', duration: '10 min' },
    { title: 'Legal Process FAQs', duration: '15 min' },
    { title: 'Financing & Payment FAQs', duration: '15 min' },
    { title: 'Off-Plan Purchase FAQs', duration: '10 min' },
    { title: 'Handover & Snagging FAQs', duration: '10 min' },
    { title: 'Post-Purchase FAQs', duration: '10 min' },
  ],
};

const sellerFaqBook: BookData = {
  title: 'Seller FAQ Handbook',
  cover: sellerFaqCover,
  href: '/seller-faq',
  category: 'faq',
  tableOfContents: [
    { title: 'Getting Ready to Sell: FAQs', duration: '10 min' },
    { title: 'Pricing & Valuation FAQs', duration: '10 min' },
    { title: 'Marketing & Listing FAQs', duration: '10 min' },
    { title: 'Legal & Transfer Process FAQs', duration: '15 min' },
    { title: 'Fees & Costs FAQs', duration: '10 min' },
    { title: 'Tenanted Property FAQs', duration: '10 min' },
  ],
};

const landlordFaqBook: BookData = {
  title: 'Landlord FAQ Handbook',
  cover: landlordFaqCover,
  href: '/landlord-faq',
  category: 'faq',
  tableOfContents: [
    { title: 'Getting Started as a Landlord: FAQs', duration: '10 min' },
    { title: 'Tenant Management FAQs', duration: '15 min' },
    { title: 'Rental Pricing & Increases FAQs', duration: '10 min' },
    { title: 'Maintenance & Repairs FAQs', duration: '10 min' },
    { title: 'Legal & Disputes FAQs', duration: '15 min' },
    { title: 'Tax & Financial FAQs', duration: '10 min' },
  ],
};

const tenantFaqBook: BookData = {
  title: 'Tenant FAQ Handbook',
  cover: tenantFaqCover,
  href: '/tenant-faq',
  category: 'faq',
  tableOfContents: [
    { title: 'Renting Basics: FAQs', duration: '10 min' },
    { title: 'Contract & Ejari FAQs', duration: '10 min' },
    { title: 'Payment & Deposit FAQs', duration: '10 min' },
    { title: 'Maintenance & Repairs FAQs', duration: '10 min' },
    { title: 'Rental Increase & Renewal FAQs', duration: '10 min' },
    { title: 'Disputes & Eviction FAQs', duration: '15 min' },
    { title: 'Moving Out FAQs', duration: '10 min' },
  ],
};

// ─── Broker-Only Books ───

const brokerTrainingBook: BookData = {
  title: 'Broker Training Manual',
  cover: brokerEducationCover,
  href: '/broker-education',
  category: 'education',
  tableOfContents: [
    { title: 'Introduction to JBJ Broker Program', duration: '15 min' },
    { title: 'Understanding the Dubai Real Estate Market', duration: '25 min' },
    { title: 'RERA Regulations & Compliance', duration: '30 min' },
    { title: 'Client Acquisition Strategies', duration: '25 min' },
    { title: 'Lead Management & CRM Best Practices', duration: '20 min' },
    { title: 'Property Viewings & Presentation Skills', duration: '20 min' },
    { title: 'Negotiation Techniques', duration: '25 min' },
    { title: 'Transaction Process: Offer to Close', duration: '30 min' },
    { title: 'Off-Plan Sales Mastery', duration: '25 min' },
    { title: 'Rental Transactions & Leasing', duration: '20 min' },
    { title: 'After-Sales Service & Client Retention', duration: '15 min' },
    { title: 'Ethics & Professional Standards', duration: '15 min' },
  ],
};

const brokerCertificationBook: BookData = {
  title: 'Broker Certification Guide',
  cover: brokerCertificationCover,
  href: '/services/broker-certification',
  category: 'education',
  tableOfContents: [
    { title: 'Certification Overview & Requirements', duration: '10 min' },
    { title: 'Module 1: Real Estate Fundamentals', duration: '30 min' },
    { title: 'Module 2: Dubai Property Law', duration: '35 min' },
    { title: 'Module 3: Market Analysis & Valuation', duration: '30 min' },
    { title: 'Module 4: Client Advisory & Communication', duration: '25 min' },
    { title: 'Module 5: Digital Tools & CRM Mastery', duration: '20 min' },
    { title: 'Module 6: Off-Plan & Developer Relations', duration: '25 min' },
    { title: 'Module 7: Rental & Leasing Expertise', duration: '25 min' },
    { title: 'Module 8: Ethics & Compliance', duration: '20 min' },
    { title: 'Certification Exam Preparation', duration: '15 min' },
    { title: 'Assessment & Certification Process', duration: '10 min' },
  ],
};

const brokerFaqBook: BookData = {
  title: 'Broker FAQ Handbook',
  cover: brokerFaqCover,
  href: '/broker-faq',
  category: 'faq',
  tableOfContents: [
    { title: 'Getting Started as a JBJ Broker', duration: '10 min' },
    { title: 'Commission & Compensation FAQs', duration: '15 min' },
    { title: 'Listing & Marketing FAQs', duration: '10 min' },
    { title: 'CRM & Lead Management FAQs', duration: '10 min' },
    { title: 'Legal & Compliance FAQs', duration: '15 min' },
    { title: 'Training & Certification FAQs', duration: '10 min' },
    { title: 'Tools & Technology FAQs', duration: '10 min' },
    { title: 'Client Relations FAQs', duration: '10 min' },
  ],
};

// ─── Collections ───

export const INVESTOR_BOOKS: BookData[] = [
  investorEducationBook,
  marketIntelligenceBook,
  goldenVisaBook,
  buyerGuideBook,
  sellerGuideBook,
  landlordGuideBook,
  rentGuideBook,
  tenantGuideBook,
  investorFaqBook,
  buyerFaqBook,
  sellerFaqBook,
  landlordFaqBook,
  tenantFaqBook,
];

export const BROKER_BOOKS: BookData[] = [
  // Broker-specific
  brokerTrainingBook,
  brokerCertificationBook,
  brokerFaqBook,
  // Market
  marketIntelligenceBook,
  goldenVisaBook,
  // All investor guides (broker needs to know these)
  investorEducationBook,
  buyerGuideBook,
  sellerGuideBook,
  landlordGuideBook,
  rentGuideBook,
  tenantGuideBook,
  // All FAQ books
  investorFaqBook,
  buyerFaqBook,
  sellerFaqBook,
  landlordFaqBook,
  tenantFaqBook,
];
