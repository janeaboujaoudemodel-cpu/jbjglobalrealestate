// Shared Firecrawl v2 helper for news + market-data ingestion
const FIRECRAWL_V2 = "https://api.firecrawl.dev/v2";

export function requireFirecrawlKey(): string {
  const k = Deno.env.get("FIRECRAWL_API_KEY");
  if (!k) throw new Error("FIRECRAWL_API_KEY not configured");
  return k;
}

export async function firecrawlScrape(url: string, opts: {
  formats?: any[];
  onlyMainContent?: boolean;
  waitFor?: number;
} = {}): Promise<any> {
  const apiKey = requireFirecrawlKey();
  const res = await fetch(`${FIRECRAWL_V2}/scrape`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      url,
      formats: opts.formats ?? ["markdown", "summary"],
      onlyMainContent: opts.onlyMainContent ?? true,
      waitFor: opts.waitFor,
    }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.error || `Firecrawl ${res.status}`);
  return data;
}
