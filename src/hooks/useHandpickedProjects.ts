/**
 * useHandpickedProjects
 * ---------------------
 * Personalized recommender for the homepage "Handpicked For You" section.
 *
 * Signal tiers (highest priority first, then stack to fill 8 slots):
 *   1. crm_leads interest form (budget / property_type / preferred_location / bedroom_requirement)
 *   2. favorites (same developer + area as recently favorited projects)
 *   3. browsing history (localStorage — JBJ_BROWSING_HISTORY)
 *   4. mode-aware fallback (investor / broker / developer) using elite developer rotation
 *
 * Output shape is compatible with the canonical <ProjectCard /> (UnifiedProject).
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useUserModeContext } from "@/contexts/UserModeContext";
import type { UnifiedProject } from "@/types/unifiedProject";

const FALLBACK_TARGET = 6;

const SELECT = `
  id, name, slug, description, location, price_from, price_to,
  bedrooms_min, bedrooms_max, size_min, size_max,
  handover_date, payment_plan, amenities, status,
  is_featured, is_premium, is_sold_out,
  property_type_label, status_label, emirate,
  created_at, updated_at,
  reelly_id, construction_status, sale_status,
  area_name, cover_image_url, is_published,
  developer_name, latitude, longitude,
  developer:developers(id, name, slug, logo_url, has_active_rep),
  community:communities(id, name, slug),
  images:project_images(id, image_url, alt_text, display_order)
`;

// Promote off-plan; suppress ANY "ready/completed" listing on the homepage
// (owner directive: homepage promotes off-plan only). We check both the raw
// construction_status AND the derived handover so projects with past handover
// dates or "Ready"-style labels never slip through.
import { deriveHandover } from "@/utils/handoverDerivation";
const isCompletedReady = (p: any) => {
  const cs = String(p?.construction_status || "").toLowerCase().trim();
  if (/ready|complet|handed.?over/.test(cs)) return true;
  const derived = deriveHandover(p);
  if (derived && /^ready$/i.test(derived)) return true;
  return false;
};
// Owner-locked: NEVER surface a sold-out project on the homepage / Handpicked.
// Sold inventory is routed to the secondary-market surface instead.
const isSoldOut = (p: any) => {
  if (p?.is_sold_out === true) return true;
  const s = String(p?.status_label || "").toLowerCase();
  const ss = String(p?.sale_status || "").toLowerCase();
  return /sold/.test(s) || /sold/.test(ss);
};
const isDirectWithDeveloper = (p: any) => p?.developer?.has_active_rep === true;
// Owner directive (explicit): NEVER show any ready project on the homepage,
// even from direct-with-developer brands. Off-plan only on /.
const isHomepagePromotable = (p: any) => !isCompletedReady(p) && !isSoldOut(p);


const ELITE_DEVELOPERS = [
  "Emaar",
  "Omniyat",
  "Sobha",
  "ALDAR",
  "Binghatti",
  "Nakheel",
  "Dubai Properties",
  "DAMAC",
  "Meraas",
];

const HISTORY_KEY = "JBJ_BROWSING_HISTORY";

type Project = UnifiedProject;

async function tierOwnerFeatured(): Promise<Project[]> {
  const { data } = await supabase
    .from("home_featured_projects" as any)
    .select(`
      display_order,
      is_visible,
      owner_details,
      project:projects(${SELECT})
    `)
    .eq("is_visible", true)
    .order("display_order", { ascending: true })
    .order("updated_at", { ascending: false });

  return ((data || []) as any[])
    .map((row) => row.project)
    .filter(Boolean) as Project[];
}

function readBrowsingHistory(): Array<{ slug?: string; id?: string; developer_name?: string; area_name?: string }> {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function dedupePush(out: Project[], seen: Set<string>, candidates: Project[], target = FALLBACK_TARGET) {
  // Owner rule: promote off-plan first; direct-with-developer ready can stay
  // (top priority); generic completed/ready stock is dropped.
  const filtered = candidates.filter((p) => p && isHomepagePromotable(p));
  // Direct-with-developer ready units rank first.
  const sorted = [...filtered].sort((a, b) => {
    const aDirectReady = isDirectWithDeveloper(a) && isCompletedReady(a) ? 1 : 0;
    const bDirectReady = isDirectWithDeveloper(b) && isCompletedReady(b) ? 1 : 0;
    return bDirectReady - aDirectReady;
  });
  for (const p of sorted) {
    if (out.length >= target) return;
    if (!p?.id || seen.has(p.id)) continue;
    // Require an image to keep the grid visually uniform
    if (!p.cover_image_url && !(p.images && p.images.length > 0)) continue;
    seen.add(p.id);
    out.push(p);
  }
}


async function tierInterestForm(userId: string | undefined, email: string | undefined): Promise<Project[]> {
  if (!email && !userId) return [];
  let q = supabase.from("crm_leads").select("budget_min, budget_max, preferred_location, property_type, bedroom_requirement").limit(1);
  if (email) q = q.eq("email_lower", email.toLowerCase());
  else if (userId) q = q.eq("created_by_user_id", userId);
  const { data: leads } = await q;
  const lead = leads?.[0] as any;
  if (!lead) return [];

  let query = supabase
    .from("projects")
    .select(SELECT)
    .eq("is_published", true)
    .not("cover_image_url", "is", null)
    .neq("cover_image_url", "");

  if (lead.preferred_location) {
    query = query.or(
      `location.ilike.%${lead.preferred_location}%,area_name.ilike.%${lead.preferred_location}%,emirate.ilike.%${lead.preferred_location}%`,
    );
  }
  if (lead.property_type) {
    query = query.ilike("property_type_label", `%${lead.property_type}%`);
  }
  if (lead.budget_min) query = query.gte("price_from", Number(lead.budget_min) * 0.7);
  if (lead.budget_max) query = query.lte("price_from", Number(lead.budget_max) * 1.3);

  const { data } = await query.limit(FALLBACK_TARGET);
  return (data || []) as unknown as Project[];
}

async function tierFavorites(userId: string | undefined): Promise<Project[]> {
  if (!userId) return [];
  const { data: favs } = await supabase
    .from("favorites")
    .select("project_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);
  const favIds = (favs || []).map((f: any) => f.project_id).filter(Boolean);
  if (favIds.length === 0) return [];

  // Pull seed projects to extract developer + area signals
  const { data: seeds } = await supabase
    .from("projects")
    .select("developer_name, area_name")
    .in("id", favIds);
  const devNames = Array.from(new Set((seeds || []).map((s: any) => s.developer_name).filter(Boolean)));
  const areas = Array.from(new Set((seeds || []).map((s: any) => s.area_name).filter(Boolean)));

  if (devNames.length === 0 && areas.length === 0) return [];

  let query = supabase
    .from("projects")
    .select(SELECT)
    .eq("is_published", true)
    .not("cover_image_url", "is", null)
    .neq("cover_image_url", "")
    .not("id", "in", `(${favIds.join(",")})`);

  if (devNames.length > 0 && areas.length > 0) {
    query = query.or(`developer_name.in.(${devNames.map((d) => `"${d}"`).join(",")}),area_name.in.(${areas.map((a) => `"${a}"`).join(",")})`);
  } else if (devNames.length > 0) {
    query = query.in("developer_name", devNames);
  } else {
    query = query.in("area_name", areas);
  }

  const { data } = await query.limit(FALLBACK_TARGET);
  return (data || []) as unknown as Project[];
}

async function tierBrowsingHistory(): Promise<Project[]> {
  const history = readBrowsingHistory().slice(0, 10);
  if (history.length === 0) return [];
  const devNames = Array.from(new Set(history.map((h) => h.developer_name).filter(Boolean))) as string[];
  const areas = Array.from(new Set(history.map((h) => h.area_name).filter(Boolean))) as string[];
  const viewedSlugs = history.map((h) => h.slug).filter(Boolean) as string[];

  if (devNames.length === 0 && areas.length === 0) return [];

  let query: any = supabase
    .from("projects")
    .select(SELECT)
    .eq("is_published", true)
    .not("cover_image_url", "is", null)
    .neq("cover_image_url", "");


  if (viewedSlugs.length > 0) {
    query = query.not("slug", "in", `(${viewedSlugs.map((s) => `"${s}"`).join(",")})`);
  }
  if (devNames.length > 0 && areas.length > 0) {
    query = query.or(`developer_name.in.(${devNames.map((d) => `"${d}"`).join(",")}),area_name.in.(${areas.map((a) => `"${a}"`).join(",")})`);
  } else if (devNames.length > 0) {
    query = query.in("developer_name", devNames);
  } else {
    query = query.in("area_name", areas);
  }

  const { data } = await query.limit(FALLBACK_TARGET);
  return (data || []) as unknown as Project[];
}

async function tierEliteFallback(mode: string | null): Promise<Project[]> {
  // Investor: favour ready + premium areas; Developer: broad; Broker: broad.
  const perDev = await Promise.all(
    ELITE_DEVELOPERS.map(async (dev) => {
      let q = supabase
        .from("projects")
        .select(SELECT)
        .eq("developer_name", dev)
        .eq("is_published", true)
        .not("cover_image_url", "is", null)
        .neq("cover_image_url", "")
        .order("price_from", { ascending: false, nullsFirst: false })
        .limit(4);
      if (mode === "investor") {
        q = q.or(
          "location.ilike.%Business Bay%,location.ilike.%Marina%,location.ilike.%Downtown%,area_name.ilike.%Business Bay%,area_name.ilike.%Marina%,area_name.ilike.%Downtown%",
        );
      }
      const { data } = await q;
      return (data || []) as unknown as Project[];
    }),
  );

  const result: Project[] = [];
  const usedDevs = new Set<string>();
  // One per developer for diversity
  for (const arr of perDev) {
    const pick = arr.find((p) => p.developer_name && !usedDevs.has(p.developer_name));
    if (pick) {
      usedDevs.add(pick.developer_name as string);
      result.push(pick);
    }
    if (result.length >= FALLBACK_TARGET) break;
  }
  // Fill remaining from leftovers (still unique developers)
  if (result.length < FALLBACK_TARGET) {
    for (const arr of perDev) {
      for (const p of arr) {
        if (result.length >= FALLBACK_TARGET) break;
        if (!p.developer_name || usedDevs.has(p.developer_name)) continue;
        if (result.find((r) => r.id === p.id)) continue;
        usedDevs.add(p.developer_name as string);
        result.push(p);
      }
    }
  }
  return result;
}

async function tierPublishedFallback(): Promise<Project[]> {
  const { data } = await supabase
    .from("projects")
    .select(SELECT)
    .eq("is_published", true)
    .not("cover_image_url", "is", null)
    .neq("cover_image_url", "")
    .order("is_premium", { ascending: false, nullsFirst: false })
    .order("is_featured", { ascending: false, nullsFirst: false })
    .order("updated_at", { ascending: false, nullsFirst: false })
    .limit(24);

  return (data || []) as unknown as Project[];
}

export function useHandpickedProjects() {
  const { user } = useAuth();
  const { mode } = useUserModeContext() as any;

  return useQuery({
    queryKey: ["handpicked-projects-v3-owner-controlled", user?.id ?? "anon", mode ?? "none"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const out: Project[] = [];
      const seen = new Set<string>();
      let source: "interest" | "favorites" | "history" | "elite" | "mixed" = "elite";

      // Owner-controlled featured projects run first and may exceed the old six-card limit.
      try {
        const featured = await tierOwnerFeatured();
        if (featured.length > 0) {
          dedupePush(out, seen, featured, featured.length);
          return { projects: out, source: "mixed" as const };
        }
      } catch {}


      try {
        const interest = await tierInterestForm(user?.id, user?.email ?? undefined);
        if (interest.length > 0) source = "interest";
        dedupePush(out, seen, interest);
      } catch {}

      if (out.length < FALLBACK_TARGET && user?.id) {
        try {
          const favs = await tierFavorites(user.id);
          if (favs.length > 0 && source === "elite") source = "favorites";
          else if (favs.length > 0) source = "mixed";
          dedupePush(out, seen, favs);
        } catch {}
      }

      if (out.length < FALLBACK_TARGET) {
        try {
          const history = await tierBrowsingHistory();
          if (history.length > 0 && source === "elite") source = "history";
          else if (history.length > 0) source = "mixed";
          dedupePush(out, seen, history);
        } catch {}
      }

      if (out.length < FALLBACK_TARGET) {
        try {
          const elite = await tierEliteFallback(mode ?? null);
          dedupePush(out, seen, elite);
        } catch {}
      }

      if (out.length < FALLBACK_TARGET) {
        try {
          const published = await tierPublishedFallback();
          for (const p of published) {
            if (out.length >= FALLBACK_TARGET) break;
            if (!p?.id || seen.has(p.id)) continue;
            seen.add(p.id);
            out.push(p);
          }
        } catch {}
      }

      return { projects: out.slice(0, FALLBACK_TARGET), source };
    },
  });
}
