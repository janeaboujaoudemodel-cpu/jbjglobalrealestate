/**
 * Owner backend — Developer Hub alerts.
 *
 * LOCKED (no emerald blueprint): the public site never renders a placeholder
 * field for missing media. Anything without a verified photo is archived out of
 * the public directory and surfaced here instead, so the team knows exactly
 * which brand or project still needs artwork or content.
 *
 * Buckets:
 *  - Developers archived from the public directory (no cover photograph)
 *  - Developers still on a temporary wordmark (no official logo)
 *  - Projects that are incomplete (missing photo, price or description)
 */
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AlertTriangle, Archive, ExternalLink, FileWarning, ImageOff } from "lucide-react";

type DeveloperAlertRow = {
  id: string;
  name: string | null;
  slug: string | null;
  website_url: string | null;
  feature_image_url: string | null;
  logo_url: string | null;
  logo_url_processed: string | null;
  needs_real_logo: boolean | null;
};

type ProjectAlertRow = {
  id: string;
  name: string | null;
  slug: string | null;
  developer_name: string | null;
  cover_image_url: string | null;
  price_from: number | null;
  description: string | null;
  is_published: boolean | null;
};

const Chip = ({ children }: { children: React.ReactNode }) => (
  <span className="inline-flex items-center gap-1.5 rounded-full bg-destructive/10 px-3 py-1 text-xs font-medium text-destructive">
    {children}
  </span>
);

export default function DeveloperHubAlerts() {
  const [q, setQ] = useState("");

  const { data: developers = [], isLoading: devLoading } = useQuery({
    queryKey: ["developer-hub-alerts-developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("id,name,slug,website_url,feature_image_url,logo_url,logo_url_processed,needs_real_logo")
        .limit(3000);
      if (error) throw error;
      return (data || []) as unknown as DeveloperAlertRow[];
    },
  });

  const { data: projects = [], isLoading: projLoading } = useQuery({
    queryKey: ["developer-hub-alerts-projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,slug,developer_name,cover_image_url,price_from,description,is_published")
        .eq("is_published", true)
        .limit(4000);
      if (error) throw error;
      return (data || []) as unknown as ProjectAlertRow[];
    },
  });

  const needle = q.trim().toLowerCase();
  const matches = (value?: string | null) => !needle || (value || "").toLowerCase().includes(needle);

  const archivedNoCover = useMemo(
    () => developers.filter((d) => !d.feature_image_url && matches(d.name)),
    [developers, needle],
  );

  const needsRealLogo = useMemo(
    () => developers.filter((d) => (d.needs_real_logo || (!d.logo_url && !d.logo_url_processed)) && matches(d.name)),
    [developers, needle],
  );

  const incompleteProjects = useMemo(
    () =>
      projects.filter(
        (p) =>
          (!p.cover_image_url || !p.price_from || !(p.description || "").trim()) &&
          (matches(p.name) || matches(p.developer_name)),
      ),
    [projects, needle],
  );

  const projectGapLabels = (p: ProjectAlertRow) => {
    const gaps: string[] = [];
    if (!p.cover_image_url) gaps.push("No photo");
    if (!p.price_from) gaps.push("No price");
    if (!(p.description || "").trim()) gaps.push("No description");
    return gaps;
  };

  return (
    <section className="space-y-5 rounded-2xl border border-border bg-card p-4 md:p-5">
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="flex items-center gap-2 font-serif text-lg text-foreground">
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            Media &amp; content alerts
          </h2>
          <p className="max-w-3xl text-sm text-muted-foreground">
            The public site never shows a placeholder field. Every record below is either archived from the public
            directory or incomplete, and stays here until the real artwork or content arrives.
          </p>
        </div>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search developer or project"
          className="h-10 w-64 rounded-full border border-border bg-background px-4 text-sm text-foreground placeholder:text-muted-foreground"
        />
      </header>

      {devLoading || projLoading ? (
        <p className="text-sm text-muted-foreground">Loading alerts…</p>
      ) : (
        <div className="space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip>
                <Archive className="h-3.5 w-3.5" /> Archived — needs cover photo
              </Chip>
              <span className="text-xs text-muted-foreground">
                {archivedNoCover.length} developer{archivedNoCover.length === 1 ? "" : "s"} hidden from the public
                directory
              </span>
            </div>
            {archivedNoCover.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every developer has a verified cover photograph.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                {archivedNoCover.map((d) => (
                  <li key={d.id} className="flex items-center justify-between gap-2 rounded-xl border border-border p-3">
                    <span className="min-w-0 break-words text-sm font-medium text-foreground">
                      {d.name || "Unnamed developer"}
                    </span>
                    <span className="flex shrink-0 items-center gap-2">
                      {d.website_url && (
                        <a
                          href={d.website_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                        >
                          Website <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                      {d.slug && (
                        <Link
                          to={`/developer/${d.slug}`}
                          className="text-xs font-medium text-primary hover:underline"
                        >
                          Open
                        </Link>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip>
                <ImageOff className="h-3.5 w-3.5" /> Needs official logo
              </Chip>
              <span className="text-xs text-muted-foreground">
                {needsRealLogo.length} brand{needsRealLogo.length === 1 ? "" : "s"} still on a temporary wordmark
              </span>
            </div>
            {needsRealLogo.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every developer carries an official logo.</p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {needsRealLogo.slice(0, 300).map((d) => (
                  <li key={d.id}>
                    <Link
                      to={d.slug ? `/developer/${d.slug}` : "#"}
                      className="inline-flex max-w-full items-center rounded-full bg-muted px-3 py-1.5 text-xs font-medium text-foreground hover:bg-muted/70"
                    >
                      <span className="break-words">{d.name || "Unnamed developer"}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Chip>
                <FileWarning className="h-3.5 w-3.5" /> Incomplete projects
              </Chip>
              <span className="text-xs text-muted-foreground">
                {incompleteProjects.length} live project{incompleteProjects.length === 1 ? "" : "s"} missing photo, price
                or description
              </span>
            </div>
            {incompleteProjects.length === 0 ? (
              <p className="text-sm text-muted-foreground">Every live project is complete.</p>
            ) : (
              <ul className="grid gap-2 sm:grid-cols-2">
                {incompleteProjects.slice(0, 400).map((p) => (
                  <li key={p.id} className="space-y-1.5 rounded-xl border border-border p-3">
                    <Link
                      to={p.slug ? `/project/${p.slug}` : "#"}
                      className="block break-words text-sm font-medium text-foreground hover:underline"
                    >
                      {p.name || "Untitled project"}
                    </Link>
                    <span className="block text-xs text-muted-foreground">
                      {p.developer_name || "No developer on record"}
                    </span>
                    <span className="flex flex-wrap gap-1.5">
                      {projectGapLabels(p).map((label) => (
                        <span
                          key={label}
                          className="rounded-md bg-destructive/10 px-2 py-0.5 text-[11px] font-semibold text-destructive"
                        >
                          {label}
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
