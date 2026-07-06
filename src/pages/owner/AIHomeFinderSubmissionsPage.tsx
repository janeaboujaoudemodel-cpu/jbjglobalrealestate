// Owner-only view of every AI Home Finder ("Matchmaker") submission.
// Surfaces lead contact details + the exact same recommended projects the
// visitor was shown, so staff can follow up with the same report.
import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Mail, Phone, MessageCircle, Sparkles, ExternalLink, Calendar, Users, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import MatchCriteriaTable from "@/components/matchmaker/MatchCriteriaTable";
import { formatDistanceToNow } from "date-fns";

interface Submission {
  id: string;
  session_id: string;
  full_name: string;
  email: string;
  phone: string;
  nationality: string | null;
  preferred_language: string | null;
  answers: Record<string, string | string[]>;
  recommended_slugs: string[];
  result_tier: "exact" | "close" | "nearest" | "fallback";
  created_at: string;
}

const tierStyles: Record<Submission["result_tier"], { label: string; bg: string; fg: string }> = {
  exact:    { label: "Exact",    bg: "rgba(16,185,129,0.18)", fg: "#34D399" },
  close:    { label: "Close",    bg: "rgba(34,211,238,0.18)", fg: "#B89555" },
  nearest:  { label: "Nearest",  bg: "rgba(245,158,11,0.18)", fg: "#FBBF24" },
  fallback: { label: "Fallback", bg: "rgba(148,163,184,0.18)", fg: "#94A3B8" },
};

export default function AIHomeFinderSubmissionsPage() {
  const [filter, setFilter] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  const { data: submissions = [], isLoading } = useQuery({
    queryKey: ["matchmaker-submissions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("matchmaker_submissions")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) throw error;
      return (data || []) as Submission[];
    },
  });

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return submissions;
    return submissions.filter(
      (s) =>
        s.full_name?.toLowerCase().includes(q) ||
        s.email?.toLowerCase().includes(q) ||
        s.phone?.toLowerCase().includes(q) ||
        s.nationality?.toLowerCase().includes(q)
    );
  }, [submissions, filter]);

  const open = submissions.find((s) => s.id === openId) || null;

  return (
    <div className="p-6 md:p-8 max-w-6xl mx-auto" data-owner-batch-fix="ai-home-finder">
      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-5 h-5 text-[#B89555]" />
            <h1 className="text-2xl font-bold text-[#1A1A1A]">AI Home Finder — Submissions</h1>
          </div>
          <p className="text-sm text-[#1A1A1A]/70">
            Every visitor that completed the AI Matchmaker, including their contact details and the 3 properties we showed them.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="border-[#B89555]/40 text-[#1A1A1A]">
            <Users className="w-3 h-3 mr-1" /> {submissions.length} total
          </Badge>
        </div>
      </header>

      <div className="mb-4 flex items-center gap-2 max-w-md">
        <Filter className="w-4 h-4 text-[#1A1A1A]/60" />
        <Input
          placeholder="Search by name, email, phone, nationality…"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        />
      </div>

      <div className="rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA] overflow-hidden max-w-full">
        <div className="overflow-hidden max-w-full">
          <table className="w-full table-fixed text-[12px] md:text-sm">
            <thead className="bg-[#EFE6D6] text-[#1A1A1A]">
              <tr>
                <th className="w-[15%] text-left p-3 font-semibold">Lead</th>
                <th className="w-[28%] text-left p-3 font-semibold">Contact</th>
                <th className="w-[28%] text-left p-3 font-semibold">Recommendations</th>
                <th className="w-[9%] text-left p-3 font-semibold">Tier</th>
                <th className="w-[10%] text-left p-3 font-semibold">Submitted</th>
                <th className="w-[10%] text-right p-3 font-semibold">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={6} className="p-6 text-center text-[#1A1A1A]/60">Loading submissions…</td></tr>
              )}
              {!isLoading && filtered.length === 0 && (
                <tr><td colSpan={6} className="p-6 text-center text-[#1A1A1A]/60">No submissions yet.</td></tr>
              )}
              {filtered.map((s) => {
                const tier = tierStyles[s.result_tier] || tierStyles.exact;
                return (
                  <tr key={s.id} className="border-t border-[#B89555]/15 hover:bg-[#EFE6D6]/40">
                    <td className="p-3">
                      <div className="font-semibold text-[#1A1A1A] break-words">{s.full_name || "—"}</div>
                      <div className="text-xs text-[#1A1A1A]/60">{s.nationality || ""}{s.preferred_language ? ` · ${s.preferred_language}` : ""}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1.5 text-[#1A1A1A] min-w-0"><Mail className="w-3 h-3 shrink-0" /><span className="truncate">{s.email}</span></div>
                      <div className="flex items-center gap-1.5 text-[#1A1A1A]/80 text-xs mt-0.5"><Phone className="w-3 h-3" />{s.phone}</div>
                    </td>
                    <td className="p-3">
                      <div className="flex flex-wrap gap-1">
                        {(s.recommended_slugs || []).slice(0, 3).map((slug) => (
                          <Link
                            key={slug}
                            to={`/project/${slug}`}
                            target="_blank"
                            data-recommendation-chip="champagne"
                            data-ink-emerald-opt-out
                            className="text-xs px-2 py-0.5 rounded-full border max-w-full truncate"
                            style={{ background: "#FFF7E6", backgroundImage: "none", borderColor: "rgba(184,149,85,0.50)", color: "#1A1A1A", WebkitTextFillColor: "#1A1A1A" }}
                          >
                            {slug.replace(/-/g, " ").slice(0, 32)}
                          </Link>
                        ))}
                      </div>
                    </td>
                    <td className="p-3">
                      <span
                        className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
                        style={{ background: tier.bg, color: tier.fg, border: `1px solid ${tier.fg}55` }}
                      >
                        {tier.label}
                      </span>
                    </td>
                    <td className="p-3 text-xs text-[#1A1A1A]/70">
                      <Calendar className="inline w-3 h-3 mr-1" />
                      {formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}
                    </td>
                    <td className="p-3 text-right">
                      <Button size="sm" variant="outline" className="h-8 px-2 text-[11px]" onClick={() => setOpenId(s.id)}>
                        View report
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!openId} onOpenChange={(v) => !v && setOpenId(null)}>
        <SheetContent className="w-full sm:max-w-3xl overflow-y-auto bg-[#02110F] text-white border-l border-[#B89555]/40">
          {open && <SubmissionDetail submission={open} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function SubmissionDetail({ submission }: { submission: Submission }) {
  const { data: projects = [] } = useQuery({
    queryKey: ["matchmaker-projects", submission.recommended_slugs],
    queryFn: async () => {
      if (!submission.recommended_slugs?.length) return [];
      const { data, error } = await supabase
        .from("projects")
        .select("id,name,slug,location,emirate,price_from,bedrooms_min,bedrooms_max,handover_date,cover_image_url,developer:developers(name),community:communities(name),amenities,views")
        .in("slug", submission.recommended_slugs);
      if (error) throw error;
      return (data || []).sort(
        (a: any, b: any) =>
          submission.recommended_slugs.indexOf(a.slug) -
          submission.recommended_slugs.indexOf(b.slug)
      );
    },
    enabled: !!submission,
  });

  const tier = tierStyles[submission.result_tier] || tierStyles.exact;

  return (
    <>
      <SheetHeader className="mb-4">
        <SheetTitle className="text-white">{submission.full_name}</SheetTitle>
        <SheetDescription className="text-white/70">
          Submitted {formatDistanceToNow(new Date(submission.created_at), { addSuffix: true })} · session {submission.session_id.slice(0, 16)}…
        </SheetDescription>
      </SheetHeader>

      <div className="grid gap-3 md:grid-cols-2 mb-6">
        <a
          href={`mailto:${submission.email}`}
          className="flex items-center gap-2 p-3 rounded-xl bg-[#031E18] border border-[#B89555]/40 hover:border-[#B89555]"
        >
          <Mail className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm">{submission.email}</span>
        </a>
        <a
          href={`https://wa.me/${submission.phone.replace(/[^0-9]/g, "")}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 p-3 rounded-xl bg-[#031E18] border border-[#B89555]/40 hover:border-[#B89555]"
        >
          <MessageCircle className="w-4 h-4 text-[#B89555]" />
          <span className="text-sm">{submission.phone}</span>
        </a>
      </div>

      <div className="mb-4 flex items-center gap-2">
        <span
          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold"
          style={{ background: tier.bg, color: tier.fg, border: `1px solid ${tier.fg}55` }}
        >
          {tier.label} match tier
        </span>
        {submission.nationality && (
          <span className="text-xs text-white/70">{submission.nationality}</span>
        )}
      </div>

      <div className="aihf-results">
        {projects.length > 0 && submission.answers && (
          <MatchCriteriaTable answers={submission.answers as any} projects={projects as any} />
        )}
      </div>

      <h3 className="text-sm font-semibold text-[#67E8F9] uppercase tracking-wide mt-6 mb-2">
        Top 3 recommendations shown
      </h3>
      <div className="grid gap-3">
        {projects.map((p: any, i: number) => (
          <Link
            key={p.id}
            to={`/project/${p.slug}`}
            target="_blank"
            className="flex items-center gap-3 p-3 rounded-xl bg-[#031E18] border border-[#B89555]/30 hover:border-[#B89555]"
          >
            {p.cover_image_url && (
              <img src={p.cover_image_url} alt="" className="w-14 h-14 rounded-lg object-cover"  loading="lazy" decoding="async" />
            )}
            <div className="flex-1 min-w-0">
              <div className="text-xs text-[#67E8F9]">#{i + 1} · {p.developer?.name || "—"}</div>
              <div className="font-semibold text-white truncate">{p.name}</div>
              <div className="text-xs text-white/70 truncate">{p.location}{p.emirate ? `, ${p.emirate}` : ""}</div>
            </div>
            <ExternalLink className="w-4 h-4 text-white/70" />
          </Link>
        ))}
      </div>
    </>
  );
}
