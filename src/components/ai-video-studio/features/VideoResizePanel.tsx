import React, { useState, useCallback } from 'react';
import { 
  Smartphone, 
  Monitor, 
  Square, 
  Video,
  CheckCircle2,
  Upload,
  Download,
  Loader2,
  AlertCircle,
  Cpu,
  Cloud
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useVideoProcessor, ResizeJob } from '@/hooks/useVideoProcessor';

const EXPORT_FORMATS = [
  { id: 'reels', name: 'Reels/TikTok', aspect: '9:16', width: 1080, height: 1920, icon: Smartphone },
  { id: 'youtube', name: 'YouTube', aspect: '16:9', width: 1920, height: 1080, icon: Monitor },
  { id: 'feed', name: 'Feed Square', aspect: '1:1', width: 1080, height: 1080, icon: Square },
  { id: 'portrait', name: 'IG Portrait', aspect: '4:5', width: 1080, height: 1350, icon: Smartphone },
];

export function VideoResizePanel() {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    width: number;
    height: number;
    duration: number;
    aspectRatio: string;
  } | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['reels', 'youtube']);
  const [smartFraming, setSmartFraming] = useState(true);

  const {
    isLoading,
    progress,
    resizeJobs,
    batchResize,
    getMetadata,
    clearJobs,
  } = useVideoProcessor();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedVideo(file);
      clearJobs();
      
      try {
        const metadata = await getMetadata(file);
        setVideoMetadata(metadata);
        toast.success('Video loaded! Ready for processing.');
      } catch (error) {
        toast.error('Failed to read video metadata');
      }
    }
  }, [getMetadata, clearJobs]);

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev => 
      prev.includes(formatId) 
        ? prev.filter(f => f !== formatId)
        : [...prev, formatId]
    );
  };

  const handleResize = useCallback(async () => {
    if (!uploadedVideo || selectedFormats.length === 0) {
      toast.error('Please upload a video and select formats');
      return;
    }

    const formats = selectedFormats.map(id => {
      const format = EXPORT_FORMATS.find(f => f.id === id)!;
      return {
        id: format.id,
        width: format.width,
        height: format.height,
        aspectRatio: format.aspect,
      };
    });

    await batchResize(uploadedVideo, formats);
  }, [uploadedVideo, selectedFormats, batchResize]);

  const downloadResult = useCallback((job: ResizeJob) => {
    if (!job.outputUrl) return;
    
    const a = document.createElement('a');
    a.href = job.outputUrl;
    a.download = `video_${job.aspectRatio.replace(':', 'x')}.mp4`;
    a.click();
    
    toast.success(`Downloaded ${job.aspectRatio} version`);
  }, []);

  const downloadAll = useCallback(() => {
    const completedJobs = resizeJobs.filter(j => j.status === 'completed' && j.outputUrl);
    
    completedJobs.forEach((job, index) => {
      setTimeout(() => {
        const a = document.createElement('a');
        a.href = job.outputUrl!;
        a.download = `video_${job.aspectRatio.replace(':', 'x')}.mp4`;
        a.click();
      }, index * 500);
    });
    
    toast.success(`Downloading ${completedJobs.length} videos...`);
  }, [resizeJobs]);

  const completedCount = resizeJobs.filter(j => j.status === 'completed').length;
  const hasCompletedJobs = completedCount > 0;

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-gold" />
          <h3 className="text-sm font-medium text-white">Video Resize</h3>
        </div>
        <p className="text-xs text-slate-500 mt-1">Real FFmpeg processing - resize for all platforms</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-4">
        {/* Upload Section */}
        {!uploadedVideo ? (
          <div
            className="border-2 border-dashed border-slate-700 rounded-lg p-6 text-center hover:border-gold/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById('resize-video-input')?.click()}
          >
            <Upload className="h-8 w-8 text-slate-500 mx-auto mb-2" />
            <p className="text-sm text-white mb-1">Upload Video</p>
            <p className="text-xs text-slate-500">MP4, MOV, WebM (max 500MB)</p>
            <input
              id="resize-video-input"
              type="file"
              accept="video/*"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
        ) : (
          <div className="p-3 rounded-lg bg-slate-800 space-y-2">
            <div className="flex items-center gap-3">
              <Video className="h-5 w-5 text-gold flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white truncate">{uploadedVideo.name}</p>
                <p className="text-xs text-slate-500">
                  {(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB
                  {videoMetadata && (
                    <> • {videoMetadata.width}x{videoMetadata.height} • {videoMetadata.duration.toFixed(1)}s</>
                  )}
                </p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
            </div>
            
            {/* Processing Mode Indicator */}
            <div className="flex items-center gap-2 text-xs text-slate-400">
              {uploadedVideo.size < 100 * 1024 * 1024 ? (
                <>
                  <Cpu className="w-3 h-3 text-blue-400" />
                  <span>Client-side processing (fast)</span>
                </>
              ) : (
                <>
                  <Cloud className="w-3 h-3 text-purple-400" />
                  <span>Cloud processing (for large files)</span>
                </>
              )}
            </div>
          </div>
        )}

        {/* Smart Framing Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg">
          <div>
            <Label className="text-sm text-white">Smart Framing</Label>
            <p className="text-xs text-slate-500">Auto-crop to keep content centered</p>
          </div>
          <Switch
            checked={smartFraming}
            onCheckedChange={setSmartFraming}
          />
        </div>

        {/* Format Selection */}
        <div>
          <h4 className="text-xs font-medium text-slate-400 mb-2">Export Formats</h4>
          <div className="space-y-2">
            {EXPORT_FORMATS.map((format) => (
              <div
                key={format.id}
                onClick={() => !isLoading && toggleFormat(format.id)}
                className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-all ${
                  selectedFormats.includes(format.id)
                    ? 'bg-gold/20 border border-gold/50'
                    : 'bg-slate-800 border border-transparent hover:border-slate-600'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Checkbox 
                  checked={selectedFormats.includes(format.id)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-gold data-[state=checked]:border-gold"
                />
                <format.icon className="h-4 w-4 text-slate-400" />
                <div className="flex-1">
                  <p className="text-sm text-white">{format.name}</p>
                  <p className="text-xs text-slate-500">{format.aspect} ({format.width}x{format.height})</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Processing Progress */}
        {isLoading && progress && (
          <div className="p-3 bg-slate-800/50 rounded-lg space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-gold animate-spin" />
              <span className="text-sm text-white">{progress.message}</span>
            </div>
            <Progress value={progress.percent} className="h-2" />
          </div>
        )}

        {/* Job Results */}
        {resizeJobs.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-slate-400">Results</h4>
            {resizeJobs.map((job) => (
              <div
                key={job.id}
                className={`p-2 rounded-lg border ${
                  job.status === 'completed'
                    ? 'bg-green-500/10 border-green-500/30'
                    : job.status === 'failed'
                    ? 'bg-red-500/10 border-red-500/30'
                    : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                    {job.status === 'failed' && <AlertCircle className="w-4 h-4 text-red-500" />}
                    {job.status === 'processing' && <Loader2 className="w-4 h-4 text-gold animate-spin" />}
                    <span className="text-sm text-white">{job.aspectRatio}</span>
                    <span className="text-xs text-slate-500">
                      {job.targetWidth}x{job.targetHeight}
                    </span>
                  </div>
                  
                  {job.status === 'completed' && job.outputUrl && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => downloadResult(job)}
                      className="h-7 text-gold hover:text-gold/80"
                    >
                      <Download className="w-3 h-3 mr-1" />
                      Download
                    </Button>
                  )}
                </div>
                
                {job.status === 'processing' && (
                  <Progress value={job.progress} className="h-1 mt-2" />
                )}
                
                {job.status === 'failed' && job.error && (
                  <p className="text-xs text-red-400 mt-1">{job.error}</p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        {uploadedVideo && (
          <div className="space-y-2">
            <Button
              className="w-full bg-gold text-black hover:bg-gold/90"
              onClick={handleResize}
              disabled={isLoading || selectedFormats.length === 0}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                `Resize to ${selectedFormats.length} Format${selectedFormats.length !== 1 ? 's' : ''}`
              )}
            </Button>
            
            {hasCompletedJobs && (
              <Button
                className="w-full bg-green-600 text-white hover:bg-green-700"
                onClick={downloadAll}
              >
                <Download className="w-4 h-4 mr-2" />
                Download All ({completedCount})
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
