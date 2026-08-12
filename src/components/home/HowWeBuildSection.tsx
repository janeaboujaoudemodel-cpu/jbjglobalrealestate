import { useEffect, useRef, useState } from "react";

/**
 * HowWeBuild — animated 3D wireframe "blueprint tower" that assembles itself
 * floor by floor, each floor mapped to one layer of the JBJ operating model.
 * Pure canvas isometric projection (no 3D libs), emerald/gold brand palette.
 */

type Layer = { label: string; caption: string };

const LAYERS: Layer[] = [
  { label: "Verified Supply", caption: "Every developer, project and unit checked at the source." },
  { label: "Live Market Data", caption: "Prices, payment plans and availability refreshed continuously." },
  { label: "AI Matching Engine", caption: "Buyer intent matched to inventory in seconds, not weeks." },
  { label: "Advisory Layer", caption: "Human advisors validate every shortlist before it reaches you." },
  { label: "Deal & Handover", caption: "Reservation, paperwork and handover tracked end to end." },
];

const EMERALD = "#064E3B";
const GOLD = "#FFFFFF";

export default function HowWeBuildSection() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [active, setActive] = useState(0);
  const activeRef = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  // Advance the highlighted layer on a calm cadence.
  useEffect(() => {
    const id = window.setInterval(() => {
      setActive((a) => (a + 1) % LAYERS.length);
    }, 3200);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let raf = 0;
    let t = 0;
    let running = true;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      canvas.width = Math.max(1, Math.floor(rect.width * dpr));
      canvas.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const io = new IntersectionObserver(
      ([e]) => {
        running = e.isIntersecting;
      },
      { threshold: 0.05 }
    );
    io.observe(canvas);

    const project = (
      x: number,
      y: number,
      z: number,
      cx: number,
      cy: number,
      scale: number,
      rot: number
    ) => {
      const cos = Math.cos(rot);
      const sin = Math.sin(rot);
      const rx = x * cos - z * sin;
      const rz = x * sin + z * cos;
      // isometric-ish projection
      return {
        x: cx + (rx - rz) * 0.866 * scale,
        y: cy + ((rx + rz) * 0.5 - y) * scale,
      };
    };

    const draw = () => {
      raf = requestAnimationFrame(draw);
      if (!running) return;
      if (!reduced) t += 0.006;

      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = rect.height;
      ctx.clearRect(0, 0, w, h);

      const scale = Math.min(w, h) / 11.5;
      const cx = w / 2;
      const cy = h * 0.72;
      const rot = t;

      // ground grid
      ctx.lineWidth = 1;
      const G = 7;
      for (let i = -G; i <= G; i++) {
        const a = project(i, 0, -G, cx, cy, scale, rot);
        const b = project(i, 0, G, cx, cy, scale, rot);
        const c = project(-G, 0, i, cx, cy, scale, rot);
        const d = project(G, 0, i, cx, cy, scale, rot);
        ctx.strokeStyle = "rgba(255,255,255,0.06)";
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.moveTo(c.x, c.y);
        ctx.lineTo(d.x, d.y);
        ctx.stroke();
      }

      const floorH = 0.95;
      const activeIdx = activeRef.current;

      LAYERS.forEach((layer, i) => {
        const half = 2.4 - i * 0.28;
        const yb = i * floorH;
        const yt = yb + floorH * 0.82;
        const isActive = i === activeIdx;
        const pulse = isActive ? 0.55 + 0.45 * Math.sin(t * 6) : 0;

        const corners = [
          [-half, -half],
          [half, -half],
          [half, half],
          [-half, half],
        ] as const;

        const bottom = corners.map(([x, z]) => project(x, yb, z, cx, cy, scale, rot));
        const top = corners.map(([x, z]) => project(x, yt, z, cx, cy, scale, rot));

        ctx.lineWidth = isActive ? 1.8 : 1;
        ctx.strokeStyle = isActive
          ? `rgba(255,255,255,${0.55 + pulse * 0.45})`
          : "rgba(255,255,255,0.28)";

        if (isActive) {
          ctx.shadowColor = GOLD;
          ctx.shadowBlur = 10;
          ctx.fillStyle = `rgba(255,255,255,${0.05 + pulse * 0.07})`;
        } else {
          ctx.shadowBlur = 0;
          ctx.fillStyle = "rgba(255,255,255,0.02)";
        }

        // slab
        ctx.beginPath();
        bottom.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // ceiling ring
        ctx.beginPath();
        top.forEach((p, k) => (k ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y)));
        ctx.closePath();
        ctx.stroke();

        // columns
        ctx.beginPath();
        bottom.forEach((p, k) => {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(top[k].x, top[k].y);
        });
        ctx.stroke();
        ctx.shadowBlur = 0;
      });

      // data pulses rising through the core
      const beams = 3;
      for (let b = 0; b < beams; b++) {
        const prog = ((t * 0.5 + b / beams) % 1) * (LAYERS.length * floorH);
        const p = project(0, prog, 0, cx, cy, scale, rot);
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, 26);
        grad.addColorStop(0, "rgba(255,255,255,0.92)");
        grad.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // core mast
      const base = project(0, 0, 0, cx, cy, scale, rot);
      const tip = project(0, LAYERS.length * floorH + 1.1, 0, cx, cy, scale, rot);
      ctx.strokeStyle = "rgba(255,255,255,0.32)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(base.x, base.y);
      ctx.lineTo(tip.x, tip.y);
      ctx.stroke();
    };

    raf = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(raf);
      io.disconnect();
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <section
      aria-labelledby="how-we-build-heading"
      data-surface="emerald"
      className="relative overflow-hidden rounded-[28px] border border-white/20"
      style={{
        background: `linear-gradient(160deg, ${EMERALD} 0%, #042c1c 55%, #000000 100%)`,
      }}
    >
      <div className="relative grid gap-8 p-6 md:grid-cols-2 md:gap-10 md:p-12">
        {/* Copy + layer rail */}
        <div className="flex flex-col justify-center">
          <span
            className="mb-4 inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-[11px] uppercase tracking-[0.22em] text-white/85"
            style={{ borderColor: `${GOLD}55` }}
          >
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />
            How we build
          </span>
          <h2
            id="how-we-build-heading"
            className="font-serif text-3xl leading-tight text-white md:text-[2.6rem]"
          >
            A real estate platform engineered like a building
          </h2>
          <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/70 md:text-base">
            Every JBJ experience is assembled layer by layer — verified supply at the
            foundation, live market data above it, and intelligence carrying it to the top.
            Watch the model build itself.
          </p>

          <ul className="mt-7 space-y-1.5">
            {LAYERS.map((layer, i) => {
              const isActive = i === active;
              return (
                <li key={layer.label}>
                  <button
                    type="button"
                    onClick={() => setActive(i)}
                    aria-current={isActive}
                    className="group flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition-colors"
                    style={{
                      background: isActive ? "rgba(255,255,255,0.10)" : "transparent",
                      border: `1px solid ${isActive ? `${GOLD}55` : "transparent"}`,
                    }}
                  >
                    <span
                      className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-md text-[11px] font-semibold"
                      style={{
                        color: isActive ? "#0b0b0b" : "#ffffff",
                        background: isActive ? GOLD : "rgba(255,255,255,0.10)",
                      }}
                    >
                      {String(LAYERS.length - i).padStart(2, "0")}
                    </span>
                    <span className="min-w-0 text-left">
                      <span className="block text-left text-sm font-semibold text-white">
                        {layer.label}
                      </span>
                      <span
                        className="block text-left text-xs leading-relaxed"
                        style={{ color: isActive ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.5)" }}
                      >
                        {layer.caption}
                      </span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* 3D wireframe canvas */}
        <div className="relative min-h-[340px] md:min-h-[520px]">
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0 opacity-[0.35]"
            style={{
              background:
                "radial-gradient(circle at 60% 35%, rgba(255,255,255,0.14), transparent 60%)",
            }}
          />
          <canvas
            ref={canvasRef}
            className="h-full w-full"
            role="img"
            aria-label="Animated 3D wireframe tower representing the JBJ platform layers"
          />
          <span className="absolute bottom-2 right-3 text-[10px] uppercase tracking-[0.25em] text-white/40">
            JBJ operating model · live render
          </span>
        </div>
      </div>
    </section>
  );
}
