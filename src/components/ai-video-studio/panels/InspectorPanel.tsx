import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Slider } from '@/components/ui/slider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { 
  Move, 
  Crop, 
  Timer, 
  Palette, 
  Volume2, 
  Subtitles, 
  Sparkles,
  RotateCcw,
  FlipHorizontal,
  FlipVertical,
  Lock,
  Unlock
} from 'lucide-react';
import { Clip, ClipTransform, AudioSettings, FILTER_PRESETS } from '../types';

interface InspectorPanelProps {
  selectedClip: Clip | null;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export function InspectorPanel({ selectedClip, onUpdateClip }: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState('transform');
  const [isScaleLocked, setIsScaleLocked] = useState(true);

  if (!selectedClip) {
    return (
      <div className="h-full flex items-center justify-center p-4">
        <div className="text-center text-slate-500">
          <p className="text-sm">Select a clip to edit</p>
          <p className="text-xs mt-2">Click on any clip in the timeline</p>
        </div>
      </div>
    );
  }

  const updateTransform = (updates: Partial<ClipTransform>) => {
    const newTransform = { ...selectedClip.transform, ...updates };
    
    // Handle locked scale
    if (isScaleLocked && (updates.scaleX || updates.scaleY)) {
      if (updates.scaleX) {
        newTransform.scaleY = updates.scaleX;
      } else if (updates.scaleY) {
        newTransform.scaleX = updates.scaleY;
      }
    }
    
    onUpdateClip({ transform: newTransform });
  };

  const updateAudio = (updates: Partial<AudioSettings>) => {
    onUpdateClip({ 
      audio: { 
        ...selectedClip.audio || { volume: 1, fadeIn: 0, fadeOut: 0, muted: false, normalized: false, noiseReduction: false },
        ...updates 
      } 
    });
  };

  const resetTransform = () => {
    onUpdateClip({
      transform: {
        x: 0,
        y: 0,
        scaleX: 1,
        scaleY: 1,
        rotation: 0,
        opacity: 1,
      },
    });
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-800">
        <h3 className="text-sm font-medium text-white truncate">{selectedClip.name}</h3>
        <p className="text-xs text-slate-500 capitalize">{selectedClip.type} clip</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent p-0 flex-wrap">
          <TabsTrigger 
            value="transform"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Move className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="crop"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Crop className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="speed"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Timer className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="color"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Palette className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="audio"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Volume2 className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="captions"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Subtitles className="w-4 h-4" />
          </TabsTrigger>
          <TabsTrigger 
            value="effects"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold px-2"
          >
            <Sparkles className="w-4 h-4" />
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          {/* Transform Tab */}
          <TabsContent value="transform" className="mt-0 p-3 space-y-4">
            <div className="flex justify-between items-center">
              <h4 className="text-xs font-medium text-slate-400 uppercase">Transform</h4>
              <Button size="sm" variant="ghost" onClick={resetTransform} className="text-slate-400 h-6 text-xs">
                <RotateCcw className="w-3 h-3 mr-1" />
                Reset
              </Button>
            </div>

            {/* Position */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Position</Label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-500">X</span>
                  <Input
                    type="number"
                    value={Math.round(selectedClip.transform.x)}
                    onChange={(e) => updateTransform({ x: parseFloat(e.target.value) || 0 })}
                    className="h-8 bg-slate-800 border-slate-700 text-sm"
                  />
                </div>
                <div>
                  <span className="text-xs text-slate-500">Y</span>
                  <Input
                    type="number"
                    value={Math.round(selectedClip.transform.y)}
                    onChange={(e) => updateTransform({ y: parseFloat(e.target.value) || 0 })}
                    className="h-8 bg-slate-800 border-slate-700 text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Scale */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Scale</Label>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsScaleLocked(!isScaleLocked)}
                  className="h-6 w-6 p-0 text-slate-400"
                >
                  {isScaleLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-xs text-slate-500">X</span>
                  <Slider
                    value={[selectedClip.transform.scaleX]}
                    min={0.1}
                    max={3}
                    step={0.01}
                    onValueChange={(v) => updateTransform({ scaleX: v[0] })}
                  />
                  <span className="text-xs text-slate-500">{Math.round(selectedClip.transform.scaleX * 100)}%</span>
                </div>
                <div>
                  <span className="text-xs text-slate-500">Y</span>
                  <Slider
                    value={[selectedClip.transform.scaleY]}
                    min={0.1}
                    max={3}
                    step={0.01}
                    onValueChange={(v) => updateTransform({ scaleY: v[0] })}
                  />
                  <span className="text-xs text-slate-500">{Math.round(selectedClip.transform.scaleY * 100)}%</span>
                </div>
              </div>
            </div>

            {/* Rotation */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Rotation</Label>
              <Slider
                value={[selectedClip.transform.rotation]}
                min={-180}
                max={180}
                step={1}
                onValueChange={(v) => updateTransform({ rotation: v[0] })}
              />
              <span className="text-xs text-slate-500">{selectedClip.transform.rotation}°</span>
            </div>

            {/* Opacity */}
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Opacity</Label>
              <Slider
                value={[selectedClip.transform.opacity]}
                min={0}
                max={1}
                step={0.01}
                onValueChange={(v) => updateTransform({ opacity: v[0] })}
              />
              <span className="text-xs text-slate-500">{Math.round(selectedClip.transform.opacity * 100)}%</span>
            </div>

            {/* Flip Buttons */}
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-400">
                <FlipHorizontal className="w-4 h-4 mr-2" />
                Flip H
              </Button>
              <Button size="sm" variant="outline" className="flex-1 border-slate-700 text-slate-400">
                <FlipVertical className="w-4 h-4 mr-2" />
                Flip V
              </Button>
            </div>
          </TabsContent>

          {/* Speed Tab */}
          <TabsContent value="speed" className="mt-0 p-3 space-y-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase">Speed</h4>
            
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Playback Speed</Label>
              <div className="flex gap-1 flex-wrap">
                {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                  <Button
                    key={speed}
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-400 hover:bg-gold hover:text-black h-7 text-xs"
                  >
                    {speed}x
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Label className="text-xs text-slate-400">Reverse</Label>
              <Switch />
            </div>
          </TabsContent>

          {/* Color Tab */}
          <TabsContent value="color" className="mt-0 p-3 space-y-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase">Color Correction</h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Brightness</Label>
                <Slider defaultValue={[0]} min={-100} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Contrast</Label>
                <Slider defaultValue={[0]} min={-100} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Saturation</Label>
                <Slider defaultValue={[0]} min={-100} max={100} step={1} />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Temperature</Label>
                <Slider defaultValue={[0]} min={-100} max={100} step={1} />
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Filter Presets</Label>
              <div className="grid grid-cols-2 gap-1">
                {FILTER_PRESETS.map((filter) => (
                  <Button
                    key={filter.id}
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-400 hover:bg-gold hover:text-black h-8 text-xs justify-start"
                  >
                    {filter.name}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>

          {/* Audio Tab */}
          <TabsContent value="audio" className="mt-0 p-3 space-y-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase">Audio</h4>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Volume</Label>
                <Slider 
                  value={[selectedClip.audio?.volume ?? 1]} 
                  min={0} 
                  max={2} 
                  step={0.01}
                  onValueChange={(v) => updateAudio({ volume: v[0] })}
                />
                <span className="text-xs text-slate-500">{Math.round((selectedClip.audio?.volume ?? 1) * 100)}%</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Fade In</Label>
                <Slider 
                  value={[selectedClip.audio?.fadeIn ?? 0]} 
                  min={0} 
                  max={5} 
                  step={0.1}
                  onValueChange={(v) => updateAudio({ fadeIn: v[0] })}
                />
                <span className="text-xs text-slate-500">{(selectedClip.audio?.fadeIn ?? 0).toFixed(1)}s</span>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-slate-400">Fade Out</Label>
                <Slider 
                  value={[selectedClip.audio?.fadeOut ?? 0]} 
                  min={0} 
                  max={5} 
                  step={0.1}
                  onValueChange={(v) => updateAudio({ fadeOut: v[0] })}
                />
                <span className="text-xs text-slate-500">{(selectedClip.audio?.fadeOut ?? 0).toFixed(1)}s</span>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Normalize Audio</Label>
                <Switch 
                  checked={selectedClip.audio?.normalized ?? false}
                  onCheckedChange={(checked) => updateAudio({ normalized: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Noise Reduction</Label>
                <Switch 
                  checked={selectedClip.audio?.noiseReduction ?? false}
                  onCheckedChange={(checked) => updateAudio({ noiseReduction: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Mute</Label>
                <Switch 
                  checked={selectedClip.audio?.muted ?? false}
                  onCheckedChange={(checked) => updateAudio({ muted: checked })}
                />
              </div>
            </div>
          </TabsContent>

          {/* Captions Tab */}
          <TabsContent value="captions" className="mt-0 p-3 space-y-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase">Captions</h4>
            
            <Button size="sm" className="w-full bg-gold text-black hover:bg-gold/90">
              <Subtitles className="w-4 h-4 mr-2" />
              Auto-Transcribe
            </Button>

            <div className="text-center text-slate-500 text-xs py-4">
              Transcribe audio to create captions automatically
            </div>
          </TabsContent>

          {/* Effects Tab */}
          <TabsContent value="effects" className="mt-0 p-3 space-y-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase">Effects</h4>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Background Blur</Label>
                <Switch />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-xs text-slate-400">Vignette</Label>
                <Switch />
              </div>
            </div>
          </TabsContent>

          {/* Crop Tab */}
          <TabsContent value="crop" className="mt-0 p-3 space-y-4">
            <h4 className="text-xs font-medium text-slate-400 uppercase">Crop & Rotation</h4>
            
            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Aspect Ratio</Label>
              <div className="grid grid-cols-2 gap-1">
                {['None', '16:9', '9:16', '1:1', '4:5'].map((ratio) => (
                  <Button
                    key={ratio}
                    size="sm"
                    variant="outline"
                    className="border-slate-700 text-slate-400 hover:bg-gold hover:text-black h-8 text-xs"
                  >
                    {ratio}
                  </Button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-slate-400">Rotation Preset</Label>
              <div className="flex gap-1">
                {['0°', '90°', '180°', '270°'].map((angle) => (
                  <Button
                    key={angle}
                    size="sm"
                    variant="outline"
                    className="flex-1 border-slate-700 text-slate-400 hover:bg-gold hover:text-black h-8 text-xs"
                  >
                    {angle}
                  </Button>
                ))}
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
