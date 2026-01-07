import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Users, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AICompetitorAnalysisProps {
  onResponse?: (response: any) => void;
}

const AICompetitorAnalysis = ({ onResponse }: AICompetitorAnalysisProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    projectName: "",
    projectDetails: "",
    competitorProjects: "",
    location: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.projectName.trim()) {
      toast.error("Please enter your project name");
      return;
    }

    const result = await invokeTool("ai-competitor-analysis", formData);

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

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          AI Competitor Analysis
        </CardTitle>
        <CardDescription>
          Analyze competitor properties, pricing strategies, and market positioning
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="projectName">Your Project Name *</Label>
            <Input
              id="projectName"
              placeholder="Marina Heights Tower"
              value={formData.projectName}
              onChange={(e) => handleChange("projectName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Dubai Marina"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="projectDetails">Your Project Details</Label>
          <Textarea
            id="projectDetails"
            placeholder="Describe your project: unit types, price range, amenities, unique selling points..."
            value={formData.projectDetails}
            onChange={(e) => handleChange("projectDetails", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="competitorProjects">Competitor Projects (optional)</Label>
          <Textarea
            id="competitorProjects"
            placeholder="List competitor projects to analyze (one per line)..."
            value={formData.competitorProjects}
            onChange={(e) => handleChange("competitorProjects", e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Competitors...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Analyze Competition
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Competition Analysis</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {response.analysis}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AICompetitorAnalysis;
