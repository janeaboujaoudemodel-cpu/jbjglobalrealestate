/**
 * COMPREHENSIVE NOTIFICATION SOUND & DESKTOP NOTIFICATIONS HOOK
 * Real-time notifications for leads, CVs, documents, forms, tickets, ideas, and registrations
 * Priority-based notification system for immediate action items
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

// Notification priority levels
export type NotificationPriority = 'critical' | 'high' | 'medium' | 'low';

// Notification event types
export type NotificationEventType = 
  | 'lead'
  | 'cv_application'
  | 'document_upload'
  | 'form_submission'
  | 'support_ticket'
  | 'idea_submission'
  | 'property_listing'
  | 'investor_application'
  | 'contact_gating'
  | 'broker_registration';

interface NotificationEvent {
  type: NotificationEventType;
  priority: NotificationPriority;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: Date;
}

interface NotificationConfig {
  enableSound: boolean;
  enableDesktop: boolean;
  soundUrl?: string;
  enabledTypes: NotificationEventType[];
  minPriority: NotificationPriority;
}

interface UseNotificationSoundReturn {
  isEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  playNotificationSound: (priority?: NotificationPriority) => void;
  notificationPermission: NotificationPermission | null;
  config: NotificationConfig;
  updateConfig: (config: Partial<NotificationConfig>) => void;
  recentNotifications: NotificationEvent[];
  clearNotifications: () => void;
  unreadCount: number;
}

// Sound URLs for different priorities
const SOUND_URLS = {
  critical: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0dP4/NxqNXHAM0hsq+oVBeCz+UxLmRQEUcU47T0ZZQBgxJr9XRg0IaDGe7z75gFwAqpMm5bVoaJnrHwpI3LRBHocO7Zy4VHWK2wIg/IgEvbKawiEQOBh9gpMOlbycAJ3y3tGseCB5lprimZB8CHnS1rnEkDiB4sLF9NxkfgquzYisBIn+vsWgiCiaDq6xmIwElh6mrYycFIIqoqGIlBiCKp6dhJgYfi6anYCgGHoympmAoBx2Np6VgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQ==',
  high: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0dP4/NxqNXHAM0hsq+oVBeCz+UxLmRQEUcU47T0ZZQBgxJr9XRg0IaDGe7z75gFwAqpMm5bVoaJnrHwpI3LRBHocO7Zy4VHWK2wIg/IgEvbKawiEQOBh9gpMOlbycAJ3y3tGseCB5lprimZB8CHnS1rnEkDiB4sLF9NxkfgquzYisBIn+vsWgiCiaDq6xmIwElh6mrYycFIIqoqGIlBiCKp6dhJgYfi6anYCgGHoympmAoBx2Np6VgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQ==',
  medium: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0dP4/NxqNXHAM0hsq+oVBeCz+UxLmRQEUcU47T0ZZQBgxJr9XRg0IaDGe7z75gFwAqpMm5bVoaJnrHwpI3LRBHocO7Zy4VHWK2wIg/IgEvbKawiEQOBh9gpMOlbycAJ3y3tGseCB5lprimZB8CHnS1rnEkDiB4sLF9NxkfgquzYisBIn+vsWgiCiaDq6xmIwElh6mrYycFIIqoqGIlBiCKp6dhJgYfi6anYCgGHoympmAoBx2Np6VgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQ==',
  low: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0dP4/NxqNXHAM0hsq+oVBeCz+UxLmRQEUcU47T0ZZQBgxJr9XRg0IaDGe7z75gFwAqpMm5bVoaJnrHwpI3LRBHocO7Zy4VHWK2wIg/IgEvbKawiEQOBh9gpMOlbycAJ3y3tGseCB5lprimZB8CHnS1rnEkDiB4sLF9NxkfgquzYisBIn+vsWgiCiaDq6xmIwElh6mrYycFIIqoqGIlBiCKp6dhJgYfi6anYCgGHoympmAoBx2Np6VgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQ==',
};

// Priority order for comparison
const PRIORITY_ORDER: Record<NotificationPriority, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

// Event type configurations with priorities and icons
const EVENT_CONFIG: Record<NotificationEventType, { 
  priority: NotificationPriority; 
  icon: string; 
  label: string;
  description: string;
}> = {
  lead: { 
    priority: 'critical', 
    icon: '🎯', 
    label: 'New Lead',
    description: 'New sales lead requiring follow-up'
  },
  cv_application: { 
    priority: 'high', 
    icon: '📄', 
    label: 'CV Submitted',
    description: 'Job application received'
  },
  document_upload: { 
    priority: 'medium', 
    icon: '📁', 
    label: 'Document Uploaded',
    description: 'New document uploaded'
  },
  form_submission: { 
    priority: 'medium', 
    icon: '📝', 
    label: 'Form Submitted',
    description: 'Form submission received'
  },
  support_ticket: { 
    priority: 'high', 
    icon: '🎫', 
    label: 'Support Ticket',
    description: 'New support request'
  },
  idea_submission: { 
    priority: 'medium', 
    icon: '💡', 
    label: 'Idea Submitted',
    description: 'New idea proposal'
  },
  property_listing: { 
    priority: 'high', 
    icon: '🏠', 
    label: 'Property Listed',
    description: 'New property listing'
  },
  investor_application: { 
    priority: 'critical', 
    icon: '💰', 
    label: 'Investor Application',
    description: 'New investor inquiry'
  },
  contact_gating: { 
    priority: 'high', 
    icon: '👤', 
    label: 'New Registration',
    description: 'New visitor registration'
  },
  broker_registration: { 
    priority: 'high', 
    icon: '🤝', 
    label: 'Broker Registration',
    description: 'New broker signup'
  },
};

// All event types enabled by default except orders
const DEFAULT_ENABLED_TYPES: NotificationEventType[] = [
  'lead',
  'cv_application',
  'document_upload',
  'form_submission',
  'support_ticket',
  'idea_submission',
  'property_listing',
  'investor_application',
  'contact_gating',
  'broker_registration',
];

export function useNotificationSound(): UseNotificationSoundReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [recentNotifications, setRecentNotifications] = useState<NotificationEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [config, setConfig] = useState<NotificationConfig>({
    enableSound: true,
    enableDesktop: true,
    soundUrl: SOUND_URLS.high,
    enabledTypes: DEFAULT_ENABLED_TYPES,
    minPriority: 'low',
  });
  
  const audioRefs = useRef<Record<NotificationPriority, HTMLAudioElement | null>>({
    critical: null,
    high: null,
    medium: null,
    low: null,
  });
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize audio elements for each priority
  useEffect(() => {
    Object.keys(SOUND_URLS).forEach((priority) => {
      const p = priority as NotificationPriority;
      audioRefs.current[p] = new Audio(SOUND_URLS[p]);
      audioRefs.current[p]!.volume = p === 'critical' ? 0.7 : p === 'high' ? 0.5 : 0.3;
    });

    return () => {
      Object.values(audioRefs.current).forEach((audio) => {
        if (audio) {
          audio.pause();
        }
      });
    };
  }, []);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const playNotificationSound = useCallback((priority: NotificationPriority = 'high') => {
    if (config.enableSound && audioRefs.current[priority]) {
      audioRefs.current[priority]!.currentTime = 0;
      audioRefs.current[priority]!.play().catch(console.error);
    }
  }, [config.enableSound]);

  const showDesktopNotification = useCallback((title: string, body: string, icon?: string, priority?: NotificationPriority) => {
    if (config.enableDesktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: `jbj-notification-${Date.now()}`,
        requireInteraction: priority === 'critical',
      });
    }
  }, [config.enableDesktop]);

  const addNotification = useCallback((event: NotificationEvent) => {
    setRecentNotifications((prev) => [event, ...prev].slice(0, 50));
    setUnreadCount((prev) => prev + 1);
  }, []);

  const shouldNotify = useCallback((eventType: NotificationEventType, priority: NotificationPriority): boolean => {
    if (!config.enabledTypes.includes(eventType)) return false;
    if (PRIORITY_ORDER[priority] < PRIORITY_ORDER[config.minPriority]) return false;
    return true;
  }, [config.enabledTypes, config.minPriority]);

  const handleNotification = useCallback((
    eventType: NotificationEventType,
    payload: { new: Record<string, unknown> }
  ) => {
    const eventConfig = EVENT_CONFIG[eventType];
    if (!shouldNotify(eventType, eventConfig.priority)) return;

    const data = payload.new;
    const name = (data.full_name || data.name || data.email || data.user_email || 'Someone') as string;
    
    const event: NotificationEvent = {
      type: eventType,
      priority: eventConfig.priority,
      title: `${eventConfig.icon} ${eventConfig.label}`,
      message: `${name} - ${eventConfig.description}`,
      data,
      timestamp: new Date(),
    };

    playNotificationSound(eventConfig.priority);
    showDesktopNotification(event.title, event.message, undefined, eventConfig.priority);
    addNotification(event);

    // Show toast with priority-based styling
    const toastFn = eventConfig.priority === 'critical' ? toast.error : 
                    eventConfig.priority === 'high' ? toast.warning : toast.success;
    toastFn(event.title, {
      description: event.message,
      duration: eventConfig.priority === 'critical' ? 10000 : 5000,
    });
  }, [playNotificationSound, showDesktopNotification, addNotification, shouldNotify]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    // Request desktop notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        toast.error('Desktop notifications were denied');
      }
    }

    // Set up realtime subscriptions for all event types
    channelRef.current = supabase
      .channel('comprehensive-notifications')
      // Leads (Critical Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'leads' },
        (payload) => handleNotification('lead', payload as { new: Record<string, unknown> }))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'crm_leads' },
        (payload) => handleNotification('lead', payload as { new: Record<string, unknown> }))
      
      // Support Tickets (High Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_conversations' },
        (payload) => handleNotification('support_ticket', payload as { new: Record<string, unknown> }))
      
      // Idea Submissions (Medium Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'best_idea_submissions' },
        (payload) => handleNotification('idea_submission', payload as { new: Record<string, unknown> }))
      
      // Contact Form / Gating Submissions (High Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_form_submissions' },
        (payload) => handleNotification('form_submission', payload as { new: Record<string, unknown> }))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'contact_gating_submissions' },
        (payload) => handleNotification('contact_gating', payload as { new: Record<string, unknown> }))
      
      // Broker Registrations (High Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broker_subscriptions' },
        (payload) => handleNotification('broker_registration', payload as { new: Record<string, unknown> }))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'broker_profiles' },
        (payload) => handleNotification('broker_registration', payload as { new: Record<string, unknown> }))
      
      // Chat History / Conversations (Medium Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'chat_history' },
        (payload) => {
          const data = payload.new as Record<string, unknown>;
          if (data.role === 'user') {
            handleNotification('form_submission', payload as { new: Record<string, unknown> });
          }
        })
      
      // Assistant Communications (High Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assistant_communications' },
        (payload) => handleNotification('support_ticket', payload as { new: Record<string, unknown> }))
      
      // Assistant Tasks (Medium Priority)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'assistant_tasks' },
        (payload) => handleNotification('form_submission', payload as { new: Record<string, unknown> }))

      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsEnabled(true);
          toast.success('Real-time notifications enabled', {
            description: 'You will be notified of leads, CVs, tickets, ideas & registrations',
          });
        }
      });

    return true;
  }, [handleNotification]);

  const disableNotifications = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsEnabled(false);
    toast.info('Notifications disabled');
  }, []);

  const updateConfig = useCallback((newConfig: Partial<NotificationConfig>) => {
    setConfig((prev) => ({ ...prev, ...newConfig }));
  }, []);

  const clearNotifications = useCallback(() => {
    setRecentNotifications([]);
    setUnreadCount(0);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  return {
    isEnabled,
    enableNotifications,
    disableNotifications,
    playNotificationSound,
    notificationPermission,
    config,
    updateConfig,
    recentNotifications,
    clearNotifications,
    unreadCount,
  };
}

// Export event configuration for UI usage
export { EVENT_CONFIG, DEFAULT_ENABLED_TYPES, PRIORITY_ORDER };
export type { NotificationEvent, NotificationConfig };

export default useNotificationSound;
