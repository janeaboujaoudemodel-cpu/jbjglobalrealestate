import { useState, useEffect } from 'react';
import { Bell, Headphones, CheckCircle, MessageSquare } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { resolveNotificationRoute } from '@/lib/notificationRouting';
import { useQueryClient } from '@tanstack/react-query';

interface Notification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  type: string;
  metadata: any;
}

interface ListingNotificationBellProps {
  onOpen?: () => void;
  onHoverEnter?: () => void;
  onHoverLeave?: () => void;
  forceClose?: boolean;
  bellOnly?: boolean;
  panelMode?: boolean;
  onClose?: () => void;
}

const ListingNotificationBell = ({ onOpen, onHoverEnter, onHoverLeave, forceClose, bellOnly, panelMode, onClose }: ListingNotificationBellProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    
    const [listingResult, ticketResult] = await Promise.all([
      supabase
        .from('user_listing_notifications')
        .select('id, title, message, is_read, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5),
      supabase
        .from('user_notifications')
        .select('id, title, message, is_read, created_at, type, metadata')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const listingNotifs: Notification[] = (listingResult.data || []).map(n => ({
      ...n,
      type: 'listing',
      metadata: null,
    }));

    const ticketNotifs: Notification[] = (ticketResult.data || []).map(n => ({
      ...n,
      type: n.type || 'support_ticket',
      metadata: n.metadata,
    }));

    const all = [...listingNotifs, ...ticketNotifs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    setNotifications(all.slice(0, 15));
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const invalidateCounts = () => {
    queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
  };

  const markAsRead = async (notif: Notification) => {
    if (notif.is_read) return;
    const table = notif.type === 'listing' ? 'user_listing_notifications' : 'user_notifications';
    await supabase
      .from(table)
      .update({ is_read: true } as any)
      .eq('id', notif.id);
    setNotifications(prev => prev.map(n => n.id === notif.id ? { ...n, is_read: true } : n));
    invalidateCounts();
  };

  const markAllRead = async () => {
    if (!user) return;
    await Promise.all([
      supabase
        .from('user_listing_notifications')
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false),
      supabase
        .from('user_notifications')
        .update({ is_read: true } as any)
        .eq('user_id', user.id)
        .eq('is_read', false),
    ]);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    invalidateCounts();
  };

  const getNotifIcon = (type: string, metadata: any) => {
    if (type === 'support_ticket') {
      const action = metadata?.action;
      if (action === 'resolved') return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      if (action === 'staff_reply') return <MessageSquare className="w-4 h-4 text-blue-500" />;
      return <Headphones className="w-4 h-4 text-gold" />;
    }
    return <Bell className="w-4 h-4 text-gold" />;
  };

  const handleNotifClick = (notif: Notification) => {
    void markAsRead(notif);

    const destination = resolveNotificationRoute({
      type: notif.type,
      metadata: notif.metadata,
      title: notif.title,
      message: notif.message,
    });

    if (/^https?:\/\//i.test(destination)) {
      window.open(destination, '_blank', 'noopener,noreferrer');
    } else {
      navigate(destination);
    }

    onClose?.();
  };

  if (!user) return null;

  // Panel mode
  if (panelMode) {
    return (
      <div className="w-80 bg-white border-2 border-gold/40 rounded-xl shadow-xl shadow-gold/10 overflow-hidden">
        <div className="p-3 border-b border-gold/20 bg-gradient-to-r from-[#FDF9F3] to-[#F5EBD7] flex items-center justify-between">
          <h3 className="font-semibold text-sm text-stone-900">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-gold hover:text-gold/80 font-medium transition-colors">
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-[300px] overflow-y-auto bg-white">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-stone-400 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-gold/40" />
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={`${n.type}-${n.id}`}
                onClick={() => handleNotifClick(n)}
                className={`w-full text-left p-3 border-b border-gold/10 hover:bg-gold/5 transition-colors ${
                  !n.is_read ? 'bg-gold/[0.04]' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-red-500 mt-1.5 flex-shrink-0" />
                  )}
                  <div className="flex items-start gap-2 flex-1">
                    <div className="mt-0.5 flex-shrink-0">
                      {getNotifIcon(n.type, n.metadata)}
                    </div>
                    <div className={!n.is_read ? '' : 'pl-0'}>
                      <p className="text-sm font-medium text-stone-900">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[10px] text-stone-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        <div className="p-2 border-t border-gold/20 bg-gradient-to-r from-[#FDF9F3] to-[#F5EBD7] flex gap-2">
          <button
            onClick={() => { navigate('/my-tickets'); onClose?.(); }}
            className="flex-1 text-center text-xs text-gold hover:text-gold/80 font-semibold py-1.5 transition-colors"
          >
            My Tickets
          </button>
          <button
            onClick={() => { navigate('/my-dashboard#notifications'); onClose?.(); }}
            className="flex-1 text-center text-xs text-gold hover:text-gold/80 font-semibold py-1.5 transition-colors"
          >
            All Notifications
          </button>
        </div>
      </div>
    );
  }

  // Bell-only mode
  if (bellOnly) {
    return (
      <button
        onMouseEnter={onHoverEnter}
        onMouseLeave={onHoverLeave}
        onClick={onOpen}
        className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-white/10 relative"
        aria-label="Notifications"
      >
        <Bell
          className="w-5 h-5 transition-colors duration-300 text-gold group-hover:text-white"
          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none animate-pulse">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>
    );
  }

  return null;
};

export default ListingNotificationBell;
