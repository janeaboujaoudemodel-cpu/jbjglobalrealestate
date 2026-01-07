import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email: string;
  name?: string;
  listId?: number;
  source?: string;
  attributes?: Record<string, any>;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name, listId, source, attributes }: NewsletterRequest = await req.json();

    if (!email) {
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    console.log("[Newsletter] Subscription received:", { email, name, source });

    // Try Brevo if API key exists
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    let brevoSuccess = false;

    if (brevoApiKey) {
      try {
        const targetListId = listId || parseInt(Deno.env.get("BREVO_DEFAULT_LIST_ID") || "1");

        const brevoPayload = {
          email: email.toLowerCase(),
          listIds: [targetListId],
          updateEnabled: true,
          attributes: {
            FIRSTNAME: name?.split(' ')[0] || '',
            LASTNAME: name?.split(' ').slice(1).join(' ') || '',
            SOURCE: source || 'website',
            ...attributes,
          },
        };

        const brevoResponse = await fetch("https://api.brevo.com/v3/contacts", {
          method: "POST",
          headers: {
            "Accept": "application/json",
            "Content-Type": "application/json",
            "api-key": brevoApiKey,
          },
          body: JSON.stringify(brevoPayload),
        });

        if (brevoResponse.ok || brevoResponse.status === 204) {
          brevoSuccess = true;
          console.log("[Newsletter] Brevo contact created successfully");
        } else if (brevoResponse.status === 400) {
          // Might be duplicate - try update
          const updateResponse = await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
            method: "PUT",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json",
              "api-key": brevoApiKey,
            },
            body: JSON.stringify({
              listIds: [targetListId],
              attributes: brevoPayload.attributes,
            }),
          });
          brevoSuccess = updateResponse.ok;
          console.log("[Newsletter] Brevo contact updated:", brevoSuccess);
        }
      } catch (brevoErr) {
        console.warn("[Newsletter] Brevo API error:", brevoErr);
      }
    } else {
      console.log("[Newsletter] BREVO_API_KEY not configured, using email notification only");
    }

    // Send notification email using Resend API directly
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      try {
        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c9a961;">New Newsletter Subscription</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${email}</p>
              ${name ? `<p><strong>Name:</strong> ${name}</p>` : ''}
              <p><strong>Source:</strong> ${source || 'website'}</p>
              <p><strong>Signup Page:</strong> ${attributes?.SIGNUP_PAGE || 'Unknown'}</p>
              <p><strong>Date:</strong> ${new Date().toLocaleString('en-AE', { timeZone: 'Asia/Dubai' })}</p>
            </div>
            <p style="color: #666; font-size: 14px;">
              ${brevoSuccess ? '✅ Added to Brevo' : '⚠️ Brevo not configured - saved to database only'}
            </p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #999; font-size: 12px;">
              This subscriber is saved in your leads database. 
              ${!brevoSuccess ? 'You can export leads and import to Brevo later when your account is ready.' : ''}
            </p>
          </div>
        `;

        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "JJ Global Capital <onboarding@resend.dev>",
            to: ["contact@jjglobalcapital.com", "jane@jjglobalcapital.com"],
            subject: "📬 New Newsletter Subscriber!",
            html: emailHtml,
          }),
        });

        if (emailResponse.ok) {
          console.log("[Newsletter] Notification email sent");
        } else {
          const emailError = await emailResponse.text();
          console.error("[Newsletter] Email notification error:", emailError);
        }
      } catch (emailErr) {
        console.error("[Newsletter] Email notification error:", emailErr);
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: brevoSuccess ? "Subscribed to newsletter" : "Lead saved successfully",
        brevo_synced: brevoSuccess,
      }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );

  } catch (error: any) {
    console.error("[Newsletter] Error:", error.message);
    return new Response(
      JSON.stringify({ error: error.message || "Subscription failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
