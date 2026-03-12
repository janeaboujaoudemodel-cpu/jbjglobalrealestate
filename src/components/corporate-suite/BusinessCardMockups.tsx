import React from "react";
import { Copy, Globe, Smartphone, Type, Check } from "lucide-react";
import type { CardData, FinishEffect } from "./businessCardTypes";
import { getFinishOverlayStyle } from "./businessCardTypes";

export function DeskMockup({ children, finishEffect }: { children: React.ReactNode; finishEffect: FinishEffect }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, #f5efe6 0%, #e8dfd3 50%, #d4cbbe 100%)", padding: "40px 32px 48px", minHeight: 280 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.04, backgroundImage: "repeating-linear-gradient(0deg, transparent, transparent 18px, #8b7355 18px, #8b7355 19px)", pointerEvents: "none" }} />
      <div className="relative mx-auto" style={{ maxWidth: 320 }}>
        <div style={{ position: "absolute", bottom: -12, left: "8%", right: "8%", height: 20, background: "rgba(0,0,0,0.15)", filter: "blur(12px)", borderRadius: "50%" }} />
        <div className="relative" style={{ transform: "perspective(600px) rotateX(2deg)", transformOrigin: "center bottom" }}>
          {children}
          {finishEffect !== "none" && <div style={getFinishOverlayStyle(finishEffect)} />}
        </div>
      </div>
      <div style={{ position: "absolute", top: 20, right: 24 }}>
        <div style={{ width: 8, height: 80, background: "linear-gradient(to bottom, #2a2a2a, #444)", borderRadius: 4, transform: "rotate(-15deg)" }} />
      </div>
      <div style={{ position: "absolute", bottom: 16, left: 24 }}>
        <div style={{ width: 48, height: 5, background: "#C8A766", borderRadius: 3, opacity: 0.6 }} />
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-semibold text-[#a09080] tracking-[0.2em] uppercase">Desk Preview</p>
    </div>
  );
}

export function PocketMockup({ children, finishEffect }: { children: React.ReactNode; finishEffect: FinishEffect }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(180deg, #2c3e50 0%, #1a252f 100%)", padding: "48px 32px 40px", minHeight: 280 }}>
      <div style={{ position: "absolute", inset: 0, opacity: 0.06, backgroundImage: "repeating-linear-gradient(45deg, transparent, transparent 2px, #fff 2px, #fff 3px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", bottom: 0, left: "15%", right: "15%", height: "55%", borderTop: "2px solid rgba(255,255,255,0.08)", borderRadius: "12px 12px 0 0", background: "linear-gradient(180deg, rgba(255,255,255,0.03) 0%, transparent 100%)" }} />
      <div className="relative mx-auto" style={{ maxWidth: 260 }}>
        <div style={{ transform: "rotate(-3deg) translateY(20px)", transformOrigin: "center top" }}>
          <div className="relative" style={{ clipPath: "inset(0 0 25% 0)" }}>
            {children}
            {finishEffect !== "none" && <div style={getFinishOverlayStyle(finishEffect)} />}
          </div>
        </div>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-semibold text-white/30 tracking-[0.2em] uppercase">Pocket Preview</p>
    </div>
  );
}

export function StationeryMockup({ children, data, primary, finishEffect }: { children: React.ReactNode; data: CardData; primary: string; finishEffect: FinishEffect }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, #faf8f5 0%, #f0ece5 100%)", padding: "32px 24px 40px", minHeight: 340 }}>
      <div className="mx-auto mb-3" style={{ maxWidth: 240, background: "#fff", border: "1px solid #e5e0d8", borderRadius: 8, padding: "16px 14px", boxShadow: "0 4px 16px rgba(0,0,0,0.06)", transform: "rotate(-1deg)" }}>
        <div style={{ borderTop: `3px solid ${primary}`, width: 40, marginBottom: 8 }} />
        <p style={{ fontSize: 9, fontWeight: 700, color: primary, letterSpacing: 1.5, textTransform: "uppercase" }}>{data.company || "COMPANY"}</p>
        <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 4 }}>
          {[1, 2, 3].map(i => (
            <div key={i} style={{ height: 3, background: "#eee", borderRadius: 2, width: `${85 - i * 15}%` }} />
          ))}
        </div>
      </div>
      <div className="relative mx-auto" style={{ maxWidth: 280, transform: "rotate(2deg)" }}>
        <div style={{ position: "absolute", bottom: -8, left: "10%", right: "10%", height: 16, background: "rgba(0,0,0,0.1)", filter: "blur(8px)", borderRadius: "50%" }} />
        <div className="relative">
          {children}
          {finishEffect !== "none" && <div style={getFinishOverlayStyle(finishEffect)} />}
        </div>
      </div>
      <div className="mx-auto mt-4" style={{ maxWidth: 200 }}>
        <div style={{ background: "#fff", border: "1px solid #e5e0d8", borderRadius: "6px 6px 0 0", height: 28, display: "flex", alignItems: "center", paddingLeft: 12, boxShadow: "0 -2px 8px rgba(0,0,0,0.04)" }}>
          <div style={{ width: 20, height: 2, background: primary, borderRadius: 1, opacity: 0.5 }} />
        </div>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-semibold text-[#a09080] tracking-[0.2em] uppercase">Stationery Kit</p>
    </div>
  );
}

export function HandMockup({ children, finishEffect }: { children: React.ReactNode; finishEffect: FinishEffect }) {
  return (
    <div className="relative w-full rounded-2xl overflow-hidden" style={{ background: "linear-gradient(160deg, #f0f0f0 0%, #e0e0e0 100%)", padding: "40px 32px 48px", minHeight: 280 }}>
      <div style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 180, height: 100, background: "linear-gradient(to top, #d4b896 0%, #d4b896cc 60%, transparent 100%)", borderRadius: "40% 40% 0 0", opacity: 0.3 }} />
      <div className="relative mx-auto" style={{ maxWidth: 300 }}>
        <div style={{ position: "absolute", bottom: -10, left: "10%", right: "10%", height: 18, background: "rgba(0,0,0,0.12)", filter: "blur(10px)", borderRadius: "50%" }} />
        <div className="relative" style={{ transform: "perspective(500px) rotateY(-5deg) rotateX(3deg)", transformOrigin: "center bottom" }}>
          {children}
          {finishEffect !== "none" && <div style={getFinishOverlayStyle(finishEffect)} />}
        </div>
      </div>
      <p className="absolute bottom-3 left-0 right-0 text-center text-[9px] font-semibold text-[#888] tracking-[0.2em] uppercase">Hand Preview</p>
    </div>
  );
}

export function PhoneMockup({ children }: { children: React.ReactNode }) {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return (
    <div className="relative mx-auto" style={{ width: 240 }}>
      <div style={{ position: "absolute", left: -10, top: 72, width: 4, height: 28, background: "#2a2a2a", borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", left: -10, top: 110, width: 4, height: 28, background: "#2a2a2a", borderRadius: "2px 0 0 2px" }} />
      <div style={{ position: "absolute", right: -10, top: 96, width: 4, height: 40, background: "#2a2a2a", borderRadius: "0 2px 2px 0" }} />
      <div style={{
        border: "10px solid #1a1a1a",
        borderRadius: 36,
        boxShadow: "0 0 0 2px #333, 0 30px 80px rgba(0,0,0,0.5)",
        background: "#1a1a1a",
        overflow: "hidden",
        position: "relative",
      }}>
        <div style={{
          background: "#000",
          padding: "8px 16px 6px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}>
          <span style={{ color: "#fff", fontSize: 10, fontWeight: 600, fontFamily: "system-ui, sans-serif" }}>{timeStr}</span>
          <div style={{ width: 72, height: 20, background: "#000", border: "1.5px solid #2a2a2a", borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ width: 8, height: 8, borderRadius: "50%", background: "#1a1a1a", border: "1px solid #333" }} />
          </div>
          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <div style={{ display: "flex", gap: 1.5, alignItems: "flex-end" }}>
              {[4, 6, 8, 10].map((h, i) => (
                <div key={i} style={{ width: 3, height: h, background: i < 3 ? "#fff" : "#555", borderRadius: 1 }} />
              ))}
            </div>
            <div style={{ width: 20, height: 10, border: "1.5px solid #fff", borderRadius: 2, position: "relative", marginLeft: 2 }}>
              <div style={{ position: "absolute", right: -3, top: "50%", transform: "translateY(-50%)", width: 2, height: 5, background: "#fff", borderRadius: "0 1px 1px 0" }} />
              <div style={{ width: "70%", height: "100%", background: "#4ade80", borderRadius: 1 }} />
            </div>
          </div>
        </div>
        <div style={{ background: "#000" }}>
          {children}
        </div>
        <div style={{ background: "#000", padding: "8px 0 10px", display: "flex", justifyContent: "center" }}>
          <div style={{ width: 80, height: 4, background: "#fff", borderRadius: 4, opacity: 0.5 }} />
        </div>
      </div>
    </div>
  );
}
