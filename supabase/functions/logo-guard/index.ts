/**
 * logo-guard — Detects JBJ brand monogram in uploads.
 * Returns policy decision: allow, owner_auto_style, blocked_non_owner.
 * Non-owners attempting to use JBJ branding are blocked and a support ticket is logged.
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const OWNER_EMAIL = 'janeaboujaoudenails@gmail.com';
const JBJ_PATTERNS = ['JBJ', 'jbj', 'J.B.J', 'j.b.j'];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    // Get user from JWT
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ policy: 'allow' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ policy: 'allow' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { monogramText, companyName } = body;

    // Check if the monogram or company name matches JBJ patterns
    const textToCheck = `${monogramText || ''} ${companyName || ''}`.toUpperCase();
    const isJBJDetected = JBJ_PATTERNS.some(p => textToCheck.includes(p.toUpperCase()));

    if (!isJBJDetected) {
      return new Response(JSON.stringify({ policy: 'allow' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // JBJ detected — check if user is owner
    const isOwner = user.email?.toLowerCase() === OWNER_EMAIL.toLowerCase();

    if (isOwner) {
      return new Response(JSON.stringify({
        policy: 'owner_auto_style',
        monogramColors: { 0: null, 1: '#B8860B', 2: null }, // J=ink, B=gold, J=ink
        dividerColor: '#B8860B',
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Non-owner using JBJ branding — block and log incident
    await supabase.from('admin_tasks').insert({
      user_id: user.id,
      title: `[SECURITY] Unauthorized JBJ brand usage attempt`,
      description: `User ${user.email} (ID: ${user.id}) attempted to use JBJ monogram/branding. Monogram: "${monogramText}", Company: "${companyName}". Blocked and directed to support.`,
      category: 'security',
      priority: 'high',
      status: 'pending',
    }).then(() => {});

    return new Response(JSON.stringify({
      policy: 'blocked_non_owner',
      message: 'This monogram is reserved for JBJ Global Real Estate. Please request unlock from support.',
      supportUrl: '/ticket-hub',
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
