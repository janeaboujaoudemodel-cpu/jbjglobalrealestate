import { useState, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Maximize2, RotateCcw, Move3D } from 'lucide-react';

interface Design3DViewerProps {
  imageUrl: string;
  projectName?: string;
}

const Design3DViewer = ({ imageUrl, projectName }: Design3DViewerProps) => {
  const [is3D, setIs3D] = useState(false);
  const [rotateX, setRotateX] = useState(0);
  const [rotateY, setRotateY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const lastPos = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (!is3D) return;
    setIsDragging(true);
    lastPos.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [is3D]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDragging || !is3D) return;
    const dx = e.clientX - lastPos.current.x;
    const dy = e.clientY - lastPos.current.y;
    lastPos.current = { x: e.clientX, y: e.clientY };
    setRotateY(prev => Math.max(-30, Math.min(30, prev + dx * 0.3)));
    setRotateX(prev => Math.max(-30, Math.min(30, prev - dy * 0.3)));
  }, [isDragging, is3D]);

  const handlePointerUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  const resetRotation = () => {
    setRotateX(0);
    setRotateY(0);
  };

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${projectName || 'design'}-3d-view.png`;
    link.click();
  };

  return (
    <div className="relative">
      {/* Controls */}
      <div className="absolute top-3 right-3 z-10 flex gap-2">
        <Button
          size="sm"
          variant={is3D ? 'default' : 'outline'}
          onClick={() => { setIs3D(!is3D); resetRotation(); }}
          className={is3D 
            ? 'bg-gold hover:bg-amber-600 text-black border-0' 
            : 'bg-black/60 border-gold/40 text-gold hover:bg-gold/15'
          }
        >
          <Move3D className="w-4 h-4 mr-1" />
          {is3D ? '3D On' : '3D View'}
        </Button>
        {is3D && (
          <Button
            size="sm"
            variant="outline"
            onClick={resetRotation}
            className="bg-black/60 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        )}
        <Button
          size="sm"
          variant="outline"
          onClick={handleDownload}
          className="bg-black/60 border-zinc-600 text-zinc-300 hover:bg-zinc-700"
        >
          <Download className="w-4 h-4" />
        </Button>
      </div>

      {/* 3D Viewport */}
      <div
        ref={containerRef}
        className="relative overflow-hidden rounded-xl"
        style={{ perspective: is3D ? '1000px' : 'none' }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <img
          src={imageUrl}
          alt="Generated design"
          draggable={false}
          className="w-full h-auto select-none transition-transform duration-100"
          style={{
            transform: is3D
              ? `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`
              : 'none',
            cursor: is3D ? (isDragging ? 'grabbing' : 'grab') : 'default',
          }}
        />
        {is3D && (
          <div className="absolute bottom-3 left-3 bg-black/70 text-gold text-xs px-3 py-1.5 rounded-full backdrop-blur-sm">
            🎮 Drag to rotate • {rotateX.toFixed(0)}° × {rotateY.toFixed(0)}°
          </div>
        )}
      </div>
    </div>
  );
};

export default Design3DViewer;
