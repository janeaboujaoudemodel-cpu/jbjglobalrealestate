/**
 * EMAIL REPORT PREVIEW
 * Shows how the email report will look before scheduling
 */

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Loader2, Eye, Mail, ExternalLink } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface EmailReportPreviewProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reportName: string;
  frequency: 'weekly' | 'monthly';
  recipients: string[];
}

interface ReportData {
  totalVisitors: number;
  totalPageViews: number;
  totalToolUsage: number;
  uniqueUsers: number;
  topTools: { name: string; count: number }[];
  topPages: { path: string; views: number }[];
  period: string;
}

export function EmailReportPreview({ 
  open, 
  onOpenChange, 
  reportName, 
  frequency, 
  recipients 
}: EmailReportPreviewProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [reportData, setReportData] = useState<ReportData | null>(null);

  useEffect(() => {
    if (open) {
      fetchPreviewData();
    }
  }, [open, frequency]);

  const fetchPreviewData = async () => {
    setIsLoading(true);
    try {
      const daysBack = frequency === 'weekly' ? 7 : 30;
      const startDate = subDays(new Date(), daysBack);

      // Fetch analytics data
      const [visitorData, analyticsData] = await Promise.all([
        supabase
          .from('visitor_events')
          .select('event_type, page_path')
          .gte('created_at', startDate.toISOString()),
        supabase
          .from('jbj_analytics')
          .select('tool_name, user_id')
          .gte('created_at', startDate.toISOString()),
      ]);

      // Process visitor data
      const totalPageViews = visitorData.data?.length || 0;
      
      // Count unique sessions (approximation)
      const totalVisitors = Math.ceil(totalPageViews / 3);

      // Process tool usage
      const toolCounts = new Map<string, number>();
      const uniqueUserIds = new Set<string>();
      
      analyticsData.data?.forEach((item) => {
        toolCounts.set(item.tool_name, (toolCounts.get(item.tool_name) || 0) + 1);
        if (item.user_id) uniqueUserIds.add(item.user_id);
      });

      const topTools = Array.from(toolCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, count]) => ({ name, count }));

      // Process page views
      const pageCounts = new Map<string, number>();
      visitorData.data?.forEach((item) => {
        if (item.page_path) {
          pageCounts.set(item.page_path, (pageCounts.get(item.page_path) || 0) + 1);
        }
      });

      const topPages = Array.from(pageCounts.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([path, views]) => ({ path, views }));

      setReportData({
        totalVisitors,
        totalPageViews,
        totalToolUsage: analyticsData.data?.length || 0,
        uniqueUsers: uniqueUserIds.size,
        topTools,
        topPages,
        period: `${format(startDate, 'MMM d')} - ${format(new Date(), 'MMM d, yyyy')}`,
      });
    } catch (error) {
      console.error('Failed to fetch preview data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Email Report Preview
          </DialogTitle>
          <DialogDescription>
            Preview of how the {frequency} report will appear in recipient inboxes
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <ScrollArea className="max-h-[60vh]">
            {/* Email Preview Container */}
            <div className="border rounded-lg overflow-hidden bg-white">
              {/* Email Header */}
              <div className="bg-muted/50 px-6 py-4 border-b">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                  <Mail className="h-4 w-4" />
                  From: JBJ Global Real Estate &lt;reports@resend.dev&gt;
                </div>
                <div className="text-sm text-muted-foreground mb-2">
                  To: {recipients.slice(0, 2).join(', ')}
                  {recipients.length > 2 && ` and ${recipients.length - 2} more`}
                </div>
                <div className="font-semibold text-foreground">
                  📊 {reportName} - {reportData?.period}
                </div>
              </div>

              {/* Email Body */}
              <div className="p-6 text-foreground">
                {/* Hero Section */}
                <div className="text-center mb-8">
                  <h1 className="text-2xl font-bold text-zinc-900 mb-2">
                    {reportName}
                  </h1>
                  <p className="text-muted-foreground">
                    {frequency === 'weekly' ? 'Weekly' : 'Monthly'} Analytics Report
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {reportData?.period}
                  </Badge>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-4 mb-8">
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {reportData?.totalVisitors.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Total Visitors</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {reportData?.totalPageViews.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Page Views</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {reportData?.uniqueUsers.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Active Users</div>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-4 text-center">
                    <div className="text-3xl font-bold text-primary">
                      {reportData?.totalToolUsage.toLocaleString()}
                    </div>
                    <div className="text-sm text-muted-foreground">Tool Interactions</div>
                  </div>
                </div>

                {/* Top Tools */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 mb-3">Top Tools</h2>
                  <div className="space-y-2">
                    {reportData?.topTools.map((tool, idx) => (
                      <div key={tool.name} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{idx + 1}.</span>
                          <span className="text-zinc-800">{tool.name}</span>
                        </div>
                        <Badge variant="secondary">{tool.count} uses</Badge>
                      </div>
                    ))}
                    {(!reportData?.topTools || reportData.topTools.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No tool usage data</p>
                    )}
                  </div>
                </div>

                {/* Top Pages */}
                <div className="mb-6">
                  <h2 className="text-lg font-semibold text-zinc-900 mb-3">Top Pages</h2>
                  <div className="space-y-2">
                    {reportData?.topPages.map((page, idx) => (
                      <div key={page.path} className="flex items-center justify-between py-2 border-b last:border-0">
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">{idx + 1}.</span>
                          <span className="text-zinc-800 truncate max-w-[300px]">{page.path}</span>
                        </div>
                        <Badge variant="secondary">{page.views} views</Badge>
                      </div>
                    ))}
                    {(!reportData?.topPages || reportData.topPages.length === 0) && (
                      <p className="text-muted-foreground text-center py-4">No page view data</p>
                    )}
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t pt-4 text-center text-sm text-muted-foreground">
                  <p>This is an automated report from JBJ Global Real Estate.</p>
                  <p className="mt-1">© {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
                </div>
              </div>
            </div>
          </ScrollArea>
        )}

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default EmailReportPreview;
