/**
 * Department Group Structure - JBJ Global Real Estate
 * Defines communication groups for ALL departments
 * Each department has: 1 WhatsApp group + 1 Website Team Communication group
 * 
 * HIERARCHY RULES:
 * - Founder (Jane Bou Jaoude) is member of ALL groups
 * - Reports flow: Agent -> Senior -> Department Head -> Amanda Clarke -> Founder
 * - Each department leader sends consolidated reports to Amanda Clarke
 * 
 * LOCKED_GLOBAL = TRUE
 */

import {
  allTeamMembers,
  executiveTeam,
  salesTeam,
  afterSalesTeam,
  marketingTeam,
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
  contentTeam,
  customerHappinessTeam,
  legalTeam,
  TeamMember,
} from './team-members';

// ============================================
// DEPARTMENT GROUP INTERFACE
// ============================================

export interface DepartmentGroup {
  id: string;
  name: string;
  department: string;
  type: 'whatsapp' | 'website';
  members: string[];
  memberDetails: TeamMember[];
  leaderId: string;
  leaderName: string;
  reportsTo: string; // Who the department leader reports to
  description: string;
  founderAccess: true; // Founder ALWAYS has access
}

export interface ReportingNode {
  employeeId: string;
  employeeName: string;
  role: string;
  department: string;
  reportsTo: string;
  reportFrequency: 'daily' | 'weekly';
  reportType: string;
}

// ============================================
// DEPARTMENT LEADERS MAPPING
// ============================================

const DEPARTMENT_LEADERS: Record<string, { leaderId: string; leaderName: string; reportsTo: string }> = {
  'Executive': { leaderId: 'jane-bou-jaoude', leaderName: 'Jane Bou Jaoude', reportsTo: '' },
  'Sales': { leaderId: 'alexander-nasser', leaderName: 'Alexander Nasser', reportsTo: 'jane-bou-jaoude' },
  'After Sales': { leaderId: 'charles-ashford', leaderName: 'Charles Ashford', reportsTo: 'richard-pemberton' },
  'Marketing & Content': { leaderId: 'victoria-sterling', leaderName: 'Victoria Sterling', reportsTo: 'david-thornton' },
  'Client Relations': { leaderId: 'george-hamilton', leaderName: 'George Hamilton', reportsTo: 'michael-anderson' },
  'VIP Client Relations': { leaderId: 'victoria-ashworth', leaderName: 'Victoria Ashworth', reportsTo: 'richard-pemberton' },
  'Human Resources': { leaderId: 'jessica-whitmore', leaderName: 'Jessica Whitmore', reportsTo: 'richard-pemberton' },
  'Creative & Media': { leaderId: 'sophia-anderson', leaderName: 'Sophia Anderson', reportsTo: 'victoria-sterling' },
  'Finance': { leaderId: 'catherine-brooks', leaderName: 'Catherine Brooks', reportsTo: 'david-thornton' },
  'Operations': { leaderId: 'alexander-shaw', leaderName: 'Alexander Shaw', reportsTo: 'richard-pemberton' },
  'IT': { leaderId: 'daniel-parker', leaderName: 'Daniel Parker', reportsTo: 'richard-pemberton' },
  'Administration': { leaderId: 'emily-watson', leaderName: 'Emily Watson', reportsTo: 'richard-pemberton' },
  'Software Engineering': { leaderId: 'james-woodward', leaderName: 'James Woodward', reportsTo: 'richard-pemberton' },
  'Project Management': { leaderId: 'rachel-campbell', leaderName: 'Rachel Campbell', reportsTo: 'richard-pemberton' },
  'Customer Happiness': { leaderId: 'lisa-henderson', leaderName: 'Lisa Henderson', reportsTo: 'richard-pemberton' },
  'Legal': { leaderId: 'william-thornton-legal', leaderName: 'William Thornton', reportsTo: 'jane-bou-jaoude' },
};

// ============================================
// GENERATE DEPARTMENT GROUPS
// ============================================

function generateDepartmentGroups(): DepartmentGroup[] {
  const departmentTeams: Record<string, TeamMember[]> = {
    'Sales': salesTeam,
    'After Sales': afterSalesTeam,
    'Marketing & Content': [...marketingTeam, ...contentTeam],
    'Client Relations': [...clientRelationsTeam, ...vipClientRelationsTeam],
    'Human Resources': hrTeam,
    'Creative & Media': creativeTeam,
    'Finance': financeTeam,
    'Operations': operationsTeam,
    'IT': itTeam,
    'Administration': adminTeam,
    'Software Engineering': softwareEngineeringTeam,
    'Project Management': projectManagementTeam,
    'Customer Happiness': customerHappinessTeam,
    'Legal': legalTeam,
  };

  const groups: DepartmentGroup[] = [];

  Object.entries(departmentTeams).forEach(([department, members]) => {
    const leader = DEPARTMENT_LEADERS[department] || {
      leaderId: members[0]?.id || '',
      leaderName: members[0]?.name || '',
      reportsTo: 'richard-pemberton',
    };

    // Create WhatsApp group
    groups.push({
      id: `whatsapp-${department.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${department} WhatsApp`,
      department,
      type: 'whatsapp',
      members: ['jane-bou-jaoude', ...members.map(m => m.id)],
      memberDetails: members,
      leaderId: leader.leaderId,
      leaderName: leader.leaderName,
      reportsTo: leader.reportsTo,
      description: `${department} department WhatsApp group for quick communication`,
      founderAccess: true,
    });

    // Create Website Team Communication group
    groups.push({
      id: `team-${department.toLowerCase().replace(/\s+/g, '-')}`,
      name: `${department} Team`,
      department,
      type: 'website',
      members: ['jane-bou-jaoude', ...members.map(m => m.id)],
      memberDetails: members,
      leaderId: leader.leaderId,
      leaderName: leader.leaderName,
      reportsTo: leader.reportsTo,
      description: `${department} department team communication channel`,
      founderAccess: true,
    });
  });

  return groups;
}

export const DEPARTMENT_GROUPS = generateDepartmentGroups();

// ============================================
// SALES TEAM SUBDIVISION (3 Groups)
// ============================================

const salesManagers = salesTeam.filter(m =>
  m.role.toLowerCase().includes('sales manager') &&
  !m.role.toLowerCase().includes('director')
);

const salesAgents = salesTeam.filter(m => {
  const lowerRole = m.role.toLowerCase();
  return !lowerRole.includes('vice president') &&
    !lowerRole.includes('director') &&
    !lowerRole.includes('manager');
});

export interface SalesManagerGroup {
  managerId: string;
  managerName: string;
  members: TeamMember[];
  memberIds: string[];
}

export const SALES_MANAGER_GROUPS: SalesManagerGroup[] = salesManagers.map((manager, index) => {
  const startIndex = Math.floor((index * salesAgents.length) / salesManagers.length);
  const endIndex = Math.floor(((index + 1) * salesAgents.length) / salesManagers.length);
  const assignedAgents = salesAgents.slice(startIndex, endIndex);

  return {
    managerId: manager.id,
    managerName: manager.name,
    members: assignedAgents,
    memberIds: assignedAgents.map(a => a.id),
  };
});

// ============================================
// COMPLETE REPORTING HIERARCHY
// ============================================

export function buildReportingHierarchy(): ReportingNode[] {
  const nodes: ReportingNode[] = [];

  // Process all team members
  allTeamMembers.forEach(member => {
    if (member.reportsTo) {
      nodes.push({
        employeeId: member.id,
        employeeName: member.name,
        role: member.role,
        department: member.department,
        reportsTo: member.reportsTo,
        reportFrequency: 'daily',
        reportType: 'Daily Activity Report',
      });
    }
  });

  // Department heads report to Amanda Clarke (who consolidates for Founder)
  const departmentHeadIds = Object.values(DEPARTMENT_LEADERS)
    .map(l => l.leaderId)
    .filter(id => id && id !== 'jane-bou-jaoude');

  departmentHeadIds.forEach(headId => {
    const head = allTeamMembers.find(m => m.id === headId);
    if (head && head.reportsTo) {
      const reportsToMember = allTeamMembers.find(m => m.id === head.reportsTo);
      // If the head reports to someone who reports to Founder, their senior reports to Amanda
      if (reportsToMember && reportsToMember.reportsTo === 'jane-bou-jaoude') {
        nodes.push({
          employeeId: reportsToMember.id,
          employeeName: reportsToMember.name,
          role: reportsToMember.role,
          department: reportsToMember.department,
          reportsTo: 'amanda-clarke',
          reportFrequency: 'daily',
          reportType: 'Consolidated Department Report',
        });
      }
    }
  });

  // Amanda Clarke reports to Founder
  nodes.push({
    employeeId: 'amanda-clarke',
    employeeName: 'Amanda Clarke',
    role: "Executive Assistant to CEO (Founder's Admin)",
    department: 'Executive',
    reportsTo: 'jane-bou-jaoude',
    reportFrequency: 'daily',
    reportType: 'All Departments Consolidated Report',
  });

  return nodes;
}

export const REPORTING_HIERARCHY = buildReportingHierarchy();

// ============================================
// LEADERSHIP GROUP (All Department Heads)
// ============================================

export const COMPANY_LEADERSHIP_GROUP: DepartmentGroup = {
  id: 'company-leadership',
  name: 'JBJ Leadership Team',
  department: 'Leadership',
  type: 'website',
  members: [
    'jane-bou-jaoude',
    'david-thornton',
    'richard-pemberton',
    'natasha-daoud',
    'anthony-crawford',
    'amanda-clarke',
    ...Object.values(DEPARTMENT_LEADERS).map(l => l.leaderId).filter(Boolean),
  ].filter((id, index, self) => self.indexOf(id) === index), // Remove duplicates
  memberDetails: executiveTeam,
  leaderId: 'jane-bou-jaoude',
  leaderName: 'Jane Bou Jaoude',
  reportsTo: '',
  description: 'Company leadership team for strategic decisions',
  founderAccess: true,
};

// ============================================
// HELPER FUNCTIONS
// ============================================

export function getGroupsByDepartment(department: string): DepartmentGroup[] {
  return DEPARTMENT_GROUPS.filter(g => g.department === department);
}

export function getGroupsByType(type: 'whatsapp' | 'website'): DepartmentGroup[] {
  return DEPARTMENT_GROUPS.filter(g => g.type === type);
}

export function getMemberGroups(memberId: string): DepartmentGroup[] {
  return DEPARTMENT_GROUPS.filter(g => g.members.includes(memberId));
}

export function getDepartmentLeader(department: string): { leaderId: string; leaderName: string } | undefined {
  return DEPARTMENT_LEADERS[department];
}

export function getReportingChain(employeeId: string): ReportingNode[] {
  const chain: ReportingNode[] = [];
  let currentId = employeeId;

  while (currentId) {
    const node = REPORTING_HIERARCHY.find(n => n.employeeId === currentId);
    if (node) {
      chain.push(node);
      currentId = node.reportsTo;
    } else {
      break;
    }
  }

  return chain;
}

export function getDirectReportees(managerId: string): ReportingNode[] {
  return REPORTING_HIERARCHY.filter(n => n.reportsTo === managerId);
}

// ============================================
// SUMMARY EXPORT
// ============================================

export const DEPARTMENT_STRUCTURE_SUMMARY = {
  totalDepartments: Object.keys(DEPARTMENT_LEADERS).length,
  totalGroups: DEPARTMENT_GROUPS.length,
  whatsappGroups: DEPARTMENT_GROUPS.filter(g => g.type === 'whatsapp').length,
  websiteGroups: DEPARTMENT_GROUPS.filter(g => g.type === 'website').length,
  salesManagerGroups: SALES_MANAGER_GROUPS.length,
  reportingNodes: REPORTING_HIERARCHY.length,
};

console.log('Department Structure Initialized:', DEPARTMENT_STRUCTURE_SUMMARY);
