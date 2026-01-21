/**
 * JBJ Global Real Estate — Department Metadata Configuration
 * MASTER_ENTERPRISE_MODE = TRUE
 * LOCKED_GLOBAL = TRUE
 * AUTO_SYNC_HIERARCHY = TRUE
 * CHATBGCRM_PRO_ENABLED = TRUE
 * 
 * This file contains project highlights, tech stack, and summaries for all departments.
 * Synchronized across /team, /crm/employees, /dashboard, /team-communication
 */

export interface ProjectHighlight {
  title: string;
  description: string;
  status: 'Active' | 'Planned' | 'Completed';
}

export interface DepartmentMetadata {
  id: string;
  name: string;
  summary: string;
  techStack: string[];
  projectHighlights: ProjectHighlight[];
  regionalCoverage?: string[];
}

// Master department metadata configuration
export const departmentMetadata: Record<string, DepartmentMetadata> = {
  Leadership: {
    id: 'leadership',
    name: 'Leadership & Legal',
    summary: 'The executive team drives strategic vision, corporate governance, and international expansion across GCC, MENA, Europe, and global markets through innovation and leadership excellence.',
    techStack: ['ChatBGCRM Pro Supporter', 'JBJ Process Sync', 'Executive Dashboard', 'Board Portal'],
    projectHighlights: [
      {
        title: 'Global Expansion 2025',
        description: 'Strategic market entry into European and Asian luxury property markets.',
        status: 'Active',
      },
      {
        title: 'Corporate Governance Framework',
        description: 'Enterprise-wide compliance and risk management system implementation.',
        status: 'Completed',
      },
      {
        title: 'Investor Relations Portal',
        description: 'Digital platform for stakeholder communication and transparency.',
        status: 'Active',
      },
    ],
  },
  Legal: {
    id: 'legal',
    name: 'Legal',
    summary: 'The legal department ensures regulatory compliance, contract management, and corporate governance across all JBJ operations in the UAE and international markets.',
    techStack: ['DocuSign', 'LexisNexis', 'Contract Lifecycle Management', 'Compliance Suite'],
    projectHighlights: [
      {
        title: 'RERA Compliance Automation',
        description: 'Automated regulatory compliance tracking for all property transactions.',
        status: 'Active',
      },
      {
        title: 'International Contract Templates',
        description: 'Standardized legal frameworks for cross-border transactions.',
        status: 'Completed',
      },
      {
        title: 'AML/KYC Enhancement',
        description: 'Advanced anti-money laundering and client verification systems.',
        status: 'Active',
      },
    ],
  },
  Sales: {
    id: 'sales',
    name: 'Sales & Business Development',
    summary: 'The sales team delivers premium property solutions to clients across GCC, MENA, Europe, Africa, Asia-Pacific, and the Americas, supported by advanced CRM automation and regional expertise.',
    techStack: ['ChatBGCRM Pro Supporter', 'JBJ Broker Hub', 'Lead Scoring AI', 'Pipeline Analytics'],
    projectHighlights: [
      {
        title: 'Global Client Acquisition 2025',
        description: 'Automated international client onboarding using AI-driven analytics.',
        status: 'Active',
      },
      {
        title: 'MENA Market Expansion',
        description: 'Regional sales coverage across Lebanon, Syria, Jordan, Morocco, Algeria, Tunisia.',
        status: 'Active',
      },
      {
        title: 'VIP Client Program',
        description: 'Exclusive concierge services for high-net-worth property investors.',
        status: 'Active',
      },
    ],
    regionalCoverage: ['Global Coverage', 'GCC', 'MENA', 'Europe', 'UK', 'Americas', 'Asia-Pacific', 'Africa'],
  },
  'After Sales': {
    id: 'after-sales',
    name: 'After Sales',
    summary: 'The after-sales team ensures seamless post-purchase support, property handover coordination, and long-term client relationship management for all completed transactions.',
    techStack: ['ChatBGCRM Pro Supporter', 'Handover Management System', 'Client Portal', 'Feedback Analytics'],
    projectHighlights: [
      {
        title: 'Digital Handover Platform',
        description: 'Streamlined property handover process with real-time documentation.',
        status: 'Active',
      },
      {
        title: 'Client Satisfaction Initiative',
        description: 'NPS-driven feedback loop for continuous service improvement.',
        status: 'Active',
      },
      {
        title: 'Warranty Management System',
        description: 'Automated tracking and resolution of post-sale warranty claims.',
        status: 'Completed',
      },
    ],
  },
  'Marketing & Content': {
    id: 'marketing',
    name: 'Marketing & Content',
    summary: 'The marketing team crafts compelling brand narratives, digital campaigns, and content strategies that position JBJ as the premier luxury real estate brand in the region.',
    techStack: ['AI Content Studio', 'HubSpot Marketing Hub', 'Adobe Creative Cloud', 'Google Analytics 4'],
    projectHighlights: [
      {
        title: 'Brand Refresh 2025',
        description: 'Complete visual identity and messaging update across all channels.',
        status: 'Completed',
      },
      {
        title: 'AI-Powered Content Engine',
        description: 'Automated content generation for listings and marketing collateral.',
        status: 'Active',
      },
      {
        title: 'Social Media Command Center',
        description: 'Unified platform for multi-channel social engagement and analytics.',
        status: 'Active',
      },
    ],
  },
  'Client Relations': {
    id: 'client-relations',
    name: 'Client Relations',
    summary: 'The client relations team builds lasting partnerships with property buyers and investors, providing personalized service and strategic portfolio guidance.',
    techStack: ['ChatBGCRM Pro Supporter', 'Client Portal', 'Portfolio Analytics', 'Communication Suite'],
    projectHighlights: [
      {
        title: 'Client Portfolio Dashboard',
        description: 'Real-time property portfolio tracking and performance analytics.',
        status: 'Active',
      },
      {
        title: 'Multi-Language Support',
        description: 'Expanded client service capabilities in 15+ languages.',
        status: 'Completed',
      },
      {
        title: 'Investor Relations Program',
        description: 'Dedicated support for institutional and private investors.',
        status: 'Active',
      },
    ],
  },
  'VIP Client Relations': {
    id: 'vip-client-relations',
    name: 'VIP Client Relations',
    summary: 'The VIP team delivers white-glove concierge services to ultra-high-net-worth clients, managing exclusive property portfolios and bespoke investment opportunities.',
    techStack: ['ChatBGCRM Pro Supporter', 'VIP Concierge Suite', 'Private Client Portal', 'Secure Communication'],
    projectHighlights: [
      {
        title: 'Private Viewing Program',
        description: 'Exclusive property showcases for UHNW clients and families.',
        status: 'Active',
      },
      {
        title: 'Global Investment Advisory',
        description: 'Personalized investment strategies for international portfolios.',
        status: 'Active',
      },
      {
        title: 'Luxury Lifestyle Integration',
        description: 'Concierge services connecting property with lifestyle amenities.',
        status: 'Planned',
      },
    ],
  },
  'Human Resources': {
    id: 'hr',
    name: 'Human Resources',
    summary: 'The HR team attracts, develops, and retains world-class talent while fostering a culture of excellence, diversity, and professional growth.',
    techStack: ['Lovable HR Dashboard', 'Workday', 'LinkedIn Recruiter', 'Culture Amp'],
    projectHighlights: [
      {
        title: 'Talent Acquisition 2025',
        description: 'Global recruitment drive to expand team across key markets.',
        status: 'Active',
      },
      {
        title: 'Learning & Development Platform',
        description: 'Comprehensive training programs for continuous skill enhancement.',
        status: 'Active',
      },
      {
        title: 'Employee Engagement Initiative',
        description: 'Culture programs to boost retention and satisfaction.',
        status: 'Completed',
      },
    ],
  },
  'Creative & Media': {
    id: 'creative-media',
    name: 'Creative & Media Center',
    summary: 'The creative team produces stunning visual content, from cinematic property videos to award-winning photography, elevating JBJ\'s brand presence globally.',
    techStack: ['Adobe Creative Cloud', 'DaVinci Resolve', 'Capture One', 'After Effects'],
    projectHighlights: [
      {
        title: 'Cinematic Property Showcase',
        description: 'High-production video tours for premium listings.',
        status: 'Active',
      },
      {
        title: 'Virtual Reality Tours',
        description: 'Immersive 3D property experiences for remote clients.',
        status: 'Active',
      },
      {
        title: 'Brand Media Library',
        description: 'Centralized asset management for all visual content.',
        status: 'Completed',
      },
    ],
  },
  Finance: {
    id: 'finance',
    name: 'Finance',
    summary: 'The finance team manages fiscal operations, investment analysis, and financial reporting to ensure sustainable growth and investor confidence.',
    techStack: ['JBJ Ledger Automation', 'SAP Business One', 'Power BI', 'Treasury Management'],
    projectHighlights: [
      {
        title: 'Automated Financial Reporting',
        description: 'Real-time dashboards for executive financial visibility.',
        status: 'Active',
      },
      {
        title: 'Investment Analysis Platform',
        description: 'AI-powered property valuation and ROI forecasting.',
        status: 'Active',
      },
      {
        title: 'Multi-Currency Processing',
        description: 'Streamlined international transaction handling.',
        status: 'Completed',
      },
    ],
  },
  Operations: {
    id: 'operations',
    name: 'Operations',
    summary: 'The operations team ensures seamless execution of business processes, facility management, and cross-departmental coordination for optimal efficiency.',
    techStack: ['JBJ Process Sync', 'Asana', 'Monday.com', 'Process Mining Suite'],
    projectHighlights: [
      {
        title: 'Process Automation Initiative',
        description: 'End-to-end workflow automation across departments.',
        status: 'Active',
      },
      {
        title: 'Facility Management System',
        description: 'Smart building management for office locations.',
        status: 'Completed',
      },
      {
        title: 'Vendor Management Portal',
        description: 'Centralized platform for supplier relationships.',
        status: 'Active',
      },
    ],
  },
  'Software Engineering': {
    id: 'software-engineering',
    name: 'Software Engineering',
    summary: 'The engineering team builds and maintains JBJ\'s digital infrastructure, from the Property Portal to the Broker Hub CRM, using modern technologies.',
    techStack: ['React', 'Next.js', 'Node.js', 'PostgreSQL', 'TypeScript', 'Supabase'],
    projectHighlights: [
      {
        title: 'JBJ Property Portal',
        description: 'Next-generation listing platform with AI-powered search.',
        status: 'Active',
      },
      {
        title: 'Broker Hub CRM',
        description: 'Custom CRM system for agent productivity and lead management.',
        status: 'Active',
      },
      {
        title: 'Mobile App Development',
        description: 'Native iOS and Android apps for clients and brokers.',
        status: 'Planned',
      },
    ],
  },
  'Project Management': {
    id: 'project-management',
    name: 'Project Management',
    summary: 'The project management team coordinates complex initiatives, ensuring on-time delivery and stakeholder alignment across all departments.',
    techStack: ['Asana', 'Jira', 'Monday.com', 'Confluence', 'Agile Methodology'],
    projectHighlights: [
      {
        title: 'Enterprise PMO Setup',
        description: 'Standardized project governance framework implementation.',
        status: 'Completed',
      },
      {
        title: 'Digital Transformation Program',
        description: 'Company-wide technology modernization initiative.',
        status: 'Active',
      },
      {
        title: 'Resource Optimization',
        description: 'AI-driven resource allocation and capacity planning.',
        status: 'Active',
      },
    ],
  },
  IT: {
    id: 'it',
    name: 'IT',
    summary: 'The IT team manages infrastructure, cybersecurity, and technical support to ensure reliable, secure, and scalable technology operations.',
    techStack: ['CloudOps Monitoring Suite', 'Microsoft 365', 'Azure', 'CrowdStrike', 'ServiceNow'],
    projectHighlights: [
      {
        title: 'Cloud Migration',
        description: 'Complete infrastructure migration to Azure cloud.',
        status: 'Completed',
      },
      {
        title: 'Cybersecurity Enhancement',
        description: 'Zero-trust security architecture implementation.',
        status: 'Active',
      },
      {
        title: 'IT Helpdesk Automation',
        description: 'AI-powered support ticketing and resolution.',
        status: 'Active',
      },
    ],
  },
  Administration: {
    id: 'administration',
    name: 'Administration',
    summary: 'The administration team manages office operations, front desk services, and executive support to ensure smooth day-to-day business activities.',
    techStack: ['Microsoft Office 365', 'Google Workspace', 'Envoy', 'DocuSign', 'SharePoint'],
    projectHighlights: [
      {
        title: 'Smart Office Initiative',
        description: 'Digital workplace transformation for hybrid work.',
        status: 'Active',
      },
      {
        title: 'Document Management System',
        description: 'Centralized digital archive for all company documents.',
        status: 'Completed',
      },
      {
        title: 'Visitor Management',
        description: 'Automated check-in and security clearance system.',
        status: 'Active',
      },
    ],
  },
  'Customer Happiness': {
    id: 'customer-happiness',
    name: 'Customer Happiness',
    summary: 'The customer happiness team delivers exceptional support experiences, resolving inquiries and ensuring client satisfaction across all touchpoints.',
    techStack: ['ChatBGCRM Pro Supporter', 'Feedback Analytics Engine', 'Zendesk', 'Intercom', 'WhatsApp Business'],
    projectHighlights: [
      {
        title: '24/7 Support Center',
        description: 'Round-the-clock multilingual client support operations.',
        status: 'Active',
      },
      {
        title: 'AI Chat Assistant',
        description: 'Intelligent chatbot for instant query resolution.',
        status: 'Active',
      },
      {
        title: 'Voice of Customer Program',
        description: 'Comprehensive feedback collection and analysis system.',
        status: 'Completed',
      },
    ],
  },
};

// Get department metadata by name
export function getDepartmentMetadata(departmentName: string): DepartmentMetadata | undefined {
  return departmentMetadata[departmentName];
}

// Get all department summaries
export function getAllDepartmentSummaries(): { name: string; summary: string }[] {
  return Object.values(departmentMetadata).map((dept) => ({
    name: dept.name,
    summary: dept.summary,
  }));
}

// Company-wide summary
export const companySummary = 
  "JBJ Global Real Estate unites diverse, multilingual professionals across 13 departments to deliver high-value property and investment solutions through innovation and global collaboration.";
