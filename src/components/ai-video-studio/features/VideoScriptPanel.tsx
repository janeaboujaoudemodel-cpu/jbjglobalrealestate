import React, { useState } from 'react';
import { Video, Loader2, Copy, Check, Download, Sparkles, Film } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContentDark,
  SelectItemDark,
  SelectTriggerDark,
  SelectValue,
} from '@/components/ui/select';
import { useAITool } from '@/components/ai-tools/AIToolsProvider';
import { toast } from 'sonner';

const AUDIENCES = [
  { value: "luxury-buyer", label: "Luxury Buyer" },
  { value: "investor", label: "Investor" },
  { value: "first-time-buyer", label: "First-Time Buyer" },
  { value: "family", label: "Family" },
  { value: "expat", label: "Expat / Relocating" },
];

const TONES = [
  { value: "professional", label: "Professional" },
  { value: "casual", label: "Casual" },
  { value: "luxury", label: "Ultra-Luxury" },
  { value: "energetic", label: "Energetic" },
  { value: "storytelling", label: "Storytelling" },
];

export function VideoScriptPanel() {
  const { invokeTool, loading, response } = useAITool();
  const [formData, setFormData] = useState({
    propertyName: "",
    propertyDetails: "",
    location: "",
    targetAudience: "luxury-buyer",
    tone: "professional",
    duration: "2-3",
  });
  const [copied, setCopied] = useState(false);

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    if (!formData.propertyName.trim()) {
      toast.error("Enter property name");
      return;
    }
    const result = await invokeTool("ai-video-tour-script", formData);
    if (result.success) toast.success("Script generated!");
  };

  const copyScript = () => {
    if (response?.script) {
      navigator.clipboard.writeText(response.script);
      setCopied(true);
      toast.success("Copied!");
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const downloadScript = () => {
    if (!response?.script) return;
    const content = `# Video Tour Script: ${formData.propertyName}\n\n${response.hook ? `## Hook\n"${response.hook}"\n\n` : ""}## Script\n${response.script}\n\n${response.callToAction ? `## CTA\n"${response.callToAction}"\n` : ""}`;
    const blob = new Blob([content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `script-${formData.propertyName.replace(/\s+/g, "-").toLowerCase()}.md`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Downloaded!");
  };

  return (
    <ScrollArea className="h-full">
      <div className="p-3 space-y-3">
        <div className="flex items-center gap-2 text-[#1A1A1A] mb-1">
          <Film className="w-4 h-4" />
          <span className="text-xs font-semibold uppercase tracking-wider">Video Script Generator</span>
        </div>

        {/* Form */}
        <div className="space-y-2">
          <div>
            <Label className="text-[#1A1A1A]/70 text-xs">Property Name *</Label>
            <Input
              placeholder="Sunset Bay Residences"
              value={formData.propertyName}
              onChange={(e) => handleChange("propertyName", e.target.value)}
              className="bg-[#1A1A1A] border-[#1A1A1A] text-white text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-[#1A1A1A]/70 text-xs">Location</Label>
            <Input
              placeholder="Palm Jumeirah"
              value={formData.location}
              onChange={(e) => handleChange("location", e.target.value)}
              className="bg-[#1A1A1A] border-[#1A1A1A] text-white text-sm h-8"
            />
          </div>
          <div>
            <Label className="text-[#1A1A1A]/70 text-xs">Audience</Label>
            <Select value={formData.targetAudience} onValueChange={(v) => handleChange("targetAudience", v)}>
              <SelectTriggerDark className="h-8 text-xs">
                <SelectValue />
              </SelectTriggerDark>
              <SelectContentDark>
                {AUDIENCES.map((a) => (
                  <SelectItemDark key={a.value} value={a.value} className="text-xs">{a.label}</SelectItemDark>
                ))}
              </SelectContentDark>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-[#1A1A1A]/70 text-xs">Tone</Label>
              <Select value={formData.tone} onValueChange={(v) => handleChange("tone", v)}>
                <SelectTriggerDark className="h-8 text-xs">
                  <SelectValue />
                </SelectTriggerDark>
                <SelectContentDark>
                  {TONES.map((t) => (
                    <SelectItemDark key={t.value} value={t.value} className="text-xs">{t.label}</SelectItemDark>
                  ))}
                </SelectContentDark>
              </Select>
            </div>
            <div>
              <Label className="text-[#1A1A1A]/70 text-xs">Duration</Label>
              <Select value={formData.duration} onValueChange={(v) => handleChange("duration", v)}>
                <SelectTriggerDark className="h-8 text-xs">
                  <SelectValue />
                </SelectTriggerDark>
                <SelectContentDark>
                  <SelectItemDark value="1" className="text-xs">1 min</SelectItemDark>
                  <SelectItemDark value="2-3" className="text-xs">2–3 min</SelectItemDark>
                  <SelectItemDark value="5" className="text-xs">5 min</SelectItemDark>
                  <SelectItemDark value="10" className="text-xs">10 min</SelectItemDark>
                </SelectContentDark>
              </Select>
            </div>
          </div>
          <div>
            <Label className="text-[#1A1A1A]/70 text-xs">Property Details</Label>
            <Textarea
              placeholder="Bedrooms, features, views..."
              value={formData.propertyDetails}
              onChange={(e) => handleChange("propertyDetails", e.target.value)}
              className="bg-[#1A1A1A] border-[#1A1A1A] text-white text-sm min-h-[60px]"
            />
          </div>

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-[#1A1A1A] font-semibold h-9 text-sm"
          >
            {loading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Generating...</>
            ) : (
              <><Sparkles className="h-4 w-4 mr-1" /> Generate Script</>
            )}
          </Button>
        </div>

        {/* Results */}
        {response?.script && (
          <div className="space-y-2 border-t border-[#1A1A1A] pt-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-white">Generated Script</span>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={copyScript} className="h-6 w-6 p-0 text-[#1A1A1A]/70 hover:text-white">
                  {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={downloadScript} className="h-6 w-6 p-0 text-[#1A1A1A]/70 hover:text-white">
                  <Download className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {response.hook && (
              <div className="bg-amber-500/10 border border-amber-500/30 rounded p-2">
                <span className="text-[10px] text-[#1A1A1A] uppercase font-bold">Hook</span>
                <p className="text-[#1A1A1A]/70 text-xs italic">"{response.hook}"</p>
              </div>
            )}

            <div className="bg-[#1A1A1A]/50 rounded p-2 text-[#1A1A1A]/70 text-xs whitespace-pre-wrap max-h-[200px] overflow-y-auto">
              {response.script}
            </div>

            {response.callToAction && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 rounded p-2">
                <span className="text-[10px] text-emerald-400 uppercase font-bold">CTA</span>
                <p className="text-[#1A1A1A]/70 text-xs">"{response.callToAction}"</p>
              </div>
            )}
          </div>
        )}
      </div>
    </ScrollArea>
  );
}