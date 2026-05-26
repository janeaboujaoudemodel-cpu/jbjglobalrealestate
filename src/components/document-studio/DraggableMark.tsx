/**
 * DraggableMark — a freely positionable mark (signature, stamp, date, etc.)
 * placed inside the A4 preview body. Drag with pointer, remove with the
 * hover × button. Position is stored in pixel coordinates relative to the
 * containing body element.
 */
import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";

export interface DraggableMarkProps {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  onRemove: () => void;
  zIndex?: number;
  children: React.ReactNode;
  ariaLabel?: string;
}

export default function DraggableMark({
  x, y, onChange, onRemove, zIndex = 5, children, ariaLabel,
}: DraggableMarkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | { dx: number; dy: number }>(null);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      const nx = Math.max(0, Math.min(r.width  - 20, e.clientX - r.left - drag.dx));
      const ny = Math.max(0, Math.min(r.height - 20, e.clientY - r.top  - drag.dy));
      onChange(nx, ny);
    };
    const onUp = () => setDrag(null);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, onChange]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      className="group absolute select-none"
      style={{ left: x, top: y, zIndex, cursor: drag ? "grabbing" : "grab", touchAction: "none" }}
      onPointerDown={(e) => {
        const r = ref.current!.getBoundingClientRect();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setDrag({ dx: e.clientX - r.left, dy: e.clientY - r.top });
      }}
    >
      {children}
      {drag && (
        <>
          {/* vertical guide aligned to left edge */}
          <div
            data-drag-guide="true"
            style={{
              position: "absolute", left: 0, top: -9999, bottom: -9999, width: 1,
              background: "#B89555", opacity: 0.55, pointerEvents: "none", zIndex: 9999,
            }}
          />
          {/* horizontal guide aligned to top edge */}
          <div
            data-drag-guide="true"
            style={{
              position: "absolute", top: 0, left: -9999, right: -9999, height: 1,
              background: "#B89555", opacity: 0.55, pointerEvents: "none", zIndex: 9999,
            }}
          />
          {/* coords chip */}
          <div
            data-drag-guide="true"
            style={{
              position: "absolute", top: -22, left: 0,
              padding: "2px 6px", borderRadius: 4,
              background: "#1A1A1A", color: "#FDFBF7",
              fontSize: 10, fontVariantNumeric: "tabular-nums",
              whiteSpace: "nowrap", pointerEvents: "none", zIndex: 10000,
            }}
          >
            x {Math.round(x)} · y {Math.round(y)}
          </div>
        </>
      )}
      <button
        type="button"
        onPointerDown={(e) => e.stopPropagation()}
        onClick={onRemove}
        title="Remove"
        aria-label="Remove field"
        className="absolute -top-2 -right-2 hidden group-hover:flex h-5 w-5 rounded-full bg-white border border-[#B89555]/40 items-center justify-center shadow-sm"
      >
        <X className="w-3 h-3 text-red-600" />
      </button>
    </div>
  );
}
