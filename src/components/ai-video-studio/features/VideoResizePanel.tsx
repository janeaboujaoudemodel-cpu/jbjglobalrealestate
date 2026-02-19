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
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useVideoProcessor, ResizeJob } from '@/hooks/useVideoProcessor';

const EXPORT_FORMATS = [
  { id: 'reels',    name: 'Reels / TikTok', aspect: '9:16',  width: 1080, height: 1920, icon: Smartphone },
  { id: 'youtube',  name: 'YouTube',         aspect: '16:9', width: 1920, height: 1080, icon: Monitor },
  { id: 'feed',     name: 'Feed Square',     aspect: '1:1',  width: 1080, height: 1080, icon: Square },
  { id: 'portrait', name: 'IG Portrait',     aspect: '4:5',  width: 1080, height: 1350, icon: Smartphone },
];

export function VideoResizePanel() {
  const [uploadedVideo, setUploadedVideo] = useState<File | null>(null);
  const [videoMetadata, setVideoMetadata] = useState<{
    width: number; height: number; duration: number; aspectRatio: string;
  } | null>(null);
  const [selectedFormats, setSelectedFormats] = useState<string[]>(['reels', 'youtube']);
  const [smartFraming, setSmartFraming] = useState(true);

  const { isLoading, progress, resizeJobs, batchResize, getMetadata, clearJobs } = useVideoProcessor();

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('video/')) {
      setUploadedVideo(file);
      clearJobs();
      try {
        const metadata = await getMetadata(file);
        setVideoMetadata(metadata);
        toast.success('Video loaded — ready to resize!');
      } catch {
        toast.error('Failed to read video metadata');
      }
    }
  }, [getMetadata, clearJobs]);

  const toggleFormat = (formatId: string) => {
    setSelectedFormats(prev =>
      prev.includes(formatId) ? prev.filter(f => f !== formatId) : [...prev, formatId]
    );
  };

  const handleResize = useCallback(async () => {
    if (!uploadedVideo || selectedFormats.length === 0) {
      toast.error('Upload a video and select at least one format');
      return;
    }
    const formats = selectedFormats.map(id => {
      const format = EXPORT_FORMATS.find(f => f.id === id)!;
      return { id: format.id, width: format.width, height: format.height, aspectRatio: format.aspect };
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
    <div className="h-full flex flex-col bg-slate-900 text-white">
      {/* Header */}
      <div className="p-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-amber-400" />
          <h3 className="text-sm font-semibold text-white">Video Resize</h3>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">Select formats — applies to the active clip on your timeline</p>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-3">
        {/* Format Selection — always visible first */}
        <div>
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Export Formats</h4>
          <div className="space-y-1.5">
            {EXPORT_FORMATS.map((format) => (
              <div
                key={format.id}
                onClick={() => !isLoading && toggleFormat(format.id)}
                className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-all border ${
                  selectedFormats.includes(format.id)
                    ? 'bg-amber-500/10 border-amber-500/40'
                    : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <Checkbox
                  checked={selectedFormats.includes(format.id)}
                  disabled={isLoading}
                  className="data-[state=checked]:bg-amber-500 data-[state=checked]:border-amber-500"
                />
                <format.icon className={`h-4 w-4 ${selectedFormats.includes(format.id) ? 'text-amber-400' : 'text-slate-400'}`} />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-white">{format.name}</p>
                  <p className="text-[10px] text-slate-500">{format.aspect} · {format.width}×{format.height}px</p>
                </div>
                {selectedFormats.includes(format.id) && (
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Smart Framing Toggle */}
        <div className="flex items-center justify-between p-3 bg-slate-800 rounded-lg border border-slate-700">
          <div>
            <Label className="text-xs font-semibold text-white">Smart Framing</Label>
            <p className="text-[10px] text-slate-500 mt-0.5">AI keeps subject centered when cropping</p>
          </div>
          <Switch checked={smartFraming} onCheckedChange={setSmartFraming} />
        </div>

        {/* Source Upload — secondary option */}
        <div>
          <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-2">Upload Source (Optional)</h4>
          {!uploadedVideo ? (
            <div
              className="border border-dashed border-slate-700 rounded-lg p-4 text-center hover:border-amber-500/40 transition-colors cursor-pointer"
              onClick={() => document.getElementById('resize-video-input')?.click()}
            >
              <Upload className="h-5 w-5 text-slate-500 mx-auto mb-1.5" />
              <p className="text-xs text-slate-300">Upload a separate video to process</p>
              <p className="text-[10px] text-slate-500 mt-0.5">MP4, MOV, WebM · max 500MB</p>
              <input id="resize-video-input" type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
            </div>
          ) : (
            <div className="p-2.5 rounded-lg bg-slate-800 border border-slate-700 space-y-1.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-white truncate font-medium">{uploadedVideo.name}</p>
                  <p className="text-[10px] text-slate-500">
                    {(uploadedVideo.size / 1024 / 1024).toFixed(1)} MB
                    {videoMetadata && ` · ${videoMetadata.width}×${videoMetadata.height} · ${videoMetadata.duration.toFixed(1)}s`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                {uploadedVideo.size < 100 * 1024 * 1024
                  ? <><Cpu className="w-3 h-3 text-blue-400" /><span>Client-side (fast)</span></>
                  : <><Cloud className="w-3 h-3 text-purple-400" /><span>Cloud processing</span></>
                }
              </div>
            </div>
          )}
        </div>

        {/* Processing Progress */}
        {isLoading && progress && (
          <div className="p-3 bg-slate-800 rounded-lg border border-slate-700 space-y-2">
            <div className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs text-white">{progress.message}</span>
            </div>
            <Progress value={progress.percent} className="h-1.5" />
          </div>
        )}

        {/* Job Results */}
        {resizeJobs.length > 0 && (
          <div className="space-y-1.5">
            <h4 className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Results</h4>
            {resizeJobs.map((job) => (
              <div
                key={job.id}
                className={`p-2.5 rounded-lg border ${
                  job.status === 'completed' ? 'bg-green-500/10 border-green-500/30'
                  : job.status === 'failed'  ? 'bg-red-500/10 border-red-500/30'
                  : 'bg-slate-800 border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {job.status === 'completed' && <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />}
                    {job.status === 'failed'    && <AlertCircle   className="w-3.5 h-3.5 text-red-500"   />}
                    {job.status === 'processing'&& <Loader2        className="w-3.5 h-3.5 text-amber-400 animate-spin" />}
                    <span className="text-xs text-white font-medium">{job.aspectRatio}</span>
                    <span className="text-[10px] text-slate-500">{job.targetWidth}×{job.targetHeight}</span>
                  </div>
                  {job.status === 'completed' && job.outputUrl && (
                    <button
                      onClick={() => downloadResult(job)}
                      className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-semibold"
                    >
                      <Download className="w-3 h-3" />
                      Download
                    </button>
                  )}
                </div>
                {job.status === 'processing' && <Progress value={job.progress} className="h-1 mt-2" />}
                {job.status === 'failed' && job.error && <p className="text-[10px] text-red-400 mt-1">{job.error}</p>}
              </div>
            ))}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pb-2">
          <Button
            className="w-full bg-amber-500 text-black hover:bg-amber-400 font-bold text-xs h-9"
            onClick={handleResize}
            disabled={isLoading || selectedFormats.length === 0 || !uploadedVideo}
          >
            {isLoading ? (
              <><Loader2 className="w-3.5 h-3.5 mr-2 animate-spin" />Processing...</>
            ) : !uploadedVideo ? (
              'Upload a video above to resize'
            ) : (
              `Resize to ${selectedFormats.length} Format${selectedFormats.length !== 1 ? 's' : ''}`
            )}
          </Button>
          {hasCompletedJobs && (
            <Button
              className="w-full bg-green-600 text-white hover:bg-green-700 text-xs h-9"
              onClick={downloadAll}
            >
              <Download className="w-3.5 h-3.5 mr-2" />
              Download All ({completedCount})
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
