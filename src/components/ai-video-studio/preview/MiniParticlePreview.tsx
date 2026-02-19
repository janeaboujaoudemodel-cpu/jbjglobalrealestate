/**
 * MiniParticlePreview — self-contained 60fps CSS particle thumbnails for each effect.
 * Designed to fit inside 80×56px card previews in OverlayEffectsPanel.
 * All animations are pure CSS (no canvas, no JS timers).
 */
import React, { useMemo } from 'react';

// ── Shared keyframe injection (one <style> block per instance) ────────────────
function Keyframes({ css }: { css: string }) {
  return <style>{css}</style>;
}

// ── Deterministic pseudo-random seeded by index ───────────────────────────────
function seeded(seed: number, max = 1) {
  const x = Math.sin(seed + 1) * 43758.5453;
  return ((x - Math.floor(x)) * max);
}

// ── MONEY BILLS ───────────────────────────────────────────────────────────────
function MiniMoneyRain() {
  const bills = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 100),
    delay: seeded(i * 7, 2.4),
    dur: 1.2 + seeded(i * 11, 1.2),
    w: 8 + seeded(i * 5, 6),
    h: 4 + seeded(i * 9, 3),
    rot: seeded(i * 13, 360),
    drift: (seeded(i * 17, 1) - 0.5) * 24,
    color: ['#22c55e','#16a34a','#F59E0B','#FBBF24','#15803d'][i % 5],
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmbFall {
          0%   { transform: translateY(-10%) rotate(var(--r)) translateX(0); opacity:1; }
          80%  { opacity:0.9; }
          100% { transform: translateY(110%) rotate(calc(var(--r)+180deg)) translateX(var(--d)); opacity:0; }
        }
      `} />
      {bills.map(b => (
        <div key={b.id} style={{
          position:'absolute', left:`${b.left}%`, top:0,
          width:`${b.w}px`, height:`${b.h}px`,
          background: b.color,
          borderRadius:'1px',
          boxShadow:`0 0 3px ${b.color}88`,
          '--r': `${b.rot}deg`,
          '--d': `${b.drift}px`,
          animation:`mmbFall ${b.dur}s ${b.delay}s ease-in infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── CONFETTI ──────────────────────────────────────────────────────────────────
function MiniConfetti() {
  const COLORS = ['#EF4444','#3B82F6','#10B981','#F59E0B','#8B5CF6','#EC4899','#06B6D4'];
  const pieces = useMemo(() => Array.from({ length: 22 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 100),
    delay: seeded(i * 7, 2),
    dur: 1.1 + seeded(i * 11, 1.2),
    size: 4 + seeded(i * 5, 5),
    rot: seeded(i * 13, 360),
    drift: (seeded(i * 17, 1) - 0.5) * 28,
    color: COLORS[i % COLORS.length],
    shape: i % 3, // 0=square, 1=circle, 2=rect
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmcFall {
          0%   { transform: translateY(-5%) rotate(var(--r)); opacity:1; }
          50%  { transform: translateY(55%) rotate(calc(var(--r)+360deg)) translateX(var(--d)); opacity:0.85; }
          100% { transform: translateY(110%) rotate(calc(var(--r)+720deg)) translateX(calc(var(--d)*1.5)); opacity:0; }
        }
      `} />
      {pieces.map(p => (
        <div key={p.id} style={{
          position:'absolute', left:`${p.left}%`, top:0,
          width:`${p.shape===2? p.size*1.6 : p.size}px`,
          height:`${p.shape===2? p.size*0.6 : p.size}px`,
          background: p.color,
          borderRadius: p.shape===1 ? '50%' : p.shape===0 ? '1px' : '0',
          '--r': `${p.rot}deg`,
          '--d': `${p.drift}px`,
          animation:`mmcFall ${p.dur}s ${p.delay}s linear infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── GOLD SHIMMER ──────────────────────────────────────────────────────────────
function MiniGoldGlow() {
  return (
    <>
      <Keyframes css={`
        @keyframes mmgPulse { 0%,100%{opacity:.2;transform:scale(1)} 50%{opacity:.6;transform:scale(1.1)} }
        @keyframes mmgShimmer { 0%{transform:translateX(-120%) skewX(-15deg);opacity:0} 40%{opacity:.7} 100%{transform:translateX(260%) skewX(-15deg);opacity:0} }
        @keyframes mmgSpark { 0%,100%{transform:scale(0) rotate(0deg);opacity:0} 50%{transform:scale(1) rotate(45deg);opacity:1} }
      `} />
      {/* Core radial glow */}
      <div style={{
        position:'absolute', inset:0,
        background:'radial-gradient(ellipse 80% 70% at 50% 50%, rgba(245,158,11,0.55) 0%, rgba(251,191,36,0.25) 55%, transparent 80%)',
        animation:'mmgPulse 2.2s ease-in-out infinite',
      }} />
      {/* Shimmer bars */}
      {[0,0.7,1.4].map((d,i) => (
        <div key={i} style={{
          position:'absolute', top:`${20+i*28}%`, left:'-30%', right:0,
          height:'1.5px',
          background:'linear-gradient(90deg, transparent, rgba(251,191,36,1), rgba(253,230,138,1), transparent)',
          animation:`mmgShimmer 1.8s ${d}s ease-in-out infinite`,
        }} />
      ))}
      {/* Sparkle stars */}
      {[{x:15,y:15},{x:80,y:20},{x:25,y:75},{x:75,y:70}].map((pos,i)=>(
        <div key={i} style={{
          position:'absolute', left:`${pos.x}%`, top:`${pos.y}%`,
          width:'7px', height:'7px',
          background:'rgba(253,230,138,1)',
          clipPath:'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)',
          animation:`mmgSpark ${1.4+i*.35}s ${i*.45}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── SNOW ──────────────────────────────────────────────────────────────────────
function MiniSnow() {
  const flakes = useMemo(() => Array.from({ length: 20 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 100),
    delay: seeded(i * 7, 3),
    dur: 2 + seeded(i * 11, 2),
    size: 3 + seeded(i * 5, 4),
    drift: (seeded(i * 17, 1) - 0.5) * 20,
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmsFall {
          0%   { transform:translateY(-5%) translateX(0) rotate(0deg); opacity:.9; }
          100% { transform:translateY(112%) translateX(var(--d)) rotate(360deg); opacity:.15; }
        }
      `} />
      {flakes.map(f => (
        <div key={f.id} style={{
          position:'absolute', left:`${f.left}%`, top:0,
          width:`${f.size}px`, height:`${f.size}px`,
          borderRadius:'50%',
          background:'#e2e8f0',
          boxShadow:`0 0 ${f.size}px rgba(255,255,255,0.7)`,
          '--d': `${f.drift}px`,
          animation:`mmsFall ${f.dur}s ${f.delay}s linear infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── FIRE ──────────────────────────────────────────────────────────────────────
function MiniFire() {
  const FIRE_COLORS = ['#EF4444','#F97316','#FBBF24','#DC2626','#FB923C'];
  const flames = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 100),
    delay: seeded(i * 7, 1.8),
    dur: 0.7 + seeded(i * 11, 0.8),
    w: 5 + seeded(i * 5, 7),
    h: 8 + seeded(i * 9, 12),
    drift: (seeded(i * 17, 1) - 0.5) * 16,
    color: FIRE_COLORS[i % 5],
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmfRise {
          0%   { transform:translateY(0) scaleX(1); opacity:.85; }
          40%  { transform:translateY(-38%) scaleX(.8) translateX(var(--d)); opacity:.7; }
          100% { transform:translateY(-85%) scaleX(.35) translateX(calc(var(--d)*1.4)); opacity:0; }
        }
      `} />
      {/* Base glow */}
      <div style={{
        position:'absolute', bottom:0, left:0, right:0, height:'30%',
        background:'linear-gradient(to top, rgba(239,68,68,0.4), transparent)',
        filter:'blur(4px)',
      }} />
      {flames.map(f => (
        <div key={f.id} style={{
          position:'absolute', left:`${f.left}%`, bottom:'8%',
          width:`${f.w}px`, height:`${f.h}px`,
          borderRadius:'50% 50% 40% 40%',
          background:`radial-gradient(ellipse at bottom, ${f.color}, ${f.color}22)`,
          filter:'blur(0.8px)',
          '--d': `${f.drift}px`,
          animation:`mmfRise ${f.dur}s ${f.delay}s ease-out infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── AURORA ────────────────────────────────────────────────────────────────────
function MiniAurora() {
  const LAYERS = [
    'rgba(56,189,248,0.5),rgba(167,139,250,0.6)',
    'rgba(16,185,129,0.4),rgba(59,130,246,0.55)',
    'rgba(245,158,11,0.3),rgba(236,72,153,0.45)',
  ];

  return (
    <>
      <Keyframes css={`
        @keyframes mmaWave {
          0%   { background-position:0% 50%; opacity:.5; }
          50%  { background-position:100% 50%; opacity:.8; }
          100% { background-position:0% 50%; opacity:.5; }
        }
        @keyframes mmaLayer {
          0%,100% { transform:scaleY(1) translateY(0); }
          50%      { transform:scaleY(1.25) translateY(-12%); }
        }
      `} />
      {LAYERS.map((grad, i) => (
        <div key={i} style={{
          position:'absolute',
          top:`${5+i*28}%`, left:0, right:0,
          height:'38%',
          background:`linear-gradient(135deg, ${grad})`,
          backgroundSize:'300% 300%',
          filter:'blur(10px)',
          animation:`mmaWave ${3+i}s ${i*.9}s ease-in-out infinite, mmaLayer ${5+i*.5}s ${i*.7}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── LUXURY RAIN (gold droplets) ───────────────────────────────────────────────
function MiniLuxuryRain() {
  const drops = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 100),
    delay: seeded(i * 7, 2.2),
    dur: 0.9 + seeded(i * 11, 1),
    w: 2 + seeded(i * 5, 2),
    h: 7 + seeded(i * 9, 9),
    color: ['#F59E0B','#FBBF24','#FCD34D','#D97706'][i % 4],
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmlDrop {
          0%   { transform:translateY(-5%) scaleY(1); opacity:1; }
          80%  { opacity:.7; }
          100% { transform:translateY(112%) scaleY(.6); opacity:0; }
        }
      `} />
      {drops.map(d => (
        <div key={d.id} style={{
          position:'absolute', left:`${d.left}%`, top:0,
          width:`${d.w}px`, height:`${d.h}px`,
          background:`linear-gradient(to bottom, ${d.color}ff, ${d.color}44)`,
          borderRadius:'0 0 50% 50%',
          boxShadow:`0 0 3px ${d.color}88`,
          animation:`mmlDrop ${d.dur}s ${d.delay}s ease-in infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── STAR SHOWER ───────────────────────────────────────────────────────────────
function MiniStarShower() {
  const STAR_COLORS = ['#FBBF24','#FCD34D','#FDE68A','#ffffff','#F59E0B'];
  const stars = useMemo(() => Array.from({ length: 16 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 100),
    delay: seeded(i * 7, 2.5),
    dur: 1.2 + seeded(i * 11, 1.5),
    size: 2 + seeded(i * 5, 4),
    drift: (seeded(i * 17, 1) - 0.5) * 22,
    color: STAR_COLORS[i % 5],
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmstFall {
          0%   { transform:translateY(-8%) translateX(0) scale(1); opacity:1; }
          70%  { opacity:.8; }
          100% { transform:translateY(110%) translateX(var(--d)) scale(.25); opacity:0; }
        }
      `} />
      {stars.map(s => (
        <div key={s.id} style={{
          position:'absolute', left:`${s.left}%`, top:0,
          width:`${s.size}px`, height:`${s.size}px`,
          borderRadius:'50%',
          background: s.color,
          boxShadow:`0 0 ${s.size*2}px ${s.color}, 0 0 ${s.size}px ${s.color}`,
          '--d': `${s.drift}px`,
          animation:`mmstFall ${s.dur}s ${s.delay}s ease-in infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── DIAMOND SPARKLE ───────────────────────────────────────────────────────────
function MiniDiamondSparkle() {
  const DIAMOND_COLORS = ['#60A5FA','#A78BFA','#F0ABFC','#38BDF8','#818CF8'];
  const diamonds = useMemo(() => Array.from({ length: 14 }, (_, i) => ({
    id: i,
    left: seeded(i * 3, 90),
    top: 10 + seeded(i * 7, 80),
    delay: seeded(i * 11, 2.5),
    dur: 1.4 + seeded(i * 13, 1.4),
    size: 4 + seeded(i * 5, 6),
    color: DIAMOND_COLORS[i % 5],
  })), []);

  return (
    <>
      <Keyframes css={`
        @keyframes mmdFloat {
          0%   { transform:translateY(5%) rotate(45deg) scale(0); opacity:0; }
          30%  { opacity:1; transform:translateY(0%) rotate(45deg) scale(1); }
          70%  { opacity:.8; }
          100% { transform:translateY(-35%) rotate(45deg) scale(.15); opacity:0; }
        }
      `} />
      {diamonds.map(d => (
        <div key={d.id} style={{
          position:'absolute', left:`${d.left}%`, top:`${d.top}%`,
          width:`${d.size}px`, height:`${d.size}px`,
          background:`linear-gradient(135deg, ${d.color}, ${d.color}55)`,
          border:`1px solid ${d.color}`,
          boxShadow:`0 0 ${d.size*2}px ${d.color}88`,
          animation:`mmdFloat ${d.dur}s ${d.delay}s ease-out infinite`,
        } as React.CSSProperties} />
      ))}
    </>
  );
}

// ── LIGHTNING ─────────────────────────────────────────────────────────────────
function MiniLightning() {
  return (
    <>
      <Keyframes css={`
        @keyframes mmlFlash { 0%,90%,100%{opacity:0} 5%,15%{opacity:1} 10%{opacity:.3} }
        @keyframes mmlBolt  { 0%,100%{opacity:0;transform:scaleY(0)} 5%{opacity:1;transform:scaleY(1)} 15%{opacity:0;transform:scaleY(0)} }
      `} />
      <div style={{
        position:'absolute', inset:0,
        background:'rgba(147,197,253,0.35)',
        animation:'mmlFlash 2.5s ease-in-out infinite',
      }} />
      {[22,52,78].map((left,i) => (
        <div key={i} style={{
          position:'absolute', left:`${left}%`, top:0,
          width:'2px', height:'45%',
          background:'linear-gradient(to bottom, #FDE68A, #60A5FA, transparent)',
          transformOrigin:'top',
          filter:'blur(0.7px)',
          boxShadow:'0 0 6px #60A5FA',
          animation:`mmlBolt 2.5s ${i*.7}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── REGISTRY ─────────────────────────────────────────────────────────────────
const MINI_EFFECT_MAP: Record<string, React.FC> = {
  'money-rain':      MiniMoneyRain,
  'confetti':        MiniConfetti,
  'gold-glow':       MiniGoldGlow,
  'luxury-rain':     MiniLuxuryRain,
  'stars':           MiniStarShower,
  'luxury-sparkle':  MiniDiamondSparkle,
  'fire':            MiniFire,
  'aurora':          MiniAurora,
  'snow':            MiniSnow,
  'lightning':       MiniLightning,
};

// ── Exported component ─────────────────────────────────────────────────────────
interface MiniParticlePreviewProps {
  effectId: string;
  className?: string;
  style?: React.CSSProperties;
}

export function MiniParticlePreview({ effectId, className = '', style }: MiniParticlePreviewProps) {
  const Component = MINI_EFFECT_MAP[effectId];

  // Background per effect family
  const bg: Record<string, string> = {
    'money-rain':     'linear-gradient(135deg,#0a1a0a,#0d2210)',
    'confetti':       'linear-gradient(135deg,#0f0820,#170d30)',
    'gold-glow':      'linear-gradient(135deg,#1a1000,#2a1a00)',
    'luxury-rain':    'linear-gradient(135deg,#1a1200,#221800)',
    'stars':          'linear-gradient(135deg,#03050f,#080d1e)',
    'luxury-sparkle': 'linear-gradient(135deg,#05080f,#0a0518)',
    'fire':           'linear-gradient(135deg,#100200,#1a0500)',
    'aurora':         'linear-gradient(135deg,#020810,#030c18)',
    'snow':           'linear-gradient(135deg,#050810,#08101c)',
    'lightning':      'linear-gradient(135deg,#030510,#04061a)',
  };

  return (
    <div
      className={`relative overflow-hidden rounded-md ${className}`}
      style={{ background: bg[effectId] ?? '#0a0a14', ...style }}
    >
      {Component ? <Component /> : null}
    </div>
  );
}
