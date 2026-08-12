/**
 * Owner backend — Developer Media Studio.
 *
 * One surface that answers, at a glance: how many developer profiles are
 * missing a cover photo, how many are missing a real logo, how many are
 * missing BOTH (those are archived out of the public directory so the site
 * never renders an empty emerald blueprint), and how many are published
 * correctly.
 *
 * Published profiles stay listed here on purpose: when a developer rebrands or
 * hands over a bigger master-community photo, the cover / logo is replaced from
 * this same row — no re-import, no scraping.
 */
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Archive,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  ImageOff,
  ImagePlus,
  Loader2,
  RefreshCw,
  Search,
  ShieldAlert,
  Upload,
} from "lucide-react";

type DevRow = {
  id: string;
  name: string | null;
  slug: string | null;
  logo_url: string | null;
  logo_url_processed: string | null;
  logo_status: string | null;
  needs_real_logo: boolean | null;
  feature_image_url: string | null;
  is_hidden: boolean | null;
  website_url: string | null;
  updated_at: string | null;
};

type Bucket = "needs_both" | "needs_photo" | "needs_logo" | "published" | "archived";

const BUCKET_LABEL: Record<Bucket, string> = {
  needs_both: "Needs photo + logo",
  needs_photo: "Needs cover photo",
  needs_logo: "Needs real logo",
  published: "Published correctly",
  archived: "Archived (hidden)",
};

const coverOf = (d: DevRow) => (d.feature_image_url || "").trim() || null;
const logoOf = (d: DevRow) => ((d.logo_url_processed || "").trim() || (d.logo_url || "").trim() || null);

/**
 * A logo only counts as real when we have artwork AND it is not the temporary
 * name-wordmark fallback, and the logo status is not `missing` / `unavailable`.
 */
const hasRealLogo = (d: DevRow) =>
  Boolean(logoOf(d)) && !d.needs_real_logo && !["missing", "unavailable"].includes((d.logo_status || "").toLowerCase());

const bucketOf = (d: DevRow): Bucket => {
  const cover = Boolean(coverOf(d));
  const logo = hasRealLogo(d);
  if (cover && logo) return "published";
  if (!cover && !logo) return "needs_both";
  return cover ? "needs_logo" : "needs_photo";
};

/** Supabase caps a select at 1000 rows — page through so counts are the truth. */
async function fetchAllDevelopers(): Promise<DevRow[]> {
  const out: DevRow[] = [];
  const size = 1000;
  for (let page = 0; page < 20; page += 1) {
    const { data, error } = await supabase
      .from("developers")
      .select(
        "id,name,slug,logo_url,logo_url_processed,logo_status,needs_real_logo,feature_image_url,is_hidden,website_url,updated_at",
      )
      .order("name")
      .range(page * size, page * size + size - 1);
    if (error) throw error;
    const rows = (data || []) as unknown as DevRow[];
    out.push(...rows);
    if (rows.length < size) break;
  }
  return out;
}

export default function DeveloperMediaStudio() {
  const [bucket, setBucket] = useState<Bucket>("needs_both");
  const [q, setQ] = useState("");
  const [busyId, setBusyId] = useState<string | null>(null);
  const [archiving, setArchiving] = useState(false);

  const { data: rows = [], isLoading, refetch, isFetching } = useQuery({
    queryKey: ["developer-media-studio"],
    queryFn: fetchAllDevelopers,
    staleTime: 60_000,
  });

  const counts = useMemo(() => {
    const base: Record<Bucket, number> = {
      needs_both: 0,
      needs_photo: 0,
      needs_logo: 0,
      published: 0,
      archived: 0,
    };
    rows.forEach((d) => {
      base[bucketOf(d)] += 1;
      if (d.is_hidden) base.archived += 1;
    });
    return base;
  }, [rows]);

  /** Live profiles that would render an empty media box on the public site. */
  const leaking = useMemo(
    () => rows.filter((d) => !d.is_hidden && !coverOf(d)),
    [rows],
  );

  const visible = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return rows
      .filter((d) => (bucket === "archived" ? Boolean(d.is_hidden) : bucketOf(d) === bucket))
      .filter((d) => !needle || (d.name || "").toLowerCase().includes(needle))
      .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
      .slice(0, 400);
  }, [rows, bucket, q]);

  const saveMedia = async (dev: DevRow, patch: Partial<DevRow>) => {
    setBusyId(dev.id);
    try {
      const next = { ...dev, ...patch };
      const payload: Record<string, unknown> = { ...patch };
      // Completing the media set republishes the profile automatically — an
      // archived developer must never stay hidden once it has real artwork.
      if (coverOf(next) && dev.is_hidden) payload.is_hidden = false;
      if (patch.logo_url_processed || patch.logo_url) {
        payload.needs_real_logo = false;
        payload.logo_status = "approved";
      }
      const { error } = await supabase.from("developers").update(payload).eq("id", dev.id);
      if (error) throw error;
      toast.success(`${dev.name || "Developer"} updated`);
      await refetch();
    } catch (error) {
      toast.error(`Could not save: ${(error as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const toggleHidden = async (dev: DevRow) => {
    setBusyId(dev.id);
    try {
      const { error } = await supabase.from("developers").update({ is_hidden: !dev.is_hidden }).eq("id", dev.id);
      if (error) throw error;
      toast.success(dev.is_hidden ? "Published to the public directory" : "Archived from the public directory");
      await refetch();
    } catch (error) {
      toast.error(`Could not change visibility: ${(error as Error).message}`);
    } finally {
      setBusyId(null);
    }
  };

  const archiveAllLeaking = async () => {
    if (!leaking.length) return;
    setArchiving(true);
    try {
      const ids = leaking.map((d) => d.id);
      for (let i = 0; i < ids.length; i += 200) {
        const { error } = await supabase
          .from("developers")
          .update({ is_hidden: true })
          .in("id", ids.slice(i, i + 200));
        if (error) throw error;
      }
      toast.success(`${ids.length} profiles archived — kept editable here`);
      await refetch();
    } catch (error) {
      toast.error(`Archive failed: ${(error as Error).message}`);
    } finally {
      setArchiving(false);
    }
  };

  return (
    <div className="space-y-6 p-4 md:p-6">
      <header className="space-y-2">
        <h1 className="font-serif text-2xl text-foreground md:text-3xl">Developer media studio</h1>
        <p className="max-w-3xl text-sm text-muted-foreground">
          Every developer profile, bucketed by what its media is missing. Profiles without a cover photo are archived
          from the public directory and stay here so the site never shows an empty media box. Published profiles remain
          listed so a rebranded logo or a better master-community photo can be swapped in at any time.
        </p>
      </header>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {(Object.keys(BUCKET_LABEL) as Bucket[]).map((key) => (
          <button
            key={key}
            onClick={() => setBucket(key)}
            data-active={bucket === key}
            className={`rounded-2xl border p-4 text-left transition-colors ${
              bucket === key
                ? "border-transparent bg-primary text-primary-foreground"
                : "border-border bg-card text-foreground hover:bg-muted"
            }`}
          >
            <span className="block text-2xl font-semibold tabular-nums">{counts[key]}</span>
            <span className="mt-1 block text-xs font-medium leading-snug">{BUCKET_LABEL[key]}</span>
          </button>
        ))}
      </div>

      {leaking.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4">
          <ShieldAlert className="h-5 w-5 shrink-0 text-destructive" />
          <p className="min-w-[16rem] flex-1 text-sm text-foreground">
            <strong className="font-semibold">{leaking.length}</strong> live profiles have no cover photo and would
            render an empty media box on the public directory.
          </p>
          <button
            onClick={archiveAllLeaking}
            disabled={archiving}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {archiving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Archive className="h-4 w-4" />}
            Archive all now
          </button>
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search developer"
            className="h-10 w-72 rounded-full border border-border bg-card pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground"
          />
        </div>
        <button
          onClick={() => refetch()}
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted"
        >
          <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          Refresh
        </button>
        <Link
          to="/owner/crm/jbj/owner-developer-gaps"
          className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-card px-4 text-xs font-medium text-foreground hover:bg-muted"
        >
          Project-level gaps <ExternalLink className="h-3.5 w-3.5" />
        </Link>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading developer media…</p>
      ) : visible.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing in “{BUCKET_LABEL[bucket]}”.</p>
      ) : (
        <ul className="space-y-3">
          {visible.map((dev) => (
            <MediaRow
              key={dev.id}
              dev={dev}
              busy={busyId === dev.id}
              onSave={saveMedia}
              onToggleHidden={toggleHidden}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function MediaRow({
  dev,
  busy,
  onSave,
  onToggleHidden,
}: {
  dev: DevRow;
  busy: boolean;
  onSave: (dev: DevRow, patch: Partial<DevRow>) => Promise<void>;
  onToggleHidden: (dev: DevRow) => Promise<void>;
}) {
  const coverInput = useRef<HTMLInputElement>(null);
  const logoInput = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState<"cover" | "logo" | null>(null);
  const cover = coverOf(dev);
  const logo = logoOf(dev);
  const real = hasRealLogo(dev);

  const upload = async (file: File, kind: "cover" | "logo") => {
    setUploading(kind);
    try {
      const bucket = kind === "cover" ? "developer-assets" : "developer-logos";
      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${dev.slug || dev.id}/${kind}-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from(bucket).upload(path, file, {
        contentType: file.type,
        upsert: true,
      });
      if (error) throw error;
      const { data } = supabase.storage.from(bucket).getPublicUrl(path);
      await onSave(
        dev,
        kind === "cover"
          ? { feature_image_url: data.publicUrl }
          : { logo_url: data.publicUrl, logo_url_processed: data.publicUrl },
      );
    } catch (error) {
      toast.error(`Upload failed: ${(error as Error).message}`);
    } finally {
      setUploading(null);
    }
  };

  const pasteUrl = async (kind: "cover" | "logo") => {
    const value = window.prompt(kind === "cover" ? "Cover photo URL" : "Logo URL", "")?.trim();
    if (!value) return;
    await onSave(
      dev,
      kind === "cover" ? { feature_image_url: value } : { logo_url: value, logo_url_processed: value },
    );
  };

  return (
    <li className="rounded-2xl border border-border bg-card p-3 md:p-4">
      <div className="flex flex-wrap items-start gap-4">
        {/* Cover thumbnail — emerald plate only as the empty-state frame here in
            the back office; the public site never renders this state. */}
        <div className="relative h-20 w-32 shrink-0 overflow-hidden rounded-xl border border-border bg-muted">
          {cover ? (
            <img src={cover} alt={`${dev.name ?? "Developer"} cover`} loading="lazy" className="h-full w-full object-cover" />
          ) : (
            <span className="flex h-full w-full items-center justify-center text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              No photo
            </span>
          )}
        </div>

        <div className="flex h-20 w-32 shrink-0 items-center justify-center rounded-xl bg-[linear-gradient(150deg,#064E3B,#042c1c,#000)] p-2">
          {logo ? (
            <img src={logo} alt={`${dev.name ?? "Developer"} logo`} loading="lazy" className="h-full w-full object-contain" />
          ) : (
            <span className="text-[10px] font-semibold uppercase tracking-wide text-white">No logo</span>
          )}
        </div>

        <div className="min-w-[14rem] flex-1 space-y-2">
          <p className="break-words font-serif text-lg text-foreground">{dev.name || "Unnamed developer"}</p>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
                cover ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              {cover ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ImageOff className="h-3.5 w-3.5" />}
              {cover ? "Cover photo" : "Cover missing"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-medium ${
                real ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
              }`}
            >
              {real ? <CheckCircle2 className="h-3.5 w-3.5" /> : <ImageOff className="h-3.5 w-3.5" />}
              {real ? "Real logo" : logo ? "Temporary wordmark" : "Logo missing"}
            </span>
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-medium ${
                dev.is_hidden ? "border-border text-muted-foreground" : "border-primary/40 text-primary"
              }`}
            >
              {dev.is_hidden ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {dev.is_hidden ? "Archived — backend only" : "Live in directory"}
            </span>
            {dev.website_url && (
              <a
                href={dev.website_url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
              >
                Website <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <input
            ref={coverInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file, "cover");
              e.target.value = "";
            }}
          />
          <input
            ref={logoInput}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) void upload(file, "logo");
              e.target.value = "";
            }}
          />
          <button
            onClick={() => coverInput.current?.click()}
            disabled={busy || uploading !== null}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full bg-primary px-3 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {uploading === "cover" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5" />}
            {cover ? "Replace photo" : "Add photo"}
          </button>
          <button
            onClick={() => logoInput.current?.click()}
            disabled={busy || uploading !== null}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-semibold text-foreground hover:bg-muted disabled:opacity-60"
          >
            {uploading === "logo" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
            {logo ? "Replace logo" : "Add logo"}
          </button>
          <button
            onClick={() => void pasteUrl("cover")}
            disabled={busy}
            className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            Photo URL
          </button>
          <button
            onClick={() => void pasteUrl("logo")}
            disabled={busy}
            className="inline-flex h-9 items-center whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            Logo URL
          </button>
          <button
            onClick={() => void onToggleHidden(dev)}
            disabled={busy}
            className="inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted disabled:opacity-60"
          >
            {dev.is_hidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            {dev.is_hidden ? "Publish" : "Archive"}
          </button>
          {dev.slug && (
            <Link
              to={`/owner/crm/jbj/owner-developers/${dev.slug}`}
              className="inline-flex h-9 items-center gap-1 whitespace-nowrap rounded-full border border-border bg-card px-3 text-xs font-medium text-foreground hover:bg-muted"
            >
              Profile <ExternalLink className="h-3 w-3" />
            </Link>
          )}
        </div>
      </div>
    </li>
  );
}
