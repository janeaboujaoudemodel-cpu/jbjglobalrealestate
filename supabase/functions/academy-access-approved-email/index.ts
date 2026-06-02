import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const { email, full_name, requested_item_title, note } = await req.json();
    if (!email || typeof email !== 'string') {
      return new Response(JSON.stringify({ error: 'email required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const idempotencyKey = `academy-access-approved-${email}-${Date.now()}`;
    const { error } = await supabase.functions.invoke('send-transactional-email', {
      body: {
        templateName: 'academy-access-approved',
        recipientEmail: email,
        idempotencyKey,
        templateData: {
          name: full_name || 'there',
          itemTitle: requested_item_title || null,
          note: note || null,
        },
      },
    });

    if (error) {
      // Fallback: still return ok — approval itself succeeded.
      console.error('send-transactional-email error', error);
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
