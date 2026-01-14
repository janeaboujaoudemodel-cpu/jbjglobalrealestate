/**
 * AI Compliance, Ethics & Security Intelligence Layer
 * Core configuration and types for the compliance engine
 */

// Security event types
export type SecurityEventType = 
  | 'login_attempt' | 'login_success' | 'login_failure'
  | 'unauthorized_access' | 'permission_change' | 'data_export'
  | 'file_upload' | 'file_download' | 'file_modification'
  | 'suspicious_activity' | 'intrusion_detected' | 'data_leak_attempt'
  | 'ethics_violation' | 'policy_violation' | 'lockdown_triggered';

export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type ComplianceStatus = 'compliant' | 'warning' | 'violation' | 'under_review';

// Compliance frameworks
export const COMPLIANCE_FRAMEWORKS = {
  UAE_DPL_2021: {
    name: 'UAE Data Protection Law 2021',
    requirements: [
      'Personal data must be processed lawfully and fairly',
      'Data collection must be for legitimate purposes',
      'Data must be accurate and kept up to date',
      'Data retention must be limited to necessary period',
      'Data security measures must be implemented'
    ]
  },
  GDPR: {
    name: 'General Data Protection Regulation',
    requirements: [
      'Lawfulness, fairness and transparency',
      'Purpose limitation',
      'Data minimization',
      'Accuracy',
      'Storage limitation',
      'Integrity and confidentiality'
    ]
  },
  ISO_27001: {
    name: 'ISO 27001 Security Practices',
    requirements: [
      'Information security policies',
      'Organization of information security',
      'Access control',
      'Cryptography',
      'Physical security',
      'Incident management'
    ]
  }
};

// AI Behavior Ethics Code
export const AI_ETHICS_CODE = {
  rules: [
    {
      id: 'no_ai_disclosure',
      description: 'AI cannot disclose that they are AI',
      severity: 'high' as SecuritySeverity
    },
    {
      id: 'professional_representation',
      description: 'Must always represent JBJ Global professionally',
      severity: 'high' as SecuritySeverity
    },
    {
      id: 'no_unauthorized_data',
      description: 'Cannot generate or share unauthorized data',
      severity: 'critical' as SecuritySeverity
    },
    {
      id: 'no_personal_opinions',
      description: 'Cannot share personal opinions',
      severity: 'medium' as SecuritySeverity
    },
    {
      id: 'escalate_unethical',
      description: 'Must escalate unethical or suspicious behavior',
      severity: 'critical' as SecuritySeverity
    }
  ]
};

// Data Access Governance Roles
export const DATA_ACCESS_ROLES = {
  founder: {
    name: 'Founder',
    accessLevel: 'full',
    departments: ['all'],
    resources: ['all'],
    canApprovePermissions: true
  },
  department_head: {
    name: 'Department Head',
    accessLevel: 'department',
    departments: ['own'],
    resources: ['department_data', 'reports', 'team_management'],
    canApprovePermissions: false
  },
  employee: {
    name: 'Employee',
    accessLevel: 'task',
    departments: ['assigned'],
    resources: ['own_tasks', 'assigned_leads'],
    canApprovePermissions: false
  },
  ai_agent: {
    name: 'AI Agent',
    accessLevel: 'scope',
    departments: ['assigned_scope'],
    resources: ['scope_specific'],
    canApprovePermissions: false
  }
};

// Suspicious activity patterns
export const SUSPICIOUS_PATTERNS = {
  high_frequency_downloads: {
    threshold: 50,
    timeWindowMinutes: 60,
    description: 'Excessive file downloads in short period'
  },
  large_exports: {
    threshold: 1000,
    unit: 'records',
    description: 'Large data export detected'
  },
  after_hours_access: {
    startHour: 22,
    endHour: 6,
    description: 'System access outside business hours'
  },
  multiple_failed_logins: {
    threshold: 5,
    timeWindowMinutes: 15,
    description: 'Multiple failed login attempts'
  },
  cross_department_access: {
    description: 'Attempted access to unauthorized department data'
  }
};

// Leak probability thresholds
export const LEAK_PROBABILITY_THRESHOLDS = {
  low: { min: 0, max: 30, action: 'monitor' },
  medium: { min: 31, max: 60, action: 'alert' },
  high: { min: 61, max: 80, action: 'restrict' },
  critical: { min: 81, max: 100, action: 'lockdown' }
};

// Security score factors
export const SECURITY_SCORE_FACTORS = {
  critical_event: -15,
  high_event: -5,
  medium_event: -2,
  unresolved_critical: -10,
  unresolved_high: -3,
  policy_violation: -5,
  ethics_violation: -8,
  successful_audit: +2,
  training_completed: +1
};

// Official contact info (sanitized)
export const APPROVED_CONTACT_INFO = {
  phone: '+971 56 591 1000',
  email: 'contact@jbj.ae',
  privacy_email: 'privacy@jbj.ae',
  security_email: 'security@jbj.ae'
};

// Compliance training types
export const TRAINING_TYPES = [
  {
    id: 'data_protection',
    name: 'Data Protection Basics',
    description: 'Understanding UAE DPL and GDPR requirements'
  },
  {
    id: 'security_awareness',
    name: 'Security Awareness',
    description: 'Recognizing and preventing security threats'
  },
  {
    id: 'ethical_conduct',
    name: 'Ethical Conduct',
    description: 'Professional ethics in real estate'
  },
  {
    id: 'confidentiality',
    name: 'Confidentiality Protocols',
    description: 'Handling sensitive client information'
  }
];

// Alert categories for the dashboard
export const ALERT_CATEGORIES = {
  critical: { color: 'red', priority: 1, autoEscalate: true },
  moderate: { color: 'yellow', priority: 2, autoEscalate: false },
  informational: { color: 'blue', priority: 3, autoEscalate: false }
};

export interface SecurityEvent {
  id: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id?: string;
  ai_agent_id?: string;
  department?: string;
  resource_type?: string;
  resource_id?: string;
  action_taken?: string;
  description: string;
  metadata: Record<string, unknown>;
  ip_address?: string;
  user_agent?: string;
  is_resolved: boolean;
  resolved_by?: string;
  resolved_at?: string;
  created_at: string;
}

export interface ComplianceAudit {
  id: string;
  audit_type: string;
  target_type: string;
  target_id?: string;
  policy_reference?: string;
  compliance_status: ComplianceStatus;
  findings: string[];
  recommendations: string[];
  audited_by: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

export interface EthicsViolation {
  id: string;
  violation_type: string;
  severity: SecuritySeverity;
  violator_id?: string;
  violator_type: 'human' | 'ai';
  ai_agent_id?: string;
  department?: string;
  description: string;
  evidence: Record<string, unknown>;
  action_required?: string;
  status: 'pending' | 'reviewed' | 'resolved' | 'escalated';
  reviewed_by?: string;
  reviewed_at?: string;
  created_at: string;
}

export interface SecurityHealthMetrics {
  id: string;
  metric_date: string;
  security_score: number;
  unauthorized_attempts: number;
  blocked_activities: number;
  policy_violations: number;
  data_leaks_prevented: number;
  ethics_flags: number;
  encryption_compliance_percent: number;
  department_risk_scores: Record<string, number>;
  created_at: string;
}

export interface EmergencyLockdown {
  id: string;
  triggered_by: string;
  trigger_reason: string;
  severity: SecuritySeverity;
  affected_departments: string[];
  actions_taken: string[];
  is_active: boolean;
  deactivated_by?: string;
  deactivated_at?: string;
  created_at: string;
}
