/**
 * ANALYTICS PDF EXPORT
 * Generates exportable PDF reports from the analytics dashboard
 */

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { FileDown, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { format, subDays } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';

interface AnalyticsPDFExportProps {
  className?: string;
}

interface ExportConfig {
  includeStats: boolean;
  includeToolUsage: boolean;
  includeHeatmap: boolean;
  includeIssues: boolean;
  dateRange: 'week' | 'month' | 'quarter';
}

export function AnalyticsPDFExport({ className }: AnalyticsPDFExportProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [config, setConfig] = useState<ExportConfig>({
    includeStats: true,
    includeToolUsage: true,
    includeHeatmap: true,
    includeIssues: true,
    dateRange: 'week',
  });

  const generatePDFContent = async () => {
    const daysBack = config.dateRange === 'week' ? 7 : config.dateRange === 'month' ? 30 : 90;
    const startDate = subDays(new Date(), daysBack);

    // Fetch data based on config
    const [analyticsData, issuesData, visitorData] = await Promise.all([
      supabase
        .from('jbj_analytics')
        .select('tool_name, user_id, created_at')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('jbj_issue_reports')
        .select('*')
        .gte('created_at', startDate.toISOString()),
      supabase
        .from('visitor_events')
        .select('event_type, page_path, created_at')
        .gte('created_at', startDate.toISOString()),
    ]);

    // Process tool usage
    const toolCounts = new Map<string, number>();
    analyticsData.data?.forEach((item) => {
      toolCounts.set(item.tool_name, (toolCounts.get(item.tool_name) || 0) + 1);
    });
    const topTools = Array.from(toolCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    // Calculate stats
    const totalInteractions = analyticsData.data?.length || 0;
    const uniqueUsers = new Set(analyticsData.data?.filter(a => a.user_id).map(a => a.user_id)).size;
    const totalPageViews = visitorData.data?.length || 0;
    const pendingIssues = issuesData.data?.filter(i => i.status === 'pending').length || 0;

    return {
      period: `${format(startDate, 'MMM d')} - ${format(new Date(), 'MMM d, yyyy')}`,
      stats: {
        totalInteractions,
        uniqueUsers,
        totalPageViews,
        pendingIssues,
      },
      topTools,
      issues: issuesData.data || [],
    };
  };

  const exportToPDF = async () => {
    setIsExporting(true);
    try {
      const data = await generatePDFContent();
      
      // Create HTML content for PDF
      const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <title>JBJ Analytics Report - ${data.period}</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
            h1 { color: #1a1a1a; border-bottom: 2px solid #d4af37; padding-bottom: 10px; }
            h2 { color: #444; margin-top: 30px; }
            .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 20px; margin: 20px 0; }
            .stat-card { background: #f5f5f5; padding: 20px; border-radius: 8px; text-align: center; }
            .stat-value { font-size: 32px; font-weight: bold; color: #d4af37; }
            .stat-label { color: #666; margin-top: 5px; }
            .tool-list { list-style: none; padding: 0; }
            .tool-item { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
            .issue-card { background: #fff; border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
            .issue-pending { border-left: 4px solid #f59e0b; }
            .issue-resolved { border-left: 4px solid #10b981; }
            .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
          </style>
        </head>
        <body>
          <h1>JBJ Analytics Report</h1>
          <p>Report Period: ${data.period}</p>
          <p>Generated: ${format(new Date(), 'PPP p')}</p>
          
          ${config.includeStats ? `
          <h2>Key Metrics</h2>
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-value">${data.stats.totalInteractions.toLocaleString()}</div>
              <div class="stat-label">Total Interactions</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.stats.uniqueUsers.toLocaleString()}</div>
              <div class="stat-label">Active Users</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.stats.totalPageViews.toLocaleString()}</div>
              <div class="stat-label">Page Views</div>
            </div>
            <div class="stat-card">
              <div class="stat-value">${data.stats.pendingIssues}</div>
              <div class="stat-label">Pending Issues</div>
            </div>
          </div>
          ` : ''}
          
          ${config.includeToolUsage ? `
          <h2>Top Tools by Usage</h2>
          <ul class="tool-list">
            ${data.topTools.map(([name, count], idx) => `
              <li class="tool-item">
                <span>${idx + 1}. ${name}</span>
                <span><strong>${count}</strong> uses</span>
              </li>
            `).join('')}
          </ul>
          ` : ''}
          
          ${config.includeIssues ? `
          <h2>🚨 Recent Issues (${data.issues.length})</h2>
          ${data.issues.slice(0, 10).map(issue => `
            <div class="issue-card issue-${issue.status}">
              <strong>${issue.tool_name}</strong> - ${issue.issue_category}
              <p>${issue.issue_description}</p>
              <small>Status: ${issue.status} | ${format(new Date(issue.created_at), 'PPP')}</small>
            </div>
          `).join('')}
          ` : ''}
          
          <div class="footer">
            <p>© ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
            <p>This is an automated report. For questions, contact your administrator.</p>
          </div>
        </body>
        </html>
      `;

      // Create blob and trigger download
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      
      // Open in new window for printing/saving as PDF
      const printWindow = window.open(url, '_blank');
      if (printWindow) {
        printWindow.onload = () => {
          printWindow.print();
        };
      }
      
      toast.success('Report generated! Use your browser\'s print dialog to save as PDF.');
      setIsOpen(false);
    } catch (error) {
      console.error('Failed to export PDF:', error);
      toast.error('Failed to generate report');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className={className}>
          <FileDown className="w-4 h-4 mr-2" />
          Export PDF
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Export Analytics Report</DialogTitle>
          <DialogDescription>
            Choose what to include in your PDF report for stakeholder presentations.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>Date Range</Label>
            <Select
              value={config.dateRange}
              onValueChange={(value: 'week' | 'month' | 'quarter') =>
                setConfig(prev => ({ ...prev, dateRange: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Last 7 Days</SelectItem>
                <SelectItem value="month">Last 30 Days</SelectItem>
                <SelectItem value="quarter">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-3">
            <Label>Include Sections</Label>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="stats"
                checked={config.includeStats}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeStats: !!checked }))
                }
              />
              <label htmlFor="stats" className="text-sm">Key Metrics & Statistics</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="tools"
                checked={config.includeToolUsage}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeToolUsage: !!checked }))
                }
              />
              <label htmlFor="tools" className="text-sm">Tool Usage Rankings</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="heatmap"
                checked={config.includeHeatmap}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeHeatmap: !!checked }))
                }
              />
              <label htmlFor="heatmap" className="text-sm">Activity Heatmap Summary</label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox
                id="issues"
                checked={config.includeIssues}
                onCheckedChange={(checked) =>
                  setConfig(prev => ({ ...prev, includeIssues: !!checked }))
                }
              />
              <label htmlFor="issues" className="text-sm">Issue Reports</label>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={exportToPDF} disabled={isExporting}>
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <FileDown className="w-4 h-4 mr-2" />
                Export Report
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default AnalyticsPDFExport;
