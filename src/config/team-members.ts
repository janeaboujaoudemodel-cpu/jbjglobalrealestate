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
import royDavidHeadOfSale from '@/assets/team/roy-david-head-of-sale.png';
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

// Import team portraits - IT Team
import danielParkerItManager from '@/assets/team/daniel-parker-it-manager.png';
import rajPatelItAssistant from '@/assets/team/raj-patel-it-assistant.png';

// Import team portraits - Admin & Front Desk
import emilyWatsonAdminManager from '@/assets/team/emily-watson-admin-manager.png';
import mariaSantosAdminAssistant from '@/assets/team/maria-santos-admin-assistant.png';
import sophieRichardsReceptionist from '@/assets/team/sophie-richards-receptionist.png';
import gabrielaCostaReceptionist from '@/assets/team/gabriela-costa-receptionist.png';
import claireDuboisReceptionist from '@/assets/team/claire-dubois-receptionist.png';

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
  nationality?: string;
  reportsTo?: string; // ID of the manager
  directReports?: string[]; // IDs of direct reports
  status?: 'online' | 'away' | 'offline';
  hierarchyLevel?: number; // 1 = CEO, 2 = C-Level, 3 = Director, 4 = Manager, 5 = Coordinator, 6 = Assistant
  canConductInterviews?: boolean; // Whether this person can conduct AI interviews
}

// Helper function to sort by hierarchy level
const sortByHierarchy = (members: TeamMember[]): TeamMember[] => {
  return [...members].sort((a, b) => (a.hierarchyLevel || 99) - (b.hierarchyLevel || 99));
};

// ===== Executive Leadership (sorted by hierarchy) =====
export const executiveTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'jane-abou-jaoude',
    name: 'Jane Abou Jaoude',
    role: 'Founder & CEO',
    department: 'Executive',
    avatar: janeAbouJaoudeCeo,
    email: 'jane@JBJ.ae',
    phone: '+971 56 591 1000',
    bio: 'Visionary leader with a passion for luxury real estate and building world-class teams.',
    languages: ['English', 'Arabic', 'French', 'Spanish'],
    nationality: 'Lebanese',
    hierarchyLevel: 1,
    directReports: ['david-thornton', 'richard-pemberton', 'olivia-reynolds'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'david-thornton',
    name: 'David Thornton',
    role: 'Managing Director',
    department: 'Executive',
    avatar: davidThorntonCeo,
    isAI: true,
    email: 'david.thornton@JBJ.ae',
    bio: 'Strategic business leader overseeing all operations with 25+ years of luxury real estate experience.',
    languages: ['English', 'German'],
    nationality: 'British',
    hierarchyLevel: 2,
    reportsTo: 'jane-abou-jaoude',
    directReports: ['roy-david', 'victoria-sterling', 'catherine-brooks'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'richard-pemberton',
    name: 'Richard Pemberton',
    role: 'Chief Operating Officer',
    department: 'Executive',
    avatar: richardPembertonCoo,
    isAI: true,
    email: 'richard.pemberton@JBJ.ae',
    bio: 'Operational excellence leader ensuring seamless business processes and team coordination.',
    languages: ['English', 'French', 'Spanish'],
    nationality: 'British',
    hierarchyLevel: 2,
    reportsTo: 'jane-abou-jaoude',
    directReports: ['alexander-shaw', 'jessica-pemberton', 'thomas-mitchell', 'daniel-parker', 'emily-watson'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'olivia-reynolds',
    name: 'Olivia Reynolds',
    role: 'Executive Assistant to CEO',
    department: 'Executive',
    avatar: oliviaExecutiveAssistant,
    isAI: true,
    email: 'olivia@JBJ.ae',
    phone: '+971 54 716 7107',
    bio: 'Organized, proactive, and fast-responding assistant supporting the Founder with scheduling, reminders, and follow-ups.',
    languages: ['English', 'Italian', 'French', 'Spanish'],
    nationality: 'British',
    hierarchyLevel: 4,
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
    email: 'amanda.clarke@JBJ.ae',
    bio: 'Professional support ensuring the COO operates at peak efficiency with precise coordination.',
    languages: ['English', 'French', 'Italian'],
    nationality: 'American',
    hierarchyLevel: 4,
    reportsTo: 'richard-pemberton',
    status: 'online',
  },
]);

// ===== Sales & Business Development (sorted by hierarchy) =====
export const salesTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'roy-david',
    name: 'Roy David',
    role: 'Head of Sale',
    department: 'Sales',
    avatar: royDavidHeadOfSale,
    isAI: false,
    email: 'roy.david@JBJ.ae',
    phone: '+971 50 123 4567',
    bio: 'Dynamic sales leader with exceptional track record in luxury real estate. Leads the entire sales division with strategic vision and hands-on management.',
    specializations: ['Luxury Properties', 'High-Net-Worth Clients', 'Investment Properties', 'Team Leadership'],
    languages: ['English', 'Hebrew', 'Russian'],
    nationality: 'Israeli-British',
    hierarchyLevel: 3,
    reportsTo: 'david-thornton',
    directReports: ['michael-anderson', 'emma-hartley', 'william-harrison'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'michael-anderson',
    name: 'Michael Anderson',
    role: 'Sales Director',
    department: 'Sales',
    avatar: michaelAndersonSalesDirector,
    isAI: true,
    email: 'michael.anderson@JBJ.ae',
    bio: 'Dynamic sales leader driving revenue growth with strategic client acquisition and team development.',
    specializations: ['Enterprise Sales', 'High-Net-Worth Clients', 'Investment Properties'],
    languages: ['English', 'Hindi'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'roy-david',
    directReports: ['george-hamilton'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'emma-hartley',
    name: 'Emma Hartley',
    role: 'Sales Manager',
    department: 'Sales',
    avatar: emmaHartleySalesManager,
    isAI: true,
    email: 'emma.hartley@JBJ.ae',
    bio: 'Results-driven manager coaching sales teams to exceed targets with consultative selling approach.',
    specializations: ['Off-Plan Sales', 'Team Leadership', 'Client Relations'],
    languages: ['English', 'French'],
    nationality: 'British',
    hierarchyLevel: 4,
    reportsTo: 'roy-david',
    status: 'online',
  },
  {
    id: 'william-harrison',
    name: 'William Harrison',
    role: 'Senior Sales Executive',
    department: 'Sales',
    avatar: williamHarrisonSales,
    isAI: true,
    email: 'william.harrison@JBJ.ae',
    bio: 'Confident, persuasive, and analytical. Expert in converting leads into clients with clear advice and strategic deal-making.',
    specializations: ['Off-Plan Properties', 'Luxury Villas', 'Investment Properties'],
    languages: ['English', 'Portuguese'],
    nationality: 'British',
    hierarchyLevel: 5,
    reportsTo: 'roy-david',
    status: 'online',
  },
]);

// ===== Marketing (sorted by hierarchy) =====
export const marketingTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'victoria-sterling',
    name: 'Victoria Sterling',
    role: 'Marketing Director',
    department: 'Marketing',
    avatar: victoriaSterlingMarketing,
    isAI: true,
    email: 'victoria.sterling@JBJ.ae',
    bio: 'Sophisticated strategist leading brand positioning, digital campaigns, and market intelligence with data-driven excellence.',
    specializations: ['Brand Strategy', 'Digital Marketing', 'Market Analysis'],
    languages: ['English', 'French', 'Italian', 'Spanish'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'david-thornton',
    directReports: ['sophia-anderson', 'marcus-bennett'],
    status: 'online',
    canConductInterviews: true,
  },
]);

// ===== Property Operations (sorted by hierarchy) =====
export const propertyOperationsTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    role: 'Senior Listing Administrator',
    department: 'Property Operations',
    avatar: sarahMitchellListingAdmin,
    isAI: true,
    email: 'sarah.mitchell@JBJ.ae',
    bio: 'Expert property listing specialist with meticulous attention to detail. Manages all developer portfolios, document organization, and marketing material distribution.',
    specializations: ['Off-Plan Listings', 'Developer Relations', 'Document Management', 'Portal Publishing'],
    languages: ['English'],
    nationality: 'British',
    hierarchyLevel: 5,
    reportsTo: 'alexander-shaw',
    status: 'online',
  },
]);

// ===== Client Relations (sorted by hierarchy) =====
export const clientRelationsTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'george-hamilton',
    name: 'George Hamilton',
    role: 'Client Relations Director',
    department: 'Client Relations',
    avatar: georgeHamiltonClientRelations,
    isAI: true,
    email: 'george.hamilton@JBJ.ae',
    bio: 'Distinguished professional ensuring exceptional client experiences from first contact through transaction completion.',
    languages: ['English', 'German', 'French'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'michael-anderson',
    status: 'online',
    canConductInterviews: true,
  },
]);

// ===== Human Resources (sorted by hierarchy) =====
export const hrTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'james-harrison',
    name: 'James Harrison',
    role: 'Head of Recruitment',
    department: 'Human Resources',
    avatar: jamesHarrisonRecruitment,
    isAI: true,
    email: 'james.harrison@JBJ.ae',
    bio: 'Experienced talent acquisition specialist with a mentoring approach. Identifies top performers for the organization.',
    languages: ['English', 'French'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'richard-pemberton',
    directReports: ['jessica-pemberton'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'jessica-pemberton',
    name: 'Jessica Pemberton',
    role: 'HR Manager',
    department: 'Human Resources',
    avatar: jessicaHrManager,
    isAI: true,
    email: 'jessica.pemberton@JBJ.ae',
    bio: 'Professional, structured, and objective. Manages interviews, assessments, and team development with analytical precision.',
    languages: ['English', 'German', 'Dutch'],
    nationality: 'British',
    hierarchyLevel: 4,
    reportsTo: 'james-harrison',
    directReports: ['elizabeth-bennett', 'alessandra-moretti'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'elizabeth-bennett',
    name: 'Elizabeth Bennett',
    role: 'HR Coordinator',
    department: 'Human Resources',
    avatar: elizabethBennettHr,
    isAI: true,
    email: 'elizabeth.bennett@JBJ.ae',
    bio: 'Warm and approachable. Supports HR operations, onboarding, and employee relations with genuine care.',
    languages: ['English', 'Spanish', 'Portuguese'],
    nationality: 'American',
    hierarchyLevel: 5,
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
    email: 'alessandra.moretti@JBJ.ae',
    bio: 'Supportive and detail-oriented assistant managing HR documentation, scheduling, and employee queries.',
    languages: ['English', 'Italian', 'French', 'Spanish'],
    nationality: 'Italian',
    hierarchyLevel: 6,
    reportsTo: 'jessica-pemberton',
    status: 'online',
  },
]);

// ===== Creative & Media Team (sorted by hierarchy) =====
export const creativeTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'marcus-bennett',
    name: 'Marcus Bennett',
    role: 'Creative Director',
    department: 'Design',
    avatar: marcusBennettDesigner,
    isAI: true,
    email: 'marcus.bennett@JBJ.ae',
    bio: 'Visionary designer blending modern aesthetics with luxury real estate branding.',
    languages: ['English', 'French', 'Dutch'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'victoria-sterling',
    status: 'online',
  },
  {
    id: 'sophia-anderson',
    name: 'Sophia Anderson',
    role: 'Media & Marketing Lead',
    department: 'Media',
    avatar: sophiaAndersonMedia,
    isAI: true,
    email: 'sophia.anderson@JBJ.ae',
    bio: 'Dynamic creative leader orchestrating visual storytelling and brand campaigns with strategic intelligence.',
    languages: ['English', 'Spanish', 'Portuguese'],
    nationality: 'American',
    hierarchyLevel: 4,
    reportsTo: 'victoria-sterling',
    directReports: ['oliver-wright', 'charlotte-evans', 'henry-crawford'],
    status: 'online',
  },
  {
    id: 'oliver-wright',
    name: 'Oliver Wright',
    role: 'Video Production Lead',
    department: 'Media',
    avatar: oliverWrightVideographer,
    isAI: true,
    email: 'oliver.wright@JBJ.ae',
    bio: 'Cinematic storyteller specializing in immersive property tours and brand documentaries.',
    languages: ['English', 'German'],
    nationality: 'British',
    hierarchyLevel: 5,
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
    email: 'charlotte.evans@JBJ.ae',
    bio: 'Artistic photographer capturing architectural beauty and lifestyle moments with natural elegance.',
    languages: ['English', 'French', 'Italian'],
    nationality: 'British',
    hierarchyLevel: 5,
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
    email: 'henry.crawford@JBJ.ae',
    bio: 'Technical expert transforming raw footage into compelling visual narratives.',
    languages: ['English', 'Korean'],
    nationality: 'British',
    hierarchyLevel: 5,
    reportsTo: 'sophia-anderson',
    status: 'online',
  },
]);

// ===== Finance Team (sorted by hierarchy) =====
export const financeTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'catherine-brooks',
    name: 'Catherine Brooks',
    role: 'Financial Director',
    department: 'Finance',
    avatar: catherineBrooksFinance,
    isAI: true,
    email: 'catherine.brooks@JBJ.ae',
    bio: 'Strategic financial leader ensuring fiscal excellence and corporate governance compliance.',
    languages: ['English', 'French'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'david-thornton',
    directReports: ['benjamin-cole', 'isabella-romano'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'benjamin-cole',
    name: 'Benjamin Cole',
    role: 'Senior Accountant',
    department: 'Finance',
    avatar: benjaminColeAccountant,
    isAI: true,
    email: 'benjamin.cole@JBJ.ae',
    bio: 'Meticulous professional maintaining precise financial records and regulatory compliance.',
    languages: ['English', 'Hindi', 'Urdu'],
    nationality: 'British',
    hierarchyLevel: 5,
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
    email: 'isabella.romano@JBJ.ae',
    bio: 'Analytical expert providing data-driven insights for investment decisions and market trends.',
    languages: ['English', 'Italian', 'Spanish'],
    nationality: 'Italian',
    hierarchyLevel: 5,
    reportsTo: 'catherine-brooks',
    status: 'online',
  },
]);

// ===== Operations Team (sorted by hierarchy) =====
export const operationsTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'alexander-shaw',
    name: 'Alexander Shaw',
    role: 'Operations Director',
    department: 'Operations',
    avatar: alexanderShawOperations,
    isAI: true,
    email: 'alexander.shaw@JBJ.ae',
    bio: 'Strategic operations leader streamlining processes and driving organizational efficiency.',
    languages: ['English', 'Turkish'],
    nationality: 'British',
    hierarchyLevel: 3,
    reportsTo: 'richard-pemberton',
    directReports: ['sarah-mitchell', 'thomas-mitchell'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'thomas-mitchell',
    name: 'Thomas Mitchell',
    role: 'CRM Operations Manager',
    department: 'Operations',
    avatar: thomasMitchellCrm,
    isAI: true,
    email: 'thomas.mitchell@JBJ.ae',
    bio: 'Tech-savvy operations leader optimizing lead management and sales pipeline efficiency.',
    languages: ['English', 'Mandarin'],
    nationality: 'British',
    hierarchyLevel: 4,
    reportsTo: 'alexander-shaw',
    status: 'online',
  },
]);

// ===== IT Team (sorted by hierarchy) =====
export const itTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'daniel-parker',
    name: 'Daniel Parker',
    role: 'IT Manager',
    department: 'Technology',
    avatar: danielParkerItManager,
    isAI: true,
    email: 'daniel.parker@JBJ.ae',
    bio: 'Technical leader managing all IT infrastructure, systems, and digital solutions for the organization.',
    languages: ['English', 'German'],
    nationality: 'British',
    hierarchyLevel: 4,
    reportsTo: 'richard-pemberton',
    directReports: ['raj-patel'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'raj-patel',
    name: 'Raj Patel',
    role: 'IT Assistant',
    department: 'Technology',
    avatar: rajPatelItAssistant,
    isAI: true,
    email: 'raj.patel@JBJ.ae',
    bio: 'Dedicated IT support specialist providing technical assistance and maintaining system operations.',
    languages: ['English', 'Hindi', 'Gujarati'],
    nationality: 'Indian',
    hierarchyLevel: 6,
    reportsTo: 'daniel-parker',
    status: 'online',
  },
]);

// ===== Admin & Front Desk Team (sorted by hierarchy) =====
export const adminTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'emily-watson',
    name: 'Emily Watson',
    role: 'Admin Manager',
    department: 'Administration',
    avatar: emilyWatsonAdminManager,
    isAI: true,
    email: 'emily.watson@JBJ.ae',
    bio: 'Efficient administrator overseeing office operations, facilities, and front desk coordination.',
    languages: ['English', 'French'],
    nationality: 'British',
    hierarchyLevel: 4,
    reportsTo: 'richard-pemberton',
    directReports: ['maria-santos', 'sophie-richards', 'gabriela-costa', 'claire-dubois'],
    status: 'online',
    canConductInterviews: true,
  },
  {
    id: 'maria-santos',
    name: 'Maria Santos',
    role: 'Admin Assistant',
    department: 'Administration',
    avatar: mariaSantosAdminAssistant,
    isAI: true,
    email: 'maria.santos@JBJ.ae',
    bio: 'Organized and friendly assistant supporting daily administrative tasks and office coordination.',
    languages: ['English', 'Filipino', 'Tagalog'],
    nationality: 'Filipino',
    hierarchyLevel: 6,
    reportsTo: 'emily-watson',
    status: 'online',
  },
  {
    id: 'sophie-richards',
    name: 'Sophie Richards',
    role: 'Front Desk Receptionist',
    department: 'Administration',
    avatar: sophieRichardsReceptionist,
    isAI: true,
    email: 'sophie.richards@JBJ.ae',
    bio: 'Welcoming and professional receptionist creating excellent first impressions for all visitors.',
    languages: ['English', 'Spanish'],
    nationality: 'British',
    hierarchyLevel: 6,
    reportsTo: 'emily-watson',
    status: 'online',
  },
  {
    id: 'gabriela-costa',
    name: 'Gabriela Costa',
    role: 'Front Desk Receptionist',
    department: 'Administration',
    avatar: gabrielaCostaReceptionist,
    isAI: true,
    email: 'gabriela.costa@JBJ.ae',
    bio: 'Friendly and multilingual receptionist ensuring smooth visitor management and communication.',
    languages: ['English', 'Portuguese', 'Spanish'],
    nationality: 'Brazilian',
    hierarchyLevel: 6,
    reportsTo: 'emily-watson',
    status: 'online',
  },
  {
    id: 'claire-dubois',
    name: 'Claire Dubois',
    role: 'Front Desk Receptionist',
    department: 'Administration',
    avatar: claireDuboisReceptionist,
    isAI: true,
    email: 'claire.dubois@JBJ.ae',
    bio: 'Elegant and attentive receptionist providing premium front desk services with French sophistication.',
    languages: ['English', 'French', 'Italian'],
    nationality: 'French',
    hierarchyLevel: 6,
    reportsTo: 'emily-watson',
    status: 'online',
  },
]);

// ===== Technology Team (AI Coordination) =====
export const aiTeam: TeamMember[] = sortByHierarchy([
  {
    id: 'robert-maxwell',
    name: 'Robert Maxwell',
    role: 'Digital Intelligence Coordinator',
    department: 'Technology',
    avatar: robertMaxwellDigital,
    isAI: true,
    email: 'robert.maxwell@JBJ.ae',
    bio: 'Advanced AI coordinator facilitating seamless human-AI collaboration across all departments.',
    languages: ['English', 'French', 'Spanish', 'Chinese', 'Russian', 'Japanese'],
    nationality: 'British',
    hierarchyLevel: 4,
    reportsTo: 'richard-pemberton',
    status: 'online',
  },
]);

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
  ...itTeam,
  ...adminTeam,
  ...aiTeam,
];

// ===== Interview Panel Members =====
export const interviewPanelMembers: TeamMember[] = allTeamMembers.filter(m => m.canConductInterviews);

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

// ===== Department Groupings (Sorted by Hierarchy) =====
export const teamByDepartment = {
  'Leadership': executiveTeam,
  'Sales & Marketing': [...salesTeam, ...marketingTeam],
  'Property Operations': propertyOperationsTeam,
  'Client Relations': clientRelationsTeam,
  'Human Resources': hrTeam,
  'Creative & Media': creativeTeam,
  'Finance': financeTeam,
  'Operations': operationsTeam,
  'IT': itTeam,
  'Administration': adminTeam,
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
    name: 'Technology & IT',
    description: 'Tech initiatives, IT support, and AI coordination',
    type: 'department',
    members: [...aiTeam, ...itTeam].map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'admin-team',
    name: 'Administration',
    description: 'Office administration and front desk coordination',
    type: 'department',
    members: adminTeam.map(m => m.id),
    isPrivate: false,
  },
  {
    id: 'developer-relations',
    name: 'Developer Relations',
    description: 'Coordination with real estate developers',
    type: 'project',
    members: ['sarah-mitchell', 'roy-david', 'michael-anderson', 'emma-hartley', 'william-harrison'],
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

// ===== Interview Flow Configuration =====
export interface InterviewRound {
  round: number;
  title: string;
  interviewers: string[]; // Team member IDs
  duration: number; // in minutes
  type: 'screening' | 'technical' | 'behavioral' | 'final';
  description: string;
}

export const defaultInterviewFlow: InterviewRound[] = [
  {
    round: 1,
    title: 'Initial Screening',
    interviewers: ['jessica-pemberton'],
    duration: 30,
    type: 'screening',
    description: 'Initial assessment of qualifications, experience, and cultural fit.',
  },
  {
    round: 2,
    title: 'Recruitment Interview',
    interviewers: ['james-harrison'],
    duration: 45,
    type: 'behavioral',
    description: 'Deep dive into professional background, skills, and career goals.',
  },
  {
    round: 3,
    title: 'Final Executive Interview',
    interviewers: ['richard-pemberton', 'jane-abou-jaoude'],
    duration: 60,
    type: 'final',
    description: 'Final assessment with COO and CEO for senior positions.',
  },
];

// Department-specific interview flows
export const salesInterviewFlow: InterviewRound[] = [
  {
    round: 1,
    title: 'HR Screening',
    interviewers: ['jessica-pemberton'],
    duration: 30,
    type: 'screening',
    description: 'Initial assessment and cultural fit evaluation.',
  },
  {
    round: 2,
    title: 'Sales Leadership Interview',
    interviewers: ['roy-david', 'michael-anderson'],
    duration: 45,
    type: 'technical',
    description: 'Sales skills assessment, scenario discussions, and team fit.',
  },
  {
    round: 3,
    title: 'Final Interview',
    interviewers: ['david-thornton'],
    duration: 30,
    type: 'final',
    description: 'Final approval by Managing Director.',
  },
];
