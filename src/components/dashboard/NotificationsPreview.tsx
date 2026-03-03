import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, ChevronRight, Settings, Check, AlertCircle, Info, Headphones, MessageSquare, Mail, MailOpen } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface UnifiedNotification {
  id: string;
  title: string;
  body: string | null;
  type: string;
  is_read: boolean;
  created_at: string;
  source_table: 'notifications' | 'user_notifications' | 'user_listing_notifications';
  metadata: any;
}

const typeIcons: Record<string, React.ReactNode> = {
  info: <Info className="w-4 h-4 text-primary" />,
  success: <Check className="w-4 h-4 text-primary" />,
  warning: <AlertCircle className="w-4 h-4 text-gold" />,
  alert: <AlertCircle className="w-4 h-4 text-destructive" />,
  system: <Info className="w-4 h-4 text-muted-foreground" />,
  support_ticket: <Headphones className="w-4 h-4 text-gold" />,
  listing: <Bell className="w-4 h-4 text-gold" />,
  staff_reply: <MessageSquare className="w-4 h-4 text-blue-500" />,
};

const NotificationsPreview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'unread' | 'read'>('unread');

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications-preview', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const [systemResult, ticketResult, listingResult] = await Promise.all([
        supabase
          .from('notifications')
          .select('id, title, body, notification_type, is_read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_notifications')
          .select('id, title, message, is_read, created_at, type, metadata')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .from('user_listing_notifications')
          .select('id, title, message, is_read, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(20),
      ]);

      const system: UnifiedNotification[] = (systemResult.data || []).map(n => ({
        id: n.id, title: n.title, body: n.body, type: n.notification_type || 'system',
        is_read: n.is_read, created_at: n.created_at,
        source_table: 'notifications' as const, metadata: null,
      }));

      const tickets: UnifiedNotification[] = (ticketResult.data || []).map(n => ({
        id: n.id, title: n.title, body: n.message, type: n.type || 'support_ticket',
        is_read: n.is_read, created_at: n.created_at,
        source_table: 'user_notifications' as const, metadata: n.metadata,
      }));

      const listings: UnifiedNotification[] = (listingResult.data || []).map(n => ({
        id: n.id, title: n.title, body: n.message, type: 'listing',
        is_read: n.is_read, created_at: n.created_at,
        source_table: 'user_listing_notifications' as const, metadata: null,
      }));

      return [...system, ...tickets, ...listings]
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    },
    enabled: !!user?.id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['notifications-preview'] });
    queryClient.invalidateQueries({ queryKey: ['user-alert-counts'] });
    queryClient.invalidateQueries({ queryKey: ['ticket-notifications'] });
  };

  const unreadNotifications = notifications?.filter(n => !n.is_read) || [];
  const readNotifications = notifications?.filter(n => n.is_read) || [];
  const unreadCount = unreadNotifications.length;
  const displayedNotifications = activeTab === 'unread' ? unreadNotifications : readNotifications;

  const markAsRead = async (notif: UnifiedNotification) => {
    if (notif.is_read) return;
    await supabase
      .from(notif.source_table)
      .update({ is_read: true, read_at: new Date().toISOString() } as any)
      .eq('id', notif.id);
    invalidateAll();
    toast.success("Marked as read");
  };

  const markAsUnread = async (notif: UnifiedNotification) => {
    if (!notif.is_read) return;
    await supabase
      .from(notif.source_table)
      .update({ is_read: false, read_at: null } as any)
      .eq('id', notif.id);
    invalidateAll();
    toast.success("Marked as unread");
  };

  const markAllRead = async () => {
    if (!user?.id) return;
    const readAt = new Date().toISOString();
    await Promise.all([
      supabase.from('notifications').update({ is_read: true, read_at: readAt } as any).eq('user_id', user.id).eq('is_read', false),
      supabase.from('user_notifications').update({ is_read: true, read_at: readAt } as any).eq('user_id', user.id).eq('is_read', false),
      supabase.from('user_listing_notifications').update({ is_read: true, read_at: readAt } as any).eq('user_id', user.id).eq('is_read', false),
    ]);
    invalidateAll();
    toast.success("All notifications marked as read");
  };

  const getIcon = (notif: UnifiedNotification) => {
    if (notif.type === 'support_ticket') {
      const action = notif.metadata?.action;
      if (action === 'resolved') return <Check className="w-4 h-4 text-emerald-500" />;
      if (action === 'staff_reply') return <MessageSquare className="w-4 h-4 text-blue-500" />;
      return <Headphones className="w-4 h-4 text-gold" />;
    }
    return typeIcons[notif.type] || typeIcons.info;
  };

  return (
    <Card className="border border-border bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center relative">
            <Bell className="w-4 h-4 text-gold" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </div>
          Notifications
        </CardTitle>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs text-gold h-7 px-2">
              Mark all read
            </Button>
          )}
          <Button variant="ghost" size="icon" asChild className="h-8 w-8">
            <Link to="/profile?tab=settings">
              <Settings className="w-4 h-4 text-muted-foreground" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Unread / Read Tabs */}
        <div className="flex gap-1 mb-3 p-1 bg-muted/50 rounded-lg">
          <button
            onClick={() => setActiveTab('unread')}
            className={`flex-1 text-xs font-semibold py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'unread'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <Mail className="w-3.5 h-3.5" />
            Unread
            {unreadCount > 0 && (
              <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0 ml-0.5">
                {unreadCount}
              </Badge>
            )}
          </button>
          <button
            onClick={() => setActiveTab('read')}
            className={`flex-1 text-xs font-semibold py-1.5 px-3 rounded-md transition-all flex items-center justify-center gap-1.5 ${
              activeTab === 'read'
                ? 'bg-white text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MailOpen className="w-3.5 h-3.5" />
            Read
            {readNotifications.length > 0 && (
              <span className="text-[10px] text-muted-foreground ml-0.5">
                ({readNotifications.length})
              </span>
            )}
          </button>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        ) : displayedNotifications.length === 0 ? (
          <div className="text-center py-6">
            <Bell className="w-10 h-10 text-muted-foreground/30 mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'unread' ? 'No unread notifications' : 'No read notifications'}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {activeTab === 'unread'
                ? "You're all caught up!"
                : 'Notifications you read will appear here'}
            </p>
          </div>
        ) : (
          <>
            <div className="space-y-2 max-h-[400px] overflow-y-auto pr-1">
              {displayedNotifications.map(notification => (
                <div
                  key={`${notification.source_table}-${notification.id}`}
                  className={`w-full text-left flex items-start gap-3 p-3 rounded-lg border transition-all ${
                    notification.is_read 
                      ? 'border-border/50 bg-transparent hover:bg-muted/30' 
                      : 'border-gold/30 bg-gold/5 hover:bg-gold/10'
                  }`}
                >
                  <div className="mt-0.5 flex-shrink-0">
                    {getIcon(notification)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-foreground truncate">
                        {notification.title}
                      </p>
                      {!notification.is_read && (
                        <Badge className="bg-gold/20 text-gold border-gold/40 text-[10px] px-1 py-0">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                      {notification.body}
                    </p>
                    <p className="text-[10px] text-muted-foreground/70 mt-1">
                      {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                    </p>
                  </div>
                  <div className="flex-shrink-0">
                    {notification.is_read ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-gold"
                        title="Mark as Unread"
                        onClick={() => markAsUnread(notification)}
                      >
                        <Mail className="h-3.5 w-3.5" />
                      </Button>
                    ) : (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-gold"
                        title="Mark as Read"
                        onClick={() => markAsRead(notification)}
                      >
                        <MailOpen className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <Button variant="link" className="w-full text-gold mt-4 p-0" asChild>
              <Link to="/profile?tab=settings">
                Manage Notifications
                <ChevronRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default NotificationsPreview;
