// JBJ Global Real Estate Team Configuration
// Professional team member data with AI-generated unique portraits

// Import team portraits
import janeAbouJaoudeCeo from '@/assets/team/jane-abou-jaoude-ceo.png';
import oliviaExecutiveAssistant from '@/assets/team/olivia-executive-assistant.png';
import sarahMitchellListingAdmin from '@/assets/team/sarah-mitchell-listing-admin.png';
import williamHarrisonSales from '@/assets/team/william-harrison-sales.png';
import victoriaSterlingMarketing from '@/assets/team/victoria-sterling-marketing.png';
import georgeHamiltonClientRelations from '@/assets/team/george-hamilton-client-relations.png';
import jessicaHrManager from '@/assets/team/jessica-hr-manager.png';
import elizabethBennettHr from '@/assets/team/elizabeth-bennett-hr.png';
import jamesHarrisonRecruitment from '@/assets/team/james-harrison-recruitment.png';
import sophiaAndersonMedia from '@/assets/team/sophia-anderson-media.png';
import marcusBennettDesigner from '@/assets/team/marcus-bennett-designer.png';
import oliverWrightVideographer from '@/assets/team/oliver-wright-videographer.png';
import charlotteEvansPhotographer from '@/assets/team/charlotte-evans-photographer.png';
import henryCrawfordEditor from '@/assets/team/henry-crawford-editor.png';
import catherineBrooksFinance from '@/assets/team/catherine-brooks-finance.png';
import benjaminColeAccountant from '@/assets/team/benjamin-cole-accountant.png';
import isabellaRomanoAnalyst from '@/assets/team/isabella-romano-analyst.png';
import thomasMitchellCrm from '@/assets/team/thomas-mitchell-crm.png';
import robertMaxwellDigital from '@/assets/team/robert-maxwell-digital.png';

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
}

// Executive Leadership
export const executiveTeam: TeamMember[] = [
  {
    id: 'jane-abou-jaoude',
    name: 'Jane Abou Jaoude',
    role: 'Founder & CEO',
    department: 'Executive',
    avatar: janeAbouJaoudeCeo,
    email: 'jane@jbj.ae',
    bio: 'Visionary leader with a passion for luxury real estate and building world-class teams.',
    languages: ['English', 'Arabic', 'French'],
  },
  {
    id: 'olivia-reynolds',
    name: 'Olivia Reynolds',
    role: 'Executive Assistant to CEO',
    department: 'Executive',
    avatar: oliviaExecutiveAssistant,
    isAI: true,
    bio: 'Organized, proactive, and fast-responding assistant supporting the Founder with scheduling, reminders, and follow-ups.',
    languages: ['English', 'Arabic', 'French', 'Spanish'],
  },
];

// Property Operations Team
export const propertyOperationsTeam: TeamMember[] = [
  {
    id: 'sarah-mitchell',
    name: 'Sarah Mitchell',
    role: 'Senior Listing Administrator',
    department: 'Property Operations',
    avatar: sarahMitchellListingAdmin,
    isAI: true,
    bio: 'Expert property listing specialist with meticulous attention to detail. Manages all developer portfolios, document organization, and marketing material distribution.',
    specializations: ['Off-Plan Listings', 'Developer Relations', 'Document Management', 'Portal Publishing'],
    languages: ['English', 'Arabic'],
  },
];

// Sales Team
export const salesTeam: TeamMember[] = [
  {
    id: 'william-harrison',
    name: 'William Harrison',
    role: 'Head of Sales',
    department: 'Sales',
    avatar: williamHarrisonSales,
    isAI: true,
    bio: 'Confident, persuasive, and analytical. Expert in converting leads into clients with clear advice and strategic deal-making.',
    specializations: ['Off-Plan Properties', 'Luxury Villas', 'Investment Properties'],
    languages: ['English', 'Arabic'],
  },
  {
    id: 'victoria-sterling',
    name: 'Victoria Sterling',
    role: 'Marketing Director',
    department: 'Marketing',
    avatar: victoriaSterlingMarketing,
    isAI: true,
    bio: 'Sophisticated strategist leading brand positioning, digital campaigns, and market intelligence with data-driven excellence.',
    specializations: ['Brand Strategy', 'Digital Marketing', 'Market Analysis'],
    languages: ['English', 'French', 'Italian'],
  },
];

// Client Relations
export const clientRelationsTeam: TeamMember[] = [
  {
    id: 'george-hamilton',
    name: 'George Hamilton',
    role: 'Client Relations Director',
    department: 'Client Relations',
    avatar: georgeHamiltonClientRelations,
    bio: 'Distinguished professional ensuring exceptional client experiences from first contact through transaction completion.',
    languages: ['English', 'Arabic'],
  },
];

// HR Team
export const hrTeam: TeamMember[] = [
  {
    id: 'jessica-pemberton',
    name: 'Jessica Pemberton',
    role: 'HR Manager',
    department: 'Human Resources',
    avatar: jessicaHrManager,
    isAI: true,
    bio: 'Professional, structured, and objective. Manages interviews, assessments, and team development with analytical precision.',
    languages: ['English'],
  },
  {
    id: 'elizabeth-bennett',
    name: 'Elizabeth Bennett',
    role: 'HR Coordinator',
    department: 'Human Resources',
    avatar: elizabethBennettHr,
    bio: 'Warm and approachable. Supports HR operations, onboarding, and employee relations with genuine care.',
    languages: ['English'],
  },
  {
    id: 'james-harrison',
    name: 'James Harrison',
    role: 'Head of Recruitment',
    department: 'Human Resources',
    avatar: jamesHarrisonRecruitment,
    bio: 'Experienced talent acquisition specialist with a mentoring approach. Identifies top performers for the organization.',
    languages: ['English', 'Arabic'],
  },
];

// Media & Creative Team
export const creativeTeam: TeamMember[] = [
  {
    id: 'sophia-anderson',
    name: 'Sophia Anderson',
    role: 'Media & Marketing Lead',
    department: 'Media',
    avatar: sophiaAndersonMedia,
    bio: 'Dynamic creative leader orchestrating visual storytelling and brand campaigns with strategic intelligence.',
    languages: ['English', 'Spanish'],
  },
  {
    id: 'marcus-bennett',
    name: 'Marcus Bennett',
    role: 'Creative Director',
    department: 'Design',
    avatar: marcusBennettDesigner,
    bio: 'Visionary designer blending modern aesthetics with luxury real estate branding.',
    languages: ['English'],
  },
  {
    id: 'oliver-wright',
    name: 'Oliver Wright',
    role: 'Video Production Lead',
    department: 'Media',
    avatar: oliverWrightVideographer,
    bio: 'Cinematic storyteller specializing in immersive property tours and brand documentaries.',
    languages: ['English'],
  },
  {
    id: 'charlotte-evans',
    name: 'Charlotte Evans',
    role: 'Senior Photographer',
    department: 'Media',
    avatar: charlotteEvansPhotographer,
    bio: 'Artistic photographer capturing architectural beauty and lifestyle moments with natural elegance.',
    languages: ['English', 'French'],
  },
  {
    id: 'henry-crawford',
    name: 'Henry Crawford',
    role: 'Post-Production Editor',
    department: 'Media',
    avatar: henryCrawfordEditor,
    bio: 'Technical expert transforming raw footage into compelling visual narratives.',
    languages: ['English'],
  },
];

// Finance Team
export const financeTeam: TeamMember[] = [
  {
    id: 'catherine-brooks',
    name: 'Catherine Brooks',
    role: 'Financial Director',
    department: 'Finance',
    avatar: catherineBrooksFinance,
    bio: 'Strategic financial leader ensuring fiscal excellence and corporate governance compliance.',
    languages: ['English', 'Arabic'],
  },
  {
    id: 'benjamin-cole',
    name: 'Benjamin Cole',
    role: 'Senior Accountant',
    department: 'Finance',
    avatar: benjaminColeAccountant,
    bio: 'Meticulous professional maintaining precise financial records and regulatory compliance.',
    languages: ['English'],
  },
  {
    id: 'isabella-romano',
    name: 'Isabella Romano',
    role: 'Financial Analyst',
    department: 'Finance',
    avatar: isabellaRomanoAnalyst,
    bio: 'Analytical expert providing data-driven insights for investment decisions and market trends.',
    languages: ['English', 'Italian', 'Arabic'],
  },
];

// Operations Team
export const operationsTeam: TeamMember[] = [
  {
    id: 'thomas-mitchell',
    name: 'Thomas Mitchell',
    role: 'CRM Operations Manager',
    department: 'Operations',
    avatar: thomasMitchellCrm,
    bio: 'Tech-savvy operations leader optimizing lead management and sales pipeline efficiency.',
    languages: ['English', 'Arabic'],
  },
];

// AI & Technology Team
export const aiTeam: TeamMember[] = [
  {
    id: 'robert-maxwell',
    name: 'Robert Maxwell',
    role: 'Digital Intelligence Coordinator',
    department: 'Technology',
    avatar: robertMaxwellDigital,
    isAI: true,
    bio: 'Advanced AI coordinator facilitating seamless human-AI collaboration across all departments.',
    languages: ['English', 'Arabic', 'French', 'Spanish', 'Chinese', 'Russian'],
  },
];

// All team members combined
export const allTeamMembers: TeamMember[] = [
  ...executiveTeam,
  ...propertyOperationsTeam,
  ...salesTeam,
  ...clientRelationsTeam,
  ...hrTeam,
  ...creativeTeam,
  ...financeTeam,
  ...operationsTeam,
  ...aiTeam,
];

// Get team member by ID
export const getTeamMemberById = (id: string): TeamMember | undefined => {
  return allTeamMembers.find(member => member.id === id);
};

// Get AI team members only
export const getAITeamMembers = (): TeamMember[] => {
  return allTeamMembers.filter(member => member.isAI);
};

// Get human team members only
export const getHumanTeamMembers = (): TeamMember[] => {
  return allTeamMembers.filter(member => !member.isAI);
};

// Get Sarah Mitchell - Listing Admin
export const getListingAdmin = (): TeamMember | undefined => {
  return getTeamMemberById('sarah-mitchell');
};

// Department groupings for display
export const teamByDepartment = {
  'Leadership': executiveTeam,
  'Property Operations': propertyOperationsTeam,
  'Sales & Marketing': salesTeam,
  'Client Relations': clientRelationsTeam,
  'Human Resources': hrTeam,
  'Creative & Media': creativeTeam,
  'Finance': financeTeam,
  'Operations': operationsTeam,
  'Technology': aiTeam,
};
