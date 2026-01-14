/**
 * Hook for AI Compliance, Ethics & Security Intelligence Layer
 * Provides security monitoring, compliance auditing, and ethics enforcement
 * 
 * Enhanced with:
 * - AI Self-Regulation & Integrity
 * - Secure Communication Protocols
 * - Compliance Training Tracking
 * - Emotion-Security Integration
 */

import { useState, useEffect, useCallback } from 'react';
import { complianceSecurityService } from '@/services/compliance-security-service';
import {
  SecurityEvent,
  SecuritySeverity,
  SecurityEventType,
  ComplianceAudit,
  EthicsViolation,
  SecurityHealthMetrics,
  EmergencyLockdown,
  ComplianceStatus
} from '@/config/compliance-engine';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface UseComplianceSecurityReturn {
  // State
  securityScore: number;
  isLockdownActive: boolean;
  recentEvents: SecurityEvent[];
  ethicsViolations: EthicsViolation[];
  healthMetrics: SecurityHealthMetrics[];
  activeLockdowns: EmergencyLockdown[];
  isLoading: boolean;

  // Security Actions
  logSecurityEvent: (
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
  ) => Promise<string | null>;
  resolveSecurityEvent: (eventId: string) => Promise<boolean>;
  detectSuspiciousActivity: (
    userId: string,
    activityType: string,
    metadata: Record<string, unknown>
  ) => Promise<{ isSuspicious: boolean; reason?: string; riskScore: number }>;

  // Data Access
  checkDataAccess: (
    userId: string,
    resourceType: string,
    resourceId: string,
    userRole: string,
    userDepartment: string
  ) => Promise<{ allowed: boolean; reason?: string }>;

  // Ethics
  checkAIBehaviorEthics: (
    aiAgentId: string,
    action: string,
    content: string
  ) => Promise<{ compliant: boolean; violations: string[] }>;
  recordEthicsViolation: (violation: Partial<EthicsViolation>) => Promise<string | null>;

  // Compliance
  runComplianceAudit: (
    auditType: string,
    targetType: string,
    targetId?: string
  ) => Promise<ComplianceAudit | null>;

  // File Provenance
  trackFileUpload: (
    fileId: string,
    fileName: string,
    fileHash: string,
    uploaderId: string,
    department: string
  ) => Promise<void>;
  trackFileAccess: (fileId: string, userId: string, action: 'view' | 'download' | 'modify') => Promise<void>;
  checkFileTampering: (fileId: string, currentHash: string) => Promise<boolean>;

  // Leak Prevention
  calculateLeakProbability: (department: string) => Promise<{
    score: number;
    level: string;
    action: string;
  }>;

  // Emergency Lockdown
  triggerEmergencyLockdown: (
    reason: string,
    severity?: SecuritySeverity,
    departments?: string[]
  ) => Promise<EmergencyLockdown | null>;
  deactivateLockdown: (lockdownId: string) => Promise<boolean>;

  // Summary
  generateDailySecuritySummary: () => Promise<{
    summary: string;
    metrics: Partial<SecurityHealthMetrics>;
    alerts: SecurityEvent[];
  }>;

  // NEW: AI Self-Regulation
  verifyAIDecision: (
    aiAgentId: string,
    decisionType: string,
    decisionData: Record<string, unknown>
  ) => Promise<{ verified: boolean; conflicts: string[]; recommendations: string[] }>;
  getAIIntegrityScore: (aiAgentId: string) => Promise<number>;

  // NEW: Secure Communication
  generateWatermark: (userId: string, contentType: string) => Promise<string>;
  detectCommunicationLeak: (watermarkId: string, detectedLocation: string) => Promise<{
    leakConfirmed: boolean;
    originalOwner?: string;
    action: string;
  }>;
  scanForSensitiveData: (content: string) => Promise<{
    containsSensitive: boolean;
    detectedPatterns: string[];
    redactedContent: string;
  }>;

  // NEW: Training
  getTrainingStatus: (userId: string) => Promise<{
    completedTrainings: string[];
    pendingTrainings: string[];
    overdueTrainings: string[];
    overallCompletionRate: number;
  }>;
  sendTrainingReminder: (userId: string, trainingType: string) => Promise<void>;

  // NEW: Emotion Integration
  processEmotionSecurityEvent: (
    eventId: string,
    emotion: string,
    emotionScore: number,
    sourceUserId: string
  ) => Promise<{ action: string; escalated: boolean; assignedTo?: string }>;

  // NEW: Department Risk
  getDepartmentRiskScores: () => Promise<Record<string, { score: number; level: string; topRisks: string[] }>>;

  // NEW: Comprehensive Audit
  runComprehensiveSecurityAudit: () => Promise<{
    overallStatus: ComplianceStatus;
    score: number;
    categories: Record<string, { status: ComplianceStatus; findings: string[]; recommendations: string[] }>;
    generatedAt: string;
  }>;

  // Refresh
  refreshData: () => Promise<void>;
}

export function useComplianceSecurity(): UseComplianceSecurityReturn {
  const { user } = useAuth();
  const [securityScore, setSecurityScore] = useState(100);
  const [isLockdownActive, setIsLockdownActive] = useState(false);
  const [recentEvents, setRecentEvents] = useState<SecurityEvent[]>([]);
  const [ethicsViolations, setEthicsViolations] = useState<EthicsViolation[]>([]);
  const [healthMetrics, setHealthMetrics] = useState<SecurityHealthMetrics[]>([]);
  const [activeLockdowns, setActiveLockdowns] = useState<EmergencyLockdown[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [score, events, violations, metrics, lockdowns] = await Promise.all([
        complianceSecurityService.refreshSecurityScore(),
        complianceSecurityService.getRecentSecurityEvents(50),
        complianceSecurityService.getEthicsViolations(),
        complianceSecurityService.getSecurityHealthMetrics(7),
        complianceSecurityService.checkActiveLockdowns()
      ]);

      setSecurityScore(score);
      setRecentEvents(events);
      setEthicsViolations(violations);
      setHealthMetrics(metrics);
      setActiveLockdowns(lockdowns);
      setIsLockdownActive(lockdowns.length > 0);
    } catch (error) {
      console.error('Failed to refresh security data:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshData();

    // Subscribe to real-time security events
    const subscriptionId = 'compliance-hook';
    complianceSecurityService.subscribe(subscriptionId, (event) => {
      setRecentEvents(prev => [event, ...prev.slice(0, 49)]);
      
      // Show toast for high/critical events
      if (event.severity === 'critical') {
        toast.error(`🚨 CRITICAL: ${event.description}`, {
          duration: 10000
        });
      } else if (event.severity === 'high') {
        toast.warning(`⚠️ Security Alert: ${event.description}`, {
          duration: 5000
        });
      }
    });

    return () => {
      complianceSecurityService.unsubscribe(subscriptionId);
    };
  }, [refreshData]);

  // Original functions
  const logSecurityEvent = useCallback(async (
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
  ) => {
    return complianceSecurityService.logSecurityEvent(eventType, severity, description, options);
  }, []);

  const resolveSecurityEvent = useCallback(async (eventId: string) => {
    if (!user?.id) {
      toast.error('Authentication required');
      return false;
    }
    const result = await complianceSecurityService.resolveSecurityEvent(eventId, user.id);
    if (result) {
      toast.success('Security event resolved');
      await refreshData();
    }
    return result;
  }, [user?.id, refreshData]);

  const detectSuspiciousActivity = useCallback(async (
    userId: string,
    activityType: string,
    metadata: Record<string, unknown>
  ) => {
    return complianceSecurityService.detectSuspiciousActivity(userId, activityType, metadata);
  }, []);

  const checkDataAccess = useCallback(async (
    userId: string,
    resourceType: string,
    resourceId: string,
    userRole: string,
    userDepartment: string
  ) => {
    return complianceSecurityService.checkDataAccess(userId, resourceType, resourceId, userRole, userDepartment);
  }, []);

  const checkAIBehaviorEthics = useCallback(async (
    aiAgentId: string,
    action: string,
    content: string
  ) => {
    return complianceSecurityService.checkAIBehaviorEthics(aiAgentId, action, content);
  }, []);

  const recordEthicsViolation = useCallback(async (violation: Partial<EthicsViolation>) => {
    const result = await complianceSecurityService.recordEthicsViolation(violation);
    if (result) {
      await refreshData();
    }
    return result;
  }, [refreshData]);

  const runComplianceAudit = useCallback(async (
    auditType: string,
    targetType: string,
    targetId?: string
  ) => {
    return complianceSecurityService.runComplianceAudit(auditType, targetType, targetId);
  }, []);

  const trackFileUpload = useCallback(async (
    fileId: string,
    fileName: string,
    fileHash: string,
    uploaderId: string,
    department: string
  ) => {
    return complianceSecurityService.trackFileUpload(fileId, fileName, fileHash, uploaderId, department);
  }, []);

  const trackFileAccess = useCallback(async (
    fileId: string,
    userId: string,
    action: 'view' | 'download' | 'modify'
  ) => {
    return complianceSecurityService.trackFileAccess(fileId, userId, action);
  }, []);

  const checkFileTampering = useCallback(async (fileId: string, currentHash: string) => {
    return complianceSecurityService.checkFileTampering(fileId, currentHash);
  }, []);

  const calculateLeakProbability = useCallback(async (department: string) => {
    return complianceSecurityService.calculateLeakProbability(department);
  }, []);

  const triggerEmergencyLockdown = useCallback(async (
    reason: string,
    severity: SecuritySeverity = 'critical',
    departments: string[] = ['all']
  ) => {
    const result = await complianceSecurityService.triggerEmergencyLockdown(reason, severity, departments);
    if (result) {
      setIsLockdownActive(true);
      setActiveLockdowns(prev => [result, ...prev]);
      toast.error('🚨 EMERGENCY LOCKDOWN ACTIVATED', {
        description: reason,
        duration: 30000
      });
    }
    return result;
  }, []);

  const deactivateLockdown = useCallback(async (lockdownId: string) => {
    if (!user?.id) {
      toast.error('Authentication required');
      return false;
    }
    const result = await complianceSecurityService.deactivateLockdown(lockdownId, user.id);
    if (result) {
      await refreshData();
      toast.success('Lockdown deactivated');
    }
    return result;
  }, [user?.id, refreshData]);

  const generateDailySecuritySummary = useCallback(async () => {
    return complianceSecurityService.generateDailySecuritySummary();
  }, []);

  // NEW: AI Self-Regulation functions
  const verifyAIDecision = useCallback(async (
    aiAgentId: string,
    decisionType: string,
    decisionData: Record<string, unknown>
  ) => {
    return complianceSecurityService.verifyAIDecision(aiAgentId, decisionType, decisionData);
  }, []);

  const getAIIntegrityScore = useCallback(async (aiAgentId: string) => {
    return complianceSecurityService.getAIIntegrityScore(aiAgentId);
  }, []);

  // NEW: Secure Communication functions
  const generateWatermark = useCallback(async (userId: string, contentType: string) => {
    return complianceSecurityService.generateWatermark(userId, contentType);
  }, []);

  const detectCommunicationLeak = useCallback(async (watermarkId: string, detectedLocation: string) => {
    return complianceSecurityService.detectCommunicationLeak(watermarkId, detectedLocation);
  }, []);

  const scanForSensitiveData = useCallback(async (content: string) => {
    return complianceSecurityService.scanForSensitiveData(content);
  }, []);

  // NEW: Training functions
  const getTrainingStatus = useCallback(async (userId: string) => {
    return complianceSecurityService.getTrainingStatus(userId);
  }, []);

  const sendTrainingReminder = useCallback(async (userId: string, trainingType: string) => {
    return complianceSecurityService.sendTrainingReminder(userId, trainingType);
  }, []);

  // NEW: Emotion Integration
  const processEmotionSecurityEvent = useCallback(async (
    eventId: string,
    emotion: string,
    emotionScore: number,
    sourceUserId: string
  ) => {
    return complianceSecurityService.processEmotionSecurityEvent(eventId, emotion, emotionScore, sourceUserId);
  }, []);

  // NEW: Department Risk
  const getDepartmentRiskScores = useCallback(async () => {
    return complianceSecurityService.getDepartmentRiskScores();
  }, []);

  // NEW: Comprehensive Audit
  const runComprehensiveSecurityAudit = useCallback(async () => {
    return complianceSecurityService.runComprehensiveSecurityAudit();
  }, []);

  return {
    securityScore,
    isLockdownActive,
    recentEvents,
    ethicsViolations,
    healthMetrics,
    activeLockdowns,
    isLoading,
    logSecurityEvent,
    resolveSecurityEvent,
    detectSuspiciousActivity,
    checkDataAccess,
    checkAIBehaviorEthics,
    recordEthicsViolation,
    runComplianceAudit,
    trackFileUpload,
    trackFileAccess,
    checkFileTampering,
    calculateLeakProbability,
    triggerEmergencyLockdown,
    deactivateLockdown,
    generateDailySecuritySummary,
    verifyAIDecision,
    getAIIntegrityScore,
    generateWatermark,
    detectCommunicationLeak,
    scanForSensitiveData,
    getTrainingStatus,
    sendTrainingReminder,
    processEmotionSecurityEvent,
    getDepartmentRiskScores,
    runComprehensiveSecurityAudit,
    refreshData
  };
}
