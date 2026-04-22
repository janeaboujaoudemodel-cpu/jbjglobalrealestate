/**
 * Owner-only SEO review page.
 *
 * Lists every /services/* slug with its computed title, description,
 * canonicalPath, full canonical URL, and one hreflang target per supported
 * language (+ x-default) — exactly as emitted by <CanonicalAndHreflang /> at
 * runtime.
 *
 * Also calls logServiceSeoReport() on mount so the same data is available as
 * a structured DevTools console report.
 */
import { useEffect, useMemo, useState } from "react";
import SEOHead from "@/components/SEOHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Globe, Link2, Terminal, Copy, Check, Download, ShieldAlert, ShieldCheck, AlertTriangle, Languages } from "lucide-react";
import { SUPPORTED_LANGUAGES } from "@/translations";
import {
  computeServiceSeoEntries,
  logServiceSeoReport,
  CANONICAL_ORIGIN,
} from "@/seo/serviceSeoCatalog";
import { runSeoChecks } from "@/seo/seoChecks";

export default function SeoReview() {
  const entries = useMemo(() => computeServiceSeoEntries(), []);
  const checkReport = useMemo(() => runSeoChecks(entries), [entries]);
  const [query, setQuery] = useState("");
  const [langFilter, setLangFilter] = useState<string>("all");
  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  // When a specific language is selected, narrow each entry's hreflang targets
  // to that language + x-default. "all" preserves the full list.
  const filterTargets = (
    targets: { hreflang: string; href: string }[],
  ) => {
    if (langFilter === "all") return targets;
    return targets.filter(
      (t) => t.hreflang === langFilter || t.hreflang === "x-default",
    );
  };

  // Emit console report once per mount so DevTools always has it ready.
  useEffect(() => {
    logServiceSeoReport();
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return entries;
    return entries.filter(
      (e) =>
        e.slug.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q) ||
        e.canonicalPath.toLowerCase().includes(q),
    );
  }, [entries, query]);

  const copyJson = async () => {
    const payload = JSON.stringify(entries, null, 2);
    await navigator.clipboard.writeText(payload);
    setCopiedSlug("__all__");
    setTimeout(() => setCopiedSlug(null), 1500);
  };

  const downloadCsv = () => {
    const esc = (v: unknown) => {
      const s = v === null || v === undefined ? "" : String(v);
      return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };
    const headers = [
      "slug",
      "file",
      "title",
      "description",
      "canonicalPath",
      "canonicalUrl",
      "hreflangCount",
      "hreflangTargets",
    ];
    const rows = entries.map((e) => [
      e.slug,
      e.file,
      e.title,
      e.description,
      e.canonicalPath,
      e.canonicalUrl,
      e.hreflangTargets.length,
      e.hreflangTargets.map((t) => `${t.hreflang}=${t.href}`).join(" | "),
    ]);
    const csv = [headers, ...rows].map((r) => r.map(esc).join(",")).join("\r\n");
    // BOM so Excel detects UTF-8
    const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `service-seo-catalog_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl space-y-6">
      <SEOHead
        title="SEO Review — Service Slugs | JBJ Global Real Estate"
        description="Owner-only review of computed SEO metadata (title, description, canonical, hreflang) for every /services/* slug."
        canonicalPath="/owner/seo-review"
      />

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold text-foreground flex items-center gap-2">
            <Globe className="w-6 h-6 text-primary" />
            SEO Review — Service Slugs
          </h1>
          <p className="text-muted-foreground text-sm mt-1 max-w-3xl">
            Computed title, description, canonical path, and hreflang targets
            for every <code className="text-foreground">/services/*</code>{" "}
            route. Mirrors what{" "}
            <code className="text-foreground">&lt;CanonicalAndHreflang /&gt;</code>{" "}
            emits at runtime. A structured report is also dumped to the
            browser console on every visit.
          </p>
        </div>
        <div className="flex flex-col gap-2 items-end">
          <Badge variant="outline" className="gap-1.5">
            <Link2 className="w-3 h-3" />
            {entries.length} slugs · {SUPPORTED_LANGUAGES.length} languages + x-default
          </Badge>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => logServiceSeoReport()}
              className="gap-2"
            >
              <Terminal className="w-3.5 h-3.5" />
              Log to console
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={downloadCsv}
              className="gap-2"
            >
              <Download className="w-3.5 h-3.5" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={copyJson}
              className="gap-2"
            >
              {copiedSlug === "__all__" ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              Copy JSON
            </Button>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter by slug, title, description, or path…"
              className="pl-9"
            />
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Canonical origin:{" "}
            <code className="text-foreground">{CANONICAL_ORIGIN}</code>
          </p>
        </CardContent>
      </Card>

      {/* Validation checks */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base flex items-center gap-2">
            {checkReport.errorCount === 0 && checkReport.warningCount === 0 ? (
              <ShieldCheck className="w-5 h-5 text-foreground" />
            ) : checkReport.errorCount > 0 ? (
              <ShieldAlert className="w-5 h-5 text-destructive" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-foreground" />
            )}
            Validation checks
          </CardTitle>
          <div className="flex gap-2 text-xs">
            <Badge variant={checkReport.errorCount > 0 ? "destructive" : "outline"}>
              {checkReport.errorCount} error{checkReport.errorCount === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline" className={checkReport.warningCount > 0 ? "border-foreground/40 text-foreground" : ""}>
              {checkReport.warningCount} warning{checkReport.warningCount === 1 ? "" : "s"}
            </Badge>
            <Badge variant="outline">
              {checkReport.affectedSlugs.size} / {entries.length} slugs flagged
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {checkReport.checks.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              All checks passed: no missing or duplicate titles/descriptions, all canonicalPaths match
              their slug, and every entry includes x-default and all supported locales.
            </p>
          ) : (
            <ul className="divide-y rounded border border-border">
              {checkReport.checks.map((c) => (
                <li key={c.id} className="px-3 py-2 text-sm flex items-start gap-3">
                  <Badge
                    variant={c.severity === "error" ? "destructive" : "outline"}
                    className={c.severity === "warning" ? "border-foreground/40 text-foreground shrink-0" : "shrink-0"}
                  >
                    {c.severity}
                  </Badge>
                  <div className="min-w-0 flex-1">
                    <div>{c.message}</div>
                    {c.slugs.length > 0 && (
                      <div className="mt-1 flex flex-wrap gap-1">
                        {c.slugs.map((s) => (
                          <code key={s} className="font-mono text-[11px] bg-muted px-1.5 py-0.5 rounded">
                            /{s}
                          </code>
                        ))}
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Summary table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Summary</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[180px]">Slug</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead className="w-[260px]">Canonical path</TableHead>
                  <TableHead className="w-[110px] text-right">
                    hreflang
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((e) => (
                  <TableRow key={e.slug}>
                    <TableCell className="font-mono text-xs">
                      {e.slug}
                    </TableCell>
                    <TableCell className="text-sm">{e.title}</TableCell>
                    <TableCell className="font-mono text-xs">
                      <a
                        href={e.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {e.canonicalPath}
                      </a>
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary">
                        {e.hreflangTargets.length}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="text-center text-muted-foreground py-8"
                    >
                      No slugs match “{query}”.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Per-slug detail */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Per-slug detail</CardTitle>
        </CardHeader>
        <CardContent>
          <Accordion type="multiple" className="w-full">
            {filtered.map((e) => (
              <AccordionItem key={e.slug} value={e.slug}>
                <AccordionTrigger className="text-left">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <code className="text-xs font-mono text-primary shrink-0">
                      /{e.slug}
                    </code>
                    <span className="text-sm truncate">{e.title}</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="space-y-4">
                  <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-2 text-sm">
                    <dt className="text-muted-foreground">File</dt>
                    <dd className="font-mono text-xs">
                      src/pages/services/{e.file}
                    </dd>

                    <dt className="text-muted-foreground">Title</dt>
                    <dd>{e.title}</dd>

                    <dt className="text-muted-foreground">Description</dt>
                    <dd className="text-muted-foreground">{e.description}</dd>

                    <dt className="text-muted-foreground">Canonical path</dt>
                    <dd className="font-mono text-xs">{e.canonicalPath}</dd>

                    <dt className="text-muted-foreground">Canonical URL</dt>
                    <dd className="font-mono text-xs break-all">
                      <a
                        href={e.canonicalUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline"
                      >
                        {e.canonicalUrl}
                      </a>
                    </dd>
                  </dl>

                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                      hreflang targets ({e.hreflangTargets.length})
                    </h4>
                    <div className="overflow-x-auto rounded border border-border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[140px]">Language</TableHead>
                            <TableHead className="w-[100px]">hreflang</TableHead>
                            <TableHead>href</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {e.hreflangTargets.map((t) => {
                            const langInfo = SUPPORTED_LANGUAGES.find(
                              (l) => l.code === t.hreflang,
                            );
                            return (
                              <TableRow key={t.hreflang}>
                                <TableCell className="text-sm">
                                  {langInfo
                                    ? `${langInfo.flag} ${langInfo.name}`
                                    : "🌐 x-default (fallback)"}
                                </TableCell>
                                <TableCell className="font-mono text-xs">
                                  {t.hreflang}
                                </TableCell>
                                <TableCell className="font-mono text-xs break-all text-muted-foreground">
                                  {t.href}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
