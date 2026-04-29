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

/* ============================================================
 * ICON BOX STYLE - Active Champagne + Gold Border + Black Icon
 * ============================================================ */
const IconBox = ({ icon: Icon, className = "" }: { icon: React.ElementType; className?: string }) => (
  <div
    className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 ${className}`}
    style={{ backgroundColor: '#000000', boxShadow: '0 4px 14px rgba(0,0,0,0.25)' }}
  >
    <Icon className="w-6 h-6" style={{ color: '#ffffff' }} />
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
    <section className="py-16" style={{ backgroundColor: '#F9FAFB' }} data-surface="light">
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
            <span className="text-xs uppercase tracking-[0.3em] mb-4 block font-semibold" style={{ color: '#6b7280' }}>
              Market Reports
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: '#000000' }}>
              Downloadable Reports
            </h2>
            <p className="max-w-2xl mx-auto" style={{ color: '#374151' }}>
              Generate AI-powered market reports based on official Open Data.
              Reports are descriptive summaries, not predictive forecasts.
            </p>
          </motion.div>

          {/* Report Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {REPORT_TYPES.map((report) => (
              <motion.div key={report.id} variants={fadeInUp} className="h-full">
                <Card
                  className="transition-all h-full flex flex-col hover:shadow-lg"
                  style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <IconBox icon={report.icon} />
                      <Badge
                        variant="outline"
                        className="whitespace-nowrap"
                        style={{ backgroundColor: '#F3F4F6', color: '#000000', borderColor: '#D1D5DB' }}
                      >
                        <Clock className="w-3 h-3 mr-1" style={{ color: '#000000' }} />
                        {report.frequency}
                      </Badge>
                    </div>
                    <CardTitle className="text-xl mt-4" style={{ color: '#000000' }}>{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-sm mb-6" style={{ color: '#374151' }}>
                      {report.description}
                    </p>

                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#1F2937' }}>
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                        Powered by Government Open Data
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#1F2937' }}>
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                        AI-generated insights included
                      </div>
                      <div className="flex items-center gap-2 text-xs" style={{ color: '#1F2937' }}>
                        <CheckCircle className="w-4 h-4" style={{ color: '#059669' }} />
                        Source attribution & timestamps
                      </div>
                    </div>

                    <Button
                      variant="primary"
                      onClick={() => generateReport(report)}
                      disabled={generatingId === report.id}
                      className="w-full mt-auto"
                      style={{ backgroundColor: '#000000', color: '#ffffff' }}
                    >
                      {generatingId === report.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          <span style={{ color: '#ffffff' }}>Generating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" style={{ color: '#ffffff' }} />
                          <span style={{ color: '#ffffff' }}>Generate Report</span>
                          <ChevronRight className="w-4 h-4 ml-1" style={{ color: '#ffffff' }} />
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
            className="mt-10 p-6 max-w-3xl mx-auto text-center rounded-2xl"
            variants={fadeInUp}
            style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderWidth: 1 }}
          >
            <div className="flex justify-center mb-4">
              <IconBox icon={FileText} />
            </div>
            <h4 className="font-semibold mb-2" style={{ color: '#000000' }}>
              Report Disclaimer
            </h4>
            <p className="text-sm leading-relaxed" style={{ color: '#374151' }}>
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