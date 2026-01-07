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
    // 1. VALIDATE AUTHENTICATION
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      console.error("Missing or invalid Authorization header");
      return new Response(
        JSON.stringify({ error: 'Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Create auth client to validate token
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Invalid authentication token:", authError);
      return new Response(
        JSON.stringify({ error: 'Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = user.id;
    console.log(`Authenticated user: ${userId}`);

    // 2. VALIDATE RESEND API KEY
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const resend = new Resend(resendApiKey);
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { campaignId, subject, htmlContent, recipients }: BulkEmailRequest = await req.json();

    // 3. VERIFY CAMPAIGN OWNERSHIP BEFORE PROCESSING
    const { data: campaign, error: campaignError } = await supabaseService
      .from("crm_email_campaigns")
      .select("user_id, status")
      .eq("id", campaignId)
      .single();

    if (campaignError || !campaign) {
      console.error("Campaign not found:", campaignId);
      return new Response(
        JSON.stringify({ error: 'Campaign not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 4. AUTHORIZATION CHECK - User must own campaign or be CRM admin
    if (campaign.user_id !== userId) {
      const { data: isAdmin } = await supabaseService.rpc('is_crm_admin', {
        _user_id: userId
      });

      if (!isAdmin) {
        console.error(`User ${userId} unauthorized to send campaign ${campaignId}`);
        return new Response(
          JSON.stringify({ error: 'Unauthorized to send this campaign' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // 5. VALIDATE CAMPAIGN STATUS
    if (campaign.status !== 'draft' && campaign.status !== 'sending') {
      console.error(`Campaign ${campaignId} has invalid status: ${campaign.status}`);
      return new Response(
        JSON.stringify({ error: 'Campaign cannot be sent in current status' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

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
            /Greetings from JBJ Global Real Estate,/g,
            `Dear ${recipient.name?.split(' ')[0] || 'Valued Client'},`
          );

          const result = await resend.emails.send({
            from: "JBJ Global Real Estate <contact@jbj.ae>",
            to: [recipient.email],
            subject: subject,
            html: personalizedHtml,
          });

          // Log recipient
          await supabaseService.from("crm_campaign_recipients").insert({
            campaign_id: campaignId,
            lead_id: recipient.leadId,
            email: recipient.email,
            status: "sent",
            sent_at: new Date().toISOString(),
          });

          // Log activity
          await supabaseService.from("crm_activities").insert({
            lead_id: recipient.leadId,
            user_id: userId,
            activity_type: "email",
            metadata: { campaign_id: campaignId, subject },
          });

          sentCount++;
          return { success: true, email: recipient.email };
        } catch (error: any) {
          console.error(`Failed to send to ${recipient.email}:`, error);
          
          await supabaseService.from("crm_campaign_recipients").insert({
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
    await supabaseService
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
      JSON.stringify({ error: "An error occurred processing the request" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
