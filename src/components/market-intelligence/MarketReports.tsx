import { useState } from "react";
import { motion } from "framer-motion";
import { 
  FileText, Download, Calendar, Clock, 
  TrendingUp, BarChart3, MapPin, CheckCircle
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
            <span className="text-gold text-xs uppercase tracking-[0.3em] mb-4 block">
              Market Reports
            </span>
            <h2 className="text-white text-3xl md:text-4xl font-bold mb-4" style={{ fontFamily: "Poppins, sans-serif" }}>
              Downloadable Reports
            </h2>
            <p className="text-zinc-400 max-w-2xl mx-auto">
              Generate AI-powered market reports based on official Open Data. 
              Reports are descriptive summaries, not predictive forecasts.
            </p>
          </motion.div>

          {/* Report Cards */}
          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {REPORT_TYPES.map((report) => (
              <motion.div key={report.id} variants={fadeInUp}>
                <Card className="bg-white border-zinc-200 hover:border-gold/50 hover:shadow-lg transition-all h-full">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center">
                        <report.icon className="w-6 h-6 text-gold" />
                      </div>
                      <Badge variant="outline" className="bg-zinc-100 text-zinc-600 border-zinc-300">
                        <Clock className="w-3 h-3 mr-1" />
                        {report.frequency}
                      </Badge>
                    </div>
                    <CardTitle className="text-black text-xl mt-4">{report.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-zinc-600 text-sm mb-6">
                      {report.description}
                    </p>
                    
                    {/* Report Features */}
                    <div className="space-y-2 mb-6">
                      <div className="flex items-center gap-2 text-zinc-600 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Powered by Government Open Data
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        AI-generated insights included
                      </div>
                      <div className="flex items-center gap-2 text-zinc-600 text-xs">
                        <CheckCircle className="w-4 h-4 text-emerald-500" />
                        Source attribution & timestamps
                      </div>
                    </div>

                    <Button
                      onClick={() => generateReport(report)}
                      disabled={generatingId === report.id}
                      className="w-full bg-black text-white font-semibold hover:bg-zinc-800"
                    >
                      {generatingId === report.id ? (
                        <>
                          <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Download className="w-4 h-4 mr-2" />
                          Generate Report
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
            className="mt-10 p-6 bg-white border border-zinc-200 rounded-2xl max-w-3xl mx-auto text-center"
            variants={fadeInUp}
          >
            <FileText className="w-8 h-8 text-gold mx-auto mb-4" />
            <h4 className="text-black font-semibold mb-2">Report Disclaimer</h4>
            <p className="text-zinc-600 text-sm leading-relaxed">
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
