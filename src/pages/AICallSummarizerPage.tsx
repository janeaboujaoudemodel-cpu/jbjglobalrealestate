import { SEOHead } from "@/components/SEOHead";
import { AIToolStartGate } from "@/components/ai-tools/AIToolStartGate";
import AICallSummarizerPremium from "@/components/ai-tools/premium/AICallSummarizerPremium";
import { Mic, FileText } from "lucide-react";

const AICallSummarizerPage = () => (
  <>
    <SEOHead
      title="AI Call Summarizer | JBJ Global Real Estate"
      description="Summarize sales calls with AI and extract action items instantly."
      canonicalPath="/ai-call-summarizer"
    />
    <AIToolStartGate
      headline="How would you like to summarize your call?"
      methods={[
        { key: "record", eyebrow: "Fastest · AI-Assisted", title: "Record & Auto-Summarize", Icon: Mic,
          desc: "Record or upload audio and let AI transcribe, summarize and extract action items automatically.",
          bullets: ["One-click transcription", "Auto action items", "Client-ready summary"], cta: "Start with audio" },
        { key: "paste", eyebrow: "Full Control · Manual", title: "Paste Transcript", Icon: FileText,
          desc: "Paste an existing transcript or your own notes for AI to structure and summarize.",
          bullets: ["Full control over text", "Edit before summarizing", "Great for existing notes"], cta: "Paste transcript" },
      ]}
    >
      <AICallSummarizerPremium />
    </AIToolStartGate>
  </>
);

export default AICallSummarizerPage;
