import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Sparkles, Palette, User, Shirt, Wand2, X } from 'lucide-react';

export interface BeautySettings {
  enabled: boolean;
  skinSmoothing: number;
  brightness: number;
  contrast: number;
  warmth: number;
  faceSlimming: number;
  eyeEnlargement: number;
  lipColor: string;
  blush: number;
  contour: number;
  hairColor: string;
  makeupPreset: string;
}

interface BeautyFiltersPanelProps {
  settings: BeautySettings;
  onChange: (settings: BeautySettings) => void;
  onClose: () => void;
  isOwnerOrBroker?: boolean;
}

const MAKEUP_PRESETS = [
  { id: 'none', name: 'Natural', color: 'transparent' },
  { id: 'light', name: 'Light Makeup', color: '#fce4ec' },
  { id: 'professional', name: 'Professional', color: '#f8bbd9' },
  { id: 'glamour', name: 'Glamour', color: '#e91e63' },
  { id: 'evening', name: 'Evening', color: '#9c27b0' },
];

const LIP_COLORS = [
  { id: 'none', name: 'Natural', color: 'transparent' },
  { id: 'nude', name: 'Nude', color: '#d4a98c' },
  { id: 'pink', name: 'Pink', color: '#ff69b4' },
  { id: 'red', name: 'Red', color: '#dc143c' },
  { id: 'berry', name: 'Berry', color: '#8b0000' },
  { id: 'coral', name: 'Coral', color: '#ff7f50' },
];

const HAIR_COLORS = [
  { id: 'none', name: 'Natural', color: 'transparent' },
  { id: 'blonde', name: 'Blonde', color: '#f5deb3' },
  { id: 'brunette', name: 'Brunette', color: '#3d2314' },
  { id: 'black', name: 'Black', color: '#1a1a1a' },
  { id: 'red', name: 'Red', color: '#8b2500' },
  { id: 'platinum', name: 'Platinum', color: '#e8e8e8' },
];

const BeautyFiltersPanel = ({ settings, onChange, onClose, isOwnerOrBroker = false }: BeautyFiltersPanelProps) => {
  const [activeTab, setActiveTab] = useState('skin');

  const updateSetting = <K extends keyof BeautySettings>(key: K, value: BeautySettings[K]) => {
    onChange({ ...settings, [key]: value });
  };

  return (
    <Card className="bg-[#FDFBF7] border-[#1A1A1A] w-80">
      <CardHeader className="pb-2 flex flex-row items-center justify-between">
        <CardTitle className="text-white text-lg flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#1A1A1A]" />
          Beauty Filters
        </CardTitle>
        <Button variant="ghost" size="icon" onClick={onClose} className="h-8 w-8 text-white/70 hover:text-white">
          <X className="h-4 w-4" />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Master Toggle */}
        <div className="flex items-center justify-between p-3 bg-[#1A1A1A]/50 rounded-lg">
          <Label className="text-white font-medium">Enable Beauty Filters</Label>
          <Switch 
            checked={settings.enabled} 
            onCheckedChange={(checked) => updateSetting('enabled', checked)}
          />
        </div>

        {settings.enabled && (
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-4 bg-[#1A1A1A]">
              <TabsTrigger value="skin" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A]">
                <User className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="face" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A]">
                <Wand2 className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="makeup" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A]">
                <Palette className="h-3 w-3" />
              </TabsTrigger>
              <TabsTrigger value="hair" className="text-xs data-[state=active]:bg-gradient-to-r data-[state=active]:from-[#F7F1E6] data-[state=active]:via-[#ECE2D2] data-[state=active]:to-[#D8C7A6] data-[state=active]:text-[#1A1A1A]">
                <Shirt className="h-3 w-3" />
              </TabsTrigger>
            </TabsList>

            {/* Skin Tab */}
            <TabsContent value="skin" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Skin Smoothing</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.skinSmoothing}%</span>
                </div>
                <Slider
                  value={[settings.skinSmoothing]}
                  onValueChange={([v]) => updateSetting('skinSmoothing', v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Brightness</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.brightness}%</span>
                </div>
                <Slider
                  value={[settings.brightness]}
                  onValueChange={([v]) => updateSetting('brightness', v)}
                  min={50}
                  max={150}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Contrast</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.contrast}%</span>
                </div>
                <Slider
                  value={[settings.contrast]}
                  onValueChange={([v]) => updateSetting('contrast', v)}
                  min={50}
                  max={150}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Warmth</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.warmth}%</span>
                </div>
                <Slider
                  value={[settings.warmth]}
                  onValueChange={([v]) => updateSetting('warmth', v)}
                  min={0}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* Face Tab */}
            <TabsContent value="face" className="space-y-4 mt-4">
              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Face Slimming</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.faceSlimming}%</span>
                </div>
                <Slider
                  value={[settings.faceSlimming]}
                  onValueChange={([v]) => updateSetting('faceSlimming', v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Eye Enlargement</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.eyeEnlargement}%</span>
                </div>
                <Slider
                  value={[settings.eyeEnlargement]}
                  onValueChange={([v]) => updateSetting('eyeEnlargement', v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Contour</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.contour}%</span>
                </div>
                <Slider
                  value={[settings.contour]}
                  onValueChange={([v]) => updateSetting('contour', v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between">
                  <Label className="text-white/85 text-sm">Blush</Label>
                  <span className="text-xs text-[#1A1A1A]">{settings.blush}%</span>
                </div>
                <Slider
                  value={[settings.blush]}
                  onValueChange={([v]) => updateSetting('blush', v)}
                  max={100}
                  step={5}
                  className="w-full"
                />
              </div>
            </TabsContent>

            {/* Makeup Tab */}
            <TabsContent value="makeup" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white/85 text-sm">Makeup Preset</Label>
                <div className="grid grid-cols-3 gap-2">
                  {MAKEUP_PRESETS.map(preset => (
                    <button
                      key={preset.id}
                      onClick={() => updateSetting('makeupPreset', preset.id)}
                      className={`p-2 rounded-lg text-xs text-center border transition-all ${
                        settings.makeupPreset === preset.id 
                          ? 'border-[#B89555] bg-[#EFE6D6]/20 text-white' 
                          : 'border-[#1A1A1A] hover:border-[#1A1A1A] text-white/85'
                      }`}
                    >
                      {preset.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-white/85 text-sm">Lip Color</Label>
                <div className="flex flex-wrap gap-2">
                  {LIP_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => updateSetting('lipColor', color.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        settings.lipColor === color.id 
                          ? 'border-[#B89555] scale-110' 
                          : 'border-[#1A1A1A] hover:border-[#B89555]/30'
                      }`}
                      style={{ backgroundColor: color.color === 'transparent' ? '#3f3f46' : color.color }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Hair Tab */}
            <TabsContent value="hair" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label className="text-white/85 text-sm">Hair Color</Label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_COLORS.map(color => (
                    <button
                      key={color.id}
                      onClick={() => updateSetting('hairColor', color.id)}
                      className={`w-8 h-8 rounded-full border-2 transition-all ${
                        settings.hairColor === color.id 
                          ? 'border-[#B89555] scale-110' 
                          : 'border-[#1A1A1A] hover:border-[#B89555]/30'
                      }`}
                      style={{ backgroundColor: color.color === 'transparent' ? '#3f3f46' : color.color }}
                      title={color.name}
                    />
                  ))}
                </div>
              </div>

              {isOwnerOrBroker && (
                <div className="pt-4 border-t border-[#1A1A1A]">
                  <p className="text-xs text-[#1A1A1A] mb-2">✨ Owner/Broker Exclusive</p>
                  <Button variant="outline" className="w-full border-[#B89555]/50 text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                    <Wand2 className="h-4 w-4 mr-2" />
                    AI Persona Generator
                  </Button>
                  <p className="text-xs text-white/90 mt-2">
                    Describe or select a persona to transform your appearance
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
    </Card>
  );
};

export default BeautyFiltersPanel;
