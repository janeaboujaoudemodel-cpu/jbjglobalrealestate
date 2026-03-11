import { useState } from "react";
import { X, Bell, AlertTriangle, ArrowRight, CheckCircle, Headphones, Volume2, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import jbjMonogramLightOnDark from "@/assets/jbj-monogram-light-on-dark.png";

/**
 * AlertsDemo — Owner-only demo page to preview all alert/notification UIs.
 * Each section shows a live preview of the popup exactly as users will see it.
 */

function DemoSection({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <div className="bg-white/80 border border-[hsl(var(--gold))]/20 rounded-2xl p-6 mb-6">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="text-lg font-bold text-black">{title}</h3>
          <p className="text-sm text-zinc-500">{description}</p>
        </div>
        <Button onClick={() => setShow(!show)} variant="outline" className="border-[hsl(var(--gold))]/40 gap-2">
          <Eye className="w-4 h-4" />
          {show ? "Hide Preview" : "Show Preview"}
        </Button>
      </div>
      {show && (
        <div className="mt-4 relative">
          {children}
        </div>
      )}
    </div>
  );
}

export default function AlertsDemo() {
  return (
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold text-black mb-1">🔔 Alerts & Notifications Preview</h1>
      <p className="text-zinc-500 mb-8">Click "Show Preview" on each card to see the exact UI users will experience.</p>

      {/* 1 — Brand Intro Splash */}
      <DemoSection title="1. Brand Intro Splash" description="Shown once per session on first visit. Logo animation + auto-play music.">
        <div className="rounded-xl overflow-hidden border border-zinc-200 relative" style={{ height: 420 }}>
          <div className="absolute inset-0 bg-black flex flex-col items-center justify-center">
            <div className="animate-in zoom-in-50 fade-in duration-700">
              <img
                src={jbjMonogramLightOnDark}
                alt="JBJ Global Real Estate"
                className="w-28 h-28 object-contain"
                style={{ filter: "drop-shadow(0 0 40px rgba(200,167,102,0.5))", animation: "splashPulse 2s ease-in-out infinite" }}
              />
            </div>
            <div className="mt-6 text-center animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ fontFamily: "Poppins, sans-serif" }}>
              <p className="text-lg font-bold text-white tracking-[0.2em] uppercase">JBJ Global</p>
              <p className="text-sm font-semibold text-[#D4B896] tracking-[0.25em] uppercase mt-1">Real Estate</p>
            </div>
            <button className="mt-8 flex items-center gap-2 px-5 py-2.5 rounded-full border border-[hsl(var(--gold))]/40 bg-[hsl(var(--gold))]/10 text-[hsl(var(--gold))] text-sm font-medium">
              <Volume2 className="w-4 h-4" /> Enable Sound
            </button>
            <button className="absolute top-4 right-4 flex items-center gap-1.5 text-white/40 text-xs font-medium tracking-wider uppercase">
              Skip <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <style>{`@keyframes splashPulse { 0%,100%{filter:drop-shadow(0 0 24px rgba(200,167,102,0.3));transform:scale(1)} 50%{filter:drop-shadow(0 0 48px rgba(200,167,102,0.6));transform:scale(1.03)} }`}</style>
        </div>
      </DemoSection>

      {/* 2 — Owner Tasks Popup */}
      <DemoSection title="2. Owner Tasks Popup" description="Shown to owner on login when pending tasks exist. Once per day.">
        <div className="rounded-xl overflow-hidden border border-zinc-200 relative flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ height: 360 }}>
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[hsl(var(--gold))]/50 rounded-2xl shadow-2xl p-6 max-w-md w-[90%] relative">
            <button className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))]/20 to-[hsl(var(--gold))]/10 border-2 border-[hsl(var(--gold))]/40 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-[hsl(var(--gold))]" />
              </div>
              <div>
                <h3 className="text-black font-bold text-lg">Pending Tasks</h3>
                <p className="text-zinc-500 text-sm">Daily action items require attention</p>
              </div>
            </div>
            <div className="bg-white/60 border border-[hsl(var(--gold))]/20 rounded-xl p-4 mb-5">
              <p className="text-black text-sm">You have <span className="font-bold text-[hsl(var(--gold))] text-lg">7</span> pending items that need your review today.</p>
            </div>
            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-[hsl(var(--gold))] to-[#B8973F] text-black font-bold rounded-xl">View Tasks <ArrowRight className="w-4 h-4 ml-2" /></Button>
              <Button variant="outline" className="border-[hsl(var(--gold))]/30 text-zinc-600 rounded-xl">Later</Button>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* 3 — User Tasks + Ticket Updates Popup */}
      <DemoSection title="3. User Notifications Popup" description="Shown to regular users when they have ticket replies or pending tasks. Once per 24h.">
        <div className="rounded-xl overflow-hidden border border-zinc-200 relative flex items-center justify-center bg-black/40 backdrop-blur-sm" style={{ height: 460 }}>
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-[hsl(var(--gold))]/50 rounded-2xl shadow-2xl p-6 max-w-md w-[90%] relative">
            <button className="absolute top-3 right-3 text-zinc-400 hover:text-zinc-600"><X className="w-5 h-5" /></button>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[hsl(var(--gold))]/20 to-[hsl(var(--gold))]/10 border-2 border-[hsl(var(--gold))]/40 flex items-center justify-center">
                <Bell className="w-6 h-6 text-[hsl(var(--gold))]" />
              </div>
              <div>
                <h3 className="text-black font-bold text-lg">Updates & Tasks</h3>
                <p className="text-zinc-500 text-sm">4 notifications for you</p>
              </div>
            </div>

            {/* Ticket alerts */}
            <div className="space-y-2 mb-4">
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-black font-semibold text-sm">Ticket #1042 Resolved</p>
                  <p className="text-zinc-600 text-xs">Your maintenance request has been completed.</p>
                </div>
              </div>
              <div className="bg-green-50 border border-green-200 rounded-xl p-3 flex items-start gap-2.5">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-black font-semibold text-sm">New reply on Ticket #1038</p>
                  <p className="text-zinc-600 text-xs">Our team has responded to your inquiry.</p>
                </div>
              </div>
            </div>

            {/* Pending tasks */}
            <div className="bg-white/60 border border-[hsl(var(--gold))]/20 rounded-xl p-4 mb-5">
              <p className="text-black text-sm">You have <span className="font-bold text-[hsl(var(--gold))] text-lg">2</span> pending tasks that require your attention.</p>
            </div>

            <div className="flex gap-3">
              <Button className="flex-1 bg-gradient-to-r from-green-600 to-green-700 text-white font-bold rounded-xl">
                <Headphones className="w-4 h-4 mr-2" /> My Tickets
              </Button>
              <Button className="flex-1 bg-gradient-to-r from-[hsl(var(--gold))] to-[#B8973F] text-black font-bold rounded-xl">
                View Tasks <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
              <Button variant="outline" className="border-[hsl(var(--gold))]/30 text-zinc-600 rounded-xl">Later</Button>
            </div>
          </div>
        </div>
      </DemoSection>

      {/* 4 — Global Back Button */}
      <DemoSection title="4. Global Back Button" description="Always visible in the header bar on every page. Navigates back or to home.">
        <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white p-6 flex items-center gap-4">
          <p className="text-sm text-zinc-500">As it appears in the header →</p>
          <button className="h-7 flex items-center gap-1.5 rounded-md border border-[hsl(var(--gold))]/30 hover:border-[hsl(var(--gold))]/60 bg-[hsl(var(--gold))]/5 hover:bg-[hsl(var(--gold))]/15 transition-all px-2 group">
            <ArrowRight className="w-3.5 h-3.5 text-[hsl(var(--gold))] rotate-180" />
            <span className="text-[10px] font-semibold text-black/50 uppercase tracking-wider">Back</span>
          </button>
        </div>
      </DemoSection>

      {/* 5 — Header Notification Bell Badge */}
      <DemoSection title="5. Header Notification Badge" description="Red badge on the bell icon showing total unread count across all notification types.">
        <div className="rounded-xl overflow-hidden border border-zinc-200 bg-white p-6 flex items-center gap-6">
          <p className="text-sm text-zinc-500">Bell icon with badge →</p>
          <div className="relative">
            <div className="w-9 h-9 rounded-full border border-[hsl(var(--gold))]/30 bg-[hsl(var(--gold))]/5 flex items-center justify-center">
              <Bell className="w-4 h-4 text-[hsl(var(--gold))]" />
            </div>
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shadow">4</span>
          </div>
          <p className="text-xs text-zinc-400">Combines: ticket replies + listing updates + system notifications + pending tasks</p>
        </div>
      </DemoSection>
    </div>
  );
}
