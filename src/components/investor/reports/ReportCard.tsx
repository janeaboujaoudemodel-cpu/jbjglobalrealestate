import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Download, Eye, Calendar, MapPin, Database } from "lucide-react";
import { format } from "date-fns";

export interface Report {
  id: string;
  title: string;
  type: "market" | "area" | "asset" | "advisory";
  geographicScope: "uae" | "dubai" | "abu-dhabi" | "sharjah" | "area" | "project";
  scopeLabel: string;
  dateIssued: string;
  dataSources: string[];
  fileUrl?: string;
}

interface ReportCardProps {
  report: Report;
  onView: (report: Report) => void;
  onDownload: (report: Report) => void;
}

export default function ReportCard({ report, onView, onDownload }: ReportCardProps) {
  const getTypeBadge = (type: Report["type"]) => {
    const styles = {
      market: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      area: "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      asset: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      advisory: "bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30",
    };
    const labels = {
      market: "Market Report",
      area: "Area Intelligence",
      asset: "Asset Report",
      advisory: "Advisory Report",
    };
    return <Badge className={styles[type]}>{labels[type]}</Badge>;
  };

  const getScopeBadge = (scope: Report["geographicScope"]) => {
    const styles = {
      uae: "bg-[#B89555]/10 text-[#1A1A1A]/70 border-[#B89555]/30/30",
      dubai: "bg-blue-500/10 text-blue-600 border-blue-500/30",
      "abu-dhabi": "bg-emerald-500/10 text-emerald-600 border-emerald-500/30",
      sharjah: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      area: "bg-purple-500/10 text-purple-600 border-purple-500/30",
      project: "bg-[#EFE6D6]/10 text-[#1A1A1A] border-[#B89555]/30",
    };
    return (
      <Badge variant="outline" className={styles[scope]}>
        <MapPin className="w-3 h-3 mr-1" />
        {report.scopeLabel}
      </Badge>
    );
  };

  const getDataSourceIcon = (source: string) => {
    return (
      <span
        key={source}
        className="inline-flex items-center gap-1 px-2 py-0.5 bg-muted rounded text-xs text-muted-foreground"
      >
        <Database className="w-3 h-3" />
        {source}
      </span>
    );
  };

  return (
    <Card className="border-2 border-[#B89555]/30 hover:border-[#B89555] transition-colors">
      <CardContent className="p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="w-12 h-12 bg-[#EFE6D6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
            <FileText className="w-6 h-6 text-[#1A1A1A]" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-semibold text-foreground line-clamp-2 mb-2">{report.title}</h3>
            <div className="flex flex-wrap gap-2">
              {getTypeBadge(report.type)}
              {getScopeBadge(report.geographicScope)}
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="w-4 h-4" />
          <span>Issued: {format(new Date(report.dateIssued), "MMMM d, yyyy")}</span>
        </div>

        {/* Data Sources */}
        <div className="space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-wide">Data Sources</p>
          <div className="flex flex-wrap gap-1">
            {report.dataSources.map((source) => getDataSourceIcon(source))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 pt-2 border-t border-border/50">
          <Button
            variant="primary"
            size="sm"
            className="flex-1 gap-1"
            onClick={() => onView(report)}
          >
            <Eye className="w-4 h-4" />
            View Report
          </Button>
          <Button
            variant="secondary"
            size="sm"
            className="gap-1"
            onClick={() => onDownload(report)}
          >
            <Download className="w-4 h-4" />
            PDF
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
