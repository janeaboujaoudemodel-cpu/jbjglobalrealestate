import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIFollowupSchedulerPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIFollowupSchedulerPage = () => (
  <>
    <SEOHead
      title="AI Follow-up Scheduler | JBJ Global Real Estate"
      description="Smart AI-powered follow-up scheduling based on lead behavior and engagement patterns."
      canonicalPath="/ai-followup-scheduler"
    />
    <AIToolStartGate
      headline="How would you like to schedule follow-ups?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Cadence from Lead", Icon: Wand2,
          desc: "AI reads engagement signals and builds an optimal follow-up cadence per lead.",
          bullets: ["Behaviour-driven", "Optimal timing", "Auto reschedules"], cta: "Generate cadence" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Set Cadence Manually", Icon: Sliders,
          desc: "Pick channels, timing and messages yourself for full control.",
          bullets: ["Custom timing", "Custom messages", "Edit anytime"], cta: "Set manually" },
      ]}
    >
      <AIFollowupSchedulerPremium />
    </AIToolStartGate>
  </>
);

export default AIFollowupSchedulerPage;
