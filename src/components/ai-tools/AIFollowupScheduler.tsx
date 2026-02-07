import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarClock, Loader2, Copy, Check, Sparkles, Calendar, Clock } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIFollowupSchedulerProps {
  leadId?: string;
  leadName?: string;
  onResponse?: (response: any) => void;
}

const AIFollowupScheduler = ({ leadId, leadName = "", onResponse }: AIFollowupSchedulerProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    leadName,
    lastInteraction: "",
    interactionType: "call",
    leadStatus: "warm",
    notes: "",
    timezone: "GST",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.leadName.trim()) {
      toast.error("Please enter the lead name");
      return;
    }

    // Map frontend fields to backend expected format
    const leadInfo = `Lead: ${formData.leadName}. Status: ${formData.leadStatus}. Notes: ${formData.notes || 'None'}`;
    const urgency = formData.leadStatus === 'hot' ? 'high' : formData.leadStatus === 'warm' ? 'normal' : 'low';

    const result = await invokeTool("ai-followup-scheduler", {
      leadInfo,
      lastInteraction: formData.lastInteraction || 'Not specified',
      interactionType: formData.interactionType,
      urgency,
    });

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.schedule) {
      navigator.clipboard.writeText(JSON.stringify(response.schedule, null, 2));
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          AI Follow-up Scheduler
        </CardTitle>
        <CardDescription>
          Get AI-powered recommendations for optimal follow-up timing and messaging
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="leadName">Lead Name *</Label>
            <Input
              id="leadName"
              placeholder="John Smith"
              value={formData.leadName}
              onChange={(e) => handleChange("leadName", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="lastInteraction">Last Interaction Date</Label>
            <Input
              id="lastInteraction"
              type="date"
              value={formData.lastInteraction}
              onChange={(e) => handleChange("lastInteraction", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="interactionType">Last Interaction Type</Label>
            <Select value={formData.interactionType} onValueChange={(v) => handleChange("interactionType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="call">Phone Call</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="whatsapp">WhatsApp</SelectItem>
                <SelectItem value="meeting">In-Person Meeting</SelectItem>
                <SelectItem value="viewing">Property Viewing</SelectItem>
                <SelectItem value="inquiry">Website Inquiry</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="leadStatus">Lead Status</Label>
            <Select value={formData.leadStatus} onValueChange={(v) => handleChange("leadStatus", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="hot">Hot - Ready to Buy</SelectItem>
                <SelectItem value="warm">Warm - Interested</SelectItem>
                <SelectItem value="lukewarm">Lukewarm - Needs Nurturing</SelectItem>
                <SelectItem value="cold">Cold - Initial Contact</SelectItem>
                <SelectItem value="follow-up">Follow-up Required</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Context & Notes</Label>
          <Textarea
            id="notes"
            placeholder="What happened in the last interaction? Any specific interests or concerns?"
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={3}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Generating Schedule...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Get Follow-up Plan
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.nextFollowup && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold">Next Follow-up</p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {response.nextFollowup}
                    </p>
                  </div>
                </div>
                {response.channel && (
                  <p className="text-sm">
                    <strong>Recommended Channel:</strong> {response.channel}
                  </p>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Schedule & Recommendations</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.schedule || response.recommendations}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIFollowupScheduler;
