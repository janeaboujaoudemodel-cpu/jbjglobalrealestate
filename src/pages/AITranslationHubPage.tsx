import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AITranslationHubPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AITranslationHubPage = () => (
  <>
    <SEOHead
      title="AI Translation Hub | JBJ Global Real Estate"
      description="Translate real estate communications to any language instantly with AI-powered accuracy."
      canonicalPath="/ai-translation-hub"
    />
    <AIToolStartGate
      headline="How would you like to translate?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "Auto-Detect & Translate", Icon: Wand2,
          desc: "Paste any text — AI detects the source language and delivers a natural translation.",
          bullets: ["Auto-detect language", "Context-aware", "Ready to send"], cta: "Translate with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Pick Language & Tone", Icon: Sliders,
          desc: "Choose source, target, tone and formality yourself for full control.",
          bullets: ["Custom tone", "Choose formality", "Save presets"], cta: "Configure manually" },
      ]}
    >
      <AITranslationHubPremium />
    </AIToolStartGate>
  </>
);

export default AITranslationHubPage;
