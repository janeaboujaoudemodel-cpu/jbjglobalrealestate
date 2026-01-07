import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileBarChart, Loader2, Copy, Check, Sparkles, Download } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIMarketReportProps {
  onResponse?: (response: any) => void;
}

const AIMarketReport = ({ onResponse }: AIMarketReportProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    location: "",
    propertyType: "all",
    timeframe: "quarterly",
    focus: "general",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.location.trim()) {
      toast.error("Please enter a location");
      return;
    }

    const result = await invokeTool("ai-market-report", formData);

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.report) {
      navigator.clipboard.writeText(response.report);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileBarChart className="h-5 w-5 text-primary" />
          AI Market Report
        </CardTitle>
        <CardDescription>
          Generate comprehensive market analysis reports with trends, forecasts, and investment insights
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="location">Location / Area *</Label>
            <Input
              id="location"
              placeholder="Dubai, Abu Dhabi, Palm Jumeirah..."
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
                <SelectItem value="all">All Properties</SelectItem>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="off-plan">Off-Plan</SelectItem>
                <SelectItem value="luxury">Luxury Segment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timeframe">Timeframe</Label>
            <Select value={formData.timeframe} onValueChange={(v) => handleChange("timeframe", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="quarterly">Quarterly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
                <SelectItem value="5-year">5-Year Outlook</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="focus">Report Focus</Label>
            <Select value={formData.focus} onValueChange={(v) => handleChange("focus", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General Overview</SelectItem>
                <SelectItem value="investment">Investment Analysis</SelectItem>
                <SelectItem value="rental">Rental Market</SelectItem>
                <SelectItem value="development">New Developments</SelectItem>
                <SelectItem value="price-trends">Price Trends</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Report...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Market Report
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.summary && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Executive Summary</h4>
                <p className="text-sm">{response.summary}</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Report</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {response.report}
            </div>

            <p className="text-xs text-muted-foreground">
              * Disclaimer: This report is AI-generated for informational purposes only. Not investment advice.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIMarketReport;
