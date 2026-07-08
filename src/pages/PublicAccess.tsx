import { useState, useMemo } from "react";
import { usePublicGateSections, type GateSection } from "@/hooks/usePublicGateSections";
import { JJLogoImage } from "@/components/JJLogoImage";
import { Button } from "@/components/ui/button";
import LeadFormDialog from "@/components/gate/LeadFormDialog";
import SignupDialog from "@/components/gate/SignupDialog";
import LoginDialog from "@/components/gate/LoginDialog";
import { ArrowRight, CheckCircle2, Play, Sparkles, Shield, TrendingUp, Home, KeyRound, Building2, Award, Wrench } from "lucide-react";

const ICON_MAP: Record<string, any> = {
  "Buy Property": Home, "Sell Property": TrendingUp, "Rent Property": KeyRound,
  "Off-Plan Projects": Building2, "Investment Advisory": Sparkles, "Golden Visa": Award,
  "Property Management": Wrench, "Mortgage Support": Shield,
};

export default function PublicAccess() {
  const { data: sections = [], isLoading } = usePublicGateSections();
  const [leadOpen, setLeadOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  const handleCta = (action?: string) => {
    if (action === "lead") setLeadOpen(true);
    else if (action === "signup") setSignupOpen(true);
    else if (action === "login") setLoginOpen(true);
  };

  const ordered = useMemo(() => [...sections].sort((a, b) => a.position - b.position), [sections]);

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#1A1A1A]">
      {/* Top bar — 72px, hairline, monogram + wordmark aligned to same baseline */}
      <header className="sticky top-0 z-40 border-b border-[#B89555]/25 bg-[#FDFBF7]/92 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 h-[72px] flex items-center justify-between gap-6">
          <a href="/access" className="flex items-center gap-3 group">
            <div className="relative">
              <JJLogoImage className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" />
            </div>
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-serif text-[19px] text-[#0d3a2b] tracking-tight">JBJ Global</span>
              <span className="text-[10px] tracking-[0.32em] uppercase text-[#B89555] mt-0.5">Real Estate</span>
            </div>
          </a>
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setLoginOpen(true)}
              className="h-10 px-4 transition-all active:scale-[0.97]"
            >
              Log in
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setSignupOpen(true)}
              className="h-10 px-4 transition-all active:scale-[0.97] shadow-[0_8px_20px_-10px_rgba(6,78,59,0.55)]"
            >
              Sign up <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </header>

      {isLoading && (
        <div className="mx-auto max-w-7xl px-4 py-24 text-center text-[#1A1A1A]/50 font-serif animate-fade-in">Loading…</div>
      )}

      <main className="animate-fade-in">
        {ordered.map((s) => (
          <SectionRenderer key={s.id} section={s} onCta={handleCta} />
        ))}
      </main>

      {/* Footer — refined, wordmark + tagline + rights */}
      <footer className="border-t border-[#B89555]/20 bg-gradient-to-br from-[#0d3a2b] via-[#0a2f22] to-[#062018] text-white/85">
        <div className="mx-auto max-w-7xl px-5 sm:px-8 lg:px-12 py-10">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-sm">
            <div className="flex items-center gap-3">
              <JJLogoImage className="h-8 w-auto opacity-95" />
              <div className="leading-tight">
                <p className="font-serif text-base">JBJ Global Real Estate</p>
                <p className="text-[10px] tracking-[0.28em] uppercase text-[#B89555]/90 mt-0.5">Dubai · UAE</p>
              </div>
            </div>
            <p className="text-white/60 text-xs tracking-wide">© {new Date().getFullYear()} JBJ Global Real Estate. All rights reserved.</p>
          </div>
        </div>
      </footer>


      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} sourcePage="/access" />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />

      {/* Floating lead CTA */}
      <button
        onClick={() => setLeadOpen(true)}
        className="fixed bottom-5 right-5 z-30 rounded-full bg-[#064E3B] text-white px-5 py-3 text-sm font-semibold shadow-[0_10px_30px_-8px_rgba(6,78,59,0.55)] hover:-translate-y-0.5 transition-transform"
      >
        Speak to an advisor
      </button>
    </div>
  );
}

function SectionRenderer({ section, onCta }: { section: GateSection; onCta: (a?: string) => void }) {
  switch (section.kind) {
    case "hero": return <HeroSection s={section} onCta={onCta} />;
    case "overview": return <OverviewSection s={section} />;
    case "video": return <VideoSection s={section} />;
    case "features": return <FeaturesSection s={section} />;
    case "solutions": return <SolutionsSection s={section} />;
    case "lead_cta": return <LeadCtaSection s={section} onCta={onCta} />;
    case "login_signup": return <LoginSignupSection s={section} onCta={onCta} />;
    default: return null;
  }
}

function HeroSection({ s, onCta }: { s: GateSection; onCta: (a?: string) => void }) {
  const bg = s.media?.url as string | undefined;
  return (
    <section className="relative overflow-hidden">
      <div
        className="absolute inset-0 bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black"
        style={bg ? { backgroundImage: `linear-gradient(rgba(4,44,28,0.75), rgba(0,0,0,0.85)), url(${bg})`, backgroundSize: "cover", backgroundPosition: "center" } : undefined}
      />
      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 sm:py-32 lg:py-40">
        <div className="max-w-3xl">
          <span className="inline-block text-[#B89555] text-xs tracking-[0.3em] uppercase font-semibold mb-6">Welcome to JBJ</span>
          <h1 className="font-serif text-4xl sm:text-5xl lg:text-7xl leading-[1.05] text-white">{s.title}</h1>
          {s.subtitle && <p className="mt-6 text-lg sm:text-xl text-white/85 max-w-2xl">{s.subtitle}</p>}
          {s.body && <p className="mt-4 text-base text-white/70 max-w-2xl">{s.body}</p>}
          <div className="mt-10 flex flex-wrap gap-3">
            {s.cta?.primary && (
              <Button variant="primary" size="lg" onClick={() => onCta(s.cta.primary.action)}>
                {s.cta.primary.label} <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            )}
            {s.cta?.secondary && (
              <Button variant="hero" size="lg" onClick={() => onCta(s.cta.secondary.action)}>
                {s.cta.secondary.label}
              </Button>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function OverviewSection({ s }: { s: GateSection }) {
  return (
    <section className="bg-[#FDFBF7] border-b border-[#B89555]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl text-[#0d3a2b] max-w-3xl mx-auto">{s.title}</h2>
        {s.subtitle && <p className="mt-4 text-lg text-[#1A1A1A]/75 max-w-2xl mx-auto">{s.subtitle}</p>}
        {s.body && <p className="mt-6 text-base text-[#1A1A1A]/70 max-w-3xl mx-auto leading-relaxed">{s.body}</p>}
      </div>
    </section>
  );
}

function VideoSection({ s }: { s: GateSection }) {
  const videoUrl = s.media?.url as string | undefined;
  const poster = s.media?.poster as string | undefined;
  return (
    <section className="bg-[#F7F2EA] border-b border-[#B89555]/15">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-10">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0d3a2b]">{s.title}</h2>
          {s.subtitle && <p className="mt-3 text-[#1A1A1A]/75">{s.subtitle}</p>}
        </div>
        <div className="relative aspect-video rounded-2xl overflow-hidden border border-[#B89555]/30 bg-[#0d3a2b] shadow-[0_20px_60px_-20px_rgba(6,78,59,0.35)]">
          {videoUrl ? (
            <video src={videoUrl} poster={poster} controls className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full grid place-items-center text-white/70">
              <div className="text-center">
                <div className="mx-auto w-16 h-16 rounded-full bg-white/10 grid place-items-center mb-3">
                  <Play className="w-7 h-7" />
                </div>
                <p className="text-sm">Demo video coming soon</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function FeaturesSection({ s }: { s: GateSection }) {
  const items = (s.props?.items ?? []) as { title: string; body: string }[];
  return (
    <section className="bg-[#FDFBF7] border-b border-[#B89555]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0d3a2b]">{s.title}</h2>
          {s.subtitle && <p className="mt-3 text-[#1A1A1A]/75">{s.subtitle}</p>}
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it, i) => (
            <div key={i} className="rounded-2xl border border-[#B89555]/25 bg-white p-6 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all">
              <CheckCircle2 className="w-6 h-6 text-[#064E3B] mb-3" />
              <h3 className="font-serif text-xl text-[#0d3a2b] mb-2">{it.title}</h3>
              <p className="text-sm text-[#1A1A1A]/75 leading-relaxed">{it.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function SolutionsSection({ s }: { s: GateSection }) {
  const items = (s.props?.items ?? []) as { title: string; body: string }[];
  return (
    <section className="bg-[#F7F2EA] border-b border-[#B89555]/15">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="text-center mb-12">
          <h2 className="font-serif text-3xl sm:text-4xl text-[#0d3a2b]">{s.title}</h2>
          {s.subtitle && <p className="mt-3 text-[#1A1A1A]/75">{s.subtitle}</p>}
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((it, i) => {
            const Icon = ICON_MAP[it.title] ?? Sparkles;
            return (
              <div key={i} className="rounded-2xl border border-[#B89555]/25 bg-[#FDFBF7] p-6 hover:border-[#064E3B]/40 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-xl bg-[#064E3B] text-white grid place-items-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-serif text-xl text-[#0d3a2b]">{it.title}</h3>
                    <p className="mt-1 text-sm text-[#1A1A1A]/75 leading-relaxed">{it.body}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function LeadCtaSection({ s, onCta }: { s: GateSection; onCta: (a?: string) => void }) {
  return (
    <section className="bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black text-white">
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-20 lg:py-24 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl">{s.title}</h2>
        {s.subtitle && <p className="mt-4 text-white/80 max-w-2xl mx-auto">{s.subtitle}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {s.cta?.primary && (
            <Button variant="primary" size="lg" onClick={() => onCta(s.cta.primary.action)}>
              {s.cta.primary.label} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}

function LoginSignupSection({ s, onCta }: { s: GateSection; onCta: (a?: string) => void }) {
  return (
    <section className="bg-[#FDFBF7]">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-20 lg:py-28 text-center">
        <h2 className="font-serif text-3xl sm:text-4xl text-[#0d3a2b]">{s.title}</h2>
        {s.subtitle && <p className="mt-4 text-[#1A1A1A]/75 max-w-2xl mx-auto">{s.subtitle}</p>}
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          {s.cta?.primary && (
            <Button variant="primary" size="lg" onClick={() => onCta(s.cta.primary.action)}>
              {s.cta.primary.label} <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          )}
          {s.cta?.secondary && (
            <Button variant="secondary" size="lg" onClick={() => onCta(s.cta.secondary.action)}>
              {s.cta.secondary.label}
            </Button>
          )}
        </div>
      </div>
    </section>
  );
}
