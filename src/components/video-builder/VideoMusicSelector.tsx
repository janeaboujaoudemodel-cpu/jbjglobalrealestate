import { useState, useRef } from "react";
import { 
  Music, Play, Pause, ChevronRight, Upload, Volume2, 
  Check, Wand2, Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { VideoProject } from "@/pages/VideoBuilder";

interface VideoMusicSelectorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
  onNext: () => void;
}

const MUSIC_PRESETS = [
  { 
    id: "luxury-ambient", 
    name: "Luxury Ambient", 
    mood: "luxury",
    description: "Elegant, sophisticated background",
    color: "from-amber-500 to-orange-600"
  },
  { 
    id: "upbeat-modern", 
    name: "Upbeat Modern", 
    mood: "energetic",
    description: "Dynamic, exciting energy",
    color: "from-blue-500 to-purple-600"
  },
  { 
    id: "calm-piano", 
    name: "Calm Piano", 
    mood: "calm",
    description: "Peaceful, relaxing feel",
    color: "from-green-500 to-teal-600"
  },
  { 
    id: "corporate-inspire", 
    name: "Corporate Inspire", 
    mood: "professional",
    description: "Professional, trustworthy",
    color: "from-slate-500 to-gray-600"
  },
  { 
    id: "cinematic-epic", 
    name: "Cinematic Epic", 
    mood: "cinematic",
    description: "Grand, impressive soundscape",
    color: "from-red-500 to-pink-600"
  },
  { 
    id: "arabic-fusion", 
    name: "Arabic Fusion", 
    mood: "cultural",
    description: "Middle Eastern influences",
    color: "from-yellow-500 to-amber-600"
  },
];

const VideoMusicSelector = ({ project, onUpdate, onNext }: VideoMusicSelectorProps) => {
  const [selectedPreset, setSelectedPreset] = useState<string | null>(
    project.music?.name ? MUSIC_PRESETS.find(p => p.name === project.music?.name)?.id || null : null
  );
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingPreset, setPlayingPreset] = useState<string | null>(null);
  const [volume, setVolume] = useState([60]);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSelectPreset = async (presetId: string) => {
    const preset = MUSIC_PRESETS.find(p => p.id === presetId);
    if (!preset) return;

    setSelectedPreset(presetId);
    setIsGenerating(true);

    try {
      // Music preset selection (no external API call)
      onUpdate({
        ...project,
        music: {
          url: "",
          name: preset.name,
          mood: preset.mood,
        },
      });
      toast.success(`${preset.name} style selected!`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewPreset = (presetId: string) => {
    if (playingPreset === presetId && isPlaying) {
      setIsPlaying(false);
      setPlayingPreset(null);
    } else {
      setPlayingPreset(presetId);
      setIsPlaying(true);
      // In production, this would play a preview audio
      setTimeout(() => {
        setIsPlaying(false);
        setPlayingPreset(null);
      }, 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("audio/")) {
      toast.error("Please upload an audio file");
      return;
    }

    const audioUrl = URL.createObjectURL(file);
    onUpdate({
      ...project,
      music: {
        url: audioUrl,
        name: file.name,
        mood: "custom",
      },
    });
    setSelectedPreset(null);
    toast.success("Music file uploaded!");
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value);
    if (audioRef.current) {
      audioRef.current.volume = value[0] / 100;
    }
  };

  const handleSkip = () => {
    onNext();
  };

  const handleRemoveMusic = () => {
    onUpdate({
      ...project,
      music: undefined,
    });
    setSelectedPreset(null);
    toast.success("Music removed");
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Music className="h-5 w-5 text-primary" />
          Background Music
        </CardTitle>
        <CardDescription>
          Add background music that matches the mood of your property video.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* AI Music Presets */}
        <div className="space-y-3">
          <Label className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            AI Music Presets
          </Label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {MUSIC_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handleSelectPreset(preset.id)}
                disabled={isGenerating}
                className={`relative p-4 rounded-lg border text-left transition-all overflow-hidden ${
                  selectedPreset === preset.id
                    ? "border-primary ring-2 ring-primary/20"
                    : "border-border hover:border-primary/50"
                }`}
              >
                {/* Gradient Background */}
                <div className={`absolute inset-0 bg-gradient-to-br ${preset.color} opacity-10`} />
                
                <div className="relative">
                  <div className="flex items-center justify-between mb-2">
                    <Music className="h-4 w-4 text-primary" />
                    {selectedPreset === preset.id && (
                      <Check className="h-4 w-4 text-primary" />
                    )}
                  </div>
                  <h4 className="font-medium text-sm">{preset.name}</h4>
                  <p className="text-xs text-muted-foreground mt-1">{preset.description}</p>
                </div>

                {/* Preview Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handlePreviewPreset(preset.id);
                  }}
                  className="absolute bottom-2 right-2 h-6 w-6 rounded-full bg-background/80 flex items-center justify-center hover:bg-background"
                >
                  {playingPreset === preset.id && isPlaying ? (
                    <Pause className="h-3 w-3" />
                  ) : (
                    <Play className="h-3 w-3" />
                  )}
                </button>
              </button>
            ))}
          </div>
        </div>

        {/* Upload Custom */}
        <div className="space-y-3">
          <Label>Or Upload Custom Music</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          <Button
            variant="outline"
            className="w-full"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload Audio File
          </Button>
        </div>

        {/* Selected Music */}
        {project.music && (
          <div className="bg-muted/50 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Music className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-sm">{project.music.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{project.music.mood} mood</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="bg-primary/10 text-primary">
                  <Check className="h-3 w-3 mr-1" />
                  Added
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveMusic}
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            </div>

            {/* Volume Control */}
            <div className="flex items-center gap-3">
              <Volume2 className="h-4 w-4 text-muted-foreground" />
              <Slider
                value={volume}
                onValueChange={handleVolumeChange}
                max={100}
                step={1}
                className="flex-1"
              />
              <span className="text-xs text-muted-foreground w-8">{volume[0]}%</span>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isGenerating && (
          <div className="bg-primary/10 rounded-lg p-4 flex items-center gap-3">
            <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full" />
            <div>
              <p className="font-medium text-sm">Generating music...</p>
              <p className="text-xs text-muted-foreground">This may take a moment</p>
            </div>
          </div>
        )}

        {/* Continue Button */}
        <div className="flex justify-between pt-4 border-t">
          <Button variant="ghost" onClick={handleSkip}>
            Skip for now
          </Button>
          <Button onClick={onNext}>
            Continue to Subtitles <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoMusicSelector;
