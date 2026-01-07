import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Palette, Loader2, Copy, Check, Sparkles, Image } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIVirtualStagingProps {
  onResponse?: (response: any) => void;
}

const AIVirtualStaging = ({ onResponse }: AIVirtualStagingProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    roomType: "living-room",
    currentState: "",
    style: "modern-luxury",
    budget: "high-end",
    specialRequests: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    const result = await invokeTool("ai-virtual-staging", formData);

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.suggestions) {
      navigator.clipboard.writeText(response.suggestions);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5 text-primary" />
          AI Virtual Staging
        </CardTitle>
        <CardDescription>
          Get AI-powered staging suggestions and furniture recommendations for empty rooms
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roomType">Room Type</Label>
            <Select value={formData.roomType} onValueChange={(v) => handleChange("roomType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="living-room">Living Room</SelectItem>
                <SelectItem value="bedroom">Bedroom</SelectItem>
                <SelectItem value="kitchen">Kitchen</SelectItem>
                <SelectItem value="dining-room">Dining Room</SelectItem>
                <SelectItem value="office">Home Office</SelectItem>
                <SelectItem value="bathroom">Bathroom</SelectItem>
                <SelectItem value="balcony">Balcony / Terrace</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="style">Design Style</Label>
            <Select value={formData.style} onValueChange={(v) => handleChange("style", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="modern-luxury">Modern Luxury</SelectItem>
                <SelectItem value="minimalist">Minimalist</SelectItem>
                <SelectItem value="contemporary">Contemporary</SelectItem>
                <SelectItem value="traditional">Traditional</SelectItem>
                <SelectItem value="mid-century">Mid-Century Modern</SelectItem>
                <SelectItem value="scandinavian">Scandinavian</SelectItem>
                <SelectItem value="industrial">Industrial</SelectItem>
                <SelectItem value="bohemian">Bohemian</SelectItem>
                <SelectItem value="art-deco">Art Deco</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="budget">Budget Level</Label>
            <Select value={formData.budget} onValueChange={(v) => handleChange("budget", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="high-end">High-End / Luxury</SelectItem>
                <SelectItem value="mid-range">Mid-Range</SelectItem>
                <SelectItem value="budget">Budget-Friendly</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="currentState">Current Room Description</Label>
          <Textarea
            id="currentState"
            placeholder="Describe the current state of the room: dimensions, windows, flooring, any existing features..."
            value={formData.currentState}
            onChange={(e) => handleChange("currentState", e.target.value)}
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="specialRequests">Special Requests (optional)</Label>
          <Textarea
            id="specialRequests"
            placeholder="Any specific requirements: colors to include/avoid, must-have furniture, target buyer profile..."
            value={formData.specialRequests}
            onChange={(e) => handleChange("specialRequests", e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Staging Plan...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Staging Suggestions
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.conceptBoard && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Image className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Concept Board</h4>
                </div>
                <p className="text-sm">{response.conceptBoard}</p>
              </div>
            )}

            {response.furnitureList && response.furnitureList.length > 0 && (
              <div className="bg-muted p-4 rounded-lg">
                <h4 className="font-semibold mb-3">Recommended Furniture</h4>
                <ul className="space-y-2">
                  {response.furnitureList.map((item: any, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      <span>
                        <strong>{item.name}:</strong> {item.description}
                        {item.estimatedCost && <span className="text-muted-foreground ml-2">({item.estimatedCost})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Staging Plan</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.suggestions}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIVirtualStaging;
