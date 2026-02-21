import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface IdeaApprovedRequest {
  ideaId: string;
  userId: string;
  userEmail: string;
  userName: string;
  ideaTitle: string;
  pointsAwarded: number;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { ideaId, userId, userEmail, userName, ideaTitle, pointsAwarded }: IdeaApprovedRequest = await req.json();

    // Validate required fields
    if (!userEmail || !ideaTitle) {
      throw new Error("Missing required fields: userEmail and ideaTitle");
    }

    // Create Supabase client for inserting notification
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Insert in-app notification
    if (userId) {
      await supabase.from("user_notifications").insert({
        user_id: userId,
        type: "idea_approved",
        title: "🎉 Idea Approved!",
        message: `Congratulations! Your idea "${ideaTitle}" has been approved. You earned ${pointsAwarded} loyalty points!`,
        metadata: { ideaId, pointsAwarded },
      });
    }

    // Send email notification via direct fetch
    const emailRes = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Authorization": `Bearer ${RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: "JBJ Global Real Estate <info@jbj.ae>",
        to: [userEmail],
        subject: `🎉 Your idea has been approved! +${pointsAwarded} points`,
        html: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: 'Segoe UI', Arial, sans-serif; margin: 0; padding: 0; background: #f5f5f5; }
              .container { max-width: 600px; margin: 0 auto; background: #ffffff; }
              .header { background: linear-gradient(135deg, #000000 0%, #1a1a1a 100%); padding: 40px 30px; text-align: center; }
              .logo { font-size: 28px; font-weight: bold; color: #D4AF37; letter-spacing: 2px; }
              .content { padding: 40px 30px; }
              .title { font-size: 24px; color: #000000; margin-bottom: 20px; text-align: center; }
              .highlight { background: linear-gradient(135deg, #F5EBD7 0%, #E8DCC8 100%); border: 2px solid rgba(212, 175, 55, 0.4); border-radius: 12px; padding: 20px; margin: 20px 0; }
              .points { font-size: 32px; font-weight: bold; color: #D4AF37; text-align: center; }
              .idea-title { font-size: 18px; color: #333; font-style: italic; margin: 15px 0; }
              .message { font-size: 16px; line-height: 1.6; color: #555; }
              .footer { background: #f9f9f9; padding: 30px; text-align: center; border-top: 1px solid #eee; }
              .footer-text { color: #888; font-size: 12px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="logo">JBJ GLOBAL REAL ESTATE</div>
              </div>
              <div class="content">
                <h1 class="title">🎉 Congratulations, ${userName || 'Valued Customer'}!</h1>
                <div class="highlight">
                  <p class="points">+${pointsAwarded} Points</p>
                  <p class="idea-title">"${ideaTitle}"</p>
                </div>
                <p class="message">
                  Great news! Your creative idea has been reviewed and approved by our team. 
                  As a token of our appreciation, we've added <strong>${pointsAwarded} loyalty points</strong> to your account.
                </p>
                <p class="message">
                  Your ideas help us improve and innovate. Keep sharing your brilliant suggestions - 
                  every approved idea earns you more points, and the best ideas win special prizes!
                </p>
                <p class="message">
                  Thank you for being part of the JBJ Global Real Estate community.
                </p>
              </div>
              <div class="footer">
                <p class="footer-text">
                  © ${new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.<br/>
                  Dubai, United Arab Emirates
                </p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });
    const emailResponse = await emailRes.json();
    if (!emailRes.ok) console.error("Resend API error:", JSON.stringify(emailResponse));

    console.log("Idea approval email sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, emailResponse }), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        ...corsHeaders,
      },
    });
  } catch (error: any) {
    console.error("Error in send-idea-approved-email function:", error);
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
