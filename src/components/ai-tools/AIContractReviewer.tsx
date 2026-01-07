import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileSearch, Loader2, Copy, Check, Sparkles, AlertTriangle, CheckCircle, Info } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIContractReviewerProps {
  onResponse?: (response: any) => void;
}

const AIContractReviewer = ({ onResponse }: AIContractReviewerProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [contractText, setContractText] = useState("");
  const [contractType, setContractType] = useState("sale");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!contractText.trim()) {
      toast.error("Please paste the contract text");
      return;
    }

    const result = await invokeTool("ai-contract-reviewer", {
      contractText,
      contractType,
    });

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.review) {
      navigator.clipboard.writeText(response.review);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileSearch className="h-5 w-5 text-primary" />
          AI Contract Reviewer
        </CardTitle>
        <CardDescription>
          Review real estate contracts for key terms, risks, and areas of concern
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg">
          <p className="text-sm text-amber-200 flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>
              <strong>Disclaimer:</strong> This AI review is for informational purposes only and does not constitute legal advice. 
              Always consult a qualified legal professional before signing any contract.
            </span>
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractType">Contract Type</Label>
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="sale">Sale & Purchase Agreement (SPA)</SelectItem>
              <SelectItem value="mou">Memorandum of Understanding (MOU)</SelectItem>
              <SelectItem value="tenancy">Tenancy Contract</SelectItem>
              <SelectItem value="agency">Agency Agreement</SelectItem>
              <SelectItem value="reservation">Reservation Agreement</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractText">Contract Text *</Label>
          <Textarea
            id="contractText"
            placeholder="Paste your contract text here for review..."
            value={contractText}
            onChange={(e) => setContractText(e.target.value)}
            rows={10}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Reviewing Contract...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Review Contract
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.riskLevel && (
              <div className={`p-4 rounded-lg border ${
                response.riskLevel === "high" 
                  ? "bg-red-500/10 border-red-500/20" 
                  : response.riskLevel === "medium" 
                  ? "bg-amber-500/10 border-amber-500/20"
                  : "bg-green-500/10 border-green-500/20"
              }`}>
                <div className="flex items-center gap-2">
                  {response.riskLevel === "high" ? (
                    <AlertTriangle className="h-5 w-5 text-red-500" />
                  ) : response.riskLevel === "medium" ? (
                    <Info className="h-5 w-5 text-amber-500" />
                  ) : (
                    <CheckCircle className="h-5 w-5 text-green-500" />
                  )}
                  <span className="font-semibold capitalize">
                    {response.riskLevel} Risk Level
                  </span>
                </div>
              </div>
            )}

            {response.keyTerms && response.keyTerms.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Key Terms Identified</h4>
                <ul className="space-y-2">
                  {response.keyTerms.map((term: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="h-4 w-4 mt-0.5 text-green-500 flex-shrink-0" />
                      <span><strong>{term.term}:</strong> {term.value}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response.concerns && response.concerns.length > 0 && (
              <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-3 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  Areas of Concern
                </h4>
                <ul className="space-y-2">
                  {response.concerns.map((concern: string, idx: number) => (
                    <li key={idx} className="text-sm flex items-start gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 flex items-center justify-center flex-shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      {concern}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Review</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {response.review}
            </div>

            <p className="text-xs text-muted-foreground">
              * This is an AI-generated review for informational purposes only. Consult a legal professional for advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIContractReviewer;
