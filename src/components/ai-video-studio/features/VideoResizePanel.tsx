import React, { useState } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Square, 
  Video,
  CheckCircle2,
  Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

const EXPORT_FORMATS = [
  { id: 'reels', name: 'Reels/TikTok', aspect: '9:16', icon: Smartphone },
  { id: 'youtube', name: 'YouTube', aspect: '16:9', icon: Monitor },
  { id: 'feed', name: 'Feed Square', aspect: '1:1', icon: Square },
  { id: 'portrait', name: 'IG Portrait', aspect: '4:5', icon: Smartphone },
];

export function VideoResizePanel() {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['reels', 'youtube']);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedVideo(file);
      toast.success('Video uploaded!');
    }
  };

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const handleResize = () => {
    if (!uploadedVideo || selectedFormats.length === 0) {
      toast.error('Please upload a video and select formats');
      return;
    }
    setIsProcessing(true);
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false);
      toast.success(`Created ${selectedFormats.length} video versions!`);
    }, 2000);
  };

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium text-white">Video Resize</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">Resize for all platforms at once</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Upload */}
        {!uploadedVideo ? (
          <div
            className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-gold/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('resize-video-input')?.click()}
          >
            <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-white mb-1">Upload Video</p>
            <p className="text-xs text-slate-500">MP4, MOV, WebM</p>
            <input
              id="resize-video-input"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-800 flex items-center gap-3">
            <Video className="h-5 w-5 text-gold" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-white truncate">{uploadedVideo.name}</p>
              <p className="text-xs text-slate-500">
                {(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB
              </p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </div>
        )}

        {/* Formats */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Export Formats</h4>
          <div className="space-y-2">
            {EXPORT_FORMATS.map((format) => (
              <div
                key={format.id}
                onClick={() => toggleFormat(format.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormats.includes(format.id)
                    ? 'bg-gold/20 border border-gold/50'
                    : 'bg-slate-800 border border-transparent hover:border-slate-600'
                }`}
              >
                <Checkbox 
                  checked={selectedFormats.includes(format.id)}
                  className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <format.icon className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm text-white">{format.name}</p>
                  <p className="text-xs text-slate-500">{format.aspect}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Resize Button */}
        {uploadedVideo && (
          <Button
            className="w-full bg-gold text-black hover:bg-gold/90"
            onClick={handleResize}
            disabled={isProcessing || selectedFormats.length === 0}
          >
            {isProcessing ? 'Processing...' : `Resize to ${selectedFormats.length} Formats`}
          </Button>
        )}
      </div>
    </div>
  );
}
