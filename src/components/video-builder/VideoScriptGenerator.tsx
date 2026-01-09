import { useState } from "react";
import { 
  Type, Wand2, ChevronRight, Copy, RefreshCw, Sparkles,
  FileText, Target, Clock, Mic
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VideoProject } from "@/pages/VideoBuilder";

interface VideoScriptGeneratorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const VIDEO_TONES = [
  { id: "luxury", label: "Luxury & Elegant", description: "Premium, sophisticated feel" },
  { id: "energetic", label: "Energetic & Dynamic", description: "Fast-paced, exciting" },
  { id: "calm", label: "Calm & Professional", description: "Relaxed, trustworthy" },
  { id: "informative", label: "Informative", description: "Focus on facts & details" },
];

const VIDEO_DURATIONS = [
  { id: "30", label: "30 seconds", description: "Social media short" },
  { id: "60", label: "1 minute", description: "Property showcase" },
  { id: "120", label: "2 minutes", description: "Detailed tour" },
  { id: "180", label: "3 minutes", description: "Full property walkthrough" },
];

const VideoScriptGenerator = ({ project, onUpdate, onNext }: VideoScriptGeneratorProps) => {
  const [tone, setTone] = useState("luxury");
  const [targetDuration, setTargetDuration] = useState("60");
  const [isGenerating, setIsGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState("");

  const handleGenerateScript = async () => {
    if (!project.property && !customPrompt) {
      toast.error("Please select a property or enter custom details");
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke("ai-video-tour-script", {
        body: {
          propertyName: project.property?.name || "Custom Property",
          propertyType: "Luxury Apartment",
          features: project.property ? ["Premium finishes", "Stunning views", "Modern design"] : [],
          location: project.property?.location || "Dubai, UAE",
          price: project.property?.price_from,
          targetAudience: tone === "luxury" ? "Affluent investors and homebuyers" : "Property seekers",
          videoLength: parseInt(targetDuration) / 60,
          customPrompt,
        },
      });

      if (error) throw error;

      onUpdate({
        ...project,
        script: data.script,
      });

      toast.success("Script generated successfully!");
    } catch (error) {
      console.error("Script generation error:", error);
      toast.error("Failed to generate script. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(project.script);
    toast.success("Script copied to clipboard");
  };

  const estimatedWordCount = project.script.split(/\s+/).filter(Boolean).length;
  const estimatedReadTime = Math.ceil(estimatedWordCount / 150); // ~150 words per minute for narration

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Type className="h-5 w-5 text-primary" />
          AI Video Script
        </CardTitle>
        <CardDescription>
          Generate a professional narration script for your property video tour.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Tone Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Target className="h-4 w-4" />
            Video Tone
          </Label>
          <RadioGroup
            value={tone}
            onValueChange={setTone}
            className="grid grid-cols-2 gap-3"
          >
            {VIDEO_TONES.map((t) => (
              <Label
                key={t.id}
                htmlFor={t.id}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  tone === t.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={t.id} id={t.id} className="sr-only" />
                <span className="font-medium text-sm">{t.label}</span>
                <span className="text-xs text-muted-foreground">{t.description}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Duration Selection */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Target Duration
          </Label>
          <RadioGroup
            value={targetDuration}
            onValueChange={setTargetDuration}
            className="grid grid-cols-2 sm:grid-cols-4 gap-3"
          >
            {VIDEO_DURATIONS.map((d) => (
              <Label
                key={d.id}
                htmlFor={`duration-${d.id}`}
                className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                  targetDuration === d.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <RadioGroupItem value={d.id} id={`duration-${d.id}`} className="sr-only" />
                <span className="font-medium text-sm">{d.label}</span>
                <span className="text-xs text-muted-foreground">{d.description}</span>
              </Label>
            ))}
          </RadioGroup>
        </div>

        {/* Custom Prompt */}
        <div className="space-y-2">
          <Label>Additional Instructions (Optional)</Label>
          <Textarea
            placeholder="Add specific points to mention, highlight certain features, or customize the style..."
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            rows={3}
          />
        </div>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateScript}
          disabled={isGenerating}
          className="w-full"
        >
          {isGenerating ? (
            <>
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              Generating Script...
            </>
          ) : (
            <>
              <Wand2 className="h-4 w-4 mr-2" />
              Generate AI Script
            </>
          )}
        </Button>

        {/* Generated Script */}
        {project.script && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Generated Script
              </Label>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  ~{estimatedWordCount} words
                </Badge>
                <Badge variant="outline" className="text-xs">
                  ~{estimatedReadTime} min read
                </Badge>
                <Button variant="ghost" size="sm" onClick={handleCopyScript}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <Textarea
              value={project.script}
              onChange={(e) => onUpdate({ ...project, script: e.target.value })}
              rows={12}
              className="font-mono text-sm"
            />
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleGenerateScript}
                disabled={isGenerating}
              >
                <RefreshCw className="h-4 w-4 mr-1" />
                Regenerate
              </Button>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-end pt-4 border-t">
          <Button onClick={onNext} disabled={!project.script}>
            Continue to Voiceover <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoScriptGenerator;
