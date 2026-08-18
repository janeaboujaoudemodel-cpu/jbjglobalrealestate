// AI Lead Distribution — assigns N leads to a broker, scored by Lovable AI.
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization') ?? '';
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // Verify caller is authenticated
    const authed = createClient(supabaseUrl, anonKey, { global: { headers: { Authorization: authHeader } } });
    const { data: u } = await authed.auth.getUser();
    if (!u?.user) return json({ error: 'Unauthorized' }, 401);

    const body = await req.json().catch(() => ({}));
    const brokerId: string | undefined = body.brokerId;
    const count: number = Math.min(Math.max(parseInt(body.count ?? '20', 10) || 20, 1), 100);
    const showContact: boolean = body.showContactDetails !== false;
    if (!brokerId) return json({ error: 'brokerId required' }, 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // Confirm caller has permission (owner/admin)
    const { data: roleRow } = await admin
      .from('user_roles')
      .select('role')
      .eq('user_id', u.user.id)
      .in('role', ['admin', 'owner'])
      .maybeSingle();
    if (!roleRow) return json({ error: 'Forbidden' }, 403);

    // Load broker specialty for scoring
    const { data: broker } = await admin
      .from('broker_profiles')
      .select('user_id, display_name, specializations, current_tier')
      .eq('user_id', brokerId)
      .maybeSingle();

    // Exclude leads currently in an active assignment
    const { data: activeAssignments } = await admin
      .from('crm_lead_assignments')
      .select('lead_id')
      .is('unassigned_at', null)
      .not('status', 'in', '(returned,junk,lost)');
    const excludeIds = new Set((activeAssignments ?? []).map((r: any) => r.lead_id).filter(Boolean));

    const { data: pool } = await admin
      .from('crm_leads')
      .select('id, full_name, source, budget_min, budget_max, preferred_location, property_type, created_at')
      .is('deleted_at', null)
      .order('created_at', { ascending: false })
      .limit(count * 3 + excludeIds.size);

    const candidates = (pool ?? []).filter((l: any) => !excludeIds.has(l.id)).slice(0, count * 3);
    if (candidates.length === 0) return json({ error: 'No leads available in pool' }, 400);

    // AI scoring (best-effort)
    let scored: Array<{ id: string; score: number; reasoning: string }> = [];
    const lovableKey = Deno.env.get('LOVABLE_API_KEY');
    if (lovableKey && broker) {
      try {
        const prompt = `You are matching real-estate leads to a broker.
Broker: ${broker.display_name ?? 'Unknown'}. Specializations: ${JSON.stringify(broker.specializations ?? [])}. Tier: ${broker.current_tier ?? 'standard'}.

Score each lead 0-100 for fit and give one short reason.
Return strict JSON: {"results":[{"id":"...","score":85,"reasoning":"..."}, ...]}

Leads:
${candidates.slice(0, count * 2).map((l: any) => JSON.stringify({ id: l.id, source: l.source, budget_min: l.budget_min, budget_max: l.budget_max, location: l.preferred_location, type: l.property_type })).join('\n')}`;

        const r = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Lovable-API-Key': lovableKey },
          body: JSON.stringify({
            model: 'google/gemini-3.5-flash',
            messages: [{ role: 'user', content: prompt }],
            response_format: { type: 'json_object' },
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const parsed = JSON.parse(j.choices?.[0]?.message?.content ?? '{}');
          scored = Array.isArray(parsed.results) ? parsed.results : [];
        }
      } catch (e) {
        console.warn('AI scoring failed, falling back to recency', e);
      }
    }

    // Pick top N by score if we have scoring, else fall back to recency
    const scoreMap = new Map(scored.map(s => [s.id, s]));
    const chosen = [...candidates]
      .sort((a: any, b: any) => (scoreMap.get(b.id)?.score ?? 0) - (scoreMap.get(a.id)?.score ?? 0))
      .slice(0, count);

    const batchId = crypto.randomUUID();
    const rows = chosen.map((l: any) => ({
      lead_id: l.id,
      assigned_to_user_id: brokerId,
      assigned_by_user_id: u.user.id,
      status: 'assigned',
      ai_score: scoreMap.get(l.id)?.score ?? null,
      ai_reasoning: scoreMap.get(l.id)?.reasoning ?? null,
      distribution_batch_id: batchId,
      show_contact_details: showContact,
    }));

    const { data: inserted, error: insErr } = await admin
      .from('crm_lead_assignments')
      .insert(rows)
      .select('id, lead_id, ai_score');
    if (insErr) {
      // Audit 6.1: log the driver message, return a static one.
      console.error('[distribute-leads] assignment insert failed:', insErr.message);
      return json({ error: 'An internal error occurred' }, 500);
    }

    return json({ ok: true, batchId, count: inserted?.length ?? 0, ai_used: scored.length > 0 });
  } catch (e) {
    console.error(e);
    return json({ error: 'An internal error occurred' }, 500);
  }
});

function json(o: unknown, status = 200) {
  return new Response(JSON.stringify(o), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}
