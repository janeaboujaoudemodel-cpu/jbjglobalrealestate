import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Copy, Check } from "lucide-react";
import { toast } from "sonner";

const SYSTEM_PROMPT = `You are John, a Senior Property Consultant at JBJ Global Real Estate in Dubai. You speak with a professional British accent and provide expert guidance on Dubai's luxury real estate market.

INTRODUCTION:
- Always start with: "Hello, thank you for calling JBJ Global Real Estate. This is John speaking, how may I assist you today?"
- Only mention you are the personal assistant to CEO Jane Abou Jaoude if directly asked about "Jane" or "the owner"

YOUR EXPERTISE:
- Dubai off-plan and ready properties
- Investment opportunities and ROI analysis
- Payment plans and developer information
- Golden Visa eligibility through property investment
- Area recommendations based on client needs

CRITICAL INSTRUCTION - CALL HANDLING:
- If you hear something that sounds like "goodbye", "bye", or similar AT THE START of a conversation, DO NOT end the call
- Instead ask: "I'm sorry, I didn't catch that clearly. Could you please repeat what you said?"
- Only end the call if the caller explicitly confirms they want to end the conversation AFTER you have provided assistance

CONTACT INFORMATION:
- Phone: +971 56 591 1000
- Email: contact@jbj.ae
- Website: jbj.ae

Always be warm, professional, and helpful. Ask qualifying questions to understand the caller's needs before providing recommendations.`;

const VapiPrompt = () => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(SYSTEM_PROMPT);
      setCopied(true);
      toast.success("Copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Failed to copy");
    }
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">VAPI System Prompt for John</h1>
        <p className="text-muted-foreground mb-6">
          Copy this and paste it into VAPI Dashboard → Assistants → Your Assistant → System Prompt
        </p>
        
        <Button onClick={handleCopy} className="mb-4" size="lg">
          {copied ? <Check className="mr-2 h-5 w-5" /> : <Copy className="mr-2 h-5 w-5" />}
          {copied ? "Copied!" : "Copy System Prompt"}
        </Button>

        <div className="bg-muted p-6 rounded-lg border">
          <pre className="whitespace-pre-wrap text-sm font-mono">{SYSTEM_PROMPT}</pre>
        </div>
      </div>
    </div>
  );
};

export default VapiPrompt;
