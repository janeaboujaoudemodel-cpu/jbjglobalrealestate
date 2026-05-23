import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import RepAvailabilityBadge from "@/components/developers-portal/RepAvailabilityBadge";
import { usePortalRole } from "@/hooks/usePortalRole";

interface Rep {
  id: string;
  full_name: string;
  title: string | null;
  position: string | null;
  nationality: string | null;
  languages: string[] | null;
  assigned_emirates: string[] | null;
  availability_status: string | null;
  is_active: boolean | null;
  developer_id: string;
}

export default function RepDirectory() {
  const { role } = usePortalRole();
  const [search, setSearch] = useState("");
  const [emirate, setEmirate] = useState<string>("");
  const [language, setLanguage] = useState<string>("");

  const { data: reps = [], isLoading } = useQuery({
    queryKey: ["portal-reps", { search, emirate, language }],
    queryFn: async (): Promise<Rep[]> => {
      let q = supabase
        .from("developer_sales_reps")
        .select("id, full_name, title, position, nationality, languages, assigned_emirates, availability_status, is_active, developer_id")
        .eq("is_active", true)
        .order("full_name", { ascending: true })
        .limit(500);

      if (search.trim()) q = q.ilike("full_name", `%${search.trim()}%`);
      if (emirate) q = q.contains("assigned_emirates", [emirate]);
      if (language) q = q.contains("languages", [language]);

      const { data, error } = await q;
      if (error) throw error;
      return (data ?? []) as Rep[];
    },
  });

  const emirates = useMemo(
    () => Array.from(new Set(reps.flatMap((r) => r.assigned_emirates ?? []))).sort(),
    [reps]
  );
  const languages = useMemo(
    () => Array.from(new Set(reps.flatMap((r) => r.languages ?? []))).sort(),
    [reps]
  );

  return (
    <div className="space-y-5">
      <header className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
          <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Sales Representatives</h1>
          <p className="text-sm text-[#1A1A1A]/70 mt-1">
            {reps.length} active rep{reps.length === 1 ? "" : "s"}{role === "owner" ? " across all developers" : ""}.
          </p>
        </div>
      </header>

      <Card className="p-4 bg-[#F7F2EA] border border-[#B89555]/30">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Input placeholder="Search by name" value={search} onChange={(e) => setSearch(e.target.value)} />
          <select
            className="h-10 rounded-md border border-[#B89555]/40 bg-white px-3 text-sm"
            value={emirate}
            onChange={(e) => setEmirate(e.target.value)}
          >
            <option value="">All Emirates</option>
            {emirates.map((em) => <option key={em} value={em}>{em}</option>)}
          </select>
          <select
            className="h-10 rounded-md border border-[#B89555]/40 bg-white px-3 text-sm"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
          >
            <option value="">All Languages</option>
            {languages.map((l) => <option key={l} value={l}>{l}</option>)}
          </select>
          <button
            onClick={() => { setSearch(""); setEmirate(""); setLanguage(""); }}
            className="h-10 rounded-md border border-[#B89555]/40 bg-white text-sm hover:bg-[#EFE6D6]"
          >
            Reset
          </button>
        </div>
      </Card>

      {isLoading && <p className="text-sm text-[#1A1A1A]/60">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {reps.map((rep) => (
          <Link key={rep.id} to={`/developers-portal/reps/${rep.id}`}>
            <Card className="p-5 bg-[#FDFBF7] border border-[#B89555]/30 hover:border-[#B89555] transition-colors h-full">
              <div className="flex items-start justify-between">
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-[#1A1A1A] truncate">{rep.full_name}</p>
                  <p className="text-xs text-[#1A1A1A]/70 mt-0.5 truncate">
                    {rep.position || rep.title || "Sales Representative"}
                  </p>
                </div>
                <RepAvailabilityBadge status={rep.availability_status} />
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {(rep.assigned_emirates ?? []).slice(0, 4).map((em) => (
                  <Badge key={em} variant="outline" className="text-[10.5px] border-[#B89555]/40 bg-[#EFE6D6] text-[#1A1A1A]">
                    {em}
                  </Badge>
                ))}
                {(rep.languages ?? []).slice(0, 3).map((l) => (
                  <Badge key={l} variant="outline" className="text-[10.5px] border-[#B89555]/40 bg-[#F7F2EA] text-[#1A1A1A]">
                    {l}
                  </Badge>
                ))}
              </div>
            </Card>
          </Link>
        ))}

        {!isLoading && reps.length === 0 && (
          <Card className="p-8 col-span-full text-center bg-[#F7F2EA] border border-[#B89555]/30 text-[#1A1A1A]/70">
            No sales representatives match these filters.
          </Card>
        )}
      </div>
    </div>
  );
}
