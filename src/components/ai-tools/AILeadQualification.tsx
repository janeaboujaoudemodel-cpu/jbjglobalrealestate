import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserCheck, Loader2, Copy, Check, Sparkles, Star } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

interface AILeadQualificationProps {
  defaultLeadInfo?: any;
  onResponse?: (response: any) => void;
}

const AILeadQualification = ({ defaultLeadInfo, onResponse }: AILeadQualificationProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [leadInfo, setLeadInfo] = useState({
    name: defaultLeadInfo?.name || "",
    email: defaultLeadInfo?.email || "",
    phone: defaultLeadInfo?.phone || "",
    budget: defaultLeadInfo?.budget || "",
    propertyInterest: defaultLeadInfo?.propertyInterest || "",
    timeline: defaultLeadInfo?.timeline || "",
    source: defaultLeadInfo?.source || "",
    notes: defaultLeadInfo?.notes || "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setLeadInfo((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!leadInfo.name.trim()) {
      toast.error("Please enter the lead name");
      return;
    }

    const result = await invokeTool("ai-lead-qualification", {
      leadInfo,
    });

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.analysis) {
      navigator.clipboard.writeText(response.analysis);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    if (score >= 40) return "text-orange-500";
    return "text-red-500";
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCheck className="h-5 w-5 text-primary" />
          AI Lead Qualification
        </CardTitle>
        <CardDescription>
          Automatically score and qualify leads based on their profile and behavior
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Lead Name *</Label>
            <Input
              id="name"
              placeholder="John Smith"
              value={leadInfo.name}
              onChange={(e) => handleChange("name", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              value={leadInfo.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone">Phone</Label>
            <Input
              id="phone"
              placeholder="+971 50 123 4567"
              value={leadInfo.phone}
              onChange={(e) => handleChange("phone", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="budget">Budget Range</Label>
            <Input
              id="budget"
              placeholder="AED 2-3 Million"
              value={leadInfo.budget}
              onChange={(e) => handleChange("budget", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyInterest">Property Interest</Label>
            <Input
              id="propertyInterest"
              placeholder="2BR apartment in Dubai Marina"
              value={leadInfo.propertyInterest}
              onChange={(e) => handleChange("propertyInterest", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeline">Timeline</Label>
            <Input
              id="timeline"
              placeholder="Within 3 months"
              value={leadInfo.timeline}
              onChange={(e) => handleChange("timeline", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="source">Lead Source</Label>
            <Input
              id="source"
              placeholder="Website inquiry"
              value={leadInfo.source}
              onChange={(e) => handleChange("source", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Additional Notes</Label>
          <Textarea
            id="notes"
            placeholder="Any additional information about the lead..."
            value={leadInfo.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Qualifying Lead...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Qualify Lead
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.qualificationScore && (
              <div className="bg-muted p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium">Qualification Score</span>
                  <span className={`text-2xl font-bold ${getScoreColor(response.qualificationScore)}`}>
                    {response.qualificationScore}/100
                  </span>
                </div>
                <Progress value={response.qualificationScore} className="h-2" />
                <div className="flex items-center gap-1 mt-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= Math.round(response.qualificationScore / 20)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  ))}
                  <span className="text-sm text-muted-foreground ml-2">
                    {response.qualificationScore >= 80
                      ? "Hot Lead"
                      : response.qualificationScore >= 60
                      ? "Warm Lead"
                      : response.qualificationScore >= 40
                      ? "Lukewarm"
                      : "Cold Lead"}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Analysis</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.analysis}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AILeadQualification;
