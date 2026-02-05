import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NewsletterRequest {
  email: string;
  name?: string;
  listId?: number;
  source?: string;
  source_page?: string;
  attributes?: Record<string, unknown>;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  console.log("[newsletter-subscribe] Request received");

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    const defaultListId = Deno.env.get("BREVO_LIST_ID");

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const data: NewsletterRequest = await req.json();

    // Validate email
    if (!data.email) {
      console.warn("[newsletter-subscribe] Missing email");
      return new Response(
        JSON.stringify({ error: "Email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    const normalizedEmail = data.email.toLowerCase().trim();
    
    if (!emailRegex.test(normalizedEmail)) {
      console.warn("[newsletter-subscribe] Invalid email format:", normalizedEmail);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("[newsletter-subscribe] Processing:", normalizedEmail);

    // 1. Save to newsletter_subscribers table (upsert by email)
    const { error: dbError } = await supabase
      .from('newsletter_subscribers')
      .upsert({
        email: normalizedEmail,
        name: data.name || null,
        source: data.source || 'website',
        source_page: data.source_page || null,
        is_active: true,
        subscribed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'email',
        ignoreDuplicates: false,
      });

    if (dbError) {
      console.error("[newsletter-subscribe] DB error:", dbError);
      // Continue - we still want to try Brevo even if local DB fails
    } else {
      console.log("[newsletter-subscribe] Saved to newsletter_subscribers");
    }

    // 2. Sync to Brevo if API key is configured
    let brevoSynced = false;
    if (brevoApiKey) {
      try {
        const listId = data.listId || (defaultListId ? parseInt(defaultListId) : null);
        
        const brevoPayload: Record<string, unknown> = {
          email: normalizedEmail,
          updateEnabled: true, // Update if contact exists
          attributes: {
            FIRSTNAME: data.name?.split(' ')[0] || '',
            LASTNAME: data.name?.split(' ').slice(1).join(' ') || '',
            SOURCE: data.source || 'website',
            SOURCE_PAGE: data.source_page || '',
            ...data.attributes,
          },
        };

        // Add to list if listId is provided
        if (listId) {
          brevoPayload.listIds = [listId];
        }

        const brevoResponse = await fetch('https://api.brevo.com/v3/contacts', {
          method: 'POST',
          headers: {
            'accept': 'application/json',
            'api-key': brevoApiKey,
            'content-type': 'application/json',
          },
          body: JSON.stringify(brevoPayload),
        });

        if (brevoResponse.ok || brevoResponse.status === 201 || brevoResponse.status === 204) {
          console.log("[newsletter-subscribe] Synced to Brevo");
          brevoSynced = true;
        } else {
          const brevoError = await brevoResponse.text();
          console.warn("[newsletter-subscribe] Brevo API warning:", brevoResponse.status, brevoError);
          
          // If contact already exists (duplicate), that's fine
          if (brevoResponse.status === 400 && brevoError.includes('Contact already exist')) {
            brevoSynced = true;
            console.log("[newsletter-subscribe] Contact already exists in Brevo");
          }
        }
      } catch (brevoError) {
        console.warn("[newsletter-subscribe] Brevo sync error:", brevoError);
        // Don't fail the request if Brevo is down
      }
    } else {
      console.log("[newsletter-subscribe] No BREVO_API_KEY configured, skipping Brevo sync");
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: "Subscribed successfully",
        email: normalizedEmail,
        brevoSynced,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("[newsletter-subscribe] Error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
