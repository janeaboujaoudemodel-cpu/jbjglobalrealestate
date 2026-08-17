// Flag an assigned lead as junk -> returns to pool.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const authed = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await authed.auth.getUser();
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);

    const { assignmentId, reason } = await req.json();
    if (!assignmentId) return json({ error: 'assignmentId required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: row } = await admin.from('crm_lead_assignments').select('assigned_to_user_id, lead_id').eq('id', assignmentId).maybeSingle();
    if (!row) return json({ error: 'Not found' }, 404);
    if (row.assigned_to_user_id !== u.user.id) {
      const { data: roleRow } = await admin.from('user_roles').select('role').eq('user_id', u.user.id).in('role', ['admin','owner']).maybeSingle();
      if (!roleRow) return json({ error: 'Forbidden' }, 403);
    }

    const { error } = await admin.from('crm_lead_assignments').update({
      status: 'junk', returned_at: new Date().toISOString(), returned_reason: reason ?? null, unassigned_at: new Date().toISOString(),
    }).eq('id', assignmentId);
    if (error) {
      // Audit 6.1: log the driver message, return a static one.
      console.error('[flag-lead-junk] update failed:', error.message);
      return json({ error: 'An internal error occurred' }, 500);
    }

    await admin.from('broker_activity_log').insert({
      broker_user_id: u.user.id, lead_id: row.lead_id, assignment_id: assignmentId,
      activity_type: 'flag_junk', activity_data: { reason: reason ?? null },
    });

    return json({ ok: true });
  } catch (e) {
    console.error('[flag-lead-junk] unexpected:', e);
    return json({ error: 'An internal error occurred' }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
