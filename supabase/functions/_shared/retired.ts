/**
 * Retired-endpoint handler.
 *
 * Why these stubs exist instead of just deleting the function directory
 * (JBJ-027): removing a function from this repo does NOT remove it from the
 * Supabase project. An already-deployed function keeps serving its last
 * deployed code, publicly, until it is explicitly undeployed. So deleting a
 * dead-but-vulnerable function is worse than useless — it hides the code from
 * everyone reading the repo while leaving the vulnerability running.
 *
 * Redeploying a function with this handler overwrites the old code with
 * something inert. It opens no Supabase client, reads no secrets, touches no
 * table, and accepts no input — there is nothing left to exploit even if the
 * endpoint stays publicly reachable forever.
 *
 * Once the functions are confirmed undeployed in the Supabase dashboard,
 * these directories can be deleted for real.
 */

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

export function serveRetired(name: string, retiredOn = "2026-08-18") {
  Deno.serve((req: Request) => {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    console.warn(`[retired] ${name} was called after retirement — caller should stop.`);
    return new Response(
      JSON.stringify({
        error: "Gone",
        message: `The '${name}' endpoint was retired on ${retiredOn} and no longer does anything.`,
      }),
      {
        status: 410,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  });
}
