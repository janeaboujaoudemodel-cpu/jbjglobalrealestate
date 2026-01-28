import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useHRApprovals, ApprovalRequest } from "@/hooks/useHRApprovals";
import { format } from "date-fns";
import { 
  CheckCircle, XCircle, Clock, User, ArrowRight,
  FileText, DollarSign, Briefcase, GraduationCap
} from "lucide-react";

const REQUEST_TYPE_CONFIG: Record<string, { label: string; icon: React.ElementType; color: string }> = {
  leave_request: { label: 'Leave Request', icon: Clock, color: 'bg-blue-100 text-blue-700' },
  expense_claim: { label: 'Expense Claim', icon: DollarSign, color: 'bg-emerald-100 text-emerald-700' },
  document_request: { label: 'Document Request', icon: FileText, color: 'bg-purple-100 text-purple-700' },
  salary_advance: { label: 'Salary Advance', icon: DollarSign, color: 'bg-amber-100 text-amber-700' },
  equipment_request: { label: 'Equipment', icon: Briefcase, color: 'bg-zinc-100 text-zinc-700' },
  training_request: { label: 'Training', icon: GraduationCap, color: 'bg-pink-100 text-pink-700' },
};

const StageIndicator = ({ request }: { request: ApprovalRequest }) => {
  const stages = [
    { num: 1, label: 'Manager', status: request.stage1_status },
    { num: 2, label: 'HR', status: request.stage2_status },
    { num: 3, label: 'Owner', status: request.stage3_status },
  ];

  return (
    <div className="flex items-center gap-1">
      {stages.map((stage, idx) => (
        <div key={stage.num} className="flex items-center">
          <div 
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              stage.status === 'approved' 
                ? 'bg-emerald-500 text-white' 
                : stage.status === 'rejected'
                ? 'bg-red-500 text-white'
                : request.current_stage === stage.num
                ? 'bg-amber-500 text-white'
                : 'bg-zinc-200 text-zinc-500'
            }`}
          >
            {stage.status === 'approved' ? (
              <CheckCircle className="h-4 w-4" />
            ) : stage.status === 'rejected' ? (
              <XCircle className="h-4 w-4" />
            ) : (
              stage.num
            )}
          </div>
          {idx < 2 && (
            <ArrowRight className={`h-4 w-4 mx-1 ${
              stage.status === 'approved' ? 'text-emerald-500' : 'text-zinc-300'
            }`} />
          )}
        </div>
      ))}
    </div>
  );
};

const StatusBadge = ({ status }: { status: string }) => {
  const config: Record<string, { color: string; label: string }> = {
    pending: { color: 'bg-amber-100 text-amber-700', label: 'Pending' },
    approved: { color: 'bg-emerald-100 text-emerald-700', label: 'Approved' },
    rejected: { color: 'bg-red-100 text-red-700', label: 'Rejected' },
  };
  const cfg = config[status] || config.pending;
  return <Badge className={cfg.color}>{cfg.label}</Badge>;
};

export function ApprovalWorkflowPanel() {
  const { approvals, loading, processApproval } = useHRApprovals();

  const pendingApprovals = approvals.filter(a => a.overall_status === 'pending');
  const approvedRequests = approvals.filter(a => a.overall_status === 'approved');
  const rejectedRequests = approvals.filter(a => a.overall_status === 'rejected');

  const handleApproval = async (request: ApprovalRequest, approved: boolean) => {
    const stage = request.current_stage as 1 | 2 | 3;
    await processApproval(request.id, stage, approved);
  };

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
          <h2 className="text-2xl font-bold text-black">Approval Workflow</h2>
          <p className="text-zinc-500 text-sm">Multi-stage approval tracking: Manager → HR → Owner</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Pending Your Approval</p>
                <p className="text-2xl font-bold text-amber-600">{pendingApprovals.length}</p>
              </div>
              <Clock className="h-8 w-8 text-amber-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Approved</p>
                <p className="text-2xl font-bold text-emerald-600">{approvedRequests.length}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-emerald-500/50" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-white border-zinc-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-zinc-500 text-xs">Rejected</p>
                <p className="text-2xl font-bold text-red-600">{rejectedRequests.length}</p>
              </div>
              <XCircle className="h-8 w-8 text-red-500/50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="pending" className="space-y-4">
        <TabsList className="bg-zinc-100 border border-zinc-200">
          <TabsTrigger value="pending" className="data-[state=active]:bg-white">
            <Clock className="h-4 w-4 mr-2" />
            Pending ({pendingApprovals.length})
          </TabsTrigger>
          <TabsTrigger value="approved" className="data-[state=active]:bg-white">
            <CheckCircle className="h-4 w-4 mr-2" />
            Approved
          </TabsTrigger>
          <TabsTrigger value="rejected" className="data-[state=active]:bg-white">
            <XCircle className="h-4 w-4 mr-2" />
            Rejected
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending">
          <Card className="bg-white border-zinc-200">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-500" />
                Pending Approvals
              </CardTitle>
            </CardHeader>
            <CardContent>
              {pendingApprovals.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-emerald-400" />
                  <p>All caught up! No pending approvals.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-200">
                      <TableHead>Requester</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Request</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingApprovals.map(request => {
                      const typeConfig = REQUEST_TYPE_CONFIG[request.request_type] || REQUEST_TYPE_CONFIG.document_request;
                      const TypeIcon = typeConfig.icon;
                      
                      return (
                        <TableRow key={request.id} className="border-zinc-100 hover:bg-zinc-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-zinc-400" />
                              <div>
                                <p className="font-medium text-black">{request.requester_name}</p>
                                <p className="text-xs text-zinc-500">{request.department}</p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeConfig.color}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <p className="font-medium text-black">{request.title}</p>
                            {request.description && (
                              <p className="text-xs text-zinc-500 truncate max-w-[200px]">{request.description}</p>
                            )}
                          </TableCell>
                          <TableCell>
                            {request.amount ? (
                              <span className="font-bold text-black">
                                {request.currency} {request.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <StageIndicator request={request} />
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
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
                                variant="outline"
                                className="text-red-600 border-red-200 hover:bg-red-50"
                                onClick={() => handleApproval(request, false)}
                              >
                                <XCircle className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="approved">
          <Card className="bg-white border-zinc-200">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
                Approved Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {approvedRequests.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>No approved requests yet.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-200">
                      <TableHead>Requester</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Request</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Approved</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {approvedRequests.map(request => {
                      const typeConfig = REQUEST_TYPE_CONFIG[request.request_type] || REQUEST_TYPE_CONFIG.document_request;
                      const TypeIcon = typeConfig.icon;
                      
                      return (
                        <TableRow key={request.id} className="border-zinc-100 hover:bg-zinc-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-zinc-400" />
                              <p className="font-medium text-black">{request.requester_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeConfig.color}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-black">{request.title}</TableCell>
                          <TableCell>
                            {request.amount ? (
                              <span className="font-bold text-black">
                                {request.currency} {request.amount.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-zinc-400">-</span>
                            )}
                          </TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {request.stage3_decision_at ? format(new Date(request.stage3_decision_at), 'MMM dd, yyyy') : '-'}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rejected">
          <Card className="bg-white border-zinc-200">
            <CardHeader>
              <CardTitle className="text-black flex items-center gap-2">
                <XCircle className="h-5 w-5 text-red-500" />
                Rejected Requests
              </CardTitle>
            </CardHeader>
            <CardContent>
              {rejectedRequests.length === 0 ? (
                <div className="text-center py-12 text-zinc-500">
                  <p>No rejected requests.</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="border-zinc-200">
                      <TableHead>Requester</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Request</TableHead>
                      <TableHead>Rejected At</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {rejectedRequests.map(request => {
                      const typeConfig = REQUEST_TYPE_CONFIG[request.request_type] || REQUEST_TYPE_CONFIG.document_request;
                      const TypeIcon = typeConfig.icon;
                      
                      return (
                        <TableRow key={request.id} className="border-zinc-100 hover:bg-zinc-50">
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-zinc-400" />
                              <p className="font-medium text-black">{request.requester_name}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={typeConfig.color}>
                              <TypeIcon className="h-3 w-3 mr-1" />
                              {typeConfig.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-black">{request.title}</TableCell>
                          <TableCell className="text-zinc-500 text-sm">
                            {format(new Date(request.created_at), 'MMM dd, yyyy')}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
