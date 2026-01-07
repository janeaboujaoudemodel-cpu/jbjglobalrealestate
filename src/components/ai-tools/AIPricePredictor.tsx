import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TrendingUp, Loader2, Copy, Check, Sparkles, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIPricePredictorProps {
  onResponse?: (response: any) => void;
}

const AIPricePredictor = ({ onResponse }: AIPricePredictorProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    location: "",
    propertyType: "apartment",
    bedrooms: "2",
    size: "",
    developerName: "",
    completionYear: "",
    currentPrice: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.location.trim()) {
      toast.error("Please enter the location");
      return;
    }

    const result = await invokeTool("ai-price-predictor", formData);

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.prediction) {
      navigator.clipboard.writeText(response.prediction);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getTrendIcon = (trend: string) => {
    if (trend?.toLowerCase().includes("up") || trend?.toLowerCase().includes("increase")) {
      return <ArrowUp className="h-4 w-4 text-green-500" />;
    }
    if (trend?.toLowerCase().includes("down") || trend?.toLowerCase().includes("decrease")) {
      return <ArrowDown className="h-4 w-4 text-red-500" />;
    }
    return <Minus className="h-4 w-4 text-yellow-500" />;
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-primary" />
          AI Price Predictor
        </CardTitle>
        <CardDescription>
          Get AI-powered price predictions based on market data and trends
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location / Area *</Label>
            <Input
              id="location"
              placeholder="Dubai Marina, Downtown Dubai..."
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type</Label>
            <Select value={formData.propertyType} onValueChange={(v) => handleChange("propertyType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="apartment">Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="studio">Studio</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="bedrooms">Bedrooms</Label>
            <Select value={formData.bedrooms} onValueChange={(v) => handleChange("bedrooms", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="5+">5+ Bedrooms</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="size">Size (sq ft)</Label>
            <Input
              id="size"
              placeholder="1200"
              value={formData.size}
              onChange={(e) => handleChange("size", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="developerName">Developer (optional)</Label>
            <Input
              id="developerName"
              placeholder="Emaar, DAMAC..."
              value={formData.developerName}
              onChange={(e) => handleChange("developerName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="completionYear">Completion Year</Label>
            <Input
              id="completionYear"
              placeholder="2025"
              value={formData.completionYear}
              onChange={(e) => handleChange("completionYear", e.target.value)}
            />
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="currentPrice">Current Listed Price (AED)</Label>
            <Input
              id="currentPrice"
              placeholder="2,500,000"
              value={formData.currentPrice}
              onChange={(e) => handleChange("currentPrice", e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Analyzing Market...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Predict Price
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.estimatedPrice && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Estimated Fair Value</span>
                  {response.trend && getTrendIcon(response.trend)}
                </div>
                <p className="text-3xl font-bold text-primary">
                  AED {response.estimatedPrice.toLocaleString()}
                </p>
                {response.pricePerSqFt && (
                  <p className="text-sm text-muted-foreground mt-1">
                    AED {response.pricePerSqFt.toLocaleString()} per sq ft
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Analysis</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.prediction}
            </div>

            <p className="text-xs text-muted-foreground">
              * Disclaimer: This is an AI-generated estimate for informational purposes only. Not financial advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIPricePredictor;
