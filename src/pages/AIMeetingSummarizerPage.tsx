import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import { AIMeetingSummarizerPremium } from "@/components/ai-tools/premium";
import { Mic, FileText } from "lucide-react";

const AIMeetingSummarizerPage = () => (
  <>
    <SEOHead
      title="AI Meeting Summarizer | JBJ Global Real Estate"
      description="Automatically summarize meetings and extract action items with AI-powered analysis."
      canonicalPath="/ai-meeting-summarizer"
    />
    <AIToolStartGate
      headline="How would you like to summarize the meeting?"
      methods={[
        { key: "record", eyebrow: "Fastest · AI-Assisted", title: "Record or Upload Audio", Icon: Mic,
          desc: "Record live or upload a meeting file — AI transcribes and extracts key decisions and actions.",
          bullets: ["Auto transcription", "Decision log", "Assigned actions"], cta: "Start with audio" },
        { key: "paste", eyebrow: "Full Control · Manual", title: "Paste Meeting Notes", Icon: FileText,
          desc: "Paste your own transcript or bullet notes and let AI structure them into a summary.",
          bullets: ["Works with any notes", "Editable output", "Fast"], cta: "Paste notes" },
      ]}
    >
      <AIMeetingSummarizerPremium />
    </AIToolStartGate>
  </>
);

export default AIMeetingSummarizerPage;
