import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIContractReviewerPremium } from "@/components/ai-tools/premium";
import { FileText, Sliders } from "lucide-react";

const AIContractReviewerPage = () => (
  <>
    <SEOHead
      title="AI Contract Reviewer | JBJ Global Real Estate"
      description="Review real estate contracts and highlight important clauses with AI-powered analysis."
      canonicalPath="/ai-contract-reviewer"
    />
    <AIToolStartGate
      headline="How would you like to review the contract?"
      methods={[
        { key: "upload", eyebrow: "Fastest · AI-Assisted", title: "Upload Contract PDF", Icon: FileText,
          desc: "Upload a PDF or Word contract — AI flags risky clauses, missing fields and negotiation levers.",
          bullets: ["Clause-by-clause review", "Risk highlights", "Negotiation tips"], cta: "Upload document" },
        { key: "paste", eyebrow: "Full Control · Manual", title: "Paste Contract Text", Icon: Sliders,
          desc: "Paste clauses you want reviewed and iterate on tone and structure.",
          bullets: ["Review specific sections", "Iterate freely", "No file needed"], cta: "Paste text" },
      ]}
    >
      <AIContractReviewerPremium />
    </AIToolStartGate>
  </>
);

export default AIContractReviewerPage;
