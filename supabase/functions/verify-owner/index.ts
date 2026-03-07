import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ isOwner: false, reason: "no_auth" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    const { data: { user }, error } = await supabaseClient.auth.getUser();
    
    if (error || !user) {
      return new Response(
        JSON.stringify({ isOwner: false, reason: "no_user" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ownerEmail = Deno.env.get("OWNER_EMAIL");
    
    if (!ownerEmail) {
      console.error("OWNER_EMAIL not configured");
      return new Response(
        JSON.stringify({ isOwner: false, reason: "no_config" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isOwner = user.email?.toLowerCase() === ownerEmail.toLowerCase();

    return new Response(
      JSON.stringify({ 
        isOwner, 
        email: user.email,
        reason: isOwner ? undefined : 'email_mismatch',
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error verifying owner:", error);
    return new Response(
      JSON.stringify({ isOwner: false, reason: "error" }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 500 }
    );
  }
});
