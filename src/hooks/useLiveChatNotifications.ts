import { useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface LiveChatNotification {
  id: string;
  user_name: string | null;
  user_email: string | null;
  service_type: string | null;
  status: string | null;
  created_at: string;
}

/**
 * Hook that subscribes to real-time chat_conversations changes
 * and shows notifications when new chats come in or users send messages.
 */
export const useLiveChatNotifications = (enabled: boolean = true) => {
  const lastNotifiedRef = useRef<Set<string>>(new Set());
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playNotificationSound = useCallback(() => {
    try {
      // Use Web Audio API for a simple notification chime
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(880, audioContext.currentTime); // A5
      oscillator.frequency.setValueAtTime(1100, audioContext.currentTime + 0.1); // C#6
      oscillator.frequency.setValueAtTime(1320, audioContext.currentTime + 0.2); // E6
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);
    } catch (e) {
      // Silent fallback if audio not supported
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const channel = supabase
      .channel('live-chat-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_conversations',
        },
        (payload) => {
          const newChat = payload.new as LiveChatNotification;
          if (!lastNotifiedRef.current.has(newChat.id)) {
            lastNotifiedRef.current.add(newChat.id);
            playNotificationSound();
            toast.info(
              `🔔 New chat from ${newChat.user_name || 'Anonymous'}`,
              {
                description: `Service: ${newChat.service_type?.replace(/_/g, ' ') || 'General'}`,
                duration: 8000,
                action: {
                  label: 'View',
                  onClick: () => {
                    window.location.href = '/admin/chat-conversations';
                  },
                },
              }
            );
          }
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'chat_conversations',
        },
        (payload) => {
          const updated = payload.new as any;
          const old = payload.old as any;
          
          // Notify when messages array grows (user is actively chatting)
          const newMsgCount = updated.messages?.length || 0;
          const oldMsgCount = old.messages?.length || 0;
          
          if (newMsgCount > oldMsgCount && updated.status === 'active') {
            const notifKey = `${updated.id}-${newMsgCount}`;
            if (!lastNotifiedRef.current.has(notifKey)) {
              lastNotifiedRef.current.add(notifKey);
              // Only play sound, don't spam toasts for every message
              if (newMsgCount % 3 === 0) { // Notify every 3rd message
                playNotificationSound();
                toast.info(
                  `💬 ${updated.user_name || 'User'} is active in chat`,
                  {
                    description: `${newMsgCount} messages so far`,
                    duration: 5000,
                  }
                );
              }
            }
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, playNotificationSound]);
};

export default useLiveChatNotifications;
