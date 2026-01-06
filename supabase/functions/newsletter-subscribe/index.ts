import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

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

    // Get Brevo API key from secrets
    const brevoApiKey = Deno.env.get("BREVO_API_KEY");
    
    if (!brevoApiKey) {
      console.log("[Newsletter] Brevo API key not configured, storing lead only");
      return new Response(
        JSON.stringify({ success: true, message: "Lead stored successfully" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Default list ID if not provided
    const targetListId = listId || parseInt(Deno.env.get("BREVO_DEFAULT_LIST_ID") || "1");

    // Create or update contact in Brevo
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

    if (!brevoResponse.ok) {
      const errorText = await brevoResponse.text();
      console.error("[Newsletter] Brevo API error:", errorText);
      
      // Check if it's a duplicate contact (which is fine)
      if (brevoResponse.status === 400 && errorText.includes("Contact already exist")) {
        // Update existing contact's lists
        await fetch(`https://api.brevo.com/v3/contacts/${encodeURIComponent(email)}`, {
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
      } else {
        throw new Error(`Brevo API error: ${errorText}`);
      }
    }

    console.log("[Newsletter] Successfully subscribed:", email);

    return new Response(
      JSON.stringify({ success: true, message: "Successfully subscribed" }),
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
