import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { CalendarClock, Eraser, Sparkles, Globe } from "lucide-react";
import { IconTile } from "@/components/ui/icon-tile";

type Counts = {
  total: number;
  null_handover: number;
  null_with_source_url: number;
  null_with_developer: number;
  fake_q4_2026: number;
};

async function loadCounts(): Promise<Counts> {
  // Single round-trip via RPC would be nicer; do it with concurrent queries.
  const [{ count: total }, { count: nullCount }, { count: nullSrc }, { count: nullDev }, { count: fakeQ4 }] =
    await Promise.all([
      supabase.from("projects").select("id", { count: "exact", head: true }),
      supabase.from("projects").select("id", { count: "exact", head: true }).is("handover_date", null),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("handover_date", null)
        .not("source_url", "is", null),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .is("handover_date", null)
        .not("developer_name", "is", null),
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("handover_date", "Q4 2026")
        .is("reelly_id", null),
    ]);
  return {
    total: total ?? 0,
    null_handover: nullCount ?? 0,
    null_with_source_url: nullSrc ?? 0,
    null_with_developer: nullDev ?? 0,
    fake_q4_2026: fakeQ4 ?? 0,
  };
}

export function HandoverRepairPanel() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = async () => {
    try {
      setCounts(await loadCounts());
    } catch (e: any) {
      console.error("[HandoverRepair] count error", e);
    }
  };

  useEffect(() => {
    refresh();
    const id = setInterval(refresh, 15_000);
    return () => clearInterval(id);
  }, []);

  const callFn = async (
    fn: "clear-fake-handover-defaults" | "drain-handover-dates" | "backfill-handover-dates",
    body: Record<string, unknown>,
    label: string,
  ) => {
    setBusy(fn);
    try {
      const { data, error } = await supabase.functions.invoke(fn, { body });
      if (error) throw error;
      const result = (data as any)?.result;
      const detail =
        fn === "clear-fake-handover-defaults"
          ? `Cleared ${(data as any)?.updated ?? 0} placeholder rows.`
          : fn === "drain-handover-dates"
            ? `Background drain started (run ${(data as any)?.run_id?.slice(0, 8)}…). Counts will update automatically.`
            : `Stage ${ (data as any)?.stage } — updated ${result?.updated ?? 0}, failed ${result?.failed ?? 0}, remaining ${result?.remaining ?? "?"}.`;
      toast.success(label, { description: detail });
      await refresh();
    } catch (e: any) {
      toast.error(label, { description: e?.message ?? String(e) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <Card className="border-[#B89555]/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <IconTile icon={CalendarClock} tone="gold" size="sm" />
          Handover date repair
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
          <Stat label="Total projects" value={counts?.total} />
          <Stat label="Missing handover" value={counts?.null_handover} tone={counts && counts.null_handover > 0 ? "warn" : "ok"} />
          <Stat label="Have source URL" value={counts?.null_with_source_url} />
          <Stat label="Fake “Q4 2026”" value={counts?.fake_q4_2026} tone={counts && counts.fake_q4_2026 > 0 ? "warn" : "ok"} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Button
            variant="secondary"
            disabled={busy !== null || (counts?.fake_q4_2026 ?? 0) === 0}
            onClick={() =>
              callFn(
                "clear-fake-handover-defaults",
                { placeholder: "Q4 2026" },
                "Cleared placeholder dates",
              )
            }
            className="justify-start gap-2"
          >
            <Eraser className="h-4 w-4" />
            Clear “Q4 2026” placeholders
            {counts?.fake_q4_2026 ? (
              <Badge variant="outline" className="ml-auto">{counts.fake_q4_2026}</Badge>
            ) : null}
          </Button>

          <Button
            variant="gold"
            disabled={busy !== null || (counts?.null_with_source_url ?? 0) === 0}
            onClick={() =>
              callFn(
                "drain-handover-dates",
                { batch_size: 5, max_iterations: 250 },
                "Background drain started",
              )
            }
            className="justify-start gap-2"
          >
            <Globe className="h-4 w-4" />
            Re-fetch from source pages
            {counts?.null_with_source_url ? (
              <Badge variant="outline" className="ml-auto">{counts.null_with_source_url}</Badge>
            ) : null}
          </Button>

          <Button
            variant="secondary"
            disabled={busy !== null || (counts?.null_with_developer ?? 0) === 0}
            onClick={() =>
              callFn(
                "backfill-handover-dates",
                { stage: 3, batch_size: 25 },
                "AI inference batch",
              )
            }
            className="justify-start gap-2"
          >
            <Sparkles className="h-4 w-4" />
            AI verify (single batch)
            {counts?.null_with_developer ? (
              <Badge variant="outline" className="ml-auto">{counts.null_with_developer}</Badge>
            ) : null}
          </Button>
        </div>

        <p className="text-xs text-[#1A1A1A]/70">
          Source-page re-fetch runs in the background and may take several minutes for large
          batches. Counts above refresh every 15 seconds. The AI verifier returns null when not
          confident — it will never invent a date.
        </p>
      </CardContent>
    </Card>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number | undefined;
  tone?: "ok" | "warn";
}) {
  const color = tone === "warn" ? "text-[#B45309]" : tone === "ok" ? "text-[#047857]" : "text-[#1A1A1A]";
  return (
    <div className="rounded-md border border-[#B89555]/20 bg-[#F7F2EA] px-3 py-2">
      <div className="text-xs text-[#1A1A1A]/70">{label}</div>
      <div className={`text-lg font-semibold tabular-nums ${color}`}>
        {value === undefined ? "—" : value.toLocaleString()}
      </div>
    </div>
  );
}
