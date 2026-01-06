import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate certificate number: JJ-YYYY-XXXXX
const generateCertificateNumber = (): string => {
  const year = new Date().getFullYear();
  const random = Math.random().toString(36).substring(2, 7).toUpperCase();
  return `JJ-${year}-${random}`;
};

// Generate verification token for QR code
const generateVerificationToken = (): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < 32; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Create client with user token for auth
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get user
    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create service client for database operations
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Check if user already has a valid certificate
    const { data: existingCert } = await serviceClient
      .from("hr_certificates")
      .select("id, certificate_number")
      .eq("user_id", user.id)
      .eq("is_revoked", false)
      .maybeSingle();

    if (existingCert) {
      return new Response(
        JSON.stringify({ 
          error: "Certificate already exists",
          certificate_number: existingCert.certificate_number 
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user's application
    const { data: application } = await serviceClient
      .from("hr_applications")
      .select("full_name, status")
      .eq("user_id", user.id)
      .eq("status", "approved")
      .maybeSingle();

    if (!application) {
      return new Response(
        JSON.stringify({ error: "No approved application found" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get quiz attempts and calculate scores
    const { data: modules } = await serviceClient
      .from("hr_modules")
      .select("id, track")
      .eq("is_active", true);

    const { data: attempts } = await serviceClient
      .from("hr_quiz_attempts")
      .select("module_id, score, passed")
      .eq("user_id", user.id);

    if (!modules || !attempts) {
      return new Response(
        JSON.stringify({ error: "Could not fetch training data" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Calculate best scores per module
    const bestScores: Record<string, number> = {};
    const passedModules: Set<string> = new Set();
    
    attempts.forEach((attempt) => {
      if (!bestScores[attempt.module_id] || attempt.score > bestScores[attempt.module_id]) {
        bestScores[attempt.module_id] = attempt.score;
      }
      if (attempt.passed) {
        passedModules.add(attempt.module_id);
      }
    });

    // Calculate track averages
    const companyModules = modules.filter((m) => m.track === "company_knowledge");
    const realEstateModules = modules.filter((m) => m.track === "real_estate_basics");

    let companyTotal = 0;
    let companyCount = 0;
    let companyPassed = 0;

    companyModules.forEach((m) => {
      if (bestScores[m.id] !== undefined) {
        companyTotal += bestScores[m.id];
        companyCount++;
        if (passedModules.has(m.id)) companyPassed++;
      }
    });

    let realEstateTotal = 0;
    let realEstateCount = 0;
    let realEstatePassed = 0;

    realEstateModules.forEach((m) => {
      if (bestScores[m.id] !== undefined) {
        realEstateTotal += bestScores[m.id];
        realEstateCount++;
        if (passedModules.has(m.id)) realEstatePassed++;
      }
    });

    const companyScore = companyCount > 0 ? companyTotal / companyCount : 0;
    const realEstateScore = realEstateCount > 0 ? realEstateTotal / realEstateCount : 0;
    const combinedScore = (companyScore + realEstateScore) / 2;

    // Get pass thresholds
    const { data: settings } = await serviceClient
      .from("hr_settings")
      .select("setting_key, setting_value");

    let companyThreshold = 70;
    let realEstateThreshold = 70;
    let combinedThreshold = 70;

    if (settings) {
      settings.forEach((s) => {
        const value = s.setting_value as { percentage?: number };
        if (s.setting_key === "pass_threshold_company") companyThreshold = value.percentage || 70;
        if (s.setting_key === "pass_threshold_real_estate") realEstateThreshold = value.percentage || 70;
        if (s.setting_key === "pass_threshold_combined") combinedThreshold = value.percentage || 70;
      });
    }

    // Check if user has completed all requirements
    const companyComplete = companyPassed >= companyModules.length && companyScore >= companyThreshold;
    const realEstateComplete = realEstatePassed >= realEstateModules.length && realEstateScore >= realEstateThreshold;
    const combinedComplete = combinedScore >= combinedThreshold;

    if (!companyComplete || !realEstateComplete || !combinedComplete) {
      return new Response(
        JSON.stringify({ 
          error: "Training not complete",
          details: {
            company: { 
              complete: companyComplete, 
              passed: companyPassed, 
              required: companyModules.length,
              score: companyScore,
              threshold: companyThreshold
            },
            realEstate: { 
              complete: realEstateComplete, 
              passed: realEstatePassed, 
              required: realEstateModules.length,
              score: realEstateScore,
              threshold: realEstateThreshold
            },
            combined: { 
              complete: combinedComplete, 
              score: combinedScore, 
              threshold: combinedThreshold 
            }
          }
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate certificate
    const certificateNumber = generateCertificateNumber();
    const verificationToken = generateVerificationToken();

    const { data: certificate, error: insertError } = await serviceClient
      .from("hr_certificates")
      .insert({
        user_id: user.id,
        certificate_number: certificateNumber,
        full_name: application.full_name,
        track: "full_program",
        company_score: Math.round(companyScore * 10) / 10,
        real_estate_score: Math.round(realEstateScore * 10) / 10,
        combined_score: Math.round(combinedScore * 10) / 10,
        verification_token: verificationToken,
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error creating certificate:", insertError);
      return new Response(
        JSON.stringify({ error: "Failed to create certificate" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        certificate: {
          id: certificate.id,
          certificate_number: certificate.certificate_number,
          full_name: certificate.full_name,
          company_score: certificate.company_score,
          real_estate_score: certificate.real_estate_score,
          combined_score: certificate.combined_score,
          issued_at: certificate.issued_at,
          verification_token: certificate.verification_token,
        }
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Certificate generation error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
