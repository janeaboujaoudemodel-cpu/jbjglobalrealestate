// /admin/translation-coverage — Owner-only dashboard for the i18n cache.
// - Per-language coverage counts
// - "Warm now" button to invoke the i18n-warm edge function
// - Recent translation samples per language

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SUPPORTED_LANGUAGES } from "@/translations";
import { toast } from "sonner";

interface LangStat {
  lang: string;
  count: number;
  lastUpdated: string | null;
}

export default function TranslationCoverage() {
  const [stats, setStats] = useState<LangStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);

  async function load() {
    setLoading(true);
    const langs = SUPPORTED_LANGUAGES.filter((l) => l.code !== "en").map((l) => l.code);
    const out: LangStat[] = [];
    for (const lang of langs) {
      const { count } = await supabase
        .from("translations_cache")
        .select("source_hash", { count: "exact", head: true })
        .eq("target_lang", lang);
      const { data: latest } = await supabase
        .from("translations_cache")
        .select("created_at")
        .eq("target_lang", lang)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      out.push({
        lang,
        count: count ?? 0,
        lastUpdated: latest?.created_at ?? null,
      });
    }
    setStats(out);
    setLoading(false);
  }

  useEffect(() => { void load(); }, []);

  async function handleWarm() {
    setWarming(true);
    try {
      const { error } = await supabase.functions.invoke("i18n-warm", { body: {} });
      if (error) throw error;
      toast.success("Translation cache warmed for all languages");
      await load();
    } catch (e) {
      console.error(e);
      toast.error("Warm failed — check edge function logs");
    } finally {
      setWarming(false);
    }
  }

  return (
    <div className="min-h-screen bg-white p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black">Translation Coverage</h1>
            <p className="text-sm text-black/60 mt-1">
              Auto-translation cache health across all 15 languages.
            </p>
          </div>
          <Button onClick={handleWarm} disabled={warming}>
            {warming ? "Warming…" : "Warm cache now"}
          </Button>
        </div>

        <Card>
          <CardHeader><CardTitle>Cached strings per language</CardTitle></CardHeader>
          <CardContent>
            {loading ? (
              <p className="text-black/60">Loading…</p>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {stats.map((s) => {
                  const info = SUPPORTED_LANGUAGES.find((l) => l.code === s.lang)!;
                  const healthy = s.count >= 100;
                  return (
                    <div
                      key={s.lang}
                      className="border border-black/10 rounded-lg p-4 bg-white"
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-2xl">{info.flag}</span>
                        <div>
                          <div className="font-semibold text-black">{info.name}</div>
                          <div className="text-xs text-black/50">{info.nativeName}</div>
                        </div>
                      </div>
                      <div className="flex items-baseline justify-between">
                        <span className={`text-2xl font-bold ${healthy ? "text-emerald-600" : "text-amber-600"}`}>
                          {s.count.toLocaleString()}
                        </span>
                        <span className="text-xs text-black/50">strings cached</span>
                      </div>
                      {s.lastUpdated && (
                        <div className="text-xs text-black/40 mt-2">
                          Last update: {new Date(s.lastUpdated).toLocaleString()}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <p className="text-xs text-black/50 mt-6">
          New text added anywhere in the app is translated automatically the moment
          it appears in the DOM. This dashboard shows how much of the cache is
          pre-warmed; warming is optional and only used to make first-visit
          language switches feel instant.
        </p>
      </div>
    </div>
  );
}
