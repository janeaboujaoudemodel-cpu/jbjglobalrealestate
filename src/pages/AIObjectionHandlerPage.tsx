import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIObjectionHandlerPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIObjectionHandlerPage = () => (
  <>
    <SEOHead
      title="AI Objection Handler | JBJ Global Real Estate"
      description="Get AI-powered responses to buyer objections with empathetic, value-focused messaging."
      canonicalPath="/ai-objection-handler"
    />
    <AIToolStartGate
      headline="How would you like to handle the objection?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Rebuttal from Objection", Icon: Wand2,
          desc: "Paste the buyer's objection — AI drafts an empathetic, value-focused response.",
          bullets: ["Empathetic tone", "Value-focused", "Ready to send"], cta: "Generate rebuttal" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Build Response Manually", Icon: Sliders,
          desc: "Compose the reply yourself with AI suggestions on tone and structure.",
          bullets: ["Compose yourself", "AI tone tips", "Save for reuse"], cta: "Write manually" },
      ]}
    >
      <AIObjectionHandlerPremium />
    </AIToolStartGate>
  </>
);

export default AIObjectionHandlerPage;
