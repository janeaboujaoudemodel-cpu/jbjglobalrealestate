/**
 * Safe error responses — never reveal internal secret names or config details.
 * Use these instead of raw error messages in edge functions.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

export function configErrorResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Service configuration error' }),
    { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export function authErrorResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Authentication required' }),
    { status: 401, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export function forbiddenResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'Access denied' }),
    { status: 403, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}

export function internalErrorResponse(): Response {
  return new Response(
    JSON.stringify({ error: 'An internal error occurred' }),
    { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
  );
}
