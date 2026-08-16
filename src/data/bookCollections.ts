import type { BookData } from '@/types/books';

// Book cover imports - Guides
import investorEducationCover from '@/assets/books/investor-education-cover.jpg';
import marketIntelligenceCover from '@/assets/books/market-intelligence-cover.jpg';
import goldenVisaCover from '@/assets/books/golden-visa-cover.jpg';
import buyerGuideCover from '@/assets/books/buyer-guide-cover.jpg';
import sellerGuideCover from '@/assets/books/seller-guide-cover.jpg';
import landlordGuideCover from '@/assets/books/landlord-guide-cover.jpg';
import rentGuideCover from '@/assets/books/rent-guide-cover.jpg';
import tenantGuideCover from '@/assets/books/tenant-guide-cover.jpg';
import guidesLibraryCover from '@/assets/books/guides-library-cover.jpg';

// Book cover imports - Broker
import brokerEducationCover from '@/assets/books/broker-education-cover.jpg';
import brokerCertificationCover from '@/assets/books/broker-certification-cover.jpg';
import brokerFaqCover from '@/assets/books/broker-faq-cover.jpg';

// Book cover imports - Legal
import termsOfServiceCover from '@/assets/books/terms-of-service-cover.jpg';
import privacyPolicyCover from '@/assets/books/privacy-policy-cover.jpg';
import cookiePolicyCover from '@/assets/books/cookie-policy-cover.jpg';
import disclaimersCover from '@/assets/books/disclaimers-cover.jpg';
import trustComplianceCover from '@/assets/books/trust-compliance-cover.jpg';

// Book cover imports - Company
import companyProfileCover from '@/assets/books/company-profile-cover.jpg';
import companyProfileBackCover from '@/assets/books/company-profile-back-cover.jpg';

// ─── Guides Library ───

const guidesLibraryBook: BookData = {
  title: 'Guides Library',
  cover: guidesLibraryCover,
  href: '/guides',
  category: 'guide',
  icon: 'book',
  coverLocked: true,
  tableOfContents: [
    { title: 'All Available Guides', duration: '5 min' },
    { title: 'Buyer Guides & Resources', duration: '10 min' },
    { title: 'Seller Guides & Resources', duration: '10 min' },
    { title: 'Landlord Guides & Resources', duration: '10 min' },
    { title: 'Tenant & Rental Resources', duration: '10 min' },
    { title: 'Golden Visa & Immigration', duration: '15 min' },
    { title: 'Market Intelligence', duration: '15 min' },
  ],
  /** Maps each TOC chapter to a direct href for cross-page navigation */
  _chapterHrefs: [
    '/guides#guides-library',
    '/guides/buyer',
    '/guides/seller',
    '/guides/landlord',
    '/rent-guide',
    '/guides/golden-visa-uae',
    '/market-intelligence',
  ],
};

// ─── Shared Books (used by both investor & broker) ───

const investorEducationBook: BookData = {
  title: 'Investor Education Guide',
  cover: investorEducationCover,
  href: '/guides/invest',
  category: 'education',
  coverLocked: true,
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
  coverLocked: true,
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
  icon: 'flag',
  coverLocked: true,
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
  title: "Buyer's Guide",
  cover: buyerGuideCover,
  href: '/guides/buyer',
  category: 'guide',
  coverLocked: true,
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
  title: "Seller's Guide",
  cover: sellerGuideCover,
  href: '/guides/seller',
  category: 'guide',
  coverLocked: true,
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
  title: 'Landlord Guide',
  cover: landlordGuideCover,
  href: '/guides/landlord',
  category: 'guide',
  coverLocked: true,
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
  title: "Rental Guide",
  cover: rentGuideCover,
  href: '/rent-guide',
  category: 'guide',
  coverLocked: true,
  tableOfContents: [
    {
      title: 'Renting in Dubai: Getting Started',
      duration: '15 min',
      summary:
        'Dubai\u2019s rental market is regulated by the Dubai Land Department (DLD) and its agency RERA. Before you start viewings, anchor three things: your budget, your preferred community, and your documentation pack.',
      bullets: [
        'Plan for total housing cost = rent + 5% security deposit + 5% agency commission + ~AED 220 Ejari + DEWA deposit (AED 2,000 apartment / AED 4,000 villa).',
        'Have ready: passport copy, residence visa or entry stamp, Emirates ID (or application), and salary certificate or 3 months\u2019 bank statements.',
        'Decide on lease length \u2014 12 months is the Dubai default; shorter terms exist but usually carry a 10\u201320% premium.',
        'Shortlist neighbourhoods by commute time, school catchment, metro access, and community charges.',
      ],
      callout: {
        label: 'Source',
        body: 'Dubai Land Department \u2014 Real Estate Regulatory Agency (RERA) tenant guidelines.',
      },
    },
    {
      title: 'Finding the Right Neighborhood',
      duration: '20 min',
      summary:
        'Dubai is a city of distinct master-planned communities. Match the community to your lifestyle before you compare individual units.',
      bullets: [
        'Downtown Dubai & Business Bay \u2014 apartments, walkable, premium rents, close to DIFC.',
        'Dubai Marina, JBR, Bluewaters \u2014 waterfront living, tram + metro, strong short-let resale.',
        'Palm Jumeirah \u2014 beach access, villas and branded residences, top-tier pricing.',
        'Arabian Ranches, Dubai Hills, Tilal Al Ghaf \u2014 villa communities with schools, parks, retail.',
        'JVC, JVT, Town Square, Dubai South \u2014 value-driven family apartments and townhouses.',
      ],
    },
    {
      title: 'Understanding Rental Contracts',
      duration: '20 min',
      summary:
        'Every Dubai tenancy uses a written contract that feeds into the Ejari system. Read every clause \u2014 once signed and registered, terms govern the full lease year.',
      bullets: [
        'Confirm names match passport/Emirates ID for both landlord and tenant.',
        'Verify the property address matches the title deed and the Makani number.',
        'Check rent amount, payment schedule, number of cheques, and exact cheque dates.',
        'Note maintenance responsibility threshold \u2014 commonly AED 500\u20131,000 borne by tenant.',
        'Look for the 90-day non-renewal notice clause required by Dubai Law No. 33 of 2008.',
      ],
      callout: {
        label: 'Legal basis',
        body: 'Dubai Law No. 26 of 2007 and amending Law No. 33 of 2008 govern landlord\u2013tenant relations.',
      },
    },
    {
      title: 'Ejari Registration Explained',
      duration: '15 min',
      summary:
        'Ejari (\u201cmy rent\u201d) is the mandatory DLD registration that gives the tenancy legal force. Without an Ejari certificate you cannot apply for utilities, residence visas, or file rental disputes.',
      bullets: [
        'Either the landlord, broker, or tenant can register \u2014 most often the broker handles it.',
        'Required documents: signed tenancy contract, title deed copy, landlord passport, tenant passport + visa + Emirates ID, DEWA premises number.',
        'Cost is typically AED 195\u2013220 depending on the service centre or online channel.',
        'You\u2019ll receive an Ejari certificate with a unique contract number \u2014 keep the PDF safe.',
        'Renew Ejari each year when the tenancy renews; lapsed Ejari blocks visa and DEWA actions.',
      ],
      callout: {
        label: 'Source',
        body: 'Dubai Land Department \u2014 Ejari portal & Dubai REST app.',
      },
    },
    {
      title: 'Security Deposits & Cheque Payments',
      duration: '15 min',
      summary:
        'Dubai still runs on post-dated cheques. Understand the math before you write them \u2014 a bounced cheque can trigger civil and even criminal proceedings.',
      bullets: [
        'Security deposit is typically 5% of annual rent for unfurnished, 10% for furnished \u2014 fully refundable subject to property condition.',
        'Cheques are post-dated; 1, 2, 4, 6, or 12 cheques are common. Fewer cheques often win a 2\u20135% rent discount.',
        'Write each cheque in the landlord\u2019s exact registered name \u2014 not a property-management company unless the contract names them.',
        'Keep photocopies of every cheque and request signed receipts.',
        'Get the deposit refund clause in writing: how soon after move-out, what deductions are allowed.',
      ],
    },
    {
      title: 'DEWA & Utility Setup',
      duration: '10 min',
      summary:
        'Dubai Electricity & Water Authority (DEWA) supplies power, water, and district cooling billing for most communities. Account activation usually happens within one working day.',
      bullets: [
        'Apply on the DEWA app or website with Ejari, Emirates ID, and the premises number.',
        'Refundable security deposit: AED 2,000 for apartments, AED 4,000 for villas.',
        'One-time connection fees: ~AED 110 (small property) to AED 310 (large property).',
        'District cooling (Empower, Emicool, Tabreed) is billed separately \u2014 confirm the chiller provider before signing.',
        'Internet: du or Etisalat by e&. Allow 3\u20137 days for fibre activation.',
      ],
    },
    {
      title: 'Tenant Rights Under Dubai Law',
      duration: '20 min',
      summary:
        'Dubai tenancy law is tenant-protective when the lease is properly Ejari-registered. Know your statutory rights before negotiating.',
      bullets: [
        'Landlord cannot enter the unit without prior notice and tenant consent.',
        'Landlord cannot raise rent during the lease term \u2014 only at renewal, capped by the RERA Rental Index.',
        'Eviction during the lease is allowed only on grounds listed in Article 25 (e.g. non-payment after 30-day notice, illegal use, sale to a buyer who self-occupies).',
        'Eviction for landlord self-use or sale requires 12 months\u2019 written notice via notary or registered mail.',
        'Tenant has the right to a property in habitable condition and to undisturbed possession.',
      ],
      callout: {
        label: 'Legal basis',
        body: 'Dubai Law No. 26 of 2007, Articles 24\u201325, as amended by Law No. 33 of 2008.',
      },
    },
    {
      title: 'Rental Disputes Resolution',
      duration: '15 min',
      summary:
        'Disagreements go to the Rental Disputes Center (RDC), the judicial arm of DLD created in 2013. Decisions are fast and binding.',
      bullets: [
        'File online via the Dubai REST app or in person at the RDC in Deira.',
        'Filing fee: 3.5% of annual rent (min AED 500, max AED 20,000).',
        'Mediation stage first; if unresolved, a judge issues a first-instance ruling within ~30 days.',
        'Appeals are limited to claims above AED 100,000 and must be filed within 15 days.',
        'Common cases: rent increases above the RERA cap, security deposit refunds, premature eviction.',
      ],
      callout: {
        label: 'Source',
        body: 'Dubai Land Department \u2014 Rental Disputes Center (RDC).',
      },
    },
    {
      title: 'Renewal, Increases & Eviction Rules',
      duration: '20 min',
      summary:
        'Rent increases at renewal are capped by the RERA Rental Index. Both parties must give 90 days\u2019 notice before lease end if they want changes.',
      bullets: [
        'No increase if current rent is within 10% of the average market rate for similar units.',
        '5% increase if current rent is 11\u201320% below market.',
        '10% increase if 21\u201330% below market.',
        '15% increase if 31\u201340% below market.',
        '20% increase if more than 40% below market.',
        'Check your specific cap on the RERA Rental Index (Dubai REST app).',
        'Any notice of non-renewal or rent change must reach the other party 90 days before lease expiry.',
      ],
      callout: {
        label: 'Legal basis',
        body: 'Decree No. 43 of 2013 \u2014 Rent Increase Calculation Decree.',
      },
    },
    {
      title: 'Moving In & Moving Out Checklist',
      duration: '10 min',
      summary:
        'Documenting condition at move-in and move-out protects your deposit. Treat the handover like a property audit.',
      bullets: [
        'Move-in: photograph every room, appliance, and existing damage \u2014 share with landlord by email the same day.',
        'Test every AC, light fixture, tap, drain, lock, and appliance before signing the handover form.',
        'Record DEWA, gas, chiller, and water meter readings on day one.',
        'Keep all maintenance receipts \u2014 you can claim reimbursement for repairs the landlord refused to handle.',
        'Move-out: give 90 days\u2019 notice, settle DEWA + Ejari, repaint if contract requires, request the deposit refund in writing.',
      ],
    },
  ],
};


const tenantGuideBook: BookData = {
  title: 'Tenant Guide',
  cover: tenantGuideCover,
  href: '/guides/tenant',
  category: 'guide',
  coverLocked: true,
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

// ─── Broker-Only Books ───

const brokerTrainingBook: BookData = {
  title: 'Broker Training Manual',
  cover: brokerEducationCover,
  href: '/broker-education',
  category: 'education',
  coverLocked: true,
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
  coverLocked: true,
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
  title: 'Broker FAQ',
  cover: brokerFaqCover,
  href: '/broker-faq',
  category: 'faq',
  coverLocked: true,
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

// ─── Legal Books ───

const termsOfServiceBook: BookData = {
  title: 'Terms of Service',
  cover: termsOfServiceCover,
  href: '/terms',
  category: 'guide',
  coverLocked: true,
  tableOfContents: [
    { title: 'Definitions & Interpretation', duration: '5 min' },
    { title: 'Scope of Services', duration: '5 min' },
    { title: 'Eligibility & User Responsibilities', duration: '10 min' },
    { title: 'Property Listings & Information Accuracy', duration: '10 min' },
    { title: 'Immigration & Golden Visa Disclaimer', duration: '5 min' },
    { title: 'Third-Party Services', duration: '5 min' },
    { title: 'Intellectual Property', duration: '5 min' },
    { title: 'Limitation of Liability', duration: '10 min' },
    { title: 'Indemnification & Privacy', duration: '5 min' },
    { title: 'Governing Law (UAE Courts)', duration: '5 min' },
  ],
};

const privacyPolicyBook: BookData = {
  title: 'Privacy Policy',
  cover: privacyPolicyCover,
  href: '/privacy',
  category: 'guide',
  coverLocked: true,
  tableOfContents: [
    { title: 'Information We Collect', duration: '5 min' },
    { title: 'How We Use Your Information', duration: '10 min' },
    { title: 'Data Sharing & Third Parties', duration: '10 min' },
    { title: 'Data Security Measures', duration: '5 min' },
    { title: 'Your Privacy Rights', duration: '10 min' },
    { title: 'Cookie Usage & Tracking', duration: '5 min' },
    { title: 'International Data Transfers', duration: '5 min' },
    { title: 'Contact & Data Protection Officer', duration: '5 min' },
  ],
};

const cookiePolicyBook: BookData = {
  title: 'Cookie Policy',
  cover: cookiePolicyCover,
  href: '/cookies',
  category: 'guide',
  coverLocked: true,
  tableOfContents: [
    { title: 'What Are Cookies', duration: '5 min' },
    { title: 'Types of Cookies We Use', duration: '10 min' },
    { title: 'Essential Cookies', duration: '5 min' },
    { title: 'Performance & Analytics Cookies', duration: '5 min' },
    { title: 'Functional Cookies', duration: '5 min' },
    { title: 'Managing & Disabling Cookies', duration: '5 min' },
    { title: 'Third-Party Cookies', duration: '5 min' },
    { title: 'Changes to This Policy', duration: '5 min' },
  ],
};

const disclaimersBook: BookData = {
  title: 'Disclaimers',
  cover: disclaimersCover,
  href: '/disclaimers',
  category: 'guide',
  coverLocked: true,
  tableOfContents: [
    { title: 'General Disclaimer', duration: '5 min' },
    { title: 'Property Information Disclaimer', duration: '5 min' },
    { title: 'Financial & Investment Disclaimers', duration: '10 min' },
    { title: 'AI Tools & Technology Disclaimer', duration: '5 min' },
    { title: 'Golden Visa & Immigration Disclaimer', duration: '5 min' },
    { title: 'Third-Party Content Disclaimer', duration: '5 min' },
    { title: 'Market Data & Analytics Disclaimer', duration: '5 min' },
  ],
};

const trustComplianceBook: BookData = {
  title: 'Trust & Compliance',
  cover: trustComplianceCover,
  href: '/aml-kyc',
  category: 'guide',
  coverLocked: true,
  tableOfContents: [
    { title: 'Our Commitment to Trust', duration: '5 min' },
    { title: 'Regulatory Compliance (RERA/DLD)', duration: '10 min' },
    { title: 'AML & KYC Policies', duration: '10 min' },
    { title: 'Data Protection & Security', duration: '10 min' },
    { title: 'Audit Trail & Transparency', duration: '5 min' },
    { title: 'Complaint Resolution Process', duration: '5 min' },
  ],
};

// ─── Company Profile (Brochure Style) ───

const companyProfileBook: BookData = {
  title: 'Company Profile',
  cover: companyProfileCover,
  backCover: companyProfileBackCover,
  href: '/company-profile',
  category: 'report',
  coverLocked: true,
  tableOfContents: [
    { title: 'Company Overview', duration: '5 min' },
    { title: 'Platform Positioning', duration: '5 min' },
    { title: 'Founder & CEO', duration: '5 min' },
    { title: 'Our Mission', duration: '3 min' },
    { title: 'Our Vision', duration: '3 min' },
    { title: 'Core Values', duration: '5 min' },
    { title: 'Services', duration: '10 min' },
    { title: 'AI Tools & Creativity', duration: '5 min' },
    { title: 'Real Estate Marketplace', duration: '5 min' },
    { title: 'Dubai as a Destination', duration: '5 min' },
    { title: 'Prime Areas of Focus', duration: '5 min' },
    { title: 'Platform Benefits', duration: '5 min' },
    { title: 'Portfolio Highlights', duration: '5 min' },
    { title: 'Investor Journey', duration: '5 min' },
    { title: 'Partner Network', duration: '5 min' },
    { title: 'Contact', duration: '2 min' },
  ],
};

// ─── Collections ───

export const INVESTOR_BOOKS: BookData[] = [
  // Guides
  guidesLibraryBook,
  investorEducationBook,
  marketIntelligenceBook,
  goldenVisaBook,
  buyerGuideBook,
  sellerGuideBook,
  landlordGuideBook,
  rentGuideBook,
  tenantGuideBook,
  // Company
  companyProfileBook,
];

export const BROKER_BOOKS: BookData[] = [
  // Broker-specific
  brokerTrainingBook,
  brokerCertificationBook,
  brokerFaqBook,
  // Guides
  guidesLibraryBook,
  marketIntelligenceBook,
  goldenVisaBook,
  investorEducationBook,
  buyerGuideBook,
  sellerGuideBook,
  landlordGuideBook,
  rentGuideBook,
  tenantGuideBook,
  // Company
  companyProfileBook,
];

export const LEGAL_BOOKS: BookData[] = [
  termsOfServiceBook,
  privacyPolicyBook,
  cookiePolicyBook,
  disclaimersBook,
  trustComplianceBook,
];

export const COMPANY_BOOKS: BookData[] = [
  companyProfileBook,
];

// ─── News Book ───

const newsBook: BookData = {
  title: 'News & Updates',
  cover: companyProfileCover, // reuse company cover for now
  href: '/news',
  category: 'report',
  tableOfContents: [
    { title: 'Latest Market News', duration: '5 min' },
    { title: 'Regulatory Updates', duration: '5 min' },
    { title: 'Company Announcements', duration: '5 min' },
    { title: 'Industry Reports', duration: '10 min' },
    { title: 'Developer News', duration: '5 min' },
  ],
};

export const NEWS_BOOKS: BookData[] = [
  newsBook,
  companyProfileBook,
];

// ─── Individual Book Exports (for single-page use) ───

export {
  buyerGuideBook,
  sellerGuideBook,
  landlordGuideBook,
  rentGuideBook,
  tenantGuideBook,
  goldenVisaBook,
  companyProfileBook,
  guidesLibraryBook,
  investorEducationBook,
  marketIntelligenceBook,
  brokerFaqBook,
  // Broker books
  brokerTrainingBook,
  brokerCertificationBook,
  // Legal books
  termsOfServiceBook,
  privacyPolicyBook,
  cookiePolicyBook,
  disclaimersBook,
  trustComplianceBook,
};
