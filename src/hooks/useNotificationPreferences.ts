import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

export interface NotificationPreferences {
  email_notifications: boolean;
  push_notifications: boolean;
  browser_notifications: boolean;
  notification_frequency: 'instant' | 'daily' | 'weekly';
  all_notifications_off: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
  email_notifications: true,
  push_notifications: true,
  browser_notifications: false,
  notification_frequency: 'instant',
  all_notifications_off: false,
};

export function useNotificationPreferences() {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');

  // Check browser notification permission
  useEffect(() => {
    if ('Notification' in window) {
      setBrowserPermission(Notification.permission);
    }
  }, []);

  // Load preferences from database
  const loadPreferences = useCallback(async () => {
    if (!user?.id) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('user_preferences')
        .select('email_notifications, push_notifications, browser_notifications, notification_frequency, dashboard_config')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') throw error;

      if (data) {
        const dashboardConfig = (data.dashboard_config as Record<string, unknown>) || {};
        const notifPrefs = (dashboardConfig.notifications as Record<string, unknown>) || {};
        setPreferences({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          browser_notifications: data.browser_notifications ?? false,
          notification_frequency: (data.notification_frequency as NotificationPreferences['notification_frequency']) || 'instant',
          all_notifications_off: notifPrefs.all_off === true,
        });
      }
    } catch (err) {
      console.error('Error loading notification preferences:', err);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  // Request browser notification permission
  const requestBrowserPermission = async (): Promise<boolean> => {
    if (!('Notification' in window)) {
      toast.error('Browser notifications are not supported');
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      setBrowserPermission(permission);
      return permission === 'granted';
    } catch (err) {
      console.error('Error requesting notification permission:', err);
      return false;
    }
  };

  // Update a single preference
  const updatePreference = async <K extends keyof NotificationPreferences>(
    key: K,
    value: NotificationPreferences[K]
  ): Promise<boolean> => {
    if (!user?.id) return false;

    // Handle browser notifications specially
    if (key === 'browser_notifications' && value === true) {
      if (browserPermission !== 'granted') {
        const granted = await requestBrowserPermission();
        if (!granted) {
          toast.error('Browser notification permission denied');
          return false;
        }
      }
    }

    const previousValue = preferences[key];
    setPreferences(prev => ({ ...prev, [key]: value }));
    setIsSaving(true);

    try {
      // Build update object
      const updateData: Record<string, unknown> = {};
      
      if (key === 'email_notifications') updateData.email_notifications = value;
      else if (key === 'push_notifications') updateData.push_notifications = value;
      else if (key === 'browser_notifications') updateData.browser_notifications = value;
      else if (key === 'notification_frequency') updateData.notification_frequency = value;
      else if (key === 'all_notifications_off') {
        updateData.dashboard_config = { notifications: { all_off: value } };
        // If turning all off, also update individual toggles
        if (value === true) {
          updateData.email_notifications = false;
          updateData.push_notifications = false;
          updateData.browser_notifications = false;
          setPreferences(prev => ({
            ...prev,
            email_notifications: false,
            push_notifications: false,
            browser_notifications: false,
            all_notifications_off: true,
          }));
        }
      }

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          ...updateData,
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      toast.success('Preference updated');
      return true;
    } catch (err) {
      console.error('Error updating preference:', err);
      setPreferences(prev => ({ ...prev, [key]: previousValue }));
      toast.error('Failed to update preference');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  // Turn off all notifications
  const turnOffAll = async () => {
    return updatePreference('all_notifications_off', true);
  };

  // Turn on all notifications
  const turnOnAll = async () => {
    if (!user?.id) return false;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('user_preferences')
        .upsert({
          user_id: user.id,
          email_notifications: true,
          push_notifications: true,
          browser_notifications: browserPermission === 'granted',
          dashboard_config: { notifications: { all_off: false } },
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id',
        });

      if (error) throw error;

      setPreferences({
        email_notifications: true,
        push_notifications: true,
        browser_notifications: browserPermission === 'granted',
        notification_frequency: preferences.notification_frequency,
        all_notifications_off: false,
      });

      toast.success('All notifications enabled');
      return true;
    } catch (err) {
      console.error('Error enabling all notifications:', err);
      toast.error('Failed to enable notifications');
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  return {
    preferences,
    isLoading,
    isSaving,
    browserPermission,
    updatePreference,
    turnOffAll,
    turnOnAll,
    requestBrowserPermission,
    refresh: loadPreferences,
  };
}
