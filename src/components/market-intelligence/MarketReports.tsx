import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Download, Calendar, Clock, 
  TrendingUp, BarChart3, MapPin, CheckCircle,
  ChevronRight
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
};

interface MarketReportType {
  id: string;
  title: string;
  description: string;
  frequency: string;
  icon: React.ElementType;
  reportType: 'weekly' | 'monthly' | 'quarterly' | 'annual';
  areas: string[];
}

const REPORT_TYPES: MarketReportType[] = [
  {
    id: 'weekly',
    title: 'Weekly Market Summary',
    description: 'Quick overview of transaction volumes, price movements, and notable developments.',
    frequency: 'Every Monday',
    icon: TrendingUp,
    reportType: 'weekly',
    areas: ['All Dubai'],
  },
  {
    id: 'monthly',
    title: 'Monthly Trend Analysis',
    description: 'Detailed analysis of monthly trends, area performance, and supply-demand dynamics.',
    frequency: 'First week of month',
    icon: BarChart3,
    reportType: 'monthly',
    areas: ['All Dubai'],
  },
  {
    id: 'quarterly',
    title: 'Quarterly Performance Review',
    description: 'Comprehensive quarterly review with YoY comparisons and sector breakdowns.',
    frequency: 'Every quarter',
    icon: Calendar,
    reportType: 'quarterly',
    areas: ['All Dubai'],
  },
  {
    id: 'area',
    title: 'Area-Specific Report',
    description: 'Focused analysis on specific communities with local market dynamics.',
    frequency: 'On demand',
    icon: MapPin,
    reportType: 'monthly',
    areas: ['Downtown Dubai', 'Dubai Marina', 'Palm Jumeirah'],
  },
];

/* ICON BOX - inverted on light surfaces */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 bg-foreground shadow-md ${className}`}
  >
    <Icon className="w-6 h-6 text-background" />
  </div>
);

export const MarketReports = () => {
  const [generatingId, setGeneratingId] = useState<string | null>(null);

  const generateReport = async (report: MarketReportType) => {
    setGeneratingId(report.id);
    try {
      const { data, error } = await supabase.functions.invoke('ai-market-report', {
        body: {
          reportType: report.reportType,
          areas: report.areas,
          period: `${report.reportType} report`,
        },
      });

      if (error) throw error;

      if (data?.report) {
        // Create downloadable text file
        const blob = new Blob([data.report], { type: 'text/plain' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `jbj-market-${report.reportType}-report-${new Date().toISOString().split('T')[0]}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        toast.success('Report generated successfully!');
      }
    } catch (err) {
      console.error('Error generating report:', err);
      toast.error('Unable to generate report. Please try again.');
    } finally {
      setGeneratingId(null);
    }
  };

  return (
    <section className="surface-light py-16 bg-muted" data-surface="light">
      <div className="container mx-auto px-4">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={{
            visible: { transition: { staggerChildren: 0.1 } }
          }}
        >
          {/* Section Header */}
          <motion.div className="text-center mb-12" variants={fadeInUp}>
            <span className="text-xs uppercase tracking-[0.3em] mb-4 block font-semibold text-muted-foreground">
              Market Reports
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Downloadable Reports
            </h2>
            <p className="max-w-2xl mx-auto text-muted-foreground">
              Generate AI-powered market reports based on official Open Data.
              Reports are descriptive summaries, not predictive forecasts.
            </p>
          </motion.div>

          {/* Report Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {REPORT_TYPES.map((report) => (
              <motion.div key={report.id} variants={fadeInUp} className="h-full">
                <Card className="transition-all h-full flex flex-col hover:shadow-lg bg-card border border-border">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <IconBox icon={report.icon} />
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap bg-muted text-foreground border-border"
                      >
                        <Clock className="w-3 h-3 mr-1" />
                        {report.frequency}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4 text-foreground">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm mb-6 text-muted-foreground">
                      {report.description}
                    </p>

                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        Powered by Government Open Data
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        AI-generated insights included
                      </div>
                      <div className="flex items-center gap-2 text-xs text-foreground">
                        <CheckCircle className="w-4 h-4 text-emerald-700" />
                        Source attribution & timestamps
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => generateReport(report)}
                      disabled={generatingId === report.id}
                      className="w-full mt-auto"
                    >
                      {generatingId === report.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin mr-2" />
                          <span>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          <span>Generate Report</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Report Disclaimer */}
          <motion.div
            className="mt-10 p-6 max-w-3xl mx-auto text-center rounded-2xl bg-card border border-border"
            variants={fadeInUp}
          >
            <div className="flex justify-center mb-4">
              <IconBox icon={FileText} />
            </div>
            <h4 className="font-semibold mb-2 text-foreground">
              Report Disclaimer
            </h4>
            <p className="text-sm leading-relaxed text-muted-foreground">
              All market reports are generated using AI analysis of publicly available government Open Data.
              Reports are for informational purposes only and do not constitute investment advice.
              Data sources include Dubai Pulse, Dubai Statistics Center, and Dubai Land Department.
              Always verify information independently before making decisions.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};
