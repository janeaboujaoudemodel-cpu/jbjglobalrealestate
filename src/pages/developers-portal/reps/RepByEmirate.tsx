import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { MapPin } from "lucide-react";

interface Rep {
  id: string;
  full_name: string;
  assigned_emirates: string[] | null;
  position: string | null;
  title: string | null;
}

export default function RepByEmirate() {
  const { data: reps = [], isLoading } = useQuery({
    queryKey: ["portal-reps-by-emirate"],
    queryFn: async (): Promise<Rep[]> => {
      const { data, error } = await supabase
        .from("developer_sales_reps")
        .select("id, full_name, assigned_emirates, position, title")
        .eq("is_active", true)
        .limit(1000);
      if (error) throw error;
      return (data ?? []) as Rep[];
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, Rep[]>();
    for (const rep of reps) {
      const list = rep.assigned_emirates && rep.assigned_emirates.length > 0
        ? rep.assigned_emirates
        : ["Unassigned"];
      for (const em of list) {
        if (!map.has(em)) map.set(em, []);
        map.get(em)!.push(rep);
      }
    }
    return Array.from(map.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [reps]);

  return (
    <div className="space-y-6">
      <header>
        <p className="text-xs uppercase tracking-[0.18em] text-[#1A1A1A]/60">Developers Portal</p>
        <h1 className="text-3xl font-semibold tracking-tight text-[#1A1A1A] mt-1">Reps by Emirate</h1>
        <p className="text-sm text-[#1A1A1A]/70 mt-1">Coverage across all UAE Emirates.</p>
      </header>

      {isLoading && <p className="text-sm text-[#1A1A1A]/60">Loading…</p>}

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {grouped.map(([emirate, list]) => (
          <Card key={emirate} className="p-5 bg-[#F7F2EA] border border-[#B89555]/30">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#1A1A1A]" />
                <h3 className="font-semibold text-[#1A1A1A]">{emirate}</h3>
              </div>
              <span className="text-2xl font-semibold text-[#1A1A1A]">{list.length}</span>
            </div>
            <ul className="mt-3 space-y-1.5 max-h-56 overflow-y-auto">
              {list.slice(0, 10).map((r) => (
                <li key={r.id} className="text-sm">
                  <Link to={`/developers-portal/reps/${r.id}`} className="text-[#1A1A1A] hover:underline">
                    {r.full_name}
                  </Link>
                  <span className="text-[#1A1A1A]/60"> — {r.position || r.title || "Sales Rep"}</span>
                </li>
              ))}
              {list.length > 10 && (
                <li className="text-xs text-[#1A1A1A]/60">+ {list.length - 10} more…</li>
              )}
            </ul>
          </Card>
        ))}
      </div>
    </div>
  );
}
