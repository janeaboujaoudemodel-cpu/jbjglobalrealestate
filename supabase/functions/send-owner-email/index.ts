/**
 * Send Owner Email — Edge Function
 * 
 * Sends outbound emails on behalf of the owner using Resend API (company)
 * or falls back to normal mode (personal / no key).
 * 
 * ACTIONS:
 *   - save_personal_key: Validate & store personal Resend API key in DB
 *   - remove_personal_key: Remove personal Resend API key from DB
 *   - check_status: Return company + personal key statuses
 *   - (default): Send email
 * 
 * ACCESS: Owner-only (authenticated + email check)
 */
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { quotaGuardedFetch } from "../_shared/quotaGuardedFetch.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const OWNER_EMAIL = "janeaboujaoudenails@gmail.com";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  senderId: string;
  senderName: string;
  senderEmail: string;
  senderTitle: string;
  account: "company" | "personal";
  useResend: boolean;
  alsoNotifyChat?: boolean;
  chatRecipientId?: string;
  attachments?: Array<{
    filename: string;
    content: string; // base64 data URI or URL
    type?: string;   // MIME type
  }>;
}

/**
 * Authenticate the request and return user + service client
 */
async function authenticate(req: Request) {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) throw new Error("NO_AUTH");

  const supabaseClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_ANON_KEY") ?? "",
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
  if (authError || !user || user.email !== OWNER_EMAIL) throw new Error("FORBIDDEN");

  const serviceClient = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  return { user, serviceClient };
}

function jsonResponse(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { user, serviceClient } = await authenticate(req);
    const body = await req.json();
    const action = body.action;

    // ─── ACTION: check_recipient ───
    if (action === "check_recipient") {
      const email = body.email?.trim()?.toLowerCase();
      if (!email) {
        return jsonResponse({ isRegistered: false, userId: null, displayName: null });
      }

      // Check crm_users_profile
      const { data: crmProfile } = await serviceClient
        .from("crm_users_profile")
        .select("user_id, display_name, crm_role")
        .ilike("email", email)
        .maybeSingle();

      if (crmProfile) {
        return jsonResponse({
          isRegistered: true,
          userId: crmProfile.user_id,
          displayName: crmProfile.display_name,
          teamMemberId: null,
        });
      }

      // Check profiles table
      const { data: profile } = await serviceClient
        .from("profiles")
        .select("id, display_name, email")
        .ilike("email", email)
        .maybeSingle();

      if (profile) {
        return jsonResponse({
          isRegistered: true,
          userId: profile.id,
          displayName: profile.display_name,
          teamMemberId: null,
        });
      }

      // Check if it's a @jbj.ae domain (internal team email)
      if (email.endsWith("@jbj.ae")) {
        return jsonResponse({
          isRegistered: true,
          userId: null,
          displayName: email.split("@")[0],
          teamMemberId: email.split("@")[0],
        });
      }

      return jsonResponse({ isRegistered: false, userId: null, displayName: null });
    }

    // ─── ACTION: check_status ───
    if (action === "check_status") {
      const { data: settings } = await serviceClient
        .from("email_hub_settings")
        .select("*");

      const companyKeyExists = !!Deno.env.get("RESEND_API_KEY");

      // Get last sent email timestamp
      const { data: lastSent } = await serviceClient
        .from("owner_comm_messages")
        .select("created_at, metadata")
        .eq("direction", "outbound")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      const settingsMap: Record<string, any> = {};
      if (settings) {
        for (const s of settings) {
          settingsMap[s.setting_key] = {
            is_active: s.is_active,
            last_verified_at: s.last_verified_at,
            has_value: !!s.setting_value,
          };
        }
      }

      return jsonResponse({
        company: {
          api_key_exists: companyKeyExists,
          domain: "jbj.ae",
          outbound_active: settingsMap.company_outbound?.is_active ?? companyKeyExists,
          last_verified_at: settingsMap.company_resend_key?.last_verified_at,
        },
        personal: {
          api_key_exists: settingsMap.personal_resend_key?.has_value ?? false,
          is_active: settingsMap.personal_resend_key?.is_active ?? false,
          outbound_active: settingsMap.personal_outbound?.is_active ?? false,
          last_verified_at: settingsMap.personal_resend_key?.last_verified_at,
        },
        last_sent: lastSent ? {
          at: lastSent.created_at,
          method: (lastSent.metadata as any)?.send_method,
          account: (lastSent.metadata as any)?.account,
        } : null,
      });
    }

    // ─── ACTION: save_personal_key ───
    if (action === "save_personal_key") {
      const apiKey = body.apiKey?.trim();
      if (!apiKey || !apiKey.startsWith("re_")) {
        return jsonResponse({ error: "Invalid key format. Must start with re_" }, 400);
      }

      // Validate key by calling Resend API
      const testRes = await fetch("https://api.resend.com/api-keys", {
        method: "GET",
        headers: { "Authorization": `Bearer ${apiKey}` },
      });

      if (!testRes.ok) {
        // Update DB to show invalid state
        await serviceClient
          .from("email_hub_settings")
          .update({
            is_active: false,
            setting_value: null,
            last_verified_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("setting_key", "personal_resend_key");

        return jsonResponse({ 
          valid: false, 
          status: "invalid",
          error: "API key validation failed. Please check the key is correct." 
        });
      }

      // Key is valid — store in DB
      const now = new Date().toISOString();
      await serviceClient
        .from("email_hub_settings")
        .update({
          setting_value: apiKey,
          is_active: true,
          last_verified_at: now,
          updated_at: now,
        })
        .eq("setting_key", "personal_resend_key");

      // Also activate personal outbound
      await serviceClient
        .from("email_hub_settings")
        .update({
          is_active: true,
          last_verified_at: now,
          updated_at: now,
        })
        .eq("setting_key", "personal_outbound");

      return jsonResponse({ valid: true, status: "active" });
    }

    // ─── ACTION: remove_personal_key ───
    if (action === "remove_personal_key") {
      const now = new Date().toISOString();
      await serviceClient
        .from("email_hub_settings")
        .update({
          setting_value: null,
          is_active: false,
          last_verified_at: null,
          updated_at: now,
        })
        .eq("setting_key", "personal_resend_key");

      await serviceClient
        .from("email_hub_settings")
        .update({
          is_active: false,
          updated_at: now,
        })
        .eq("setting_key", "personal_outbound");

      return jsonResponse({ success: true, status: "removed" });
    }

    // ─── DEFAULT ACTION: Send Email ───
    const emailBody: SendEmailRequest = body;
    if (!emailBody.to || !emailBody.subject) {
      return jsonResponse({ error: "Missing to/subject" }, 400);
    }

    // Build signature block
    const signatureHtml = `
      <br/><br/>
      <div style="border-top: 1px solid #e5e5e5; padding-top: 16px; margin-top: 16px; font-family: Arial, sans-serif;">
        <p style="margin: 0; font-weight: 600; color: #333;">${emailBody.senderName}</p>
        <p style="margin: 2px 0; font-size: 13px; color: #666;">${emailBody.senderTitle}</p>
        ${emailBody.account === "company" ? '<p style="margin: 2px 0; font-size: 13px; color: #666;">JBJ Global Real Estate</p>' : ''}
        <p style="margin: 2px 0; font-size: 13px; color: #B89555;">${emailBody.senderEmail}</p>
      </div>
    `;

    const fullHtml = `<div style="font-family: Arial, sans-serif; color: #333; line-height: 1.6;">${emailBody.body.replace(/\n/g, '<br/>')}${signatureHtml}</div>`;

    let sendMethod = "normal";
    let resendMessageId: string | null = null;

    // Determine which API key to use
    let apiKey: string | null = null;
    if (emailBody.useResend) {
      if (emailBody.account === "company") {
        apiKey = Deno.env.get("RESEND_API_KEY") || null;
      } else {
        // Personal: read key from DB at runtime (no redeployment needed)
        const { data: personalKeyRow } = await serviceClient
          .from("email_hub_settings")
          .select("setting_value, is_active")
          .eq("setting_key", "personal_resend_key")
          .maybeSingle();

        if (personalKeyRow?.is_active && personalKeyRow?.setting_value) {
          apiKey = personalKeyRow.setting_value;
        }
      }
    }

    if (apiKey) {
      // Process attachments for Resend API
      const resendAttachments: Array<{ filename: string; content: string }> = [];
      if (emailBody.attachments && emailBody.attachments.length > 0) {
        for (const att of emailBody.attachments) {
          // Extract base64 content from data URI
          const match = att.content.match(/^data:[^;]+;base64,(.+)$/);
          if (match) {
            resendAttachments.push({
              filename: att.filename,
              content: match[1], // raw base64
            });
          }
        }
      }

      const resendPayload: Record<string, unknown> = {
        from: `${emailBody.senderName} <${emailBody.senderEmail}>`,
        to: [emailBody.to],
        subject: emailBody.subject,
        html: fullHtml,
        reply_to: emailBody.senderEmail,
      };

      if (resendAttachments.length > 0) {
        resendPayload.attachments = resendAttachments;
      }

      const resendRes = await quotaGuardedFetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resendPayload),
      });

      if (!resendRes.ok) {
        const errText = await resendRes.text();
        console.error("Resend API error:", errText);
        sendMethod = "normal_fallback";
      } else {
        const resendData = await resendRes.json();
        resendMessageId = resendData.id || null;
        sendMethod = "resend";
      }
    } else {
      sendMethod = "normal";
    }

    // Log to owner_comm_threads/messages
    const { data: existingThread } = await serviceClient
      .from("owner_comm_threads")
      .select("id")
      .eq("contact_identifier", emailBody.to.toLowerCase())
      .eq("channel_type", "email")
      .maybeSingle();

    let threadId = existingThread?.id;

    if (!threadId) {
      const { data: newThread } = await serviceClient
        .from("owner_comm_threads")
        .insert({
          user_id: user.id,
          contact_identifier: emailBody.to.toLowerCase(),
          contact_name: emailBody.to,
          channel_type: "email",
          status: "resolved",
          last_message_preview: emailBody.subject.substring(0, 100),
          last_message_at: new Date().toISOString(),
          unread_count: 0,
        })
        .select("id")
        .single();
      threadId = newThread?.id;
    } else {
      await serviceClient
        .from("owner_comm_threads")
        .update({
          last_message_preview: emailBody.subject.substring(0, 100),
          last_message_at: new Date().toISOString(),
          status: "resolved",
        })
        .eq("id", threadId);
    }

    if (threadId) {
      await serviceClient.from("owner_comm_messages").insert({
        thread_id: threadId,
        user_id: user.id,
        direction: "outbound",
        content: emailBody.body,
        sender_identifier: emailBody.senderEmail,
        sender_name: emailBody.senderName,
        metadata: {
          subject: emailBody.subject,
          send_method: sendMethod,
          resend_message_id: resendMessageId,
          sender_id: emailBody.senderId,
          sender_title: emailBody.senderTitle,
          account: emailBody.account,
        },
      });
    }

    // Cross-notification: notify in chat when alsoNotifyChat is true
    if (emailBody.alsoNotifyChat) {
      // Look up recipient by email to find their chat user ID
      let chatRecipientId = emailBody.chatRecipientId || null;
      
      if (!chatRecipientId) {
        // Try to find by email in profiles
        const { data: recipientProfile } = await serviceClient
          .from("profiles")
          .select("id")
          .ilike("email", emailBody.to.toLowerCase())
          .maybeSingle();
        
        if (recipientProfile) {
          chatRecipientId = recipientProfile.id;
        }
      }

      // Insert chat notification regardless (visible in email-notifications channel)
      await serviceClient.from("employee_chat_messages").insert({
        sender_id: 'current-user',
        sender_type: 'user',
        recipient_id: chatRecipientId || 'email-notifications',
        message: `📧 Email sent to ${emailBody.to}: "${emailBody.subject}"`,
      });
    }

    // Cross-notification: send email when alsoSendByEmail is true (from chat context)
    if (body.alsoSendByEmail && body.chatRecipientEmail) {
      // This is handled by the calling function — the email was already sent above
      console.log("[Cross-channel] Email also sent to:", body.chatRecipientEmail);
    }

    return jsonResponse({
      success: true,
      sendMethod,
      resendMessageId,
      threadId,
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === "NO_AUTH") {
        return jsonResponse({ error: "No auth" }, 401);
      }
      if (error.message === "FORBIDDEN") {
        return jsonResponse({ error: "Owner access required" }, 403);
      }
    }
    console.error("send-owner-email error:", error);
    return jsonResponse(
      { error: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});
