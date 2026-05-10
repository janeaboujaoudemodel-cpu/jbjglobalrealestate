import React, { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { 
  Play, 
  Pause, 
  RotateCcw, 
  FlipHorizontal, 
  AlignLeft,
  Maximize2,
  Minimize2
} from 'lucide-react';

interface TeleprompterPanelProps {
  onScriptChange?: (script: string) => void;
  initialScript?: string;
}

export function TeleprompterPanel({ onScriptChange, initialScript = '' }: TeleprompterPanelProps) {
  const [script, setScript] = useState(initialScript);
  const [isPlaying, setIsPlaying] = useState(false);
  const [scrollSpeed, setScrollSpeed] = useState(50);
  const [fontSize, setFontSize] = useState(32);
  const [mirrorMode, setMirrorMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showCountdown, setShowCountdown] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const animationRef = useRef<number>();

  const handleScriptChange = (value: string) => {
    setScript(value);
    onScriptChange?.(value);
  };

  const startScrolling = useCallback(() => {
    if (!scrollRef.current) return;

    let lastTime = performance.now();
    const scroll = (currentTime: number) => {
      if (!scrollRef.current) return;
      
      const deltaTime = currentTime - lastTime;
      lastTime = currentTime;
      
      const scrollAmount = (scrollSpeed / 1000) * deltaTime;
      scrollRef.current.scrollTop += scrollAmount;
      
      // Stop at end
      if (scrollRef.current.scrollTop >= scrollRef.current.scrollHeight - scrollRef.current.clientHeight) {
        setIsPlaying(false);
        return;
      }
      
      animationRef.current = requestAnimationFrame(scroll);
    };
    
    animationRef.current = requestAnimationFrame(scroll);
  }, [scrollSpeed]);

  const stopScrolling = useCallback(() => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
  }, []);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopScrolling();
      setIsPlaying(false);
    } else {
      // Start with countdown
      setShowCountdown(true);
      setCountdown(3);
    }
  }, [isPlaying, stopScrolling]);

  // Countdown effect
  useEffect(() => {
    if (!showCountdown) return;
    
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setShowCountdown(false);
      setIsPlaying(true);
      startScrolling();
    }
  }, [countdown, showCountdown, startScrolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  const resetScroll = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = 0;
    }
    stopScrolling();
    setIsPlaying(false);
  }, [stopScrolling]);

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    
    if (!isFullscreen) {
      containerRef.current.requestFullscreen?.();
    } else {
      document.exitFullscreen?.();
    }
    setIsFullscreen(!isFullscreen);
  }, [isFullscreen]);

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-slate-900">
      {/* Edit Mode */}
      {!isFullscreen && (
        <div className="p-3 border-b border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-[#1A1A1A] flex items-center gap-2">
              <AlignLeft className="w-4 h-4" />
              Teleprompter
            </h4>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-slate-400 hover:text-white"
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>
          
          <Textarea
            value={script}
            onChange={(e) => handleScriptChange(e.target.value)}
            placeholder="Enter your script here..."
            className="min-h-[100px] bg-slate-800 border-slate-700 text-white resize-none"
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Speed</Label>
              <Slider
                value={[scrollSpeed]}
                min={10}
                max={200}
                step={5}
                onValueChange={(v) => setScrollSpeed(v[0])}
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs text-slate-400">Font Size</Label>
              <Slider
                value={[fontSize]}
                min={16}
                max={72}
                step={2}
                onValueChange={(v) => setFontSize(v[0])}
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Switch
                checked={mirrorMode}
                onCheckedChange={setMirrorMode}
                id="mirror-mode"
              />
              <Label htmlFor="mirror-mode" className="text-xs text-slate-400 flex items-center gap-1">
                <FlipHorizontal className="w-3 h-3" />
                Mirror
              </Label>
            </div>

            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={resetScroll}
                className="text-slate-400 hover:text-white"
              >
                <RotateCcw className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                onClick={handlePlayPause}
                className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={toggleFullscreen}
                className="text-slate-400 hover:text-white"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Preview / Fullscreen Mode */}
      <div 
        ref={scrollRef}
        className={`flex-1 overflow-y-auto bg-[#1A1A1A] p-4 ${isFullscreen ? 'cursor-pointer' : ''}`}
        style={{
          transform: mirrorMode ? 'scaleX(-1)' : 'none',
        }}
        onClick={isFullscreen ? handlePlayPause : undefined}
      >
        {/* Countdown Overlay */}
        {showCountdown && (
          <div className="fixed inset-0 bg-[#1A1A1A]/90 flex items-center justify-center z-50">
            <span className="text-9xl font-bold text-[#1A1A1A] animate-pulse">
              {countdown}
            </span>
          </div>
        )}

        {/* Script Text */}
        <div 
          className="text-white text-center leading-relaxed max-w-4xl mx-auto"
          style={{ fontSize: `${fontSize}px` }}
        >
          {script || 'Enter your script above...'}
        </div>

        {/* Fullscreen Controls */}
        {isFullscreen && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-[#1A1A1A]/80 rounded-full px-4 py-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={resetScroll}
              className="text-white hover:text-[#1A1A1A]"
            >
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={handlePlayPause}
              className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:text-[#1A1A1A]"
            >
              <Minimize2 className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
