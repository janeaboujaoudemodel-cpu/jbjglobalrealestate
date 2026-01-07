import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Video, Loader2, Copy, Check, Sparkles, Clock } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIVideoTourScriptProps {
  onResponse?: (response: any) => void;
}

const AIVideoTourScript = ({ onResponse }: AIVideoTourScriptProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyDetails: "",
    location: "",
    targetAudience: "luxury-buyer",
    tone: "professional",
    duration: "2-3",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.propertyName.trim()) {
      toast.error("Please enter the property name");
      return;
    }

    const result = await invokeTool("ai-video-tour-script", formData);

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.script) {
      navigator.clipboard.writeText(response.script);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          AI Video Tour Script
        </CardTitle>
        <CardDescription>
          Generate engaging property tour scripts for video content and social media
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="propertyName">Property Name *</Label>
            <Input
              id="propertyName"
              placeholder="Sunset Bay Grand Residences"
              value={formData.propertyName}
              onChange={(e) => handleChange("propertyName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location</Label>
            <Input
              id="location"
              placeholder="Palm Jumeirah, Dubai"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="targetAudience">Target Audience</Label>
            <Select value={formData.targetAudience} onValueChange={(v) => handleChange("targetAudience", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="luxury-buyer">Luxury Buyer</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="first-time-buyer">First-Time Buyer</SelectItem>
                <SelectItem value="family">Family-Focused</SelectItem>
                <SelectItem value="expat">Expat / Relocating</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tone">Tone & Style</Label>
            <Select value={formData.tone} onValueChange={(v) => handleChange("tone", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="professional">Professional & Polished</SelectItem>
                <SelectItem value="casual">Casual & Friendly</SelectItem>
                <SelectItem value="luxury">Ultra-Luxury</SelectItem>
                <SelectItem value="energetic">Energetic & Exciting</SelectItem>
                <SelectItem value="storytelling">Storytelling</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="duration">Video Duration (minutes)</Label>
            <Select value={formData.duration} onValueChange={(v) => handleChange("duration", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 minute (Social Media)</SelectItem>
                <SelectItem value="2-3">2-3 minutes (Standard)</SelectItem>
                <SelectItem value="5">5 minutes (Detailed)</SelectItem>
                <SelectItem value="10">10 minutes (Full Tour)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="propertyDetails">Property Details *</Label>
          <Textarea
            id="propertyDetails"
            placeholder="Describe the property: bedrooms, features, views, amenities, unique selling points..."
            value={formData.propertyDetails}
            onChange={(e) => handleChange("propertyDetails", e.target.value)}
            rows={4}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Script...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Video Script
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.estimatedDuration && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                Estimated duration: {response.estimatedDuration}
              </div>
            )}

            {response.hook && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Opening Hook</h4>
                <p className="text-sm italic">"{response.hook}"</p>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Script</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap max-h-[500px] overflow-y-auto">
              {response.script}
            </div>

            {response.callToAction && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <h4 className="font-semibold mb-2">Call to Action</h4>
                <p className="text-sm">"{response.callToAction}"</p>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIVideoTourScript;
