/**
 * StudioSettings - Premium settings dashboard for Creative Suite
 * Dark charcoal + champagne gold design
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, Settings, Bell, Palette, Shield, Download, HelpCircle,
  Wand2, FileText, Image, Mic, Film, Languages, Sparkles, ChevronRight,
  Monitor, Globe, Sliders, Star, Check
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Switch } from "@/components/ui/switch";

const GOLD = "#C9A84C";

const quickTools = [
  { icon: Wand2, label: "Background AI", href: "/toolkit/background-ai" },
  { icon: Sparkles, label: "Beauty Filters", href: "/toolkit/beauty-filters" },
  { icon: Image, label: "Image Resize", href: "/toolkit/image-resize" },
  { icon: FileText, label: "PDF Editor", href: "/toolkit/pdf-suite" },
  { icon: Film, label: "Video Studio", href: "/toolkit/ai-video-studio" },
  { icon: Mic, label: "Voice Studio", href: "/toolkit/voice-studio" },
  { icon: Languages, label: "Captions & Translate", href: "/toolkit/captions-translate" },
  { icon: FileText, label: "PDF from Photos", href: "/toolkit/pdf-from-photos" },
];

const settingsGroups = [
  {
    title: "Output Quality",
    icon: Sliders,
    settings: [
      { label: "High-resolution export (4K)", sub: "Larger files, best quality", defaultOn: true },
      { label: "Auto-compress on download", sub: "Reduce file sizes automatically", defaultOn: false },
      { label: "Preserve metadata", sub: "Keep EXIF/XMP data in exports", defaultOn: false },
    ],
  },
  {
    title: "Notifications",
    icon: Bell,
    settings: [
      { label: "Processing complete alerts", sub: "Get notified when AI jobs finish", defaultOn: true },
      { label: "Weekly usage digest", sub: "Summary of tools used", defaultOn: false },
      { label: "New tool announcements", sub: "Be first to know about new tools", defaultOn: true },
    ],
  },
  {
    title: "Appearance",
    icon: Monitor,
    settings: [
      { label: "Dark mode (forced)", sub: "Creative suite always in dark mode", defaultOn: true },
      { label: "Compact view", sub: "Reduce padding for more content", defaultOn: false },
      { label: "Show tool tips", sub: "Inline help for all controls", defaultOn: true },
    ],
  },
  {
    title: "Privacy & Data",
    icon: Shield,
    settings: [
      { label: "Auto-save projects", sub: "Projects saved to your account", defaultOn: true },
      { label: "Analytics & improvements", sub: "Help us improve tools", defaultOn: false },
      { label: "Share usage data", sub: "Anonymous usage statistics", defaultOn: false },
    ],
  },
];

function SettingRow({ label, sub, defaultOn }: { label: string; sub: string; defaultOn: boolean }) {
  const [on, setOn] = useState(defaultOn);
  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div>
        <p className="text-sm text-white/90 font-medium">{label}</p>
        <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>{sub}</p>
      </div>
      <Switch
        checked={on}
        onCheckedChange={setOn}
        className="data-[state=checked]:bg-[#C9A84C]"
      />
    </div>
  );
}

export default function StudioSettings() {
  return (
    <>
      <SEOHead
        title="Studio Settings | JBJ Creative Suite"
        description="Configure your Creative Suite preferences"
        noIndex
      />

      <div className="min-h-screen" style={{ background: "#0A0A0B", color: "#fff" }}>

        {/* Header */}
        <div style={{ borderBottom: "1px solid rgba(201,168,76,0.2)", background: "linear-gradient(135deg, #0A0A0B 0%, #111113 100%)" }}>
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex items-center gap-3 mb-6">
              <Link to="/studio">
                <button
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all"
                  style={{ color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}
                >
                  <ArrowLeft className="w-4 h-4" />
                  Back to Studio
                </button>
              </Link>
            </div>

            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center shrink-0"
                style={{
                  background: `${GOLD}18`,
                  border: `2px solid ${GOLD}40`,
                  boxShadow: `0 0 30px ${GOLD}20`,
                }}
              >
                <Settings className="w-7 h-7" style={{ color: GOLD }} />
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold text-white">
                  Studio <span style={{ color: GOLD }}>Settings</span>
                </h1>
                <p className="text-sm mt-0.5" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Configure your Creative Suite preferences
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

          {/* Quick Tools Access */}
          <div>
            <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: GOLD }}>
              <Star className="w-4 h-4" /> Quick Tool Access
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {quickTools.map(({ icon: Icon, label, href }) => (
                <Link key={href} to={href}>
                  <div
                    className="flex flex-col items-center gap-2 p-4 rounded-xl text-center transition-all cursor-pointer group"
                    style={{
                      background: "rgba(255,255,255,0.03)",
                      border: "1px solid rgba(255,255,255,0.07)",
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}44`;
                      (e.currentTarget as HTMLElement).style.background = `${GOLD}08`;
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                      (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.03)";
                    }}
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color: GOLD }} />
                    </div>
                    <span className="text-xs text-white/70 leading-tight">{label}</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Settings Groups */}
          {settingsGroups.map(({ title, icon: Icon, settings }) => (
            <div
              key={title}
              className="rounded-2xl p-6"
              style={{
                background: "linear-gradient(135deg, #111113, #16161A)",
                border: `1px solid ${GOLD}22`,
              }}
            >
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
                >
                  <Icon className="w-4 h-4" style={{ color: GOLD }} />
                </div>
                <h3 className="text-base font-semibold text-white">{title}</h3>
              </div>
              <div>
                {settings.map(s => (
                  <SettingRow key={s.label} {...s} />
                ))}
              </div>
            </div>
          ))}

          {/* Export Format Preference */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #111113, #16161A)",
              border: `1px solid ${GOLD}22`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
              >
                <Download className="w-4 h-4" style={{ color: GOLD }} />
              </div>
              <h3 className="text-base font-semibold text-white">Default Export Format</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {["PNG", "JPG", "WebP"].map((fmt, i) => (
                <button
                  key={fmt}
                  className="flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all"
                  style={i === 0 ? {
                    background: `${GOLD}20`,
                    border: `1px solid ${GOLD}55`,
                    color: GOLD,
                  } : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {i === 0 && <Check className="w-3.5 h-3.5" />}
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Interface Language */}
          <div
            className="rounded-2xl p-6"
            style={{
              background: "linear-gradient(135deg, #111113, #16161A)",
              border: `1px solid ${GOLD}22`,
            }}
          >
            <div className="flex items-center gap-3 mb-4">
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${GOLD}15`, border: `1px solid ${GOLD}30` }}
              >
                <Globe className="w-4 h-4" style={{ color: GOLD }} />
              </div>
              <h3 className="text-base font-semibold text-white">Interface Language</h3>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {["English", "Arabic", "French", "Russian", "Chinese", "Hindi"].map((lang, i) => (
                <button
                  key={lang}
                  className="flex items-center justify-between px-4 py-2.5 rounded-lg text-sm transition-all"
                  style={i === 0 ? {
                    background: `${GOLD}20`,
                    border: `1px solid ${GOLD}55`,
                    color: GOLD,
                  } : {
                    background: "rgba(255,255,255,0.04)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(255,255,255,0.5)",
                  }}
                >
                  {lang}
                  {i === 0 && <Check className="w-3.5 h-3.5" />}
                </button>
              ))}
            </div>
          </div>

          {/* Help */}
          <div
            className="rounded-2xl p-5 flex items-center gap-4"
            style={{ background: `${GOLD}0A`, border: `1px solid ${GOLD}30` }}
          >
            <div
              className="w-11 h-11 rounded-full flex items-center justify-center shrink-0"
              style={{ background: `${GOLD}20` }}
            >
              <HelpCircle className="w-5 h-5" style={{ color: GOLD }} />
            </div>
            <div className="flex-1">
              <p className="text-white font-medium text-sm">Need Help?</p>
              <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.4)" }}>
                Contact our support team for assistance with Creative Suite features.
              </p>
            </div>
            <Link to="/contact">
              <button
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium transition-all shrink-0"
                style={{ background: `${GOLD}20`, border: `1px solid ${GOLD}40`, color: GOLD }}
              >
                Contact <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </Link>
          </div>

        </div>
      </div>
    </>
  );
}
