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

// Split title helper: first word gold, rest black
const SplitTitle = ({ text }: { text: string }) => {
  const words = text.split(' ');
  const firstWord = words[0];
  const restWords = words.slice(1).join(' ');
  
  return (
    <span className="jj-title-split">
      <span>{firstWord}</span>{restWords && <span> {restWords}</span>}
    </span>
  );
};

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
    <section className="py-16 bg-black">
      <div className="jj-layer-2">
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
              Market Reports
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              <SplitTitle text="Downloadable Reports" />
            </h2>
            <p className="text-black/70 max-w-2xl mx-auto">
              Generate AI-powered market reports based on official Open Data. 
              Reports are descriptive summaries, not predictive forecasts.
            </p>
          </motion.div>

          {/* Report Cards - Active color fill with proper alignment */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {REPORT_TYPES.map((report) => (
              <motion.div key={report.id} variants={fadeInUp} className="h-full">
                <Card className="jj-card-inner hover:border-white transition-all h-full flex flex-col">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                        <report.icon className="w-6 h-6 text-gold" />
                      </div>
                      <Badge variant="outline" className="bg-white/50 text-black border-black/20">
                        <Clock className="w-3 h-3 mr-1" />
                        {report.frequency}
                      </Badge>
                    </div>
                    <CardTitle className="text-black text-xl mt-4">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 flex flex-col">
                    <p className="text-black/70 text-sm mb-6">
                      {report.description}
                    </p>
                    
                    {/* Report Features - consistent spacing */}
                    <div className="space-y-2 mb-6 flex-1">
                      <div className="flex items-center gap-2 text-black/70 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Powered by Government Open Data
                      </div>
                      <div className="flex items-center gap-2 text-black/70 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        AI-generated insights included
                      </div>
                      <div className="flex items-center gap-2 text-black/70 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        Source attribution & timestamps
                      </div>
                    </div>

                    {/* Download Button - Primary styling, aligned */}
                    <Button
                      variant="primary"
                      onClick={() => generateReport(report)}
                      disabled={generatingId === report.id}
                      className="w-full mt-auto"
                    >
                      {generatingId === report.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                          <span className="text-black">Gener</span><span className="text-gold">ating...</span>
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          <span className="text-black">Generate</span><span className="text-gold"> Report</span>
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Report Disclaimer - Active color */}
          <motion.div 
            className="mt-10 p-6 jj-card-inner max-w-3xl mx-auto text-center"
            variants={fadeInUp}
          >
            <FileText className="w-8 h-8 text-gold mx-auto mb-4" />
            <h4 className="text-black font-semibold mb-2">
              <SplitTitle text="Report Disclaimer" />
            </h4>
            <p className="text-black/70 text-sm leading-relaxed">
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