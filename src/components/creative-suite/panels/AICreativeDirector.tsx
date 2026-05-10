import React, { useState } from 'react';
import { Wand2, Sparkles, Target, Palette, Loader2, ChevronDown, Lightbulb } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import type { AICreativeSettings, PropertySnapshot } from '../types';

interface AICreativeDirectorProps {
  settings: AICreativeSettings;
  onSettingsChange: (settings: Partial<AICreativeSettings>) => void;
  property?: PropertySnapshot | null;
  onGenerate: (prompt: string) => void;
  isGenerating?: boolean;
}

const SAMPLE_PROMPTS = [
  "Create a luxury property showcase video with map intro, lifestyle shots, and pricing callout",
  "Generate a viral TikTok-style video with quick cuts, money effects, and bold text overlays",
  "Make an investor-focused video highlighting ROI, payment plans, and location advantages",
  "Create a family-oriented video showcasing amenities, schools nearby, and community life",
];

export function AICreativeDirector({
  settings,
  onSettingsChange,
  property,
  onGenerate,
  isGenerating = false,
}: AICreativeDirectorProps) {
  const [prompt, setPrompt] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    onGenerate(prompt);
  };

  const creativityLabels: Record<string, string> = {
    safe: 'Safe - Conservative, brand-focused',
    balanced: 'Balanced - Professional with creativity',
    bold: 'Bold - Experimental, attention-grabbing',
  };

  const brandLabels: Record<string, string> = {
    minimal: 'Minimal - Subtle branding',
    branded: 'Branded - Logo and colors',
    fully_branded: 'Fully Branded - Complete JBJ identity',
  };

  const audienceLabels: Record<string, { label: string; description: string }> = {
    investors: { label: 'Investors', description: 'Focus on ROI, yields, and market data' },
    end_users: { label: 'End Users', description: 'Focus on lifestyle and living experience' },
    brokers: { label: 'Brokers', description: 'Focus on selling points and client objections' },
  };

  return (
    <div className="bg-[#1A1A1A]/50 rounded-xl border border-[#B89555]/20 overflow-hidden">
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger className="w-full p-4 flex items-center justify-between hover:bg-[#1A1A1A]/30 transition-colors">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-gold/20 to-amber-500/20 flex items-center justify-center">
              <Wand2 className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-white">AI Creative Director</h3>
              <p className="text-xs text-[#1A1A1A]/70">Generate premium content with AI</p>
            </div>
          </div>
          <ChevronDown className={`w-5 h-5 text-[#1A1A1A]/70 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
        </CollapsibleTrigger>

        <CollapsibleContent>
          <div className="p-4 pt-0 space-y-4">
            {/* Property Context */}
            {property && (
              <div className="p-3 rounded-lg bg-[#EFE6D6]/10 border border-[#B89555]/30">
                <p className="text-xs text-[#1A1A1A] mb-1">Creating content for:</p>
                <p className="text-sm font-medium text-white">{property.name}</p>
                <p className="text-xs text-[#1A1A1A]/70">{property.area_name} {property.developer_name && `by ${property.developer_name}`}</p>
              </div>
            )}

            {/* Prompt Input */}
            <div className="space-y-2">
              <label className="text-sm text-[#1A1A1A]/70 font-medium">Describe what you want to create</label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="E.g., Create a 60-second luxury property video with map intro, lifestyle b-roll, unit highlights, and price reveal with money effects..."
                className="min-h-[100px] bg-[#1A1A1A] border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70"
              />
            </div>

            {/* Sample Prompts */}
            <div className="space-y-2">
              <p className="text-xs text-[#1A1A1A]/70 flex items-center gap-1">
                <Lightbulb className="w-3 h-3" />
                Try these prompts:
              </p>
              <div className="flex flex-wrap gap-2">
                {SAMPLE_PROMPTS.map((sample, i) => (
                  <button
                    key={i}
                    onClick={() => setPrompt(sample)}
                    className="px-3 py-1.5 text-xs rounded-full bg-[#1A1A1A]/50 text-[#1A1A1A]/70 hover:bg-[#EFE6D6]/20 hover:text-[#1A1A1A] transition-colors"
                  >
                    {sample.slice(0, 50)}...
                  </button>
                ))}
              </div>
            </div>

            {/* Settings */}
            <div className="grid gap-4 md:grid-cols-3">
              {/* Creativity Level */}
              <div className="space-y-2">
                <label className="text-xs text-[#1A1A1A]/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  Creativity Level
                </label>
                <Select
                  value={settings.creativityLevel}
                  onValueChange={(v: 'safe' | 'balanced' | 'bold') => onSettingsChange({ creativityLevel: v })}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="safe">Safe</SelectItem>
                    <SelectItem value="balanced">Balanced</SelectItem>
                    <SelectItem value="bold">Bold</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-[#1A1A1A]/70">{creativityLabels[settings.creativityLevel]}</p>
              </div>

              {/* Brand Strictness */}
              <div className="space-y-2">
                <label className="text-xs text-[#1A1A1A]/70 flex items-center gap-1">
                  <Palette className="w-3 h-3" />
                  Brand Strictness
                </label>
                <Select
                  value={settings.brandStrictness}
                  onValueChange={(v: 'minimal' | 'branded' | 'fully_branded') => onSettingsChange({ brandStrictness: v })}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="minimal">Minimal</SelectItem>
                    <SelectItem value="branded">Branded</SelectItem>
                    <SelectItem value="fully_branded">Fully Branded</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-[#1A1A1A]/70">{brandLabels[settings.brandStrictness]}</p>
              </div>

              {/* Target Audience */}
              <div className="space-y-2">
                <label className="text-xs text-[#1A1A1A]/70 flex items-center gap-1">
                  <Target className="w-3 h-3" />
                  Target Audience
                </label>
                <Select
                  value={settings.targetAudience}
                  onValueChange={(v: 'investors' | 'end_users' | 'brokers') => onSettingsChange({ targetAudience: v })}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="investors">Investors</SelectItem>
                    <SelectItem value="end_users">End Users</SelectItem>
                    <SelectItem value="brokers">Brokers</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-[#1A1A1A]/70">{audienceLabels[settings.targetAudience].description}</p>
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={handleGenerate}
              disabled={!prompt.trim() || isGenerating}
              className="w-full bg-gradient-to-r from-gold to-amber-500 hover:from-gold/90 hover:to-amber-500/90 text-[#1A1A1A] font-semibold"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate with AI
                </>
              )}
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
