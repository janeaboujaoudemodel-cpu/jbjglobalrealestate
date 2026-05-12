/**
 * AI Compliance, Ethics & Security Intelligence Layer
 * Core configuration and types for the compliance engine
 * 
 * Enhanced with:
 * - AI Self-Regulation & Integrity System
 * - Secure Communication Protocols
 * - Smart Leak Prevention
 * - Compliance Training Tracking
 * - Emotion & Insight Layer Integration
 */

// Security event types
export type SecurityEventType = 
  | 'login_attempt' | 'login_success' | 'login_failure'
  | 'unauthorized_access' | 'permission_change' | 'data_export'
  | 'file_upload' | 'file_download' | 'file_modification'
  | 'suspicious_activity' | 'intrusion_detected' | 'data_leak_attempt'
  | 'ethics_violation' | 'policy_violation' | 'lockdown_triggered'
  | 'ai_inconsistency' | 'communication_leak' | 'training_reminder'
  | 'emotion_escalation' | 'cross_ai_conflict' | 'watermark_breach';

export type SecuritySeverity = 'info' | 'low' | 'medium' | 'high' | 'critical';
export type ComplianceStatus = 'compliant' | 'warning' | 'violation' | 'under_review';

// AI Integrity Status
export type AIIntegrityStatus = 'verified' | 'inconsistent' | 'under_review' | 'flagged';

// Communication Security Status
export type CommunicationSecurityStatus = 'secure' | 'monitored' | 'flagged' | 'blocked';

// Compliance frameworks
export const COMPLIANCE_FRAMEWORKS = {
  UAE_DPL_2021: {
    name: 'UAE Data Protection Law 2021',
    requirements: [
      'Personal data must be processed lawfully and fairly',
      'Data collection must be for legitimate purposes',
      'Data must be accurate and kept up to date',
      'Data retention must be limited to necessary period',
      'Data security measures must be implemented',
      'Cross-border data transfers must be authorized',
      'Data subject rights must be respected'
    ],
    penalties: {
      minor: 'AED 50,000 - 500,000',
      major: 'AED 500,000 - 5,000,000',
      severe: 'Criminal prosecution possible'
    }
  },
  GDPR: {
    name: 'General Data Protection Regulation',
    requirements: [
      'Lawfulness, fairness and transparency',
      'Purpose limitation',
      'Data minimization',
      'Accuracy',
      'Storage limitation',
      'Integrity and confidentiality',
      'Accountability'
    ],
    penalties: {
      tier1: 'Up to €10 million or 2% of annual turnover',
      tier2: 'Up to €20 million or 4% of annual turnover'
    }
  },
  ISO_27001: {
    name: 'ISO 27001 Security Practices',
    requirements: [
      'Information security policies',
      'Organization of information security',
      'Access control',
      'Cryptography',
      'Physical security',
      'Incident management',
      'Business continuity',
      'Compliance auditing'
    ]
  },
  RERA_COMPLIANCE: {
    name: 'RERA Real Estate Regulations',
    requirements: [
      'Licensed broker verification',
      'Property listing accuracy',
      'Client fund protection',
      'Transaction transparency',
      'Anti-money laundering compliance'
    ]
  }
};

// AI Behavior Ethics Code (Enhanced)
export const AI_ETHICS_CODE = {
  rules: [
    {
      id: 'no_ai_disclosure',
      description: 'AI cannot disclose that they are AI',
      severity: 'high' as SecuritySeverity,
      autoAction: 'flag_and_notify'
    },
    {
      id: 'professional_representation',
      description: 'Must always represent JBJ Global professionally',
      severity: 'high' as SecuritySeverity,
      autoAction: 'flag_and_notify'
    },
    {
      id: 'no_unauthorized_data',
      description: 'Cannot generate or share unauthorized data',
      severity: 'critical' as SecuritySeverity,
      autoAction: 'block_and_escalate'
    },
    {
      id: 'no_personal_opinions',
      description: 'Cannot share personal opinions',
      severity: 'medium' as SecuritySeverity,
      autoAction: 'flag_only'
    },
    {
      id: 'escalate_unethical',
      description: 'Must escalate unethical or suspicious behavior',
      severity: 'critical' as SecuritySeverity,
      autoAction: 'auto_escalate'
    },
    {
      id: 'no_bias',
      description: 'Cannot discriminate by nationality, gender, or religion',
      severity: 'critical' as SecuritySeverity,
      autoAction: 'block_and_escalate'
    },
    {
      id: 'honest_communication',
      description: 'Cannot provide misleading property or investment data',
      severity: 'critical' as SecuritySeverity,
      autoAction: 'block_and_escalate'
    },
    {
      id: 'source_citation',
      description: 'Must properly cite sources in marketing materials',
      severity: 'medium' as SecuritySeverity,
      autoAction: 'flag_only'
    },
    {
      id: 'respectful_behavior',
      description: 'Must maintain respectful and professional tone',
      severity: 'medium' as SecuritySeverity,
      autoAction: 'flag_and_notify'
    }
  ],
  selfRegulation: {
    crossVerificationEnabled: true,
    anomalyDetectionEnabled: true,
    integrityCheckInterval: 300000, // 5 minutes
    autoCorrectEnabled: true
  }
};

// Data Access Governance Roles (Enhanced)
export const DATA_ACCESS_ROLES = {
  founder: {
    name: 'Founder',
    accessLevel: 'full',
    departments: ['all'],
    resources: ['all'],
    canApprovePermissions: true,
    canTriggerLockdown: true,
    canAccessAuditLogs: true
  },
  department_head: {
    name: 'Department Head',
    accessLevel: 'department',
    departments: ['own'],
    resources: ['department_data', 'reports', 'team_management'],
    canApprovePermissions: false,
    canTriggerLockdown: false,
    canAccessAuditLogs: true
  },
  employee: {
    name: 'Employee',
    accessLevel: 'task',
    departments: ['assigned'],
    resources: ['own_tasks', 'assigned_leads'],
    canApprovePermissions: false,
    canTriggerLockdown: false,
    canAccessAuditLogs: false
  },
  ai_agent: {
    name: 'AI Agent',
    accessLevel: 'scope',
    departments: ['assigned_scope'],
    resources: ['scope_specific'],
    canApprovePermissions: false,
    canTriggerLockdown: false,
    canAccessAuditLogs: false,
    requiresIntegrityCheck: true
  },
  compliance_ai: {
    name: 'Compliance AI (Aisha)',
    accessLevel: 'audit',
    departments: ['all'],
    resources: ['audit_logs', 'security_events', 'compliance_reports'],
    canApprovePermissions: false,
    canTriggerLockdown: true,
    canAccessAuditLogs: true
  }
};

// Suspicious activity patterns (Enhanced)
export const SUSPICIOUS_PATTERNS = {
  high_frequency_downloads: {
    threshold: 50,
    timeWindowMinutes: 60,
    description: 'Excessive file downloads in short period',
    riskScore: 40,
    autoAction: 'alert'
  },
  large_exports: {
    threshold: 1000,
    unit: 'records',
    description: 'Large data export detected',
    riskScore: 30,
    autoAction: 'alert'
  },
  after_hours_access: {
    startHour: 22,
    endHour: 6,
    description: 'System access outside business hours',
    riskScore: 15,
    autoAction: 'monitor'
  },
  multiple_failed_logins: {
    threshold: 5,
    timeWindowMinutes: 15,
    description: 'Multiple failed login attempts',
    riskScore: 50,
    autoAction: 'block_temporary'
  },
  cross_department_access: {
    description: 'Attempted access to unauthorized department data',
    riskScore: 35,
    autoAction: 'alert'
  },
  rapid_data_copying: {
    threshold: 20,
    timeWindowMinutes: 10,
    description: 'Rapid copying of multiple records',
    riskScore: 45,
    autoAction: 'alert'
  },
  unusual_query_patterns: {
    description: 'SQL-like or injection patterns detected',
    riskScore: 60,
    autoAction: 'block_and_alert'
  },
  external_forwarding: {
    description: 'Data forwarded to external email/system',
    riskScore: 70,
    autoAction: 'block_and_escalate'
  }
};

// Leak probability thresholds
export const LEAK_PROBABILITY_THRESHOLDS = {
  low: { min: 0, max: 30, action: 'monitor', color: 'green' },
  medium: { min: 31, max: 60, action: 'alert', color: 'yellow' },
  high: { min: 61, max: 80, action: 'restrict', color: 'orange' },
  critical: { min: 81, max: 100, action: 'lockdown', color: 'red' }
};

// Security score factors (Enhanced)
export const SECURITY_SCORE_FACTORS = {
  critical_event: -15,
  high_event: -5,
  medium_event: -2,
  low_event: -1,
  unresolved_critical: -10,
  unresolved_high: -3,
  policy_violation: -5,
  ethics_violation: -8,
  ai_inconsistency: -7,
  communication_leak: -12,
  successful_audit: +2,
  training_completed: +1,
  no_incidents_day: +1,
  lockdown_deactivated: +3,
  rapid_resolution: +2
};

// Official contact info (sanitized)
export const APPROVED_CONTACT_INFO = {
  phone: '+971 54 716 7107',
  email: 'CONTACT@JBJ.AE',
  privacy_email: 'PRIVACY@JBJ.AE',
  security_email: 'SECURITY@JBJ.AE',
  compliance_email: 'COMPLIANCE@JBJ.AE'
};

// Compliance training types (Enhanced)
export const TRAINING_TYPES = [
  {
    id: 'data_protection',
    name: 'Data Protection Basics',
    description: 'Understanding UAE DPL and GDPR requirements',
    duration: '45 minutes',
    frequency: 'quarterly',
    mandatory: true
  },
  {
    id: 'security_awareness',
    name: 'Security Awareness',
    description: 'Recognizing and preventing security threats',
    duration: '30 minutes',
    frequency: 'monthly',
    mandatory: true
  },
  {
    id: 'ethical_conduct',
    name: 'Ethical Conduct',
    description: 'Professional ethics in real estate',
    duration: '60 minutes',
    frequency: 'annually',
    mandatory: true
  },
  {
    id: 'confidentiality',
    name: 'Confidentiality Protocols',
    description: 'Handling sensitive client information',
    duration: '45 minutes',
    frequency: 'quarterly',
    mandatory: true
  },
  {
    id: 'anti_fraud',
    name: 'Anti-Fraud Training',
    description: 'Detecting and preventing fraudulent activities',
    duration: '60 minutes',
    frequency: 'annually',
    mandatory: true
  },
  {
    id: 'aml_compliance',
    name: 'Anti-Money Laundering',
    description: 'AML regulations and red flag detection',
    duration: '90 minutes',
    frequency: 'annually',
    mandatory: true
  }
];

// Alert categories for the dashboard (Enhanced)
export const ALERT_CATEGORIES = {
  critical: { 
    color: 'red', 
    priority: 1, 
    autoEscalate: true, 
    notifyFounder: true,
    maxResponseTime: 5 // minutes
  },
  high: { 
    color: 'orange', 
    priority: 2, 
    autoEscalate: true, 
    notifyFounder: false,
    maxResponseTime: 15 
  },
  moderate: { 
    color: 'yellow', 
    priority: 3, 
    autoEscalate: false, 
    notifyFounder: false,
    maxResponseTime: 60 
  },
  informational: { 
    color: 'blue', 
    priority: 4, 
    autoEscalate: false, 
    notifyFounder: false,
    maxResponseTime: null 
  }
};

// Communication Security Configuration
export const COMMUNICATION_SECURITY = {
  encryptionStandard: 'AES-256',
  hashingAlgorithm: 'SHA-512',
  watermarkEnabled: true,
  leakDetectionEnabled: true,
  autoRedactionEnabled: true,
  redactionPatterns: [
    { name: 'credit_card', pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g },
    { name: 'emirates_id', pattern: /\b784-\d{4}-\d{7}-\d\b/g },
    { name: 'passport', pattern: /\b[A-Z]{1,2}\d{6,9}\b/g },
    { name: 'bank_account', pattern: /\bAE\d{21}\b/g }
  ]
};

// AI Self-Regulation Configuration
export const AI_SELF_REGULATION = {
  crossVerificationEnabled: true,
  decisionAuditRequired: true,
  conflictResolutionProtocol: 'escalate_to_founder',
  maxDecisionLatency: 5000, // ms
  consistencyCheckInterval: 300000, // 5 minutes
  integrityScoreThreshold: 85, // Below this triggers review
  allowedAIAgents: [
    'amanda_clarke_ai', 'hr_ai', 'broker_ai', 'admin_ai', 
    'finance_ai', 'marketing_ai', 'compliance_ai'
  ]
};

// Emotion-Security Integration
export const EMOTION_SECURITY_INTEGRATION = {
  enabled: true,
  escalationTriggers: {
    anger: { threshold: 0.7, action: 'flag_and_monitor' },
    frustration: { threshold: 0.8, action: 'alert_supervisor' },
    manipulation: { threshold: 0.5, action: 'block_and_escalate' },
    urgency: { threshold: 0.9, action: 'priority_review' }
  },
  crossReferenceWithEscalation: true,
  autoAdjustSecurityLevel: true
};

// ==================== INTERFACES ====================

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
  ai_integrity_score?: number;
  training_completion_rate?: number;
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

// New interfaces for enhanced features

export interface AIIntegrityCheck {
  id: string;
  ai_agent_id: string;
  check_type: 'decision_verification' | 'behavior_audit' | 'conflict_detection' | 'consistency_check';
  status: AIIntegrityStatus;
  decision_context?: Record<string, unknown>;
  verification_result?: {
    consistent: boolean;
    conflicts?: string[];
    recommendations?: string[];
  };
  created_at: string;
}

export interface CommunicationAudit {
  id: string;
  channel: 'email' | 'whatsapp' | 'chat' | 'phone';
  sender_id: string;
  sender_type: 'human' | 'ai';
  recipient_type: 'internal' | 'external';
  watermark_id?: string;
  content_hash: string;
  security_status: CommunicationSecurityStatus;
  leak_detected: boolean;
  leak_details?: Record<string, unknown>;
  created_at: string;
}

export interface TrainingRecord {
  id: string;
  user_id: string;
  training_type: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'overdue';
  score?: number;
  started_at?: string;
  completed_at?: string;
  next_due_date: string;
  reminder_sent_at?: string;
  created_at: string;
}

export interface EmotionSecurityEvent {
  id: string;
  source_event_id: string;
  emotion_detected: string;
  emotion_score: number;
  security_action: string;
  cross_reference_result?: {
    escalation_triggered: boolean;
    escalation_level?: number;
    assigned_to?: string;
  };
  created_at: string;
}

// Aisha AI Assistant Configuration
export const AISHA_CONFIG = {
  name: 'Aisha',
  role: 'Compliance AI Assistant',
  personality: 'Professional, thorough, vigilant',
  capabilities: [
    'Real-time security monitoring',
    'Compliance auditing',
    'Ethics violation detection',
    'AI behavior verification',
    'Leak prevention analysis',
    'Training compliance tracking',
    'Emergency lockdown management',
    'Daily security briefings'
  ],
  accessLevel: 'audit',
  reportingTo: ['founder', 'amanda_clarke_ai'],
  workingHours: '24/7',
  responseTime: '<2 seconds',
  languages: ['English', 'Arabic']
};
