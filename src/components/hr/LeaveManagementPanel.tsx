import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHRLeave, LeaveRequest } from "@/hooks/useHRLeave";
import { format, differenceInDays } from "date-fns";
import { 
  Calendar, Clock, CheckCircle, XCircle, AlertCircle, 
  Plus, FileText, User, Building2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";

const LEAVE_TYPES = [
  { value: 'annual', label: 'Annual Leave', days: 30 },
  { value: 'sick', label: 'Sick Leave', days: 15 },
  { value: 'unpaid', label: 'Unpaid Leave', days: 30 },
  { value: 'maternity', label: 'Maternity Leave', days: 60 },
  { value: 'paternity', label: 'Paternity Leave', days: 5 },
  { value: 'emergency', label: 'Emergency Leave', days: 5 },
  { value: 'bereavement', label: 'Bereavement Leave', days: 5 },
] as const;

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: 'bg-amber-500/20 text-amber-600 border-amber-500/30', icon: Clock, label: 'Pending' },
    manager_approved: { color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: CheckCircle, label: 'Manager Approved' },
    hr_approved: { color: 'bg-purple-500/20 text-purple-600 border-purple-500/30', icon: CheckCircle, label: 'HR Approved' },
    owner_approved: { color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', icon: CheckCircle, label: 'Approved' },
    rejected: { color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: XCircle, label: 'Rejected' },
    cancelled: { color: 'bg-muted text-muted-foreground border-border', icon: XCircle, label: 'Cancelled' },
  };
  const cfg = config[status] || config.pending;
  const Icon = cfg.icon;
  return (
    <Badge className={`${cfg.color} border`}>
      <Icon className="h-3 w-3 mr-1" />
      {cfg.label}
    </Badge>
  );
};

const StageBadge = ({ stage }: { stage: string }) => {
  const stages: Record<string, { color: string; label: string }> = {
    manager: { color: 'bg-amber-100 text-amber-700', label: '1. Manager' },
    hr: { color: 'bg-blue-100 text-blue-700', label: '2. HR' },
    owner: { color: 'bg-purple-100 text-purple-700', label: '3. Owner' },
    completed: { color: 'bg-emerald-100 text-emerald-700', label: 'Completed' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  };
  const cfg = stages[stage] || stages.manager;
  return <Badge className={cfg.color}>{cfg.label}</Badge>;
};

export function LeaveManagementPanel() {
  const { policies, requests, loading, submitLeaveRequest, approveLeaveRequest } = useHRLeave();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState("");
  const [selectedRequest, setSelectedRequest] = useState<LeaveRequest | null>(null);
  const [formData, setFormData] = useState({
    leave_type: 'annual' as const,
    start_date: '',
    end_date: '',
    reason: ''
  });

  const handleSubmit = async () => {
    if (!formData.start_date || !formData.end_date) {
      toast.error('Please select start and end dates');
      return;
    }

    const result = await submitLeaveRequest({
      leave_type: formData.leave_type,
      start_date: formData.start_date,
      end_date: formData.end_date,
      reason: formData.reason
    });

    if (result) {
      setIsDialogOpen(false);
      setFormData({ leave_type: 'annual', start_date: '', end_date: '', reason: '' });
    }
  };

  const handleApproval = async (request: LeaveRequest, approved: boolean) => {
    const stage = request.current_stage as 'manager' | 'hr' | 'owner';
    await approveLeaveRequest(request.id, stage, approved, approvalNotes);
    setApprovalNotes("");
    setSelectedRequest(null);
  };

  const calculateDays = () => {
    if (formData.start_date && formData.end_date) {
      const days = differenceInDays(new Date(formData.end_date), new Date(formData.start_date)) + 1;
      return days > 0 ? days : 0;
    }
    return 0;
  };

  const pendingApprovals = requests.filter(r => 
    r.status === 'pending' || r.status === 'manager_approved' || r.status === 'hr_approved'
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Leave Management</h2>
          <p className="text-muted-foreground text-sm">Manage employee leave requests and approvals</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="primary">
              <Plus className="w-4 h-4 mr-2" />
              New Leave Request
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Submit Leave Request</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label>Leave Type</Label>
                <Select 
                  value={formData.leave_type} 
                  onValueChange={(v) => setFormData(prev => ({ ...prev, leave_type: v as typeof formData.leave_type }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEAVE_TYPES.map(type => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label} ({type.days} days/year)
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Start Date</Label>
                  <Input 
                    type="date" 
                    value={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>End Date</Label>
                  <Input 
                    type="date" 
                    value={formData.end_date}
                    min={formData.start_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, end_date: e.target.value }))}
                  />
                </div>
              </div>

              {calculateDays() > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-blue-700 font-medium">
                    Total Days: {calculateDays()} day{calculateDays() > 1 ? 's' : ''}
                  </p>
                </div>
              )}

              <div className="space-y-2">
                <Label>Reason (Optional)</Label>
                <Textarea 
                  placeholder="Enter reason for leave..."
                  value={formData.reason}
                  onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Approval Workflow</p>
                    <p>Your request will go through: Manager → HR → Owner</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  variant="primary"
                  disabled={!formData.start_date || !formData.end_date}
                >
                  Submit Request
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Pending Approvals</p>
                <p className="text-2xl font-bold text-amber-600">{pendingApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Approved This Month</p>
                <p className="text-2xl font-bold text-emerald-600">
                  {requests.filter(r => r.status === 'owner_approved').length}
                </p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Rejected</p>
                <p className="text-2xl font-bold text-red-600">
                  {requests.filter(r => r.status === 'rejected').length}
                </p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Total Requests</p>
                <p className="text-2xl font-bold text-foreground">{requests.length}</p>
              </div>
              <FileText className="h-8 w-8 text-muted-foreground/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-gradient-to-r from-[#F7F1E6] to-[#ECE2D2] border-2 border-[#B89555]/30">
          <TabsTrigger value="pending" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <Clock className="h-4 w-4 mr-2" />
            Pending Approvals ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="all" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <FileText className="h-4 w-4 mr-2" />
            All Requests
          </TabsTrigger>
          <TabsTrigger value="policies" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A] data-[state=active]:border-[#B89555]/40">
            <Calendar className="h-4 w-4 mr-2" />
            Leave Policies
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Approval Queue
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                  <p>All caught up! No pending approvals.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-border">
                      <TableHead>Employee</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Dates</TableHead>
                      <TableHead>Days</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map(request => (
                      <TableRow key={request.id} className="border-border hover:bg-muted/50">
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4 text-muted-foreground" />
                            <div>
                              <p className="font-medium text-foreground">{request.employee_name}</p>
                              <p className="text-xs text-muted-foreground">{request.department}</p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {request.leave_type.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd, yyyy')}
                        </TableCell>
                        <TableCell className="font-bold text-foreground">{request.total_days}</TableCell>
                        <TableCell>
                          <StageBadge stage={request.current_stage} />
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={request.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              size="sm" 
                              className="bg-emerald-500 hover:bg-emerald-600 text-white"
                              onClick={() => handleApproval(request, true)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="secondary"
                              className="text-red-600 border-red-200 hover:bg-red-50"
                              onClick={() => handleApproval(request, false)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="all">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <FileText className="h-5 w-5 text-[#1A1A1A]" />
                All Leave Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Employee</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Dates</TableHead>
                    <TableHead>Days</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Submitted</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map(request => (
                    <TableRow key={request.id} className="border-border hover:bg-muted/50">
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-muted-foreground" />
                          <div>
                            <p className="font-medium text-foreground">{request.employee_name}</p>
                            <p className="text-xs text-muted-foreground">{request.department}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="capitalize">
                          {request.leave_type.replace('_', ' ')}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(request.start_date), 'MMM dd')} - {format(new Date(request.end_date), 'MMM dd')}
                      </TableCell>
                      <TableCell className="font-bold text-foreground">{request.total_days}</TableCell>
                      <TableCell>
                        <StatusBadge status={request.status} />
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {format(new Date(request.created_at), 'MMM dd, yyyy')}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="policies">
          <Card>
            <CardHeader>
              <CardTitle className="text-foreground flex items-center gap-2">
                <Calendar className="h-5 w-5 text-[#1A1A1A]" />
                Leave Policies (UAE Standard)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-border">
                    <TableHead>Leave Type</TableHead>
                    <TableHead>Annual Entitlement</TableHead>
                    <TableHead>Carryover</TableHead>
                    <TableHead>Notice Required</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {LEAVE_TYPES.map(type => (
                    <TableRow key={type.value} className="border-border hover:bg-muted/50">
                      <TableCell className="font-medium text-foreground">{type.label}</TableCell>
                      <TableCell>{type.days} days</TableCell>
                      <TableCell>{type.value === 'annual' ? 'Up to 5 days' : 'No'}</TableCell>
                      <TableCell>{type.value === 'emergency' ? 'Same day' : '7 days'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
