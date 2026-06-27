/**
 * DraggableMark — a freely positionable mark (signature, stamp, date, etc.)
 * placed inside the A4 preview body. Drag with pointer, remove with the
 * hover × button. Tap/click (movement < 6px) invokes onClick if provided —
 * lets the user re-open the asset picker to swap or resize the mark.
 * Position is stored in pixel coordinates relative to the containing body.
 */
import { useEffect, useRef, useState } from "react";
import { X, Pencil, Maximize2, Lock, Unlock } from "lucide-react";

export interface DraggableMarkProps {
  x: number;
  y: number;
  onChange: (x: number, y: number) => void;
  onRemove: () => void;
  onClick?: () => void;
  onResize?: () => void;
  zIndex?: number;
  children: React.ReactNode;
  ariaLabel?: string;
  hint?: string;
  locked?: boolean;
  onToggleLock?: () => void;
}

const CLICK_THRESHOLD_PX = 6;

export default function DraggableMark({
  x, y, onChange, onRemove, onClick, onResize, zIndex = 5, children, ariaLabel, hint,
  locked = false, onToggleLock,
}: DraggableMarkProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [drag, setDrag] = useState<null | { dx: number; dy: number; sx: number; sy: number; moved: boolean }>(null);

  useEffect(() => {
    if (!drag) return;
    const onMove = (e: PointerEvent) => {
      const parent = ref.current?.parentElement;
      if (!parent) return;
      const r = parent.getBoundingClientRect();
      const dxMoved = Math.abs(e.clientX - drag.sx);
      const dyMoved = Math.abs(e.clientY - drag.sy);
      if (!drag.moved && (dxMoved < CLICK_THRESHOLD_PX && dyMoved < CLICK_THRESHOLD_PX)) return;
      if (!drag.moved) setDrag({ ...drag, moved: true });
      const rawX = e.clientX - r.left - drag.dx;
      const rawY = e.clientY - r.top - drag.dy;
      const axisLocked = e.shiftKey;
      const nx = Math.max(0, Math.min(r.width - 20, axisLocked && dxMoved < dyMoved ? x : rawX));
      const ny = Math.max(0, Math.min(r.height - 20, axisLocked && dxMoved >= dyMoved ? y : rawY));
      onChange(nx, ny);
    };
    const onUp = (e: PointerEvent) => {
      const dxMoved = Math.abs(e.clientX - drag.sx);
      const dyMoved = Math.abs(e.clientY - drag.sy);
      const wasClick = !drag.moved && dxMoved < CLICK_THRESHOLD_PX && dyMoved < CLICK_THRESHOLD_PX;
      setDrag(null);
      if (wasClick && onClick) onClick();
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };
  }, [drag, onChange, onClick, x, y]);

  return (
    <div
      ref={ref}
      role="group"
      aria-label={ariaLabel}
      data-page-export-mark="true"
      className="group absolute select-none"
      style={{ left: x, top: y, zIndex, cursor: locked ? "default" : (drag?.moved ? "grabbing" : (onClick ? "pointer" : "grab")), touchAction: "none" }}
      onPointerDown={(e) => {
        if ((e.target as HTMLElement).closest?.("[data-mark-action]")) return;
        if (locked) return;
        const r = ref.current!.getBoundingClientRect();
        (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
        setDrag({ dx: e.clientX - r.left, dy: e.clientY - r.top, sx: e.clientX, sy: e.clientY, moved: false });
      }}
    >
      {children}
      {drag?.moved && (
        <>
          <div data-drag-guide="true" style={{ position: "absolute", left: 0, top: -9999, bottom: -9999, width: 1, background: "#B89555", opacity: 0.55, pointerEvents: "none", zIndex: 9999 }} />
          <div data-drag-guide="true" style={{ position: "absolute", top: 0, left: -9999, right: -9999, height: 1, background: "#B89555", opacity: 0.55, pointerEvents: "none", zIndex: 9999 }} />
        </>
      )}

      {/* Hover affordance — action circles only; no dark label rectangle. */}
      <div
        data-page-export-ignore="true"
        className="absolute -top-2 -right-2 hidden group-hover:flex items-center gap-1"
        style={{ zIndex: 9999 }}
      >
        {onClick && (
          <button
            type="button"
            data-mark-action="change"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onClick(); }}
            title="Change"
            aria-label="Change mark"
            className="h-5 w-5 rounded-full bg-white border border-[#B89555]/40 flex items-center justify-center shadow-sm hover:bg-[#F7F2EA]"
          >
            <Pencil className="w-3 h-3 text-[#1A1A1A]" />
          </button>
        )}
        {onToggleLock && (
          <button
            type="button"
            data-mark-action="lock"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onToggleLock(); }}
            title={locked ? "Unlock to drag" : "Lock position"}
            aria-label={locked ? "Unlock mark" : "Lock mark"}
            className="h-6 w-6 rounded-full flex items-center justify-center shadow-sm hover:brightness-95"
            style={{ background: "#F7F2EA", border: "1px solid rgba(184,149,85,.45)" }}
          >
            {locked
              ? <Lock className="w-3 h-3 text-[#B89555]" />
              : <Unlock className="w-3 h-3 text-[#B89555]" />}
          </button>
        )}
        {onResize && (
          <button
            type="button"
            data-mark-action="resize"
            onPointerDown={(e) => e.stopPropagation()}
            onClick={(e) => { e.stopPropagation(); onResize(); }}
            title="Resize"
            aria-label="Resize mark"
            className="h-5 w-5 rounded-full bg-white border border-[#B89555]/40 flex items-center justify-center shadow-sm hover:bg-[#F7F2EA]"
          >
            <Maximize2 className="w-3 h-3 text-[#1A1A1A]" />
          </button>
        )}
        <button
          type="button"
          data-mark-action="remove"
          onPointerDown={(e) => e.stopPropagation()}
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove"
          aria-label="Remove field"
          className="h-5 w-5 rounded-full bg-white border border-[#B89555]/40 flex items-center justify-center shadow-sm hover:bg-[#F7F2EA]"
        >
          <X className="w-3 h-3 text-red-600" />
        </button>
      </div>
    </div>
  );
}
