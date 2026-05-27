import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, Mail, ExternalLink, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface NotificationRow {
  id: string;
  type: string;
  title: string;
  message: string | null;
  is_read: boolean | null;
  created_at: string;
  metadata: Record<string, unknown> | null;
}

export function HRInboxTab() {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHRNotifications();
  }, []);

  const fetchHRNotifications = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_notifications')
        .select('id, type, title, message, is_read, created_at, metadata')
        .in('type', ['cv_application', 'hr_application', 'career_application'])
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setItems((data || []) as NotificationRow[]);
    } catch (err) {
      console.error('Failed to load HR inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  const openItem = (row: NotificationRow) => {
    const applicantId = (row.metadata as any)?.applicantId;
    if (applicantId) {
      navigate(`/owner/careers-portal?section=cv-center&applicantId=${applicantId}`);
    } else {
      navigate('/owner/careers-portal?section=cv-center');
    }
  };

  const unread = items.filter((t) => !t.is_read).length;

  return (
    <Card className="bg-[#FDFBF7] border border-crm-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-crm-text">
          <Inbox className="h-5 w-5 text-[#1A1A1A]" />
          HR Inbox
          {unread > 0 && (
            <Badge className="bg-red-500 text-white text-xs ml-2">{unread} unread</Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-[#B89555]/40 text-[#1A1A1A] hover:bg-[#EFE6D6]/10"
          onClick={() => navigate('/owner/careers-portal')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Open Careers Portal
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : items.length === 0 ? (
          <div className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-3 text-muted-foreground/60" />
            <p className="text-muted-foreground">No HR messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Inbound CV applications will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {items.map((row) => (
                <div
                  key={row.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                    !row.is_read
                      ? 'bg-[#EFE6D6]/5 border-[#B89555]/30'
                      : 'bg-[#FDFBF7] border-crm-border'
                  }`}
                  onClick={() => openItem(row)}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-[#EFE6D6]/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-[#1A1A1A]" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-crm-text truncate">{row.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{row.message}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(row.created_at), 'MMM d, h:mm a')}
                      </span>
                      {!row.is_read && (
                        <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">new</Badge>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );
}
