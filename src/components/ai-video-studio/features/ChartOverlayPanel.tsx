/**
 * ChartOverlayPanel — SVG chart overlays for video timeline
 * Chart types: Bar, Pie, Line, Scorecard
 * Preset data templates for real estate metrics
 */
import React, { useCallback, useState } from 'react';
import { BarChart3, PieChart, TrendingUp, Hash, Plus, Download } from 'lucide-react';
import { toast } from 'sonner';

const C = {
  bgCard: '#18181F',
  bgButton: '#1E1E28',
  borderSubtle: 'rgba(255,255,255,0.06)',
  borderAccent: 'rgba(200,168,122,0.35)',
  textPrimary: '#F1F0EE',
  textSecondary: '#8A8A9A',
  accent: '#C8A87A',
  accentGlow: 'rgba(200,168,122,0.15)',
} as const;

type ChartType = 'bar' | 'pie' | 'line' | 'scorecard';

interface DataPoint { label: string; value: number }

interface ChartOverlayPanelProps {
  onAddToTimeline?: (imageUrl: string, name: string, duration: number) => void;
}

const CHART_TYPES: { id: ChartType; label: string; icon: React.ElementType }[] = [
  { id: 'bar', label: 'Bar Chart', icon: BarChart3 },
  { id: 'pie', label: 'Pie Chart', icon: PieChart },
  { id: 'line', label: 'Line Chart', icon: TrendingUp },
  { id: 'scorecard', label: 'Scorecard', icon: Hash },
];

const PRESETS: { name: string; data: DataPoint[] }[] = [
  { name: 'ROI by Area', data: [{ label: 'Marina', value: 8.2 }, { label: 'Downtown', value: 7.5 }, { label: 'JVC', value: 9.1 }, { label: 'Business Bay', value: 7.8 }] },
  { name: 'Price Trend (AED/sqft)', data: [{ label: '2021', value: 1200 }, { label: '2022', value: 1450 }, { label: '2023', value: 1680 }, { label: '2024', value: 1820 }] },
  { name: 'Property Types', data: [{ label: 'Apartment', value: 45 }, { label: 'Villa', value: 25 }, { label: 'Townhouse', value: 18 }, { label: 'Penthouse', value: 12 }] },
  { name: 'Investment Score', data: [{ label: 'Score', value: 92 }] },
];

const COLORS = ['#C8A87A', '#E8C87A', '#A07940', '#F0D8A0', '#8B6914', '#D4AF37'];

function generateBarSVG(data: DataPoint[], title: string): string {
  const w = 600, h = 400, pad = 60, barGap = 20;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const barW = Math.min(60, (w - pad * 2 - barGap * (data.length - 1)) / data.length);
  const chartH = h - pad * 2;

  const bars = data.map((d, i) => {
    const barH = (d.value / maxVal) * chartH;
    const x = pad + i * (barW + barGap);
    const y = pad + chartH - barH;
    return `<rect x="${x}" y="${y}" width="${barW}" height="${barH}" rx="4" fill="${COLORS[i % COLORS.length]}" opacity="0.9"/>
      <text x="${x + barW / 2}" y="${y - 8}" text-anchor="middle" fill="#F1F0EE" font-size="12" font-family="sans-serif">${d.value}</text>
      <text x="${x + barW / 2}" y="${h - 20}" text-anchor="middle" fill="#8A8A9A" font-size="11" font-family="sans-serif">${d.label}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="16" fill="#0A0A0F" opacity="0.85"/>
    <text x="${w / 2}" y="30" text-anchor="middle" fill="#C8A87A" font-size="16" font-weight="bold" font-family="sans-serif">${title}</text>
    <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${h - pad}" stroke="#333" stroke-width="1"/>
    <line x1="${pad}" y1="${h - pad}" x2="${w - pad}" y2="${h - pad}" stroke="#333" stroke-width="1"/>
    ${bars}
  </svg>`;
}

function generatePieSVG(data: DataPoint[], title: string): string {
  const w = 400, h = 400, cx = 200, cy = 220, r = 120;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let cumAngle = -90;

  const slices = data.map((d, i) => {
    const angle = (d.value / total) * 360;
    const startRad = (cumAngle * Math.PI) / 180;
    const endRad = ((cumAngle + angle) * Math.PI) / 180;
    const largeArc = angle > 180 ? 1 : 0;
    const x1 = cx + r * Math.cos(startRad), y1 = cy + r * Math.sin(startRad);
    const x2 = cx + r * Math.cos(endRad), y2 = cy + r * Math.sin(endRad);
    const midRad = ((cumAngle + angle / 2) * Math.PI) / 180;
    const lx = cx + (r + 25) * Math.cos(midRad), ly = cy + (r + 25) * Math.sin(midRad);
    cumAngle += angle;
    return `<path d="M${cx},${cy} L${x1},${y1} A${r},${r} 0 ${largeArc} 1 ${x2},${y2} Z" fill="${COLORS[i % COLORS.length]}" opacity="0.9"/>
      <text x="${lx}" y="${ly}" text-anchor="middle" fill="#F1F0EE" font-size="10" font-family="sans-serif">${d.label}</text>`;
  }).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="16" fill="#0A0A0F" opacity="0.85"/>
    <text x="${w / 2}" y="30" text-anchor="middle" fill="#C8A87A" font-size="16" font-weight="bold" font-family="sans-serif">${title}</text>
    ${slices}
  </svg>`;
}

function generateLineSVG(data: DataPoint[], title: string): string {
  const w = 600, h = 400, pad = 60;
  const maxVal = Math.max(...data.map(d => d.value), 1);
  const chartW = w - pad * 2, chartH = h - pad * 2;

  const points = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * chartW;
    const y = pad + chartH - (d.value / maxVal) * chartH;
    return { x, y, label: d.label, value: d.value };
  });

  const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
  const areaPath = `M${points[0].x},${pad + chartH} ${points.map(p => `L${p.x},${p.y}`).join(' ')} L${points[points.length - 1].x},${pad + chartH} Z`;

  const labels = points.map(p => `
    <circle cx="${p.x}" cy="${p.y}" r="4" fill="${C.accent}"/>
    <text x="${p.x}" y="${p.y - 12}" text-anchor="middle" fill="#F1F0EE" font-size="11" font-family="sans-serif">${p.value}</text>
    <text x="${p.x}" y="${h - 20}" text-anchor="middle" fill="#8A8A9A" font-size="11" font-family="sans-serif">${p.label}</text>
  `).join('');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="16" fill="#0A0A0F" opacity="0.85"/>
    <text x="${w / 2}" y="30" text-anchor="middle" fill="#C8A87A" font-size="16" font-weight="bold" font-family="sans-serif">${title}</text>
    <path d="${areaPath}" fill="rgba(200,168,122,0.1)"/>
    <polyline points="${polyline}" fill="none" stroke="${C.accent}" stroke-width="2.5" stroke-linejoin="round"/>
    ${labels}
  </svg>`;
}

function generateScorecardSVG(data: DataPoint[], title: string): string {
  const w = 400, h = 300;
  const value = data[0]?.value ?? 0;
  const label = data[0]?.label ?? 'Score';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <rect width="${w}" height="${h}" rx="16" fill="#0A0A0F" opacity="0.85"/>
    <text x="${w / 2}" y="40" text-anchor="middle" fill="#C8A87A" font-size="16" font-weight="bold" font-family="sans-serif">${title}</text>
    <text x="${w / 2}" y="170" text-anchor="middle" fill="#F1F0EE" font-size="72" font-weight="bold" font-family="sans-serif">${value}</text>
    <text x="${w / 2}" y="210" text-anchor="middle" fill="#8A8A9A" font-size="16" font-family="sans-serif">${label}</text>
    <line x1="100" y1="240" x2="300" y2="240" stroke="#333" stroke-width="1"/>
    <text x="${w / 2}" y="270" text-anchor="middle" fill="#C8A87A" font-size="12" font-family="sans-serif">★ Premium Rating</text>
  </svg>`;
}

function svgToDataUrl(svgString: string): string {
  return `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgString)))}`;
}

export function ChartOverlayPanel({ onAddToTimeline }: ChartOverlayPanelProps) {
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [title, setTitle] = useState('ROI by Area');
  const [dataPoints, setDataPoints] = useState<DataPoint[]>(PRESETS[0].data);
  const [duration, setDuration] = useState(5);
  const [previewSvg, setPreviewSvg] = useState<string | null>(null);

  const generateChart = useCallback(() => {
    let svg: string;
    switch (chartType) {
      case 'bar': svg = generateBarSVG(dataPoints, title); break;
      case 'pie': svg = generatePieSVG(dataPoints, title); break;
      case 'line': svg = generateLineSVG(dataPoints, title); break;
      case 'scorecard': svg = generateScorecardSVG(dataPoints, title); break;
    }
    setPreviewSvg(svg);
    toast.success('Chart generated');
  }, [chartType, dataPoints, title]);

  const handleAddToTimeline = useCallback(() => {
    if (!previewSvg || !onAddToTimeline) return;
    const dataUrl = svgToDataUrl(previewSvg);
    onAddToTimeline(dataUrl, `Chart: ${title}`, duration);
    toast.success('Chart added to timeline');
  }, [previewSvg, onAddToTimeline, title, duration]);

  const handleDownload = useCallback(() => {
    if (!previewSvg) return;
    const blob = new Blob([previewSvg], { type: 'image/svg+xml' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `chart-${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
    a.click();
  }, [previewSvg, title]);

  const updateDataPoint = useCallback((index: number, field: 'label' | 'value', val: string) => {
    setDataPoints(prev => prev.map((d, i) => i === index ? { ...d, [field]: field === 'value' ? Number(val) || 0 : val } : d));
  }, []);

  const addDataPoint = useCallback(() => {
    setDataPoints(prev => [...prev, { label: `Item ${prev.length + 1}`, value: 0 }]);
  }, []);

  const removeDataPoint = useCallback((index: number) => {
    setDataPoints(prev => prev.filter((_, i) => i !== index));
  }, []);

  const loadPreset = useCallback((preset: typeof PRESETS[number]) => {
    setTitle(preset.name);
    setDataPoints([...preset.data]);
    setPreviewSvg(null);
  }, []);

  return (
    <div className="p-4 space-y-4" style={{ color: C.textPrimary }}>
      <div className="flex items-center gap-2 mb-2">
        <BarChart3 className="w-4 h-4" style={{ color: C.accent }} />
        <h3 className="text-sm font-semibold">Chart Overlay</h3>
      </div>
      <p className="text-[11px]" style={{ color: C.textSecondary }}>
        Create data visualization overlays for your video. Select chart type, enter data, and add to timeline.
      </p>

      {/* Chart type selector */}
      <div className="grid grid-cols-4 gap-1.5">
        {CHART_TYPES.map(ct => {
          const Icon = ct.icon;
          return (
            <button
              key={ct.id}
              onClick={() => setChartType(ct.id)}
              className="flex flex-col items-center gap-1 py-2 rounded-md text-[10px] transition-all"
              style={{
                background: chartType === ct.id ? C.accentGlow : C.bgButton,
                border: `1px solid ${chartType === ct.id ? C.borderAccent : C.borderSubtle}`,
                color: chartType === ct.id ? C.accent : C.textSecondary,
              }}
            >
              <Icon className="w-4 h-4" />
              {ct.label.split(' ')[0]}
            </button>
          );
        })}
      </div>

      {/* Presets */}
      <div className="space-y-1">
        <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>Presets</span>
        <div className="flex flex-wrap gap-1">
          {PRESETS.map((p, i) => (
            <button key={i} onClick={() => loadPreset(p)} className="px-2 py-1 rounded text-[9px] transition-all hover:opacity-80" style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textSecondary }}>
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <input
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Chart title"
        className="w-full px-3 py-2 rounded-lg text-xs"
        style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}
      />

      {/* Data points */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[10px] uppercase tracking-wider" style={{ color: C.textSecondary }}>Data Points</span>
          <button onClick={addDataPoint} className="flex items-center gap-1 text-[10px]" style={{ color: C.accent }}>
            <Plus className="w-3 h-3" /> Add
          </button>
        </div>
        {dataPoints.map((dp, i) => (
          <div key={i} className="flex gap-1.5 items-center">
            <input value={dp.label} onChange={e => updateDataPoint(i, 'label', e.target.value)} className="flex-1 px-2 py-1 rounded text-[11px]" style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }} />
            <input type="number" value={dp.value} onChange={e => updateDataPoint(i, 'value', e.target.value)} className="w-16 px-2 py-1 rounded text-[11px] text-right" style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.accent }} />
            {dataPoints.length > 1 && <button onClick={() => removeDataPoint(i)} className="text-[10px] px-1 hover:opacity-80" style={{ color: C.textSecondary }}>✕</button>}
          </div>
        ))}
      </div>

      {/* Duration */}
      <div className="flex items-center justify-between">
        <span className="text-[10px]" style={{ color: C.textSecondary }}>Display Duration</span>
        <div className="flex items-center gap-2">
          <input type="range" min={2} max={15} value={duration} onChange={e => setDuration(Number(e.target.value))} className="w-20 h-1 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, ${C.accent} ${((duration - 2) / 13) * 100}%, ${C.bgButton} ${((duration - 2) / 13) * 100}%)` }} />
          <span className="text-[11px] font-mono w-6 text-right" style={{ color: C.accent }}>{duration}s</span>
        </div>
      </div>

      {/* Generate */}
      <button onClick={generateChart} className="w-full py-2.5 rounded-lg text-xs font-semibold transition-all" style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}>
        Generate Chart
      </button>

      {/* Preview */}
      {previewSvg && (
        <div className="space-y-2">
          <div className="rounded-lg overflow-hidden" style={{ border: `1px solid ${C.borderSubtle}` }}>
            <img src={svgToDataUrl(previewSvg)} alt="Chart preview" className="w-full"  loading="lazy" decoding="async" />
          </div>
          <div className="flex gap-2">
            <button onClick={handleDownload} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium" style={{ background: C.bgButton, border: `1px solid ${C.borderSubtle}`, color: C.textPrimary }}>
              <Download className="w-3.5 h-3.5" /> Download SVG
            </button>
            {onAddToTimeline && (
              <button onClick={handleAddToTimeline} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-[11px] font-medium" style={{ background: C.accentGlow, border: `1px solid ${C.borderAccent}`, color: C.accent }}>
                <Plus className="w-3.5 h-3.5" /> Add to Timeline
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
