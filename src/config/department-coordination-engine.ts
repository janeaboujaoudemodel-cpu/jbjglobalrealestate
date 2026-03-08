/**
 * Department Coordination Engine - JBJ Global Real Estate
 * AI Collaboration & Department Coordination Layer
 * 
 * Enables Amanda Clarke to coordinate, delegate, monitor, and synchronize
 * workflows between all departments.
 */

import { AI_PERSONALITIES, getPersonalityById } from './ai-personalities';

// ============================================
// DEPARTMENT DEFINITIONS
// ============================================

export interface Department {
  id: string;
  name: string;
  shortName: string;
  icon: string;
  color: string;
  headId: string;
  headName: string;
  subAIId: string;
  subAIName: string;
  members: string[];
  kpis: DepartmentKPI[];
  permissions: string[];
  channels: string[];
  description: string;
}

export interface DepartmentKPI {
  id: string;
  name: string;
  target: number;
  unit: string;
  frequency: 'daily' | 'weekly' | 'monthly';
}

export interface DepartmentTask {
  id: string;
  title: string;
  description: string;
  departmentId: string;
  assignedTo: string[];
  createdBy: string;
  status: 'pending' | 'in_progress' | 'blocked' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  dependencies: string[];
  dueDate?: Date;
  completedAt?: Date;
  createdAt: Date;
  tags: string[];
  workflowStage?: string;
}

export interface DepartmentMessage {
  id: string;
  from: string;
  to: string[];
  departmentId: string;
  content: string;
  type: 'update' | 'request' | 'escalation' | 'report' | 'ai_to_ai';
  priority: 'low' | 'medium' | 'high' | 'critical';
  timestamp: Date;
  read: boolean;
  tags: string[];
}

export interface CrossDepartmentWorkflow {
  id: string;
  name: string;
  description: string;
  departments: string[];
  stages: WorkflowStage[];
  status: 'active' | 'completed' | 'paused';
  createdAt: Date;
  completedAt?: Date;
}

export interface WorkflowStage {
  id: string;
  name: string;
  departmentId: string;
  order: number;
  status: 'pending' | 'in_progress' | 'completed';
  assignedTo: string;
  dependencies: string[];
}

// ============================================
// DEPARTMENT CONFIGURATIONS
// ============================================

export const DEPARTMENTS: Record<string, Department> = {
  hr: {
    id: 'hr',
    name: 'Human Resources',
    shortName: 'HR',
    icon: 'HR',
    color: '#8B5CF6',
    headId: 'jessica',
    headName: 'Jessica',
    subAIId: 'jessica_ai',
    subAIName: 'Jessica AI',
    members: ['jessica', 'hannah'],
    kpis: [
      { id: 'cvs_processed', name: 'CVs Processed', target: 20, unit: 'applications', frequency: 'weekly' },
      { id: 'interviews_scheduled', name: 'Interviews Scheduled', target: 10, unit: 'interviews', frequency: 'weekly' },
      { id: 'onboarding_completion', name: 'Onboarding Completion Rate', target: 95, unit: '%', frequency: 'monthly' },
    ],
    permissions: ['manage_cvs', 'schedule_interviews', 'view_candidates', 'employee_records'],
    channels: ['hr-general', 'hr-recruitment', 'hr-onboarding'],
    description: 'Recruitment, employee management, training, compliance',
  },
  
  sales: {
    id: 'sales',
    name: 'Sales / Brokers',
    shortName: 'Sales',
    icon: 'SALES',
    color: '#10B981',
    headId: 'james_morgan',
    headName: 'James Morgan',
    subAIId: 'alex_ai',
    subAIName: 'Alex AI',
    members: ['james_morgan', 'maya_broker', 'alex_broker'],
    kpis: [
      { id: 'leads_converted', name: 'Leads Converted', target: 15, unit: 'deals', frequency: 'monthly' },
      { id: 'viewings_scheduled', name: 'Viewings Scheduled', target: 30, unit: 'viewings', frequency: 'weekly' },
      { id: 'response_time', name: 'Avg Response Time', target: 2, unit: 'hours', frequency: 'daily' },
    ],
    permissions: ['view_leads', 'contact_clients', 'schedule_viewings', 'manage_deals'],
    channels: ['sales-general', 'sales-leads', 'sales-closings'],
    description: 'Lead conversion, property presentations, client follow-up',
  },
  
  marketing: {
    id: 'marketing',
    name: 'Marketing',
    shortName: 'Marketing',
    icon: 'MKT',
    color: '#EC4899',
    headId: 'maya_khalid',
    headName: 'Maya Khalid',
    subAIId: 'maya_ai',
    subAIName: 'Maya AI',
    members: ['maya_khalid', 'emma_torres'],
    kpis: [
      { id: 'campaigns_launched', name: 'Campaigns Launched', target: 4, unit: 'campaigns', frequency: 'monthly' },
      { id: 'content_pieces', name: 'Content Created', target: 20, unit: 'pieces', frequency: 'weekly' },
      { id: 'engagement_rate', name: 'Engagement Rate', target: 5, unit: '%', frequency: 'weekly' },
    ],
    permissions: ['manage_campaigns', 'content_creation', 'brand_management', 'social_media'],
    channels: ['marketing-general', 'marketing-campaigns', 'marketing-content'],
    description: 'Campaigns, branding, content, design',
  },
  
  finance: {
    id: 'finance',
    name: 'Finance',
    shortName: 'Finance',
    icon: 'FIN',
    color: '#F59E0B',
    headId: 'layla_ahmed',
    headName: 'Layla Ahmed',
    subAIId: 'layla_ai',
    subAIName: 'Layla AI',
    members: ['layla_ahmed'],
    kpis: [
      { id: 'invoices_processed', name: 'Invoices Processed', target: 50, unit: 'invoices', frequency: 'weekly' },
      { id: 'commissions_paid', name: 'Commissions Paid', target: 100, unit: '%', frequency: 'monthly' },
      { id: 'budget_variance', name: 'Budget Variance', target: 5, unit: '%', frequency: 'monthly' },
    ],
    permissions: ['manage_payments', 'view_financials', 'process_commissions', 'budget_access'],
    channels: ['finance-general', 'finance-payments', 'finance-reports'],
    description: 'Payments, commission, budgeting, reports',
  },
  
  admin: {
    id: 'admin',
    name: 'Administration',
    shortName: 'Admin',
    icon: 'ADM',
    color: '#6B7280',
    headId: 'david_admin',
    headName: 'David',
    subAIId: 'david_ai',
    subAIName: 'David AI',
    members: ['daniel_brooks', 'david_admin'],
    kpis: [
      { id: 'properties_uploaded', name: 'Properties Uploaded', target: 15, unit: 'listings', frequency: 'weekly' },
      { id: 'documents_processed', name: 'Documents Processed', target: 30, unit: 'documents', frequency: 'weekly' },
      { id: 'crm_accuracy', name: 'CRM Data Accuracy', target: 98, unit: '%', frequency: 'monthly' },
    ],
    permissions: ['manage_properties', 'document_handling', 'crm_management', 'data_entry'],
    channels: ['admin-general', 'admin-listings', 'admin-documents'],
    description: 'Property listings, document handling, CRM setup',
  },
  
  it: {
    id: 'it',
    name: 'IT / Developer',
    shortName: 'IT',
    icon: 'IT',
    color: '#3B82F6',
    headId: 'christopher_adams',
    headName: 'Christopher Adams',
    subAIId: 'chris_ai',
    subAIName: 'Chris AI',
    members: ['christopher_adams'],
    kpis: [
      { id: 'uptime', name: 'System Uptime', target: 99.9, unit: '%', frequency: 'monthly' },
      { id: 'bugs_resolved', name: 'Bugs Resolved', target: 10, unit: 'issues', frequency: 'weekly' },
      { id: 'deployments', name: 'Successful Deployments', target: 4, unit: 'releases', frequency: 'monthly' },
    ],
    permissions: ['system_admin', 'code_deployment', 'automation_setup', 'website_management'],
    channels: ['it-general', 'it-bugs', 'it-deployments'],
    description: 'Website management, updates, automation support',
  },
};

// ============================================
// DEPARTMENT SUB-AI DEFINITIONS
// ============================================

export interface DepartmentSubAI {
  id: string;
  name: string;
  department: string;
  role: string;
  reportsTo: string;
  capabilities: string[];
  automations: string[];
  dailyReportTime: string;
}

export const DEPARTMENT_SUB_AIS: Record<string, DepartmentSubAI> = {
  jessica_ai: {
    id: 'jessica_ai',
    name: 'Jessica AI',
    department: 'hr',
    role: 'HR Automation Assistant',
    reportsTo: 'amanda_clarke',
    capabilities: [
      'CV screening and ranking',
      'Interview scheduling',
      'Candidate communication',
      'Onboarding automation',
      'Employee record management',
    ],
    automations: [
      'auto_cv_acknowledgement',
      'interview_reminder',
      'onboarding_checklist_generation',
    ],
    dailyReportTime: '09:00',
  },
  
  maya_ai: {
    id: 'maya_ai',
    name: 'Maya AI',
    department: 'marketing',
    role: 'Marketing Automation Assistant',
    reportsTo: 'amanda_clarke',
    capabilities: [
      'Campaign planning',
      'Content scheduling',
      'Design coordination',
      'Analytics reporting',
      'Brand guideline enforcement',
    ],
    automations: [
      'content_calendar_updates',
      'campaign_performance_alerts',
      'design_asset_requests',
    ],
    dailyReportTime: '08:30',
  },
  
  david_ai: {
    id: 'david_ai',
    name: 'David AI',
    department: 'admin',
    role: 'Admin Automation Assistant',
    reportsTo: 'amanda_clarke',
    capabilities: [
      'Property listing management',
      'Document upload and processing',
      'CRM data maintenance',
      'Access management',
    ],
    automations: [
      'property_listing_validation',
      'document_expiry_alerts',
      'crm_data_cleanup',
    ],
    dailyReportTime: '08:00',
  },
  
  layla_ai: {
    id: 'layla_ai',
    name: 'Layla AI',
    department: 'finance',
    role: 'Finance Automation Assistant',
    reportsTo: 'amanda_clarke',
    capabilities: [
      'Invoice processing',
      'Commission calculation',
      'Budget tracking',
      'Financial reporting',
    ],
    automations: [
      'commission_calculations',
      'payment_reminders',
      'budget_variance_alerts',
    ],
    dailyReportTime: '10:00',
  },
  
  chris_ai: {
    id: 'chris_ai',
    name: 'Chris AI',
    department: 'it',
    role: 'IT Automation Assistant',
    reportsTo: 'amanda_clarke',
    capabilities: [
      'System monitoring',
      'Bug tracking',
      'Deployment automation',
      'Website publishing',
    ],
    automations: [
      'uptime_monitoring',
      'deployment_notifications',
      'error_log_analysis',
    ],
    dailyReportTime: '20:00',
  },
  
  alex_ai: {
    id: 'alex_ai',
    name: 'Alex AI',
    department: 'sales',
    role: 'Sales Automation Assistant',
    reportsTo: 'amanda_clarke',
    capabilities: [
      'Lead nurturing',
      'Follow-up scheduling',
      'Property matching',
      'Client communication',
    ],
    automations: [
      'lead_follow_up_reminders',
      'property_recommendation',
      'viewing_confirmation',
    ],
    dailyReportTime: '08:00',
  },
};

// ============================================
// TASK ROUTING KEYWORDS
// ============================================

export interface TaskRoutingRule {
  keywords: string[];
  department: string;
  priority?: 'low' | 'medium' | 'high' | 'critical';
  autoAssignTo?: string;
}

export const TASK_ROUTING_RULES: TaskRoutingRule[] = [
  // HR Department
  { keywords: ['hire', 'recruitment', 'recruit', 'cv', 'resume', 'candidate', 'interview', 'onboarding', 'employee', 'staff', 'training'], department: 'hr' },
  
  // Sales Department
  { keywords: ['lead', 'client', 'deal', 'viewing', 'showing', 'property tour', 'offer', 'negotiation', 'close', 'sale', 'buyer', 'investor'], department: 'sales' },
  
  // Marketing Department
  { keywords: ['campaign', 'design', 'branding', 'content', 'social media', 'advertisement', 'ad', 'logo', 'video', 'photo', 'launch', 'promotion'], department: 'marketing' },
  
  // Finance Department
  { keywords: ['payment', 'invoice', 'commission', 'budget', 'expense', 'salary', 'payroll', 'financial', 'accounting', 'tax', 'revenue'], department: 'finance' },
  
  // Admin Department
  { keywords: ['upload', 'document', 'listing', 'property card', 'crm', 'data entry', 'file', 'record', 'update listing', 'amenities'], department: 'admin' },
  
  // IT Department
  { keywords: ['bug', 'fix', 'website', 'app', 'deploy', 'publish', 'code', 'error', 'system', 'automation', 'alignment', 'technical'], department: 'it' },
];

// ============================================
// INTELLIGENT TASK ROUTING
// ============================================

export function routeTaskToDepartment(taskDescription: string): { department: string; confidence: number; suggestions: string[] } {
  const lowerDesc = taskDescription.toLowerCase();
  const matchedDepartments: { department: string; score: number }[] = [];
  
  for (const rule of TASK_ROUTING_RULES) {
    let score = 0;
    for (const keyword of rule.keywords) {
      if (lowerDesc.includes(keyword.toLowerCase())) {
        score += keyword.split(' ').length; // Multi-word keywords get higher scores
      }
    }
    if (score > 0) {
      matchedDepartments.push({ department: rule.department, score });
    }
  }
  
  // Sort by score descending
  matchedDepartments.sort((a, b) => b.score - a.score);
  
  if (matchedDepartments.length === 0) {
    return { department: 'admin', confidence: 0.3, suggestions: ['admin', 'it'] };
  }
  
  const topMatch = matchedDepartments[0];
  const confidence = Math.min(topMatch.score / 3, 1); // Normalize to 0-1
  const suggestions = matchedDepartments.slice(0, 3).map(m => m.department);
  
  return { department: topMatch.department, confidence, suggestions };
}

// ============================================
// CROSS-DEPARTMENT WORKFLOW TEMPLATES
// ============================================

export const WORKFLOW_TEMPLATES = {
  property_listing: {
    id: 'property_listing',
    name: 'Property Listing Workflow',
    description: 'End-to-end property listing from data to publication',
    departments: ['admin', 'marketing', 'it'],
    stages: [
      { id: 'data_collection', name: 'Data Collection', departmentId: 'admin', order: 1 },
      { id: 'visual_creation', name: 'Visual Assets', departmentId: 'marketing', order: 2 },
      { id: 'publication', name: 'Website Publication', departmentId: 'it', order: 3 },
    ],
  },
  
  recruitment: {
    id: 'recruitment',
    name: 'Recruitment Workflow',
    description: 'Full recruitment cycle from CV to onboarding',
    departments: ['hr', 'finance', 'admin'],
    stages: [
      { id: 'cv_screening', name: 'CV Screening', departmentId: 'hr', order: 1 },
      { id: 'interview', name: 'Interviews', departmentId: 'hr', order: 2 },
      { id: 'salary_approval', name: 'Salary Approval', departmentId: 'finance', order: 3 },
      { id: 'access_setup', name: 'Access Setup', departmentId: 'admin', order: 4 },
      { id: 'onboarding', name: 'Onboarding', departmentId: 'hr', order: 5 },
    ],
  },
  
  campaign_launch: {
    id: 'campaign_launch',
    name: 'Campaign Launch Workflow',
    description: 'Marketing campaign creation and launch',
    departments: ['marketing', 'sales', 'it'],
    stages: [
      { id: 'concept_design', name: 'Concept & Design', departmentId: 'marketing', order: 1 },
      { id: 'sales_review', name: 'Sales Review', departmentId: 'sales', order: 2 },
      { id: 'technical_setup', name: 'Technical Setup', departmentId: 'it', order: 3 },
      { id: 'launch', name: 'Launch', departmentId: 'marketing', order: 4 },
    ],
  },
  
  deal_closing: {
    id: 'deal_closing',
    name: 'Deal Closing Workflow',
    description: 'Full deal lifecycle from offer to commission',
    departments: ['sales', 'admin', 'finance'],
    stages: [
      { id: 'negotiation', name: 'Negotiation', departmentId: 'sales', order: 1 },
      { id: 'documentation', name: 'Documentation', departmentId: 'admin', order: 2 },
      { id: 'contract_signing', name: 'Contract Signing', departmentId: 'admin', order: 3 },
      { id: 'commission_processing', name: 'Commission Processing', departmentId: 'finance', order: 4 },
    ],
  },
};

// ============================================
// CONFLICT DETECTION
// ============================================

export interface TaskConflict {
  id: string;
  taskIds: string[];
  type: 'duplicate' | 'overlap' | 'dependency_conflict';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestedResolution: string;
  detectedAt: Date;
  resolvedAt?: Date;
}

export function detectTaskConflict(
  newTask: { title: string; description: string; departmentId: string },
  existingTasks: DepartmentTask[]
): TaskConflict | null {
  const newTitle = newTask.title.toLowerCase();
  const newDesc = newTask.description.toLowerCase();
  
  for (const existing of existingTasks) {
    if (existing.status === 'completed' || existing.status === 'cancelled') continue;
    
    const existingTitle = existing.title.toLowerCase();
    const existingDesc = existing.description.toLowerCase();
    
    // Check for duplicate titles
    if (newTitle === existingTitle) {
      return {
        id: `conflict_${Date.now()}`,
        taskIds: [existing.id],
        type: 'duplicate',
        severity: 'high',
        description: `Possible duplicate task detected: "${existing.title}" already exists`,
        suggestedResolution: 'Merge with existing task or cancel one',
        detectedAt: new Date(),
      };
    }
    
    // Check for high similarity (simple word overlap check)
    const newWords = new Set(newTitle.split(' ').filter(w => w.length > 3));
    const existingWords = new Set(existingTitle.split(' ').filter(w => w.length > 3));
    const overlap = [...newWords].filter(w => existingWords.has(w)).length;
    
    if (overlap >= 3) {
      return {
        id: `conflict_${Date.now()}`,
        taskIds: [existing.id],
        type: 'overlap',
        severity: 'medium',
        description: `Similar task detected: "${existing.title}" - may cause overlap`,
        suggestedResolution: 'Review both tasks and confirm ownership',
        detectedAt: new Date(),
      };
    }
  }
  
  return null;
}

// ============================================
// DEPARTMENT COMMUNICATION
// ============================================

export function generateDepartmentMention(departmentId: string): string {
  const dept = DEPARTMENTS[departmentId];
  return dept ? `@${dept.shortName}` : `@${departmentId}`;
}

export function generateAllHeadsMention(): string {
  return '@AllHeads';
}

export function getDepartmentById(id: string): Department | undefined {
  return DEPARTMENTS[id];
}

export function getSubAIById(id: string): DepartmentSubAI | undefined {
  return DEPARTMENT_SUB_AIS[id];
}

export function getDepartmentHead(departmentId: string): string | undefined {
  return DEPARTMENTS[departmentId]?.headId;
}

// ============================================
// DAILY SUMMARY GENERATION
// ============================================

export interface DepartmentDailySummary {
  departmentId: string;
  departmentName: string;
  date: Date;
  tasksCompleted: number;
  tasksPending: number;
  tasksBlocked: number;
  escalations: number;
  highlights: string[];
  blockers: string[];
  upcomingDeadlines: string[];
}

export interface CompanyDailySummary {
  date: Date;
  generatedBy: string;
  departments: DepartmentDailySummary[];
  overallHighlights: string[];
  criticalItems: string[];
  upcomingMeetings: string[];
  teamMorale: 'low' | 'normal' | 'high';
}

export function formatCompanySummary(summary: CompanyDailySummary): string {
  const dateStr = summary.date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  
  let output = `📅 Daily Summary – ${dateStr}\n\n`;
  
  for (const dept of summary.departments) {
    const deptInfo = DEPARTMENTS[dept.departmentId];
    if (deptInfo) {
      output += `${deptInfo.icon} ${deptInfo.name}:\n`;
      for (const highlight of dept.highlights) {
        output += `  • ${highlight}\n`;
      }
      if (dept.blockers.length > 0) {
        output += `  [WARN] Blockers: ${dept.blockers.join(', ')}\n`;
      }
      output += '\n';
    }
  }
  
  if (summary.criticalItems.length > 0) {
    output += `[ALERT] Critical Items:\n`;
    for (const item of summary.criticalItems) {
      output += `  • ${item}\n`;
    }
    output += '\n';
  }
  
  output += `[STATUS] General: System running ${summary.teamMorale === 'high' ? 'excellently' : summary.teamMorale === 'normal' ? 'smoothly' : 'with some concerns'}.`;
  
  return output;
}

// ============================================
// AI-TO-AI COMMUNICATION
// ============================================

export interface AIMessage {
  id: string;
  fromAI: string;
  toAI: string;
  content: string;
  type: 'request' | 'confirmation' | 'update' | 'handoff';
  metadata?: Record<string, unknown>;
  timestamp: Date;
  acknowledged: boolean;
}

export function logAIToAICommunication(
  fromAIId: string,
  toAIId: string,
  action: string,
  details: string
): AIMessage {
  const fromAI = DEPARTMENT_SUB_AIS[fromAIId];
  const toAI = DEPARTMENT_SUB_AIS[toAIId];
  
  return {
    id: `ai_msg_${Date.now()}`,
    fromAI: fromAI?.name || fromAIId,
    toAI: toAI?.name || toAIId,
    content: `${action}: ${details}`,
    type: 'update',
    timestamp: new Date(),
    acknowledged: false,
  };
}

// ============================================
// PERMISSIONS & SECURITY
// ============================================

export function canAccessDepartmentData(
  userRole: string,
  targetDepartment: string,
  accessType: 'read' | 'write' | 'admin'
): boolean {
  // Founder and Amanda Clarke have full access
  if (userRole === 'founder' || userRole === 'amanda_clarke') {
    return true;
  }
  
  const dept = DEPARTMENTS[targetDepartment];
  if (!dept) return false;
  
  // Department heads can read/write their own department
  if (dept.headId === userRole) {
    return accessType !== 'admin';
  }
  
  // Department members can only read
  if (dept.members.includes(userRole)) {
    return accessType === 'read';
  }
  
  return false;
}

export function getVisibleDepartments(userRole: string): string[] {
  if (userRole === 'founder' || userRole === 'amanda_clarke') {
    return Object.keys(DEPARTMENTS);
  }
  
  const visible: string[] = [];
  for (const [deptId, dept] of Object.entries(DEPARTMENTS)) {
    if (dept.headId === userRole || dept.members.includes(userRole)) {
      visible.push(deptId);
    }
  }
  
  return visible;
}

// ============================================
// MEETING COORDINATION
// ============================================

export interface CrossDepartmentMeeting {
  id: string;
  title: string;
  departments: string[];
  attendees: string[];
  scheduledAt: Date;
  duration: number; // minutes
  agenda: string[];
  preparedBy: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}

export function generateMeetingAgenda(
  meetingType: string,
  departments: string[],
  relatedTasks: DepartmentTask[]
): string[] {
  const agenda: string[] = [];
  
  agenda.push('1. Roll Call & Attendance');
  
  for (const deptId of departments) {
    const dept = DEPARTMENTS[deptId];
    if (dept) {
      const deptTasks = relatedTasks.filter(t => t.departmentId === deptId);
      agenda.push(`2. ${dept.name} Update (${deptTasks.length} items)`);
    }
  }
  
  agenda.push('3. Cross-Department Dependencies');
  agenda.push('4. Blockers & Escalations');
  agenda.push('5. Action Items & Next Steps');
  agenda.push('6. Q&A');
  
  return agenda;
}
