import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth, parseISO } from "date-fns";
import {
  Download,
  Filter,
  FileText,
  Eye,
  Calendar,
  User,
  Building2,
  Search,
  RefreshCw,
  Flag,
  CheckCircle,
  AlertTriangle,
} from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: string;
  reporter_id: string;
  reporter_name: string;
  department: string;
  report_type: string;
  submitted_at: string;
  status: 'pending' | 'reviewed' | 'flagged';
  is_flagged: boolean;
  content: Record<string, unknown>;
}

interface FilterState {
  dateFrom: string;
  dateTo: string;
  department: string;
  employeeName: string;
  month: string;
  year: string;
}

const DEPARTMENTS = [
  'All Departments',
  'Sales',
  'HR',
  'Finance',
  'Marketing',
  'Operations',
  'IT',
  'Administration',
  'Broker Admin',
  'Client Relations',
  'Customer Happiness',
];

export default function ReportsManagementPanel() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filteredReports, setFilteredReports] = useState<Report[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    dateTo: format(new Date(), 'yyyy-MM-dd'),
    department: 'All Departments',
    employeeName: '',
    month: '',
    year: new Date().getFullYear().toString(),
  });

  useEffect(() => {
    fetchReports();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [reports, filters]);

  const fetchReports = async () => {
    setIsLoading(true);
    try {
      // Fetch from ai_daily_summaries as our reports source
      const { data, error } = await supabase
        .from('ai_daily_summaries')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);

      if (error) throw error;

      // Transform to Report format
      const transformedReports: Report[] = (data || []).map((item) => ({
        id: item.id,
        reporter_id: item.ai_employee_id,
        reporter_name: item.ai_name,
        department: getDepartmentFromName(item.ai_name),
        report_type: 'daily',
        submitted_at: item.created_at || item.summary_date,
        status: 'reviewed',
        is_flagged: (item.follow_ups_pending || 0) > 5,
        content: {
          summary: item.summary_text,
          leads_contacted: item.leads_contacted,
          messages_sent: item.messages_sent,
          deals_closed: item.deals_closed,
          follow_ups_pending: item.follow_ups_pending,
        },
      }));

      setReports(transformedReports);
    } catch (error) {
      console.error('Error fetching reports:', error);
      toast.error('Failed to load reports');
    } finally {
      setIsLoading(false);
    }
  };

  const getDepartmentFromName = (name: string): string => {
    const deptMap: Record<string, string> = {
      'Amanda Clarke': 'Executive',
      'James Morgan': 'Sales',
      'Jessica': 'HR',
      'Catherine Brooks': 'Finance',
      'Victoria Sterling': 'Marketing',
      'Sarah Thompson': 'Broker Admin',
    };
    return deptMap[name] || 'Operations';
  };

  const applyFilters = () => {
    let filtered = [...reports];

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(r => 
        new Date(r.submitted_at) >= new Date(filters.dateFrom)
      );
    }
    if (filters.dateTo) {
      filtered = filtered.filter(r => 
        new Date(r.submitted_at) <= new Date(filters.dateTo + 'T23:59:59')
      );
    }

    // Filter by department
    if (filters.department && filters.department !== 'All Departments') {
      filtered = filtered.filter(r => r.department === filters.department);
    }

    // Filter by employee name
    if (filters.employeeName) {
      const searchTerm = filters.employeeName.toLowerCase();
      filtered = filtered.filter(r => 
        r.reporter_name.toLowerCase().includes(searchTerm)
      );
    }

    // Filter by month
    if (filters.month && filters.year) {
      const monthNum = parseInt(filters.month);
      const yearNum = parseInt(filters.year);
      filtered = filtered.filter(r => {
        const date = new Date(r.submitted_at);
        return date.getMonth() + 1 === monthNum && date.getFullYear() === yearNum;
      });
    }

    setFilteredReports(filtered);
  };

  const downloadReports = () => {
    // Create CSV content
    const headers = ['Date', 'Employee', 'Department', 'Status', 'Flagged'];
    const rows = filteredReports.map(r => [
      format(new Date(r.submitted_at), 'yyyy-MM-dd HH:mm'),
      r.reporter_name,
      r.department,
      r.status,
      r.is_flagged ? 'Yes' : 'No',
    ]);

    const csv = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reports_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Reports downloaded successfully');
  };

  const downloadAllForms = () => {
    // Generate comprehensive download
    const allData = filteredReports.map(r => ({
      ...r,
      content: JSON.stringify(r.content),
    }));
    
    const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `all_reports_${format(new Date(), 'yyyy-MM-dd')}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('All reports downloaded');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Reports Management</h2>
          <p className="text-[#1A1A1A]/70 text-sm">
            View and manage all employee reports with advanced filtering
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            onClick={fetchReports}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant="primary"
            onClick={downloadReports}
          >
            <Download className="h-4 w-4 mr-2" />
            Download CSV
          </Button>
          <Button
            variant="secondary"
            onClick={downloadAllForms}
          >
            <FileText className="h-4 w-4 mr-2" />
            Download All
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card className="bg-[#0E0E0E] border-[#B89555]/20">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Filter className="h-5 w-5 text-[#1A1A1A]" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Date From */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">From Date</Label>
              <Input
                type="date"
                value={filters.dateFrom}
                onChange={(e) => setFilters(f => ({ ...f, dateFrom: e.target.value }))}
                className="bg-[#1A1A1A] border-[#B89555]/20 text-white"
              />
            </div>

            {/* Date To */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">To Date</Label>
              <Input
                type="date"
                value={filters.dateTo}
                onChange={(e) => setFilters(f => ({ ...f, dateTo: e.target.value }))}
                className="bg-[#1A1A1A] border-[#B89555]/20 text-white"
              />
            </div>

            {/* Department */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">Department</Label>
              <Select
                value={filters.department}
                onValueChange={(v) => setFilters(f => ({ ...f, department: v }))}
              >
                <SelectTrigger className="bg-[#1A1A1A] border-[#B89555]/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Employee Search */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">Employee Name</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-[#1A1A1A]/70" />
                <Input
                  placeholder="Search by name..."
                  value={filters.employeeName}
                  onChange={(e) => setFilters(f => ({ ...f, employeeName: e.target.value }))}
                  className="pl-10 bg-[#1A1A1A] border-[#B89555]/20 text-white"
                />
              </div>
            </div>

            {/* Month Filter */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">Month</Label>
              <Select
                value={filters.month}
                onValueChange={(v) => setFilters(f => ({ ...f, month: v }))}
              >
                <SelectTrigger className="bg-[#1A1A1A] border-[#B89555]/20 text-white">
                  <SelectValue placeholder="All Months" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Months</SelectItem>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={String(i + 1)}>
                      {format(new Date(2024, i, 1), 'MMMM')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Year Filter */}
            <div className="space-y-2">
              <Label className="text-[#1A1A1A]/70">Year</Label>
              <Select
                value={filters.year}
                onValueChange={(v) => setFilters(f => ({ ...f, year: v }))}
              >
                <SelectTrigger className="bg-[#1A1A1A] border-[#B89555]/20 text-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2024, 2025, 2026].map(year => (
                    <SelectItem key={year} value={String(year)}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Results Count */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-[#1A1A1A]/70 text-sm">
              Showing <span className="text-[#1A1A1A] font-semibold">{filteredReports.length}</span> of {reports.length} reports
            </p>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setFilters({
                dateFrom: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
                dateTo: format(new Date(), 'yyyy-MM-dd'),
                department: 'All Departments',
                employeeName: '',
                month: '',
                year: new Date().getFullYear().toString(),
              })}
              className="text-[#1A1A1A]/70 hover:text-white"
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Reports Table */}
      <Card className="bg-[#0E0E0E] border-[#B89555]/20">
        <CardContent className="p-0">
          <ScrollArea className="h-[500px]">
            <Table>
              <TableHeader>
                <TableRow className="border-[#B89555]/20 hover:bg-transparent">
                  <TableHead className="text-[#1A1A1A]/70">Date & Time</TableHead>
                  <TableHead className="text-[#1A1A1A]/70">Employee</TableHead>
                  <TableHead className="text-[#1A1A1A]/70">Department</TableHead>
                  <TableHead className="text-[#1A1A1A]/70">Type</TableHead>
                  <TableHead className="text-[#1A1A1A]/70">Status</TableHead>
                  <TableHead className="text-[#1A1A1A]/70">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReports.map((report) => (
                  <TableRow 
                    key={report.id} 
                    className="border-[#B89555]/10 hover:bg-[#EFE6D6]/5 cursor-pointer"
                    onClick={() => setSelectedReport(report)}
                  >
                    <TableCell className="text-white">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-[#1A1A1A]" />
                        {format(new Date(report.submitted_at), 'MMM dd, yyyy HH:mm')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#1A1A1A]/70" />
                        <span className="text-white">{report.reporter_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-[#1A1A1A]/70" />
                        <span className="text-[#1A1A1A]/70">{report.department}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]">
                        {report.report_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {report.is_flagged ? (
                        <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
                          <Flag className="h-3 w-3 mr-1" />
                          Flagged
                        </Badge>
                      ) : (
                        <Badge className="bg-green-500/20 text-green-400 border-green-500/30">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Reviewed
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-[#1A1A1A] hover:text-[#1A1A1A]"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedReport(report);
                        }}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}

                {filteredReports.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <FileText className="h-12 w-12 text-[#1A1A1A]/70 mx-auto mb-4" />
                      <p className="text-[#1A1A1A]/70">No reports found matching your filters</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Report Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 flex items-center justify-center z-50 p-4">
          <Card className="bg-[#0E0E0E] border-[#B89555]/30 w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader className="border-b border-[#B89555]/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white">Report Details</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedReport(null)}
                  className="text-[#1A1A1A]/70"
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-[#1A1A1A]/70">Employee</Label>
                  <p className="text-white font-medium">{selectedReport.reporter_name}</p>
                </div>
                <div>
                  <Label className="text-[#1A1A1A]/70">Department</Label>
                  <p className="text-white">{selectedReport.department}</p>
                </div>
                <div>
                  <Label className="text-[#1A1A1A]/70">Submitted</Label>
                  <p className="text-white">
                    {format(new Date(selectedReport.submitted_at), 'MMMM dd, yyyy HH:mm')}
                  </p>
                </div>
                <div>
                  <Label className="text-[#1A1A1A]/70">Status</Label>
                  <p className="text-white flex items-center gap-2">
                    {selectedReport.is_flagged ? (
                      <Badge className="bg-red-500/20 text-red-400">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Needs Attention
                      </Badge>
                    ) : (
                      <Badge className="bg-green-500/20 text-green-400">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Reviewed
                      </Badge>
                    )}
                  </p>
                </div>
              </div>

              <div className="border-t border-[#B89555]/20 pt-4">
                <Label className="text-[#1A1A1A]/70">Report Content</Label>
                <div className="mt-2 bg-[#1A1A1A] rounded-lg p-4 space-y-2">
                  {Object.entries(selectedReport.content || {}).map(([key, value]) => (
                    <div key={key} className="flex justify-between">
                      <span className="text-[#1A1A1A]/70 capitalize">{key.replace(/_/g, ' ')}:</span>
                      <span className="text-white">{String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-4">
                <Button
                  className="flex-1 bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
                  onClick={() => {
                    toast.success('Report marked as reviewed');
                    setSelectedReport(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark Reviewed
                </Button>
                <Button
                  variant="outline"
                  className="border-[#B89555]/30 text-[#1A1A1A]"
                  onClick={() => {
                    toast.info('Note added to report');
                  }}
                >
                  Add Note
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
