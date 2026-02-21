import { useState, useEffect, useRef } from 'react';
import { Bell } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

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
  const [pinned, setPinned] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
  }, [user]);

  // Close on outside click only if not pinned by click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setPinned(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

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
    <div
      ref={containerRef}
      className="relative"
      onMouseEnter={() => { if (!pinned) setOpen(true); }}
      onMouseLeave={() => { if (!pinned) setOpen(false); }}
    >
      {/* Bell trigger */}
      <button
        onClick={() => {
          if (pinned) {
            setPinned(false);
            setOpen(false);
          } else {
            setPinned(true);
            setOpen(true);
          }
        }}
        className="w-9 h-9 flex items-center justify-center transition-all duration-300 group rounded-lg hover:bg-white/10 relative"
        aria-label="Notifications"
      >
        <Bell
          className="w-5 h-5 transition-colors duration-300 text-gold group-hover:text-white"
          style={{ filter: 'drop-shadow(0 0 6px rgba(200,167,102,0.4))' }}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] min-h-[18px] bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div
          className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-gold/40 rounded-xl shadow-xl shadow-gold/10 z-[10001] overflow-hidden"
        >
          {/* Header */}
          <div className="p-3 border-b border-gold/20 bg-gradient-to-r from-[#FDF9F3] to-[#F5EBD7] flex items-center justify-between">
            <h3 className="font-semibold text-sm text-stone-900">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-gold hover:text-gold/80 font-medium transition-colors">
                Mark all read
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[300px] overflow-y-auto bg-white">
            {notifications.length === 0 ? (
              <div className="p-6 text-center text-stone-400 text-sm">
                <Bell className="w-8 h-8 mx-auto mb-2 opacity-30 text-gold/40" />
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
                    setPinned(false);
                  }}
                  className={`w-full text-left p-3 border-b border-gold/10 hover:bg-gold/5 transition-colors ${
                    !n.is_read ? 'bg-gold/[0.04]' : ''
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {!n.is_read && (
                      <span className="w-2 h-2 rounded-full bg-gold mt-1.5 flex-shrink-0" />
                    )}
                    <div className={!n.is_read ? '' : 'pl-4'}>
                      <p className="text-sm font-medium text-stone-900">{n.title}</p>
                      {n.message && (
                        <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{n.message}</p>
                      )}
                      <p className="text-[10px] text-stone-400 mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Footer */}
          <div className="p-2 border-t border-gold/20 bg-gradient-to-r from-[#FDF9F3] to-[#F5EBD7]">
            <button
              onClick={() => { navigate('/listing-portal/my-listings'); setOpen(false); setPinned(false); }}
              className="w-full text-center text-xs text-gold hover:text-gold/80 font-semibold py-1.5 transition-colors"
            >
              View all listings
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListingNotificationBell;
