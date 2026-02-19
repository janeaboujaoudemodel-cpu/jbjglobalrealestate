import React, { useRef, useEffect } from 'react';

interface SoundWaveformProps {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
  width?: number;
  height?: number;
}

const BAR_COUNT = 14;
const BAR_WIDTH = 5;
const BAR_GAP = 3;
const IDLE_HEIGHT = 5;

// Sample bins 0-56 (lower-half = audible freqs), every 4th bin → 14 bars
const BIN_STEP = 4;
const BIN_START = 0;

export function SoundWaveform({
  analyser,
  isPlaying,
  width = 112,
  height = 28,
}: SoundWaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Live animation when playing
  useEffect(() => {
    if (!isPlaying || !analyser || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    const dataArray = new Uint8Array(analyser.frequencyBinCount);
    let rafId: number;

    const draw = () => {
      rafId = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < BAR_COUNT; i++) {
        const binIndex = BIN_START + i * BIN_STEP;
        const value = dataArray[binIndex] ?? 0;          // 0–255
        const barHeight = Math.max(2, (value / 255) * canvas.height);
        const x = i * (BAR_WIDTH + BAR_GAP);
        const y = canvas.height - barHeight;

        // Amber gradient: #f59e0b bottom → #fcd34d top
        const gradient = ctx.createLinearGradient(x, y, x, canvas.height);
        gradient.addColorStop(0, '#fcd34d');
        gradient.addColorStop(1, '#f59e0b');

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, 2);
        ctx.fill();
      }
    };

    draw();
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, analyser, width, height]);

  // Static idle state
  useEffect(() => {
    if (isPlaying || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < BAR_COUNT; i++) {
      const x = i * (BAR_WIDTH + BAR_GAP);
      const y = canvas.height - IDLE_HEIGHT;
      ctx.fillStyle = '#475569'; // slate-600
      ctx.beginPath();
      ctx.roundRect(x, y, BAR_WIDTH, IDLE_HEIGHT, 2);
      ctx.fill();
    }
  }, [isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      style={{ width, height, display: 'block' }}
    />
  );
}
