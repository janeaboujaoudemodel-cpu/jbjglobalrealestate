// JBJ AI Video Studio - FFmpeg Service (Client-side processing)
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface VideoResizeOptions {
  sourceFile: File;
  targetWidth: number;
  targetHeight: number;
  aspectRatio: string;
  smartFraming: boolean;
  format: 'mp4' | 'webm';
  quality: 'high' | 'medium' | 'low';
}

export interface VideoExportOptions {
  sourceFile: File;
  preset: 'reels' | 'youtube' | 'instagram' | 'portrait';
  quality: 'high' | 'medium' | 'low';
  includeAudio: boolean;
}

export interface ProcessingProgress {
  percent: number;
  stage: 'loading' | 'processing' | 'encoding' | 'complete';
  message: string;
}

class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loading = false;

  async load(onProgress?: (progress: ProcessingProgress) => void): Promise<void> {
    if (this.loaded) return;
    if (this.loading) {
      // Wait for existing load to complete
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.loading = true;
    onProgress?.({ percent: 0, stage: 'loading', message: 'Loading FFmpeg...' });

    try {
      this.ffmpeg = new FFmpeg();

      // Set up progress handler
      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress?.({
          percent: Math.round(progress * 100),
          stage: 'processing',
          message: `Processing: ${Math.round(progress * 100)}%`,
        });
      });

      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message);
      });

      // Load FFmpeg with WASM from CDN - with fallback
      const cdnUrls = [
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',
      ];

      let loadError: Error | null = null;
      
      for (const baseURL of cdnUrls) {
        try {
          console.log(`[FFmpeg] Trying CDN: ${baseURL}`);
          await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          loadError = null;
          break; // Success
        } catch (cdnError) {
          console.warn(`[FFmpeg] CDN failed: ${baseURL}`, cdnError);
          loadError = cdnError instanceof Error ? cdnError : new Error('CDN load failed');
        }
      }

      if (loadError) {
        throw loadError;
      }

      this.loaded = true;
      onProgress?.({ percent: 100, stage: 'loading', message: 'FFmpeg loaded!' });
    } catch (error) {
      console.error('Failed to load FFmpeg:', error);
      throw new Error('Failed to load video processing engine');
    } finally {
      this.loading = false;
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  async resizeVideo(
    options: VideoResizeOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<Blob> {
    await this.load(onProgress);
    
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    const inputName = 'input' + this.getExtension(options.sourceFile);
    const outputName = `output.${options.format}`;

    onProgress?.({ percent: 10, stage: 'processing', message: 'Loading video file...' });

    // Write input file
    await this.ffmpeg.writeFile(inputName, await fetchFile(options.sourceFile));

    onProgress?.({ percent: 20, stage: 'processing', message: 'Analyzing video...' });

    // Build FFmpeg command based on options
    const args = this.buildResizeArgs(inputName, outputName, options);

    onProgress?.({ percent: 30, stage: 'encoding', message: 'Resizing video...' });

    // Execute FFmpeg
    await this.ffmpeg.exec(args);

    onProgress?.({ percent: 90, stage: 'encoding', message: 'Finalizing...' });

    // Read output
    const data = await this.ffmpeg.readFile(outputName);
    
    // Cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    onProgress?.({ percent: 100, stage: 'complete', message: 'Complete!' });

    // Convert to proper ArrayBuffer for Blob creation
    const mimeType = options.format === 'mp4' ? 'video/mp4' : 'video/webm';
    if (typeof data === 'string') {
      // Handle string data (shouldn't happen for video but just in case)
      return new Blob([data], { type: mimeType });
    }
    // data is Uint8Array - copy to regular ArrayBuffer
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return new Blob([buffer], { type: mimeType });
  }

  async exportVideo(
    options: VideoExportOptions,
    onProgress?: (progress: ProcessingProgress) => void
  ): Promise<Blob> {
    const presetConfig = this.getPresetConfig(options.preset);
    
    return this.resizeVideo(
      {
        sourceFile: options.sourceFile,
        targetWidth: presetConfig.width,
        targetHeight: presetConfig.height,
        aspectRatio: presetConfig.aspectRatio,
        smartFraming: true,
        format: 'mp4',
        quality: options.quality,
      },
      onProgress
    );
  }

  async extractThumbnail(file: File, timeSeconds: number = 0): Promise<Blob> {
    await this.load();
    
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    const inputName = 'input' + this.getExtension(file);
    const outputName = 'thumbnail.jpg';

    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    await this.ffmpeg.exec([
      '-i', inputName,
      '-ss', timeSeconds.toString(),
      '-frames:v', '1',
      '-q:v', '2',
      outputName,
    ]);

    const data = await this.ffmpeg.readFile(outputName);
    
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    // Convert to proper ArrayBuffer for Blob creation
    if (typeof data === 'string') {
      return new Blob([data], { type: 'image/jpeg' });
    }
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return new Blob([buffer], { type: 'image/jpeg' });
  }

  async getVideoDuration(file: File): Promise<number> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        URL.revokeObjectURL(video.src);
        resolve(video.duration);
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      video.src = URL.createObjectURL(file);
    });
  }

  async getVideoMetadata(file: File): Promise<{
    width: number;
    height: number;
    duration: number;
    aspectRatio: string;
  }> {
    return new Promise((resolve, reject) => {
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        const width = video.videoWidth;
        const height = video.videoHeight;
        const duration = video.duration;
        
        // Calculate aspect ratio
        const gcd = this.gcd(width, height);
        const aspectRatio = `${width / gcd}:${height / gcd}`;
        
        URL.revokeObjectURL(video.src);
        resolve({ width, height, duration, aspectRatio });
      };
      video.onerror = () => {
        URL.revokeObjectURL(video.src);
        reject(new Error('Failed to load video metadata'));
      };
      video.src = URL.createObjectURL(file);
    });
  }

  private buildResizeArgs(
    input: string,
    output: string,
    options: VideoResizeOptions
  ): string[] {
    const { targetWidth, targetHeight, smartFraming, quality } = options;

    // Quality presets
    const crf = quality === 'high' ? '18' : quality === 'medium' ? '23' : '28';
    const preset = quality === 'high' ? 'slow' : quality === 'medium' ? 'medium' : 'fast';

    const args = ['-i', input];

    if (smartFraming) {
      // Smart framing: scale to fill and crop to center
      args.push(
        '-vf',
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=increase,crop=${targetWidth}:${targetHeight}`
      );
    } else {
      // Simple scale with padding
      args.push(
        '-vf',
        `scale=${targetWidth}:${targetHeight}:force_original_aspect_ratio=decrease,pad=${targetWidth}:${targetHeight}:(ow-iw)/2:(oh-ih)/2`
      );
    }

    // Video codec settings
    args.push(
      '-c:v', 'libx264',
      '-preset', preset,
      '-crf', crf,
      '-pix_fmt', 'yuv420p'
    );

    // Audio settings
    args.push(
      '-c:a', 'aac',
      '-b:a', '128k'
    );

    // Output
    args.push('-movflags', '+faststart', output);

    return args;
  }

  private getPresetConfig(preset: string): { width: number; height: number; aspectRatio: string } {
    const presets: Record<string, { width: number; height: number; aspectRatio: string }> = {
      reels: { width: 1080, height: 1920, aspectRatio: '9:16' },
      youtube: { width: 1920, height: 1080, aspectRatio: '16:9' },
      instagram: { width: 1080, height: 1080, aspectRatio: '1:1' },
      portrait: { width: 1080, height: 1350, aspectRatio: '4:5' },
    };
    return presets[preset] || presets.youtube;
  }

  private getExtension(file: File): string {
    const name = file.name.toLowerCase();
    if (name.endsWith('.mp4')) return '.mp4';
    if (name.endsWith('.webm')) return '.webm';
    if (name.endsWith('.mov')) return '.mov';
    if (name.endsWith('.avi')) return '.avi';
    return '.mp4';
  }

  private gcd(a: number, b: number): number {
    return b === 0 ? a : this.gcd(b, a % b);
  }
}

// Singleton instance
export const ffmpegService = new FFmpegService();
