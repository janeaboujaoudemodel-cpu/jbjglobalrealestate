import React, { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  Upload, 
  FolderOpen, 
  Music, 
  Wand2, 
  LayoutTemplate,
  Search,
  Film,
  Image,
  Mic,
  Play,
  Plus,
  Loader2,
  X,
  Sparkles
} from 'lucide-react';
import { MediaAsset, StockAsset } from '../types';

interface MediaLibraryPanelProps {
  assets: MediaAsset[];
  stockAssets: StockAsset[];
  isUploading: boolean;
  uploadProgress: number;
  isLoadingStock: boolean;
  onUpload: (files: FileList) => void;
  onLoadStock: (category?: string, search?: string) => void;
  onAddToTimeline: (asset: MediaAsset | StockAsset) => void;
  onDeleteAsset: (assetId: string) => void;
}

export function MediaLibraryPanel({
  assets,
  stockAssets,
  isUploading,
  uploadProgress,
  isLoadingStock,
  onUpload,
  onLoadStock,
  onAddToTimeline,
  onDeleteAsset,
}: MediaLibraryPanelProps) {
  const [activeTab, setActiveTab] = useState('uploads');
  const [searchQuery, setSearchQuery] = useState('');
  const [stockCategory, setStockCategory] = useState<string>('');
  const [previewAsset, setPreviewAsset] = useState<MediaAsset | StockAsset | null>(null);
  const [aiPrompt, setAiPrompt] = useState('');
  const [isGeneratingScene, setIsGeneratingScene] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onUpload(e.target.files);
    }
  }, [onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onUpload(e.dataTransfer.files);
    }
  }, [onUpload]);

  const handleStockSearch = useCallback(() => {
    onLoadStock(stockCategory || undefined, searchQuery || undefined);
  }, [onLoadStock, stockCategory, searchQuery]);

  const handleGenerateScene = useCallback(async () => {
    if (!aiPrompt.trim()) { toast.error('Enter a scene description first'); return; }
    setIsGeneratingScene(true);
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.functions.invoke('ai-video-editor', {
        body: { action: 'generate-scene', prompt: aiPrompt },
      });

      if (error) throw new Error(error.message);
      if (!data?.imageUrl) throw new Error('No image returned from AI');

      const imageUrl: string = data.imageUrl;

      // If base64 data URL, convert to blob; otherwise use directly
      let objectUrl: string;
      if (imageUrl.startsWith('data:')) {
        const base64 = imageUrl.replace(/^data:image\/\w+;base64,/, '');
        const byteChars = atob(base64);
        const bytes = new Uint8Array(byteChars.length);
        for (let i = 0; i < byteChars.length; i++) bytes[i] = byteChars.charCodeAt(i);
        const blob = new Blob([bytes], { type: 'image/png' });
        objectUrl = URL.createObjectURL(blob);
      } else {
        objectUrl = imageUrl;
      }

      const generatedAsset: MediaAsset = {
        id: crypto.randomUUID(),
        name: `AI Scene - ${aiPrompt.slice(0, 30)}`,
        type: 'image',
        url: objectUrl,
        thumbnailUrl: objectUrl,
      };
      onAddToTimeline(generatedAsset);
      toast.success('AI scene generated and added to timeline!');
      setAiPrompt('');
    } catch (err: unknown) {
      console.error('AI scene generation error:', err);
      const msg = err instanceof Error ? err.message : 'Scene generation failed';
      if (msg.includes('Rate limit') || msg.includes('429')) {
        toast.error('Rate limit reached. Please wait a moment and try again.');
      } else if (msg.includes('credits') || msg.includes('402')) {
        toast.error('AI credits exhausted. Please add credits to continue.');
      } else {
        toast.error('Scene generation failed. Please try again.');
      }
    } finally {
      setIsGeneratingScene(false);
    }
  }, [aiPrompt, onAddToTimeline]);

  const filteredAssets = assets.filter(asset =>
    asset.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stockCategories = [
    { id: '', label: 'All' },
    { id: 'music', label: 'Music' },
    { id: 'sfx', label: 'SFX' },
    { id: 'ambient', label: 'Ambient' },
  ];

  return (
    <div className="h-full flex flex-col">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col">
        <TabsList className="w-full justify-start rounded-none border-b border-[#1A1A1A] bg-transparent p-0">
          <TabsTrigger 
            value="uploads" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#B89555]"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Uploads</span>
          </TabsTrigger>
          <TabsTrigger 
            value="stock"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#B89555]"
          >
            <Music className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Stock</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#B89555]"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-[#B89555]"
          >
            <LayoutTemplate className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="p-2 border-b border-[#1A1A1A]">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-[#1A1A1A]/50 border-[#1A1A1A] text-sm"
              onKeyDown={(e) => e.key === 'Enter' && activeTab === 'stock' && handleStockSearch()}
            />
          </div>
        </div>

        <ScrollArea className="flex-1">
          {/* Uploads Tab */}
          <TabsContent value="uploads" className="mt-0 p-2">
            {/* Upload Zone */}
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="border-2 border-dashed border-[#1A1A1A] hover:border-[#B89555]/50 rounded-lg p-4 text-center cursor-pointer transition-colors mb-3"
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="video/*,audio/*,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
              {isUploading ? (
                <div className="space-y-2">
                  <Loader2 className="w-8 h-8 mx-auto text-[#1A1A1A] animate-spin" />
                  <p className="text-sm text-[#1A1A1A]/70">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-[#1A1A1A]/70 mb-2" />
                  <p className="text-xs text-[#1A1A1A]/70">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-[#1A1A1A]/70 mt-1">
                    MP4, MOV, WebM, MP3, WAV, JPG, PNG
                  </p>
                </>
              )}
            </div>

            {/* Asset Grid */}
            <div className="grid grid-cols-2 gap-2">
              {filteredAssets.map((asset) => (
                <AssetCard
                  key={asset.id}
                  asset={asset}
                  onAdd={() => onAddToTimeline(asset)}
                  onDelete={() => onDeleteAsset(asset.id)}
                  onPreview={() => setPreviewAsset(asset)}
                />
              ))}
            </div>

            {filteredAssets.length === 0 && !isUploading && (
              <p className="text-center text-[#1A1A1A]/70 text-sm py-8">
                No media uploaded yet
              </p>
            )}
          </TabsContent>

          {/* Stock Tab */}
          <TabsContent value="stock" className="mt-0 p-2">
            {/* Categories */}
            <div className="flex flex-wrap gap-1 mb-3">
              {stockCategories.map((cat) => (
                <Button
                  key={cat.id}
                  size="sm"
                  onClick={() => {
                    setStockCategory(cat.id);
                    onLoadStock(cat.id || undefined, searchQuery || undefined);
                  }}
                  className={
                    stockCategory === cat.id
                      ? 'bg-amber-500 text-[#1A1A1A] hover:bg-amber-400 h-7 text-xs font-semibold border border-amber-500'
                      : 'bg-[#1A1A1A] text-white hover:text-white hover:bg-[#1A1A1A] h-7 text-xs border border-[#B89555]/30'
                  }
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {isLoadingStock ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-[#1A1A1A] animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {stockAssets.map((asset) => (
                  <AssetCard
                    key={asset.id}
                    asset={asset}
                    onAdd={() => onAddToTimeline(asset)}
                    onPreview={() => setPreviewAsset(asset)}
                    isStock
                  />
                ))}
              </div>
            )}

            {!isLoadingStock && stockAssets.length === 0 && (
              <p className="text-center text-[#1A1A1A]/70 text-sm py-8">
                No stock assets found
              </p>
            )}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="mt-0 p-2">
            <div className="space-y-3">
              <div className="p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A]">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Scene Generator
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 mb-3">
                  Generate cinematic scenes from text prompts using AI
                </p>
                <textarea
                  value={aiPrompt}
                  onChange={e => setAiPrompt(e.target.value)}
                  placeholder="Describe your scene... e.g. Luxury villa pool at sunset, Dubai skyline, aerial view"
                  className="w-full bg-[#1A1A1A] border border-[#B89555]/30 rounded-lg px-3 py-2 text-xs text-white resize-none focus:outline-none focus:border-amber-500/60 placeholder-slate-500 mb-2"
                  rows={3}
                />
                <Button 
                  size="sm" 
                  className="w-full bg-amber-500 text-[#1A1A1A] hover:bg-amber-400 font-semibold"
                  onClick={handleGenerateScene}
                  disabled={isGeneratingScene}
                >
                  {isGeneratingScene
                    ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Generating…</>
                    : <><Wand2 className="w-4 h-4 mr-2" />Generate Scene</>
                  }
                </Button>
              </div>

              <div className="p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A]">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  AI Voiceover
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 mb-3">
                  Generate professional voiceovers with AI voices
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 border border-[#B89555]"
                  onClick={() => toast.info('Open the Voice Suite from the Toolkit to create professional voiceovers with AI!')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Voiceover
                </Button>
              </div>

              <div className="p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A]">
                <h4 className="text-sm font-medium text-[#1A1A1A] mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  AI SFX Command
                </h4>
                <p className="text-xs text-[#1A1A1A]/70 mb-3">
                  Add sounds with natural language commands
                </p>
                <Input
                  placeholder="Add applause at 00:12..."
                  className="h-8 bg-[#1A1A1A] border-[#1A1A1A] text-sm mb-2"
                />
                <Button 
                  size="sm" 
                  className="w-full bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 border border-[#B89555]"
                  onClick={() => toast.info('AI SFX command coming soon! Browse the Stock tab for available sound effects.')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Apply Command
                </Button>
              </div>
            </div>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="mt-0 p-2">
            <div className="space-y-3">
              <div className="p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A] cursor-pointer hover:border-[#B89555]/50 transition-colors">
                <h4 className="text-sm font-medium text-white mb-1">JBJ Lower Third</h4>
                <p className="text-xs text-[#1A1A1A]/70">Luxury branded name tag overlay</p>
              </div>
              <div className="p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A] cursor-pointer hover:border-[#B89555]/50 transition-colors">
                <h4 className="text-sm font-medium text-white mb-1">Property Intro</h4>
                <p className="text-xs text-[#1A1A1A]/70">Animated property showcase intro</p>
              </div>
              <div className="p-3 bg-[#1A1A1A]/50 rounded-lg border border-[#1A1A1A] cursor-pointer hover:border-[#B89555]/50 transition-colors">
                <h4 className="text-sm font-medium text-white mb-1">Call to Action</h4>
                <p className="text-xs text-[#1A1A1A]/70">Contact info with gold accents</p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-[#1A1A1A]/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
          <div className="bg-[#1A1A1A] rounded-lg max-w-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">{previewAsset.name}</h3>
              <Button size="sm" variant="ghost" onClick={() => setPreviewAsset(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            {previewAsset.type === 'video' && (
              <video src={previewAsset.url} controls className="w-full rounded" />
            )}
            {previewAsset.type === 'audio' && (
              <audio src={previewAsset.url} controls className="w-full" />
            )}
            {previewAsset.type === 'image' && (
              <img src={previewAsset.url} alt={previewAsset.name} className="w-full rounded"  loading="lazy" decoding="async" />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPreviewAsset(null)}>
                Cancel
              </Button>
              <Button 
                className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
                onClick={() => {
                  onAddToTimeline(previewAsset);
                  setPreviewAsset(null);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add to Timeline
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

interface AssetCardProps {
  asset: MediaAsset | StockAsset;
  onAdd: () => void;
  onDelete?: () => void;
  onPreview: () => void;
  isStock?: boolean;
}

function AssetCard({ asset, onAdd, onDelete, onPreview, isStock }: AssetCardProps) {
  const getIconBg = () => {
    switch (asset.type) {
      case 'video': return { icon: <Film className="w-8 h-8 text-blue-300" />, bg: 'bg-blue-900/70 border border-blue-700/50' };
      case 'audio': return { icon: <Music className="w-8 h-8 text-amber-300" />, bg: 'bg-amber-900/70 border border-amber-700/50' };
      case 'image': return { icon: <Image className="w-8 h-8 text-[color:var(--emerald-on)]" />, bg: 'jj-surface-emerald/70 border border-[color:var(--emerald-1)]/30/50' };
      default:      return { icon: <Film className="w-8 h-8 text-[#1A1A1A]/70" />, bg: 'bg-[#1A1A1A] border border-[#B89555]/30' };
    }
  };
  const { icon, bg } = getIconBg();

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group relative bg-[#1A1A1A]/50 rounded-lg overflow-hidden border border-[#1A1A1A] hover:border-[#B89555]/50 transition-colors">
      {/* Thumbnail */}
      <div 
        className={`aspect-video flex items-center justify-center cursor-pointer ${asset.thumbnailUrl ? 'bg-[#1A1A1A]' : bg}`}
        onClick={onPreview}
      >
        {asset.thumbnailUrl ? (
          <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover"  loading="lazy" decoding="async" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            {icon}
            <span className="text-xs text-[#1A1A1A]/70 capitalize">{asset.type}</span>
          </div>
        )}
        
        {/* Duration Badge */}
        {asset.duration && (
          <span className="absolute bottom-8 right-1 bg-[#1A1A1A]/70 text-white text-xs px-1 rounded">
            {formatDuration(asset.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-1.5">
        <p className="text-xs text-[#1A1A1A]/70 truncate">{asset.name}</p>
      </div>

      {/* Actions Overlay */}
      <div className="absolute inset-0 bg-[#1A1A1A]/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="sm"
          className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90 h-7 text-xs"
          onClick={onAdd}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
        <Button
          size="sm"
          className="bg-[#1A1A1A] text-white hover:bg-[#1A1A1A] h-7 text-xs border border-[#B89555]/30"
          onClick={onPreview}
        >
          <Play className="w-3 h-3 mr-1" />
          Preview
        </Button>
        {onDelete && !isStock && (
          <Button
            size="sm"
            variant="ghost"
            className="text-red-400 hover:text-red-300 h-7"
            onClick={onDelete}
          >
            <X className="w-3 h-3" />
          </Button>
        )}
      </div>
    </div>
  );
}
