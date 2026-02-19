import React, { useRef, useState, useCallback, useEffect } from 'react';

interface BeforeAfterSplitOverlayProps {
  /** The CSS filter string for the "After" (right) side */
  filterCss: string;
  /** Vignette opacity 0–1 for the filtered side */
  vignetteOpacity?: number;
  /** The media element to clone on both sides (video or img src URL) */
  mediaSrc: string;
  mediaType: 'video' | 'image';
  isMuted?: boolean;
  currentTime?: number;
}

export function BeforeAfterSplitOverlay({
  filterCss,
  vignetteOpacity = 0,
  mediaSrc,
  mediaType,
  isMuted = true,
  currentTime = 0,
}: BeforeAfterSplitOverlayProps) {
  const [splitX, setSplitX] = useState(50); // percentage
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const videoBeforeRef = useRef<HTMLVideoElement>(null);
  const videoAfterRef = useRef<HTMLVideoElement>(null);

  // Sync video currentTime on both sides
  useEffect(() => {
    if (mediaType !== 'video') return;
    [videoBeforeRef, videoAfterRef].forEach(ref => {
      if (ref.current && Math.abs(ref.current.currentTime - currentTime) > 0.15) {
        ref.current.currentTime = currentTime;
      }
    });
  }, [currentTime, mediaType]);

  const getXPercent = useCallback((clientX: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return 50;
    return Math.max(2, Math.min(98, ((clientX - rect.left) / rect.width) * 100));
  }, []);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging) return;
    setSplitX(getXPercent(e.clientX));
  }, [isDragging, getXPercent]);

  const onMouseUp = useCallback(() => setIsDragging(false), []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (!isDragging) return;
    setSplitX(getXPercent(e.touches[0].clientX));
  }, [isDragging, getXPercent]);

  useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    window.addEventListener('touchmove', onTouchMove, { passive: true });
    window.addEventListener('touchend', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', onMouseUp);
    };
  }, [onMouseMove, onMouseUp, onTouchMove]);

  const mediaStyle: React.CSSProperties = {
    position: 'absolute',
    inset: 0,
    width: '100%',
    height: '100%',
    objectFit: 'contain',
  };

  return (
    <div
      ref={containerRef}
      className="absolute inset-0 overflow-hidden"
      style={{ cursor: isDragging ? 'col-resize' : 'default' }}
    >
      {/* ── LEFT: Original (no filter) ── */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - splitX}% 0 0)` }}>
        {mediaType === 'video' ? (
          <video
            ref={videoBeforeRef}
            src={mediaSrc}
            style={mediaStyle}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={mediaSrc} alt="before" style={mediaStyle} />
        )}
        {/* BEFORE label */}
        <div
          className="absolute bottom-3 pointer-events-none select-none"
          style={{ left: `min(${splitX / 2}%, calc(${splitX}% - 60px))` }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase text-white/80 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
            Before
          </span>
        </div>
      </div>

      {/* ── RIGHT: Filtered ── */}
      <div className="absolute inset-0" style={{ clipPath: `inset(0 0 0 ${splitX}%)` }}>
        {mediaType === 'video' ? (
          <video
            ref={videoAfterRef}
            src={mediaSrc}
            style={{ ...mediaStyle, filter: filterCss }}
            muted
            playsInline
            preload="metadata"
          />
        ) : (
          <img src={mediaSrc} alt="after" style={{ ...mediaStyle, filter: filterCss }} />
        )}
        {/* Vignette */}
        {vignetteOpacity > 0 && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,${vignetteOpacity}) 100%)`,
              clipPath: `inset(0 0 0 ${splitX}%)`,
            }}
          />
        )}
        {/* AFTER label */}
        <div
          className="absolute bottom-3 pointer-events-none select-none"
          style={{ left: `calc(${splitX}% + 8px)` }}
        >
          <span className="text-[10px] font-bold tracking-widest uppercase text-amber-300/90 bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">
            After
          </span>
        </div>
      </div>

      {/* ── Divider line + handle ── */}
      <div
        className="absolute top-0 bottom-0 flex items-center justify-center"
        style={{
          left: `calc(${splitX}% - 1px)`,
          width: 2,
          background: 'rgba(255,255,255,0.85)',
          zIndex: 20,
          boxShadow: '0 0 8px rgba(0,0,0,0.6)',
          cursor: 'col-resize',
          userSelect: 'none',
        }}
        onMouseDown={onMouseDown}
        onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
      >
        {/* Circular grip */}
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
          style={{
            background: 'white',
            boxShadow: '0 2px 12px rgba(0,0,0,0.5)',
            border: '2px solid rgba(255,255,255,0.9)',
          }}
        >
          {/* Double chevron SVG */}
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M6 4L2 8L6 12" stroke="#1e1e2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M10 4L14 8L10 12" stroke="#1e1e2e" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        {/* Top tick */}
        <div className="absolute top-2 w-1 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
        {/* Bottom tick */}
        <div className="absolute bottom-2 w-1 h-4 rounded-full" style={{ background: 'rgba(255,255,255,0.7)' }} />
      </div>

      {/* Invisible wider drag hit area */}
      <div
        className="absolute top-0 bottom-0"
        style={{ left: `calc(${splitX}% - 16px)`, width: 32, cursor: 'col-resize', zIndex: 21 }}
        onMouseDown={onMouseDown}
        onTouchStart={(e) => { e.preventDefault(); setIsDragging(true); }}
      />
    </div>
  );
}
