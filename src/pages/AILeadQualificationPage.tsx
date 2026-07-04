import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AILeadQualificationPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AILeadQualificationPage = () => (
  <>
    <SEOHead
      title="AI Lead Qualification | JBJ Global Real Estate"
      description="AI-powered lead scoring and qualification for real estate brokers."
      canonicalPath="/ai-lead-qualification"
    />
    <AIToolStartGate
      headline="How would you like to qualify this lead?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Score from Notes", Icon: Wand2,
          desc: "Paste lead notes or a conversation — AI returns a confidence score and next actions.",
          bullets: ["Score in seconds", "Predicts objections", "Suggests next step"], cta: "Score with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Enter Lead Criteria", Icon: Sliders,
          desc: "Answer a structured checklist to derive a qualification score yourself.",
          bullets: ["Guided checklist", "Editable criteria", "Full transparency"], cta: "Fill checklist" },
      ]}
    >
      <AILeadQualificationPremium />
    </AIToolStartGate>
  </>
);

export default AILeadQualificationPage;
