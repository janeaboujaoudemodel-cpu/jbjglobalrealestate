import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { z } from "npm:zod@3";

const MessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().max(12000),
  timestamp: z.string().datetime(),
});

const BodySchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("create"),
    userEmail: z.string().email().max(200),
    userName: z.string().max(120),
    userPhone: z.string().max(40).optional().default(""),
    serviceType: z.string().min(1).max(80),
    pageSource: z.string().max(300),
  }),
  z.object({
    action: z.literal("get"),
    conversationId: z.string().uuid(),
    guestToken: z.string().min(40).max(200),
  }),
  z.object({
    action: z.literal("update"),
    conversationId: z.string().uuid(),
    guestToken: z.string().min(40).max(200),
    messages: z.array(MessageSchema).max(200),
    status: z.string().max(60).optional(),
    rating: z.number().int().min(1).max(5).optional(),
    ratingFeedback: z.string().max(2000).nullable().optional(),
  }),
]);

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const hex = (bytes: Uint8Array) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
const hash = async (value: string) => {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return hex(new Uint8Array(digest));
};

function admin() {
  return createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    { auth: { persistSession: false } },
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return json({ error: "method_not_allowed" }, 405);

  try {
    const parsed = BodySchema.safeParse(await req.json());
    if (!parsed.success) return json({ error: parsed.error.flatten().fieldErrors }, 400);
    const body = parsed.data;
    const db = admin();

    if (body.action === "create") {
      const token = hex(crypto.getRandomValues(new Uint8Array(32)));
      const authHeader = req.headers.get("Authorization") ?? "";
      let userId: string | null = null;
      let verifiedEmail: string | null = null;
      if (authHeader.startsWith("Bearer ")) {
        const jwt = authHeader.slice(7);
        const authClient = createClient(
          Deno.env.get("SUPABASE_URL")!,
          Deno.env.get("SUPABASE_ANON_KEY")!,
          { global: { headers: { Authorization: authHeader } } },
        );
        const { data } = await authClient.auth.getClaims(jwt);
        if (data?.claims?.sub) {
          userId = String(data.claims.sub);
          verifiedEmail = typeof data.claims.email === "string" ? data.claims.email : null;
        }
      }

      const { data, error } = await db.from("chat_conversations").insert({
        user_id: userId,
        user_email: verifiedEmail ?? body.userEmail.toLowerCase().trim(),
        user_name: body.userName.trim(),
        user_phone: body.userPhone.trim(),
        service_type: body.serviceType,
        page_source: body.pageSource,
        messages: [],
        status: "active",
        identity_verified: Boolean(userId),
        guest_token_hash: await hash(token),
      }).select("id").single();
      if (error) throw error;
      return json({ id: data.id, guestToken: token });
    }

    const tokenHash = await hash(body.guestToken);
    if (body.action === "get") {
      const { data, error } = await db.from("chat_conversations")
        .select("messages,owner_joined,status")
        .eq("id", body.conversationId)
        .eq("guest_token_hash", tokenHash)
        .maybeSingle();
      if (error) throw error;
      if (!data) return json({ error: "conversation_not_found" }, 404);
      return json(data);
    }

    const patch: Record<string, unknown> = {
      messages: body.messages,
      updated_at: new Date().toISOString(),
    };
    if (body.status) patch.status = body.status;
    if (body.rating !== undefined) patch.rating = body.rating;
    if (body.ratingFeedback !== undefined) patch.rating_feedback = body.ratingFeedback;

    const { data, error } = await db.from("chat_conversations")
      .update(patch)
      .eq("id", body.conversationId)
      .eq("guest_token_hash", tokenHash)
      .select("id")
      .maybeSingle();
    if (error) throw error;
    if (!data) return json({ error: "conversation_not_found" }, 404);
    return json({ ok: true });
  } catch (error) {
    console.error("[chat-session]", error);
    return json({ error: "chat_session_failed" }, 500);
  }
});