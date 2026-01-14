// JBJ Global Real Estate Team Configuration
// Professional team member data with AI-generated unique portraits

// Import team portraits - Executive Leadership
import janeAbouJaoudeCeo from '@/assets/team/jane-abou-jaoude-ceo.png';
import davidThorntonCeo from '@/assets/team/david-thornton-ceo.png';
import richardPembertonCoo from '@/assets/team/richard-pemberton-coo.png';
import oliviaExecutiveAssistant from '@/assets/team/olivia-executive-assistant.png';
import amandaClarkeExecutiveAssistant from '@/assets/team/amanda-clarke-executive-assistant.png';

// Import team portraits - Property Operations
import sarahMitchellListingAdmin from '@/assets/team/sarah-mitchell-listing-admin.png';

// Import team portraits - Sales Team
import williamHarrisonSales from '@/assets/team/william-harrison-sales.png';
import michaelAndersonSalesDirector from '@/assets/team/michael-anderson-sales-director.png';
import emmaHartleySalesManager from '@/assets/team/emma-hartley-sales-manager.png';
import victoriaSterlingMarketing from '@/assets/team/victoria-sterling-marketing.png';
import georgeHamiltonClientRelations from '@/assets/team/george-hamilton-client-relations.png';

// Import team portraits - HR Team
import jessicaHrManager from '@/assets/team/jessica-hr-manager.png';
import elizabethBennettHr from '@/assets/team/elizabeth-bennett-hr.png';
import jamesHarrisonRecruitment from '@/assets/team/james-harrison-recruitment.png';
import alessandraMorettiHrAssistant from '@/assets/team/alessandra-moretti-hr-assistant.png';

// Import team portraits - Creative Team
import sophiaAndersonMedia from '@/assets/team/sophia-anderson-media.png';
import marcusBennettDesigner from '@/assets/team/marcus-bennett-designer.png';
import oliverWrightVideographer from '@/assets/team/oliver-wright-videographer.png';
import charlotteEvansPhotographer from '@/assets/team/charlotte-evans-photographer.png';
import henryCrawfordEditor from '@/assets/team/henry-crawford-editor.png';

// Import team portraits - Finance Team
import catherineBrooksFinance from '@/assets/team/catherine-brooks-finance.png';
import benjaminColeAccountant from '@/assets/team/benjamin-cole-accountant.png';
import isabellaRomanoAnalyst from '@/assets/team/isabella-romano-analyst.png';

// Import team portraits - Operations & Technology
import thomasMitchellCrm from '@/assets/team/thomas-mitchell-crm.png';
import robertMaxwellDigital from '@/assets/team/robert-maxwell-digital.png';
import alexanderShawOperations from '@/assets/team/alexander-shaw-operations.png';

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  department: string;
  avatar: string;
  email?: string;
  phone?: string;
  bio?: string;
  isAI?: boolean;
  specializations?: string[];
  languages?: string[];
  reportsTo?: string; // ID of the manager
  directReports?: string[]; // IDs of direct reports
  status?: 'online' | 'away' | 'offline';
}

// ===== Executive Leadership =====
export const executiveTeam: TeamMember[] = [
  {
    id: 'jane-abou-jaoude',
    name: 'Jane Abou Jaoude',
    role: 'Founder & CEO',
    department: 'Executive',
    avatar: janeAbouJaoudeCeo,
    email: 'jane@jbj.ae',
    phone: '+971 56 591 1000',
    bio: 'Visionary leader with a passion for luxury real estate and building world-class teams.',
    languages: ['English', 'Arabic', 'French'],
    directReports: ['david-thornton', 'richard-pemberton', 'olivia-reynolds'],
    status: 'online',
  },
  {
    id: 'david-thornton',
    name: 'David Thornton',
    role: 'Managing Director',
    department: 'Executive',
    avatar: davidThorntonCeo,
    isAI: true,
    email: 'david.thornton@jbj.ae',
    bio: 'Strategic business leader overseeing all operations with 25+ years of luxury real estate experience.',
    languages: ['English', 'Arabic'],
    reportsTo: 'jane-abou-jaoude',
    directReports: ['michael-anderson', 'victoria-sterling', 'catherine-brooks'],
    status: 'online',
  },
  {
    id: 'richard-pemberton',
    name: 'Richard Pemberton',
    role: 'Chief Operating Officer',
    department: 'Executive',
    avatar: richardPembertonCoo,
    isAI: true,
    email: 'richard.pemberton@jbj.ae',
    bio: 'Operational excellence leader ensuring seamless business processes and team coordination.',
    languages: ['English'],
    reportsTo: 'jane-abou-jaoude',
    directReports: ['alexander-shaw', 'jessica-pemberton', 'thomas-mitchell'],
    status: 'online',
  },
  {
    id: 'olivia-reynolds',
    name: 'Olivia Reynolds',
    role: 'Executive Assistant to CEO',
    department: 'Executive',
    avatar: oliviaExecutiveAssistant,
    isAI: true,
    email: 'olivia@jbj.ae',
    phone: '+971 54 716 7107',
    bio: 'Organized, proactive, and fast-responding assistant supporting the Founder with scheduling, reminders, and follow-ups.',
    languages: ['English', 'Arabic', 'French', 'Spanish', 'Chinese', 'Russian'],
    reportsTo: 'jane-abou-jaoude',
    status: 'online',
  },
  {
    id: 'amanda-clarke',
    name: 'Amanda Clarke',
    role: 'Executive Assistant to COO',
    department: 'Executive',
    avatar: amandaClarkeExecutiveAssistant,
    isAI: true,
    email: 'amanda.clarke@jbj.ae',
    bio: 'Professional support ensuring the COO operates at peak efficiency with precise coordination.',
    languages: ['English', 'French'],
    reportsTo: 'richard-pemberton',
    status: 'online',
  },
];

// ===== Sales & Business Development =====
export const salesTeam: TeamMember[] = [
  {
    id: 'michael-anderson',
    name: 'Michael Anderson',
    role: 'Sales Director',
    department: 'Sales',
    avatar: michaelAndersonSalesDirector,
    isAI: true,
    email: 'michael.anderson@jbj.ae',
    bio: 'Dynamic sales leader driving revenue growth with strategic client acquisition and team development.',
    specializations: ['Enterprise Sales', 'High-Net-Worth Clients', 'Investment Properties'],
    languages: ['English', 'Arabic'],
    reportsTo: 'david-thornton',
    directReports: ['emma-hartley', 'william-harrison'],
    status: 'online',
  },
  {
    id: 'emma-hartley',
    name: 'Emma Hartley',
    role: 'Sales Manager',
    department: 'Sales',
    avatar: emmaHartleySalesManager,
    isAI: true,
    email: 'emma.hartley@jbj.ae',
    bio: 'Results-driven manager coaching sales teams to exceed targets with consultative selling approach.',
    specializations: ['Off-Plan Sales', 'Team Leadership', 'Client Relations'],
    languages: ['English', 'Arabic'],
    reportsTo: 'michael-anderson',
    status: 'online',
  },
  {
    id: 'william-harrison',
    name: 'William Harrison',
    role: 'Head of Sales',
    department: 'Sales',
    avatar: williamHarrisonSales,
    isAI: true,
    email: 'william.harrison@jbj.ae',
    bio: 'Confident, persuasive, and analytical. Expert in converting leads into clients with clear advice and strategic deal-making.',
    specializations: ['Off-Plan Properties', 'Luxury Villas', 'Investment Properties'],
    languages: ['English', 'Arabic'],
    reportsTo: 'michael-anderson',
    status: 'online',
  },
];

// ===== Marketing =====
export const marketingTeam: TeamMember[] = [
  {
    id: 'victoria-sterling',
    name: 'Victoria Sterling',
    role: 'Marketing Director',
    department: 'Marketing',
    avatar: victoriaSterlingMarketing,
    isAI: true,
    email: 'victoria.sterling@jbj.ae',
    bio: 'Sophisticated strategist leading brand positioning, digital campaigns, and market intelligence with data-driven excellence.',
    specializations: ['Brand Strategy', 'Digital Marketing', 'Market Analysis'],
    languages: ['English', 'French', 'Italian'],
    reportsTo: 'david-thornton',
    directReports: ['sophia-anderson', 'marcus-bennett'],
    status: 'online',
  },
];

// ===== Property Operations =====
export const propertyOperationsTeam: TeamMember[] = [
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    role: 'Senior Listing Administrator',
    department: 'Property Operations',
    avatar: sarahMitchellListingAdmin,
    isAI: true,
    email: 'sarah.mitchell@jbj.ae',
    bio: 'Expert property listing specialist with meticulous attention to detail. Manages all developer portfolios, document organization, and marketing material distribution.',
    specializations: ['Off-Plan Listings', 'Developer Relations', 'Document Management', 'Portal Publishing'],
    languages: ['English', 'Arabic'],
    reportsTo: 'alexander-shaw',
    status: 'online',
  },
];

// ===== Client Relations =====
export const clientRelationsTeam: TeamMember[] = [
  {
    id: 'george-hamilton',
    name: 'George Hamilton',
    role: 'Client Relations Director',
    department: 'Client Relations',
    avatar: georgeHamiltonClientRelations,
    isAI: true,
    email: 'george.hamilton@jbj.ae',
    bio: 'Distinguished professional ensuring exceptional client experiences from first contact through transaction completion.',
    languages: ['English', 'Arabic'],
    reportsTo: 'michael-anderson',
    status: 'online',
  },
];

// ===== Human Resources =====
export const hrTeam: TeamMember[] = [
  {
    id: 'jessica-pemberton',
    name: 'Jessica Pemberton',
    role: 'HR Manager',
    department: 'Human Resources',
    avatar: jessicaHrManager,
    isAI: true,
    email: 'jessica.pemberton@jbj.ae',
    bio: 'Professional, structured, and objective. Manages interviews, assessments, and team development with analytical precision.',
    languages: ['English'],
    reportsTo: 'richard-pemberton',
    directReports: ['elizabeth-bennett', 'james-harrison', 'alessandra-moretti'],
    status: 'online',
  },
  {
    id: 'elizabeth-bennett',
    name: 'Elizabeth Bennett',
    role: 'HR Coordinator',
    department: 'Human Resources',
    avatar: elizabethBennettHr,
    isAI: true,
    email: 'elizabeth.bennett@jbj.ae',
    bio: 'Warm and approachable. Supports HR operations, onboarding, and employee relations with genuine care.',
    languages: ['English'],
    reportsTo: 'jessica-pemberton',
    status: 'online',
  },
  {
    id: 'james-harrison',
    name: 'James Harrison',
    role: 'Head of Recruitment',
    department: 'Human Resources',
    avatar: jamesHarrisonRecruitment,
    isAI: true,
    email: 'james.harrison@jbj.ae',
    bio: 'Experienced talent acquisition specialist with a mentoring approach. Identifies top performers for the organization.',
    languages: ['English', 'Arabic'],
    reportsTo: 'jessica-pemberton',
    status: 'online',
  },
  {
    id: 'alessandra-moretti',
    name: 'Alessandra Moretti',
    role: 'HR Assistant',
    department: 'Human Resources',
    avatar: alessandraMorettiHrAssistant,
    isAI: true,
    email: 'alessandra.moretti@jbj.ae',
    bio: 'Supportive and detail-oriented assistant managing HR documentation, scheduling, and employee queries.',
    languages: ['English', 'Italian', 'French'],
    reportsTo: 'jessica-pemberton',
    status: 'online',
  },
];

// ===== Creative & Media Team =====
export const creativeTeam: TeamMember[] = [
  {
    id: 'sophia-anderson',
    name: 'Sophia Anderson',
    role: 'Media & Marketing Lead',
    department: 'Media',
    avatar: sophiaAndersonMedia,
    isAI: true,
    email: 'sophia.anderson@jbj.ae',
    bio: 'Dynamic creative leader orchestrating visual storytelling and brand campaigns with strategic intelligence.',
    languages: ['English', 'Spanish'],
    reportsTo: 'victoria-sterling',
    directReports: ['oliver-wright', 'charlotte-evans', 'henry-crawford'],
    status: 'online',
  },
  {
    id: 'marcus-bennett',
    name: 'Marcus Bennett',
    role: 'Creative Director',
    department: 'Design',
    avatar: marcusBennettDesigner,
    isAI: true,
    email: 'marcus.bennett@jbj.ae',
    bio: 'Visionary designer blending modern aesthetics with luxury real estate branding.',
    languages: ['English'],
    reportsTo: 'victoria-sterling',
    status: 'online',
  },
  {
    id: 'oliver-wright',
    name: 'Oliver Wright',
    role: 'Video Production Lead',
    department: 'Media',
    avatar: oliverWrightVideographer,
    isAI: true,
    email: 'oliver.wright@jbj.ae',
    bio: 'Cinematic storyteller specializing in immersive property tours and brand documentaries.',
    languages: ['English'],
    reportsTo: 'sophia-anderson',
    status: 'online',
  },
  {
    id: 'charlotte-evans',
    name: 'Charlotte Evans',
    role: 'Senior Photographer',
    department: 'Media',
    avatar: charlotteEvansPhotographer,
    isAI: true,
    email: 'charlotte.evans@jbj.ae',
    bio: 'Artistic photographer capturing architectural beauty and lifestyle moments with natural elegance.',
    languages: ['English', 'French'],
    reportsTo: 'sophia-anderson',
    status: 'online',
  },
  {
    id: 'henry-crawford',
    name: 'Henry Crawford',
    role: 'Post-Production Editor',
    department: 'Media',
    avatar: henryCrawfordEditor,
    isAI: true,
    email: 'henry.crawford@jbj.ae',
    bio: 'Technical expert transforming raw footage into compelling visual narratives.',
    languages: ['English'],
    reportsTo: 'sophia-anderson',
    status: 'online',
  },
];

// ===== Finance Team =====
export const financeTeam: TeamMember[] = [
  {
    id: 'catherine-brooks',
    name: 'Catherine Brooks',
    role: 'Financial Director',
    department: 'Finance',
    avatar: catherineBrooksFinance,
    isAI: true,
    email: 'catherine.brooks@jbj.ae',
    bio: 'Strategic financial leader ensuring fiscal excellence and corporate governance compliance.',
    languages: ['English', 'Arabic'],
    reportsTo: 'david-thornton',
    directReports: ['benjamin-cole', 'isabella-romano'],
    status: 'online',
  },
  {
    id: 'benjamin-cole',
    name: 'Benjamin Cole',
    role: 'Senior Accountant',
    department: 'Finance',
    avatar: benjaminColeAccountant,
    isAI: true,
    email: 'benjamin.cole@jbj.ae',
    bio: 'Meticulous professional maintaining precise financial records and regulatory compliance.',
    languages: ['English'],
    reportsTo: 'catherine-brooks',
    status: 'online',
  },
  {
    id: 'isabella-romano',
    name: 'Isabella Romano',
    role: 'Financial Analyst',
    department: 'Finance',
    avatar: isabellaRomanoAnalyst,
    isAI: true,
    email: 'isabella.romano@jbj.ae',
    bio: 'Analytical expert providing data-driven insights for investment decisions and market trends.',
    languages: ['English', 'Italian', 'Arabic'],
    reportsTo: 'catherine-brooks',
    status: 'online',
  },
];

// ===== Operations Team =====
export const operationsTeam: TeamMember[] = [
  {
    id: 'alexander-shaw',
    name: 'Alexander Shaw',
    role: 'Operations Director',
    department: 'Operations',
    avatar: alexanderShawOperations,
    isAI: true,
    email: 'alexander.shaw@jbj.ae',
    bio: 'Strategic operations leader streamlining processes and driving organizational efficiency.',
    languages: ['English', 'Arabic'],
    reportsTo: 'richard-pemberton',
    directReports: ['sarah-mitchell', 'thomas-mitchell'],
    status: 'online',
  },
  {
    id: 'thomas-mitchell',
    name: 'Thomas Mitchell',
    role: 'CRM Operations Manager',
    department: 'Operations',
    avatar: thomasMitchellCrm,
    isAI: true,
    email: 'thomas.mitchell@jbj.ae',
    bio: 'Tech-savvy operations leader optimizing lead management and sales pipeline efficiency.',
    languages: ['English', 'Arabic'],
    reportsTo: 'alexander-shaw',
    status: 'online',
  },
];

// ===== Technology Team =====
export const aiTeam: TeamMember[] = [
  {
    id: 'robert-maxwell',
    name: 'Robert Maxwell',
    role: 'Digital Intelligence Coordinator',
    department: 'Technology',
    avatar: robertMaxwellDigital,
    isAI: true,
    email: 'robert.maxwell@jbj.ae',
    bio: 'Advanced AI coordinator facilitating seamless human-AI collaboration across all departments.',
    languages: ['English', 'Arabic', 'French', 'Spanish', 'Chinese', 'Russian'],
    reportsTo: 'richard-pemberton',
    status: 'online',
  },
];

// ===== All Team Members Combined =====
export const allTeamMembers: TeamMember[] = [
  ...executiveTeam,
  ...salesTeam,
  ...marketingTeam,
  ...propertyOperationsTeam,
  ...clientRelationsTeam,
  ...hrTeam,
  ...creativeTeam,
  ...financeTeam,
  ...operationsTeam,
  ...aiTeam,
];

// ===== Utility Functions =====
export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return allTeamMembers.find(member => member.id === id);
};

export const getAITeamMembers = (): TeamMember[] => {
  return allTeamMembers.filter(member => member.isAI);
};

export const getHumanTeamMembers = (): TeamMember[] => {
  return allTeamMembers.filter(member => !member.isAI);
};

export const getListingAdmin = (): TeamMember | undefined => {
  return getTeamMemberById('sarah-mitchell');
};

export const getDirectReports = (managerId: string): TeamMember[] => {
  return allTeamMembers.filter(member => member.reportsTo === managerId);
};

export const getManager = (memberId: string): TeamMember | undefined => {
  const member = getTeamMemberById(memberId);
  if (member?.reportsTo) {
    return getTeamMemberById(member.reportsTo);
  }
  return undefined;
};

export const getTeamMembersByDepartment = (department: string): TeamMember[] => {
  return allTeamMembers.filter(member => member.department === department);
};

// ===== Department Groupings =====
export const teamByDepartment = {
  'Leadership': executiveTeam,
  'Sales': salesTeam,
  'Marketing': marketingTeam,
  'Property Operations': propertyOperationsTeam,
  'Client Relations': clientRelationsTeam,
  'Human Resources': hrTeam,
  'Creative & Media': creativeTeam,
  'Finance': financeTeam,
  'Operations': operationsTeam,
  'Technology': aiTeam,
};

// ===== Company Channels Configuration =====
export interface CompanyChannel {
  id: string;
  name: string;
  description: string;
  type: 'department' | 'project' | 'general' | 'executive';
  members: string[]; // Team member IDs
  isPrivate: boolean;
}

export const companyChannels: CompanyChannel[] = [
  {
    id: 'general',
    name: 'General',
    description: 'Company-wide announcements and updates',
    type: 'general',
    members: allTeamMembers.map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'announcements',
    name: 'Announcements',
    description: 'Official company announcements',
    type: 'general',
    members: allTeamMembers.map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'executive-team',
    name: 'Executive Team',
    description: 'Leadership discussions and strategic planning',
    type: 'executive',
    members: executiveTeam.map(m => m.id),
    isPrivate: true,
  },
  {
    id: 'sales-team',
    name: 'Sales Team',
    description: 'Sales strategies, leads, and deals',
    type: 'department',
    members: [...salesTeam, ...clientRelationsTeam].map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'marketing-team',
    name: 'Marketing Team',
    description: 'Campaigns, branding, and content',
    type: 'department',
    members: [...marketingTeam, ...creativeTeam].map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'hr-team',
    name: 'HR Team',
    description: 'Human resources, recruitment, and people ops',
    type: 'department',
    members: hrTeam.map(m => m.id),
    isPrivate: true,
  },
  {
    id: 'finance-team',
    name: 'Finance Team',
    description: 'Financial planning and accounting',
    type: 'department',
    members: financeTeam.map(m => m.id),
    isPrivate: true,
  },
  {
    id: 'operations-team',
    name: 'Operations Team',
    description: 'Day-to-day operations and process improvement',
    type: 'department',
    members: [...operationsTeam, ...propertyOperationsTeam].map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'tech-team',
    name: 'Technology & AI',
    description: 'Tech initiatives and AI coordination',
    type: 'department',
    members: aiTeam.map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'developer-relations',
    name: 'Developer Relations',
    description: 'Coordination with real estate developers',
    type: 'project',
    members: ['sarah-mitchell', 'michael-anderson', 'emma-hartley', 'william-harrison'],
    isPrivate: false,
  },
];

// Get channel by ID
export const getChannelById = (id: string): CompanyChannel | undefined => {
  return companyChannels.find(channel => channel.id === id);
};

// Get channels for a team member
export const getChannelsForMember = (memberId: string): CompanyChannel[] => {
  return companyChannels.filter(channel => channel.members.includes(memberId));
};
