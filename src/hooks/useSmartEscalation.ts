/**
 * useSmartEscalation Hook
 * React hook for integrating smart escalation and emotion detection
 */

import { useState, useCallback, useEffect } from 'react';
import { toast } from 'sonner';
import {
  processIncomingMessage,
  getEscalationQueue,
  acknowledgeEscalation,
  resolveEscalation,
  createNotificationFromEscalation,
  createEmotionNotification,
  formatEscalationAlert,
  formatInternalAlert,
  checkSecondLevelEscalation,
  triggerSecondLevelEscalation,
  adjustToneForChannel,
  checkVIPStatus,
  type EscalationEvent,
  type NotificationItem,
  type SmartResponse,
} from '@/services/smart-escalation-service';
import {
  analyzeMessage,
  type EmotionAnalysis,
  type EmotionType,
  type UrgencyLevel,
} from '@/config/emotion-detection-engine';
import { getPersonalityById } from '@/config/ai-personalities';

interface UseSmartEscalationReturn {
  // Analysis
  analyzeMessageEmotion: (message: string) => EmotionAnalysis;
  
  // Processing
  processMessage: (
    message: string,
    senderId: string,
    senderName: string,
    senderType: 'client' | 'team' | 'ai',
    channel: 'chat' | 'whatsapp' | 'email' | 'crm'
  ) => Promise<SmartResponse>;
  
  // Escalation queue
  escalationQueue: EscalationEvent[];
  refreshEscalationQueue: () => void;
  acknowledgeEscalation: (eventId: string, userId: string) => boolean;
  resolveEscalation: (eventId: string, userId: string, notes: string) => boolean;
  
  // Notifications
  notifications: NotificationItem[];
  addNotification: (notification: NotificationItem) => void;
  markNotificationAsRead: (notificationId: string) => void;
  markAllNotificationsAsRead: () => void;
  unreadCount: number;
  criticalCount: number;
  
  // VIP status
  checkVIP: (leadId: string) => Promise<{ isVIP: boolean; reason?: string }>;
  
  // Tone adjustment
  adjustResponseTone: (
    content: string,
    analysis: EmotionAnalysis,
    channel: 'email' | 'whatsapp' | 'chat' | 'video' | 'call'
  ) => string;
  
  // State
  isProcessing: boolean;
  lastAnalysis: EmotionAnalysis | null;
}

export function useSmartEscalation(): UseSmartEscalationReturn {
  const [escalationQueue, setEscalationQueue] = useState<EscalationEvent[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [lastAnalysis, setLastAnalysis] = useState<EmotionAnalysis | null>(null);
  
  // Derived state
  const unreadCount = notifications.filter(n => !n.isRead).length;
  const criticalCount = notifications.filter(n => !n.isRead && n.urgency === 'critical').length;
  
  // Refresh escalation queue
  const refreshEscalationQueue = useCallback(() => {
    setEscalationQueue(getEscalationQueue());
  }, []);
  
  // Analyze message emotion
  const analyzeMessageEmotion = useCallback((message: string): EmotionAnalysis => {
    const analysis = analyzeMessage(message);
    setLastAnalysis(analysis);
    return analysis;
  }, []);
  
  // Process incoming message
  const processMessage = useCallback(async (
    message: string,
    senderId: string,
    senderName: string,
    senderType: 'client' | 'team' | 'ai',
    channel: 'chat' | 'whatsapp' | 'email' | 'crm'
  ): Promise<SmartResponse> => {
    setIsProcessing(true);
    
    try {
      const response = await processIncomingMessage(
        message,
        senderId,
        senderName,
        senderType,
        channel
      );
      
      setLastAnalysis({
        emotion: response.emotionContext.emotion,
        confidence: response.emotionContext.confidence,
        sentiment: response.emotionContext.sentiment,
        urgency: 'normal', // Will be set properly in analysis
        keywords: [],
        suggestedTone: { style: 'professional', responseDeadlineMinutes: response.responseDeadlineMinutes },
        shouldEscalate: response.shouldEscalate,
        escalationReason: response.escalationReason,
      });
      
      // Show toast for escalations
      if (response.shouldEscalate) {
        const targetNames = response.escalationTargets
          ?.map(id => getPersonalityById(id)?.name || id)
          .join(', ');
        
        toast.warning(`Escalation triggered`, {
          description: `${response.escalationReason}. Assigned to: ${targetNames}`,
        });
        
        // Refresh escalation queue
        refreshEscalationQueue();
      }
      
      return response;
    } finally {
      setIsProcessing(false);
    }
  }, [refreshEscalationQueue]);
  
  // Acknowledge escalation
  const handleAcknowledgeEscalation = useCallback((eventId: string, userId: string): boolean => {
    const success = acknowledgeEscalation(eventId, userId);
    if (success) {
      refreshEscalationQueue();
      toast.success('Escalation acknowledged');
    }
    return success;
  }, [refreshEscalationQueue]);
  
  // Resolve escalation
  const handleResolveEscalation = useCallback((eventId: string, userId: string, notes: string): boolean => {
    const success = resolveEscalation(eventId, userId, notes);
    if (success) {
      refreshEscalationQueue();
      toast.success('Escalation resolved');
    }
    return success;
  }, [refreshEscalationQueue]);
  
  // Add notification
  const addNotification = useCallback((notification: NotificationItem) => {
    setNotifications(prev => [notification, ...prev]);
    
    // Show toast for critical/high urgency
    if (notification.urgency === 'critical' || notification.urgency === 'high') {
      toast.warning(notification.title, {
        description: notification.description,
      });
    }
  }, []);
  
  // Mark notification as read
  const markNotificationAsRead = useCallback((notificationId: string) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, isRead: true } : n
      )
    );
  }, []);
  
  // Mark all notifications as read
  const markAllNotificationsAsRead = useCallback(() => {
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);
  
  // VIP check
  const checkVIP = useCallback(async (leadId: string) => {
    return checkVIPStatus(leadId);
  }, []);
  
  // Adjust response tone for channel
  const adjustResponseTone = useCallback((
    content: string,
    analysis: EmotionAnalysis,
    channel: 'email' | 'whatsapp' | 'chat' | 'video' | 'call'
  ): string => {
    return adjustToneForChannel(content, analysis, channel);
  }, []);
  
  // Check for second-level escalations periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const overdueEscalations = checkSecondLevelEscalation();
      
      for (const event of overdueEscalations) {
        triggerSecondLevelEscalation(event);
        
        // Add notification for CEO
        addNotification({
          id: `second-level-${event.id}`,
          type: 'escalation',
          title: 'Second-Level Escalation',
          description: `No response for 15+ minutes on escalation from ${event.senderName}. Escalated to CEO.`,
          timestamp: new Date(),
          urgency: 'critical',
          emotionIcon: 'alert',
          senderName: event.senderName,
          isRead: false,
          responseDeadline: new Date(Date.now() + 10 * 60 * 1000),
        });
        
        toast.error('Second-Level Escalation', {
          description: `No response on escalation from ${event.senderName}. Escalated to CEO.`,
        });
      }
      
      refreshEscalationQueue();
    }, 60000); // Check every minute
    
    return () => clearInterval(interval);
  }, [addNotification, refreshEscalationQueue]);
  
  return {
    analyzeMessageEmotion,
    processMessage,
    escalationQueue,
    refreshEscalationQueue,
    acknowledgeEscalation: handleAcknowledgeEscalation,
    resolveEscalation: handleResolveEscalation,
    notifications,
    addNotification,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    unreadCount,
    criticalCount,
    checkVIP,
    adjustResponseTone,
    isProcessing,
    lastAnalysis,
  };
}

export default useSmartEscalation;
