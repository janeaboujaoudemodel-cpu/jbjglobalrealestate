import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHRWarnings, Warning } from "@/hooks/useHRWarnings";
import { format } from "date-fns";
import { 
  AlertTriangle, Plus, User, FileText, Clock, 
  CheckCircle, XCircle, AlertCircle, Pen
} from "lucide-react";
import { toast } from "sonner";

const WARNING_TYPES = [
  { value: 'verbal', label: 'Verbal Warning', color: 'bg-amber-100 text-amber-700', severity: 1 },
  { value: 'written', label: 'Written Warning', color: 'bg-orange-100 text-orange-700', severity: 2 },
  { value: 'final', label: 'Final Warning', color: 'bg-red-100 text-red-700', severity: 3 },
  { value: 'termination', label: 'Termination Notice', color: 'bg-red-200 text-red-800', severity: 4 },
] as const;

const WarningTypeBadge = ({ type }: { type: string }) => {
  const config = WARNING_TYPES.find(w => w.value === type) || WARNING_TYPES[0];
  return <Badge className={config.color}>{config.label}</Badge>;
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; icon: React.ElementType; label: string }> = {
    pending: { color: 'bg-amber-500/20 text-amber-600 border-amber-500/30', icon: Clock, label: 'Pending Signature' },
    acknowledged: { color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', icon: CheckCircle, label: 'Acknowledged' },
    disputed: { color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: XCircle, label: 'Disputed' },
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

export function WarningsPanel() {
  const { warnings, loading, issueWarning } = useHRWarnings();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_user_id: '',
    employee_name: '',
    department: '',
    warning_type: 'verbal' as 'verbal' | 'written' | 'final' | 'termination',
    subject: '',
    description: '',
    incident_date: ''
  });

  const handleSubmit = async () => {
    if (!formData.employee_name || !formData.subject || !formData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    const result = await issueWarning({
      employee_user_id: formData.employee_user_id || crypto.randomUUID(),
      employee_name: formData.employee_name,
      department: formData.department,
      warning_type: formData.warning_type,
      subject: formData.subject,
      description: formData.description,
      incident_date: formData.incident_date || undefined
    });

    if (result) {
      setIsDialogOpen(false);
      setFormData({
        employee_user_id: '',
        employee_name: '',
        department: '',
        warning_type: 'verbal',
        subject: '',
        description: '',
        incident_date: ''
      });
    }
  };

  const pendingWarnings = warnings.filter(w => w.status === 'pending');
  const acknowledgedWarnings = warnings.filter(w => w.status === 'acknowledged');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Employee Warnings</h2>
          <p className="text-muted-foreground text-sm">Issue and track employee disciplinary warnings</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700 text-white">
              <Plus className="w-4 h-4 mr-2" />
              Issue Warning
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-red-600">
                <AlertTriangle className="h-5 w-5" />
                Issue Employee Warning
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Employee Name *</Label>
                  <Input 
                    placeholder="Enter employee name"
                    value={formData.employee_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, employee_name: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Department</Label>
                  <Input 
                    placeholder="Department"
                    value={formData.department}
                    onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Warning Type *</Label>
                  <Select 
                    value={formData.warning_type} 
                    onValueChange={(v) => setFormData(prev => ({ ...prev, warning_type: v as typeof formData.warning_type }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {WARNING_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Incident Date</Label>
                  <Input 
                    type="date"
                    value={formData.incident_date}
                    onChange={(e) => setFormData(prev => ({ ...prev, incident_date: e.target.value }))}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Subject *</Label>
                <Input 
                  placeholder="Warning subject..."
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                />
              </div>

              <div className="space-y-2">
                <Label>Description *</Label>
                <Textarea 
                  placeholder="Detailed description of the incident or behavior..."
                  className="min-h-[120px]"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div className="text-sm text-amber-700">
                    <p className="font-medium">Employee Notification</p>
                    <p>The employee will be notified and required to acknowledge this warning with their digital signature.</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleSubmit}
                  className="bg-red-600 hover:bg-red-700 text-white"
                  disabled={!formData.employee_name || !formData.subject || !formData.description}
                >
                  Issue Warning
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
                <p className="text-muted-foreground text-xs">Pending Signature</p>
                <p className="text-2xl font-bold text-amber-600">{pendingWarnings.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Acknowledged</p>
                <p className="text-2xl font-bold text-emerald-600">{acknowledgedWarnings.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Verbal Warnings</p>
                <p className="text-2xl font-bold text-amber-600">
                  {warnings.filter(w => w.warning_type === 'verbal').length}
                </p>
              </div>
              <AlertCircle className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-muted-foreground text-xs">Written/Final</p>
                <p className="text-2xl font-bold text-red-600">
                  {warnings.filter(w => w.warning_type === 'written' || w.warning_type === 'final').length}
                </p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Warnings Table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-foreground flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            All Warnings
          </CardTitle>
        </CardHeader>
        <CardContent>
          {warnings.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
              <p>No warnings on record.</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead>Employee</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Incident Date</TableHead>
                  <TableHead>Issued By</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Signed</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {warnings.map(warning => (
                  <TableRow key={warning.id} className="border-border hover:bg-muted/50">
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-foreground">{warning.employee_name}</p>
                          <p className="text-xs text-muted-foreground">{warning.department}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <WarningTypeBadge type={warning.warning_type} />
                    </TableCell>
                    <TableCell className="max-w-[200px]">
                      <p className="font-medium text-foreground truncate">{warning.subject}</p>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {warning.incident_date ? format(new Date(warning.incident_date), 'MMM dd, yyyy') : '-'}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {warning.issued_by_name || 'System'}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={warning.status} />
                    </TableCell>
                    <TableCell>
                      {warning.employee_signed_at ? (
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Pen className="h-4 w-4" />
                          <span className="text-sm">
                            {format(new Date(warning.employee_signed_at), 'MMM dd')}
                          </span>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">Pending</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
