import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageSquareReply, Loader2, Copy, Check, Sparkles } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIObjectionHandlerProps {
  defaultObjection?: string;
  defaultContext?: string;
  onResponse?: (response: any) => void;
}

const AIObjectionHandler = ({ defaultObjection = "", defaultContext = "", onResponse }: AIObjectionHandlerProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [objection, setObjection] = useState(defaultObjection);
  const [context, setContext] = useState(defaultContext);
  const [propertyType, setPropertyType] = useState("luxury-apartment");
  const [leadProfile, setLeadProfile] = useState("serious-buyer");
  const [copied, setCopied] = useState(false);

  const handleSubmit = async () => {
    if (!objection.trim()) {
      toast.error("Please enter the buyer objection");
      return;
    }

    const result = await invokeTool("ai-objection-handler", {
      objection,
      context,
      propertyType,
      leadProfile,
    });

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.response) {
      navigator.clipboard.writeText(response.response);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquareReply className="h-5 w-5 text-primary" />
          AI Objection Handler
        </CardTitle>
        <CardDescription>
          Get expert responses to buyer objections with empathetic, value-focused messaging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="objection">Buyer Objection *</Label>
          <Textarea
            id="objection"
            placeholder="e.g., 'The price is too high compared to other properties in the area'"
            value={objection}
            onChange={(e) => setObjection(e.target.value)}
            rows={3}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type</Label>
            <Select value={propertyType} onValueChange={setPropertyType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="luxury-apartment">Luxury Apartment</SelectItem>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="penthouse">Penthouse</SelectItem>
                <SelectItem value="townhouse">Townhouse</SelectItem>
                <SelectItem value="off-plan">Off-Plan</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadProfile">Lead Profile</Label>
            <Select value={leadProfile} onValueChange={setLeadProfile}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="serious-buyer">Serious Buyer</SelectItem>
                <SelectItem value="first-time-buyer">First-Time Buyer</SelectItem>
                <SelectItem value="investor">Investor</SelectItem>
                <SelectItem value="relocating">Relocating</SelectItem>
                <SelectItem value="upgrade-buyer">Upgrade Buyer</SelectItem>
                <SelectItem value="hesitant">Hesitant Buyer</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="context">Additional Context (optional)</Label>
          <Textarea
            id="context"
            placeholder="Any additional context about the conversation or lead..."
            value={context}
            onChange={(e) => setContext(e.target.value)}
            rows={2}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Response...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Response
            </>
          )}
        </Button>

        {response?.response && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold">AI Response</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.response}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIObjectionHandler;
