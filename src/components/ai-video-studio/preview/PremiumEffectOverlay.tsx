import React, { useMemo } from 'react';

interface PremiumEffectOverlayProps {
  effectId: string | null;
}

interface Particle {
  id: number;
  left: number;
  delay: number;
  duration: number;
  size: number;
  color: string;
  rotation: number;
  drift: number;
}

function useParticles(count: number, colors: string[]): Particle[] {
  return useMemo(() => Array.from({ length: count }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 2 + Math.random() * 3,
    size: 4 + Math.random() * 8,
    color: colors[Math.floor(Math.random() * colors.length)],
    rotation: Math.random() * 360,
    drift: (Math.random() - 0.5) * 60,
  })), []);
}

// ── Money Rain ────────────────────────────────────────────────────────────────
function MoneyRain() {
  const particles = useParticles(35, ['#22c55e', '#16a34a', '#F59E0B', '#FBBF24', '#15803d']);
  return (
    <>
      <style>{`
        @keyframes moneyFall {
          0%   { transform: translateY(-10%) rotate(var(--rot)) translateX(0px); opacity: 1; }
          80%  { opacity: 1; }
          100% { transform: translateY(110%) rotate(calc(var(--rot) + 180deg)) translateX(var(--drift)); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: `${p.size * 2}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: '2px',
            boxShadow: `0 0 4px ${p.color}88`,
            '--rot': `${p.rotation}deg`,
            '--drift': `${p.drift}px`,
            animation: `moneyFall ${p.duration}s ${p.delay}s ease-in infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Confetti Burst ────────────────────────────────────────────────────────────
function ConfettiBurst() {
  const particles = useParticles(55, ['#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4']);
  return (
    <>
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-5%) rotate(var(--rot)) scaleY(1); opacity: 1; }
          50%  { transform: translateY(55%) rotate(calc(var(--rot) + 360deg)) scaleY(0.6) translateX(var(--drift)); opacity: 0.9; }
          100% { transform: translateY(115%) rotate(calc(var(--rot) + 720deg)) scaleY(1) translateX(calc(var(--drift)*2)); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: p.color,
            borderRadius: p.id % 3 === 0 ? '50%' : p.id % 3 === 1 ? '2px' : '0',
            '--rot': `${p.rotation}deg`,
            '--drift': `${p.drift}px`,
            animation: `confettiFall ${p.duration}s ${p.delay}s linear infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Gold Glow ─────────────────────────────────────────────────────────────────
function GoldGlow() {
  return (
    <>
      <style>{`
        @keyframes goldPulse {
          0%,100% { opacity: 0.15; transform: scale(1); }
          50%      { opacity: 0.45; transform: scale(1.15); }
        }
        @keyframes shimmerBar {
          0%   { transform: translateX(-100%) skewX(-15deg); opacity: 0; }
          40%  { opacity: 0.5; }
          100% { transform: translateX(300%) skewX(-15deg); opacity: 0; }
        }
        @keyframes goldSparkle {
          0%,100% { transform: scale(0) rotate(0deg); opacity: 0; }
          50%      { transform: scale(1) rotate(45deg); opacity: 1; }
        }
      `}</style>
      {/* Core glow */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 70% 60% at 50% 50%, rgba(245,158,11,0.35) 0%, rgba(251,191,36,0.15) 50%, transparent 75%)',
        animation: 'goldPulse 2.5s ease-in-out infinite',
      }} />
      {/* Shimmer bars */}
      {[0, 0.8, 1.6, 2.4].map((delay, i) => (
        <div key={i} style={{
          position: 'absolute', top: `${15 + i * 20}%`, left: '-20%', right: 0,
          height: '2px',
          background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.9), rgba(253,230,138,1), transparent)',
          animation: `shimmerBar 2.5s ${delay}s ease-in-out infinite`,
        }} />
      ))}
      {/* Corner sparkles */}
      {[{x:15,y:15},{x:85,y:20},{x:20,y:80},{x:80,y:75},{x:50,y:10}].map((pos,i) => (
        <div key={i} style={{
          position:'absolute', left:`${pos.x}%`, top:`${pos.y}%`,
          width: '12px', height: '12px',
          background: 'rgba(253,230,138,0.9)',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          animation: `goldSparkle ${1.5 + i * 0.4}s ${i * 0.5}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── Star Shower ───────────────────────────────────────────────────────────────
function StarShower() {
  const particles = useParticles(28, ['#FBBF24', '#FCD34D', '#FDE68A', '#ffffff', '#F59E0B']);
  return (
    <>
      <style>{`
        @keyframes starFall {
          0%   { transform: translateY(-8%) translateX(0) scale(1); opacity: 1; }
          70%  { opacity: 0.8; }
          100% { transform: translateY(108%) translateX(var(--drift)) scale(0.3); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size * 2}px ${p.color}, 0 0 ${p.size}px ${p.color}88`,
            '--drift': `${p.drift}px`,
            animation: `starFall ${p.duration}s ${p.delay}s ease-in infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Luxury Sparkle ────────────────────────────────────────────────────────────
function LuxurySparkle() {
  const particles = useParticles(22, ['#60A5FA', '#A78BFA', '#F0ABFC', '#38BDF8', '#818CF8']);
  return (
    <>
      <style>{`
        @keyframes diamondFloat {
          0%   { transform: translateY(5%) rotate(45deg) scale(0); opacity: 0; }
          30%  { opacity: 1; transform: translateY(0%) rotate(45deg) scale(1); }
          70%  { opacity: 0.8; }
          100% { transform: translateY(-30%) rotate(45deg) scale(0.2); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: `${20 + (p.id % 60)}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            background: `linear-gradient(135deg, ${p.color}, ${p.color}44)`,
            border: `1px solid ${p.color}`,
            boxShadow: `0 0 ${p.size * 3}px ${p.color}66`,
            animation: `diamondFloat ${p.duration}s ${p.delay}s ease-out infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Fire Energy ───────────────────────────────────────────────────────────────
function FireEnergy() {
  const particles = useParticles(25, ['#EF4444', '#F97316', '#FBBF24', '#DC2626', '#FB923C']);
  return (
    <>
      <style>{`
        @keyframes fireRise {
          0%   { transform: translateY(0) scaleX(1) scaleY(1); opacity: 0.9; }
          40%  { transform: translateY(-40%) scaleX(0.85) scaleY(1.3) translateX(var(--drift)); opacity: 0.7; }
          100% { transform: translateY(-90%) scaleX(0.4) scaleY(0.5) translateX(calc(var(--drift)*1.5)); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            bottom: '10%',
            width: `${p.size}px`,
            height: `${p.size * 2}px`,
            borderRadius: '50% 50% 40% 40%',
            background: `radial-gradient(ellipse at bottom, ${p.color}, ${p.color}22)`,
            filter: 'blur(1px)',
            '--drift': `${p.drift}px`,
            animation: `fireRise ${p.duration}s ${p.delay}s ease-out infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Aurora Shimmer ────────────────────────────────────────────────────────────
function AuroraShimmer() {
  return (
    <>
      <style>{`
        @keyframes auroraWave {
          0%   { background-position: 0% 50%; opacity: 0.4; }
          50%  { background-position: 100% 50%; opacity: 0.6; }
          100% { background-position: 0% 50%; opacity: 0.4; }
        }
        @keyframes auroraLayer {
          0%,100% { transform: scaleY(1) translateY(0); }
          50%      { transform: scaleY(1.2) translateY(-10%); }
        }
      `}</style>
      {['rgba(56,189,248,0.3),rgba(167,139,250,0.4),rgba(240,171,252,0.3)',
        'rgba(16,185,129,0.25),rgba(59,130,246,0.35),rgba(139,92,246,0.25)',
        'rgba(245,158,11,0.2),rgba(236,72,153,0.25),rgba(99,102,241,0.2)',
      ].map((grad, i) => (
        <div key={i} style={{
          position: 'absolute',
          top: `${10 + i * 25}%`,
          left: 0, right: 0,
          height: '35%',
          background: `linear-gradient(135deg, ${grad})`,
          backgroundSize: '300% 300%',
          filter: 'blur(20px)',
          animation: `auroraWave ${4 + i}s ${i * 1.2}s ease-in-out infinite, auroraLayer ${6 + i * 0.5}s ${i * 0.8}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── Snow Fall ─────────────────────────────────────────────────────────────────
function SnowFall() {
  const particles = useParticles(38, ['#ffffff', '#e2e8f0', '#f1f5f9', '#cbd5e1']);
  return (
    <>
      <style>{`
        @keyframes snowDrift {
          0%   { transform: translateY(-5%) translateX(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(108%) translateX(var(--drift)) rotate(360deg); opacity: 0.2; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: `${p.size}px`,
            height: `${p.size}px`,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 ${p.size}px rgba(255,255,255,0.6)`,
            '--drift': `${p.drift}px`,
            animation: `snowDrift ${p.duration + 2}s ${p.delay}s linear infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

// ── Lightning Strike ──────────────────────────────────────────────────────────
function LightningStrike() {
  return (
    <>
      <style>{`
        @keyframes lightningFlash {
          0%,90%,100% { opacity: 0; }
          5%,15%       { opacity: 1; }
          10%          { opacity: 0.3; }
        }
        @keyframes lightningBolt {
          0%,100% { opacity: 0; transform: scaleY(0) translateX(0); }
          5%      { opacity: 1; transform: scaleY(1) translateX(0); }
          10%     { opacity: 0.4; transform: scaleY(1) translateX(-2px); }
          15%     { opacity: 0; transform: scaleY(0); }
        }
      `}</style>
      {/* Screen flash */}
      <div style={{
        position: 'absolute', inset: 0,
        background: 'rgba(147,197,253,0.3)',
        animation: 'lightningFlash 3s ease-in-out infinite',
      }} />
      {/* Bolts */}
      {[25, 55, 75].map((left, i) => (
        <div key={i} style={{
          position: 'absolute', left: `${left}%`, top: 0,
          width: '3px', height: '40%',
          background: 'linear-gradient(to bottom, #FDE68A, #60A5FA, transparent)',
          transformOrigin: 'top',
          filter: 'blur(1px)',
          boxShadow: '0 0 8px #60A5FA, 0 0 20px #93C5FD44',
          animation: `lightningBolt 3s ${i * 0.8}s ease-in-out infinite`,
        }} />
      ))}
    </>
  );
}

// ── Luxury Rain ───────────────────────────────────────────────────────────────
function LuxuryRain() {
  const particles = useParticles(30, ['#F59E0B', '#FBBF24', '#FCD34D', '#D97706', '#92400E']);
  return (
    <>
      <style>{`
        @keyframes luxuryDrop {
          0%   { transform: translateY(-5%) scaleY(1); opacity: 1; }
          80%  { opacity: 0.7; }
          100% { transform: translateY(110%) scaleY(0.6); opacity: 0; }
        }
      `}</style>
      {particles.map(p => (
        <div
          key={p.id}
          style={{
            position: 'absolute',
            left: `${p.left}%`,
            top: 0,
            width: `${p.size * 0.4}px`,
            height: `${p.size * 2.5}px`,
            background: `linear-gradient(to bottom, ${p.color}ff, ${p.color}44)`,
            borderRadius: '0 0 50% 50%',
            boxShadow: `0 0 4px ${p.color}66`,
            animation: `luxuryDrop ${p.duration}s ${p.delay}s ease-in infinite`,
          } as React.CSSProperties}
        />
      ))}
    </>
  );
}

const EFFECT_MAP: Record<string, React.FC> = {
  'money-rain':      MoneyRain,
  'confetti':        ConfettiBurst,
  'gold-glow':       GoldGlow,
  'stars':           StarShower,
  'luxury-sparkle':  LuxurySparkle,
  'fire':            FireEnergy,
  'aurora':          AuroraShimmer,
  'snow':            SnowFall,
  'lightning':       LightningStrike,
  'luxury-rain':     LuxuryRain,
};

export function PremiumEffectOverlay({ effectId }: PremiumEffectOverlayProps) {
  if (!effectId) return null;
  const EffectComponent = EFFECT_MAP[effectId];
  if (!EffectComponent) return null;

  return (
    <div
      className="absolute inset-0 pointer-events-none overflow-hidden"
      style={{ zIndex: 20 }}
    >
      <EffectComponent />
    </div>
  );
}
