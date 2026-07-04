/**
 * Dynamic sitemap generator.
 *
 * Runs before `vite dev` and `vite build` (predev/prebuild hooks) and writes
 * public/sitemap.xml with:
 *   1. Every public static route in the app.
 *   2. Every published project (one /project/:slug per row).
 *   3. Every developer, area, and community public slug.
 *   4. Every service catalog entry (mirrors src/seo/serviceSeoCatalog.ts).
 *
 * Data is pulled from Supabase via the public anon key. If the network call
 * fails (offline / CI without env), the script falls back to the static
 * routes alone so the build never breaks.
 */
import { writeFileSync } from "fs";
import { resolve } from "path";

const BASE_URL = "https://jbj.ae";
const SUPABASE_URL = "https://mdafrewypkkrildjgtey.supabase.co";
const SUPABASE_ANON =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1kYWZyZXd5cGtrcmlsZGpndGV5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njc0NTA1NzgsImV4cCI6MjA4MzAyNjU3OH0.-9fLSEsMVLS38f9ca197UVYgXQGxb8g-BPrJv4ZvTp0";

type Changefreq =
  | "always"
  | "hourly"
  | "daily"
  | "weekly"
  | "monthly"
  | "yearly"
  | "never";

interface SitemapEntry {
  path: string;
  lastmod?: string;
  changefreq?: Changefreq;
  priority?: string;
  imageLoc?: string;
  imageTitle?: string;
}

const today = new Date().toISOString().slice(0, 10);

// ---------- 1. Static top-level routes ----------
const staticEntries: SitemapEntry[] = [
  { path: "/", changefreq: "daily", priority: "1.0", imageLoc: `${BASE_URL}/og-image.jpg`, imageTitle: "JBJ Global Real Estate" },
  { path: "/properties", changefreq: "daily", priority: "0.95" },
  { path: "/list-property", changefreq: "weekly", priority: "0.95" },
  { path: "/rent", changefreq: "weekly", priority: "0.92" },
  { path: "/areas", changefreq: "weekly", priority: "0.90" },
  { path: "/communities", changefreq: "weekly", priority: "0.88" },
  { path: "/developers", changefreq: "weekly", priority: "0.90" },
  { path: "/services", changefreq: "weekly", priority: "0.88" },
  { path: "/market-intelligence", changefreq: "daily", priority: "0.85" },
  { path: "/news", changefreq: "daily", priority: "0.85" },
  { path: "/awards", changefreq: "monthly", priority: "0.75" },
  { path: "/about", changefreq: "monthly", priority: "0.85" },
  { path: "/founder", changefreq: "monthly", priority: "0.80" },
  { path: "/team", changefreq: "monthly", priority: "0.75" },
  { path: "/company-profile", changefreq: "monthly", priority: "0.80" },
  { path: "/contact", changefreq: "monthly", priority: "0.85" },
  { path: "/customer-happiness", changefreq: "monthly", priority: "0.70" },
  
  // Guides / SEO content
  { path: "/buyer-guide", changefreq: "monthly", priority: "0.80" },
  { path: "/seller-guide", changefreq: "monthly", priority: "0.80" },
  { path: "/rent-guide", changefreq: "monthly", priority: "0.80" },
  { path: "/mortgage-calculator", changefreq: "monthly", priority: "0.80" },
  { path: "/golden-visa-guide", changefreq: "monthly", priority: "0.78" },
  { path: "/guides/dubai-rental-yield", changefreq: "monthly", priority: "0.85" },
  { path: "/communities/palm-jumeirah-guide", changefreq: "monthly", priority: "0.85" },
  { path: "/communities/downtown-dubai-guide", changefreq: "monthly", priority: "0.85" },
  { path: "/communities/dubai-marina-guide", changefreq: "monthly", priority: "0.85" },
  { path: "/communities/business-bay-guide", changefreq: "monthly", priority: "0.85" },
  { path: "/faq", changefreq: "monthly", priority: "0.75" },
  { path: "/ai-home-finder", changefreq: "monthly", priority: "0.78" },
  { path: "/interior-design-ai", changefreq: "monthly", priority: "0.72" },
  { path: "/property-evaluator", changefreq: "monthly", priority: "0.72" },
  { path: "/cv-builder", changefreq: "monthly", priority: "0.70" },
  // Hubs
  { path: "/investor-hub", changefreq: "weekly", priority: "0.82" },
  { path: "/developer-hub", changefreq: "weekly", priority: "0.80" },
  { path: "/developer-center", changefreq: "weekly", priority: "0.78" },
  { path: "/developer-registration", changefreq: "monthly", priority: "0.70" },
  { path: "/verification", changefreq: "monthly", priority: "0.50" },
  // Legal
  { path: "/privacy", changefreq: "yearly", priority: "0.40" },
  { path: "/terms", changefreq: "yearly", priority: "0.40" },
  { path: "/cookies", changefreq: "yearly", priority: "0.40" },
  { path: "/sitemap", changefreq: "monthly", priority: "0.30" },
];

// ---------- 2. Service catalog ----------
async function getServiceEntries(): Promise<SitemapEntry[]> {
  try {
    const mod = await import("../src/seo/serviceSeoCatalog");
    const entries = mod.computeServiceSeoEntries();
    return entries.map((e: { slug: string }) => ({
      path: `/services/${e.slug}`,
      changefreq: "monthly" as const,
      priority: "0.78",
    }));
  } catch (err) {
    console.warn("[sitemap] service catalog unavailable:", (err as Error).message);
    return [];
  }
}

// ---------- 3. Dynamic rows from Supabase public views ----------
async function fetchSupabase<T>(path: string): Promise<T[]> {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
      headers: {
        apikey: SUPABASE_ANON,
        Authorization: `Bearer ${SUPABASE_ANON}`,
        "Accept-Profile": "public",
      },
    });
    if (!res.ok) {
      console.warn(`[sitemap] ${path} → HTTP ${res.status}`);
      return [];
    }
    return (await res.json()) as T[];
  } catch (err) {
    console.warn(`[sitemap] ${path} fetch failed:`, (err as Error).message);
    return [];
  }
}

async function getProjectEntries(): Promise<SitemapEntry[]> {
  const rows = await fetchSupabase<{
    slug: string;
    updated_at?: string | null;
    cover_image_url?: string | null;
    name?: string | null;
  }>("vw_project_public?select=slug,updated_at,cover_image_url,name&slug=not.is.null&limit=10000");
  return rows
    .filter((r) => r.slug && r.slug.trim().length > 0)
    .map((r) => ({
      path: `/project/${r.slug}`,
      lastmod: r.updated_at?.slice(0, 10) ?? today,
      changefreq: "weekly" as const,
      priority: "0.85",
      imageLoc: r.cover_image_url ?? undefined,
      imageTitle: r.name ?? undefined,
    }));
}

async function getDeveloperEntries(): Promise<SitemapEntry[]> {
  const rows = await fetchSupabase<{ slug: string; updated_at?: string | null }>(
    "developers?select=slug,updated_at&slug=not.is.null&limit=2000"
  );
  return rows
    .filter((r) => r.slug)
    .map((r) => ({
      path: `/developer/${r.slug}`,
      lastmod: r.updated_at?.slice(0, 10) ?? today,
      changefreq: "weekly" as const,
      priority: "0.78",
    }));
}

async function getAreaEntries(): Promise<SitemapEntry[]> {
  const rows = await fetchSupabase<{ slug: string }>(
    "areas?select=slug&slug=not.is.null&limit=2000"
  );
  return rows
    .filter((r) => r.slug)
    .map((r) => ({
      path: `/area/${r.slug}`,
      changefreq: "weekly" as const,
      priority: "0.80",
    }));
}

async function getCommunityEntries(): Promise<SitemapEntry[]> {
  const rows = await fetchSupabase<{ slug: string }>(
    "communities?select=slug&slug=not.is.null&limit=2000"
  );
  return rows
    .filter((r) => r.slug)
    .map((r) => ({
      path: `/community/${r.slug}`,
      changefreq: "weekly" as const,
      priority: "0.78",
    }));
}

// ---------- XML emission ----------
function escape(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function renderEntry(e: SitemapEntry): string {
  const loc = `${BASE_URL}${e.path}`;
  const lines: string[] = [
    "  <url>",
    `    <loc>${escape(loc)}</loc>`,
    `    <lastmod>${e.lastmod ?? today}</lastmod>`,
    e.changefreq ? `    <changefreq>${e.changefreq}</changefreq>` : "",
    e.priority ? `    <priority>${e.priority}</priority>` : "",
  ];
  if (e.imageLoc) {
    lines.push(
      "    <image:image>",
      `      <image:loc>${escape(e.imageLoc)}</image:loc>`,
      e.imageTitle ? `      <image:title>${escape(e.imageTitle)}</image:title>` : "",
      "    </image:image>"
    );
  }
  lines.push("  </url>");
  return lines.filter(Boolean).join("\n");
}

function renderSitemap(entries: SitemapEntry[]): string {
  return [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
    '        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">',
    ...entries.map(renderEntry),
    "</urlset>",
  ].join("\n");
}

async function main() {
  const [services, projects, developers, areas, communities] = await Promise.all([
    getServiceEntries(),
    getProjectEntries(),
    getDeveloperEntries(),
    getAreaEntries(),
    getCommunityEntries(),
  ]);

  // Dedupe by path (in case static + dynamic overlap)
  const seen = new Set<string>();
  const all: SitemapEntry[] = [];
  for (const e of [...staticEntries, ...services, ...projects, ...developers, ...areas, ...communities]) {
    if (seen.has(e.path)) continue;
    seen.add(e.path);
    all.push(e);
  }

  const xml = renderSitemap(all);
  writeFileSync(resolve("public/sitemap.xml"), xml);
  console.log(
    `[sitemap] wrote public/sitemap.xml — ${all.length} entries ` +
      `(static: ${staticEntries.length}, services: ${services.length}, ` +
      `projects: ${projects.length}, developers: ${developers.length}, ` +
      `areas: ${areas.length}, communities: ${communities.length})`
  );
}

main().catch((err) => {
  console.error("[sitemap] FATAL:", err);
  // Don't break the build — keep the existing sitemap on disk.
  process.exit(0);
});
