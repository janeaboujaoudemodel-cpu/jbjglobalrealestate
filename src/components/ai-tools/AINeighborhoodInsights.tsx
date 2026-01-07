import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { MapPin, Loader2, Copy, Check, Sparkles, School, Hospital, ShoppingBag, Train } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AINeighborhoodInsightsProps {
  onResponse?: (response: any) => void;
}

const AINeighborhoodInsights = ({ onResponse }: AINeighborhoodInsightsProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [location, setLocation] = useState("");
  const [interests, setInterests] = useState("");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    const result = await invokeTool("ai-neighborhood-insights", {
      location,
      interests,
    });

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.insights) {
      navigator.clipboard.writeText(response.insights);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const amenityIcons = {
    schools: School,
    healthcare: Hospital,
    shopping: ShoppingBag,
    transport: Train,
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          AI Neighborhood Insights
        </CardTitle>
        <CardDescription>
          Get comprehensive analysis of neighborhoods including amenities, lifestyle, and investment potential
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location / Neighborhood *</Label>
          <Input
            id="location"
            placeholder="Dubai Marina, JBR, Downtown Dubai..."
            value={location}
            onChange={(e) => setLocation(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="interests">Specific Interests (optional)</Label>
          <Textarea
            id="interests"
            placeholder="Schools, healthcare facilities, nightlife, beach access, family-friendly..."
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Neighborhood...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get Insights
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.highlights && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Object.entries(response.highlights).map(([key, value]: [string, any]) => {
                  const Icon = amenityIcons[key as keyof typeof amenityIcons] || MapPin;
                  return (
                    <div key={key} className="bg-muted p-3 rounded-lg text-center">
                      <Icon className="h-5 w-5 mx-auto mb-1 text-primary" />
                      <p className="text-xs text-muted-foreground capitalize">{key}</p>
                      <p className="font-semibold text-sm">{value}</p>
                    </div>
                  );
                })}
              </div>
            )}

            {response.score && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <span className="font-medium">Neighborhood Score</span>
                  <span className="text-2xl font-bold text-primary">{response.score}/10</span>
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
              {response.insights}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AINeighborhoodInsights;
