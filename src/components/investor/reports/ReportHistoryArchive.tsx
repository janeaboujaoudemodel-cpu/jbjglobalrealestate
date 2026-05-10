import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { History, Eye, Download, Calendar, ArrowUpDown } from "lucide-react";
import { format } from "date-fns";
import { Report } from "./ReportCard";

interface ReportHistoryArchiveProps {
  accessedReports: (Report & { accessedAt: string })[];
  onViewReport: (report: Report) => void;
  onDownloadReport: (report: Report) => void;
}

export default function ReportHistoryArchive({
  accessedReports,
  onViewReport,
  onDownloadReport,
}: ReportHistoryArchiveProps) {
  const [sortOrder, setSortOrder] = useState<"newest" | "oldest">("newest");
  const [filterType, setFilterType] = useState<"all" | Report["type"]>("all");

  const sortedReports = [...accessedReports]
    .filter((r) => filterType === "all" || r.type === filterType)
    .sort((a, b) => {
      const dateA = new Date(a.accessedAt).getTime();
      const dateB = new Date(b.accessedAt).getTime();
      return sortOrder === "newest" ? dateB - dateA : dateA - dateB;
    });

  const getTypeBadge = (type: Report["type"]) => {
    const styles = {
      market: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      area: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      asset: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      advisory: "bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30",
    };
    const labels = {
      market: "Market",
      area: "Area",
      asset: "Asset",
      advisory: "Advisory",
    };
    return <Badge className={styles[type]}>{labels[type]}</Badge>;
  };

  return (
    <section className="space-y-4">
      <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
        <History className="w-5 h-5 text-[#1A1A1A]" />
        Report History & Archive
      </h2>
      <p className="text-muted-foreground text-sm">
        Previously accessed reports for your account. This is your personal history.
      </p>

      <Card className="border-2 border-[#B89555]/30">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <CardTitle className="text-base font-medium">Access History</CardTitle>
            <div className="flex gap-2">
              <Select value={filterType} onValueChange={(v) => setFilterType(v as typeof filterType)}>
                <SelectTrigger className="w-[140px] border-[#B89555]/30">
                  <SelectValue placeholder="Filter type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="market">Market</SelectItem>
                  <SelectItem value="area">Area</SelectItem>
                  <SelectItem value="asset">Asset</SelectItem>
                  <SelectItem value="advisory">Advisory</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                className="gap-1 border-[#B89555]/30"
                onClick={() => setSortOrder(sortOrder === "newest" ? "oldest" : "newest")}
              >
                <ArrowUpDown className="w-4 h-4" />
                {sortOrder === "newest" ? "Newest" : "Oldest"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {sortedReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <History className="w-10 h-10 mx-auto mb-3 opacity-50" />
              <p>No reports in your history yet.</p>
              <p className="text-sm">Reports you view will appear here.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Report</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Last Accessed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedReports.map((report) => (
                    <TableRow key={report.id}>
                      <TableCell className="font-medium max-w-[300px] truncate">
                        {report.title}
                      </TableCell>
                      <TableCell>{getTypeBadge(report.type)}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {format(new Date(report.accessedAt), "MMM d, yyyy")}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onViewReport(report)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDownloadReport(report)}
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </section>
  );
}
