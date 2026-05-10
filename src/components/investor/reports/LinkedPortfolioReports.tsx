import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { Briefcase, FileText, ArrowRight, Link2 } from "lucide-react";
import ReportCard, { Report } from "./ReportCard";

interface LinkedPortfolioReportsProps {
  linkedReports: Report[];
  hasLinkedAssets: boolean;
  onViewReport: (report: Report) => void;
  onDownloadReport: (report: Report) => void;
}

export default function LinkedPortfolioReports({
  linkedReports,
  hasLinkedAssets,
  onViewReport,
  onDownloadReport,
}: LinkedPortfolioReportsProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
          <Briefcase className="w-5 h-5 text-[#1A1A1A]" />
          Linked Reports from Portfolio
        </h2>
        <Badge variant="outline" className="border-[#B89555]/30 text-[#1A1A1A]">
          Auto-surfaced
        </Badge>
      </div>
      <p className="text-muted-foreground text-sm">
        Reports automatically linked to assets in your portfolio.
      </p>

      {hasLinkedAssets ? (
        linkedReports.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {linkedReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onView={onViewReport}
                onDownload={onDownloadReport}
              />
            ))}
          </div>
        ) : (
          <Card className="border-2 border-[#B89555]/30">
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">No linked reports yet</p>
              <p className="text-sm text-muted-foreground">
                Reports related to your portfolio assets will appear here as they become available.
              </p>
            </CardContent>
          </Card>
        )
      ) : (
        <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-gold/5 to-transparent">
          <CardContent className="p-8 text-center">
            <div className="w-16 h-16 bg-[#EFE6D6]/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <Link2 className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Link Assets to See Related Reports</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">
              Once you link properties to your portfolio, area and asset-specific reports 
              will automatically appear here for easy access.
            </p>
            <Link to="/investor-dashboard/portfolio">
              <Button variant="primary" className="gap-2">
                <Briefcase className="w-4 h-4" />
                Link Assets to Portfolio
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
