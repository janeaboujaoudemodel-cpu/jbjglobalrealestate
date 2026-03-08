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
  Unlock,
  Zap,
} from 'lucide-react';
import { Clip, ClipTransform, AudioSettings, FILTER_PRESETS, TransitionEasing, TRANSITION_TYPES } from '../types';

interface InspectorPanelProps {
  selectedClip: Clip | null;
  onUpdateClip: (updates: Partial<Clip>) => void;
}

export function InspectorPanel({ selectedClip, onUpdateClip }: InspectorPanelProps) {
  const [activeTab, setActiveTab] = useState('transform');
  const [isScaleLocked, setIsScaleLocked] = useState(true);

  if (!selectedClip) {
    return (
      <div className="h-full flex flex-col items-center justify-center p-6 gap-3 text-center">
        <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center">
          <Move className="w-5 h-5 text-slate-500" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-300">No clip selected</p>
          <p className="text-xs text-slate-500 mt-1 leading-relaxed">
            Click any clip in the timeline below to inspect and edit its transform, speed, color, audio, and effects.
          </p>
        </div>
        <div className="w-full rounded-lg bg-amber-500/10 border border-amber-500/25 p-2.5 text-[10px] text-amber-300 text-left leading-relaxed">
          <strong>Tip:</strong> Select a transition clip to adjust its easing curve and duration.
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

  // ── Transition helpers ────────────────────────────────────────────────────
  const transitionEffect = selectedClip?.effects.find(e => e.type === 'transition');
  const currentTransitionId = transitionEffect?.settings?.transitionId ?? '';
  const currentEasing: TransitionEasing = (selectedClip?.transition?.easing ?? transitionEffect?.settings?.easing) ?? 'easeInOut';

  const updateTransition = (patch: { duration?: number; easing?: TransitionEasing; transitionId?: string }) => {
    // Update duration on the clip itself
    const durationUpdate = patch.duration !== undefined ? { duration: patch.duration, source: { ...selectedClip.source, outPoint: patch.duration, originalDuration: patch.duration } } : {};
    // Update easing both on the effects array and on clip.transition
    const updatedEffects = selectedClip.effects.map(e =>
      e.type === 'transition'
        ? { ...e, settings: { ...e.settings, ...(patch.easing ? { easing: patch.easing } : {}), ...(patch.transitionId ? { transitionId: patch.transitionId } : {}) } }
        : e
    );
    onUpdateClip({
      ...durationUpdate,
      effects: updatedEffects,
      transition: {
        transitionId: patch.transitionId ?? currentTransitionId,
        easing: patch.easing ?? currentEasing,
      },
    });
  };

  // ── Transition clip: dedicated inspector ──────────────────────────────────
  if (selectedClip.type === 'transition') {
    const easingOptions: { value: TransitionEasing; label: string; description: string; curve: string }[] = [
      { value: 'linear',     label: 'Linear',      description: 'Constant speed — clean & mechanical',   curve: 'M0,100 L100,0' },
      { value: 'easeIn',     label: 'Ease In',      description: 'Starts slow, accelerates into cut',      curve: 'M0,100 C60,100 100,40 100,0' },
      { value: 'easeOut',    label: 'Ease Out',     description: 'Starts fast, decelerates into rest',     curve: 'M0,100 C0,60 40,0 100,0' },
      { value: 'easeInOut',  label: 'Ease In-Out',  description: 'Smooth S-curve — cinematic feel',        curve: 'M0,100 C30,100 70,0 100,0' },
    ];

    return (
      <div className="h-full flex flex-col">
        {/* Header */}
        <div className="p-3 border-b border-slate-800 flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gold/15 border border-gold/30">
            <Zap className="w-3.5 h-3.5 text-gold" />
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-medium text-white truncate">{selectedClip.name}</h3>
            <p className="text-xs text-slate-500">Transition</p>
          </div>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-3 space-y-5 animate-fade-in">

            {/* Duration */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Duration</Label>
              <div className="flex items-center gap-3">
                <Slider
                  value={[selectedClip.duration]}
                  min={0.2}
                  max={3}
                  step={0.1}
                  onValueChange={(v) => updateTransition({ duration: v[0] })}
                  className="flex-1"
                />
                <div className="flex items-center gap-1 rounded-md border border-slate-700 bg-slate-900 px-2 py-1 min-w-[60px] justify-center">
                  <Input
                    type="number"
                    value={selectedClip.duration.toFixed(1)}
                    min={0.2}
                    max={3}
                    step={0.1}
                    onChange={(e) => updateTransition({ duration: Math.max(0.2, Math.min(3, parseFloat(e.target.value) || 0.5)) })}
                    className="h-6 w-12 border-0 bg-transparent text-xs text-white text-center p-0 focus-visible:ring-0"
                  />
                  <span className="text-xs text-slate-500">s</span>
                </div>
              </div>
              <div className="flex gap-1 flex-wrap">
                {[0.3, 0.5, 0.8, 1.0, 1.5].map(d => (
                  <button
                    key={d}
                    onClick={() => updateTransition({ duration: d })}
                    className={`px-2.5 py-1 rounded text-xs font-medium border transition-all ${
                      Math.abs(selectedClip.duration - d) < 0.05
                        ? 'bg-gold/20 border-gold/50 text-gold'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    {d}s
                  </button>
                ))}
              </div>
            </div>

            {/* Transition type */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Type</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {TRANSITION_TYPES.map(t => (
                  <button
                    key={t.id}
                    onClick={() => updateTransition({ transitionId: t.id })}
                    className={`flex items-center gap-2 px-2.5 py-2 rounded-lg border text-xs font-medium transition-all ${
                      currentTransitionId === t.id
                        ? 'bg-gold/15 border-gold/40 text-gold'
                        : 'border-slate-700 text-slate-400 hover:border-slate-600 hover:text-white'
                    }`}
                  >
                    <span className="text-base leading-none">{t.icon}</span>
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Easing curve */}
            <div className="space-y-3">
              <Label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Easing Curve</Label>
              <div className="space-y-1.5">
                {easingOptions.map(opt => {
                  const isActive = currentEasing === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => updateTransition({ easing: opt.value })}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all ${
                        isActive
                          ? 'bg-gold/10 border-gold/40'
                          : 'border-slate-700/60 hover:border-slate-600 hover:bg-slate-800/50'
                      }`}
                    >
                      {/* SVG curve preview */}
                      <div className={`w-10 h-7 rounded shrink-0 flex items-center justify-center border ${isActive ? 'border-gold/30 bg-gold/5' : 'border-slate-700 bg-slate-800/60'}`}>
                        <svg viewBox="0 0 100 100" width="32" height="22" fill="none">
                          <path
                            d={opt.curve}
                            stroke={isActive ? '#C8A766' : '#64748b'}
                            strokeWidth="8"
                            strokeLinecap="round"
                            fill="none"
                          />
                        </svg>
                      </div>
                      <div className="min-w-0">
                        <p className={`text-xs font-semibold leading-tight ${isActive ? 'text-gold' : 'text-slate-300'}`}>{opt.label}</p>
                        <p className="text-[10px] text-slate-500 leading-tight mt-0.5 truncate">{opt.description}</p>
                      </div>
                      {isActive && (
                        <div className="ml-auto w-1.5 h-1.5 rounded-full bg-gold shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Summary */}
            <div className="rounded-lg border border-slate-800 bg-slate-900/60 p-3 space-y-1.5">
              <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">Summary</p>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Duration</span>
                <span className="text-xs font-medium text-white">{selectedClip.duration.toFixed(1)}s</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Easing</span>
                <span className="text-xs font-medium text-gold">{easingOptions.find(e => e.value === currentEasing)?.label}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">Type</span>
                <span className="text-xs font-medium text-white">
                  {(TRANSITION_TYPES.find(t => t.id === currentTransitionId)?.name ?? currentTransitionId) || 'Fade'}
                </span>
              </div>
            </div>

          </div>
        </ScrollArea>
      </div>
    );
  }

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
