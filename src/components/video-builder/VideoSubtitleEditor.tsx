import { useState } from "react";
import { 
  Subtitles, ChevronRight, Wand2, Plus, Trash2, Languages,
  RefreshCw, Check, Type
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VideoProject, SubtitleItem } from "@/pages/VideoBuilder";

interface VideoSubtitleEditorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const SUBTITLE_LANGUAGES = [
  { id: "en", label: "English", flag: "🇬🇧" },
  { id: "ar", label: "Arabic", flag: "🇦🇪" },
  { id: "hi", label: "Hindi", flag: "🇮🇳" },
  { id: "ru", label: "Russian", flag: "🇷🇺" },
  { id: "zh", label: "Chinese", flag: "🇨🇳" },
  { id: "fr", label: "French", flag: "🇫🇷" },
  { id: "de", label: "German", flag: "🇩🇪" },
  { id: "es", label: "Spanish", flag: "🇪🇸" },
];

const SUBTITLE_STYLES = [
  { id: "bottom", label: "Bottom Bar", description: "Classic subtitle position" },
  { id: "overlay", label: "Text Overlay", description: "Prominent on-screen text" },
  { id: "transparent", label: "Transparent", description: "Subtle background" },
];

const VideoSubtitleEditor = ({ project, onUpdate, onNext }: VideoSubtitleEditorProps) => {
  const [enableSubtitles, setEnableSubtitles] = useState(
    project.subtitles && project.subtitles.length > 0
  );
  const [subtitleLanguage, setSubtitleLanguage] = useState("en");
  const [translateTo, setTranslateTo] = useState<string[]>([]);
  const [subtitleStyle, setSubtitleStyle] = useState("bottom");
  const [isGenerating, setIsGenerating] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleGenerateSubtitles = async () => {
    if (!project.script && !project.voiceover) {
      toast.error("Please add a script or voiceover first");
      return;
    }

    setIsGenerating(true);
    try {
      // Generate subtitles from script
      const words = project.script.split(/\s+/);
      const wordsPerSecond = 2.5;
      const subtitles: SubtitleItem[] = [];
      
      let currentTime = 0;
      let currentText = "";
      let wordCount = 0;
      const maxWordsPerSubtitle = 8;

      words.forEach((word, index) => {
        currentText += (currentText ? " " : "") + word;
        wordCount++;

        if (wordCount >= maxWordsPerSubtitle || index === words.length - 1) {
          const duration = wordCount / wordsPerSecond;
          subtitles.push({
            id: crypto.randomUUID(),
            text: currentText,
            startTime: currentTime,
            endTime: currentTime + duration,
            language: subtitleLanguage,
          });
          currentTime += duration;
          currentText = "";
          wordCount = 0;
        }
      });

      onUpdate({
        ...project,
        subtitles,
      });

      toast.success("Subtitles generated successfully!");
    } catch (error) {
      console.error("Subtitle generation error:", error);
      toast.error("Failed to generate subtitles");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTranslateSubtitles = async () => {
    if (!project.subtitles || project.subtitles.length === 0) {
      toast.error("Please generate subtitles first");
      return;
    }

    if (translateTo.length === 0) {
      toast.error("Please select languages to translate to");
      return;
    }

    setIsGenerating(true);
    try {
      // Call translation API
      const { data, error } = await supabase.functions.invoke("ai-translation-hub", {
        body: {
          text: project.subtitles.map(s => s.text).join("\n---\n"),
          targetLanguages: translateTo,
          sourceLanguage: subtitleLanguage,
        },
      });

      if (error) throw error;

      toast.success(`Subtitles translated to ${translateTo.length} language(s)!`);
    } catch (error) {
      console.error("Translation error:", error);
      toast.error("Failed to translate subtitles");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAddSubtitle = () => {
    const lastSubtitle = project.subtitles?.[project.subtitles.length - 1];
    const startTime = lastSubtitle ? lastSubtitle.endTime : 0;

    const newSubtitle: SubtitleItem = {
      id: crypto.randomUUID(),
      text: "",
      startTime,
      endTime: startTime + 3,
      language: subtitleLanguage,
    };

    onUpdate({
      ...project,
      subtitles: [...(project.subtitles || []), newSubtitle],
    });
    setEditingIndex((project.subtitles?.length || 0));
  };

  const handleUpdateSubtitle = (index: number, updates: Partial<SubtitleItem>) => {
    if (!project.subtitles) return;

    const updatedSubtitles = project.subtitles.map((sub, i) =>
      i === index ? { ...sub, ...updates } : sub
    );

    onUpdate({
      ...project,
      subtitles: updatedSubtitles,
    });
  };

  const handleDeleteSubtitle = (index: number) => {
    if (!project.subtitles) return;

    const updatedSubtitles = project.subtitles.filter((_, i) => i !== index);
    onUpdate({
      ...project,
      subtitles: updatedSubtitles,
    });
    toast.success("Subtitle removed");
  };

  const handleToggleLanguage = (langId: string) => {
    setTranslateTo(prev =>
      prev.includes(langId)
        ? prev.filter(l => l !== langId)
        : [...prev, langId]
    );
  };

  const handleSkip = () => {
    onNext();
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Subtitles className="h-5 w-5 text-primary" />
          Subtitles & Captions
        </CardTitle>
        <CardDescription>
          Add subtitles to make your video accessible and engaging. Auto-generate or create manually.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <Label>Enable Subtitles</Label>
            <p className="text-sm text-muted-foreground">
              Add text captions to your video
            </p>
          </div>
          <Switch
            checked={enableSubtitles}
            onCheckedChange={setEnableSubtitles}
          />
        </div>

        {enableSubtitles && (
          <>
            {/* Language Selection */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Languages className="h-4 w-4" />
                Primary Language
              </Label>
              <Select value={subtitleLanguage} onValueChange={setSubtitleLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {SUBTITLE_LANGUAGES.map((lang) => (
                    <SelectItem key={lang.id} value={lang.id}>
                      <span className="flex items-center gap-2">
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Subtitle Style */}
            <div className="space-y-3">
              <Label className="flex items-center gap-2">
                <Type className="h-4 w-4" />
                Display Style
              </Label>
              <RadioGroup
                value={subtitleStyle}
                onValueChange={setSubtitleStyle}
                className="grid grid-cols-3 gap-3"
              >
                {SUBTITLE_STYLES.map((style) => (
                  <Label
                    key={style.id}
                    htmlFor={`style-${style.id}`}
                    className={`flex flex-col p-3 rounded-lg border cursor-pointer transition-all ${
                      subtitleStyle === style.id
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <RadioGroupItem value={style.id} id={`style-${style.id}`} className="sr-only" />
                    <span className="font-medium text-sm">{style.label}</span>
                    <span className="text-xs text-muted-foreground">{style.description}</span>
                  </Label>
                ))}
              </RadioGroup>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerateSubtitles}
              disabled={isGenerating || (!project.script && !project.voiceover)}
              className="w-full"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4 mr-2" />
                  Auto-Generate Subtitles
                </>
              )}
            </Button>

            {/* Subtitle List */}
            {project.subtitles && project.subtitles.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label>Subtitle Timeline</Label>
                  <Badge variant="outline">
                    {project.subtitles.length} segments
                  </Badge>
                </div>
                
                <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                  {project.subtitles.map((subtitle, index) => (
                    <div
                      key={subtitle.id}
                      className="flex gap-2 p-3 rounded-lg border bg-muted/30"
                    >
                      <div className="flex flex-col gap-1 w-20">
                        <Input
                          type="number"
                          step="0.1"
                          value={subtitle.startTime.toFixed(1)}
                          onChange={(e) => handleUpdateSubtitle(index, { startTime: parseFloat(e.target.value) })}
                          className="h-7 text-xs"
                          placeholder="Start"
                        />
                        <Input
                          type="number"
                          step="0.1"
                          value={subtitle.endTime.toFixed(1)}
                          onChange={(e) => handleUpdateSubtitle(index, { endTime: parseFloat(e.target.value) })}
                          className="h-7 text-xs"
                          placeholder="End"
                        />
                      </div>
                      <Textarea
                        value={subtitle.text}
                        onChange={(e) => handleUpdateSubtitle(index, { text: e.target.value })}
                        className="flex-1 min-h-[60px] text-sm"
                        placeholder="Subtitle text..."
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteSubtitle(index)}
                        className="h-8 w-8 text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>

                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddSubtitle}
                  className="w-full"
                >
                  <Plus className="h-4 w-4 mr-1" />
                  Add Subtitle
                </Button>
              </div>
            )}

            {/* Translation */}
            {project.subtitles && project.subtitles.length > 0 && (
              <div className="space-y-3 pt-4 border-t">
                <Label>Translate to Additional Languages</Label>
                <div className="flex flex-wrap gap-2">
                  {SUBTITLE_LANGUAGES.filter(l => l.id !== subtitleLanguage).map((lang) => (
                    <Button
                      key={lang.id}
                      variant={translateTo.includes(lang.id) ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleToggleLanguage(lang.id)}
                    >
                      {lang.flag} {lang.label}
                    </Button>
                  ))}
                </div>
                {translateTo.length > 0 && (
                  <Button
                    onClick={handleTranslateSubtitles}
                    disabled={isGenerating}
                    variant="outline"
                    className="w-full"
                  >
                    <Languages className="h-4 w-4 mr-2" />
                    Translate to {translateTo.length} Language(s)
                  </Button>
                )}
              </div>
            )}
          </>
        )}

        {/* Continue Button */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={onNext}>
            Continue to Branding <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoSubtitleEditor;
