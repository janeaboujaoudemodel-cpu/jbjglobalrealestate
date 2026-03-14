import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

  // Verify caller is owner
  const authHeader = req.headers.get("authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const callerClient = createClient(supabaseUrl, authHeader.replace("Bearer ", ""), {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user } } = await callerClient.auth.getUser();
  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Check owner role
  const { data: isOwner } = await adminClient.rpc("has_role", {
    _user_id: user.id,
    _role: "owner",
  });
  if (!isOwner) {
    return new Response(JSON.stringify({ error: "Owner only" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const results: Record<string, { pass: boolean; detail: string }> = {};

  // --- Test 1: Anon cannot SELECT resale_listings base table ---
  try {
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await anonClient
      .from("resale_listings")
      .select("id")
      .limit(1);
    if (error) {
      results["anon_resale_listings_base_blocked"] = {
        pass: true,
        detail: `Blocked: ${error.code} ${error.message}`,
      };
    } else {
      results["anon_resale_listings_base_blocked"] = {
        pass: (data || []).length === 0,
        detail: `Rows returned: ${(data || []).length}`,
      };
    }
  } catch (e) {
    results["anon_resale_listings_base_blocked"] = {
      pass: true,
      detail: `Exception: ${e.message}`,
    };
  }

  // --- Test 2: Anon CAN read resale_listings_public view ---
  try {
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await anonClient
      .from("resale_listings_public")
      .select("id,title")
      .limit(1);
    // Should succeed (view is granted to anon)
    results["anon_resale_listings_public_readable"] = {
      pass: !error,
      detail: error ? `Error: ${error.message}` : `OK, rows: ${(data || []).length}`,
    };
  } catch (e) {
    results["anon_resale_listings_public_readable"] = {
      pass: false,
      detail: `Exception: ${e.message}`,
    };
  }

  // --- Test 3: Anon cannot SELECT sensitive tables ---
  const sensitiveTables = [
    "book_downloads",
    "payout_readiness_records",
    "payout_audit_logs",
    "admin_edit_log",
    "web_developer_tasks",
    "db_health_logs",
  ];
  for (const table of sensitiveTables) {
    try {
      const anonClient = createClient(supabaseUrl, anonKey);
      const { data, error } = await anonClient.from(table).select("id").limit(1);
      if (error) {
        results[`anon_${table}_blocked`] = {
          pass: true,
          detail: `Blocked: ${error.code}`,
        };
      } else {
        results[`anon_${table}_blocked`] = {
          pass: (data || []).length === 0,
          detail: `Rows: ${(data || []).length}`,
        };
      }
    } catch (e) {
      results[`anon_${table}_blocked`] = {
        pass: true,
        detail: `Exception: ${e.message}`,
      };
    }
  }

  // --- Test 4: Anon cannot INSERT into open_positions ---
  try {
    const anonClient = createClient(supabaseUrl, anonKey);
    const { error } = await anonClient.from("open_positions").insert({
      title: "RLS_TEST_INJECT",
      department: "test",
      is_active: true,
    });
    if (error) {
      results["anon_open_positions_insert_blocked"] = {
        pass: true,
        detail: `Blocked: ${error.code}`,
      };
    } else {
      // Clean up
      await adminClient
        .from("open_positions")
        .delete()
        .eq("title", "RLS_TEST_INJECT");
      results["anon_open_positions_insert_blocked"] = {
        pass: false,
        detail: "INSERT succeeded — VULNERABILITY",
      };
    }
  } catch (e) {
    results["anon_open_positions_insert_blocked"] = {
      pass: true,
      detail: `Exception: ${e.message}`,
    };
  }

  // --- Test 5: listing_uploads blocked for anon ---
  try {
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await anonClient
      .from("listing_uploads")
      .select("id")
      .limit(1);
    if (error) {
      results["anon_listing_uploads_blocked"] = {
        pass: true,
        detail: `Blocked: ${error.code}`,
      };
    } else {
      results["anon_listing_uploads_blocked"] = {
        pass: (data || []).length === 0,
        detail: `Rows: ${(data || []).length}`,
      };
    }
  } catch (e) {
    results["anon_listing_uploads_blocked"] = {
      pass: true,
      detail: `Exception: ${e.message}`,
    };
  }

  // Summary
  const allPassed = Object.values(results).every((r) => r.pass);
  const failedTests = Object.entries(results)
    .filter(([, r]) => !r.pass)
    .map(([name]) => name);

  return new Response(
    JSON.stringify({
      timestamp: new Date().toISOString(),
      all_passed: allPassed,
      total_tests: Object.keys(results).length,
      passed: Object.values(results).filter((r) => r.pass).length,
      failed: failedTests.length,
      failed_tests: failedTests,
      results,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    }
  );
});
