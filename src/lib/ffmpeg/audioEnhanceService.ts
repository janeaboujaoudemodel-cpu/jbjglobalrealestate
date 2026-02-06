// JBJ AI Tools - Real Audio Enhancement Service using FFmpeg WASM
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

export interface AudioEnhanceOptions {
  // Noise reduction (0-1, higher = more aggressive)
  noiseReduction: number;
  // Volume normalization
  normalize: boolean;
  // High-pass filter frequency (Hz) - removes low rumble
  highPassFreq: number;
  // Low-pass filter frequency (Hz) - removes high hiss
  lowPassFreq: number;
  // Compression/limiting
  compress: boolean;
  // Output format
  format: 'mp3' | 'wav' | 'aac';
  // Bitrate for compressed formats
  bitrate: string;
}

export interface EnhanceProgress {
  percent: number;
  stage: 'loading' | 'analyzing' | 'enhancing' | 'encoding' | 'complete';
  message: string;
}

const DEFAULT_OPTIONS: AudioEnhanceOptions = {
  noiseReduction: 0.5,
  normalize: true,
  highPassFreq: 80,  // Cut below 80Hz (room rumble)
  lowPassFreq: 15000, // Cut above 15kHz (hiss)
  compress: true,
  format: 'mp3',
  bitrate: '192k',
};

class AudioEnhanceService {
  private ffmpeg: FFmpeg | null = null;
  private loaded = false;
  private loading = false;

  async load(onProgress?: (progress: EnhanceProgress) => void): Promise<void> {
    if (this.loaded) return;
    if (this.loading) {
      while (this.loading) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }

    this.loading = true;
    onProgress?.({ percent: 0, stage: 'loading', message: 'Loading audio processor...' });

    try {
      this.ffmpeg = new FFmpeg();

      this.ffmpeg.on('progress', ({ progress }) => {
        onProgress?.({
          percent: Math.round(20 + progress * 70),
          stage: 'enhancing',
          message: `Processing: ${Math.round(progress * 100)}%`,
        });
      });

      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg Audio]', message);
      });

      // CDN fallback list - some networks block unpkg
      const cdnUrls = [
        'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd',
        'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.6/dist/umd',
      ];

      let loadError: Error | null = null;
      
      for (const baseURL of cdnUrls) {
        try {
          console.log(`[FFmpeg Audio] Trying CDN: ${baseURL}`);
          await this.ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          });
          loadError = null;
          break; // Success - exit loop
        } catch (cdnError) {
          console.warn(`[FFmpeg Audio] CDN failed: ${baseURL}`, cdnError);
          loadError = cdnError instanceof Error ? cdnError : new Error('CDN load failed');
        }
      }

      if (loadError) {
        throw loadError;
      }

      this.loaded = true;
      onProgress?.({ percent: 15, stage: 'loading', message: 'Audio processor ready!' });
    } catch (error) {
      console.error('Failed to load FFmpeg from all CDNs:', error);
      throw new Error('Failed to load audio processing engine. Please check your network connection.');
    } finally {
      this.loading = false;
    }
  }

  isLoaded(): boolean {
    return this.loaded;
  }

  /**
   * Enhance audio with real FFmpeg filters
   */
  async enhanceAudio(
    file: File,
    options: Partial<AudioEnhanceOptions> = {},
    onProgress?: (progress: EnhanceProgress) => void
  ): Promise<Blob> {
    const opts = { ...DEFAULT_OPTIONS, ...options };
    
    await this.load(onProgress);
    
    if (!this.ffmpeg) {
      throw new Error('FFmpeg not initialized');
    }

    const inputExt = this.getExtension(file);
    const inputName = `input${inputExt}`;
    const outputName = `output.${opts.format}`;

    onProgress?.({ percent: 10, stage: 'analyzing', message: 'Loading audio file...' });

    // Write input file
    await this.ffmpeg.writeFile(inputName, await fetchFile(file));

    onProgress?.({ percent: 20, stage: 'enhancing', message: 'Applying audio filters...' });

    // Build filter chain
    const filters = this.buildFilterChain(opts);
    
    // Build FFmpeg command
    const args = this.buildEnhanceArgs(inputName, outputName, filters, opts);

    console.log('[AudioEnhance] Running FFmpeg with args:', args.join(' '));

    // Execute FFmpeg
    await this.ffmpeg.exec(args);

    onProgress?.({ percent: 90, stage: 'encoding', message: 'Finalizing enhanced audio...' });

    // Read output
    const data = await this.ffmpeg.readFile(outputName);
    
    // Cleanup
    await this.ffmpeg.deleteFile(inputName);
    await this.ffmpeg.deleteFile(outputName);

    onProgress?.({ percent: 100, stage: 'complete', message: 'Enhancement complete!' });

    // Convert to Blob
    const mimeType = this.getMimeType(opts.format);
    if (typeof data === 'string') {
      return new Blob([data], { type: mimeType });
    }
    const buffer = new ArrayBuffer(data.byteLength);
    new Uint8Array(buffer).set(data);
    return new Blob([buffer], { type: mimeType });
  }

  /**
   * Quick cleanup preset - removes background noise and normalizes
   */
  async quickCleanup(
    file: File,
    onProgress?: (progress: EnhanceProgress) => void
  ): Promise<Blob> {
    return this.enhanceAudio(file, {
      noiseReduction: 0.3,
      normalize: true,
      highPassFreq: 100,
      lowPassFreq: 12000,
      compress: false,
      format: 'mp3',
      bitrate: '192k',
    }, onProgress);
  }

  /**
   * Voice optimization - optimized for speech/podcast
   */
  async optimizeVoice(
    file: File,
    onProgress?: (progress: EnhanceProgress) => void
  ): Promise<Blob> {
    return this.enhanceAudio(file, {
      noiseReduction: 0.5,
      normalize: true,
      highPassFreq: 120,  // Higher cutoff for voice
      lowPassFreq: 10000, // Voice doesn't need above 10kHz
      compress: true,
      format: 'mp3',
      bitrate: '128k',
    }, onProgress);
  }

  /**
   * Music mastering - preserves dynamics, wide frequency range
   */
  async masterMusic(
    file: File,
    onProgress?: (progress: EnhanceProgress) => void
  ): Promise<Blob> {
    return this.enhanceAudio(file, {
      noiseReduction: 0.1,
      normalize: true,
      highPassFreq: 30,
      lowPassFreq: 18000,
      compress: false,
      format: 'mp3',
      bitrate: '320k',
    }, onProgress);
  }

  /**
   * Build FFmpeg audio filter chain
   */
  private buildFilterChain(opts: AudioEnhanceOptions): string {
    const filters: string[] = [];

    // High-pass filter to remove low rumble/hum
    if (opts.highPassFreq > 0) {
      filters.push(`highpass=f=${opts.highPassFreq}`);
    }

    // Low-pass filter to remove high-frequency hiss
    if (opts.lowPassFreq < 20000) {
      filters.push(`lowpass=f=${opts.lowPassFreq}`);
    }

    // Noise reduction using afftdn (FFmpeg's built-in denoiser)
    // nr = noise reduction amount (0-100), nf = noise floor
    if (opts.noiseReduction > 0) {
      const nrAmount = Math.round(opts.noiseReduction * 50); // 0-50 range
      filters.push(`afftdn=nf=-${70 - nrAmount}:nr=${nrAmount}:nt=w`);
    }

    // Dynamic range compression for voice/podcast
    if (opts.compress) {
      // acompressor: threshold, ratio, attack, release
      filters.push('acompressor=threshold=-20dB:ratio=4:attack=5:release=50');
    }

    // Volume normalization using loudnorm (EBU R128 standard)
    if (opts.normalize) {
      filters.push('loudnorm=I=-16:TP=-1.5:LRA=11');
    }

    return filters.join(',');
  }

  /**
   * Build FFmpeg arguments for audio enhancement
   */
  private buildEnhanceArgs(
    input: string,
    output: string,
    filterChain: string,
    opts: AudioEnhanceOptions
  ): string[] {
    const args = ['-i', input];

    // Apply filter chain
    if (filterChain) {
      args.push('-af', filterChain);
    }

    // Codec settings based on output format
    switch (opts.format) {
      case 'mp3':
        args.push('-c:a', 'libmp3lame', '-b:a', opts.bitrate);
        break;
      case 'aac':
        args.push('-c:a', 'aac', '-b:a', opts.bitrate);
        break;
      case 'wav':
        args.push('-c:a', 'pcm_s16le');
        break;
    }

    // Output
    args.push('-y', output);

    return args;
  }

  private getExtension(file: File): string {
    const name = file.name.toLowerCase();
    if (name.endsWith('.mp3')) return '.mp3';
    if (name.endsWith('.wav')) return '.wav';
    if (name.endsWith('.m4a')) return '.m4a';
    if (name.endsWith('.aac')) return '.aac';
    if (name.endsWith('.ogg')) return '.ogg';
    if (name.endsWith('.flac')) return '.flac';
    if (name.endsWith('.webm')) return '.webm';
    return '.mp3';
  }

  private getMimeType(format: string): string {
    switch (format) {
      case 'mp3': return 'audio/mpeg';
      case 'wav': return 'audio/wav';
      case 'aac': return 'audio/aac';
      default: return 'audio/mpeg';
    }
  }
}

// Singleton instance
export const audioEnhanceService = new AudioEnhanceService();
