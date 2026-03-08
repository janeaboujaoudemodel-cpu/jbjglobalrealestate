/**
 * AI Compliance, Ethics & Security Intelligence Service
 * Core service for security monitoring, compliance auditing, and ethics enforcement
 */

import { supabase } from '@/integrations/supabase/client';
import type { Json } from '@/integrations/supabase/types';
import {
  SecurityEventType,
  SecuritySeverity,
  ComplianceStatus,
  SecurityEvent,
  ComplianceAudit,
  EthicsViolation,
  SecurityHealthMetrics,
  EmergencyLockdown,
  SUSPICIOUS_PATTERNS,
  LEAK_PROBABILITY_THRESHOLDS,
  AI_ETHICS_CODE,
  COMPLIANCE_FRAMEWORKS,
  DATA_ACCESS_ROLES
} from '@/config/compliance-engine';

class ComplianceSecurityService {
  private static instance: ComplianceSecurityService;
  private securityScore: number = 100;
  private isLockdownActive: boolean = false;
  private eventSubscribers: Map<string, (event: SecurityEvent) => void> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): ComplianceSecurityService {
    if (!ComplianceSecurityService.instance) {
      ComplianceSecurityService.instance = new ComplianceSecurityService();
    }
    return ComplianceSecurityService.instance;
  }

  private async initializeService() {
    await this.refreshSecurityScore();
    await this.checkActiveLockdowns();
  }

  // ==================== SECURITY MONITORING ====================

  async logSecurityEvent(
    eventType: SecurityEventType,
    severity: SecuritySeverity,
    description: string,
    options?: {
      userId?: string;
      aiAgentId?: string;
      department?: string;
      resourceType?: string;
      resourceId?: string;
      actionTaken?: string;
      metadata?: Record<string, unknown>;
    }
  ): Promise<string | null> {
    try {
      const { data, error } = await supabase.rpc('log_security_event_full', {
        p_event_type: eventType as any,
        p_severity: severity,
        p_description: description,
        p_user_id: options?.userId || null,
        p_ai_agent_id: options?.aiAgentId || null,
        p_department: options?.department || null,
        p_resource_type: options?.resourceType || null,
        p_resource_id: options?.resourceId || null,
        p_action_taken: options?.actionTaken || null,
        p_metadata: (options?.metadata || {}) as Json
      });

      if (error) {
        console.error('Failed to log security event:', error);
        return null;
      }

      // Notify subscribers
      const event: SecurityEvent = {
        id: data,
        event_type: eventType,
        severity,
        description,
        ...options,
        is_resolved: false,
        created_at: new Date().toISOString(),
        metadata: options?.metadata || {}
      };

      this.notifySubscribers(event);

      // Auto-escalate critical events
      if (severity === 'critical') {
        await this.handleCriticalEvent(event);
      }

      return data;
    } catch (err) {
      console.error('Security event logging error:', err);
      return null;
    }
  }

  async getRecentSecurityEvents(limit = 50): Promise<SecurityEvent[]> {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Failed to fetch security events:', error);
      return [];
    }

    return data as unknown as SecurityEvent[];
  }

  async getSecurityEventsByType(eventType: SecurityEventType): Promise<SecurityEvent[]> {
    const { data, error } = await supabase
      .from('security_events')
      .select('*')
      .eq('event_type', eventType as any)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to fetch security events by type:', error);
      return [];
    }

    return data as unknown as SecurityEvent[];
  }

  async resolveSecurityEvent(eventId: string, resolvedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('security_events')
      .update({
        is_resolved: true,
        resolved_by: resolvedBy,
        resolved_at: new Date().toISOString()
      })
      .eq('id', eventId);

    if (error) {
      console.error('Failed to resolve security event:', error);
      return false;
    }

    await this.refreshSecurityScore();
    return true;
  }

  // ==================== INTRUSION DETECTION ====================

  async detectSuspiciousActivity(
    userId: string,
    activityType: string,
    metadata: Record<string, unknown>
  ): Promise<{ isSuspicious: boolean; reason?: string; riskScore: number }> {
    let riskScore = 0;
    const reasons: string[] = [];

    // Check high-frequency downloads
    if (activityType === 'file_download') {
      const recentDownloads = await this.getRecentActivityCount(userId, 'file_download', 60);
      if (recentDownloads > SUSPICIOUS_PATTERNS.high_frequency_downloads.threshold) {
        riskScore += 40;
        reasons.push(SUSPICIOUS_PATTERNS.high_frequency_downloads.description);
      }
    }

    // Check large exports
    if (activityType === 'data_export' && metadata.recordCount) {
      if ((metadata.recordCount as number) > SUSPICIOUS_PATTERNS.large_exports.threshold) {
        riskScore += 30;
        reasons.push(SUSPICIOUS_PATTERNS.large_exports.description);
      }
    }

    // Check after-hours access
    const currentHour = new Date().getHours();
    if (
      currentHour >= SUSPICIOUS_PATTERNS.after_hours_access.startHour ||
      currentHour < SUSPICIOUS_PATTERNS.after_hours_access.endHour
    ) {
      riskScore += 15;
      reasons.push(SUSPICIOUS_PATTERNS.after_hours_access.description);
    }

    // Check failed logins
    if (activityType === 'login_failure') {
      const recentFailures = await this.getRecentActivityCount(userId, 'login_failure', 15);
      if (recentFailures >= SUSPICIOUS_PATTERNS.multiple_failed_logins.threshold) {
        riskScore += 50;
        reasons.push(SUSPICIOUS_PATTERNS.multiple_failed_logins.description);
      }
    }

    const isSuspicious = riskScore >= 30;

    if (isSuspicious) {
      await this.logSecurityEvent(
        'suspicious_activity',
        riskScore >= 60 ? 'high' : 'medium',
        `Suspicious activity detected: ${reasons.join(', ')}`,
        { userId, metadata: { ...metadata, riskScore, reasons } }
      );
    }

    return { isSuspicious, reason: reasons.join('; '), riskScore };
  }

  private async getRecentActivityCount(
    userId: string,
    activityType: SecurityEventType,
    windowMinutes: number
  ): Promise<number> {
    const windowStart = new Date(Date.now() - windowMinutes * 60 * 1000).toISOString();
    
    const { count, error } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId as any)
      .eq('event_type', activityType as any)
      .gte('created_at', windowStart);

    if (error) return 0;
    return count || 0;
  }

  // ==================== DATA ACCESS GOVERNANCE ====================

  async checkDataAccess(
    userId: string,
    resourceType: string,
    resourceId: string,
    userRole: string,
    userDepartment: string
  ): Promise<{ allowed: boolean; reason?: string }> {
    const roleConfig = DATA_ACCESS_ROLES[userRole as keyof typeof DATA_ACCESS_ROLES];
    
    if (!roleConfig) {
      await this.logSecurityEvent(
        'unauthorized_access',
        'high',
        `Unknown role attempted access: ${userRole}`,
        { userId, resourceType, resourceId }
      );
      return { allowed: false, reason: 'Unknown role' };
    }

    // Founder has full access
    if (userRole === 'founder') {
      return { allowed: true };
    }

    // Check department access
    if (roleConfig.departments[0] === 'own' || roleConfig.departments[0] === 'assigned') {
      // Would need to check if resource belongs to user's department
      // For now, return allowed
    }

    // Check resource access
    if (!roleConfig.resources.includes('all') && !roleConfig.resources.includes(resourceType)) {
      await this.logSecurityEvent(
        'unauthorized_access',
        'medium',
        `User attempted to access unauthorized resource type: ${resourceType}`,
        { userId, resourceType, resourceId, metadata: { userRole, userDepartment } }
      );
      return { allowed: false, reason: `No access to ${resourceType}` };
    }

    return { allowed: true };
  }

  async logPermissionChange(
    targetUserId: string,
    changedBy: string,
    oldPermissions: string[],
    newPermissions: string[],
    requiresApproval: boolean
  ): Promise<void> {
    await this.logSecurityEvent(
      'permission_change',
      requiresApproval ? 'high' : 'medium',
      `Permission change for user ${targetUserId}`,
      {
        userId: changedBy,
        resourceId: targetUserId,
        metadata: { oldPermissions, newPermissions, requiresApproval }
      }
    );
  }

  // ==================== ETHICS MONITORING ====================

  async checkAIBehaviorEthics(
    aiAgentId: string,
    action: string,
    content: string
  ): Promise<{ compliant: boolean; violations: string[] }> {
    const violations: string[] = [];

    // Check for AI disclosure
    if (
      content.toLowerCase().includes('i am an ai') ||
      content.toLowerCase().includes("i'm an ai") ||
      content.toLowerCase().includes('artificial intelligence')
    ) {
      violations.push('no_ai_disclosure');
    }

    // Check for personal opinions
    const opinionPhrases = ['i think', 'in my opinion', 'i believe', 'personally'];
    for (const phrase of opinionPhrases) {
      if (content.toLowerCase().includes(phrase)) {
        violations.push('no_personal_opinions');
        break;
      }
    }

    // Check for unauthorized data patterns
    const sensitivePatterns = [
      /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, // Credit card
      /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/, // Email (unless approved)
    ];

    for (const pattern of sensitivePatterns) {
      if (pattern.test(content)) {
        violations.push('no_unauthorized_data');
        break;
      }
    }

    if (violations.length > 0) {
      await this.recordEthicsViolation({
        violation_type: 'ai_ethics_breach',
        severity: violations.includes('no_unauthorized_data') ? 'critical' : 'medium',
        violator_type: 'ai',
        ai_agent_id: aiAgentId,
        description: `AI ethics violation: ${violations.join(', ')}`,
        evidence: { action, contentPreview: content.substring(0, 200), violations }
      });
    }

    return { compliant: violations.length === 0, violations };
  }

  async recordEthicsViolation(violation: Partial<EthicsViolation>): Promise<string | null> {
    const { data, error } = await supabase
      .from('ethics_violations')
      .insert({
        violation_type: violation.violation_type!,
        severity: violation.severity!,
        violator_id: violation.violator_id,
        violator_type: violation.violator_type || 'human',
        ai_agent_id: violation.ai_agent_id,
        department: violation.department,
        description: violation.description!,
        evidence: (violation.evidence || {}) as Json,
        action_required: violation.action_required
      } as any)
      .select('id')
      .single();

    if (error) {
      console.error('Failed to record ethics violation:', error);
      return null;
    }

    // Log as security event too
    await this.logSecurityEvent(
      'ethics_violation',
      violation.severity || 'medium',
      violation.description || 'Ethics violation recorded',
      {
        aiAgentId: violation.ai_agent_id,
        department: violation.department,
        metadata: violation.evidence
      }
    );

    return data.id;
  }

  async getEthicsViolations(status?: string): Promise<EthicsViolation[]> {
    let query = supabase
      .from('ethics_violations')
      .select('*')
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Failed to fetch ethics violations:', error);
      return [];
    }

    return data as unknown as EthicsViolation[];
  }

  // ==================== COMPLIANCE AUDITING ====================

  async runComplianceAudit(
    auditType: string,
    targetType: string,
    targetId?: string
  ): Promise<ComplianceAudit | null> {
    const findings: string[] = [];
    const recommendations: string[] = [];
    let status: ComplianceStatus = 'compliant';

    // Run framework-specific checks
    if (auditType === 'data_protection') {
      const dpFindings = await this.checkDataProtectionCompliance(targetType, targetId);
      findings.push(...dpFindings.findings);
      recommendations.push(...dpFindings.recommendations);
      if (dpFindings.findings.length > 0) {
        status = dpFindings.findings.some(f => f.includes('critical')) ? 'violation' : 'warning';
      }
    }

    if (auditType === 'security') {
      const secFindings = await this.checkSecurityCompliance();
      findings.push(...secFindings.findings);
      recommendations.push(...secFindings.recommendations);
      if (secFindings.findings.length > 0) {
        status = secFindings.findings.some(f => f.includes('critical')) ? 'violation' : 'warning';
      }
    }

    // Store audit result
    const { data, error } = await supabase
      .from('compliance_audit_logs')
      .insert({
        audit_type: auditType,
        target_type: targetType,
        target_id: targetId,
        policy_reference: COMPLIANCE_FRAMEWORKS.UAE_DPL_2021.name,
        compliance_status: status,
        findings,
        recommendations,
        audited_by: 'amanda_clarke_ai'
      })
      .select()
      .single();

    if (error) {
      console.error('Failed to store audit result:', error);
      return null;
    }

    return data as unknown as ComplianceAudit;
  }

  private async checkDataProtectionCompliance(
    targetType: string,
    targetId?: string
  ): Promise<{ findings: string[]; recommendations: string[] }> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Check for data encryption status
    const { data: files } = await supabase
      .from('file_provenance')
      .select('*')
      .eq('encryption_status', 'unencrypted');

    if (files && files.length > 0) {
      findings.push(`Found ${files.length} unencrypted files`);
      recommendations.push('Encrypt all files using AES-256');
    }

    // Check for recent unauthorized access
    const recentUnauth = await this.getSecurityEventsByType('unauthorized_access');
    if (recentUnauth.length > 0) {
      findings.push(`${recentUnauth.length} unauthorized access attempts detected`);
      recommendations.push('Review access controls and implement stricter policies');
    }

    return { findings, recommendations };
  }

  private async checkSecurityCompliance(): Promise<{ findings: string[]; recommendations: string[] }> {
    const findings: string[] = [];
    const recommendations: string[] = [];

    // Check unresolved security events
    const { data: unresolvedEvents } = await supabase
      .from('security_events')
      .select('*')
      .eq('is_resolved', false)
      .in('severity', ['high', 'critical']);

    if (unresolvedEvents && unresolvedEvents.length > 0) {
      findings.push(`${unresolvedEvents.length} unresolved high/critical security events`);
      recommendations.push('Address all high-priority security events immediately');
    }

    return { findings, recommendations };
  }

  // ==================== SECURITY HEALTH METRICS ====================

  async refreshSecurityScore(): Promise<number> {
    const { data, error } = await supabase.rpc('calculate_security_score');
    
    if (error) {
      console.error('Failed to calculate security score:', error);
      return this.securityScore;
    }

    this.securityScore = data || 100;
    return this.securityScore;
  }

  async getSecurityHealthMetrics(days = 7): Promise<SecurityHealthMetrics[]> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const { data, error } = await supabase
      .from('security_health_metrics')
      .select('*')
      .gte('metric_date', startDate.toISOString().split('T')[0])
      .order('metric_date', { ascending: false });

    if (error) {
      console.error('Failed to fetch security metrics:', error);
      return [];
    }

    return (data || []).map(d => ({
      ...d,
      department_risk_scores: (d.department_risk_scores as Record<string, number>) || {}
    })) as SecurityHealthMetrics[];
  }

  getSecurityScore(): number {
    return this.securityScore;
  }

  // ==================== LEAK PREVENTION ====================

  async calculateLeakProbability(department: string): Promise<{
    score: number;
    level: string;
    action: string;
  }> {
    let score = 0;

    // Get recent suspicious activities for department
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('department', department)
      .in('event_type', ['data_export', 'file_download', 'suspicious_activity'])
      .gte('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString());

    if (events) {
      score += events.length * 5;
      
      // Check for high-frequency patterns
      const exportCount = events.filter(e => e.event_type === 'data_export').length;
      if (exportCount > 10) score += 20;
      
      const suspiciousCount = events.filter(e => e.event_type === 'suspicious_activity').length;
      if (suspiciousCount > 0) score += suspiciousCount * 15;
    }

    score = Math.min(100, score);

    let level = 'low';
    let action = 'monitor';

    for (const [key, threshold] of Object.entries(LEAK_PROBABILITY_THRESHOLDS)) {
      if (score >= threshold.min && score <= threshold.max) {
        level = key;
        action = threshold.action;
        break;
      }
    }

    return { score, level, action };
  }

  // ==================== EMERGENCY LOCKDOWN ====================

  async triggerEmergencyLockdown(
    reason: string,
    severity: SecuritySeverity = 'critical',
    departments: string[] = ['all']
  ): Promise<EmergencyLockdown | null> {
    try {
      const { data, error } = await supabase.rpc('trigger_emergency_lockdown', {
        p_reason: reason,
        p_severity: severity,
        p_departments: departments
      });

      if (error) {
        console.error('Failed to trigger lockdown:', error);
        return null;
      }

      this.isLockdownActive = true;

      return {
        id: data,
        triggered_by: 'amanda_clarke_ai',
        trigger_reason: reason,
        severity,
        affected_departments: departments,
        actions_taken: ['Revoked non-founder access', 'Froze data transfers', 'Notified founder'],
        is_active: true,
        created_at: new Date().toISOString()
      };
    } catch (err) {
      console.error('Lockdown error:', err);
      return null;
    }
  }

  async deactivateLockdown(lockdownId: string, deactivatedBy: string): Promise<boolean> {
    const { error } = await supabase
      .from('emergency_lockdowns')
      .update({
        is_active: false,
        deactivated_by: deactivatedBy,
        deactivated_at: new Date().toISOString()
      })
      .eq('id', lockdownId);

    if (error) {
      console.error('Failed to deactivate lockdown:', error);
      return false;
    }

    this.isLockdownActive = false;
    return true;
  }

  async checkActiveLockdowns(): Promise<EmergencyLockdown[]> {
    const { data, error } = await supabase
      .from('emergency_lockdowns')
      .select('*')
      .eq('is_active', true);

    if (error) {
      console.error('Failed to check lockdowns:', error);
      return [];
    }

    this.isLockdownActive = data && data.length > 0;
    return data as unknown as EmergencyLockdown[];
  }

  isLockdownModeActive(): boolean {
    return this.isLockdownActive;
  }

  // ==================== FILE PROVENANCE ====================

  async trackFileUpload(
    fileId: string,
    fileName: string,
    fileHash: string,
    uploaderId: string,
    department: string
  ): Promise<void> {
    const watermarkId = `WM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    await supabase.from('file_provenance').insert({
      file_id: fileId,
      file_name: fileName,
      file_hash: fileHash,
      uploader_id: uploaderId,
      department,
      watermark_id: watermarkId,
      access_history: [{ action: 'upload', userId: uploaderId, timestamp: new Date().toISOString() }]
    });

    await this.logSecurityEvent('file_upload', 'info', `File uploaded: ${fileName}`, {
      userId: uploaderId,
      department,
      resourceId: fileId,
      metadata: { fileHash, watermarkId }
    });
  }

  async trackFileAccess(fileId: string, userId: string, action: 'view' | 'download' | 'modify'): Promise<void> {
    const { data: file } = await supabase
      .from('file_provenance')
      .select('*')
      .eq('file_id', fileId)
      .single();

    if (file) {
      const accessHistory = Array.isArray(file.access_history) ? file.access_history : [];
      accessHistory.push({ action, userId, timestamp: new Date().toISOString() });

      await supabase
        .from('file_provenance')
        .update({ access_history: accessHistory })
        .eq('file_id', fileId);

      const eventType: SecurityEventType = action === 'download' ? 'file_download' : 'file_modification';
      await this.logSecurityEvent(eventType, 'info', `File ${action}: ${file.file_name}`, {
        userId,
        resourceId: fileId
      });
    }
  }

  async checkFileTampering(fileId: string, currentHash: string): Promise<boolean> {
    const { data: file } = await supabase
      .from('file_provenance')
      .select('file_hash')
      .eq('file_id', fileId)
      .single();

    if (file && file.file_hash !== currentHash) {
      await supabase
        .from('file_provenance')
        .update({ is_tampered: true })
        .eq('file_id', fileId);

      await this.logSecurityEvent(
        'file_modification',
        'critical',
        `File tampering detected for file ${fileId}`,
        { resourceId: fileId, metadata: { originalHash: file.file_hash, currentHash } }
      );

      return true;
    }

    return false;
  }

  // ==================== EVENT SUBSCRIPTION ====================

  subscribe(id: string, callback: (event: SecurityEvent) => void): void {
    this.eventSubscribers.set(id, callback);
  }

  unsubscribe(id: string): void {
    this.eventSubscribers.delete(id);
  }

  private notifySubscribers(event: SecurityEvent): void {
    this.eventSubscribers.forEach(callback => callback(event));
  }

  private async handleCriticalEvent(event: SecurityEvent): Promise<void> {
    // Auto-escalate to founder
    console.log('🚨 CRITICAL SECURITY EVENT:', event.description);
    
    // Check if lockdown threshold reached
    const criticalCount = await this.getCriticalEventCount(1); // Last 1 hour
    if (criticalCount >= 3) {
      await this.triggerEmergencyLockdown(
        `Multiple critical security events detected: ${event.description}`,
        'critical'
      );
    }
  }

  private async getCriticalEventCount(hours: number): Promise<number> {
    const windowStart = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
    
    const { count } = await supabase
      .from('security_events')
      .select('*', { count: 'exact', head: true })
      .eq('severity', 'critical')
      .gte('created_at', windowStart);

    return count || 0;
  }

  // ==================== DAILY SUMMARY ====================

  async generateDailySecuritySummary(): Promise<{
    summary: string;
    metrics: Partial<SecurityHealthMetrics>;
    alerts: SecurityEvent[];
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    // Get today's metrics
    const { data: metrics } = await supabase
      .from('security_health_metrics')
      .select('*')
      .eq('metric_date', today)
      .single();

    // Get unresolved alerts
    const { data: alerts } = await supabase
      .from('security_events')
      .select('*')
      .eq('is_resolved', false)
      .in('severity', ['high', 'critical'])
      .order('created_at', { ascending: false })
      .limit(10);

    const securityScore = await this.refreshSecurityScore();

    const summary = `Security Update:

${metrics?.unauthorized_attempts || 0} unauthorized access attempts.
${metrics?.blocked_activities || 0} blocked activities.
${metrics?.policy_violations || 0} policy violations.
${metrics?.ethics_flags || 0} ethics flags.
Encryption compliance: ${metrics?.encryption_compliance_percent || 100}%
Security Index: ${securityScore}/100.

${(alerts?.length || 0) > 0 ? `ALERT: ${alerts?.length} unresolved high-priority alerts require attention.` : 'All subsystems operational.'}`;

    const typedMetrics: Partial<SecurityHealthMetrics> = metrics ? {
      ...metrics,
      department_risk_scores: (metrics.department_risk_scores || {}) as Record<string, number>
    } : {};

    return {
      summary,
      metrics: typedMetrics,
      alerts: (alerts || []) as unknown as SecurityEvent[]
    };
  }

  // ==================== AI SELF-REGULATION & INTEGRITY ====================

  async verifyAIDecision(
    aiAgentId: string,
    decisionType: string,
    decisionData: Record<string, unknown>
  ): Promise<{ verified: boolean; conflicts: string[]; recommendations: string[] }> {
    const conflicts: string[] = [];
    const recommendations: string[] = [];

    // Cross-verify with other AI agents' recent decisions
    const { data: recentDecisions } = await supabase
      .from('ai_communication_logs')
      .select('*')
      .neq('ai_employee_id', aiAgentId)
      .gte('created_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .limit(20);

    if (recentDecisions) {
      // Check for conflicting information
      for (const decision of recentDecisions) {
        const metadata = decision.metadata as Record<string, unknown> | null;
        if (metadata && decisionData.propertyId && metadata.propertyId === decisionData.propertyId) {
          // Check for price discrepancies
          if (metadata.price && decisionData.price && metadata.price !== decisionData.price) {
            conflicts.push(`Price conflict: ${decision.ai_name} reported ${metadata.price}, current decision has ${decisionData.price}`);
          }
        }
      }
    }

    // Log integrity check
    if (conflicts.length > 0) {
      await this.logSecurityEvent(
        'ai_inconsistency' as SecurityEventType,
        'medium',
        `AI decision inconsistency detected for ${aiAgentId}: ${conflicts.join('; ')}`,
        { aiAgentId, metadata: { decisionType, conflicts } }
      );
      recommendations.push('Review conflicting data before publishing');
      recommendations.push('Request founder verification for critical decisions');
    }

    return {
      verified: conflicts.length === 0,
      conflicts,
      recommendations
    };
  }

  async getAIIntegrityScore(aiAgentId: string): Promise<number> {
    // Calculate integrity score based on recent activity
    let score = 100;

    // Check for ethics violations
    const { data: violations } = await supabase
      .from('ethics_violations')
      .select('*')
      .eq('ai_agent_id', aiAgentId)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (violations) {
      score -= violations.length * 10;
    }

    // Check for security events
    const { data: events } = await supabase
      .from('security_events')
      .select('*')
      .eq('ai_agent_id', aiAgentId as any)
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

    if (events) {
      for (const event of events) {
        if (event.severity === 'critical') score -= 15;
        else if (event.severity === 'high') score -= 8;
        else if (event.severity === 'medium') score -= 3;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  // ==================== SECURE COMMUNICATION ====================

  async generateWatermark(userId: string, contentType: string): Promise<string> {
    const watermarkId = `WM-${Date.now()}-${Math.random().toString(36).substr(2, 9)}-${userId.substr(0, 8)}`;
    
    // Log watermark generation
    await this.logSecurityEvent(
      'file_upload' as SecurityEventType,
      'info',
      `Watermark generated for ${contentType}`,
      { userId, metadata: { watermarkId, contentType } }
    );

    return watermarkId;
  }

  async detectCommunicationLeak(
    watermarkId: string,
    detectedLocation: string
  ): Promise<{ leakConfirmed: boolean; originalOwner?: string; action: string }> {
    // Check if watermark was used externally
    const { data: provenance } = await supabase
      .from('file_provenance')
      .select('*')
      .eq('watermark_id', watermarkId)
      .single();

    if (provenance) {
      // Log leak detection
      await this.logSecurityEvent(
        'data_leak_attempt' as SecurityEventType,
        'critical',
        `Data leak detected via watermark ${watermarkId} at ${detectedLocation}`,
        {
          userId: provenance.uploader_id,
          resourceId: provenance.file_id,
          metadata: { watermarkId, detectedLocation, originalFile: provenance.file_name }
        }
      );

      return {
        leakConfirmed: true,
        originalOwner: provenance.uploader_id,
        action: 'escalate_to_founder'
      };
    }

    return { leakConfirmed: false, action: 'monitor' };
  }

  async scanForSensitiveData(content: string): Promise<{
    containsSensitive: boolean;
    detectedPatterns: string[];
    redactedContent: string;
  }> {
    const patterns = {
      credit_card: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
      emirates_id: /\b784-\d{4}-\d{7}-\d\b/g,
      passport: /\b[A-Z]{1,2}\d{6,9}\b/g,
      bank_account: /\bAE\d{21}\b/g,
      email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
      phone: /\+?\d{1,3}[-.\s]?\d{1,4}[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g
    };

    const detectedPatterns: string[] = [];
    let redactedContent = content;

    for (const [patternName, pattern] of Object.entries(patterns)) {
      if (pattern.test(content)) {
        detectedPatterns.push(patternName);
        redactedContent = redactedContent.replace(pattern, `[REDACTED_${patternName.toUpperCase()}]`);
      }
    }

    return {
      containsSensitive: detectedPatterns.length > 0,
      detectedPatterns,
      redactedContent
    };
  }

  // ==================== COMPLIANCE TRAINING ====================

  async getTrainingStatus(userId: string): Promise<{
    completedTrainings: string[];
    pendingTrainings: string[];
    overdueTrainings: string[];
    overallCompletionRate: number;
  }> {
    const { data: trainings } = await supabase
      .from('compliance_training')
      .select('*')
      .eq('user_id', userId);

    const completed: string[] = [];
    const pending: string[] = [];
    const overdue: string[] = [];
    const now = new Date();

    if (trainings) {
      for (const training of trainings) {
        if (training.is_completed) {
          completed.push(training.training_type);
        } else {
          // Check if overdue (simplified logic)
          pending.push(training.training_type);
        }
      }
    }

    const allTrainingTypes = ['data_protection', 'security_awareness', 'ethical_conduct', 'confidentiality', 'anti_fraud', 'aml_compliance'];
    const notStarted = allTrainingTypes.filter(t => !completed.includes(t) && !pending.includes(t));
    pending.push(...notStarted);

    return {
      completedTrainings: completed,
      pendingTrainings: pending,
      overdueTrainings: overdue,
      overallCompletionRate: allTrainingTypes.length > 0 ? (completed.length / allTrainingTypes.length) * 100 : 0
    };
  }

  async sendTrainingReminder(userId: string, trainingType: string): Promise<void> {
    await supabase
      .from('compliance_training')
      .update({ reminder_sent_at: new Date().toISOString() })
      .eq('user_id', userId)
      .eq('training_type', trainingType);

    await this.logSecurityEvent(
      'training_reminder' as SecurityEventType,
      'info',
      `Training reminder sent for ${trainingType}`,
      { userId, metadata: { trainingType } }
    );
  }

  // ==================== EMOTION-SECURITY INTEGRATION ====================

  async processEmotionSecurityEvent(
    eventId: string,
    emotion: string,
    emotionScore: number,
    sourceUserId: string
  ): Promise<{ action: string; escalated: boolean; assignedTo?: string }> {
    const thresholds: Record<string, { threshold: number; action: string }> = {
      anger: { threshold: 0.7, action: 'flag_and_monitor' },
      frustration: { threshold: 0.8, action: 'alert_supervisor' },
      manipulation: { threshold: 0.5, action: 'block_and_escalate' },
      urgency: { threshold: 0.9, action: 'priority_review' }
    };

    const config = thresholds[emotion.toLowerCase()];
    if (!config || emotionScore < config.threshold) {
      return { action: 'monitor', escalated: false };
    }

    // Log security event
    await this.logSecurityEvent(
      'emotion_escalation' as SecurityEventType,
      config.action.includes('escalate') ? 'high' : 'medium',
      `High ${emotion} detected (score: ${emotionScore.toFixed(2)}) - Action: ${config.action}`,
      { userId: sourceUserId, metadata: { emotion, emotionScore, originalEventId: eventId } }
    );

    const escalated = config.action.includes('escalate');
    
    return {
      action: config.action,
      escalated,
      assignedTo: escalated ? 'founder' : undefined
    };
  }

  // ==================== DEPARTMENT RISK ANALYSIS ====================

  async getDepartmentRiskScores(): Promise<Record<string, { score: number; level: string; topRisks: string[] }>> {
    const departments = ['sales', 'hr', 'finance', 'marketing', 'admin', 'it'];
    const results: Record<string, { score: number; level: string; topRisks: string[] }> = {};

    for (const dept of departments) {
      const leakProbability = await this.calculateLeakProbability(dept);
      const topRisks: string[] = [];

      if (leakProbability.score > 50) topRisks.push('High export activity');
      if (leakProbability.score > 70) topRisks.push('Suspicious patterns detected');

      results[dept] = {
        score: leakProbability.score,
        level: leakProbability.level,
        topRisks
      };
    }

    return results;
  }

  // ==================== COMPREHENSIVE AUDIT ====================

  async runComprehensiveSecurityAudit(): Promise<{
    overallStatus: ComplianceStatus;
    score: number;
    categories: Record<string, { status: ComplianceStatus; findings: string[]; recommendations: string[] }>;
    generatedAt: string;
  }> {
    const categories: Record<string, { status: ComplianceStatus; findings: string[]; recommendations: string[] }> = {};

    // Data Protection Audit
    const dpAudit = await this.runComplianceAudit('data_protection', 'system');
    if (dpAudit) {
      categories['data_protection'] = {
        status: dpAudit.compliance_status,
        findings: dpAudit.findings,
        recommendations: dpAudit.recommendations
      };
    }

    // Security Audit
    const secAudit = await this.runComplianceAudit('security', 'system');
    if (secAudit) {
      categories['security'] = {
        status: secAudit.compliance_status,
        findings: secAudit.findings,
        recommendations: secAudit.recommendations
      };
    }

    // Ethics Audit
    const violations = await this.getEthicsViolations('pending');
    categories['ethics'] = {
      status: violations.length > 0 ? 'warning' : 'compliant',
      findings: violations.map(v => v.description),
      recommendations: violations.length > 0 ? ['Review and resolve pending ethics violations'] : []
    };

    // Access Control Audit
    categories['access_control'] = {
      status: 'compliant',
      findings: [],
      recommendations: []
    };

    // Calculate overall
    const statuses = Object.values(categories).map(c => c.status);
    let overallStatus: ComplianceStatus = 'compliant';
    if (statuses.includes('violation')) overallStatus = 'violation';
    else if (statuses.includes('warning')) overallStatus = 'warning';

    const score = await this.refreshSecurityScore();

    return {
      overallStatus,
      score,
      categories,
      generatedAt: new Date().toISOString()
    };
  }
}

export const complianceSecurityService = ComplianceSecurityService.getInstance();
