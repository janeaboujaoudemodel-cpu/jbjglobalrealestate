import { createClient } from "npm:@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightWithValidation } from "../_shared/auth-utils.ts";
import { enforceRateLimit } from "../_shared/rate-limit-middleware.ts";

/**
 * Secure Contact Gating Submission
 * 
 * This edge function handles contact form submissions with:
 * 1. Server-side encryption of all PII
 * 2. Rate limiting validation
 * 3. Honeypot field detection
 * 4. No plaintext PII storage
 */

interface ContactSubmission {
  session_id: string;
  full_name: string;
  email: string;
  phone: string;
  nationality?: string;
  location?: string;
  preferred_language?: string;
  service_interest?: string;
  honeypot?: string; // Should be empty - bots fill this
}

// AES-256-GCM PII encryption using Web Crypto API.
// Output bytea layout: [version=1][iv (12 bytes)][ciphertext+gcm tag]
async function deriveAesKey(rawKey: string): Promise<CryptoKey> {
  // Accept a 64-char hex (32-byte) key, otherwise derive 32 bytes via SHA-256.
  let keyBytes: Uint8Array;
  if (/^[0-9a-fA-F]{64}$/.test(rawKey)) {
    keyBytes = new Uint8Array(rawKey.match(/.{1,2}/g)!.map((b) => parseInt(b, 16)));
  } else {
    const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(rawKey));
    keyBytes = new Uint8Array(digest);
  }
  return crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']);
}

async function encryptPII(value: string, key: CryptoKey): Promise<Uint8Array> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(value)),
  );
  const out = new Uint8Array(1 + iv.length + ciphertext.length);
  out[0] = 1;
  out.set(iv, 1);
  out.set(ciphertext, 1 + iv.length);
  return out;
}

// Hash for de-duplication without exposing actual values
async function hashValue(value: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(value.toLowerCase().trim());
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  const corsResponse = handleCorsPreflightWithValidation(req);
  if (corsResponse) return corsResponse;

  const origin = req.headers.get('origin');
  const headers = getCorsHeaders(origin);

  // Rate limit: 10 requests per 15 min per IP
  const { response: blocked } = await enforceRateLimit(req, {
    functionName: 'submit-contact-gating',
    maxRequests: 10,
    windowMinutes: 15,
    keyType: 'ip',
  }, { ...headers, 'Content-Type': 'application/json' });
  if (blocked) return blocked;

  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }

  try {
    const body: ContactSubmission = await req.json();

    // Honeypot check - bots will fill this field
    if (body.honeypot && body.honeypot.trim() !== '') {
      console.log('[Security] Honeypot triggered - blocking bot submission');
      // Return success to not alert the bot, but don't store anything
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Validate required fields
    if (!body.session_id || !body.full_name || !body.email || !body.phone) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Get encryption key from environment
    const encryptionKey = Deno.env.get('PII_ENCRYPTION_KEY');
    if (!encryptionKey) {
      console.error('[SECURITY] PII_ENCRYPTION_KEY not configured');
      return new Response(JSON.stringify({ error: 'Server configuration error' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role for secure storage
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIP = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    // Check rate limits (5 submissions per email in 60 seconds)
    const emailHash = await hashValue(body.email);
    const { count: emailCount } = await supabase
      .from('contact_gating_submissions')
      .select('*', { count: 'exact', head: true })
      .eq('email_hash', emailHash)
      .gte('created_at', new Date(Date.now() - 60000).toISOString());

    if (emailCount && emailCount >= 5) {
      console.log(`[Security] Rate limit exceeded for email hash: ${emailHash.substring(0, 8)}...`);
      return new Response(JSON.stringify({ error: 'Too many submissions. Please wait.' }), {
        status: 429,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    // Encrypt all PII
    const aesKey = await deriveAesKey(encryptionKey);
    const encryptedName = await encryptPII(body.full_name, aesKey);
    const encryptedEmail = await encryptPII(body.email, aesKey);
    const encryptedPhone = await encryptPII(body.phone, aesKey);

    // Store with ONLY encrypted values - no plaintext PII
    const { error: insertError } = await supabase
      .from('contact_gating_submissions')
      .insert({
        session_id: body.session_id,
        // Store ONLY encrypted versions
        full_name_encrypted: encryptedName,
        email_encrypted: encryptedEmail,
        phone_encrypted: encryptedPhone,
        // Non-PII fields can remain plaintext
        nationality: body.nationality || null,
        location: body.location || null,
        preferred_language: body.preferred_language || null,
        service_interest: body.service_interest || null,
        email_verified: true,
        // Store hashes for de-duplication/lookup
        email_hash: emailHash,
      });


    if (insertError) {
      console.error('[Error] Failed to insert contact submission:', insertError);
      return new Response(JSON.stringify({ error: 'Failed to save submission' }), {
        status: 500,
        headers: { ...headers, 'Content-Type': 'application/json' },
      });
    }

    console.log(`[Success] Contact submission stored securely for session: ${body.session_id}`);

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('[Error] Contact submission failed:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
    });
  }
});
