/**
 * Sales Team Group Structure - JBJ Global Real Estate
 * Divides sales team into 3 groups under Sales Managers
 * 
 * HIERARCHY:
 * - Alexander Nasser (VP Sales) - AI persona, reports to Founder
 * - Michael Anderson (Sales Director) - Reports to Alexander, leads entire team
 * - Sales Managers (3): Adaeze Okonkwo, Emily Richardson, Emma Hartley
 * - Each Sales Manager has their own group of Property Consultants
 * 
 * RULE: Founder is member of ALL groups for oversight
 * RULE: Reports flow through hierarchy to Amanda Clarke, then to Founder
 */

import { salesTeam, TeamMember } from './team-members';

// ============================================
// SALES LEADERSHIP
// ============================================

export interface SalesGroup {
  id: string;
  name: string;
  managerId: string;
  managerName: string;
  members: string[];
  memberDetails: TeamMember[];
  description: string;
}

export interface SalesHierarchy {
  vpSales: TeamMember | undefined;
  salesDirector: TeamMember | undefined;
  salesManagers: TeamMember[];
  groups: SalesGroup[];
  managementGroup: TeamMember[];
}

// Get VP of Sales (Alexander Nasser - AI Persona)
const vpSales = salesTeam.find(m => m.id === 'alexander-nasser');

// Get Sales Director (Michael Anderson - leads entire team)
const salesDirector = salesTeam.find(m => m.id === 'michael-anderson');

// Get all Sales Managers
const salesManagers = salesTeam.filter(m => 
  m.role.toLowerCase().includes('sales manager') &&
  !m.role.toLowerCase().includes('director')
);

// Get all Property Consultants and Sales Executives (non-leadership)
const salesAgents = salesTeam.filter(m => {
  const lowerRole = m.role.toLowerCase();
  const isLeadership = 
    lowerRole.includes('vice president') ||
    lowerRole.includes('director') ||
    lowerRole.includes('manager');
  return !isLeadership;
});

// ============================================
// GROUP ASSIGNMENT ALGORITHM
// ============================================

function divideIntoGroups(
  agents: TeamMember[],
  managers: TeamMember[]
): SalesGroup[] {
  // Sort agents by experience (senior first)
  const sortedAgents = [...agents].sort(
    (a, b) => (b.yearsExperience || 0) - (a.yearsExperience || 0)
  );

  // Initialize groups
  const groups: SalesGroup[] = managers.map((manager, index) => ({
    id: `sales-group-${index + 1}`,
    name: `${manager.name}'s Team`,
    managerId: manager.id,
    managerName: manager.name,
    members: [],
    memberDetails: [],
    description: `Sales team led by ${manager.name}`,
  }));

  // Distribute agents evenly using round-robin
  sortedAgents.forEach((agent, index) => {
    const groupIndex = index % groups.length;
    groups[groupIndex].members.push(agent.id);
    groups[groupIndex].memberDetails.push(agent);
  });

  return groups;
}

// ============================================
// EXPORTED SALES STRUCTURE
// ============================================

const salesGroups = divideIntoGroups(salesAgents, salesManagers);

export const SALES_HIERARCHY: SalesHierarchy = {
  vpSales,
  salesDirector,
  salesManagers,
  groups: salesGroups,
  managementGroup: [
    vpSales,
    salesDirector,
    ...salesManagers,
  ].filter(Boolean) as TeamMember[],
};

// ============================================
// GROUP COMMUNICATION CHANNELS
// ============================================

export interface CommunicationGroup {
  id: string;
  name: string;
  type: 'sales-team' | 'management' | 'all-sales' | 'company-leadership';
  members: string[];
  managerId: string;
  description: string;
  founderAccess: boolean; // Founder is always in all groups
}

// Generate communication groups
export const COMMUNICATION_GROUPS: CommunicationGroup[] = [
  // Individual team groups under each manager
  ...salesGroups.map((group, index) => ({
    id: `team-${group.managerId}`,
    name: group.name,
    type: 'sales-team' as const,
    members: [
      'jane-abou-jaoude', // Founder in all groups
      group.managerId,
      ...group.members,
    ],
    managerId: group.managerId,
    description: `${group.managerName}'s team communication channel`,
    founderAccess: true,
  })),
  
  // All sales team under Michael Anderson
  {
    id: 'all-sales-team',
    name: 'JBJ Sales Team',
    type: 'all-sales',
    members: [
      'jane-abou-jaoude', // Founder
      'alexander-nasser', // VP Sales
      salesDirector?.id || 'michael-anderson',
      ...salesManagers.map(m => m.id),
      ...salesAgents.map(a => a.id),
    ],
    managerId: salesDirector?.id || 'michael-anderson',
    description: 'All JBJ sales team members - led by Sales Director',
    founderAccess: true,
  },
  
  // Sales leadership group
  {
    id: 'sales-leadership',
    name: 'Sales Leadership',
    type: 'management',
    members: [
      'jane-abou-jaoude', // Founder
      'amanda-clarke', // Founder's Assistant - receives reports
      'alexander-nasser',
      salesDirector?.id || 'michael-anderson',
      ...salesManagers.map(m => m.id),
    ],
    managerId: 'alexander-nasser',
    description: 'Sales leadership team for strategic decisions',
    founderAccess: true,
  },
  
  // Company leadership (all department heads)
  {
    id: 'company-leadership',
    name: 'JBJ Leadership Team',
    type: 'company-leadership',
    members: [
      'jane-abou-jaoude', // Founder & CEO
      'david-thornton', // MD
      'richard-pemberton', // COO
      'amanda-clarke', // CEO's Assistant
      'natasha-daoud', // CSO
      'anthony-crawford', // CIO
      'alexander-nasser', // VP Sales
      salesDirector?.id || 'michael-anderson', // Sales Director
      'victoria-sterling', // Marketing Director
      'jessica-whitmore', // HR Manager
      'catherine-brooks', // Finance Director
      'daniel-parker', // IT Director
      'alexander-shaw', // Operations Director
      'rachel-campbell', // Project Director
      'charles-ashford', // After Sales Director
    ],
    managerId: 'jane-abou-jaoude',
    description: 'Company leadership team for major decisions',
    founderAccess: true,
  },
];

// ============================================
// REPORTING CHAIN
// ============================================

export interface ReportingChain {
  from: string;
  to: string;
  frequency: 'daily' | 'weekly';
  reportType: string;
}

export const SALES_REPORTING_CHAIN: ReportingChain[] = [
  // Agents report to their managers
  ...salesGroups.flatMap(group => 
    group.members.map(memberId => ({
      from: memberId,
      to: group.managerId,
      frequency: 'daily' as const,
      reportType: 'Individual Performance Report',
    }))
  ),
  
  // Sales Managers report to Sales Director
  ...salesManagers.map(manager => ({
    from: manager.id,
    to: salesDirector?.id || 'michael-anderson',
    frequency: 'daily' as const,
    reportType: 'Team Performance Report',
  })),
  
  // Sales Director reports to Amanda (on behalf of Alexander Nasser)
  {
    from: salesDirector?.id || 'michael-anderson',
    to: 'amanda-clarke',
    frequency: 'daily' as const,
    reportType: 'Department Performance Report',
  },
  
  // Amanda compiles and sends to Founder
  {
    from: 'amanda-clarke',
    to: 'jane-abou-jaoude',
    frequency: 'daily' as const,
    reportType: 'Consolidated Company Report',
  },
];

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getGroupByManagerId(managerId: string): SalesGroup | undefined {
  return salesGroups.find(g => g.managerId === managerId);
}

export function getAgentGroup(agentId: string): SalesGroup | undefined {
  return salesGroups.find(g => g.members.includes(agentId));
}

export function getAgentManager(agentId: string): TeamMember | undefined {
  const group = getAgentGroup(agentId);
  if (!group) return undefined;
  return salesManagers.find(m => m.id === group.managerId);
}

export function isFounderMember(groupId: string): boolean {
  const group = COMMUNICATION_GROUPS.find(g => g.id === groupId);
  return group?.founderAccess ?? false;
}

export function getMemberGroups(memberId: string): CommunicationGroup[] {
  return COMMUNICATION_GROUPS.filter(g => g.members.includes(memberId));
}

// ============================================
// EXPORT SUMMARY
// ============================================

export const SALES_TEAM_SUMMARY = {
  totalSalesTeam: salesTeam.length,
  totalAgents: salesAgents.length,
  totalManagers: salesManagers.length,
  groupCount: salesGroups.length,
  groups: salesGroups.map(g => ({
    manager: g.managerName,
    memberCount: g.members.length,
    members: g.memberDetails.map(m => m.name),
  })),
};

console.log('Sales Team Structure Initialized:', SALES_TEAM_SUMMARY);

export default {
  SALES_HIERARCHY,
  COMMUNICATION_GROUPS,
  SALES_REPORTING_CHAIN,
  SALES_TEAM_SUMMARY,
  getGroupByManagerId,
  getAgentGroup,
  getAgentManager,
  isFounderMember,
  getMemberGroups,
};
