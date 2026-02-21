import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

interface ListingNotification {
  id: string;
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  listing_id: string | null;
}

const ListingNotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<ListingNotification[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_listing_notifications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);
    if (data) setNotifications(data as ListingNotification[]);
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  const markAsRead = async (id: string) => {
    await supabase
      .from('user_listing_notifications')
      .update({ is_read: true } as any)
      .eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
  };

  const markAllRead = async () => {
    if (!user) return;
    await supabase
      .from('user_listing_notifications')
      .update({ is_read: true } as any)
      .eq('user_id', user.id)
      .eq('is_read', false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-white/10 relative"
          aria-label="Notifications"
        >
          <Bell
            className="w-5 h-5 transition-colors duration-300 text-gold group-hover:text-white"
            style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }}
          />
          {unreadCount > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-80 p-0 bg-zinc-900 border-zinc-700 text-white" 
        align="end"
        sideOffset={8}
      >
        <div className="p-3 border-b border-zinc-800 flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          {unreadCount > 0 && (
            <button onClick={markAllRead} className="text-xs text-fuchsia-400 hover:text-fuchsia-300">
              Mark all read
            </button>
          )}
        </div>
        <div className="max-h-[300px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-6 text-center text-zinc-500 text-sm">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              No notifications yet
            </div>
          ) : (
            notifications.map(n => (
              <button
                key={n.id}
                onClick={() => {
                  markAsRead(n.id);
                  if (n.listing_id) navigate('/listing-portal/my-listings');
                  setOpen(false);
                }}
                className={`w-full text-left p-3 border-b border-zinc-800/50 hover:bg-zinc-800/50 transition-colors ${
                  !n.is_read ? 'bg-fuchsia-500/5' : ''
                }`}
              >
                <div className="flex items-start gap-2">
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-fuchsia-500 mt-1.5 flex-shrink-0" />
                  )}
                  <div className={!n.is_read ? '' : 'pl-4'}>
                    <p className="text-sm font-medium">{n.title}</p>
                    {n.message && (
                      <p className="text-xs text-zinc-400 mt-0.5 line-clamp-2">{n.message}</p>
                    )}
                    <p className="text-[10px] text-zinc-600 mt-1">
                      {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
        <div className="p-2 border-t border-zinc-800">
          <button
            onClick={() => { navigate('/listing-portal/my-listings'); setOpen(false); }}
            className="w-full text-center text-xs text-fuchsia-400 hover:text-fuchsia-300 py-1.5"
          >
            View all listings
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default ListingNotificationBell;
