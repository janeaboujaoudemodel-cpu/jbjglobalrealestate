/**
 * StudioSettings - Premium settings dashboard for Creative Suite
 * Dark charcoal + champagne gold — fully responsive
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Settings, Bell, Monitor, Shield, Download, HelpCircle,
  Wand2, FileText, ImageIcon, Mic, Film, Languages, Sparkles, ChevronRight,
  Globe, Sliders, Star, Check, Palette,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";

const G = "#C9A84C"; // gold hex (used only for inline styles)

const quickTools = [
  { icon: Wand2, label: "Background AI", href: "/toolkit/background-ai", color: "#5B8AF5" },
  { icon: Sparkles, label: "Beauty Filters", href: "/toolkit/beauty-filters", color: "#E85C4A" },
  { icon: ImageIcon, label: "Image Resize", href: "/toolkit/image-resize", color: "#7B5BF5" },
  { icon: FileText, label: "PDF Suite", href: "/toolkit/pdf-suite", color: "#E8A84A" },
  { icon: Film, label: "Video Studio", href: "/toolkit/ai-video-studio", color: "#4AE8A8" },
  { icon: Mic, label: "Voice Studio", href: "/toolkit/voice-studio", color: "#E84A9A" },
  { icon: Languages, label: "Captions", href: "/toolkit/captions-translate", color: "#A84AE8" },
  { icon: Palette, label: "Interior AI", href: "/interior-design", color: "#4A9AE8" },
];

const settingsGroups = [
  {
    title: "Output Quality",
    icon: Sliders,
    items: [
      { label: "High-resolution export (4K)", sub: "Larger files, best quality", on: true },
      { label: "Auto-compress on download", sub: "Reduce file sizes automatically", on: false },
      { label: "Preserve metadata", sub: "Keep EXIF/XMP data in exports", on: false },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    items: [
      { label: "Processing complete alerts", sub: "Get notified when AI jobs finish", on: true },
      { label: "Weekly usage digest", sub: "Summary of tools used", on: false },
      { label: "New tool announcements", sub: "Be first to know about new tools", on: true },
    ],
  },
  {
    title: "Appearance",
    icon: Monitor,
    items: [
      { label: "Dark mode (forced)", sub: "Creative suite always in dark mode", on: true },
      { label: "Compact view", sub: "Reduce padding for more content", on: false },
      { label: "Show tool tips", sub: "Inline help for all controls", on: true },
    ],
  },
  {
    title: "Privacy & Data",
    icon: Shield,
    items: [
      { label: "Auto-save projects", sub: "Projects saved to your account", on: true },
      { label: "Analytics & improvements", sub: "Help us improve tools", on: false },
      { label: "Share usage data", sub: "Anonymous usage statistics", on: false },
    ],
  },
];

function SettingRow({ label, sub, defaultOn }: { label: string; sub: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3.5" style={{ borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
      <div className="flex-1 pr-4">
        <p className="text-sm text-white/90 font-medium leading-snug">{label}</p>
        <p className="text-xs mt-0.5 leading-snug" style={{ color: "rgba(255,255,255,0.35)" }}>{sub}</p>
      </div>
      <Switch checked={on} onCheckedChange={setOn} className="data-[state=checked]:bg-gold shrink-0" />
    </div>
  );
}

export default function StudioSettings() {
  const [exportFmt, setExportFmt] = useState("PNG");
  const [lang, setLang] = useState("English");

  return (
    <div className="min-h-screen text-white" style={{ background: "linear-gradient(160deg, #0A0A0B 0%, #0d0d10 60%, #0A0A0B 100%)" }}>

      {/* ── Header ── */}
      <header style={{ borderBottom: "1px solid rgba(201,168,76,0.18)", background: "linear-gradient(180deg, rgba(201,168,76,0.04) 0%, transparent 100%)" }}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-5">
          {/* Back */}
          <Link to="/studio" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs mb-5 transition-all"
            style={{ color: "rgba(255,255,255,0.45)", border: "1px solid rgba(255,255,255,0.08)" }}
            onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = "#fff"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.2)"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.45)"; (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.08)"; }}>
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Studio
          </Link>

          <div className="flex items-center gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center shrink-0"
              style={{ background: `${G}12`, border: `2px solid ${G}35`, boxShadow: `0 0 28px ${G}18` }}>
              <Settings className="w-5 h-5 sm:w-6 sm:h-6" style={{ color: G }} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
                Studio <span className="text-gold">Settings</span>
              </h1>
              <p className="text-xs sm:text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Configure your Creative Suite preferences
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

        {/* ── Quick Tool Access ── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-3.5 h-3.5" style={{ color: G }} />
            <h2 className="text-xs font-semibold uppercase tracking-widest" style={{ color: `${G}CC` }}>Quick Tool Access</h2>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-4 gap-2.5">
            {quickTools.map(({ icon: Icon, label, href, color }) => (
              <Link key={href} to={href}>
                <div className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all cursor-pointer group"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${color}44`; (e.currentTarget as HTMLElement).style.background = `${color}09`; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.06)"; (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)"; }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110"
                    style={{ background: `${color}15`, border: `1px solid ${color}30` }}>
                    <Icon className="w-4 h-4" style={{ color }} />
                  </div>
                  <span className="text-[11px] font-medium leading-tight" style={{ color: "rgba(255,255,255,0.6)" }}>{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Settings Groups ── */}
        {settingsGroups.map(({ title, icon: Icon, items }) => (
          <section key={title} className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #111113 0%, #141418 100%)", border: `1px solid ${G}1E` }}>
            {/* Group header */}
            <div className="flex items-center gap-3 px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${G}15`, border: `1px solid ${G}2E` }}>
                <Icon className="w-4 h-4" style={{ color: G }} />
              </div>
              <h3 className="text-sm font-semibold text-white">{title}</h3>
            </div>
            {/* Rows */}
            <div className="px-5 sm:px-6">
              {items.map((s) => (
                <SettingRow key={s.label} label={s.label} sub={s.sub} defaultOn={s.on} />
              ))}
              {/* Remove last border */}
              <div style={{ marginBottom: "0.5rem" }} />
            </div>
          </section>
        ))}

        {/* ── Export Format ── */}
        <section className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #111113 0%, #141418 100%)", border: `1px solid ${G}1E` }}>
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${G}15`, border: `1px solid ${G}2E` }}>
              <Download className="w-4 h-4" style={{ color: G }} />
            </div>
            <h3 className="text-sm font-semibold text-white">Default Export Format</h3>
          </div>
          <div className="px-5 sm:px-6 py-4 grid grid-cols-3 sm:grid-cols-6 gap-2">
            {["PNG", "JPG", "WebP", "PDF", "SVG", "TIFF"].map((fmt) => {
              const active = exportFmt === fmt;
              return (
                <button key={fmt} onClick={() => setExportFmt(fmt)}
                  className="flex items-center justify-center gap-1.5 py-2.5 rounded-lg text-xs font-semibold transition-all"
                  style={{
                    background: active ? `${G}20` : "rgba(255,255,255,0.04)",
                    border: `1px solid ${active ? G + "55" : "rgba(255,255,255,0.08)"}`,
                    color: active ? G : "rgba(255,255,255,0.45)",
                  }}>
                  {active && <Check className="w-3 h-3" />}
                  {fmt}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Language ── */}
        <section className="rounded-2xl overflow-hidden" style={{ background: "linear-gradient(135deg, #111113 0%, #141418 100%)", border: `1px solid ${G}1E` }}>
          <div className="flex items-center gap-3 px-5 sm:px-6 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${G}15`, border: `1px solid ${G}2E` }}>
              <Globe className="w-4 h-4" style={{ color: G }} />
            </div>
            <h3 className="text-sm font-semibold text-white">Interface Language</h3>
          </div>
          <div className="px-5 sm:px-6 py-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
            {["English", "Arabic", "French", "Russian", "Chinese", "Hindi"].map((l) => {
              const active = lang === l;
              return (
                <button key={l} onClick={() => setLang(l)}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg text-xs font-medium transition-all"
                  style={{
                    background: active ? `${G}20` : "rgba(255,255,255,0.03)",
                    border: `1px solid ${active ? G + "55" : "rgba(255,255,255,0.07)"}`,
                    color: active ? G : "rgba(255,255,255,0.5)",
                  }}>
                  {l}
                  {active && <Check className="w-3 h-3" />}
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Help Banner ── */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 p-5 rounded-2xl"
          style={{ background: `${G}0A`, border: `1px solid ${G}28` }}>
          <div className="w-11 h-11 rounded-full flex items-center justify-center shrink-0" style={{ background: `${G}1A` }}>
            <HelpCircle className="w-5 h-5" style={{ color: G }} />
          </div>
          <div className="flex-1">
            <p className="text-white font-semibold text-sm">Need Help?</p>
            <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.38)" }}>
              Contact our support team for assistance with Creative Suite features.
            </p>
          </div>
          <Link to="/contact">
            <button className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition-all whitespace-nowrap"
              style={{ background: `${G}1A`, border: `1px solid ${G}40`, color: G }}
              onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = `${G}28`}
              onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = `${G}1A`}>
              Contact Us <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </Link>
        </div>

        {/* Version footer */}
        <p className="text-center text-[10px] pb-2" style={{ color: "rgba(255,255,255,0.2)" }}>
          JBJ Creative Suite™ v2.0 · All settings saved locally
        </p>
      </div>
    </div>
  );
}
