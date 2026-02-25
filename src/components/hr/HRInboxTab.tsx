import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inbox, Mail, Clock, ExternalLink, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface ThreadRow {
  id: string;
  contact_identifier: string;
  contact_name: string | null;
  channel_type: string;
  status: string;
  last_message_preview: string | null;
  last_message_at: string | null;
  unread_count: number;
  metadata: Record<string, unknown> | null;
}

export function HRInboxTab() {
  const [threads, setThreads] = useState<ThreadRow[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchHRThreads();
  }, []);

  const fetchHRThreads = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('owner_comm_threads')
        .select('*')
        .order('last_message_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      // Filter to HR-related threads
      const hrThreads = (data || []).filter((t: any) => {
        const service = (t.metadata as any)?.service;
        return !service || service === 'hr' || service === 'career' || service === 'cv';
      });

      setThreads(hrThreads as ThreadRow[]);
    } catch (err) {
      console.error('Failed to load HR inbox:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-white border border-crm-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-2 text-crm-text">
          <Inbox className="h-5 w-5 text-gold" />
          HR Inbox
          {threads.some(t => t.unread_count > 0) && (
            <Badge className="bg-red-500 text-white text-xs ml-2">
              {threads.reduce((sum, t) => sum + (t.unread_count || 0), 0)} unread
            </Badge>
          )}
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          className="gap-2 border-gold/40 text-gold hover:bg-gold/10"
          onClick={() => navigate('/owner/inbox')}
        >
          <ExternalLink className="h-3.5 w-3.5" />
          Full Inbox
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-8 text-center text-muted-foreground">Loading...</div>
        ) : threads.length === 0 ? (
          <div className="py-12 text-center">
            <Mail className="h-12 w-12 mx-auto mb-3 text-muted-foreground/30" />
            <p className="text-muted-foreground">No HR messages yet</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Inbound replies from candidates will appear here
            </p>
          </div>
        ) : (
          <ScrollArea className="h-[500px]">
            <div className="space-y-2">
              {threads.map(thread => (
                <div
                  key={thread.id}
                  className={`p-4 rounded-lg border cursor-pointer hover:shadow-sm transition-all ${
                    thread.unread_count > 0
                      ? 'bg-gold/5 border-gold/30'
                      : 'bg-white border-crm-border'
                  }`}
                  onClick={() => navigate('/owner/inbox')}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-full bg-gold/10 flex items-center justify-center flex-shrink-0">
                        <User className="h-4 w-4 text-gold" />
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium text-sm text-crm-text truncate">
                          {thread.contact_name || thread.contact_identifier}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">
                          {thread.last_message_preview || 'No messages'}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1 flex-shrink-0">
                      {thread.last_message_at && (
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(thread.last_message_at), 'MMM d, h:mm a')}
                        </span>
                      )}
                      {thread.unread_count > 0 && (
                        <Badge className="bg-red-500 text-white text-[10px] px-1.5 py-0">
                          {thread.unread_count}
                        </Badge>
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
