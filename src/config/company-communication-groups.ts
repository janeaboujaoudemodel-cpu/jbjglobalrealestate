/**
 * Company Communication Groups - JBJ Global Real Estate
 * Complete communication channel structure for all departments
 * 
 * LOCKED_GLOBAL = TRUE
 * 
 * RULES (Taught to Amanda Clarke):
 * 1. Founder (Jane Bou Jaoude) is member of ALL groups
 * 2. New joiners are AUTOMATICALLY added to eligible groups based on department
 * 3. News & Updates group for company announcements (all employees)
 * 4. Events group for launches and developer events (all employees can opt-in)
 * 5. Listing Admin group for property listings team
 * 6. JBJ Family group for entire company
 * 7. Each department has its own WhatsApp + Website channel
 */

import {
  allTeamMembers,
  executiveTeam,
  salesTeam,
  afterSalesTeam,
  marketingTeam,
  contentTeam,
  clientRelationsTeam,
  vipClientRelationsTeam,
  hrTeam,
  creativeTeam,
  financeTeam,
  operationsTeam,
  itTeam,
  adminTeam,
  softwareEngineeringTeam,
  projectManagementTeam,
  customerHappinessTeam,
  legalTeam,
  TeamMember,
} from './team-members';

// ============================================
// GROUP TYPES
// ============================================

export type GroupType = 
  | 'whatsapp' 
  | 'website' 
  | 'company-wide' 
  | 'department' 
  | 'special-interest'
  | 'leadership';

export type GroupPurpose = 
  | 'communication'
  | 'announcements'
  | 'events'
  | 'listings'
  | 'reporting'
  | 'collaboration';

// ============================================
// COMMUNICATION GROUP INTERFACE
// ============================================

export interface CommunicationGroup {
  id: string;
  name: string;
  type: GroupType;
  purpose: GroupPurpose;
  channels: ('whatsapp' | 'website')[];
  members: string[];
  memberDetails?: TeamMember[];
  managerId: string;
  managerName: string;
  description: string;
  founderAccess: true; // Founder ALWAYS has access
  autoJoin: boolean; // New joiners automatically added
  autoJoinCriteria?: string; // Criteria for auto-join (e.g., 'department:Sales')
  isActive: boolean;
  createdAt: string;
}

// ============================================
// FOUNDER ID (Always in all groups)
// ============================================

const FOUNDER_ID = 'jane-bou-jaoude';
const FOUNDER_ASSISTANT_ID = 'amanda-clarke';
const COO_ASSISTANT_ID = 'sarah-parker';

// ============================================
// COMPANY-WIDE GROUPS
// ============================================

export const COMPANY_WIDE_GROUPS: CommunicationGroup[] = [
  // JBJ Family - Everyone
  {
    id: 'jbj-family',
    name: 'JBJ Family',
    type: 'company-wide',
    purpose: 'communication',
    channels: ['whatsapp', 'website'],
    members: [FOUNDER_ID, ...allTeamMembers.map(m => m.id)],
    managerId: FOUNDER_ID,
    managerName: 'Jane Bou Jaoude',
    description: 'All JBJ employees - family communications and announcements',
    founderAccess: true,
    autoJoin: true,
    autoJoinCriteria: 'all-employees',
    isActive: true,
    createdAt: '2024-01-01',
  },

  // News & Updates - Company announcements
  {
    id: 'news-updates',
    name: 'JBJ News & Updates',
    type: 'company-wide',
    purpose: 'announcements',
    channels: ['whatsapp', 'website'],
    members: [FOUNDER_ID, FOUNDER_ASSISTANT_ID, ...allTeamMembers.map(m => m.id)],
    managerId: FOUNDER_ASSISTANT_ID,
    managerName: 'Amanda Clarke',
    description: 'Official company news, policy updates, and announcements. All employees receive updates here.',
    founderAccess: true,
    autoJoin: true,
    autoJoinCriteria: 'all-employees',
    isActive: true,
    createdAt: '2024-01-01',
  },

  // Events - Developer launches and company events
  {
    id: 'events-launches',
    name: 'JBJ Events & Launches',
    type: 'company-wide',
    purpose: 'events',
    channels: ['whatsapp', 'website'],
    members: [
      FOUNDER_ID, 
      FOUNDER_ASSISTANT_ID,
      ...allTeamMembers.map(m => m.id)
    ],
    managerId: FOUNDER_ASSISTANT_ID,
    managerName: 'Amanda Clarke',
    description: 'Developer launches, project events, and company gatherings. Employees can opt-in for specific events.',
    founderAccess: true,
    autoJoin: true,
    autoJoinCriteria: 'all-employees',
    isActive: true,
    createdAt: '2024-01-01',
  },

  // Listing Admin Group
  {
    id: 'listing-admin',
    name: 'Listing Admin Team',
    type: 'special-interest',
    purpose: 'listings',
    channels: ['whatsapp', 'website'],
    members: [
      FOUNDER_ID,
      FOUNDER_ASSISTANT_ID,
      'sarah-mitchell',
      'victoria-sterling',
      ...salesTeam.slice(0, 5).map(m => m.id), // Top sales for listings
    ],
    managerId: 'sarah-mitchell',
    managerName: 'Sarah Mitchell',
    description: 'Property listings coordination, updates, and approvals. For team members handling listings.',
    founderAccess: true,
    autoJoin: false,
    autoJoinCriteria: 'role:listing-admin',
    isActive: true,
    createdAt: '2024-01-01',
  },
];

// ============================================
// LEADERSHIP GROUPS
// ============================================

export const LEADERSHIP_GROUPS: CommunicationGroup[] = [
  // Company Leadership
  {
    id: 'company-leadership',
    name: 'JBJ Leadership Team',
    type: 'leadership',
    purpose: 'collaboration',
    channels: ['whatsapp', 'website'],
    members: [
      FOUNDER_ID,
      'david-thornton',
      'richard-pemberton',
      FOUNDER_ASSISTANT_ID,
      'natasha-daoud',
      'anthony-crawford',
      'alexander-nasser',
      'michael-anderson',
      'victoria-sterling',
      'jessica-whitmore',
      'catherine-brooks',
      'daniel-parker',
      'alexander-shaw',
      'rachel-campbell',
      'charles-ashford',
      'james-woodward',
      'lisa-henderson',
      'george-hamilton',
      'william-thornton-legal',
    ],
    managerId: FOUNDER_ID,
    managerName: 'Jane Bou Jaoude',
    description: 'Senior leadership team for strategic decisions and company direction',
    founderAccess: true,
    autoJoin: false,
    autoJoinCriteria: 'role:director,manager,head',
    isActive: true,
    createdAt: '2024-01-01',
  },

  // Department Heads
  {
    id: 'department-heads',
    name: 'Department Heads',
    type: 'leadership',
    purpose: 'reporting',
    channels: ['website'],
    members: [
      FOUNDER_ID,
      FOUNDER_ASSISTANT_ID,
      'david-thornton',
      'richard-pemberton',
      'alexander-nasser',
      'victoria-sterling',
      'jessica-whitmore',
      'catherine-brooks',
      'alexander-shaw',
      'james-woodward',
      'rachel-campbell',
      'lisa-henderson',
      'charles-ashford',
      'daniel-parker',
    ],
    managerId: FOUNDER_ID,
    managerName: 'Jane Bou Jaoude',
    description: 'Department heads coordination and cross-department collaboration',
    founderAccess: true,
    autoJoin: false,
    autoJoinCriteria: 'role:head,director',
    isActive: true,
    createdAt: '2024-01-01',
  },
];

// ============================================
// DEPARTMENT GROUPS GENERATOR
// ============================================

interface DepartmentConfig {
  id: string;
  name: string;
  members: TeamMember[];
  leaderId: string;
  leaderName: string;
  reportsTo: string;
}

const DEPARTMENT_CONFIGS: DepartmentConfig[] = [
  { id: 'sales', name: 'Sales', members: salesTeam, leaderId: 'alexander-nasser', leaderName: 'Alexander Nasser', reportsTo: FOUNDER_ID },
  { id: 'after-sales', name: 'After Sales', members: afterSalesTeam, leaderId: 'charles-ashford', leaderName: 'Charles Ashford', reportsTo: 'richard-pemberton' },
  { id: 'marketing-content', name: 'Marketing & Content', members: [...marketingTeam, ...contentTeam], leaderId: 'victoria-sterling', leaderName: 'Victoria Sterling', reportsTo: 'david-thornton' },
  { id: 'client-relations', name: 'Client Relations', members: [...clientRelationsTeam, ...vipClientRelationsTeam], leaderId: 'george-hamilton', leaderName: 'George Hamilton', reportsTo: 'michael-anderson' },
  { id: 'hr', name: 'Human Resources', members: hrTeam, leaderId: 'jessica-whitmore', leaderName: 'Jessica Whitmore', reportsTo: 'richard-pemberton' },
  { id: 'creative-media', name: 'Creative & Media', members: creativeTeam, leaderId: 'sophia-anderson', leaderName: 'Sophia Anderson', reportsTo: 'victoria-sterling' },
  { id: 'finance', name: 'Finance', members: financeTeam, leaderId: 'catherine-brooks', leaderName: 'Catherine Brooks', reportsTo: 'david-thornton' },
  { id: 'operations', name: 'Operations', members: operationsTeam, leaderId: 'alexander-shaw', leaderName: 'Alexander Shaw', reportsTo: 'richard-pemberton' },
  { id: 'it', name: 'IT', members: itTeam, leaderId: 'daniel-parker', leaderName: 'Daniel Parker', reportsTo: 'richard-pemberton' },
  { id: 'admin', name: 'Administration', members: adminTeam, leaderId: 'emily-watson', leaderName: 'Emily Watson', reportsTo: 'richard-pemberton' },
  { id: 'software-engineering', name: 'Software Engineering', members: softwareEngineeringTeam, leaderId: 'james-woodward', leaderName: 'James Woodward', reportsTo: 'richard-pemberton' },
  { id: 'project-management', name: 'Project Management', members: projectManagementTeam, leaderId: 'rachel-campbell', leaderName: 'Rachel Campbell', reportsTo: 'richard-pemberton' },
  { id: 'customer-happiness', name: 'Customer Happiness', members: customerHappinessTeam, leaderId: 'lisa-henderson', leaderName: 'Lisa Henderson', reportsTo: 'richard-pemberton' },
  { id: 'legal', name: 'Legal', members: legalTeam, leaderId: 'william-thornton-legal', leaderName: 'William Thornton', reportsTo: FOUNDER_ID },
];

function generateDepartmentGroups(): CommunicationGroup[] {
  const groups: CommunicationGroup[] = [];

  DEPARTMENT_CONFIGS.forEach(config => {
    // WhatsApp Group
    groups.push({
      id: `${config.id}-whatsapp`,
      name: `${config.name} WhatsApp`,
      type: 'department',
      purpose: 'communication',
      channels: ['whatsapp'],
      members: [FOUNDER_ID, ...config.members.map(m => m.id)],
      memberDetails: config.members,
      managerId: config.leaderId,
      managerName: config.leaderName,
      description: `${config.name} department WhatsApp group for quick communication`,
      founderAccess: true,
      autoJoin: true,
      autoJoinCriteria: `department:${config.name}`,
      isActive: true,
      createdAt: '2024-01-01',
    });

    // Website Team Communication
    groups.push({
      id: `${config.id}-team`,
      name: `${config.name} Team`,
      type: 'department',
      purpose: 'communication',
      channels: ['website'],
      members: [FOUNDER_ID, ...config.members.map(m => m.id)],
      memberDetails: config.members,
      managerId: config.leaderId,
      managerName: config.leaderName,
      description: `${config.name} department team communication channel`,
      founderAccess: true,
      autoJoin: true,
      autoJoinCriteria: `department:${config.name}`,
      isActive: true,
      createdAt: '2024-01-01',
    });
  });

  return groups;
}

export const DEPARTMENT_GROUPS = generateDepartmentGroups();

// ============================================
// ALL GROUPS COMBINED
// ============================================

export const ALL_COMMUNICATION_GROUPS: CommunicationGroup[] = [
  ...COMPANY_WIDE_GROUPS,
  ...LEADERSHIP_GROUPS,
  ...DEPARTMENT_GROUPS,
];

// ============================================
// AUTO-JOIN FUNCTIONS
// ============================================

/**
 * Get eligible groups for a new joiner based on their profile
 */
export function getEligibleGroupsForNewJoiner(member: TeamMember): CommunicationGroup[] {
  const eligibleGroups: CommunicationGroup[] = [];

  ALL_COMMUNICATION_GROUPS.forEach(group => {
    if (!group.autoJoin) return;

    const criteria = group.autoJoinCriteria || '';

    // All employees join
    if (criteria === 'all-employees') {
      eligibleGroups.push(group);
      return;
    }

    // Department match
    if (criteria.startsWith('department:')) {
      const deptName = criteria.replace('department:', '');
      if (member.department.toLowerCase().includes(deptName.toLowerCase())) {
        eligibleGroups.push(group);
        return;
      }
    }

    // Role match
    if (criteria.startsWith('role:')) {
      const roles = criteria.replace('role:', '').split(',');
      const memberRoleLower = member.role.toLowerCase();
      if (roles.some(r => memberRoleLower.includes(r.trim().toLowerCase()))) {
        eligibleGroups.push(group);
        return;
      }
    }
  });

  return eligibleGroups;
}

/**
 * Add new joiner to all eligible groups
 */
export function addNewJoinerToGroups(member: TeamMember): string[] {
  const eligibleGroups = getEligibleGroupsForNewJoiner(member);
  const addedToGroups: string[] = [];

  eligibleGroups.forEach(group => {
    if (!group.members.includes(member.id)) {
      group.members.push(member.id);
      addedToGroups.push(group.name);
    }
  });

  console.log(`[AUTO-JOIN] ${member.name} added to ${addedToGroups.length} groups:`, addedToGroups);
  return addedToGroups;
}

/**
 * Get all groups a member belongs to
 */
export function getMemberGroups(memberId: string): CommunicationGroup[] {
  return ALL_COMMUNICATION_GROUPS.filter(g => g.members.includes(memberId));
}

/**
 * Get groups by type
 */
export function getGroupsByType(type: GroupType): CommunicationGroup[] {
  return ALL_COMMUNICATION_GROUPS.filter(g => g.type === type);
}

/**
 * Get groups by purpose
 */
export function getGroupsByPurpose(purpose: GroupPurpose): CommunicationGroup[] {
  return ALL_COMMUNICATION_GROUPS.filter(g => g.purpose === purpose);
}

// ============================================
// ASSISTANT BRAIN RULES (Amanda Clarke)
// ============================================

export const ASSISTANT_GROUP_MANAGEMENT_RULES = {
  ruleId: 'GROUP_MANAGEMENT_V1',
  assignedTo: [FOUNDER_ASSISTANT_ID, COO_ASSISTANT_ID],
  rules: [
    {
      id: 'rule-auto-join',
      description: 'New joiners are automatically added to eligible groups based on department and role',
      action: 'When a new employee joins, call addNewJoinerToGroups(member)',
    },
    {
      id: 'rule-news-updates',
      description: 'All company announcements go to News & Updates group',
      action: 'Post official news to news-updates channel (WhatsApp + Website)',
    },
    {
      id: 'rule-events-launches',
      description: 'Developer launches and events go to Events & Launches group',
      action: 'Post event details to events-launches channel. Allow employees to confirm attendance.',
    },
    {
      id: 'rule-founder-access',
      description: 'Founder (Jane Bou Jaoude) has access to ALL groups',
      action: 'Always include Founder in any new group created',
    },
    {
      id: 'rule-important-launches',
      description: 'Important developer launches go to JBJ Family main group',
      action: 'For major launches, post to jbj-family group so all employees see it',
    },
    {
      id: 'rule-listing-updates',
      description: 'Property listing updates go to Listing Admin group',
      action: 'Coordinate listing approvals through listing-admin channel',
    },
    {
      id: 'rule-report-chain',
      description: 'Reports flow through hierarchy to Amanda Clarke, then to Founder',
      action: 'Collect reports from department heads, consolidate, and present to Founder',
    },
    {
      id: 'rule-manager-groups',
      description: 'Each sales manager has their own team group',
      action: 'Sales agents report to their assigned manager\'s group',
    },
  ],
  lastUpdated: new Date().toISOString(),
};

// ============================================
// SUMMARY
// ============================================

export const GROUP_STRUCTURE_SUMMARY = {
  totalGroups: ALL_COMMUNICATION_GROUPS.length,
  companyWideGroups: COMPANY_WIDE_GROUPS.length,
  leadershipGroups: LEADERSHIP_GROUPS.length,
  departmentGroups: DEPARTMENT_GROUPS.length,
  totalMembers: allTeamMembers.length,
  founderInAllGroups: true,
  autoJoinEnabled: true,
  channels: ['whatsapp', 'website'],
};

console.log('[GROUP STRUCTURE] Initialized:', GROUP_STRUCTURE_SUMMARY);
