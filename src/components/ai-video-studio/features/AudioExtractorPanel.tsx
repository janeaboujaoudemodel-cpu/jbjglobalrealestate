/**
 * AudioExtractorPanel — Extract audio from video files using Web Audio API
 * Pure browser-based, no API calls needed.
 */
import React, { useState, useRef, useCallback } from 'react';
import { AudioLines, Upload, Play, Pause, Download, Plus, Loader2, FileAudio } from 'lucide-react';
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
} as const;

interface AudioExtractorPanelProps {
  onAddToTimeline?: (audioUrl: string, duration: number, name: string) => void;
}

export function AudioExtractorPanel({ onAddToTimeline }: AudioExtractorPanelProps) {
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [extractedAudioUrl, setExtractedAudioUrl] = useState<string | null>(null);
  const [extractedDuration, setExtractedDuration] = useState(0);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('video/')) {
      toast.error('Please select a video file');
      return;
    }
    setVideoFile(file);
    setExtractedAudioUrl(null);
    setIsExtracting(true);

    try {
      const arrayBuffer = await file.arrayBuffer();
      const audioCtx = new AudioContext();
      const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);

      // Encode to WAV
      const wavBlob = audioBufferToWav(audioBuffer);
      const url = URL.createObjectURL(wavBlob);

      setExtractedAudioUrl(url);
      setExtractedDuration(audioBuffer.duration);
      await audioCtx.close();
      toast.success(`Audio extracted: ${audioBuffer.duration.toFixed(1)}s`);
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

  const handleDownload = useCallback(() => {
    if (!extractedAudioUrl || !videoFile) return;
    const a = document.createElement('a');
    a.href = extractedAudioUrl;
    a.download = `${videoFile.name.replace(/\.[^.]+$/, '')}_audio.wav`;
    a.click();
    toast.success('Audio downloaded');
  }, [extractedAudioUrl, videoFile]);

  const handleAddToTimeline = useCallback(() => {
    if (!extractedAudioUrl || !videoFile) return;
    onAddToTimeline?.(extractedAudioUrl, extractedDuration, `${videoFile.name} (extracted audio)`);
    toast.success('Audio added to timeline');
  }, [extractedAudioUrl, extractedDuration, videoFile, onAddToTimeline]);

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <AudioLines className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Audio Extractor</h3>
      </div>
      <p className="text-xs" style={{ color: C.textSecondary }}>
        Upload a video file to extract its audio track. Download as WAV or add directly to timeline.
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

      {extractedAudioUrl && (
        <div className="space-y-3 rounded-lg p-3" style={{ background: C.bgCard, border: `1px solid ${C.borderSubtle}` }}>
          <div className="flex items-center gap-2">
            <FileAudio className="w-4 h-4" style={{ color: C.accent }} />
            <span className="text-xs font-medium">Extracted Audio</span>
            <span className="text-xs ml-auto" style={{ color: C.textSecondary }}>{extractedDuration.toFixed(1)}s</span>
          </div>

          <audio
            ref={audioRef}
            src={extractedAudioUrl}
            onEnded={() => setIsPlaying(false)}
            className="hidden"
          />

          <div className="flex gap-2">
            <button
              onClick={togglePlayback}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all"
              style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isPlaying ? 'Pause' : 'Preview'}
            </button>
            <button
              onClick={handleDownload}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-all"
              style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
            >
              <Download className="w-3.5 h-3.5" />
              Download WAV
            </button>
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
