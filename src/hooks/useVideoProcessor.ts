// JBJ AI Video Studio - Video Processing Hook (Hybrid: Client + Backend)
import { useState, useCallback } from 'react';
import { ffmpegService, ProcessingProgress } from '@/lib/ffmpeg/ffmpegService';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface ResizeJob {
  id: string;
  sourceFile: File;
  targetWidth: number;
  targetHeight: number;
  aspectRatio: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  outputBlob?: Blob;
  outputUrl?: string;
  error?: string;
}

export interface ExportJob {
  id: string;
  format: string;
  status: 'pending' | 'processing' | 'uploading' | 'completed' | 'failed';
  progress: number;
  outputUrl?: string;
  error?: string;
}

const LARGE_FILE_THRESHOLD = 100 * 1024 * 1024; // 100MB - use backend for larger files

export function useVideoProcessor() {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState<ProcessingProgress | null>(null);
  const [resizeJobs, setResizeJobs] = useState<ResizeJob[]>([]);
  const [exportJobs, setExportJobs] = useState<ExportJob[]>([]);

  // Client-side resize for quick operations
  const resizeVideoClientSide = useCallback(async (
    file: File,
    targetWidth: number,
    targetHeight: number,
    aspectRatio: string,
    smartFraming: boolean = true
  ): Promise<Blob> => {
    setIsLoading(true);
    setProgress({ percent: 0, stage: 'loading', message: 'Preparing...' });

    try {
      const blob = await ffmpegService.resizeVideo(
        {
          sourceFile: file,
          targetWidth,
          targetHeight,
          aspectRatio,
          smartFraming,
          format: 'mp4',
          quality: 'medium',
        },
        setProgress
      );

      toast.success('Video resized successfully!');
      return blob;
    } catch (error) {
      console.error('Client-side resize failed:', error);
      toast.error('Failed to resize video');
      throw error;
    } finally {
      setIsLoading(false);
      setProgress(null);
    }
  }, []);

  // Backend processing - now returns transform params for client-side encoding
  const exportVideoBackend = useCallback(async (
    file: File,
    presets: string[],
    projectId?: string
  ): Promise<string[]> => {
    setIsLoading(true);

    const urls: string[] = [];

    for (const preset of presets) {
      const jobId = crypto.randomUUID();
      
      setExportJobs(prev => [...prev, {
        id: jobId,
        format: preset,
        status: 'uploading',
        progress: 0,
      }]);

      try {
        // Get current user for ownership path
        const { data: { session } } = await supabase.auth.getSession();
        if (!session?.user?.id) {
          throw new Error('Authentication required for video processing');
        }
        const userId = session.user.id;

        // Upload source file to storage - path includes userId for ownership
        const fileName = `video-export/${userId}/${jobId}/source${file.name.substring(file.name.lastIndexOf('.'))}`;
        
        const { error: uploadError } = await supabase.storage
          .from('video-processing-temp')
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('video-processing-temp')
          .getPublicUrl(fileName);

        // Call backend for transformation parameters (NOT actual processing)
        setExportJobs(prev => prev.map(j => 
          j.id === jobId ? { ...j, status: 'processing', progress: 20 } : j
        ));

        const metadata = await ffmpegService.getVideoMetadata(file);
        const presetConfig = getPresetConfig(preset);

        const response = await supabase.functions.invoke('video-resize-process', {
          body: {
            sourceUrl: urlData.publicUrl,
            sourcePath: fileName,
            targetWidth: presetConfig.width,
            targetHeight: presetConfig.height,
            targetAspect: presetConfig.aspectRatio,
            targetOutput: preset,
            smartFraming: true,
            originalWidth: metadata.width,
            originalHeight: metadata.height,
          },
        });

        if (response.error) throw response.error;

        const responseData = response.data;

        // REQUIRE jobId - treat missing as error
        if (!responseData?.jobId) {
          throw new Error('Missing jobId from video-resize-process - cannot track job');
        }
        const backendJobId: string = responseData.jobId;

        // Check if backend returned requires_client_processing
        if (responseData.status === 'requires_client_processing') {
          // Backend gave us transform params - now do REAL client-side encoding
          setExportJobs(prev => prev.map(j => 
            j.id === jobId ? { 
              ...j, 
              status: 'processing', 
              progress: 30,
            } : j
          ));

          // Perform actual FFmpeg.wasm encoding
          const outputBlob = await ffmpegService.resizeVideo(
            {
              sourceFile: file,
              targetWidth: presetConfig.width,
              targetHeight: presetConfig.height,
              aspectRatio: presetConfig.aspectRatio,
              smartFraming: true,
              format: 'mp4',
              quality: 'medium',
            },
            (progress) => {
              setExportJobs(prev => prev.map(j => 
                j.id === jobId ? { ...j, progress: 30 + (progress.percent * 0.5) } : j
              ));
            }
          );

          // ========================================
          // UPLOAD OUTPUT TO STORAGE (PERSISTENT)
          // Always use backendJobId for consistent path
          // ========================================
          setExportJobs(prev => prev.map(j => 
            j.id === jobId ? { ...j, status: 'uploading', progress: 85 } : j
          ));

          // Path MUST include userId AND backendJobId for ownership validation
          const outputPath = `video-export/${userId}/${backendJobId}/output_${preset}.mp4`;
          
          const { error: outputUploadError } = await supabase.storage
            .from('video-processing-temp')
            .upload(outputPath, outputBlob, { 
              contentType: 'video/mp4', 
              upsert: true 
            });

          if (outputUploadError) {
            console.error('Failed to upload output:', outputUploadError);
            throw new Error(`Failed to upload processed video: ${outputUploadError.message}`);
          }

          // ========================================
          // MARK JOB AS COMPLETED IN DATABASE
          // Always call - backendJobId is guaranteed to exist
          // ========================================
          let signedUrl: string | null = null;
          try {
            const completeResponse = await supabase.functions.invoke('studio-job-complete', {
              body: {
                jobId: backendJobId,
                outputPath,
                status: 'completed',
              },
            });

            if (completeResponse.error) {
              console.warn('Failed to mark job as complete:', completeResponse.error);
            } else if (completeResponse.data?.outputUrl) {
              signedUrl = completeResponse.data.outputUrl;
            }
          } catch (completeError) {
            console.warn('Failed to mark job as complete:', completeError);
            // Non-fatal - output is still available
          }

          // Create object URL as immediate preview fallback
          const objectUrl = URL.createObjectURL(outputBlob);
          const finalUrl = signedUrl || objectUrl;

          setExportJobs(prev => prev.map(j => 
            j.id === jobId ? { 
              ...j, 
              status: 'completed', 
              progress: 100,
              outputUrl: finalUrl,
            } : j
          ));

          urls.push(finalUrl);
        } else if (responseData.outputUrl) {
          // Backend actually processed it (future: when using Mux/MediaConvert)
          setExportJobs(prev => prev.map(j => 
            j.id === jobId ? { 
              ...j, 
              status: 'completed', 
              progress: 100,
              outputUrl: responseData.outputUrl,
            } : j
          ));

          urls.push(responseData.outputUrl);
        } else {
          throw new Error('Invalid response from processing service');
        }

      } catch (error) {
        console.error('Export failed:', error);
        setExportJobs(prev => prev.map(j => 
          j.id === jobId ? { 
            ...j, 
            status: 'failed', 
            error: error instanceof Error ? error.message : 'Export failed',
          } : j
        ));
      }
    }

    setIsLoading(false);
    return urls;
  }, []);

  // Hybrid: Choose client or backend based on file size
  const processVideo = useCallback(async (
    file: File,
    targetWidth: number,
    targetHeight: number,
    aspectRatio: string,
    smartFraming: boolean = true
  ): Promise<{ blob?: Blob; url?: string; method: 'client' | 'backend' }> => {
    // Use client-side for smaller files (faster)
    if (file.size < LARGE_FILE_THRESHOLD) {
      const blob = await resizeVideoClientSide(file, targetWidth, targetHeight, aspectRatio, smartFraming);
      return { blob, method: 'client' };
    }

    // Use backend for larger files
    const urls = await exportVideoBackend(file, ['custom']);
    return { url: urls[0], method: 'backend' };
  }, [resizeVideoClientSide, exportVideoBackend]);

  // Batch resize to multiple formats
  const batchResize = useCallback(async (
    file: File,
    formats: Array<{ id: string; width: number; height: number; aspectRatio: string }>
  ): Promise<ResizeJob[]> => {
    const jobs: ResizeJob[] = formats.map(f => ({
      id: crypto.randomUUID(),
      sourceFile: file,
      targetWidth: f.width,
      targetHeight: f.height,
      aspectRatio: f.aspectRatio,
      status: 'pending' as const,
      progress: 0,
    }));

    setResizeJobs(jobs);

    // Process sequentially to avoid memory issues
    for (const job of jobs) {
      try {
        setResizeJobs(prev => prev.map(j => 
          j.id === job.id ? { ...j, status: 'processing' } : j
        ));

        const blob = await ffmpegService.resizeVideo(
          {
            sourceFile: file,
            targetWidth: job.targetWidth,
            targetHeight: job.targetHeight,
            aspectRatio: job.aspectRatio,
            smartFraming: true,
            format: 'mp4',
            quality: 'medium',
          },
          (progress) => {
            setResizeJobs(prev => prev.map(j => 
              j.id === job.id ? { ...j, progress: progress.percent } : j
            ));
          }
        );

        const url = URL.createObjectURL(blob);

        setResizeJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            status: 'completed', 
            progress: 100,
            outputBlob: blob,
            outputUrl: url,
          } : j
        ));

      } catch (error) {
        setResizeJobs(prev => prev.map(j => 
          j.id === job.id ? { 
            ...j, 
            status: 'failed',
            error: error instanceof Error ? error.message : 'Processing failed',
          } : j
        ));
      }
    }

    return resizeJobs;
  }, [resizeJobs]);

  // Extract thumbnail
  const extractThumbnail = useCallback(async (
    file: File,
    timeSeconds: number = 0
  ): Promise<string> => {
    const blob = await ffmpegService.extractThumbnail(file, timeSeconds);
    return URL.createObjectURL(blob);
  }, []);

  // Get video metadata
  const getMetadata = useCallback(async (file: File) => {
    return ffmpegService.getVideoMetadata(file);
  }, []);

  // Clear completed/failed jobs
  const clearJobs = useCallback(() => {
    setResizeJobs([]);
    setExportJobs([]);
  }, []);

  return {
    isLoading,
    progress,
    resizeJobs,
    exportJobs,
    resizeVideoClientSide,
    exportVideoBackend,
    processVideo,
    batchResize,
    extractThumbnail,
    getMetadata,
    clearJobs,
  };
}

function getPresetConfig(preset: string): { width: number; height: number; aspectRatio: string } {
  const presets: Record<string, { width: number; height: number; aspectRatio: string }> = {
    reels: { width: 1080, height: 1920, aspectRatio: '9:16' },
    youtube: { width: 1920, height: 1080, aspectRatio: '16:9' },
    instagram: { width: 1080, height: 1080, aspectRatio: '1:1' },
    portrait: { width: 1080, height: 1350, aspectRatio: '4:5' },
    custom: { width: 1920, height: 1080, aspectRatio: '16:9' },
  };
  return presets[preset] || presets.youtube;
}
