import { useState, useRef, useEffect } from "react";
import { 
  Play, Pause, SkipBack, SkipForward, Volume2, VolumeX,
  Maximize, Minimize, RotateCcw, Settings
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import type { VideoProject } from "@/pages/VideoBuilder";
import jbjLogo from "@/assets/jbj-fulllogo-dark-bg.png";

interface VideoPreviewPlayerProps {
  project: VideoProject;
}

const VideoPreviewPlayer = ({ project }: VideoPreviewPlayerProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(80);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const totalDuration = project.duration || 60;
  const mediaItems = project.media.length > 0 ? project.media : 
    project.property?.images.map((url, i) => ({
      id: String(i),
      type: "image" as const,
      url,
      order: i,
      startTime: i * 3,
      endTime: (i + 1) * 3,
    })) || [];

  useEffect(() => {
    if (isPlaying) {
      intervalRef.current = setInterval(() => {
        setCurrentTime(prev => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
      }, 100);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isPlaying, totalDuration]);

  useEffect(() => {
    // Update current media based on time
    const index = mediaItems.findIndex(
      m => currentTime >= m.startTime && currentTime < m.endTime
    );
    if (index !== -1 && index !== currentMediaIndex) {
      setCurrentMediaIndex(index);
    }
  }, [currentTime, mediaItems]);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleSeek = (value: number[]) => {
    setCurrentTime(value[0]);
  };

  const handleSkipBack = () => {
    setCurrentTime(Math.max(0, currentTime - 5));
  };

  const handleSkipForward = () => {
    setCurrentTime(Math.min(totalDuration, currentTime + 5));
  };

  const handleVolumeChange = (value: number[]) => {
    setVolume(value[0]);
    setIsMuted(value[0] === 0);
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;

    if (!isFullscreen) {
      try {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } catch (error) {
        console.error("Fullscreen error:", error);
      }
    } else {
      try {
        await document.exitFullscreen();
        setIsFullscreen(false);
      } catch (error) {
        console.error("Exit fullscreen error:", error);
      }
    }
  };

  const handleReset = () => {
    setCurrentTime(0);
    setIsPlaying(false);
    setCurrentMediaIndex(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const currentMedia = mediaItems[currentMediaIndex];
  const currentSubtitle = project.subtitles?.find(
    s => currentTime >= s.startTime && currentTime < s.endTime
  );

  return (
    <Card className="bg-card/80 backdrop-blur-sm border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center justify-between">
          <span>Video Preview</span>
          <Badge variant="outline">{project.format}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Video Container */}
        <div
          ref={containerRef}
          className={`relative bg-black rounded-lg overflow-hidden ${
            project.format === "9:16" ? "aspect-[9/16] max-h-[500px] mx-auto" : 
            project.format === "1:1" ? "aspect-square" : "aspect-video"
          }`}
        >
          {/* Media Display */}
          {currentMedia ? (
            currentMedia.type === "image" ? (
              <img
                src={currentMedia.url}
                alt={`Frame ${currentMediaIndex + 1}`}
                className="w-full h-full object-cover transition-all duration-500"
                style={{
                  transform: 'effects' in currentMedia && currentMedia.effects?.zoom 
                    ? `scale(${1 + (currentTime - currentMedia.startTime) * 0.02})` 
                    : undefined,
                }}
              />
            ) : (
              <video
                src={currentMedia.url}
                className="w-full h-full object-cover"
                muted={isMuted}
              />
            )
          ) : (
            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
              No media to preview
            </div>
          )}

          {/* Intro Overlay */}
          {project.branding.showIntro && currentTime < 3 && (
            <div className="absolute inset-0 bg-black flex items-center justify-center z-20">
              <div className="text-center animate-fade-in">
                <img
                  src={jbjLogo}
                  alt="JBJ GLOBAL REAL ESTATE"
                  className="h-16 mx-auto mb-4"
                />
                <p className="text-white/80 text-sm">presents</p>
              </div>
            </div>
          )}

          {/* Watermark */}
          {project.branding.watermark && currentTime >= 3 && (
            <div className="absolute top-3 left-3 z-10">
              <Badge className="bg-background/70 text-foreground text-xs backdrop-blur-sm">
                JBJ Global
              </Badge>
            </div>
          )}

          {/* Price Overlay */}
          {project.branding.priceOverlay && project.property && currentTime >= 3 && (
            <div className="absolute bottom-12 left-3 right-3 z-10">
              <div className="bg-background/85 backdrop-blur-sm rounded-lg p-2 max-w-xs">
                <p className="text-sm font-semibold truncate">{project.property.name}</p>
                <p className="text-xs text-muted-foreground truncate">{project.property.location}</p>
                <p className="text-primary font-bold text-sm mt-1">
                  AED {Math.round(project.property.price_from || 0).toLocaleString()}
                </p>
              </div>
            </div>
          )}

          {/* Subtitles */}
          {currentSubtitle && (
            <div className="absolute bottom-16 left-4 right-4 z-10">
              <div className="bg-black/75 text-white text-center py-2 px-4 rounded-lg text-sm">
                {currentSubtitle.text}
              </div>
            </div>
          )}

          {/* Play/Pause Overlay */}
          <button
            onClick={handlePlayPause}
            className="absolute inset-0 flex items-center justify-center bg-black/0 hover:bg-black/20 transition-colors z-5"
          >
            {!isPlaying && (
              <div className="h-16 w-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                <Play className="h-8 w-8 text-white fill-white" />
              </div>
            )}
          </button>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <Slider
            value={[currentTime]}
            onValueChange={handleSeek}
            max={totalDuration}
            step={0.1}
            className="cursor-pointer"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(totalDuration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={handleReset}>
              <RotateCcw className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSkipBack}>
              <SkipBack className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="icon" onClick={handlePlayPause}>
              {isPlaying ? (
                <Pause className="h-5 w-5" />
              ) : (
                <Play className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={handleSkipForward}>
              <SkipForward className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" onClick={toggleMute}>
              {isMuted ? (
                <VolumeX className="h-4 w-4" />
              ) : (
                <Volume2 className="h-4 w-4" />
              )}
            </Button>
            <Slider
              value={[isMuted ? 0 : volume]}
              onValueChange={handleVolumeChange}
              max={100}
              step={1}
              className="w-20"
            />
            <Button variant="ghost" size="icon" onClick={toggleFullscreen}>
              {isFullscreen ? (
                <Minimize className="h-4 w-4" />
              ) : (
                <Maximize className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Media Timeline Indicator */}
        <div className="flex gap-1">
          {mediaItems.map((_, index) => (
            <div
              key={index}
              className={`h-1 flex-1 rounded-full transition-colors ${
                index === currentMediaIndex
                  ? "bg-primary"
                  : index < currentMediaIndex
                  ? "bg-primary/50"
                  : "bg-muted"
              }`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VideoPreviewPlayer;
