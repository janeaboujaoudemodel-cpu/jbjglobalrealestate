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
  X
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
        <TabsList className="w-full justify-start rounded-none border-b border-slate-800 bg-transparent p-0">
          <TabsTrigger 
            value="uploads" 
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Uploads</span>
          </TabsTrigger>
          <TabsTrigger 
            value="stock"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <Music className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Stock</span>
          </TabsTrigger>
          <TabsTrigger 
            value="ai"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <Wand2 className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">AI</span>
          </TabsTrigger>
          <TabsTrigger 
            value="templates"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-gold data-[state=active]:text-gold"
          >
            <LayoutTemplate className="w-4 h-4 mr-1" />
            <span className="hidden lg:inline">Templates</span>
          </TabsTrigger>
        </TabsList>

        {/* Search */}
        <div className="p-2 border-b border-slate-800">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8 h-8 bg-slate-800/50 border-slate-700 text-sm"
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
              className="border-2 border-dashed border-slate-700 hover:border-gold/50 rounded-lg p-4 text-center cursor-pointer transition-colors mb-3"
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
                  <Loader2 className="w-8 h-8 mx-auto text-gold animate-spin" />
                  <p className="text-sm text-slate-400">Uploading... {Math.round(uploadProgress)}%</p>
                </div>
              ) : (
                <>
                  <Upload className="w-8 h-8 mx-auto text-slate-500 mb-2" />
                  <p className="text-xs text-slate-400">
                    Drop files here or click to upload
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
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
              <p className="text-center text-slate-500 text-sm py-8">
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
                  variant={stockCategory === cat.id ? 'default' : 'ghost'}
                  onClick={() => {
                    setStockCategory(cat.id);
                    onLoadStock(cat.id || undefined, searchQuery || undefined);
                  }}
                  className={
                    stockCategory === cat.id
                      ? 'bg-gold text-black hover:bg-gold/90 h-7 text-xs'
                      : 'text-slate-400 hover:text-white h-7 text-xs'
                  }
                >
                  {cat.label}
                </Button>
              ))}
            </div>

            {isLoadingStock ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-6 h-6 text-gold animate-spin" />
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
              <p className="text-center text-slate-500 text-sm py-8">
                No stock assets found
              </p>
            )}
          </TabsContent>

          {/* AI Tab */}
          <TabsContent value="ai" className="mt-0 p-2">
            <div className="space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-gold mb-2 flex items-center gap-2">
                  <Film className="w-4 h-4" />
                  AI B-Roll Generator
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Generate cinematic drone-style footage from text prompts
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-gold text-black hover:bg-gold/90 border border-gold"
                  onClick={() => toast.info('AI Scene Generator coming soon! Use the Photos tab to upload your own images.')}
                >
                  <Wand2 className="w-4 h-4 mr-2" />
                  Generate Scene
                </Button>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-gold mb-2 flex items-center gap-2">
                  <Mic className="w-4 h-4" />
                  AI Voiceover
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Generate professional voiceovers with AI voices
                </p>
                <Button 
                  size="sm" 
                  className="w-full bg-gold text-black hover:bg-gold/90 border border-gold"
                  onClick={() => toast.info('Open the Voice Suite from the Toolkit to create professional voiceovers with AI!')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Voiceover
                </Button>
              </div>

              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700">
                <h4 className="text-sm font-medium text-gold mb-2 flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  AI SFX Command
                </h4>
                <p className="text-xs text-slate-400 mb-3">
                  Add sounds with natural language commands
                </p>
                <Input
                  placeholder="Add applause at 00:12..."
                  className="h-8 bg-slate-800 border-slate-700 text-sm mb-2"
                />
                <Button 
                  size="sm" 
                  className="w-full bg-gold text-black hover:bg-gold/90 border border-gold"
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
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:border-gold/50 transition-colors">
                <h4 className="text-sm font-medium text-white mb-1">JBJ Lower Third</h4>
                <p className="text-xs text-slate-400">Luxury branded name tag overlay</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:border-gold/50 transition-colors">
                <h4 className="text-sm font-medium text-white mb-1">Property Intro</h4>
                <p className="text-xs text-slate-400">Animated property showcase intro</p>
              </div>
              <div className="p-3 bg-slate-800/50 rounded-lg border border-slate-700 cursor-pointer hover:border-gold/50 transition-colors">
                <h4 className="text-sm font-medium text-white mb-1">Call to Action</h4>
                <p className="text-xs text-slate-400">Contact info with gold accents</p>
              </div>
            </div>
          </TabsContent>
        </ScrollArea>
      </Tabs>

      {/* Preview Modal */}
      {previewAsset && (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setPreviewAsset(null)}>
          <div className="bg-slate-900 rounded-lg max-w-2xl w-full p-4" onClick={(e) => e.stopPropagation()}>
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
              <img src={previewAsset.url} alt={previewAsset.name} className="w-full rounded" />
            )}
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="ghost" onClick={() => setPreviewAsset(null)}>
                Cancel
              </Button>
              <Button 
                className="bg-gold text-black hover:bg-gold/90"
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
  const getIcon = () => {
    switch (asset.type) {
      case 'video':
        return <Film className="w-6 h-6" />;
      case 'audio':
        return <Music className="w-6 h-6" />;
      case 'image':
        return <Image className="w-6 h-6" />;
      default:
        return <Film className="w-6 h-6" />;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="group relative bg-slate-800/50 rounded-lg overflow-hidden border border-slate-700 hover:border-gold/50 transition-colors">
      {/* Thumbnail */}
      <div 
        className="aspect-video bg-slate-800 flex items-center justify-center cursor-pointer"
        onClick={onPreview}
      >
        {asset.thumbnailUrl ? (
          <img src={asset.thumbnailUrl} alt={asset.name} className="w-full h-full object-cover" />
        ) : (
          <div className="text-slate-500">{getIcon()}</div>
        )}
        
        {/* Duration Badge */}
        {asset.duration && (
          <span className="absolute bottom-8 right-1 bg-black/70 text-white text-xs px-1 rounded">
            {formatDuration(asset.duration)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-1.5">
        <p className="text-xs text-slate-300 truncate">{asset.name}</p>
      </div>

      {/* Actions Overlay */}
      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
        <Button
          size="sm"
          className="bg-gold text-black hover:bg-gold/90 h-7 text-xs"
          onClick={onAdd}
        >
          <Plus className="w-3 h-3 mr-1" />
          Add
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-white h-7 text-xs"
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
