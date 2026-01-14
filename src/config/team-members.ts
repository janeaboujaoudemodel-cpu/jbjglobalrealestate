// JBJ Global Real Estate Team Configuration
// Professional team member data with generated portraits

// Import team portraits
import janeAbouJaoudeCeo from '@/assets/team/jane-abou-jaoude-ceo.png';
import oliviaExecutiveAssistant from '@/assets/team/olivia-executive-assistant.png';
import jamesMorganSales from '@/assets/team/james-morgan-sales.png';
import mayaKhalidMarketing from '@/assets/team/maya-khalid-marketing.png';
import danielBrooksClientRelations from '@/assets/team/daniel-brooks-client-relations.png';
import jessicaHrManager from '@/assets/team/jessica-hr-manager.png';
import hannahHrAssistant from '@/assets/team/hannah-hr-assistant.png';
import emmaTorresMedia from '@/assets/team/emma-torres-media.png';
import leoMartinezDesigner from '@/assets/team/leo-martinez-designer.png';
import alexReidVideographer from '@/assets/team/alex-reid-videographer.png';
import claraNguyenPhotographer from '@/assets/team/clara-nguyen-photographer.png';
import ethanWalkerEditor from '@/assets/team/ethan-walker-editor.png';
import laylaAhmedFinance from '@/assets/team/layla-ahmed-finance.png';
import davidLeeAccountant from '@/assets/team/david-lee-accountant.png';
import davidCarterRecruitment from '@/assets/team/david-carter-recruitment.png';
import sarahPatelAnalyst from '@/assets/team/sarah-patel-analyst.png';
import christopherAdamsCrm from '@/assets/team/christopher-adams-crm.png';
import jbjDigitalAssistant from '@/assets/team/jbj-digital-assistant.png';

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
    id: 'olivia',
    name: 'Olivia',
    role: 'Executive Assistant to CEO',
    department: 'Executive',
    avatar: oliviaExecutiveAssistant,
    isAI: true,
    bio: 'Organized, proactive, and fast-responding assistant supporting the Founder with scheduling, reminders, and follow-ups.',
  },
];

// Sales Team
export const salesTeam: TeamMember[] = [
  {
    id: 'james-morgan',
    name: 'James Morgan',
    role: 'Head of Sales',
    department: 'Sales',
    avatar: jamesMorganSales,
    isAI: true,
    bio: 'Confident, persuasive, and analytical. Expert in converting leads into clients with clear advice.',
    specializations: ['Off-Plan Properties', 'Luxury Villas', 'Investment Properties'],
    languages: ['English', 'Arabic'],
  },
  {
    id: 'maya-khalid',
    name: 'Maya Khalid',
    role: 'Marketing Director',
    department: 'Marketing',
    avatar: mayaKhalidMarketing,
    isAI: true,
    bio: 'Warm, engaging, and intelligent. Builds rapport and discovers client needs with empathy.',
    specializations: ['Brand Strategy', 'Digital Marketing', 'Client Relations'],
    languages: ['English', 'Arabic', 'Hindi'],
  },
];

// Client Relations
export const clientRelationsTeam: TeamMember[] = [
  {
    id: 'daniel-brooks',
    name: 'Daniel Brooks',
    role: 'Client Relations Executive',
    department: 'Client Relations',
    avatar: danielBrooksClientRelations,
    bio: 'Professional and welcoming. First point of contact for all client inquiries.',
  },
];

// HR Team
export const hrTeam: TeamMember[] = [
  {
    id: 'jessica',
    name: 'Jessica',
    role: 'HR Manager',
    department: 'Human Resources',
    avatar: jessicaHrManager,
    isAI: true,
    bio: 'Professional, structured, and neutral. Manages interviews, CVs, and assessments objectively.',
  },
  {
    id: 'hannah',
    name: 'Hannah',
    role: 'HR Assistant',
    department: 'Human Resources',
    avatar: hannahHrAssistant,
    bio: 'Bright and approachable. Supports HR operations with efficiency and care.',
  },
  {
    id: 'david-carter',
    name: 'David Carter',
    role: 'Head of Recruitment',
    department: 'Human Resources',
    avatar: davidCarterRecruitment,
    bio: 'Experienced recruiter with a mentoring approach. Identifies top talent for the organization.',
  },
];

// Media & Creative Team
export const creativeTeam: TeamMember[] = [
  {
    id: 'emma-torres',
    name: 'Emma Torres',
    role: 'Media & Marketing Lead',
    department: 'Media',
    avatar: emmaTorresMedia,
    bio: 'Creative yet professional. Leads media strategy with intelligence and style.',
  },
  {
    id: 'leo-martinez',
    name: 'Leo Martinez',
    role: 'Creative Designer',
    department: 'Design',
    avatar: leoMartinezDesigner,
    bio: 'Modern creative professional with confident artistic energy.',
  },
  {
    id: 'alex-reid',
    name: 'Alex Reid',
    role: 'Video Production Specialist',
    department: 'Media',
    avatar: alexReidVideographer,
    bio: 'Professional videographer specializing in cinematic property tours.',
  },
  {
    id: 'clara-nguyen',
    name: 'Clara Nguyen',
    role: 'Property Photographer',
    department: 'Media',
    avatar: claraNguyenPhotographer,
    bio: 'Artistic photographer capturing luxury properties with natural elegance.',
  },
  {
    id: 'ethan-walker',
    name: 'Ethan Walker',
    role: 'Post-Production Editor',
    department: 'Media',
    avatar: ethanWalkerEditor,
    bio: 'Skilled video editor creating compelling visual content.',
  },
];

// Finance Team
export const financeTeam: TeamMember[] = [
  {
    id: 'layla-ahmed',
    name: 'Layla Ahmed',
    role: 'Financial Manager',
    department: 'Finance',
    avatar: laylaAhmedFinance,
    bio: 'Confident and precise. Manages financial operations with analytical excellence.',
  },
  {
    id: 'david-lee',
    name: 'David Lee',
    role: 'Senior Accountant',
    department: 'Finance',
    avatar: davidLeeAccountant,
    bio: 'Neat and approachable. Ensures accurate financial records.',
  },
  {
    id: 'sarah-patel',
    name: 'Sarah Patel',
    role: 'Financial Analyst',
    department: 'Finance',
    avatar: sarahPatelAnalyst,
    bio: 'Intelligent and analytical. Provides data-driven insights for business decisions.',
  },
];

// Operations Team
export const operationsTeam: TeamMember[] = [
  {
    id: 'christopher-adams',
    name: 'Christopher Adams',
    role: 'CRM Lead Manager',
    department: 'Operations',
    avatar: christopherAdamsCrm,
    bio: 'Tech-savvy professional managing lead operations with confidence.',
  },
];

// AI Team
export const aiTeam: TeamMember[] = [
  {
    id: 'jbj-digital-assistant',
    name: 'JBJ Digital Assistant',
    role: 'Digital Coordinator (AI)',
    department: 'Technology',
    avatar: jbjDigitalAssistant,
    isAI: true,
    bio: 'Advanced AI coordinator facilitating seamless human-AI collaboration.',
  },
];

// All team members combined
export const allTeamMembers: TeamMember[] = [
  ...executiveTeam,
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

// Dummy employees to remove (placeholders)
export const DUMMY_EMPLOYEES_TO_REMOVE = [
  'Ahmed Hassan',
  'Sarah Johnson', 
  'Michael Chen',
];
