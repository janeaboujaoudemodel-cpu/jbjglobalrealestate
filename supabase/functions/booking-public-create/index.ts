// JBJ Bookings — public booking creation (with optional email verification)
// Flow:
//   POST { slug, starts_at, customer:{name,email,phone}, form_data, guests[], code? }
//   If page.require_email_verification === true and !code: sends a 6-digit code, no appointment created.
//   If code supplied: verifies code, then atomically creates appointment (server-side conflict check).
import { corsHeaders } from 'npm:@supabase/supabase-js@2/cors';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { z } from 'npm:zod@3.23.8';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

const BodySchema = z.object({
  slug: z.string().min(1).max(80),
  starts_at: z.string(), // ISO UTC
  customer: z.object({
    name: z.string().trim().min(1).max(200),
    email: z.string().trim().email().max(320),
    phone: z.string().trim().max(60).optional().nullable(),
  }),
  form_data: z.record(z.any()).default({}),
  guests: z.array(z.string().email()).max(20).default([]),
  code: z.string().length(6).optional(),
});

async function sha256(s: string): Promise<string> {
  const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(s));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function sendVerificationEmail(opts: {
  to: string; code: string;
  workspaceName: string; senderName: string; senderEmail: string; eventName: string;
}) {
  if (!RESEND_KEY) {
    console.warn('[booking] RESEND_API_KEY missing — verification code logged only:', opts.code);
    return;
  }
  const html = `
    <div style="font-family:Georgia,serif;background:#ffffff;padding:32px;color:#0a0a0a">
      <div style="max-width:520px;margin:0 auto;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#064E3B 0%,#042c1c 60%,#000 100%);padding:28px;color:#fff;text-align:center">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:22px;letter-spacing:0.5px">${opts.workspaceName}</div>
          <div style="opacity:0.85;font-size:12px;margin-top:6px;letter-spacing:2px;text-transform:uppercase">Verify your email</div>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 12px;font-size:15px">To confirm your booking for <b>${opts.eventName}</b>, enter this 6-digit code:</p>
          <div style="font-size:36px;letter-spacing:8px;text-align:center;font-weight:700;color:#064E3B;padding:16px;background:#F0FDF4;border-radius:10px">${opts.code}</div>
          <p style="margin:20px 0 0;font-size:12px;color:#6B7280">This code expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </div>
        <div style="padding:14px;background:#F9FAFB;text-align:center;font-size:11px;color:#9CA3AF">Powered by JBJ Bookings</div>
      </div>
    </div>`;
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${opts.senderName} <${opts.senderEmail}>`,
      to: [opts.to],
      subject: `Your verification code: ${opts.code}`,
      html,
    }),
  });
  if (!res.ok) console.error('[booking] resend send failed', res.status, await res.text());
}

async function sendConfirmationEmail(opts: {
  to: string; workspaceName: string; senderName: string; senderEmail: string;
  eventName: string; startsAt: string; timezone: string; guests: string[];
}) {
  if (!RESEND_KEY) return;
  const when = new Intl.DateTimeFormat('en-US', {
    timeZone: opts.timezone, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit',
  }).format(new Date(opts.startsAt));
  const html = `
    <div style="font-family:Georgia,serif;background:#fff;padding:32px;color:#0a0a0a">
      <div style="max-width:560px;margin:0 auto;border:1px solid #E5E7EB;border-radius:12px;overflow:hidden">
        <div style="background:linear-gradient(135deg,#064E3B 0%,#042c1c 60%,#000 100%);padding:32px;color:#fff;text-align:center">
          <div style="font-family:'Cormorant Garamond',Georgia,serif;font-size:24px">${opts.workspaceName}</div>
          <div style="opacity:0.85;font-size:12px;margin-top:8px;letter-spacing:2px;text-transform:uppercase">Booking Confirmed</div>
        </div>
        <div style="padding:28px">
          <p style="margin:0 0 8px;font-size:15px">Your booking for <b>${opts.eventName}</b> is confirmed.</p>
          <div style="margin:16px 0;padding:16px;background:#F0FDF4;border-left:3px solid #064E3B;border-radius:6px">
            <div style="font-size:13px;color:#6B7280">WHEN</div>
            <div style="font-size:16px;color:#064E3B;font-weight:600;margin-top:4px">${when} (${opts.timezone})</div>
          </div>
          ${opts.guests.length ? `<p style="font-size:13px;color:#6B7280">Guests invited: ${opts.guests.join(', ')}</p>` : ''}
          <p style="font-size:12px;color:#9CA3AF;margin-top:20px">You will receive further details from our team shortly.</p>
        </div>
        <div style="padding:14px;background:#F9FAFB;text-align:center;font-size:11px;color:#9CA3AF">Powered by JBJ Bookings</div>
      </div>
    </div>`;
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: `${opts.senderName} <${opts.senderEmail}>`,
      to: [opts.to, ...opts.guests],
      subject: `Booking confirmed — ${opts.eventName}`,
      html,
    }),
  }).catch((e) => console.error('confirmation send failed', e));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) {
      return new Response(JSON.stringify({ error: parsed.error.flatten() }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const { slug, starts_at, customer, form_data, guests, code } = parsed.data;

    const sb = createClient(SUPABASE_URL, SERVICE_ROLE);

    // Load page + event + workspace
    const { data: pageRow } = await sb
      .from('jbj_booking_pages')
      .select('id, event_type_id, is_active, require_email_verification, jbj_booking_event_types!inner(id, name, workspace_id, duration_minutes, is_active, jbj_booking_workspaces!inner(id, display_name, sender_name, sender_email, timezone, is_active))')
      .eq('slug', slug)
      .maybeSingle();

    if (!pageRow || !pageRow.is_active) {
      return new Response(JSON.stringify({ error: 'page_not_found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const evt: any = (pageRow as any).jbj_booking_event_types;
    const ws: any = evt.jbj_booking_workspaces;
    if (!evt.is_active || !ws.is_active) {
      return new Response(JSON.stringify({ error: 'inactive' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const startsAtDate = new Date(starts_at);
    if (isNaN(startsAtDate.getTime())) {
      return new Response(JSON.stringify({ error: 'bad_starts_at' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const endsAtDate = new Date(startsAtDate.getTime() + evt.duration_minutes * 60_000);

    // ── Rate limits (abuse-guard) ─────────────────────────────────────────
    // Max 5 bookings per email per rolling 24h, and 10 per IP per hour.
    const oneHourAgo = new Date(Date.now() - 60 * 60_000).toISOString();
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const ip = (req.headers.get('x-forwarded-for') ?? '').split(',')[0].trim() || null;

    const { count: emailCount } = await sb
      .from('jbj_booking_appointments')
      .select('id', { count: 'exact', head: true })
      .eq('customer_email', customer.email.toLowerCase())
      .gte('created_at', oneDayAgo);
    if ((emailCount ?? 0) >= 5) {
      return new Response(JSON.stringify({ error: 'rate_limited_email' }), {
        status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (ip) {
      const { count: ipCount } = await sb
        .from('jbj_booking_audit_log')
        .select('id', { count: 'exact', head: true })
        .contains('details', { ip })
        .gte('created_at', oneHourAgo);
      if ((ipCount ?? 0) >= 10) {
        return new Response(JSON.stringify({ error: 'rate_limited_ip' }), {
          status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
    }


    // Email verification path
    if (pageRow.require_email_verification) {
      if (!code) {
        // Send code
        const genCode = Math.floor(100000 + Math.random() * 900000).toString();
        const hash = await sha256(`${customer.email.toLowerCase()}:${slug}:${genCode}`);
        await sb.from('jbj_booking_email_verifications').insert({
          email: customer.email.toLowerCase(),
          slug,
          code_hash: hash,
          expires_at: new Date(Date.now() + 10 * 60_000).toISOString(),
        });
        await sendVerificationEmail({
          to: customer.email,
          code: genCode,
          workspaceName: ws.display_name,
          senderName: ws.sender_name,
          senderEmail: ws.sender_email,
          eventName: evt.name,
        });
        return new Response(JSON.stringify({ step: 'verify_email' }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      } else {
        // Verify code
        const hash = await sha256(`${customer.email.toLowerCase()}:${slug}:${code}`);
        const { data: verif } = await sb
          .from('jbj_booking_email_verifications')
          .select('id, expires_at, verified_at, attempts')
          .eq('email', customer.email.toLowerCase())
          .eq('slug', slug)
          .eq('code_hash', hash)
          .is('verified_at', null)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (!verif) {
          return new Response(JSON.stringify({ error: 'invalid_code' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        if (new Date(verif.expires_at) < new Date()) {
          return new Response(JSON.stringify({ error: 'code_expired' }), {
            status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }
        await sb.from('jbj_booking_email_verifications').update({ verified_at: new Date().toISOString() }).eq('id', verif.id);
      }
    }

    // Conflict check via SQL function (atomic-ish; DB is source of truth)
    const { data: freeRes, error: freeErr } = await sb.rpc('jbj_booking_slot_is_free', {
      _event_type_id: evt.id,
      _starts_at: startsAtDate.toISOString(),
      _ends_at: endsAtDate.toISOString(),
    });
    if (freeErr) {
      return new Response(JSON.stringify({ error: 'conflict_check_failed', details: freeErr.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    if (freeRes === false) {
      return new Response(JSON.stringify({ error: 'slot_taken' }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create appointment
    const { data: appt, error: apptErr } = await sb
      .from('jbj_booking_appointments')
      .insert({
        workspace_id: ws.id,
        event_type_id: evt.id,
        booking_page_id: pageRow.id,
        status: 'awaiting_approval',
        starts_at: startsAtDate.toISOString(),
        ends_at: endsAtDate.toISOString(),
        timezone: ws.timezone,
        customer_name: customer.name,
        customer_email: customer.email,
        customer_phone: customer.phone ?? null,
        form_data,
        email_verified: pageRow.require_email_verification,
      })
      .select('id')
      .single();

    if (apptErr || !appt) {
      return new Response(JSON.stringify({ error: 'create_failed', details: apptErr?.message }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Guests
    if (guests.length) {
      const rows = Array.from(new Set(guests.map((g) => g.toLowerCase()))).map((email) => ({ appointment_id: appt.id, email }));
      await sb.from('jbj_booking_guests').insert(rows);
    }

    // Audit
    await sb.from('jbj_booking_audit_log').insert({
      appointment_id: appt.id,
      action: 'created',
      actor: 'public',
      details: { slug, ip: req.headers.get('x-forwarded-for') ?? null },
    });

    // Fire confirmation email (fire-and-forget)
    sendConfirmationEmail({
      to: customer.email,
      workspaceName: ws.display_name,
      senderName: ws.sender_name,
      senderEmail: ws.sender_email,
      eventName: evt.name,
      startsAt: startsAtDate.toISOString(),
      timezone: ws.timezone,
      guests,
    }).catch(() => {});

    return new Response(JSON.stringify({ step: 'confirmed', appointment_id: appt.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('booking create error', e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
