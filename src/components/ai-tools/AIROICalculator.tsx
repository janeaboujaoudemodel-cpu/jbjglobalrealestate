import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calculator, Loader2, Copy, Check, Sparkles, TrendingUp, DollarSign, Percent } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIROICalculatorProps {
  onResponse?: (response: any) => void;
}

const AIROICalculator = ({ onResponse }: AIROICalculatorProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    purchasePrice: "",
    downPayment: "",
    expectedRent: "",
    location: "",
    propertyType: "apartment",
    holdingPeriod: "5",
    additionalCosts: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.purchasePrice || !formData.location) {
      toast.error("Please enter purchase price and location");
      return;
    }

    const result = await invokeTool("ai-roi-calculator", formData);

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
          <Calculator className="h-5 w-5 text-primary" />
          AI ROI Calculator
        </CardTitle>
        <CardDescription>
          Calculate investment returns with AI-powered projections and market analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="purchasePrice">Purchase Price (AED) *</Label>
            <Input
              id="purchasePrice"
              placeholder="2,500,000"
              value={formData.purchasePrice}
              onChange={(e) => handleChange("purchasePrice", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="downPayment">Down Payment (AED)</Label>
            <Input
              id="downPayment"
              placeholder="500,000"
              value={formData.downPayment}
              onChange={(e) => handleChange("downPayment", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="expectedRent">Expected Annual Rent (AED)</Label>
            <Input
              id="expectedRent"
              placeholder="120,000"
              value={formData.expectedRent}
              onChange={(e) => handleChange("expectedRent", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location *</Label>
            <Input
              id="location"
              placeholder="Dubai Marina"
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
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="holdingPeriod">Holding Period (Years)</Label>
            <Select value={formData.holdingPeriod} onValueChange={(v) => handleChange("holdingPeriod", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 Year</SelectItem>
                <SelectItem value="3">3 Years</SelectItem>
                <SelectItem value="5">5 Years</SelectItem>
                <SelectItem value="10">10 Years</SelectItem>
                <SelectItem value="15">15 Years</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="additionalCosts">Additional Annual Costs (AED)</Label>
            <Input
              id="additionalCosts"
              placeholder="Service charges, maintenance, etc."
              value={formData.additionalCosts}
              onChange={(e) => handleChange("additionalCosts", e.target.value)}
            />
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Calculating ROI...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Calculate ROI
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {(response.roi || response.netYield || response.appreciation) && (
              <div className="grid grid-cols-3 gap-3">
                {response.roi && (
                  <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg text-center">
                    <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-500" />
                    <p className="text-xs text-muted-foreground">Total ROI</p>
                    <p className="text-xl font-bold text-green-500">{response.roi}%</p>
                  </div>
                )}
                {response.netYield && (
                  <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg text-center">
                    <Percent className="h-5 w-5 mx-auto mb-1 text-blue-500" />
                    <p className="text-xs text-muted-foreground">Net Yield</p>
                    <p className="text-xl font-bold text-blue-500">{response.netYield}%</p>
                  </div>
                )}
                {response.appreciation && (
                  <div className="bg-purple-500/10 border border-purple-500/20 p-4 rounded-lg text-center">
                    <DollarSign className="h-5 w-5 mx-auto mb-1 text-purple-500" />
                    <p className="text-xs text-muted-foreground">Est. Appreciation</p>
                    <p className="text-xl font-bold text-purple-500">{response.appreciation}%</p>
                  </div>
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
              {response.analysis}
            </div>

            <p className="text-xs text-muted-foreground">
              * This is an AI-generated projection. For legal or mortgage matters, we can connect you with our licensed partners.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIROICalculator;
