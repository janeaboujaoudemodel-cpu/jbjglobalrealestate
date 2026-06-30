import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Headphones, ArrowLeft, Sparkles, Info } from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { EducationBook } from "@/hooks/useBrokerEducation";

// Curated default ElevenLabs voice IDs (owner can override per book)
const DEFAULT_VOICES = [
  { id: "JBFqnCBsd6RMkjVDRZzb", name: "George — Refined British male" },
  { id: "cgSgspJ2msm6clMCkdW9", name: "Jessica — Warm female" },
  { id: "nPczCjzI2devNBz1zQrb", name: "Brian — Authoritative male" },
  { id: "EXAVITQu4vr4xnSDxMaL", name: "Sarah — Crisp female" },
  { id: "onwK4e9ZLuTAKqWW03F9", name: "Daniel — Narrator male" },
];

export default function BrokerLearningVoiceAdmin() {
  const [books, setBooks] = useState<EducationBook[]>([]);
  const [listenEnabled, setListenEnabled] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: bs }, { data: s }] = await Promise.all([
      supabase
        .from("broker_education_books")
        .select("*")
        .order("sort_order", { ascending: true }),
      supabase
        .from("broker_learning_settings")
        .select("id, listen_enabled")
        .limit(1)
        .maybeSingle(),
    ]);
    setBooks((bs as EducationBook[] | null) ?? []);
    setListenEnabled(Boolean(s?.listen_enabled));
    setSettingsId(s?.id ?? null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const toggleGlobal = async (next: boolean) => {
    if (!settingsId) return;
    setListenEnabled(next);
    const { error } = await supabase
      .from("broker_learning_settings")
      .update({ listen_enabled: next, updated_at: new Date().toISOString() })
      .eq("id", settingsId);
    if (error) {
      toast.error("Could not save global toggle");
      setListenEnabled(!next);
    } else {
      toast.success(next ? "Listen feature enabled" : "Listen feature disabled");
    }
  };

  const updateBook = async (id: string, patch: Partial<EducationBook>) => {
    setSavingId(id);
    setBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...patch } : b)));
    const { error } = await supabase
      .from("broker_education_books")
      .update(patch as never)
      .eq("id", id);
    setSavingId(null);
    if (error) toast.error("Could not save change");
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7]">
      <SEOHead
        title="Broker Learning · Voice Admin | JBJ"
        description="Owner-only control for ElevenLabs narration on broker learning books."
        canonicalPath="/owner/broker-learning/voice"
      />
      <div className="container mx-auto px-4 max-w-5xl py-10">
        <Button variant="ghost" size="sm" asChild className="mb-4 text-[#1A1A1A]/70 hover:text-[#1A1A1A]">
          <Link to="/owner"><ArrowLeft className="w-4 h-4 mr-1.5" /> Owner Dashboard</Link>
        </Button>

        <header className="mb-6">
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-3">
            <Sparkles className="w-3 h-3 mr-1" /> Owner Only
          </Badge>
          <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-2">Broker Learning · Voice</h1>
          <p className="text-[#1A1A1A]/70 max-w-2xl">
            Prepare books for ElevenLabs narration. Voice generation is not yet active — these toggles
            configure which books will become audio-ready when the integration is wired.
          </p>
        </header>

        {/* Global toggle */}
        <div className="rounded-2xl border border-[#B89555]/30 bg-[#F7F2EA] p-5 mb-8 flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#EFE6D6] border border-[#B89555]/40 flex items-center justify-center flex-shrink-0">
            <Headphones className="w-5 h-5 text-[#1A1A1A]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between gap-4">
              <div>
                <div className="font-semibold text-[#1A1A1A]">Enable Listen feature</div>
                <div className="text-sm text-[#1A1A1A]/70">
                  Master switch. When off, the Listen button on every book stays disabled regardless of per-book settings.
                </div>
              </div>
              <Switch checked={listenEnabled} onCheckedChange={toggleGlobal} disabled={loading} />
            </div>
            <div className="mt-3 flex items-start gap-2 text-xs text-[#1A1A1A]/60">
              <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              ElevenLabs API call wiring is not deployed yet. UI and schema are ready for the future integration.
            </div>
          </div>
        </div>

        {/* Per-book list */}
        <div className="space-y-3">
          {loading && (
            <div className="text-center py-10 text-[#1A1A1A]/60">Loading books…</div>
          )}
          {!loading && books.map((b) => (
            <div
              key={b.id}
              className="rounded-xl border border-[#B89555]/25 bg-white p-4 flex flex-col md:flex-row md:items-center gap-4"
              data-gold-hairline
            >
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#fff2c4] via-[#d8b86a] to-[#8a6a25] border border-[#B89555]/60 flex items-center justify-center text-[#1A1A1A] font-bold flex-shrink-0 shadow-sm">
                  <Lock className="w-4 h-4" strokeWidth={2.5} style={{ color: "#3a2a08" }} />
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-[#1A1A1A] truncate">{b.title}</div>
                  <div className="text-xs text-[#1A1A1A]/60">{b.learning_path}</div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={b.voice_id ?? ""}
                  onChange={(e) => updateBook(b.id, { voice_id: e.target.value || null })}
                  className="h-9 rounded-md border border-[#B89555]/40 bg-white text-sm text-[#1A1A1A] px-2 min-w-[220px]"
                >
                  <option value="">— Choose voice —</option>
                  {DEFAULT_VOICES.map((v) => (
                    <option key={v.id} value={v.id}>{v.name}</option>
                  ))}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#1A1A1A]/70">Voice</span>
                  <Switch
                    checked={Boolean(b.voice_enabled)}
                    onCheckedChange={(v) => updateBook(b.id, { voice_enabled: v })}
                    disabled={savingId === b.id}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
