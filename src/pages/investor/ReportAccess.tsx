import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileText, Eye, FolderOpen, ArrowLeft, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

// Report Components
import ReportCategoryTabs, {
  ReportCategory,
  GeographicScope,
  DateRange,
} from "@/components/investor/reports/ReportCategoryTabs";
import ReportCard, { Report } from "@/components/investor/reports/ReportCard";
import LinkedPortfolioReports from "@/components/investor/reports/LinkedPortfolioReports";
import ReportMethodologyBlock from "@/components/investor/reports/ReportMethodologyBlock";
import ReportHistoryArchive from "@/components/investor/reports/ReportHistoryArchive";
import RequestReportSection from "@/components/investor/reports/RequestReportSection";
import ReportAccessFAQ from "@/components/investor/reports/ReportAccessFAQ";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

// Demo reports data
const DEMO_REPORTS: Report[] = [
  {
    id: "1",
    title: "UAE Real Estate Market Overview Q4 2025",
    type: "market",
    geographicScope: "uae",
    scopeLabel: "UAE-wide",
    dateIssued: "2025-12-15",
    dataSources: ["DLD", "RERA", "Dubai REST"],
  },
  {
    id: "2",
    title: "Dubai Residential Market Analysis - January 2026",
    type: "market",
    geographicScope: "dubai",
    scopeLabel: "Dubai",
    dateIssued: "2026-01-10",
    dataSources: ["DLD", "Dubai REST"],
  },
  {
    id: "3",
    title: "Dubai Marina Area Intelligence Report",
    type: "area",
    geographicScope: "area",
    scopeLabel: "Dubai Marina",
    dateIssued: "2026-01-05",
    dataSources: ["DLD", "RERA", "JBJ Analysis"],
  },
  {
    id: "4",
    title: "Business Bay Supply & Demand Analysis",
    type: "area",
    geographicScope: "area",
    scopeLabel: "Business Bay",
    dateIssued: "2025-12-20",
    dataSources: ["DLD", "JBJ Analysis"],
  },
  {
    id: "5",
    title: "Palm Jumeirah Premium Segment Report",
    type: "area",
    geographicScope: "area",
    scopeLabel: "Palm Jumeirah",
    dateIssued: "2025-11-30",
    dataSources: ["DLD", "Dubai REST", "JBJ Analysis"],
  },
  {
    id: "6",
    title: "Downtown Dubai Transaction Activity Summary",
    type: "area",
    geographicScope: "area",
    scopeLabel: "Downtown Dubai",
    dateIssued: "2026-01-08",
    dataSources: ["DLD", "RERA"],
  },
  {
    id: "7",
    title: "Abu Dhabi Real Estate Market Brief",
    type: "market",
    geographicScope: "abu-dhabi",
    scopeLabel: "Abu Dhabi",
    dateIssued: "2025-12-01",
    dataSources: ["ADDC", "Abu Dhabi Land"],
  },
  {
    id: "8",
    title: "Custom Investment Comparison: Marina vs JBR",
    type: "advisory",
    geographicScope: "area",
    scopeLabel: "Multi-Area",
    dateIssued: "2026-01-12",
    dataSources: ["JBJ Analysis", "DLD"],
  },
];

export default function ReportAccess() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [hasLinkedAssets, setHasLinkedAssets] = useState(false);

  // Filter states
  const [activeCategory, setActiveCategory] = useState<ReportCategory>("all");
  const [geographicScope, setGeographicScope] = useState<GeographicScope>("all");
  const [dateRange, setDateRange] = useState<DateRange>("all");

  // Report history (simulated)
  const [accessedReports, setAccessedReports] = useState<(Report & { accessedAt: string })[]>([]);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth?redirect=/investor-dashboard/reports");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  const fetchReportData = async () => {
    if (!user) return;
    setLoading(true);

    try {
      // Check if user has linked assets (favorites)
      const { data: favoritesData } = await supabase
        .from("favorites")
        .select("id")
        .eq("user_id", user.id)
        .limit(1);

      setHasLinkedAssets(favoritesData ? favoritesData.length > 0 : false);

      // Simulate some accessed reports for history
      setAccessedReports([
        { ...DEMO_REPORTS[0], accessedAt: "2026-01-20" },
        { ...DEMO_REPORTS[2], accessedAt: "2026-01-18" },
        { ...DEMO_REPORTS[3], accessedAt: "2026-01-15" },
      ]);
    } catch (error) {
      console.error("Error fetching report data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter reports based on current filters
  const filteredReports = useMemo(() => {
    return DEMO_REPORTS.filter((report) => {
      // Category filter
      if (activeCategory !== "all" && report.type !== activeCategory) {
        return false;
      }

      // Geographic scope filter
      if (geographicScope !== "all") {
        if (geographicScope === "uae" && report.geographicScope !== "uae") return false;
        if (geographicScope === "dubai" && !["dubai", "area", "project"].includes(report.geographicScope)) return false;
        if (geographicScope === "abu-dhabi" && report.geographicScope !== "abu-dhabi") return false;
        if (geographicScope === "sharjah" && report.geographicScope !== "sharjah") return false;
      }

      // Date range filter
      if (dateRange !== "all") {
        const reportDate = new Date(report.dateIssued);
        const now = new Date();
        const daysDiff = Math.floor((now.getTime() - reportDate.getTime()) / (1000 * 60 * 60 * 24));

        if (dateRange === "30days" && daysDiff > 30) return false;
        if (dateRange === "90days" && daysDiff > 90) return false;
        if (dateRange === "year" && reportDate.getFullYear() !== now.getFullYear()) return false;
        if (dateRange === "older" && daysDiff <= 365) return false;
      }

      return true;
    });
  }, [activeCategory, geographicScope, dateRange]);

  // Linked portfolio reports (area reports matching user's assets)
  const linkedReports = useMemo(() => {
    if (!hasLinkedAssets) return [];
    // Return area reports for demo
    return DEMO_REPORTS.filter((r) => r.type === "area").slice(0, 3);
  }, [hasLinkedAssets]);

  const handleViewReport = (report: Report) => {
    toast({
      title: "Opening Report",
      description: `Viewing: ${report.title}`,
    });
    // Track access
    setAccessedReports((prev) => {
      const existing = prev.find((r) => r.id === report.id);
      if (existing) {
        return prev.map((r) =>
          r.id === report.id ? { ...r, accessedAt: new Date().toISOString() } : r
        );
      }
      return [{ ...report, accessedAt: new Date().toISOString() }, ...prev];
    });
  };

  const handleDownloadReport = (report: Report) => {
    toast({
      title: "Downloading PDF",
      description: `${report.title} download started.`,
    });
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-[#B89555] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[hsl(32,28%,13%)] via-[hsl(33,27%,15%)] to-[hsl(33,28%,11%)]">
      {/* Premium Video Hero Section */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        {/* Video Background */}
        <div className="absolute inset-0">
          <video 
            autoPlay 
            loop 
            muted 
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
          >
            <source src="https://videos.pexels.com/video-files/3130182/3130182-uhd_2560_1440_30fps.mp4" type="video/mp4" />
          </video>
          {/* Overlay gradients */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/70" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-black/40" />
        </div>

        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="inline-flex items-center gap-2 bg-[#EFE6D6]/20 backdrop-blur-sm text-[#1A1A1A] px-4 py-2 rounded-full text-sm font-medium mb-6 border border-[#B89555]/30">
                <FileText className="w-4 h-4" />
                Report Access
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-white mb-4">
                Centralized Access to{" "}
                <span className="text-[#1A1A1A]">Official Market & Asset Reports</span>
              </h1>
              <p className="text-white/85 text-lg mb-8 max-w-2xl mx-auto">
                Report Access is your private library for all reports available to your account—organized, 
                traceable, and source-backed.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button variant="primary" size="lg" className="gap-2">
                  <Eye className="w-5 h-5" />
                  Open Latest Report
                </Button>
                <Button variant="secondary" size="lg" className="gap-2">
                  <FolderOpen className="w-5 h-5" />
                  Browse Report Library
                </Button>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Main Content - Layer 2 Champagne Background */}
      <section className="py-16">
        <div className="bg-gradient-to-br from-[#F7F1E6] via-[#ECE2D2] to-[#D8C7A6] mx-[0.125rem] md:mx-2 lg:mx-4 xl:mx-6 2xl:mx-8 rounded-2xl p-8 md:p-12">
          {/* Back Link */}
          <Link
            to="/investor-dashboard"
            className="inline-flex items-center gap-2 text-[#1A1A1A]/70 hover:text-[#1A1A1A] transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <motion.div
            initial="hidden"
            animate="visible"
            variants={staggerContainer}
            className="space-y-12"
          >
          {/* Section 1: Report Access Overview */}
          <motion.div variants={fadeInUp}>
            <Card className="border-2 border-[#B89555]/30 bg-gradient-to-br from-gold/5 to-transparent">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-[#EFE6D6]/10 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Sparkles className="w-6 h-6 text-[#1A1A1A]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground mb-2">
                      About Report Access
                    </h2>
                    <p className="text-muted-foreground">
                      Report Access allows you to view, download, and revisit official market reports, 
                      area insights, and asset-specific analyses made available to your account. All reports 
                      are sourced from official data providers and JBJ internal analysis frameworks.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Section 2: Report Categories */}
          <motion.div variants={fadeInUp}>
            <ReportCategoryTabs
              activeCategory={activeCategory}
              onCategoryChange={setActiveCategory}
              geographicScope={geographicScope}
              onScopeChange={setGeographicScope}
              dateRange={dateRange}
              onDateRangeChange={setDateRange}
            />
          </motion.div>

          {/* Section 3: Report Cards Grid */}
          <motion.div variants={fadeInUp}>
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-foreground">
                  Available Reports ({filteredReports.length})
                </h2>
              </div>
              {filteredReports.length === 0 ? (
                <Card className="border-2 border-dashed border-[#B89555]/30">
                  <CardContent className="p-8 text-center">
                    <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">No reports match your filters</p>
                    <p className="text-sm text-muted-foreground">
                      Try adjusting your category or date range filters.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredReports.map((report) => (
                    <ReportCard
                      key={report.id}
                      report={report}
                      onView={handleViewReport}
                      onDownload={handleDownloadReport}
                    />
                  ))}
                </div>
              )}
            </section>
          </motion.div>

          {/* Section 4: Linked Reports from Portfolio */}
          <motion.div variants={fadeInUp}>
            <LinkedPortfolioReports
              linkedReports={linkedReports}
              hasLinkedAssets={hasLinkedAssets}
              onViewReport={handleViewReport}
              onDownloadReport={handleDownloadReport}
            />
          </motion.div>

          {/* Section 5: Report Methodology */}
          <motion.div variants={fadeInUp}>
            <ReportMethodologyBlock />
          </motion.div>

          {/* Section 6: Report History & Archive */}
          <motion.div variants={fadeInUp}>
            <ReportHistoryArchive
              accessedReports={accessedReports}
              onViewReport={handleViewReport}
              onDownloadReport={handleDownloadReport}
            />
          </motion.div>

          {/* Section 7: Request a Report */}
          <motion.div variants={fadeInUp}>
            <RequestReportSection />
          </motion.div>

          {/* FAQ Section */}
          <motion.div variants={fadeInUp}>
            <ReportAccessFAQ />
          </motion.div>
        </motion.div>
        </div>
      </section>
    </div>
  );
}
