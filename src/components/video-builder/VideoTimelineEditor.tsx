import { useState, useRef } from "react";
import { 
  GripVertical, Trash2, Clock, Sparkles, Settings,
  ChevronDown, Image as ImageIcon, Video
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { toast } from "sonner";
import type { VideoProject, MediaItem } from "@/pages/VideoBuilder";

interface VideoTimelineEditorProps {
  project: VideoProject;
  onUpdate: (project: VideoProject) => void;
}

const TRANSITIONS = [
  { id: "none", label: "None" },
  { id: "fade", label: "Fade" },
  { id: "slide", label: "Slide" },
  { id: "zoom", label: "Zoom" },
  { id: "dissolve", label: "Dissolve" },
];

const FILTERS = [
  { id: "none", label: "None" },
  { id: "warm", label: "Warm" },
  { id: "cool", label: "Cool" },
  { id: "cinematic", label: "Cinematic" },
  { id: "vintage", label: "Vintage" },
  { id: "luxury", label: "Luxury Gold" },
];

const VideoTimelineEditor = ({ project, onUpdate }: VideoTimelineEditorProps) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newMedia = [...project.media];
    const [removed] = newMedia.splice(draggedIndex, 1);
    newMedia.splice(index, 0, removed);

    // Recalculate times
    let currentTime = 0;
    const reorderedMedia = newMedia.map((m, i) => {
      const duration = m.endTime - m.startTime;
      const item = {
        ...m,
        order: i,
        startTime: currentTime,
        endTime: currentTime + duration,
      };
      currentTime += duration;
      return item;
    });

    setDraggedIndex(index);
    onUpdate({
      ...project,
      media: reorderedMedia,
      duration: currentTime,
    });
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleUpdateMedia = (id: string, updates: Partial<MediaItem>) => {
    const updatedMedia = project.media.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );

    // Recalculate times if duration changed
    let currentTime = 0;
    const reorderedMedia = updatedMedia.map((m, i) => {
      const duration = m.endTime - m.startTime;
      const item = {
        ...m,
        order: i,
        startTime: currentTime,
        endTime: currentTime + duration,
      };
      currentTime += duration;
      return item;
    });

    onUpdate({
      ...project,
      media: reorderedMedia,
      duration: currentTime,
    });
  };

  const handleRemoveMedia = (id: string) => {
    const updatedMedia = project.media.filter(m => m.id !== id);
    
    let currentTime = 0;
    const reorderedMedia = updatedMedia.map((m, i) => {
      const duration = m.endTime - m.startTime;
      const item = {
        ...m,
        order: i,
        startTime: currentTime,
        endTime: currentTime + duration,
      };
      currentTime += duration;
      return item;
    });

    onUpdate({
      ...project,
      media: reorderedMedia,
      duration: currentTime,
    });
    toast.success("Clip removed from timeline");
  };

  const handleDurationChange = (id: string, newDuration: number) => {
    const item = project.media.find(m => m.id === id);
    if (!item) return;

    handleUpdateMedia(id, {
      endTime: item.startTime + Math.max(0.5, newDuration),
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms}`;
  };

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-primary" />
            Timeline Editor
          </span>
          <Badge variant="outline">
            {project.media.length} clips • {formatTime(project.duration)}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {/* Timeline visualization */}
        <div className="relative h-3 bg-muted rounded-full overflow-hidden mb-4">
          {project.media.map((item, index) => {
            const widthPercent = ((item.endTime - item.startTime) / project.duration) * 100;
            const leftPercent = (item.startTime / project.duration) * 100;
            
            return (
              <div
                key={item.id}
                className="absolute h-full bg-primary/70 hover:bg-primary transition-colors"
                style={{
                  left: `${leftPercent}%`,
                  width: `${widthPercent}%`,
                }}
                title={`Clip ${index + 1}: ${formatTime(item.startTime)} - ${formatTime(item.endTime)}`}
              />
            );
          })}
        </div>

        {/* Timeline Items */}
        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
          {project.media.map((item, index) => (
            <Collapsible
              key={item.id}
              open={expandedItem === item.id}
              onOpenChange={(open) => setExpandedItem(open ? item.id : null)}
            >
              <div
                draggable
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDragEnd={handleDragEnd}
                className={`rounded-lg border bg-muted/30 transition-all ${
                  draggedIndex === index ? "opacity-50 border-primary" : ""
                }`}
              >
                <CollapsibleTrigger asChild>
                  <div className="flex items-center gap-3 p-3 cursor-pointer hover:bg-muted/50">
                    <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    
                    {/* Thumbnail */}
                    <div className="w-12 h-8 rounded overflow-hidden bg-muted flex-shrink-0">
                      {item.type === "image" ? (
                        <img
                          src={item.url}
                          alt={`Clip ${index + 1}`}
                          className="w-full h-full object-cover"
                         loading="lazy" decoding="async" />
                      ) : (
                        <video
                          src={item.url}
                          className="w-full h-full object-cover"
                          muted
                        />
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        {item.type === "image" ? (
                          <ImageIcon className="h-3 w-3 text-muted-foreground" />
                        ) : (
                          <Video className="h-3 w-3 text-muted-foreground" />
                        )}
                        <span className="font-medium text-sm">Clip {index + 1}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {formatTime(item.startTime)} - {formatTime(item.endTime)}
                      </p>
                    </div>

                    {/* Duration */}
                    <Badge variant="outline" className="text-xs">
                      {(item.endTime - item.startTime).toFixed(1)}s
                    </Badge>

                    {/* Effects indicator */}
                    {item.effects && (item.effects.filter !== "none" || item.effects.zoom || item.effects.pan) && (
                      <Sparkles className="h-4 w-4 text-primary" />
                    )}

                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${
                      expandedItem === item.id ? "rotate-180" : ""
                    }`} />
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="px-3 pb-3 pt-0 border-t space-y-3">
                    {/* Duration */}
                    <div className="flex items-center gap-3">
                      <Label className="text-xs w-20">Duration</Label>
                      <Input
                        type="number"
                        step="0.5"
                        min="0.5"
                        max="30"
                        value={(item.endTime - item.startTime).toFixed(1)}
                        onChange={(e) => handleDurationChange(item.id, parseFloat(e.target.value))}
                        className="h-8 w-20"
                      />
                      <span className="text-xs text-muted-foreground">seconds</span>
                    </div>

                    {/* Transition */}
                    <div className="flex items-center gap-3">
                      <Label className="text-xs w-20">Transition</Label>
                      <Select
                        value={item.effects?.transition || "fade"}
                        onValueChange={(value) => 
                          handleUpdateMedia(item.id, {
                            effects: { ...item.effects, transition: value }
                          })
                        }
                      >
                        <SelectTrigger className="h-8 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TRANSITIONS.map((t) => (
                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Filter */}
                    <div className="flex items-center gap-3">
                      <Label className="text-xs w-20">Filter</Label>
                      <Select
                        value={item.effects?.filter || "none"}
                        onValueChange={(value) => 
                          handleUpdateMedia(item.id, {
                            effects: { ...item.effects, filter: value }
                          })
                        }
                      >
                        <SelectTrigger className="h-8 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {FILTERS.map((f) => (
                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Motion Effects */}
                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={item.effects?.zoom || false}
                          onChange={(e) => 
                            handleUpdateMedia(item.id, {
                              effects: { ...item.effects, zoom: e.target.checked }
                            })
                          }
                          className="rounded"
                        />
                        Ken Burns Zoom
                      </label>
                      <label className="flex items-center gap-2 text-xs">
                        <input
                          type="checkbox"
                          checked={item.effects?.pan || false}
                          onChange={(e) => 
                            handleUpdateMedia(item.id, {
                              effects: { ...item.effects, pan: e.target.checked }
                            })
                          }
                          className="rounded"
                        />
                        Pan Effect
                      </label>
                    </div>

                    {/* Delete */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveMedia(item.id)}
                      className="text-destructive hover:text-destructive w-full"
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove Clip
                    </Button>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>
          ))}
        </div>

        {project.media.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <p>No media in timeline</p>
            <p className="text-sm">Add media to start editing</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoTimelineEditor;
