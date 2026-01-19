/**
 * SCHEDULED REPORTS MANAGER
 * UI component for managing automated email scheduling for PDF analytics reports
 */

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useScheduledReports, ScheduledReport, CreateScheduledReportRequest } from '@/hooks/useScheduledReports';
import { Calendar, Clock, Mail, Plus, Send, Trash2, Edit, History, CheckCircle, XCircle, Loader2, Eye } from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { EmailReportPreview } from './EmailReportPreview';

export function ScheduledReportsManager() {
  const {
    reports,
    deliveryLogs,
    isLoading,
    createReport,
    updateReport,
    deleteReport,
    toggleReportStatus,
    sendReportNow,
    fetchDeliveryLogs,
  } = useScheduledReports();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isHistoryDialogOpen, setIsHistoryDialogOpen] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
  const [newReport, setNewReport] = useState<CreateScheduledReportRequest>({
    report_name: '',
    frequency: 'weekly',
    recipients: [],
  });
  const [recipientInput, setRecipientInput] = useState('');

  const handleAddRecipient = () => {
    if (recipientInput && recipientInput.includes('@')) {
      setNewReport(prev => ({
        ...prev,
        recipients: [...prev.recipients, recipientInput],
      }));
      setRecipientInput('');
    }
  };

  const handleRemoveRecipient = (email: string) => {
    setNewReport(prev => ({
      ...prev,
      recipients: prev.recipients.filter(r => r !== email),
    }));
  };

  const handleCreateReport = async () => {
    if (!newReport.report_name || newReport.recipients.length === 0) return;
    
    const result = await createReport(newReport);
    if (result) {
      setIsCreateDialogOpen(false);
      setNewReport({ report_name: '', frequency: 'weekly', recipients: [] });
    }
  };

  const handleViewHistory = async (reportId: string) => {
    setSelectedReportId(reportId);
    await fetchDeliveryLogs(reportId);
    setIsHistoryDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Scheduled Reports</h2>
          <p className="text-muted-foreground">Automate weekly or monthly PDF analytics reports</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              New Schedule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Create Scheduled Report</DialogTitle>
              <DialogDescription>
                Set up automated email delivery for your analytics reports
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="report-name">Report Name</Label>
                <Input
                  id="report-name"
                  placeholder="e.g., Weekly Performance Report"
                  value={newReport.report_name}
                  onChange={(e) => setNewReport(prev => ({ ...prev, report_name: e.target.value }))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="frequency">Frequency</Label>
                <Select
                  value={newReport.frequency}
                  onValueChange={(value: 'weekly' | 'monthly') => 
                    setNewReport(prev => ({ ...prev, frequency: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Recipients</Label>
                <div className="flex gap-2">
                  <Input
                    placeholder="email@example.com"
                    value={recipientInput}
                    onChange={(e) => setRecipientInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddRecipient()}
                  />
                  <Button type="button" variant="outline" onClick={handleAddRecipient}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {newReport.recipients.map((email) => (
                    <Badge key={email} variant="secondary" className="gap-1">
                      {email}
                      <button
                        onClick={() => handleRemoveRecipient(email)}
                        className="ml-1 hover:text-destructive"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={handleCreateReport}
                disabled={!newReport.report_name || newReport.recipients.length === 0 || isLoading}
              >
                {isLoading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
                Create Schedule
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setIsPreviewOpen(true)}
                disabled={!newReport.report_name || newReport.recipients.length === 0}
              >
                <Eye className="h-4 w-4 mr-2" />
                Preview
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Email Preview Dialog */}
      <EmailReportPreview
        open={isPreviewOpen}
        onOpenChange={setIsPreviewOpen}
        reportName={newReport.report_name || 'Analytics Report'}
        frequency={newReport.frequency}
        recipients={newReport.recipients}
      />

      {/* Reports List */}
      {reports.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Mail className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Scheduled Reports</h3>
            <p className="text-muted-foreground text-center mb-4">
              Create your first scheduled report to automate analytics delivery
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Schedule
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onToggleStatus={() => toggleReportStatus(report.id)}
              onSendNow={() => sendReportNow(report.id)}
              onDelete={() => deleteReport(report.id)}
              onViewHistory={() => handleViewHistory(report.id)}
              isLoading={isLoading}
            />
          ))}
        </div>
      )}

      {/* Delivery History Dialog */}
      <Dialog open={isHistoryDialogOpen} onOpenChange={setIsHistoryDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Delivery History</DialogTitle>
            <DialogDescription>
              View past deliveries for this scheduled report
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="max-h-[400px]">
            {deliveryLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No delivery history yet
              </div>
            ) : (
              <div className="space-y-3">
                {deliveryLogs.map((log) => (
                  <div key={log.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {log.status === 'sent' ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-destructive" />
                      )}
                      <div>
                        <p className="font-medium">
                          {format(new Date(log.sent_at), 'PPP p')}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {log.recipients.length} recipient(s)
                        </p>
                      </div>
                    </div>
                    <Badge variant={log.status === 'sent' ? 'default' : 'destructive'}>
                      {log.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}

interface ReportCardProps {
  report: ScheduledReport;
  onToggleStatus: () => void;
  onSendNow: () => void;
  onDelete: () => void;
  onViewHistory: () => void;
  isLoading: boolean;
}

function ReportCard({ report, onToggleStatus, onSendNow, onDelete, onViewHistory, isLoading }: ReportCardProps) {
  return (
    <Card className={!report.is_active ? 'opacity-60' : ''}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-lg font-semibold">{report.report_name}</h3>
              <Badge variant={report.frequency === 'weekly' ? 'default' : 'secondary'}>
                {report.frequency}
              </Badge>
              {!report.is_active && (
                <Badge variant="outline" className="text-muted-foreground">
                  Paused
                </Badge>
              )}
            </div>
            
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Mail className="h-4 w-4" />
                {report.recipients.length} recipient(s)
              </div>
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Next: {format(new Date(report.next_send_at), 'PP')}
              </div>
              {report.last_sent_at && (
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  Last sent: {formatDistanceToNow(new Date(report.last_sent_at), { addSuffix: true })}
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-2 mt-3">
              {report.recipients.slice(0, 3).map((email) => (
                <Badge key={email} variant="outline" className="text-xs">
                  {email}
                </Badge>
              ))}
              {report.recipients.length > 3 && (
                <Badge variant="outline" className="text-xs">
                  +{report.recipients.length - 3} more
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Switch
              checked={report.is_active}
              onCheckedChange={onToggleStatus}
              disabled={isLoading}
            />
          </div>
        </div>

        <Separator className="my-4" />

        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={onViewHistory}>
              <History className="h-4 w-4 mr-1" />
              History
            </Button>
            <Button variant="outline" size="sm" onClick={onSendNow} disabled={isLoading}>
              {isLoading ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Send className="h-4 w-4 mr-1" />
              )}
              Send Now
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive" onClick={onDelete}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
