import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { Resend } from "https://esm.sh/resend@2.0.0";
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface Recipient {
  leadId: string;
  email: string;
  name: string;
}

interface BulkEmailRequest {
  campaignId: string;
  subject: string;
  htmlContent: string;
  recipients: Recipient[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { campaignId, subject, htmlContent, recipients }: BulkEmailRequest = await req.json();

    console.log(`Starting bulk email campaign ${campaignId} to ${recipients.length} recipients`);

    let sentCount = 0;
    let failedCount = 0;

    // Process in batches of 10
    const batchSize = 10;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      
      const promises = batch.map(async (recipient) => {
        try {
          // Personalize content with recipient name
          const personalizedHtml = htmlContent.replace(
            /Greetings from JJ Global Capital,/g,
            `Dear ${recipient.name?.split(' ')[0] || 'Valued Client'},`
          );

          const result = await resend.emails.send({
            from: "JJ Global Capital <contact@jjglobalcapital.com>",
            to: [recipient.email],
            subject: subject,
            html: personalizedHtml,
          });

          // Log recipient
          await supabase.from("crm_campaign_recipients").insert({
            campaign_id: campaignId,
            lead_id: recipient.leadId,
            email: recipient.email,
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          // Log activity
          await supabase.from("crm_activities").insert({
            lead_id: recipient.leadId,
            user_id: (await supabase.from("crm_email_campaigns").select("user_id").eq("id", campaignId).single()).data?.user_id,
            activity_type: "email",
            metadata: { campaign_id: campaignId, subject },
          });

          sentCount++;
          return { success: true, email: recipient.email };
        } catch (error: any) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          
          await supabase.from("crm_campaign_recipients").insert({
            campaign_id: campaignId,
            lead_id: recipient.leadId,
            email: recipient.email,
            status: "failed",
            error_message: error.message,
          });

          failedCount++;
          return { success: false, email: recipient.email, error: error.message };
        }
      });

      await Promise.all(promises);
      
      // Small delay between batches to avoid rate limiting
      if (i + batchSize < recipients.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Update campaign status
    await supabase
      .from("crm_email_campaigns")
      .update({
        status: "completed",
        sent_count: sentCount,
        failed_count: failedCount,
        sent_at: new Date().toISOString(),
      })
      .eq("id", campaignId);

    console.log(`Campaign ${campaignId} completed: ${sentCount} sent, ${failedCount} failed`);

    return new Response(
      JSON.stringify({ success: true, sentCount, failedCount }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Bulk email error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
