import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, AlertTriangle, ExternalLink, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Candidate {
  id: string;
  name: string;
  developer_name: string | null;
  emirate: string | null;
  location: string | null;
  cover_image_url: string | null;
  slug: string | null;
  is_published: boolean | null;
  created_at: string;
  score: number;
  reason: string;
}

interface Props {
  name: string;
  developerName?: string | null;
  emirate?: string | null;
  location?: string | null;
  /** Called with true when the user confirms "This is a new project" */
  onConfirmedUnique?: (confirmed: boolean) => void;
}

/**
 * ProjectDuplicateCheck — AI-assisted duplicate detector shown inside every
 * upload surface. Debounced against the project name field.
 */
export function ProjectDuplicateCheck({
  name,
  developerName,
  emirate,
  location,
  onConfirmedUnique,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setConfirmed(false);
    onConfirmedUnique?.(false);
    const trimmed = (name || "").trim();
    if (trimmed.length < 3) {
      setCandidates([]);
      setError(null);
      return;
    }
    const ctl = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const { data, error } = await supabase.functions.invoke("project-duplicate-check", {
          body: {
            name: trimmed,
            developer_name: developerName || null,
            emirate: emirate || null,
            location: location || null,
          },
        });
        if (ctl.signal.aborted) return;
        if (error) throw new Error(error.message);
        setCandidates(((data as any)?.candidates || []) as Candidate[]);
      } catch (e) {
        if (!ctl.signal.aborted) setError((e as Error).message || "Check failed");
      } finally {
        if (!ctl.signal.aborted) setLoading(false);
      }
    }, 600);
    return () => {
      ctl.abort();
      clearTimeout(t);
    };
  }, [name, developerName, emirate, location, onConfirmedUnique]);

  if ((name || "").trim().length < 3) {
    return (
      <div className="rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] p-3 mt-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
          <CheckCircle2 className="w-4 h-4 text-[#064E3B]" />
          <span>AI duplicate assistant is ready — enter the project name to check existing and similar projects.</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-[#B89555]/40 bg-[#FDFBF7] p-3 mt-2">
      <div className="flex items-center gap-2 text-sm font-semibold text-[#1A1A1A]">
        {loading ? (
          <>
            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#064E3B]" />
            <span>Checking for existing "{name}"…</span>
          </>
        ) : candidates.length > 0 ? (
          <>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>
              {candidates.length} possible existing match{candidates.length > 1 ? "es" : ""}
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4 text-emerald-700" />
            <span>No existing project matches this name.</span>
          </>
        )}
      </div>

      {error && <p className="text-xs text-red-700 mt-1">{error}</p>}

      {candidates.length > 0 && (
        <ul className="mt-2 divide-y divide-[#B89555]/25">
          {candidates.map((c) => (
            <li key={c.id} className="py-2 flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#EFE6D6] border border-[#B89555]/40 overflow-hidden shrink-0">
                {c.cover_image_url && (
                  <img src={c.cover_image_url} alt={c.name} className="w-full h-full object-cover" loading="lazy" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-semibold text-[#1A1A1A] truncate">{c.name}</span>
                  <Badge variant="outline" className="text-[10px]">
                    {Math.round(c.score * 100)}% match
                  </Badge>
                  {c.is_published && (
                    <Badge className="text-[10px] bg-emerald-700 text-white border-transparent">Live</Badge>
                  )}
                </div>
                <div className="text-xs text-[#1A1A1A]/70 truncate">
                  {[c.developer_name, c.location || c.emirate, c.reason].filter(Boolean).join(" · ")}
                </div>
              </div>
              {c.slug && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => window.open(`/projects/${c.slug}`, "_blank")}
                  className="border-[#B89555]/40 text-[#1A1A1A]"
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1" /> Open
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {candidates.length > 0 && (
        <label className="mt-3 flex items-start gap-2 text-xs text-[#1A1A1A] cursor-pointer">
          <Checkbox
            checked={confirmed}
            onCheckedChange={(checked) => {
              const next = checked === true;
              setConfirmed(next);
              onConfirmedUnique?.(next);
            }}
            className="mt-0.5"
          />
          <span>
            I checked the matches above — <strong>this really is a new project</strong>, not a duplicate.
          </span>
        </label>
      )}
    </div>
  );
}

export default ProjectDuplicateCheck;
