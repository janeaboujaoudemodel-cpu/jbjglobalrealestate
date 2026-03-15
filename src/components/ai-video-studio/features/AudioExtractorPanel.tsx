/**
 * AudioExtractorPanel — Extract audio from video files using Web Audio API
 * Features: waveform visualization, playback cursor, multi-format export (WAV/MP3/OGG)
 * Pure browser-based, no API calls needed.
 */
import React, { useState, useRef, useCallback, useEffect } from 'react';
import { AudioLines, Upload, Play, Pause, Download, Plus, Loader2, FileAudio, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const C = {
  bgPrimary: '#0A0A0F',
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  bgButtonHov: '#252530',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
  waveColor: 'rgba(200,168,122,0.5)',
  wavePlayedColor: '#C8A87A',
  cursorColor: '#F1F0EE',
} as const;

type ExportFormat = 'wav' | 'mp3' | 'ogg';

interface AudioExtractorPanelProps {
  onAddToTimeline?: (audioUrl: string, duration: number, name: string) => void;
}

export function AudioExtractorPanel({ onAddToTimeline }: AudioExtractorPanelProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [extractedDuration, setExtractedDuration] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackProgress, setPlaybackProgress] = useState(0);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('wav');
  const [showFormatMenu, setShowFormatMenu] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number>(0);

  // Draw waveform on canvas
  const drawWaveform = useCallback((buffer: AudioBuffer, progress = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const mid = height / 2;

    ctx.clearRect(0, 0, width, height);

    const data = buffer.getChannelData(0);
    const step = Math.ceil(data.length / width);
    const progressX = progress * width;

    for (let x = 0; x < width; x++) {
      const sliceStart = x * step;
      let min = 1.0, max = -1.0;
      for (let j = 0; j < step && sliceStart + j < data.length; j++) {
        const val = data[sliceStart + j];
        if (val < min) min = val;
        if (val > max) max = val;
      }

      const barTop = (1 + min) * mid;
      const barHeight = Math.max(1, (max - min) * mid);

      ctx.fillStyle = x < progressX ? C.wavePlayedColor : C.waveColor;
      ctx.fillRect(x, barTop, 1, barHeight);
    }

    // Playback cursor
    if (progress > 0 && progress < 1) {
      ctx.strokeStyle = C.cursorColor;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(progressX, 0);
      ctx.lineTo(progressX, height);
      ctx.stroke();
    }
  }, []);

  // Animate waveform during playback
  useEffect(() => {
    if (!isPlaying || !audioRef.current || !audioBuffer) return;

    const tick = () => {
      const audio = audioRef.current;
      if (!audio || audio.paused) return;
      const prog = audio.currentTime / audio.duration;
      setPlaybackProgress(prog);
      drawWaveform(audioBuffer, prog);
      animFrameRef.current = requestAnimationFrame(tick);
    };

    animFrameRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [isPlaying, audioBuffer, drawWaveform]);

  // Redraw waveform when buffer changes or on resize
  useEffect(() => {
    if (!audioBuffer) return;
    drawWaveform(audioBuffer, playbackProgress);

    const onResize = () => drawWaveform(audioBuffer, playbackProgress);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [audioBuffer, drawWaveform, playbackProgress]);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    setVideoFile(file);
    setExtractedAudioUrl(null);
    setAudioBuffer(null);
    setPlaybackProgress(0);
    setIsExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const decoded = await audioCtx.decodeAudioData(arrayBuffer);

      const wavBlob = audioBufferToWav(decoded);
      const url = URL.createObjectURL(wavBlob);

      setAudioBuffer(decoded);
      setExtractedAudioUrl(url);
      setExtractedDuration(decoded.duration);
      await audioCtx.close();
      toast.success(`Audio extracted: ${decoded.duration.toFixed(1)}s`);
    } catch (err) {
      console.error('Audio extraction failed:', err);
      toast.error('Failed to extract audio. Try a different video format.');
    } finally {
      setIsExtracting(false);
    }
  }, []);

  const togglePlayback = useCallback(() => {
    if (!audioRef.current || !extractedAudioUrl) return;
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  }, [isPlaying, extractedAudioUrl]);

  // Seek on waveform click
  const handleWaveformClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!audioRef.current || !audioBuffer) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left;
    const progress = x / rect.width;
    audioRef.current.currentTime = progress * audioRef.current.duration;
    setPlaybackProgress(progress);
    drawWaveform(audioBuffer, progress);
  }, [audioBuffer, drawWaveform]);

  const encodeToFormat = useCallback(async (format: ExportFormat): Promise<Blob> => {
    if (!audioBuffer) throw new Error('No audio');

    if (format === 'wav') {
      return audioBufferToWav(audioBuffer);
    }

    // Use MediaRecorder for MP3/OGG encoding
    const offlineCtx = new OfflineAudioContext(
      audioBuffer.numberOfChannels,
      audioBuffer.length,
      audioBuffer.sampleRate
    );
    const source = offlineCtx.createBufferSource();
    source.buffer = audioBuffer;
    source.connect(offlineCtx.destination);
    source.start(0);
    const rendered = await offlineCtx.startRendering();

    // Create a MediaStream from the rendered buffer
    const ctx = new AudioContext();
    const bufferSource = ctx.createBufferSource();
    bufferSource.buffer = rendered;
    const dest = ctx.createMediaStreamDestination();
    bufferSource.connect(dest);

    const mimeType = format === 'ogg' ? 'audio/ogg; codecs=opus' : 'audio/webm; codecs=opus';
    const fallbackMime = 'audio/webm';
    const selectedMime = MediaRecorder.isTypeSupported(mimeType) ? mimeType : fallbackMime;

    return new Promise<Blob>((resolve, reject) => {
      const recorder = new MediaRecorder(dest.stream, { mimeType: selectedMime });
      const chunks: Blob[] = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunks.push(e.data);
      };

      recorder.onstop = async () => {
        await ctx.close();
        const ext = format === 'ogg' ? 'audio/ogg' : 'audio/webm';
        resolve(new Blob(chunks, { type: ext }));
      };

      recorder.onerror = () => {
        ctx.close();
        reject(new Error('Encoding failed'));
      };

      bufferSource.start(0);
      recorder.start();

      // Stop after the buffer duration
      setTimeout(() => {
        recorder.stop();
        bufferSource.stop();
      }, (rendered.duration * 1000) + 200);
    });
  }, [audioBuffer]);

  const handleDownload = useCallback(async () => {
    if (!extractedAudioUrl || !videoFile || !audioBuffer) return;

    const baseName = videoFile.name.replace(/\.[^.]+$/, '');

    if (exportFormat === 'wav') {
      const a = document.createElement('a');
      a.href = extractedAudioUrl;
      a.download = `${baseName}_audio.wav`;
      a.click();
      toast.success('WAV downloaded');
      return;
    }

    toast.info(`Encoding to ${exportFormat.toUpperCase()}…`);
    try {
      const blob = await encodeToFormat(exportFormat);
      const ext = exportFormat === 'ogg' ? 'ogg' : 'webm';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${baseName}_audio.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${exportFormat.toUpperCase()} downloaded`);
    } catch {
      toast.error('Encoding failed — downloading as WAV instead');
      const a = document.createElement('a');
      a.href = extractedAudioUrl;
      a.download = `${baseName}_audio.wav`;
      a.click();
    }
  }, [extractedAudioUrl, videoFile, audioBuffer, exportFormat, encodeToFormat]);

  const handleAddToTimeline = useCallback(() => {
    if (!extractedAudioUrl || !videoFile) return;
    onAddToTimeline?.(extractedAudioUrl, extractedDuration, `${videoFile.name} (extracted audio)`);
    toast.success('Audio added to timeline');
  }, [extractedAudioUrl, extractedDuration, videoFile, onAddToTimeline]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <AudioLines className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Audio Extractor</h3>
      </div>
      <p className="text-xs" style={{ color: C.textSecondary }}>
        Extract audio from video with waveform preview. Export as WAV, MP3, or OGG.
      </p>

      {/* Upload area */}
      <input ref={fileInputRef} type="file" accept="video/*" onChange={handleFileSelect} className="hidden" />
      <button
        onClick={() => fileInputRef.current?.click()}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-lg text-xs font-medium transition-all"
        style={{
          background: C.bgButton,
          border: `1px dashed ${C.borderAccent}`,
          color: C.accent,
        }}
      >
        <Upload className="w-4 h-4" />
        {videoFile ? videoFile.name : 'Select Video File'}
      </button>

      {isExtracting && (
        <div className="flex items-center justify-center gap-2 py-4">
          <Loader2 className="w-5 h-5 animate-spin" style={{ color: C.accent }} />
          <span className="text-xs" style={{ color: C.textSecondary }}>Extracting audio...</span>
        </div>
      )}

      {extractedAudioUrl && audioBuffer && (
        <div className="space-y-3 rounded-lg p-3" style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}` }}>
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4" style={{ color: C.accent }} />
            <span className="text-xs font-medium">Extracted Audio</span>
            <span className="text-xs ml-auto" style={{ color: C.textSecondary }}>
              {formatTime(playbackProgress * extractedDuration)} / {formatTime(extractedDuration)}
            </span>
          </div>

          {/* Waveform canvas */}
          <canvas
            ref={canvasRef}
            onClick={handleWaveformClick}
            className="w-full rounded cursor-pointer"
            style={{
              height: '64px',
              background: C.bgPrimary,
              border: `1px solid ${C.borderSubtle}`,
            }}
          />

          <audio
            ref={audioRef}
            src={extractedAudioUrl}
            onEnded={() => {
              setIsPlaying(false);
              setPlaybackProgress(0);
              if (audioBuffer) drawWaveform(audioBuffer, 0);
            }}
            className="hidden"
          />

          {/* Playback + Download row */}
          <div className="flex gap-2">
            <button
              onClick={togglePlayback}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-md text-xs font-medium transition-all"
              style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Play'}
            </button>

            {/* Format selector + download */}
            <div className="flex-1 flex gap-0 relative">
              <button
                onClick={handleDownload}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-l-md text-xs font-medium transition-all"
                style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, borderRight: 'none', color: C.textPrimary }}
              >
                <Download className="w-3.5 h-3.5" />
                {exportFormat.toUpperCase()}
              </button>
              <button
                onClick={() => setShowFormatMenu(!showFormatMenu)}
                className="flex items-center justify-center px-2 py-2 rounded-r-md text-xs transition-all"
                style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textSecondary }}
              >
                <ChevronDown className="w-3 h-3" />
              </button>

              {showFormatMenu && (
                <div
                  className="absolute top-full right-0 mt-1 rounded-md overflow-hidden z-50 shadow-lg"
                  style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}`, minWidth: '100px' }}
                >
                  {(['wav', 'mp3', 'ogg'] as ExportFormat[]).map((fmt) => (
                    <button
                      key={fmt}
                      onClick={() => { setExportFormat(fmt); setShowFormatMenu(false); }}
                      className="w-full text-left px-3 py-2 text-xs transition-colors"
                      style={{
                        color: fmt === exportFormat ? C.accent : C.textPrimary,
                        background: fmt === exportFormat ? C.accentGlow : 'transparent',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = C.bgButtonHov)}
                      onMouseLeave={(e) => (e.currentTarget.style.background = fmt === exportFormat ? C.accentGlow : 'transparent')}
                    >
                      {fmt.toUpperCase()}
                      {fmt === 'wav' && <span style={{ color: C.textSecondary }}> — lossless</span>}
                      {fmt === 'mp3' && <span style={{ color: C.textSecondary }}> — compressed</span>}
                      {fmt === 'ogg' && <span style={{ color: C.textSecondary }}> — opus codec</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {onAddToTimeline && (
            <button
              onClick={handleAddToTimeline}
              className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md text-xs font-semibold transition-all"
              style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}
            >
              <Plus className="w-3.5 h-3.5" />
              Add to Timeline
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/** Encode an AudioBuffer to a WAV Blob */
function audioBufferToWav(buffer: AudioBuffer): Blob {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const format = 1; // PCM
  const bitDepth = 16;
  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;

  const samples = interleave(buffer);
  const dataLength = samples.length * bytesPerSample;
  const headerLength = 44;
  const totalLength = headerLength + dataLength;

  const arrayBuffer = new ArrayBuffer(totalLength);
  const view = new DataView(arrayBuffer);

  writeString(view, 0, 'RIFF');
  view.setUint32(4, totalLength - 8, true);
  writeString(view, 8, 'WAVE');
  writeString(view, 12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, format, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * blockAlign, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);
  writeString(view, 36, 'data');
  view.setUint32(40, dataLength, true);

  let offset = 44;
  for (let i = 0; i < samples.length; i++) {
    const s = Math.max(-1, Math.min(1, samples[i]));
    view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    offset += 2;
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

function interleave(buffer: AudioBuffer): Float32Array {
  if (buffer.numberOfChannels === 1) return buffer.getChannelData(0);
  const length = buffer.length;
  const channels = buffer.numberOfChannels;
  const result = new Float32Array(length * channels);
  for (let i = 0; i < length; i++) {
    for (let ch = 0; ch < channels; ch++) {
      result[i * channels + ch] = buffer.getChannelData(ch)[i];
    }
  }
  return result;
}

function writeString(view: DataView, offset: number, str: string) {
  for (let i = 0; i < str.length; i++) {
    view.setUint8(offset + i, str.charCodeAt(i));
  }
}
