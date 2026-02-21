import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { z } from "https://deno.land/x/zod@v3.22.4/mod.ts";

// Security constants
const RATE_LIMIT_WINDOW_MINUTES = 5;
const MAX_REQUESTS_PER_WINDOW = 30;
const AUTO_BLOCK_THRESHOLD = 5;
const AUTO_BLOCK_DURATION_HOURS = 12;

// Allowed origins
const ALLOWED_ORIGINS = [
  "https://jbj.ae",
  "https://www.jbj.ae",
  "http://localhost:5173",
  "http://localhost:8080",
];

function getCorsHeaders(req: Request) {
  const origin = req.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.some(allowed => 
    origin === allowed || origin.endsWith(".lovableproject.com") || origin.endsWith(".lovable.app")
  );
  
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
  };
}

function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
    "unknown"
  );
}

async function checkIPBlocklist(supabaseAdmin: any, clientIp: string): Promise<{ blocked: boolean; reason?: string }> {
  try {
    const { data, error } = await supabaseAdmin.from("ip_blocklist").select("*").eq("ip_address", clientIp).maybeSingle();
    if (error || !data) return { blocked: false };
    if (data.expires_at && new Date(data.expires_at) < new Date()) {
      await supabaseAdmin.from("ip_blocklist").delete().eq("id", data.id);
      return { blocked: false };
    }
    await supabaseAdmin.from("ip_blocklist").update({ last_attempt_at: new Date().toISOString(), block_count: (data.block_count || 1) + 1 }).eq("id", data.id);
    return { blocked: true, reason: data.reason || "IP is blocked" };
  } catch (err) {
    console.error("IP blocklist check error:", err);
    return { blocked: false };
  }
}

async function checkRateLimit(supabaseAdmin: any, rateKey: string, clientIp: string): Promise<{ allowed: boolean; retryAfterSeconds?: number }> {
  const functionName = "generate-property-report";
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MINUTES * 60 * 1000);

  const { data: existingEntry, error: fetchError } = await supabaseAdmin
    .from("function_rate_limits").select("*").eq("function_name", functionName).eq("rate_key", rateKey)
    .gte("window_start", windowStart.toISOString()).order("window_start", { ascending: false }).limit(1).maybeSingle();

  if (fetchError) return { allowed: true };

  if (existingEntry) {
    if (existingEntry.request_count >= MAX_REQUESTS_PER_WINDOW) {
      const windowEndTime = new Date(existingEntry.window_start).getTime() + RATE_LIMIT_WINDOW_MINUTES * 60 * 1000;
      const retryAfterSeconds = Math.ceil((windowEndTime - Date.now()) / 1000);
      console.warn(`Rate limit exceeded for key: ${rateKey.substring(0, 8)}***`);
      const violationCount = await trackRateLimitViolation(supabaseAdmin, clientIp, functionName);
      if (violationCount >= AUTO_BLOCK_THRESHOLD) await autoBlockIP(supabaseAdmin, clientIp, functionName, violationCount);
      return { allowed: false, retryAfterSeconds: Math.max(retryAfterSeconds, 0) };
    }
    await supabaseAdmin.from("function_rate_limits").update({ request_count: existingEntry.request_count + 1 }).eq("id", existingEntry.id);
  } else {
    await supabaseAdmin.from("function_rate_limits").insert({ function_name: functionName, rate_key: rateKey, window_start: new Date().toISOString(), request_count: 1 });
  }
  return { allowed: true };
}

async function trackRateLimitViolation(supabaseAdmin: any, clientIp: string, functionName: string): Promise<number> {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { data: violations } = await supabaseAdmin.from("function_rate_limits").select("*").eq("rate_key", clientIp).gte("window_start", oneDayAgo.toISOString()).gte("request_count", MAX_REQUESTS_PER_WINDOW);
  return violations?.length || 0;
}

async function sendAutoBlockNotification(clientIp: string, functionName: string, violationCount: number, blockCount: number, expiresAt: Date): Promise<void> {
  try {
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) return;
    const maskedIp = `${clientIp.substring(0, 8)}***`;
    const expiresAtFormatted = expiresAt.toLocaleString("en-US", { timeZone: "Asia/Dubai", dateStyle: "medium", timeStyle: "short" });
    await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${resendApiKey}` },
      body: JSON.stringify({
        from: "JBJ Security <info@jbj.ae>",
        to: ["CONTACT@JBJ.AE"],
        subject: `🚨 Security Alert: IP Auto-Blocked on ${functionName}`,
        html: `<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;"><div style="background: linear-gradient(135deg, #1a1a2e, #16213e); padding: 20px; border-radius: 8px 8px 0 0;"><h1 style="color: #c9a962; margin: 0;">🚨 Security Alert</h1><p style="color: #fff; margin: 10px 0 0;">IP Auto-Blocked</p></div><div style="background: #f8f9fa; padding: 25px; border: 1px solid #e9ecef; border-radius: 0 0 8px 8px;"><h2 style="color: #1a1a2e; margin-top: 0;">Block Details</h2><p><strong>IP:</strong> ${maskedIp}</p><p><strong>Function:</strong> ${functionName}</p><p><strong>Violations:</strong> ${violationCount}</p><p><strong>Total Blocks:</strong> ${blockCount}</p><p><strong>Expires:</strong> ${expiresAtFormatted} (Dubai)</p><p><strong>Duration:</strong> ${AUTO_BLOCK_DURATION_HOURS} hours</p><div style="margin-top: 20px; padding: 15px; background: #fff3cd; border-left: 4px solid #ffc107;"><strong>Action Required:</strong> Review in Admin Dashboard.</div></div></div>`,
      }),
    });
    console.log("Auto-block notification sent");
  } catch (err) {
    console.error("Error sending notification:", err);
  }
}

async function autoBlockIP(supabaseAdmin: any, clientIp: string, functionName: string, violationCount: number): Promise<void> {
  try {
    const expiresAt = new Date(Date.now() + AUTO_BLOCK_DURATION_HOURS * 60 * 60 * 1000);
    const { data: existing } = await supabaseAdmin.from("ip_blocklist").select("id, block_count").eq("ip_address", clientIp).maybeSingle();
    let blockCount = 1;
    if (existing) {
      blockCount = (existing.block_count || 1) + 1;
      await supabaseAdmin.from("ip_blocklist").update({ expires_at: expiresAt.toISOString(), block_count: blockCount, reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`, last_attempt_at: new Date().toISOString() }).eq("id", existing.id);
    } else {
      await supabaseAdmin.from("ip_blocklist").insert({ ip_address: clientIp, reason: `Auto-blocked: ${violationCount} rate limit violations on ${functionName}`, is_permanent: false, expires_at: expiresAt.toISOString(), block_count: 1 });
    }
    console.warn(`Auto-blocked IP: ${clientIp.substring(0, 8)}*** for ${AUTO_BLOCK_DURATION_HOURS} hours`);
    await sendAutoBlockNotification(clientIp, functionName, violationCount, blockCount, expiresAt);
  } catch (err) {
    console.error("Error auto-blocking IP:", err);
  }
}

// Input validation schema
const ProjectSchema = z.object({
  id: z.string(),
  name: z.string(),
  developer: z.string().optional(),
  location: z.string().optional(),
  emirate: z.string().optional(),
  community: z.string().optional(),
  description: z.string().optional().nullable(),
  priceFrom: z.number().optional(),
  priceTo: z.number().optional().nullable(),
  bedroomsMin: z.number().optional(),
  bedroomsMax: z.number().optional(),
  sizeMin: z.number().optional(),
  sizeMax: z.number().optional(),
  handover: z.string().optional().nullable(),
  paymentPlan: z.string().optional().nullable(),
  amenities: z.array(z.string()).optional(),
  facilities: z.array(z.string()).optional(),
  views: z.array(z.string()).optional(),
  furnishedStatus: z.string().optional().nullable(),
  floors: z.number().optional().nullable(),
  serviceCharge: z.string().optional().nullable(),
  images: z.array(z.object({
    image_url: z.string(),
    alt_text: z.string().optional().nullable(),
  })).optional(),
  documents: z.array(z.object({
    file_url: z.string(),
    file_name: z.string(),
    document_type: z.string(),
  })).optional(),
});

const RequestSchema = z.object({
  project: ProjectSchema,
});

function escapeHtml(text: string | null | undefined): string {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function formatPrice(price: number | null | undefined): string {
  if (!price) return 'Contact for pricing';
  if (price >= 1000000) {
    return `AED ${(price / 1000000).toFixed(2)}M`;
  }
  return `AED ${price.toLocaleString()}`;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Initialize Supabase clients
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);
    const clientIp = getClientIp(req);

    // Check IP blocklist first
    const blocklistResult = await checkIPBlocklist(supabaseService, clientIp);
    if (blocklistResult.blocked) {
      console.warn(`Blocked IP attempted generate-property-report: ${clientIp.substring(0, 8)}***`);
      return new Response(
        JSON.stringify({ error: "Access denied" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      console.log("Authentication failed:", authError?.message);
      return new Response(
        JSON.stringify({ error: "Invalid or expired session" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Property report request from user: ${user.email}, IP: ${clientIp}`);

    // Check rate limit using user ID
    const rateLimitResult = await checkRateLimit(supabaseService, user.id, clientIp);
    if (!rateLimitResult.allowed) {
      console.warn(`Rate limit exceeded for user: ${user.email}`);
      return new Response(
        JSON.stringify({ error: "Too many requests. Please try again later." }),
        { 
          status: 429, 
          headers: { 
            ...corsHeaders, 
            "Content-Type": "application/json",
            "Retry-After": String(rateLimitResult.retryAfterSeconds || 300)
          } 
        }
      );
    }

    // Parse and validate input
    const rawBody = await req.json();
    const parseResult = RequestSchema.safeParse(rawBody);
    
    if (!parseResult.success) {
      return new Response(
        JSON.stringify({ error: "Invalid request data" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { project } = parseResult.data;
    const dateStr = new Date().toLocaleDateString("en-US", { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });

    // Generate premium white-background HTML report
    const reportHTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(project.name)} - JBJ Global Real Estate Property Report</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700&family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    
    :root {
      --gold: #A8925A;
      --gold-dark: #8B7744;
      --black: #000000;
      --white: #FFFFFF;
      --gray-50: #FAFAFA;
      --gray-100: #F5F5F5;
      --gray-200: #E5E5E5;
      --gray-300: #D4D4D4;
      --gray-500: #737373;
      --gray-700: #404040;
      --gray-900: #171717;
    }
    
    body { 
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif; 
      background: var(--white); 
      color: var(--black);
      line-height: 1.6;
      -webkit-font-smoothing: antialiased;
    }
    
    .page { 
      max-width: 800px; 
      margin: 0 auto; 
      padding: 40px; 
      background: var(--white);
    }
    
    /* Header */
    .header { 
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 30px;
      border-bottom: 2px solid var(--gold);
      margin-bottom: 40px;
    }
    
    .header-left { }
    
    .logo { 
      font-size: 24px; 
      font-weight: 700;
      letter-spacing: 2px;
      margin-bottom: 4px;
      display: flex;
      align-items: center;
    }
    .logo-jj { 
      color: var(--gold); 
      font-family: 'Playfair Display', serif;
    }
    .logo-divider { 
      margin: 0 6px; 
      color: var(--gold);
      font-weight: 300;
    }
    .logo-text { 
      color: var(--black);
      font-family: 'Inter', sans-serif;
      font-weight: 600;
      letter-spacing: 3px;
    }
    
    .tagline { 
      color: var(--gray-500); 
      font-size: 11px; 
      letter-spacing: 2px;
      text-transform: uppercase;
      margin-top: 4px;
    }
    
    .header-right {
      text-align: right;
    }
    
    .report-badge {
      display: inline-block;
      background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
      color: var(--white);
      padding: 6px 16px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 8px;
    }
    
    .report-date { 
      color: var(--gray-500); 
      font-size: 12px; 
    }
    
    /* Hero Section */
    .hero {
      background: var(--gray-50);
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      padding: 32px;
      margin-bottom: 32px;
    }
    
    .developer-badge {
      display: inline-block;
      background: var(--black);
      color: var(--white);
      padding: 6px 14px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 1px;
      text-transform: uppercase;
      margin-bottom: 16px;
    }
    
    .property-name {
      font-family: 'Playfair Display', serif;
      font-size: 36px;
      font-weight: 600;
      color: var(--black);
      margin-bottom: 12px;
      line-height: 1.2;
    }
    
    .location-info { 
      color: var(--gray-700); 
      font-size: 16px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .location-icon {
      color: var(--gold);
    }
    
    /* Section Styles */
    .section {
      background: var(--white);
      border: 1px solid var(--gray-200);
      border-radius: 12px;
      padding: 28px;
      margin-bottom: 24px;
    }
    
    .section-title {
      font-family: 'Playfair Display', serif;
      font-size: 20px;
      font-weight: 600;
      color: var(--black);
      margin-bottom: 24px;
      padding-bottom: 12px;
      border-bottom: 1px solid var(--gray-200);
      position: relative;
    }
    
    .section-title::after {
      content: '';
      position: absolute;
      bottom: -1px;
      left: 0;
      width: 60px;
      height: 2px;
      background: var(--gold);
    }
    
    /* Key Metrics Grid */
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
    }
    
    .metric-card {
      background: var(--gray-50);
      padding: 24px;
      border-radius: 10px;
      text-align: center;
      border: 1px solid var(--gray-200);
    }
    
    .metric-value {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 600;
      color: var(--black);
      margin-bottom: 6px;
    }
    
    .metric-label {
      font-size: 11px;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 1px;
      font-weight: 500;
    }
    
    /* Details Table */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
    }
    
    .detail-item {
      display: flex;
      flex-direction: column;
      padding: 16px;
      background: var(--gray-50);
      border-radius: 8px;
      border: 1px solid var(--gray-100);
    }
    
    .detail-label {
      font-size: 11px;
      color: var(--gray-500);
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 6px;
      font-weight: 500;
    }
    
    .detail-value {
      font-size: 15px;
      color: var(--black);
      font-weight: 500;
    }
    
    /* Tags */
    .tags {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    
    .tag {
      background: var(--white);
      color: var(--black);
      padding: 8px 16px;
      border-radius: 6px;
      font-size: 13px;
      border: 1px solid var(--gray-200);
      font-weight: 500;
    }
    
    .tag-gold {
      background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
      color: var(--white);
      border: none;
    }
    
    /* Payment Plan */
    .payment-box {
      background: linear-gradient(135deg, rgba(168, 146, 90, 0.08) 0%, rgba(168, 146, 90, 0.02) 100%);
      border: 1px solid rgba(168, 146, 90, 0.3);
      border-radius: 10px;
      padding: 20px;
      margin-top: 24px;
    }
    
    .payment-title {
      color: var(--gold-dark);
      font-weight: 600;
      margin-bottom: 8px;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    
    .payment-icon {
      width: 20px;
      height: 20px;
    }
    
    /* Description */
    .description {
      color: var(--gray-700);
      line-height: 1.9;
      font-size: 15px;
    }
    
    /* Images Gallery */
    .images-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    
    .image-item {
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid var(--gray-200);
    }
    
    .image-item img {
      width: 100%;
      height: 150px;
      object-fit: cover;
    }
    
    .image-item:first-child {
      grid-column: span 2;
    }
    
    .image-item:first-child img {
      height: 250px;
    }
    
    /* Documents List */
    .doc-list {
      list-style: none;
    }
    
    .doc-item {
      display: flex;
      align-items: center;
      padding: 14px;
      background: var(--gray-50);
      border-radius: 8px;
      margin-bottom: 10px;
      border: 1px solid var(--gray-200);
    }
    
    .doc-icon {
      width: 40px;
      height: 40px;
      background: var(--gold);
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 14px;
      color: var(--white);
      font-weight: bold;
      font-size: 12px;
    }
    
    .doc-name { 
      font-weight: 500; 
      color: var(--black);
    }
    
    .doc-type { 
      font-size: 12px; 
      color: var(--gray-500); 
    }
    
    .doc-link {
      margin-left: auto;
      color: var(--gold);
      text-decoration: none;
      font-size: 13px;
      font-weight: 500;
    }
    
    /* Footer */
    .footer {
      text-align: center;
      margin-top: 40px;
      padding-top: 32px;
      border-top: 2px solid var(--gold);
    }
    
    .footer-logo { 
      font-size: 20px; 
      margin-bottom: 16px; 
      display: flex;
      align-items: center;
      justify-content: center;
    }
    
    .contact-grid {
      display: flex;
      justify-content: center;
      gap: 32px;
      margin-bottom: 20px;
    }
    
    .contact-item {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--gray-700);
      font-size: 14px;
    }
    
    .contact-icon {
      width: 16px;
      height: 16px;
      color: var(--gold);
    }
    
    .contact-link {
      color: var(--black);
      text-decoration: none;
      font-weight: 500;
    }
    
    .contact-link:hover {
      color: var(--gold);
    }
    
    .footer-branding {
      margin-top: 16px;
      padding-top: 16px;
      border-top: 1px solid var(--gray-200);
    }
    
    .footer-branding-text {
      font-size: 12px;
      color: var(--gray-500);
    }
    
    .footer-branding-text strong {
      color: var(--black);
    }
    
    .disclaimer {
      font-size: 10px;
      color: var(--gray-500);
      margin-top: 20px;
      padding: 16px;
      background: var(--gray-50);
      border-radius: 8px;
      line-height: 1.6;
    }
    
    /* CTA Box */
    .cta-box {
      background: linear-gradient(135deg, var(--gold) 0%, var(--gold-dark) 100%);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      margin-top: 32px;
    }
    
    .cta-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 600;
      color: var(--white);
      margin-bottom: 10px;
    }
    
    .cta-text {
      color: rgba(255,255,255,0.9);
      margin-bottom: 20px;
      font-size: 14px;
    }
    
    .cta-buttons {
      display: flex;
      justify-content: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    
    .cta-button {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      background: var(--black);
      color: var(--gold);
      padding: 12px 24px;
      border-radius: 8px;
      text-decoration: none;
      font-weight: 600;
      font-size: 14px;
    }
    
    .cta-button-white {
      background: var(--white);
      color: var(--black);
    }

    @media print {
      body { background: var(--white); }
      .page { max-width: 100%; padding: 20px; }
      .cta-box { display: none; }
      .footer { page-break-inside: avoid; }
    }
    
    @media (max-width: 600px) {
      .page { padding: 20px; }
      .metrics-grid { grid-template-columns: 1fr; }
      .details-grid { grid-template-columns: 1fr; }
      .contact-grid { flex-direction: column; gap: 12px; }
      .images-grid { grid-template-columns: 1fr; }
      .image-item:first-child { grid-column: span 1; }
    }
  </style>
</head>
<body>
  <div class="page">
    <!-- Header -->
    <div class="header">
      <div class="header-left">
        <div class="logo">
          <span class="logo-jj">J</span>
          <span class="logo-divider">B</span>
          <span class="logo-jj">J</span>
          <span style="margin-left: 10px;" class="logo-text">GLOBAL REAL ESTATE</span>
        </div>
        <div class="tagline">Real Estate Brokerage</div>
      </div>
      <div class="header-right">
        <div class="report-badge">Exclusive Report</div>
        <div class="report-date">Generated ${dateStr}</div>
      </div>
    </div>

    ${project.images && project.images.length > 0 ? `
    <!-- Property Images -->
    <div class="images-grid" style="margin-bottom: 32px;">
      ${project.images.slice(0, 5).map((img, idx) => `
        <div class="image-item">
          <img src="${escapeHtml(img.image_url)}" alt="${escapeHtml(img.alt_text || project.name)}" />
        </div>
      `).join('')}
    </div>
    ` : ''}

    <!-- Hero -->
    <div class="hero">
      <div class="developer-badge">${escapeHtml(project.developer) || 'Premium Developer'}</div>
      <h1 class="property-name">${escapeHtml(project.name)}</h1>
      <p class="location-info">
        <svg class="location-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"></path>
          <circle cx="12" cy="10" r="3"></circle>
        </svg>
        ${escapeHtml(project.location) || 'Dubai'}${project.community ? `, ${escapeHtml(project.community)}` : ''}${project.emirate ? ` • ${escapeHtml(project.emirate)}` : ''}
      </p>
    </div>

    <!-- Key Metrics -->
    <div class="section">
      <h2 class="section-title">Investment Overview</h2>
      <div class="metrics-grid">
        <div class="metric-card">
          <div class="metric-value">${formatPrice(project.priceFrom)}</div>
          <div class="metric-label">Starting Price</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${project.bedroomsMin || 0} - ${project.bedroomsMax || 0} BR</div>
          <div class="metric-label">Bedrooms</div>
        </div>
        <div class="metric-card">
          <div class="metric-value">${project.sizeMin?.toLocaleString() || 'N/A'} - ${project.sizeMax?.toLocaleString() || 'N/A'}</div>
          <div class="metric-label">Size (sqft)</div>
        </div>
      </div>
    </div>

    <!-- Property Details -->
    <div class="section">
      <h2 class="section-title">Property Details</h2>
      <div class="details-grid">
        <div class="detail-item">
          <span class="detail-label">Developer</span>
          <span class="detail-value">${escapeHtml(project.developer) || 'N/A'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Location</span>
          <span class="detail-value">${escapeHtml(project.location) || 'N/A'}${project.community ? `, ${escapeHtml(project.community)}` : ''}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Emirate</span>
          <span class="detail-value">${escapeHtml(project.emirate) || 'Dubai'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Price Range</span>
          <span class="detail-value">${formatPrice(project.priceFrom)}${project.priceTo ? ` - ${formatPrice(project.priceTo)}` : ''}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Unit Sizes</span>
          <span class="detail-value">${project.sizeMin?.toLocaleString() || 'N/A'} - ${project.sizeMax?.toLocaleString() || 'N/A'} sqft</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Bedrooms</span>
          <span class="detail-value">${project.bedroomsMin || 0} - ${project.bedroomsMax || 0} Bedrooms</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Handover Date</span>
          <span class="detail-value">${escapeHtml(project.handover) || 'Contact for details'}</span>
        </div>
        <div class="detail-item">
          <span class="detail-label">Furnished Status</span>
          <span class="detail-value">${escapeHtml(project.furnishedStatus) || 'Contact for details'}</span>
        </div>
        ${project.floors ? `
        <div class="detail-item">
          <span class="detail-label">Total Floors</span>
          <span class="detail-value">${project.floors} Floors</span>
        </div>
        ` : ''}
        ${project.serviceCharge ? `
        <div class="detail-item">
          <span class="detail-label">Service Charge</span>
          <span class="detail-value">${escapeHtml(project.serviceCharge)}</span>
        </div>
        ` : ''}
      </div>

      ${project.paymentPlan ? `
      <div class="payment-box">
        <div class="payment-title">
          <svg class="payment-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="1" y="4" width="22" height="16" rx="2" ry="2"></rect>
            <line x1="1" y1="10" x2="23" y2="10"></line>
          </svg>
          Payment Plan
        </div>
        <div style="color: var(--gray-700);">${escapeHtml(project.paymentPlan)}</div>
      </div>
      ` : ''}
    </div>

    ${project.description ? `
    <!-- Description -->
    <div class="section">
      <h2 class="section-title">About This Property</h2>
      <p class="description">${escapeHtml(project.description)}</p>
    </div>
    ` : ''}

    ${project.amenities && project.amenities.length > 0 ? `
    <!-- Amenities -->
    <div class="section">
      <h2 class="section-title">Amenities</h2>
      <div class="tags">
        ${project.amenities.map(a => `<span class="tag">${escapeHtml(a)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${project.facilities && project.facilities.length > 0 ? `
    <!-- Facilities -->
    <div class="section">
      <h2 class="section-title">Facilities</h2>
      <div class="tags">
        ${project.facilities.map(f => `<span class="tag">${escapeHtml(f)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${project.views && project.views.length > 0 ? `
    <!-- Views -->
    <div class="section">
      <h2 class="section-title">Views</h2>
      <div class="tags">
        ${project.views.map(v => `<span class="tag tag-gold">${escapeHtml(v)}</span>`).join('')}
      </div>
    </div>
    ` : ''}

    ${project.documents && project.documents.length > 0 ? `
    <!-- Documents -->
    <div class="section">
      <h2 class="section-title">Available Documents</h2>
      <ul class="doc-list">
        ${project.documents.map(doc => `
        <li class="doc-item">
          <div class="doc-icon">PDF</div>
          <div>
            <div class="doc-name">${escapeHtml(doc.file_name)}</div>
            <div class="doc-type">${escapeHtml(doc.document_type).replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
          </div>
          <a href="${escapeHtml(doc.file_url)}" class="doc-link" target="_blank">Download →</a>
        </li>
        `).join('')}
      </ul>
    </div>
    ` : ''}

    <!-- CTA -->
    <div class="cta-box">
      <div class="cta-title">Interested in This Property?</div>
      <div class="cta-text">Our investment advisors are ready to assist you with detailed analysis, site visits, and exclusive deals.</div>
      <div class="cta-buttons">
        <a href="https://wa.me/97156591100?text=${encodeURIComponent(`Hi, I'm interested in ${project.name}. Please share more details.`)}" class="cta-button" target="_blank">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
          WhatsApp
        </a>
        <a href="tel:+97156591100" class="cta-button cta-button-white">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path></svg>
          Call Now
        </a>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <div class="footer-logo">
        <span class="logo-jj" style="font-size: 18px;">J</span>
        <span class="logo-divider" style="font-size: 18px;">|</span>
        <span class="logo-jj" style="font-size: 18px;">JBJ</span>
        <span style="margin-left: 8px; font-weight: 600; letter-spacing: 2px; font-size: 16px;">GLOBAL REAL ESTATE</span>
      </div>
      
      <div class="contact-grid">
        <div class="contact-item">
          <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
            <polyline points="22,6 12,13 2,6"></polyline>
          </svg>
          <a href="mailto:contact@jbj.ae" class="contact-link">contact@jbj.ae</a>
        </div>
        <div class="contact-item">
          <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"></path>
          </svg>
          <a href="tel:+971565911000" class="contact-link">+971 56 591 1000</a>
        </div>
        <div class="contact-item">
          <svg class="contact-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="2" y1="12" x2="22" y2="12"></line>
            <path d="M12 2a15.3 15.3 0 014 10 15.3 15.3 0 01-4 10 15.3 15.3 0 01-4-10 15.3 15.3 0 014-10z"></path>
          </svg>
          <a href="https://jbj.ae" class="contact-link" target="_blank">jbj.ae</a>
        </div>
      </div>
      
      <div class="footer-branding">
        <p class="footer-branding-text">
          Powered & Made by <strong>JBJ Global Real Estate</strong> — Real Estate Brokerage
        </p>
      </div>
      
      <div class="disclaimer">
        This report is for informational purposes only. Prices, availability, and specifications are subject to change without notice. 
        Please contact JBJ Global Real Estate for the most current information. 
        This document does not constitute an offer or solicitation to buy or sell any property.
      </div>
    </div>
  </div>
</body>
</html>`;

    return new Response(
      JSON.stringify({ html: reportHTML }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error generating report:", error);
    return new Response(
      JSON.stringify({ error: "Failed to generate report" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
