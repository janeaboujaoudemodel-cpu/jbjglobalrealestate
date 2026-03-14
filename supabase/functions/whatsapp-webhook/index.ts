import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { checkWebhookReplay, logSecurityEvent, cleanupWebhookReplayLog } from "../_shared/rate-limit-middleware.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppMessage {
  from: string;
  to: string;
  timestamp: string;
  type: string;
  id: string;
  text?: { body: string };
  image?: { id: string; caption?: string };
  document?: { id: string; filename: string };
}

interface WhatsAppWebhookPayload {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        contacts?: Array<{
          profile: { name: string };
          wa_id: string;
        }>;
        messages?: WhatsAppMessage[];
        statuses?: Array<{
          id: string;
          status: string;
          timestamp: string;
          recipient_id: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // WhatsApp webhook verification (GET request)
  if (req.method === "GET") {
    const url = new URL(req.url);
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    const verifyToken = Deno.env.get("WHATSAPP_VERIFY_TOKEN");

    if (mode === "subscribe" && token === verifyToken) {
      console.log("WhatsApp webhook verified successfully");
      return new Response(challenge, { status: 200, headers: { ...corsHeaders } });
    } else {
      console.error("WhatsApp webhook verification failed");
      return new Response("Verification failed", { status: 403, headers: { ...corsHeaders } });
    }
  }

  // Handle incoming messages (POST request)
  if (req.method === "POST") {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    try {
      const payload: WhatsAppWebhookPayload = await req.json();
      
      console.log("Received WhatsApp webhook:", JSON.stringify(payload, null, 2));

      // Periodic cleanup
      cleanupWebhookReplayLog(supabase);

      for (const entry of payload.entry || []) {
        for (const change of entry.changes || []) {
          const value = change.value;
          
          if (value.messages && value.contacts) {
            for (const message of value.messages) {
              // Message deduplication via message ID
              if (message.id) {
                const isReplay = await checkWebhookReplay(supabase, 'whatsapp', message.id);
                if (isReplay) {
                  console.log(`[WhatsApp] Duplicate message skipped: ${message.id}`);
                  continue;
                }
              }

              const contact = value.contacts.find(c => c.wa_id === message.from);
              const senderName = contact?.profile?.name || "Unknown";
              const senderPhone = message.from;
              const messageText = message.text?.body || "[Media message]";
              const messageType = message.type;

              const { error: insertError } = await supabase
                .from("owner_inbox_threads")
                .insert({
                  sender_name: senderName,
                  sender_identifier: senderPhone,
                  channel: "whatsapp",
                  subject: `WhatsApp from ${senderName}`,
                  initial_message: messageText,
                  status: "open",
                  priority: "normal",
                  is_archived: false,
                  metadata: {
                    wa_id: message.from,
                    wa_message_id: message.id,
                    message_type: messageType,
                    phone_number_id: value.metadata?.phone_number_id,
                    timestamp: message.timestamp,
                  },
                });

              if (insertError) {
                console.error("Error storing WhatsApp message:", insertError);
              } else {
                console.log(`Stored WhatsApp message from ${senderName} (${senderPhone})`);
              }
            }
          }

          if (value.statuses) {
            for (const status of value.statuses) {
              console.log(`Message ${status.id} status: ${status.status}`);
            }
          }
        }
      }

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    } catch (error: any) {
      console.error("Error processing WhatsApp webhook:", error);
      return new Response(
        JSON.stringify({ error: error.message }),
        { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }
  }

  return new Response("Method not allowed", { status: 405, headers: { ...corsHeaders } });
};

serve(handler);
