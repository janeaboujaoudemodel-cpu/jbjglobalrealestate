/**
 * PASS 292 — STAGED DRAFT PREVIEW (LOCKED)
 *
 * Owner-only pre-publish renderer. A staged market row that is NOT on JBJ yet can
 * still be seen exactly as it will read once approved: hero, key facts, gallery and
 * highlights are rendered from the staged record itself, never from the live
 * directory. Nothing here writes to the database — it is a read-only draft view so
 * the owner can validate a project BEFORE it is published.
 *
 * Rules honoured:
 *  - Emerald pair gradient only (#064E3B -> #042c1c -> #000) with white ink.
 *  - Unit counts always read "N units" and always the TOTAL (availability is never shown).
 *  - No emerald blueprint: missing cover renders an explicit "needs cover photo" flag
 *    for the owner instead of a fake placeholder image.
 *  - No cropped text / no ellipsis labels.
 */
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { X, ExternalLink, ImageOff, AlertTriangle, MapPin, Building2, CalendarClock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type Props = {
  stagedId: string | null;
  onClose: () => void;
};

const EMERALD = "linear-gradient(135deg, #064E3B 0%, #042c1c 62%, #000000 100%)";

const asArray = (value: unknown): any[] => {
  if (Array.isArray(value)) return value;
  if (value && typeof value === "object") return Object.values(value as Record<string, any>);
  return [];
};

/**
 * Market sources ship localised copy as { en, tr, az, ... }. Only the English run is
 * ever shown, never the raw JSON blob.
 */
const englishText = (value: unknown): string | null => {
  if (typeof value === "string") {
    const text = value.trim();
    if (!text) return null;
    // Some rows arrive as a serialised locale map, e.g. {'en': "...", 'tr': "..."}.
    if (/^[[{]/.test(text)) {
      try {
        const parsed = JSON.parse(text);
        const nested = englishText(parsed);
        if (nested) return nested;
      } catch {
        const match = text.match(/['"]en['"]\s*:\s*(?:"((?:[^"\\]|\\.)*)"|'((?:[^'\\]|\\.)*)')/);
        const raw = match?.[1] ?? match?.[2];
        if (raw) return raw.replace(/\\"/g, '"').replace(/\\'/g, "'").replace(/\\n/g, "\n").trim();
      }
    }
    return text;
  }
  if (value && typeof value === "object") {
    const map = value as Record<string, any>;
    const pick = map.en ?? map.EN ?? map.english ?? Object.values(map)[0];
    const nested = englishText(pick);
    if (nested) return nested;
  }
  return null;
};


const firstString = (...candidates: unknown[]): string | null => {
  for (const candidate of candidates) {
    const text = englishText(candidate);
    if (text) return text;
  }
  return null;
};

/** "gym,luxury_lobby" -> ["Gym", "Luxury lobby"] — never a raw slug on screen. */
const humanList = (value: unknown, limit: number): string[] => {
  const out: string[] = [];
  for (const entry of asArray(value)) {
    const text = englishText(entry);
    if (!text) continue;
    for (const part of text.split(/[,;|]/)) {
      const label = part.replace(/[_-]+/g, " ").trim();
      if (!label) continue;
      const pretty = label.charAt(0).toUpperCase() + label.slice(1);
      if (!out.includes(pretty)) out.push(pretty);
    }
  }
  return out.slice(0, limit);
};

/** Status labels: a finished project always reads "Project completed". */
const statusLabel = (value: string | null): string | null => {
  if (!value) return null;
  const clean = value.replace(/[_-]+/g, " ").trim();
  if (/^complet/i.test(clean)) return "Project completed";
  if (/^off\s*plan$/i.test(clean)) return "Off-plan";
  return clean.charAt(0).toUpperCase() + clean.slice(1);
};

/** Raw ISO handover dates read as "Handover Q1 2026". */
const handoverLabel = (value: string | null): string | null => {
  if (!value) return null;
  const iso = value.match(/^(\d{4})-(\d{2})/);
  if (iso) {
    const quarter = Math.floor((Number(iso[2]) - 1) / 3) + 1;
    return `Handover Q${quarter} ${iso[1]}`;
  }
  return /handover/i.test(value) ? value : `Handover ${value}`;
};


const firstNumber = (...candidates: unknown[]): number | null => {
  for (const candidate of candidates) {
    const n = typeof candidate === "string" ? Number(candidate.replace(/[^\d.]/g, "")) : candidate;
    if (typeof n === "number" && Number.isFinite(n) && n > 0) return n;
  }
  return null;
};

const imageUrls = (record: Record<string, any>): string[] => {
  const buckets = [record.gallery, record.images, record.photos, record.media, record.payload?.gallery, record.payload?.images];
  const out: string[] = [];
  for (const bucket of buckets) {
    for (const entry of asArray(bucket)) {
      const url = typeof entry === "string" ? entry : firstString(entry?.url, entry?.src, entry?.image_url);
      if (url && /^https?:\/\//.test(url) && !out.includes(url)) out.push(url);
    }
  }
  return out;
};

export default function StagedProjectPreview({ stagedId, onClose }: Props) {
  const { data, isLoading } = useQuery({
    queryKey: ["staged-project-preview", stagedId],
    enabled: !!stagedId,
    queryFn: async () => {
      const { data: row, error } = await supabase
        .from("market_staged_projects" as any)
        .select("*")
        .eq("id", stagedId as string)
        .maybeSingle();
      if (error) throw error;
      const staged = (row || null) as Record<string, any> | null;
      if (!staged) return { staged: null, live: null, liveImages: [] as string[] };

      // MERGED RESULT (LOCKED): the preview must show the FINAL JBJ page — our own
      // record wins on every field it already holds, the market source only fills
      // the gaps. Never show the raw source as if it were the outcome.
      const liveId = firstString(staged.jbj_project_id);
      if (!liveId) return { staged, live: null, liveImages: [] as string[] };
      const [{ data: live }, { data: imgs }] = await Promise.all([
        supabase.from("projects").select("*").eq("id", liveId).maybeSingle(),
        supabase
          .from("project_images")
          .select("image_url, display_order")
          .eq("project_id", liveId)
          .order("display_order", { ascending: true })
          .limit(24),
      ]);
      const liveImages = (imgs ?? [])
        .map((i: any) => i?.image_url)
        .filter((u: any): u is string => typeof u === "string" && !!u);
      return { staged, live: (live || null) as Record<string, any> | null, liveImages };
    },
  });

  const draft = useMemo(() => {
    const r = (data?.staged || {}) as Record<string, any>;
    const p = (r.payload || {}) as Record<string, any>;
    const l = (data?.live || {}) as Record<string, any>;
    const liveImages = data?.liveImages ?? [];
    const sourceGallery = imageUrls(r);
    const gallery = [...liveImages, ...sourceGallery.filter((u) => !liveImages.includes(u))];
    const cover =
      firstString(l.cover_image_url, l.card_image_url) ||
      firstString(r.cover_image, r.cover_url, p.cover_image, gallery[0]);
    const totalUnits = firstNumber(l.total_units, r.total_units, r.units, p.total_units, p.units);
    const area = firstString(l.area_name, r.area, p.area);
    const city = firstString(l.location, l.emirate, r.city, p.city);
    return {
      name: firstString(l.name, r.name, p.name) || "Untitled project",
      developer: firstString(l.developer_name, r.developer_name, p.developer_name),
      area,
      city,
      status: statusLabel(firstString(l.status_label, l.status, r.status, p.status)),
      handover: handoverLabel(
        firstString(l.handover_date, l.expected_completion, r.handover, r.completion_date, p.handover, p.completion),
      ),
      priceFrom:
        firstString(
          l.price_from ? `From AED ${Number(l.price_from).toLocaleString()}` : null,
          r.price_from_label,
          p.price_from_label,
          r.starting_price,
          p.starting_price,
        ),
      bedrooms: firstString(
        l.bedrooms_min != null
          ? `${l.bedrooms_min === 0 ? "Studio" : `${l.bedrooms_min} BR`}${l.bedrooms_max && l.bedrooms_max !== l.bedrooms_min ? ` - ${l.bedrooms_max} BR` : ""}`
          : null,
        r.bedrooms_label,
        r.bedrooms,
        p.bedrooms,
      ),
      paymentPlan: firstString(l.payment_plan, r.payment_plan, p.payment_plan),
      description: firstString(l.description, r.description, r.overview, p.description, p.overview),
      amenities: humanList(
        (Array.isArray(l.amenities) && l.amenities.length ? l.amenities : null) ?? r.amenities ?? p.amenities,
        12,
      ),
      usps: humanList(
        (Array.isArray(l.usp_bullets) && l.usp_bullets.length ? l.usp_bullets : null) ??
          r.usps ??
          r.highlights ??
          p.highlights,
        6,
      ),

      totalUnits,
      cover,
      gallery,
      sourceUrl: firstString(r.source_url),
      liveId: firstString(r.jbj_project_id),
      liveSlug: firstString(l.slug),
      isLive: !!l.is_published,
    };
  }, [data]);

  const gaps = useMemo(() => {
    const list: string[] = [];
    if (!draft.cover) list.push("Needs cover photo — archived from the public directory until one is attached");
    if (!draft.developer) list.push("No developer linked — flagged in the Developer Gaps queue");
    if (!draft.gallery.length) list.push("No gallery photos found on the source");
    if (!draft.description) list.push("No overview copy — project page will read thin");
    if (!draft.totalUnits) list.push("No total unit count");
    return list;
  }, [draft]);


  if (!stagedId) return null;

  return (
    <div
      role="dialog"
      aria-label="Staged project draft preview"
      className="fixed inset-0 z-[120] flex items-start justify-center overflow-y-auto p-6"
      style={{ background: "rgba(10, 15, 13, 0.62)" }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div
        className="w-full max-w-[980px] overflow-hidden rounded-2xl bg-white shadow-2xl"
        style={{ marginLeft: "var(--jc-content-left, 0px)" }}
      >
        {/* Draft banner — this is not live */}
        <div className="flex items-center justify-between gap-4 px-6 py-4" style={{ background: EMERALD }}>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-white/75">
              {draft.liveId
                ? "Merged JBJ result — how the page reads after publish"
                : "Draft JBJ page — not on JBJ yet"}
            </p>
            <h2 className="mt-1 text-xl font-semibold text-white">{draft.name}</h2>
            {draft.liveSlug ? (
              <a
                href={`/project/${draft.liveSlug}`}
                target="_blank"
                rel="noreferrer noopener"
                className="mt-1 inline-block text-xs font-semibold text-white/85 underline"
              >
                Open the current JBJ page
              </a>
            ) : null}

          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close draft preview"
            className="inline-flex h-9 w-9 items-center justify-center rounded-full text-white"
            style={{ background: "rgba(255,255,255,0.14)" }}
          >
            <X className="h-4 w-4" aria-hidden />
          </button>
        </div>

        {isLoading ? (
          <div className="p-8 text-sm text-neutral-600">Loading the staged record…</div>
        ) : (
          <div className="space-y-6 p-6">
            {/* Hero */}
            {draft.cover ? (
              <img
                src={draft.cover}
                alt={`${draft.name} cover`}
                loading="lazy"
                className="h-[280px] w-full rounded-xl object-cover"
              />
            ) : (
              <div className="flex h-[180px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[rgba(6,78,59,0.35)] bg-[rgba(6,78,59,0.04)] text-center">
                <ImageOff className="h-6 w-6 text-[#064E3B]" aria-hidden />
                <p className="px-6 text-sm font-semibold text-[#064E3B]">
                  No cover photo on the source — this project stays archived from the public directory
                </p>
              </div>
            )}

            {/* Key facts */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { icon: Building2, label: "Developer", value: draft.developer || "Not linked" },
                { icon: MapPin, label: "Location", value: [draft.area, draft.city].filter(Boolean).join(", ") || "Not stated" },
                { icon: CalendarClock, label: "Status", value: draft.status || "Not stated" },
                { icon: Building2, label: "Inventory", value: draft.totalUnits ? `${draft.totalUnits} units` : "Not stated" },
              ].map((fact) => (
                <div key={fact.label} className="rounded-xl border border-[rgba(6,78,59,0.12)] p-4">
                  <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#064E3B]">
                    <fact.icon className="h-3.5 w-3.5" aria-hidden />
                    {fact.label}
                  </p>
                  <p className="mt-2 break-words text-sm font-semibold text-neutral-900">{fact.value}</p>
                </div>
              ))}
            </div>

            {(draft.priceFrom || draft.bedrooms || draft.handover || draft.paymentPlan) && (
              <div className="flex flex-wrap gap-2">
                {[draft.priceFrom, draft.bedrooms, draft.handover, draft.paymentPlan]
                  .filter(Boolean)
                  .map((chip) => (
                    <span
                      key={String(chip)}
                      className="rounded-full px-3 py-1.5 text-xs font-semibold text-white"
                      style={{ background: EMERALD }}
                    >
                      {String(chip)}
                    </span>
                  ))}
              </div>
            )}

            {draft.description ? (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#064E3B]">Overview</h3>
                <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-neutral-700">{draft.description}</p>
              </section>
            ) : null}

            {draft.usps.length ? (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#064E3B]">Highlights</h3>
                <ul className="mt-2 grid gap-2 sm:grid-cols-2">
                  {draft.usps.map((usp) => (
                    <li key={usp} className="rounded-lg border border-[rgba(6,78,59,0.12)] px-3 py-2 text-sm text-neutral-800">
                      {usp}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            {draft.amenities.length ? (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#064E3B]">Amenities</h3>
                <div className="mt-2 flex flex-wrap gap-2">
                  {draft.amenities.map((a) => (
                    <span key={a} className="rounded-full border border-[rgba(6,78,59,0.2)] px-3 py-1 text-xs text-neutral-800">
                      {a}
                    </span>
                  ))}
                </div>
              </section>
            ) : null}

            {draft.gallery.length ? (
              <section>
                <h3 className="text-sm font-semibold uppercase tracking-[0.12em] text-[#064E3B]">
                  Gallery ({draft.gallery.length})
                </h3>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {draft.gallery.slice(0, 8).map((url) => (
                    <img key={url} src={url} alt={`${draft.name} photo`} loading="lazy" className="h-24 w-full rounded-lg object-cover" />
                  ))}
                </div>
              </section>
            ) : null}

            {/* Owner-only gap flags */}
            {gaps.length ? (
              <section className="rounded-xl border border-[rgba(176,18,47,0.25)] bg-[rgba(225,29,72,0.05)] p-4">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#9F1239]">
                  <AlertTriangle className="h-4 w-4" aria-hidden />
                  Owner-only data gaps ({gaps.length})
                </h3>
                <ul className="mt-2 space-y-1 text-sm text-neutral-800">
                  {gaps.map((gap) => (
                    <li key={gap}>• {gap}</li>
                  ))}
                </ul>
              </section>
            ) : null}

            {draft.sourceUrl ? (
              <a
                href={draft.sourceUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#064E3B] underline"
              >
                Open the market source record <ExternalLink className="h-3.5 w-3.5" aria-hidden />
              </a>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}
