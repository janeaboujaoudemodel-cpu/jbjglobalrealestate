/**
 * NOTIFICATION SOUND & DESKTOP NOTIFICATIONS HOOK
 * Provides real-time notification sounds and desktop notifications for new leads/orders
 */

import { useEffect, useCallback, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { toast } from 'sonner';

interface NotificationConfig {
  enableSound: boolean;
  enableDesktop: boolean;
  soundUrl?: string;
}

interface UseNotificationSoundReturn {
  isEnabled: boolean;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => void;
  playNotificationSound: () => void;
  notificationPermission: NotificationPermission | null;
  config: NotificationConfig;
  updateConfig: (config: Partial<NotificationConfig>) => void;
}

// Default notification sound (base64 encoded short beep)
const DEFAULT_SOUND_URL = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleR0dP4/NxqNXHAM0hsq+oVBeCz+UxLmRQEUcU47T0ZZQBgxJr9XRg0IaDGe7z75gFwAqpMm5bVoaJnrHwpI3LRBHocO7Zy4VHWK2wIg/IgEvbKawiEQOBh9gpMOlbycAJ3y3tGseCB5lprimZB8CHnS1rnEkDiB4sLF9NxkfgquzYisBIn+vsWgiCiaDq6xmIwElh6mrYycFIIqoqGIlBiCKp6dhJgYfi6anYCgGHoympmAoBx2Np6VgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQccjaekYCkHHI2npGApBxyNp6RgKQ==';

export function useNotificationSound(): UseNotificationSoundReturn {
  const [isEnabled, setIsEnabled] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission | null>(null);
  const [config, setConfig] = useState<NotificationConfig>({
    enableSound: true,
    enableDesktop: true,
    soundUrl: DEFAULT_SOUND_URL,
  });
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize audio element
  useEffect(() => {
    audioRef.current = new Audio(config.soundUrl || DEFAULT_SOUND_URL);
    audioRef.current.volume = 0.5;

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [config.soundUrl]);

  // Check notification permission on mount
  useEffect(() => {
    if ('Notification' in window) {
      setNotificationPermission(Notification.permission);
    }
  }, []);

  const playNotificationSound = useCallback(() => {
    if (config.enableSound && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(console.error);
    }
  }, [config.enableSound]);

  const showDesktopNotification = useCallback((title: string, body: string, icon?: string) => {
    if (config.enableDesktop && 'Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: icon || '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'jbj-notification',
        requireInteraction: false,
      });
    }
  }, [config.enableDesktop]);

  const handleNewLead = useCallback((payload: { new: { full_name?: string; email?: string } }) => {
    const lead = payload.new;
    playNotificationSound();
    showDesktopNotification(
      '🎉 New Lead!',
      `${lead.full_name || 'A new lead'} has just submitted their information.`
    );
    toast.success('New lead received!', {
      description: lead.full_name || lead.email || 'New inquiry',
    });
  }, [playNotificationSound, showDesktopNotification]);

  const enableNotifications = useCallback(async (): Promise<boolean> => {
    // Request desktop notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      if (permission !== 'granted') {
        toast.error('Desktop notifications were denied');
      }
    }

    // Set up realtime subscription
    channelRef.current = supabase
      .channel('leads-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'leads',
        },
        handleNewLead
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'crm_leads',
        },
        handleNewLead
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          setIsEnabled(true);
          toast.success('Notifications enabled', {
            description: 'You will be notified of new leads and orders',
          });
        }
      });

    return true;
  }, [handleNewLead]);

  const disableNotifications = useCallback(() => {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    setIsEnabled(false);
    toast.info('Notifications disabled');
  }, []);

  const updateConfig = useCallback((newConfig: Partial<NotificationConfig>) => {
    setConfig(prev => ({ ...prev, ...newConfig }));
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
  };
}

export default useNotificationSound;
