/**
 * StampColorWheel — Full HSB canvas color wheel with live preview
 * Mouse move → live preview. Brightness slider. Hex input. Recent colors.
 */
import React, { useRef, useEffect, useState, useCallback } from 'react';

interface Props {
  color: string;
  onChange: (hex: string) => void;
  label?: string;
  size?: number;
}

function hexToHsb(hex: string): [number, number, number] {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  const d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h = Math.round(h * 60);
    if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : Math.round((d / max) * 100);
  const bv = Math.round(max * 100);
  return [h, s, bv];
}

function hsbToHex(h: number, s: number, b: number): string {
  const bv = b / 100, sv = s / 100;
  const f = (n: number) => {
    const k = (n + h / 60) % 6;
    return bv - bv * sv * Math.max(0, Math.min(k, 4 - k, 1));
  };
  const toHex = (v: number) => Math.round(v * 255).toString(16).padStart(2, '0');
  return `#${toHex(f(5))}${toHex(f(3))}${toHex(f(1))}`;
}

function drawWheel(canvas: HTMLCanvasElement, brightness: number) {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) - 2;
  ctx.clearRect(0, 0, width, height);

  // Draw hue + saturation wheel using arc slices
  for (let angle = 0; angle < 360; angle += 1) {
    const startRad = ((angle - 1) * Math.PI) / 180;
    const endRad = ((angle + 1) * Math.PI) / 180;
    const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const bvHalf = brightness / 2;
    grad.addColorStop(0, `hsl(${angle},0%,${brightness}%)`);
    grad.addColorStop(1, `hsl(${angle},100%,${bvHalf}%)`);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, r, startRad, endRad);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  // Clip to circle
  ctx.globalCompositeOperation = 'destination-in';
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fillStyle = 'black';
  ctx.fill();
  ctx.globalCompositeOperation = 'source-over';
}

function colorAtPos(canvas: HTMLCanvasElement, x: number, y: number, brightness: number): string | null {
  const ctx = canvas.getContext('2d')!;
  const { width, height } = canvas;
  const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) - 2;
  const dx = x - cx, dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist > r) return null;

  const hue = (((Math.atan2(dy, dx) * 180) / Math.PI) + 360) % 360;
  const sat = Math.round((dist / r) * 100);
  return hsbToHex(Math.round(hue), sat, brightness);
}

function getCursorPos(canvas: HTMLCanvasElement, h: number, s: number): { x: number; y: number } {
  const { width, height } = canvas;
  const cx = width / 2, cy = height / 2, r = Math.min(cx, cy) - 2;
  const angleRad = (h * Math.PI) / 180;
  const dist = (s / 100) * r;
  return { x: cx + Math.cos(angleRad) * dist, y: cy + Math.sin(angleRad) * dist };
}

const MAX_RECENT = 6;

export function StampColorWheel({ color, onChange, label = 'Primary Color', size = 160 }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hsb, setHsb] = useState<[number, number, number]>(() => hexToHsb(color));
  const [brightness, setBrightness] = useState(hsb[2]);
  const [hexInput, setHexInput] = useState(color);
  const [recent, setRecent] = useState<string[]>([]);
  const dragging = useRef(false);

  // Sync from external color changes
  useEffect(() => {
    if (color && color !== hsbToHex(...hsb)) {
      const newHsb = hexToHsb(color);
      setHsb(newHsb);
      setBrightness(newHsb[2]);
      setHexInput(color);
    }
  }, [color]);

  // Redraw wheel when brightness changes
  useEffect(() => {
    if (canvasRef.current) drawWheel(canvasRef.current, brightness);
  }, [brightness]);

  const applyColor = useCallback((hex: string) => {
    const newHsb = hexToHsb(hex);
    setHsb(newHsb);
    setBrightness(newHsb[2]);
    setHexInput(hex);
    onChange(hex);
    setRecent(prev => {
      const filtered = prev.filter(c => c !== hex);
      return [hex, ...filtered].slice(0, MAX_RECENT);
    });
  }, [onChange]);

  const handleCanvasInteraction = useCallback((e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }
    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;
    const hex = colorAtPos(canvas, x, y, brightness);
    if (hex) {
      const newHsb = hexToHsb(hex);
      setHsb(newHsb);
      setHexInput(hex);
      onChange(hex);
    }
  }, [brightness, onChange]);

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    dragging.current = true;
    handleCanvasInteraction(e);
  };
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (dragging.current) handleCanvasInteraction(e);
  };
  const handleMouseUp = () => {
    if (dragging.current) {
      dragging.current = false;
      // commit to recent
      setRecent(prev => {
        const filtered = prev.filter(c => c !== hexInput);
        return [hexInput, ...filtered].slice(0, MAX_RECENT);
      });
    }
  };

  const handleBrightnessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const bv = Number(e.target.value);
    setBrightness(bv);
    const newHsb: [number, number, number] = [hsb[0], hsb[1], bv];
    setHsb(newHsb);
    const hex = hsbToHex(newHsb[0], newHsb[1], bv);
    setHexInput(hex);
    onChange(hex);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9a-fA-F#]/g, '');
    setHexInput(val);
    const clean = val.startsWith('#') ? val : `#${val}`;
    if (/^#[0-9a-fA-F]{6}$/.test(clean)) {
      applyColor(clean);
    }
  };

  // Cursor position on wheel
  const cursorPos = canvasRef.current ? getCursorPos(canvasRef.current, hsb[0], hsb[1]) : { x: size / 2, y: size / 2 };

  return (
    <div className="space-y-3">
      <p className="text-xs font-semibold text-[hsl(var(--foreground))] uppercase tracking-wide">{label}</p>

      {/* Wheel */}
      <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
        <canvas
          ref={canvasRef}
          width={size * 2}
          height={size * 2}
          style={{ width: size, height: size, cursor: 'crosshair', borderRadius: '50%', display: 'block' }}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onTouchStart={(e) => { dragging.current = true; handleCanvasInteraction(e); }}
          onTouchMove={handleCanvasInteraction}
          onTouchEnd={() => { dragging.current = false; }}
        />
        {/* Cursor dot */}
        <div
          className="absolute pointer-events-none border-2 border-white rounded-full shadow-md"
          style={{
            width: 14,
            height: 14,
            left: cursorPos.x / 2 - 7 + 'px',
            top: cursorPos.y / 2 - 7 + 'px',
            backgroundColor: hexInput,
            boxShadow: '0 0 0 1px rgba(0,0,0,0.4), 0 2px 6px rgba(0,0,0,0.3)',
          }}
        />
      </div>

      {/* Brightness slider */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-[hsl(var(--muted-foreground))]">Brightness</span>
          <span className="text-[10px] font-mono text-[hsl(var(--muted-foreground))]">{brightness}%</span>
        </div>
        <div
          className="relative h-3 rounded-full overflow-hidden"
          style={{ background: `linear-gradient(to right, #000, hsl(${hsb[0]},${hsb[1]}%,50%))` }}
        >
          <input
            type="range"
            min={5}
            max={100}
            value={brightness}
            onChange={handleBrightnessChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            style={{ margin: 0 }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-white shadow-md pointer-events-none"
            style={{ left: `calc(${brightness}% - 8px)`, backgroundColor: hsbToHex(hsb[0], hsb[1], brightness) }}
          />
        </div>
      </div>

      {/* Hex input + current swatch */}
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-lg border border-[hsl(var(--border))] shadow-sm flex-shrink-0" style={{ backgroundColor: hexInput }}/>
        <div className="flex items-center flex-1 border-2 border-[hsl(var(--border))] rounded-lg overflow-hidden focus-within:border-[hsl(var(--gold))] transition-colors">
          <span className="px-2 text-xs text-[hsl(var(--muted-foreground))] font-mono">#</span>
          <input
            value={hexInput.replace('#', '')}
            onChange={handleHexInput}
            maxLength={7}
            className="flex-1 py-1.5 pr-2 text-xs font-mono bg-transparent outline-none text-black"
            placeholder="1a2744"
          />
        </div>
      </div>

      {/* Recent colors */}
      {recent.length > 0 && (
        <div className="space-y-1">
          <p className="text-[10px] text-[hsl(var(--muted-foreground))]">Recent</p>
          <div className="flex gap-1.5 flex-wrap">
            {recent.map(c => (
              <button
                key={c}
                onClick={() => applyColor(c)}
                title={c}
                className="w-6 h-6 rounded-full border-2 transition-all hover:scale-110"
                style={{ backgroundColor: c, borderColor: color === c ? 'hsl(var(--gold))' : 'white', boxShadow: '0 1px 3px rgba(0,0,0,0.2)' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
