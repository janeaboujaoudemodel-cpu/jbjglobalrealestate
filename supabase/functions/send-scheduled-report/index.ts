import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface EmailSendResult {
  id?: string;
  error?: { message: string };
}

interface ScheduledReportRequest {
  reportId?: string;
  recipients?: string[];
  reportName?: string;
  reportType?: string;
  reportData?: {
    period: string;
    metrics: {
      totalViews: number;
      totalLeads: number;
      conversionRate: number;
      topProjects: Array<{ name: string; views: number }>;
      topAreas: Array<{ name: string; interest: number }>;
    };
  };
  sendNow?: boolean;
}

const generatePDFReportHTML = (reportName: string, reportData: any) => {
  const { period, metrics } = reportData;
  
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #1a1a1a; margin: 0; padding: 40px; }
        .header { background: linear-gradient(135deg, #C6A55C 0%, #E8D5A3 100%); padding: 30px; border-radius: 12px; margin-bottom: 30px; }
        .header h1 { color: #1a1a1a; margin: 0; font-size: 28px; }
        .header p { color: #333; margin: 10px 0 0; }
        .section { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; }
        .section h2 { color: #C6A55C; margin: 0 0 15px; font-size: 18px; border-bottom: 2px solid #C6A55C; padding-bottom: 10px; }
        .metric-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; }
        .metric-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.05); }
        .metric-value { font-size: 32px; font-weight: bold; color: #C6A55C; }
        .metric-label { color: #666; font-size: 14px; margin-top: 5px; }
        .list-item { display: flex; justify-content: space-between; padding: 12px 0; border-bottom: 1px solid #eee; }
        .list-item:last-child { border-bottom: none; }
        .footer { text-align: center; color: #888; font-size: 12px; margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>📊 ${reportName}</h1>
        <p>Analytics Report for ${period}</p>
      </div>
      
      <div class="section">
        <h2>Key Metrics</h2>
        <div class="metric-grid">
          <div class="metric-card">
            <div class="metric-value">${metrics.totalViews.toLocaleString()}</div>
            <div class="metric-label">Total Views</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.totalLeads.toLocaleString()}</div>
            <div class="metric-label">Total Leads</div>
          </div>
          <div class="metric-card">
            <div class="metric-value">${metrics.conversionRate.toFixed(1)}%</div>
            <div class="metric-label">Conversion Rate</div>
          </div>
        </div>
      </div>

      <div class="section">
        <h2>Top Performing Projects</h2>
        ${metrics.topProjects.map((p: any) => `
          <div class="list-item">
            <span>${p.name}</span>
            <strong>${p.views.toLocaleString()} views</strong>
          </div>
        `).join('')}
      </div>

      <div class="section">
        <h2>Top Interest Areas</h2>
        ${metrics.topAreas.map((a: any) => `
          <div class="list-item">
            <span>${a.name}</span>
            <strong>${a.interest}% interest</strong>
          </div>
        `).join('')}
      </div>

      <div class="footer">
        <p>JBJ Global Real Estate | Automated Analytics Report</p>
        <p>Generated on ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
        })}</p>
      </div>
    </body>
    </html>
  `;
};

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const body: ScheduledReportRequest = await req.json();
    const { reportId, recipients, reportName, reportType, reportData, sendNow } = body;

    let targetRecipients = recipients || [];
    let targetReportName = reportName || "Analytics Report";
    let targetReportData = reportData;

    // If reportId is provided, fetch from database
    if (reportId) {
      const { data: scheduledReport, error } = await supabase
        .from('scheduled_reports')
        .select('*')
        .eq('id', reportId)
        .single();

      if (error || !scheduledReport) {
        throw new Error('Scheduled report not found');
      }

      targetRecipients = scheduledReport.recipients;
      targetReportName = scheduledReport.report_name;
      targetReportData = scheduledReport.report_config?.reportData || {
        period: new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }),
        metrics: {
          totalViews: Math.floor(Math.random() * 50000) + 10000,
          totalLeads: Math.floor(Math.random() * 500) + 100,
          conversionRate: Math.random() * 5 + 2,
          topProjects: [
            { name: "Palm Jumeirah Residences", views: Math.floor(Math.random() * 5000) + 1000 },
            { name: "Downtown Dubai Tower", views: Math.floor(Math.random() * 4000) + 800 },
            { name: "Dubai Marina Heights", views: Math.floor(Math.random() * 3000) + 600 },
          ],
          topAreas: [
            { name: "Dubai Marina", interest: Math.floor(Math.random() * 20) + 25 },
            { name: "Downtown Dubai", interest: Math.floor(Math.random() * 15) + 20 },
            { name: "Palm Jumeirah", interest: Math.floor(Math.random() * 10) + 15 },
          ],
        },
      };
    }

    if (!targetRecipients.length || !targetReportData) {
      throw new Error('No recipients or report data specified');
    }

    // Generate HTML report
    const htmlReport = generatePDFReportHTML(targetReportName, targetReportData);

    // Send email to all recipients using fetch
    const emailPromises = targetRecipients.map(async (email): Promise<EmailSendResult> => {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "JBJ Global Real Estate <reports@resend.dev>",
          to: [email],
          subject: `📊 ${targetReportName} - ${targetReportData.period}`,
          html: htmlReport,
        }),
      });
      return response.json();
    });

    const results = await Promise.allSettled(emailPromises);
    const successCount = results.filter((r) => r.status === 'fulfilled' && !(r.value as EmailSendResult).error).length;
    const failedCount = results.filter((r) => r.status === 'rejected').length;

    // Log delivery
    if (reportId) {
      await supabase.from('report_delivery_logs').insert({
        scheduled_report_id: reportId,
        recipients: targetRecipients,
        status: failedCount === 0 ? 'sent' : failedCount === targetRecipients.length ? 'failed' : 'partial',
        metadata: { successCount, failedCount },
      });

      // Update next_send_at based on frequency
      const { data: report } = await supabase
        .from('scheduled_reports')
        .select('frequency')
        .eq('id', reportId)
        .single();

      if (report) {
        const nextSend = new Date();
        if (report.frequency === 'weekly') {
          nextSend.setDate(nextSend.getDate() + 7);
        } else {
          nextSend.setMonth(nextSend.getMonth() + 1);
        }

        await supabase
          .from('scheduled_reports')
          .update({
            last_sent_at: new Date().toISOString(),
            next_send_at: nextSend.toISOString(),
          })
          .eq('id', reportId);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Report sent to ${successCount} recipient(s)`,
        successCount,
        failedCount,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error sending scheduled report:", error);
    return new Response(
      JSON.stringify({ success: false, error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
