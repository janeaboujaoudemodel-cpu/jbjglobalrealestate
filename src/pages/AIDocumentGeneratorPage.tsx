import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIDocumentGeneratorPremium } from "@/components/ai-tools/premium";
import { Wand2, Sliders } from "lucide-react";

const AIDocumentGeneratorPage = () => (
  <>
    <SEOHead
      title="AI Document Generator | JBJ Global Real Estate"
      description="Generate professional real estate documents from templates with AI-powered automation."
      canonicalPath="/ai-document-generator"
    />
    <AIToolStartGate
      headline="How would you like to generate the document?"
      methods={[
        { key: "ai", eyebrow: "Fastest · AI-Assisted", title: "AI Draft from Prompt", Icon: Wand2,
          desc: "Describe what you need — AI drafts a professional, client-ready document in seconds.",
          bullets: ["One-line prompt", "Ready in seconds", "Editable output"], cta: "Draft with AI" },
        { key: "manual", eyebrow: "Full Control · Manual", title: "Start from Template", Icon: Sliders,
          desc: "Pick a template and fill fields yourself for full control over structure and tone.",
          bullets: ["Choose template", "Field-by-field entry", "Save as your own"], cta: "Use template" },
      ]}
    >
      <AIDocumentGeneratorPremium />
    </AIToolStartGate>
  </>
);

export default AIDocumentGeneratorPage;
