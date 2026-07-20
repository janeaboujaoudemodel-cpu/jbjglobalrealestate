// deno-lint-ignore-file no-explicit-any
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

interface Body {
  submission_id?: string;
  folder_url: string;
  entity_type?: 'auto' | 'project' | 'developer' | 'area' | 'emirate' | 'community';
  entity_names?: string[]; // optional hints from owner
  notes?: string;
}

const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const STOP_WORDS = new Set(['properties', 'property', 'developers', 'developer', 'development', 'developments', 'real', 'estate', 'group', 'llc', 'l', 'by', 'the', 'at', 'in']);
const tokensOf = (s: string) => norm(s).split(' ').filter((t) => t.length > 1 && !STOP_WORDS.has(t));

async function classifyWithAI(folderUrl: string, hint?: string): Promise<{ entity_type: string; items: { name: string; type: string }[]; rationale: string }> {
  if (!LOVABLE_API_KEY) return { entity_type: 'auto', items: [], rationale: 'no ai key' };
  try {
    const res = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content:
              'You classify Google Drive folder submissions for a Dubai real-estate platform. Return STRICT JSON only: {"entity_type":"project|developer|area|emirate|community|mixed","items":[{"name":"string","type":"project|developer|area|emirate|community"}],"rationale":"short"}. Do not guess brands from an opaque Drive ID. Only return item names that are explicitly visible in the folder URL text, owner hints, or owner notes.',
          },
          { role: 'user', content: `Folder URL: ${folderUrl}\nOwner hint / notes: ${hint ?? '(none)'}\nRespond with JSON only.` },
        ],
      }),
    });
    if (!res.ok) return { entity_type: 'auto', items: [], rationale: `ai ${res.status}` };
    const j = await res.json();
    const txt: string = j?.choices?.[0]?.message?.content ?? '';
    const m = txt.match(/\{[\s\S]*\}/);
    if (!m) return { entity_type: 'auto', items: [], rationale: 'no json' };
    const parsed = JSON.parse(m[0]);
    return {
      entity_type: parsed.entity_type ?? 'auto',
      items: Array.isArray(parsed.items) ? parsed.items : [],
      rationale: parsed.rationale ?? '',
    };
  } catch (e) {
    return { entity_type: 'auto', items: [], rationale: `err ${(e as Error).message}` };
  }
}

async function matchEntity(supa: any, type: string, name: string) {
  const n = norm(name);
  if (!n) return null;
  const tokens = tokensOf(name);
  if (!tokens.length) return null;
  const tableMap: Record<string, string> = {
    project: 'projects',
    developer: 'developers',
    area: 'areas',
    emirate: 'emirates',
    community: 'communities',
  };
  const table = tableMap[type];
  if (!table) return null;
  const selectMap: Record<string, string> = {
    project: 'id,name,slug,cover_image_url,description,updated_at',
    developer: 'id,name,slug,logo_url,description,updated_at',
    area: 'id,name,slug,description,updated_at',
    emirate: 'id,name,slug,updated_at',
    community: 'id,name,slug,description,updated_at',
  };
  const { data } = await supa
    .from(table)
    .select(selectMap[type])
    .or(tokens.slice(0, 4).map((t) => `name.ilike.%${t}%`).join(','))
    .limit(20);
  if (!data?.length) return null;
  // Strict match only. This prevents a folder for Mashriq Elite being attached
  // to Emaar/Ammar just because one generic token happened to overlap.
  const scored = data.map((r: any) => {
    const rn = norm(r.name ?? '');
    const rowTokens = tokensOf(r.name ?? '');
    const overlap = tokens.filter((t) => rowTokens.includes(t)).length;
    const exact = rn === n;
    const contained = n.length >= 6 && (rn.includes(n) || n.includes(rn));
    const ratio = overlap / Math.max(tokens.length, rowTokens.length, 1);
    const score = exact ? 100 : contained && ratio >= 0.75 ? 80 : ratio >= 0.82 ? 70 : 0;
    return { row: r, score };
  }).sort((a, b) => b.score - a.score);
  return scored[0].score >= 70 ? scored[0].row : null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const supa = createClient(SUPABASE_URL, SERVICE_KEY);
  try {
    const body = (await req.json()) as Body;
    const folderUrl = (body.folder_url || '').trim();
    if (!folderUrl) {
      return new Response(JSON.stringify({ error: 'folder_url required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Auth (owner submissions link to auth.uid())
    const authHeader = req.headers.get('Authorization') ?? '';
    const jwt = authHeader.replace('Bearer ', '');
    const { data: userRes } = await supa.auth.getUser(jwt);
    const userId = userRes?.user?.id ?? null;

    let submissionId = body.submission_id;
    if (!submissionId) {
      const { data: ins, error: insErr } = await supa.from('drive_drop_submissions').insert({
        folder_url: folderUrl,
        submitted_by: userId,
        entity_type: body.entity_type ?? 'auto',
        status: 'processing',
        notes: body.notes ?? null,
      }).select('id').single();
      if (insErr) throw insErr;
      submissionId = ins.id;
    } else {
      await supa.from('drive_drop_submissions').update({ status: 'processing' }).eq('id', submissionId);
    }

    // AI classification
    const cls = await classifyWithAI(folderUrl, [body.notes, ...(body.entity_names ?? [])].filter(Boolean).join(' | '));

    // If owner supplied entity_names, merge them in as trusted candidate names.
    const seededItems = (body.entity_names ?? []).map((n) => ({ name: n, type: body.entity_type && body.entity_type !== 'auto' ? body.entity_type : cls.entity_type, source: 'owner_hint' }));
    const evidence = norm([folderUrl, body.notes ?? '', ...(body.entity_names ?? [])].join(' '));
    const aiItems = (cls.items ?? [])
      .filter((it: any) => {
        const itemTokens = tokensOf(it.name ?? '');
        return itemTokens.length > 0 && itemTokens.some((t) => evidence.includes(t));
      })
      .map((it: any) => ({ ...it, source: 'visible_drive_text' }));
    const dedupe = new Map<string, { name: string; type: string; source?: string }>();
    for (const item of [...seededItems, ...aiItems]) {
      const key = `${item.type}:${norm(item.name)}`;
      if (norm(item.name)) dedupe.set(key, item);
    }
    const allItems = Array.from(dedupe.values()).slice(0, 50);

    // Match each item and build before/after
    const beforeAfter: any[] = [];
    for (const it of allItems) {
      const t = it.type === 'mixed' ? 'project' : it.type;
      const match = await matchEntity(supa, t, it.name);
      beforeAfter.push({
        name: it.name,
        type: t,
        matched: !!match,
        before: match ?? null,
        after: {
          name: it.name,
          drive_folder_url: folderUrl,
          source: it.source ?? 'drive_drop_candidate',
        },
      });
    }

    const summary = {
      total: allItems.length,
      matched: beforeAfter.filter((x) => x.matched).length,
      new: beforeAfter.filter((x) => !x.matched).length,
      entity_type: cls.entity_type,
      ai_rationale: cls.rationale,
    };

    await supa.from('drive_drop_submissions').update({
      status: 'ready_for_review',
      discovered_items: allItems,
      before_after: beforeAfter,
      summary,
    }).eq('id', submissionId);

    return new Response(JSON.stringify({ ok: true, submission_id: submissionId, summary, before_after: beforeAfter }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('drive-drop-classify error', e);
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
