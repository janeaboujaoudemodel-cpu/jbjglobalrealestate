import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileAudio, Loader2, Copy, Check, Sparkles, ListChecks, Users } from "lucide-react";
import { useAITool } from "./AIToolsProvider";
import { toast } from "sonner";

interface AIMeetingSummarizerProps {
  onResponse?: (response: any) => void;
}

const AIMeetingSummarizer = ({ onResponse }: AIMeetingSummarizerProps) => {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    meetingTitle: "",
    participants: "",
    notes: "",
    duration: "",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.notes.trim()) {
      toast.error("Please enter meeting notes");
      return;
    }

    const result = await invokeTool("ai-meeting-summarizer", formData);

    if (result.success && onResponse) {
      onResponse(result.data);
    }
  };

  const copyToClipboard = () => {
    if (response?.summary) {
      navigator.clipboard.writeText(response.summary);
      setCopied(true);
      toast.success("Copied to clipboard");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileAudio className="h-5 w-5 text-primary" />
          AI Meeting Summarizer
        </CardTitle>
        <CardDescription>
          Summarize meetings and extract key decisions, action items, and follow-ups
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="meetingTitle">Meeting Title</Label>
            <Input
              id="meetingTitle"
              placeholder="Client Discovery Call - Palm Jumeirah"
              value={formData.meetingTitle}
              onChange={(e) => handleChange("meetingTitle", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">Duration</Label>
            <Input
              id="duration"
              placeholder="45 minutes"
              value={formData.duration}
              onChange={(e) => handleChange("duration", e.target.value)}
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="participants">Participants</Label>
          <Input
            id="participants"
            placeholder="John Smith (Client), Sarah Ahmed (Agent)"
            value={formData.participants}
            onChange={(e) => handleChange("participants", e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes">Meeting Notes / Transcript *</Label>
          <Textarea
            id="notes"
            placeholder="Paste your meeting notes, transcript, or key discussion points here..."
            value={formData.notes}
            onChange={(e) => handleChange("notes", e.target.value)}
            rows={8}
          />
        </div>

        <Button onClick={handleSubmit} disabled={loading} className="w-full">
          {loading ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Summarizing Meeting...
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 mr-2" />
              Generate Summary
            </>
          )}
        </Button>

        {response && (
          <div className="mt-6 space-y-4">
            {response.actionItems && response.actionItems.length > 0 && (
              <div className="bg-primary/10 border border-primary/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <ListChecks className="h-5 w-5 text-primary" />
                  <h4 className="font-semibold">Action Items</h4>
                </div>
                <ul className="space-y-2">
                  {response.actionItems.map((item: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-sm">
                      <span className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-xs">
                        {idx + 1}
                      </span>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {response.keyDecisions && response.keyDecisions.length > 0 && (
              <div className="bg-green-500/10 border border-green-500/20 p-4 rounded-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Users className="h-5 w-5 text-green-500" />
                  <h4 className="font-semibold">Key Decisions</h4>
                </div>
                <ul className="list-disc pl-5 space-y-1 text-sm">
                  {response.keyDecisions.map((decision: string, idx: number) => (
                    <li key={idx}>{decision}</li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold">Full Summary</h4>
              <Button variant="outline" size="sm" onClick={copyToClipboard}>
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="bg-muted p-4 rounded-lg prose prose-sm max-w-none dark:prose-invert whitespace-pre-wrap">
              {response.summary}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default AIMeetingSummarizer;
