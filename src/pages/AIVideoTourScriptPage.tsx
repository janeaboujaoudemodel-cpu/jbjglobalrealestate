import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIVideoTourScriptPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIVideoTourScriptPage = () => (
  <>
    <SEOHead
      title="AI Video Tour Script | JBJ Global Real Estate"
      description="Generate professional property video tour scripts with AI-powered content creation."
      canonicalPath="/ai-video-tour-script"
    />
    <AIToolStartGate
      headline="How would you like to script the tour?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Script from Property", Icon: Wand2,
          desc: "Enter the property — AI writes an engaging, on-camera video tour script scene-by-scene.",
          bullets: ["Scene-by-scene", "On-camera tone", "Ready to record"], cta: "Generate script" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Build Script Manually", Icon: Sliders,
          desc: "Draft each scene yourself with AI suggestions on hooks, pacing and calls-to-action.",
          bullets: ["Custom scenes", "AI tone tips", "Save template"], cta: "Write manually" },
      ]}
    >
      <AIVideoTourScriptPremium />
    </AIToolStartGate>
  </>
);

export default AIVideoTourScriptPage;
