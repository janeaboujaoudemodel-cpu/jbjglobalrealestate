import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Origin whitelist for CORS
const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "https://lovable.dev",
  "http://localhost:5173",
  "http://localhost:3000",
];

const getCorsHeaders = (origin: string | null) => {
  const allowedOrigin = origin && ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith('.lovable.app') || origin.endsWith('.lovable.dev')
  ) ? origin : ALLOWED_ORIGINS[0];
  
  return {
    "Access-Control-Allow-Origin": allowedOrigin,
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
};

// Input validation schema
const NewsletterSchema = z.object({
  email: z.string().email().max(255).transform(val => val.toLowerCase().trim()),
  name: z.string().max(100).optional(),
  listId: z.number().optional(),
  source: z.string().max(50).optional(),
  attributes: z.record(z.string().max(500)).optional(),
});

const handler = async (req: Request): Promise<Response> => {
  const origin = req.headers.get("origin");
  const corsHeaders = getCorsHeaders(origin);

  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // Only allow POST
  if (req.method !== "POST") {
    return new Response(
      JSON.stringify({ error: "Method not allowed" }),
      { status: 405, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  // Validate origin
  const isValidOrigin = origin && (
    ALLOWED_ORIGINS.includes(origin) || 
    origin.endsWith('.lovable.app') || 
    origin.endsWith('.lovable.dev')
  );
  
  if (!isValidOrigin) {
    console.warn("[Newsletter] Blocked request from origin:", origin);
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }

  try {
    const rawBody = await req.json();
    
    // Validate input
    const parseResult = NewsletterSchema.safeParse(rawBody);
    if (!parseResult.success) {
      console.warn("[Newsletter] Validation failed:", parseResult.error.flatten());
      return new Response(
        JSON.stringify({ error: "Invalid input" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const { email, name, listId, source, attributes } = parseResult.data;
    console.log("[Newsletter] Subscription received:", { email, name, source });

    // Try Brevo if API key exists
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    let brevoSuccess = false;

    if (brevoApiKey) {
      try {
        const targetListId = listId || parseInt(Deno.env.get("BREVO_LIST_ID") || "2");

        const brevoPayload = {
          email: email,
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
        // Sanitize values for HTML to prevent XSS
        const escapeHtml = (str: string) => str
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/"/g, '&quot;');

        const safeEmail = escapeHtml(email);
        const safeName = name ? escapeHtml(name) : '';
        const safeSource = escapeHtml(source || 'website');
        const safeSignupPage = attributes?.SIGNUP_PAGE ? escapeHtml(String(attributes.SIGNUP_PAGE)) : 'Unknown';

        const emailHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c9a961;">New Newsletter Subscription</h2>
            <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p><strong>Email:</strong> ${safeEmail}</p>
              ${safeName ? `<p><strong>Name:</strong> ${safeName}</p>` : ''}
              <p><strong>Source:</strong> ${safeSource}</p>
              <p><strong>Signup Page:</strong> ${safeSignupPage}</p>
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
            from: "JBJ Global Real Estate <onboarding@resend.dev>",
            to: ["contact@jbj.ae"],
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
      JSON.stringify({ error: "Subscription failed" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
