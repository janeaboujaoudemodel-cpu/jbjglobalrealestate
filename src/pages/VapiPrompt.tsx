import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Check, Copy, MousePointerClick } from "lucide-react";

const SYSTEM_PROMPT_TEXT = `You are John, a Senior Property Consultant at JBJ Global Real Estate in Dubai. You speak with a professional British accent and provide expert guidance on Dubai's luxury real estate market.

INTRODUCTION:
- Always start with: "Hello, thank you for calling JBJ Global Real Estate. This is John speaking, how may I assist you today?"
- Only mention you are the personal assistant to the CEO if directly asked about "the owner" or the executive team

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
- Phone: +971 54 716 7107
- Email: contact@JBJ.ae
- Website: JBJ.ae

Always be warm, professional, and helpful. Ask qualifying questions to understand the caller's needs before providing recommendations.`;

function setMetaTag(name: string, content: string) {
  let tag = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute("name", name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

function setCanonical(url: string) {
  let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.href = url;
}

export default function VapiPrompt() {
  const [copied, setCopied] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  const canonicalUrl = useMemo(() => {
    try {
      return `${window.location.origin}/vapi-prompt`;
    } catch {
      return "/vapi-prompt";
    }
  }, []);

  useEffect(() => {
    document.title = "VAPI Prompt Copy | JBJ Global Real Estate";
    setMetaTag(
      "description",
      "Copy the VAPI system prompt for John, the JBJ Global Real Estate phone assistant."
    );
    setCanonical(canonicalUrl);
  }, [canonicalUrl]);

  const selectAll = () => {
    const el = textAreaRef.current;
    if (!el) return;
    el.focus();
    el.select();
    el.setSelectionRange(0, el.value.length);
  };

  const copyToClipboard = async () => {
    const text = SYSTEM_PROMPT_TEXT;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        // iOS / older browser fallback
        selectAll();
        const ok = document.execCommand("copy");
        if (!ok) throw new Error("execCommand copy failed");
      }

      setCopied(true);
      toast.success("Copied to clipboard");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Copy failed. Tap inside the box → Select All → Copy.");
      selectAll();
    }
  };

  return (
    <main className="min-h-screen bg-background p-4 sm:p-8">
      <section className="mx-auto w-full max-w-3xl">
        <header className="mb-4 sm:mb-6">
          <h1 className="text-2xl sm:text-3xl font-semibold text-foreground">
            VAPI System Prompt (John)
          </h1>
          <p className="mt-2 text-sm sm:text-base text-muted-foreground">
            Tap <span className="font-medium text-foreground">Copy</span> then paste into VAPI →
            Assistants → System Prompt.
          </p>
        </header>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-3">
          <Button onClick={copyToClipboard} size="lg">
            {copied ? (
              <Check className="mr-2 h-5 w-5" />
            ) : (
              <Copy className="mr-2 h-5 w-5" />
            )}
            {copied ? "Copied" : "Copy"}
          </Button>
          <Button onClick={selectAll} variant="secondary" size="lg">
            <MousePointerClick className="mr-2 h-5 w-5" />
            Select All
          </Button>
        </div>

        <div className="rounded-lg border bg-muted/40 p-3 sm:p-4">
          <textarea
            ref={textAreaRef}
            readOnly
            value={SYSTEM_PROMPT_TEXT}
            className="w-full min-h-[420px] resize-none bg-transparent font-mono text-xs sm:text-sm leading-relaxed text-foreground outline-none selection:bg-primary/30"
            aria-label="VAPI system prompt text"
          />
        </div>

        <p className="mt-3 text-xs text-muted-foreground">
          If copy doesn’t work on your phone, tap inside the box →
          <span className="text-foreground"> Select All</span> → Copy.
        </p>
      </section>
    </main>
  );
}
