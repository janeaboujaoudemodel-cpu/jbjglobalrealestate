import { useState } from "react";
import { 
  DollarSign, TrendingUp, Users, 
  CheckCircle, Clock, XCircle, Download,
  Wallet, CreditCard, BarChart3
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { useEmployeeSalaries } from "@/hooks/useEmployeeSalaries";
import { format } from "date-fns";

const formatCurrency = (amount: number, currency: string = 'AED') => {
  return new Intl.NumberFormat('en-AE', {
    style: 'currency', currency, minimumFractionDigits: 0, maximumFractionDigits: 0,
  }).format(amount);
};

const StatusBadge = ({ status }: { status: string }) => {
  const config = {
    pending: { color: 'bg-amber-500/20 text-amber-600 border-amber-500/30', icon: Clock },
    approved: { color: 'bg-blue-500/20 text-blue-600 border-blue-500/30', icon: CheckCircle },
    paid: { color: 'bg-emerald-500/20 text-emerald-600 border-emerald-500/30', icon: CheckCircle },
    cancelled: { color: 'bg-red-500/20 text-red-600 border-red-500/30', icon: XCircle },
  }[status] || { color: 'bg-[#EFE6D6] text-[#1A1A1A]/70', icon: Clock };
  const Icon = config.icon;
  return <Badge className={`${config.color} capitalize`}><Icon className="h-3 w-3 mr-1" />{status}</Badge>;
};

export function EmployeeSalaryCommissionPanel() {
  const { salaries, commissions, payments, summaries, loading, approveCommission, markCommissionPaid } = useEmployeeSalaries();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const totalSalaries = salaries.reduce((sum, s) => sum + (s.base_salary || 0), 0);
  const totalPending = commissions.filter(c => c.status === 'pending').reduce((sum, c) => sum + (c.commission_amount || 0), 0);
  const totalPaid = commissions.filter(c => c.status === 'paid').reduce((sum, c) => sum + (c.commission_amount || 0), 0);

  const filteredCommissions = commissions.filter(c => {
    if (search && !c.employee_name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter !== 'all' && c.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#B89555]"></div></div>;
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-[#FDFBF7] border-[#B89555]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-sm">Monthly Payroll</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{formatCurrency(totalSalaries)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-[#B89555]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-sm">Pending Commissions</p>
                <p className="text-2xl font-bold text-amber-600">{formatCurrency(totalPending)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                <Clock className="h-6 w-6 text-amber-600" />
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-[#FDFBF7] border-[#B89555]/30">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[#1A1A1A]/70 text-sm">Commissions Paid</p>
                <p className="text-2xl font-bold text-emerald-600">{formatCurrency(totalPaid)}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-center">
        <Input placeholder="Search by employee..." value={search} onChange={(e) => setSearch(e.target.value)} className="max-w-md bg-[#FDFBF7] border-[#B89555]/30" />
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40 bg-[#FDFBF7] border-[#B89555]/30"><SelectValue placeholder="All" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="paid">Paid</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="outline" className="border-[#B89555]/30"><Download className="h-4 w-4 mr-2" />Export</Button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="commissions" className="space-y-4">
        <TabsList className="bg-[#F7F2EA] border border-[#B89555]/30">
          <TabsTrigger value="commissions" className="data-[state=active]:bg-[#FDFBF7]"><TrendingUp className="h-4 w-4 mr-2" />Commissions</TabsTrigger>
          <TabsTrigger value="salaries" className="data-[state=active]:bg-[#FDFBF7]"><Wallet className="h-4 w-4 mr-2" />Salaries</TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-[#FDFBF7]"><CreditCard className="h-4 w-4 mr-2" />Payments</TabsTrigger>
          <TabsTrigger value="summary" className="data-[state=active]:bg-[#FDFBF7]"><BarChart3 className="h-4 w-4 mr-2" />Summary</TabsTrigger>
        </TabsList>

        <TabsContent value="commissions">
          <Card className="bg-[#FDFBF7] border-[#B89555]/30">
            <CardHeader><CardTitle className="text-[#1A1A1A] flex items-center gap-2"><TrendingUp className="h-5 w-5 text-[#1A1A1A]" />Commission Tracker</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#B89555]/30">
                    <TableHead className="text-[#1A1A1A]/70">Employee</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Deal</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Amount</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Date</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Status</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCommissions.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-[#1A1A1A]/70 py-8">No commission records</TableCell></TableRow>
                  ) : filteredCommissions.map((c) => (
                    <TableRow key={c.id} className="border-[#B89555]/30 hover:bg-[#F7F2EA]">
                      <TableCell className="font-medium text-[#1A1A1A]">{c.employee_name}</TableCell>
                      <TableCell className="text-[#1A1A1A]/70">{c.deal_reference || '-'}</TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">{formatCurrency(c.commission_amount || 0, c.currency || 'AED')}</TableCell>
                      <TableCell className="text-[#1A1A1A]/70">{c.deal_closed_date ? format(new Date(c.deal_closed_date), 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell><StatusBadge status={c.status || 'pending'} /></TableCell>
                      <TableCell>
                        {c.status === 'pending' && <Button size="sm" variant="outline" onClick={() => approveCommission(c.id)} className="text-blue-600 border-blue-200">Approve</Button>}
                        {c.status === 'approved' && <Button size="sm" variant="outline" onClick={() => markCommissionPaid(c.id)} className="text-emerald-600 border-emerald-200">Mark Paid</Button>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="salaries">
          <Card className="bg-[#FDFBF7] border-[#B89555]/30">
            <CardHeader><CardTitle className="text-[#1A1A1A] flex items-center gap-2"><Wallet className="h-5 w-5 text-[#1A1A1A]" />Salary Structure</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#B89555]/30">
                    <TableHead className="text-[#1A1A1A]/70">Employee</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Department</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Base Salary</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Effective Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {salaries.length === 0 ? (
                    <TableRow><TableCell colSpan={4} className="text-center text-[#1A1A1A]/70 py-8">No salary records</TableCell></TableRow>
                  ) : salaries.map((s) => (
                    <TableRow key={s.id} className="border-[#B89555]/30 hover:bg-[#F7F2EA]">
                      <TableCell className="font-medium text-[#1A1A1A]">{s.employee_name}</TableCell>
                      <TableCell><Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]/70">{s.department}</Badge></TableCell>
                      <TableCell className="text-right font-bold text-[#1A1A1A]">{formatCurrency(s.base_salary || 0, s.currency || 'AED')}</TableCell>
                      <TableCell className="text-[#1A1A1A]/70">{s.effective_date ? format(new Date(s.effective_date), 'MMM dd, yyyy') : '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card className="bg-[#FDFBF7] border-[#B89555]/30">
            <CardHeader><CardTitle className="text-[#1A1A1A] flex items-center gap-2"><CreditCard className="h-5 w-5 text-[#1A1A1A]" />Payment History</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#B89555]/30">
                    <TableHead className="text-[#1A1A1A]/70">Employee</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Type</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Amount</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Date</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Method</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {payments.length === 0 ? (
                    <TableRow><TableCell colSpan={5} className="text-center text-[#1A1A1A]/70 py-8">No payment records</TableCell></TableRow>
                  ) : payments.map((p) => (
                    <TableRow key={p.id} className="border-[#B89555]/30 hover:bg-[#F7F2EA]">
                      <TableCell className="font-medium text-[#1A1A1A]">{p.employee_name}</TableCell>
                      <TableCell><Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]/70 capitalize">{p.payment_type}</Badge></TableCell>
                      <TableCell className="text-right font-bold text-[#1A1A1A]">{formatCurrency(p.amount || 0, p.currency || 'AED')}</TableCell>
                      <TableCell className="text-[#1A1A1A]/70">{p.payment_date ? format(new Date(p.payment_date), 'MMM dd, yyyy') : '-'}</TableCell>
                      <TableCell className="text-[#1A1A1A]/70">{p.payment_method || '-'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary">
          <Card className="bg-[#FDFBF7] border-[#B89555]/30">
            <CardHeader><CardTitle className="text-[#1A1A1A] flex items-center gap-2"><Users className="h-5 w-5 text-[#1A1A1A]" />Earnings Summary</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-[#B89555]/30">
                    <TableHead className="text-[#1A1A1A]/70">Employee</TableHead>
                    <TableHead className="text-[#1A1A1A]/70">Department</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Salary</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Commission</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Bonus</TableHead>
                    <TableHead className="text-[#1A1A1A]/70 text-right">Net Earnings</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {summaries.length === 0 ? (
                    <TableRow><TableCell colSpan={6} className="text-center text-[#1A1A1A]/70 py-8">No earnings data</TableCell></TableRow>
                  ) : summaries.map((s) => (
                    <TableRow key={s.id} className="border-[#B89555]/30 hover:bg-[#F7F2EA]">
                      <TableCell className="font-medium text-[#1A1A1A]">{s.employee_name}</TableCell>
                      <TableCell><Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]/70">{s.department}</Badge></TableCell>
                      <TableCell className="text-right text-[#1A1A1A]">{formatCurrency(s.total_salary || 0, s.currency || 'AED')}</TableCell>
                      <TableCell className="text-right text-emerald-600">{formatCurrency(s.total_commission || 0, s.currency || 'AED')}</TableCell>
                      <TableCell className="text-right text-blue-600">{formatCurrency(s.total_bonus || 0, s.currency || 'AED')}</TableCell>
                      <TableCell className="text-right font-bold text-[#1A1A1A]">{formatCurrency(s.net_earnings || 0, s.currency || 'AED')}</TableCell>
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
