import { useMemo, useState } from "react";
import { Loader2, MessageCircle, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";

export interface MortgageAssistantContext {
  propertyPrice: number;
  downPaymentPercent: number;
  interestRate: number;
  loanTermYears: number;
  downPayment: number;
  loanAmount: number;
  monthlyPayment: number;
  totalInterest: number;
  totalPayment: number;
  projectName?: string;
  location?: string;
}

interface MortgageAIAssistantProps {
  context: MortgageAssistantContext;
}

type MortgageAIResponse = {
  answer: string;
  keyPoints: string[];
  nextSteps: string[];
  disclaimer: string;
};

export default function MortgageAIAssistant({ context }: MortgageAIAssistantProps) {
  const [question, setQuestion] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<MortgageAIResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const quickPrompts = useMemo(
    () => [
      "How can I reduce the monthly payment?",
      "What down payment is typical in the UAE?",
      "What documents do I usually need?",
    ],
    [],
  );

  const submit = async (overrideQuestion?: string) => {
    const q = (overrideQuestion ?? question).trim();
    if (!q) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("ai-mortgage-advisor", {
        body: { question: q, context },
      });

      if (fnError) throw fnError;
      if (!data || data.error) throw new Error(data?.error || "AI assistant failed");

      setResult(data as MortgageAIResponse);
    } catch (e) {
      setError(e instanceof Error ? e.message : "AI assistant failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="jj-card-inner p-4 lg:p-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-[#B89555]" />
            <h4 className="text-sm font-semibold text-foreground">JBJ Mortgage Assistant</h4>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Ask about the estimate, eligibility, and next steps (information only).
          </p>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        <div className="flex flex-col sm:flex-row gap-2">
          <Input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask: Is 25 years better than 20 years?"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void submit();
              }
            }}
          />
          <Button
            type="button"
            data-emerald-action="true"
            className="jj-emerald-action shrink-0 h-11 px-6"
            disabled={isLoading || !question.trim()}
            onClick={() => void submit()}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing
              </>
            ) : (
              <>
                <MessageCircle className="h-4 w-4" />
                Ask
              </>
            )}
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          {quickPrompts.map((p) => (
            <button
              key={p}
              type="button"
              data-emerald-action="true"
              data-surface="emerald"
              className="jj-emerald-action min-h-11 rounded-full border border-transparent px-3 py-2 text-xs font-semibold leading-snug text-center inline-flex items-center justify-center"
              onClick={() => {
                setQuestion(p);
                void submit(p);
              }}
              disabled={isLoading}
            >
              {p}
            </button>
          ))}
        </div>

        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            <div className="flex items-start gap-2">
              <ShieldAlert className="h-4 w-4 mt-0.5" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {result && (
          <div className="rounded-xl border border-[#B89555]/30 bg-card p-4">
            <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">{result.answer}</p>

            {result.keyPoints?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-foreground">Key points</p>
                <ul className="mt-2 space-y-1">
                  {result.keyPoints.slice(0, 6).map((k, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground leading-relaxed">
                      • {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {result.nextSteps?.length > 0 && (
              <div className="mt-3">
                <p className="text-xs font-semibold text-foreground">Next steps</p>
                <ul className="mt-2 space-y-1">
                  {result.nextSteps.slice(0, 6).map((k, idx) => (
                    <li key={idx} className="text-xs text-muted-foreground leading-relaxed">
                      • {k}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <p className="mt-4 text-[10px] text-muted-foreground">
              {result.disclaimer}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
