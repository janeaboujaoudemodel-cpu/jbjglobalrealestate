import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Loader2 } from 'lucide-react';

interface SourceRow {
  signup_source: string;
  signup_source_label: string;
  total_picks: number;
  unique_users: number;
  picks_last_7d: number;
  picks_last_30d: number;
  last_picked_at: string | null;
}

export default function LeadSourcesPanel() {
  const [rows, setRows] = useState<SourceRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchRows = async () => {
      const { data, error } = await supabase
        .from('vw_signup_source_counts' as any)
        .select('*');
      if (!cancelled && !error && data) setRows(data as unknown as SourceRow[]);
      if (!cancelled) setLoading(false);
    };
    fetchRows();
    const id = setInterval(fetchRows, 1000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return (
    <Card className="bg-[#F7F2EA] border-2 border-[#B89555]/40">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-semibold text-[#1A1A1A] flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-[hsl(var(--gold))]" strokeWidth={2.5} />
          Lead Sources
          <span className="ml-auto inline-flex items-center gap-1.5 text-[10px] font-medium text-[#1A1A1A]/60 uppercase tracking-wider">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            Live
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-6 flex items-center justify-center text-[#1A1A1A]/60">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Loading…
          </div>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#1A1A1A]/60 py-6 text-center">
            No leads yet — picks will appear here as soon as users select a role anywhere on the site.
          </p>
        ) : (
          <div className="overflow-hidden rounded-lg border border-[#B89555]/30">
            <table className="w-full text-sm">
              <thead className="bg-[#EFE6D6] text-[#1A1A1A] text-xs uppercase tracking-wider">
                <tr>
                  <th className="text-left px-4 py-2 font-semibold">Source</th>
                  <th className="text-right px-3 py-2 font-semibold">Total Unique</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r.signup_source}
                    className="border-t border-[#B89555]/20 hover:bg-[#FDFBF7] transition-colors"
                  >
                    <td className="px-4 py-3 text-[#1A1A1A] font-medium">
                      {r.signup_source_label}
                      <div className="text-[10px] text-[#1A1A1A]/50 font-mono mt-0.5">
                        {r.signup_source}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums font-semibold text-[#1A1A1A]">
                      {r.unique_users}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
