import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Loader2, Check } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DEFAULT_CHROME,
  type TemplateChrome,
  type ChromeHeaderStyle,
  type ChromeFooterStyle,
} from "@/templates/jbjPropertyAdvertisingAgreement";

const HEADER_STYLES: { key: ChromeHeaderStyle; label: string }[] = [
  { key: "monogram-wordmark", label: "Monogram + Wordmark" },
  { key: "wordmark-only", label: "Wordmark only" },
  { key: "crest-address", label: "Crest + Address" },
  { key: "minimal-hairline", label: "Minimal hairline" },
];

const FOOTER_STYLES: { key: ChromeFooterStyle; label: string }[] = [
  { key: "three-column", label: "Three-column contact" },
  { key: "centered-tagline", label: "Centered tagline" },
  { key: "compliance-bar", label: "Compliance bar" },
];

interface Props {
  value: TemplateChrome;
  onChange: (next: TemplateChrome) => void;
}

export function TemplateChromeStudio({ value, onChange }: Props) {
  const chrome: Required<TemplateChrome> = { ...DEFAULT_CHROME, ...value };
  const [variants, setVariants] = useState<(Required<TemplateChrome> & { name?: string })[] | null>(null);
  const [loading, setLoading] = useState(false);

  const set = <K extends keyof TemplateChrome>(k: K, v: TemplateChrome[K]) =>
    onChange({ ...chrome, [k]: v });

  const generate = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("template-chrome-ai", {
        body: { current: chrome },
      });
      if (error) throw error;
      const list = (data?.variants || []) as Required<TemplateChrome>[];
      if (!list.length) throw new Error("No variants returned");
      setVariants(list);
    } catch (e: any) {
      toast.error(e.message || "AI generation failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-[#F7F2EA] border-[#B89555]/30">
      <CardHeader className="py-3">
        <CardTitle className="text-sm text-[#1A1A1A] flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#B89555]" /> Header & footer studio
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs">Header style</Label>
            <select
              value={chrome.headerStyle}
              onChange={(e) => set("headerStyle", e.target.value as ChromeHeaderStyle)}
              className="w-full h-9 px-2 rounded border border-[#B89555]/40 bg-white text-sm"
            >
              {HEADER_STYLES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Footer style</Label>
            <select
              value={chrome.footerStyle}
              onChange={(e) => set("footerStyle", e.target.value as ChromeFooterStyle)}
              className="w-full h-9 px-2 rounded border border-[#B89555]/40 bg-white text-sm"
            >
              {FOOTER_STYLES.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <Label className="text-xs">Accent (gold hairline)</Label>
            <Input type="color" value={chrome.accent} onChange={(e) => set("accent", e.target.value)} className="h-9" />
          </div>
          <div>
            <Label className="text-xs">Surface</Label>
            <Input type="color" value={chrome.surface} onChange={(e) => set("surface", e.target.value)} className="h-9" />
          </div>
          <div className="md:col-span-2">
            <Label className="text-xs">Tagline (centered footer)</Label>
            <Input value={chrome.tagline} onChange={(e) => set("tagline", e.target.value)} />
          </div>
          <div>
            <Label className="text-xs">TRN</Label>
            <Input value={chrome.trn} onChange={(e) => set("trn", e.target.value)} placeholder="100123456700003" />
          </div>
          <div>
            <Label className="text-xs">RERA / DED License</Label>
            <Input value={chrome.license} onChange={(e) => set("license", e.target.value)} placeholder="ORN 12345" />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-[#B89555]/30 pt-3">
          <div className="text-xs text-[#1A1A1A]/70">Generate 4 brand-safe variations with AI</div>
          <Button size="sm" variant="gold" onClick={generate} disabled={loading}>
            {loading ? <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1" />}
            Generate variations
          </Button>
        </div>

        {variants && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {variants.map((v, i) => (
              <button
                key={i}
                type="button"
                onClick={() => onChange(v)}
                className="text-left rounded border border-[#B89555]/40 bg-white p-3 hover:border-[#B89555] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium text-[#1A1A1A]">{v.name}</div>
                  <Check className="w-3.5 h-3.5 text-[#B89555]" />
                </div>
                <div className="text-[11px] text-[#1A1A1A]/70 mt-1">
                  {v.headerStyle} · {v.footerStyle}
                </div>
                <div className="flex items-center gap-1 mt-2">
                  <span className="w-4 h-4 rounded-sm border border-[#B89555]/40" style={{ background: v.accent }} />
                  <span className="w-4 h-4 rounded-sm border border-[#B89555]/40" style={{ background: v.surface }} />
                  <span className="w-4 h-4 rounded-sm border border-[#B89555]/40" style={{ background: v.ink }} />
                </div>
              </button>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default TemplateChromeStudio;
