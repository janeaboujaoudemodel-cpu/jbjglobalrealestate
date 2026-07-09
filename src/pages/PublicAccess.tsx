import { useState } from "react";
import { Link } from "react-router-dom";
import { JJLogoImage } from "@/components/JJLogoImage";
import { Button } from "@/components/ui/button";
import LeadFormDialog from "@/components/gate/LeadFormDialog";
import SignupDialog from "@/components/gate/SignupDialog";
import LoginDialog from "@/components/gate/LoginDialog";
import investorEducationCover from "@/assets/books/investor-education-cover.jpg";
import marketIntelligenceCover from "@/assets/books/market-intelligence-cover.jpg";
import buyerGuideCover from "@/assets/books/buyer-guide-cover.jpg";
import brokerEducationCover from "@/assets/books/broker-education-cover.jpg";
import goldenVisaCover from "@/assets/books/golden-visa-cover.jpg";
import {
  ArrowRight,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  CreditCard,
  GraduationCap,
  Home,
  KeyRound,
  Library,
  LineChart,
  Lock,
  Play,
  ShieldCheck,
  Sparkles,
  Star,
  TrendingUp,
  Users,
} from "lucide-react";

const quickLinks = [
  { label: "Featured Properties", href: "#featured" },
  { label: "New Launch", href: "#new-launch" },
  { label: "Books", href: "#books" },
  { label: "Pricing", href: "#pricing" },
  { label: "Education", href: "#education" },
];

const featuredProperties = [
  {
    title: "Off-plan launch desk",
    meta: "Dubai prime communities",
    body: "Curated new releases with payment-plan review, developer checks, and handover guidance.",
    image: "/services/buy-property-bg.jpg",
    icon: Building2,
  },
  {
    title: "Investment shortlist",
    meta: "Yield, growth, exit view",
    body: "Compare projects through returns, rental depth, service charges, and resale liquidity.",
    image: "/services/property-evaluation-bg.jpg",
    icon: LineChart,
  },
  {
    title: "Golden Visa pathway",
    meta: "Property-led residency",
    body: "Structure your purchase with residency eligibility, documentation, and concierge coordination.",
    image: "/services/golden-visa-bg.jpg",
    icon: BadgeCheck,
  },
];

const books = [
  { title: "Investor Education", eyebrow: "Education", image: investorEducationCover, href: "/investor-education" },
  { title: "Market Intelligence", eyebrow: "Insights", image: marketIntelligenceCover, href: "/market-intelligence" },
  { title: "Buyer Guide", eyebrow: "Guides", image: buyerGuideCover, href: "/buyer-guide" },
  { title: "Broker Academy", eyebrow: "Academy", image: brokerEducationCover, href: "/jbj-academy" },
  { title: "Golden Visa Guide", eyebrow: "Residency", image: goldenVisaCover, href: "/guides/golden-visa-uae" },
];

const pricing = [
  {
    name: "Investor Access",
    price: "AED 499",
    cadence: "monthly",
    icon: TrendingUp,
    features: ["Premium launch access", "Market intelligence library", "Investment reports"],
    href: "/membership",
  },
  {
    name: "Broker Academy",
    price: "AED 1,499",
    cadence: "program",
    icon: GraduationCap,
    features: ["Certification pathway", "Sales scripts and templates", "Broker learning hub"],
    href: "/academy",
  },
  {
    name: "Agency Package",
    price: "AED 2,999",
    cadence: "monthly",
    icon: Users,
    features: ["Team enablement", "CRM segmentation", "Lead and content systems"],
    href: "/agencies",
  },
];

const educationCards = [
  { title: "Insights", body: "Market analysis, strategy articles, and premium investor thinking.", href: "/insights", icon: Sparkles },
  { title: "Library", body: "Books, explainers, guides, and document resources in one place.", href: "/library", icon: Library },
  { title: "Success Stories", body: "Real client journeys, property decisions, and outcome-led case studies.", href: "/success-stories", icon: Star },
  { title: "Broker Academy", body: "A structured learning track for brokers and agency teams.", href: "/jbj-academy", icon: GraduationCap },
];

export default function PublicAccess() {
  const [leadOpen, setLeadOpen] = useState(false);
  const [signupOpen, setSignupOpen] = useState(false);
  const [loginOpen, setLoginOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#F7F2EA] text-[#1A1A1A]">
      <header className="sticky top-0 z-40 border-b border-[#B89555]/35 bg-[#FDFBF7]/95 backdrop-blur-md">
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-5 px-5 sm:px-8 lg:px-12">
          <a href="/access" className="flex items-center gap-3" aria-label="JBJ Global Real Estate access gate">
            <JJLogoImage size="sm" showText={false} className="!items-start" />
            <div className="hidden sm:flex flex-col leading-none">
              <span className="font-serif text-[19px] text-[#0d3a2b]">JBJ Global</span>
              <span className="mt-0.5 text-[10px] uppercase tracking-[0.32em] text-[#B89555]">Real Estate</span>
            </div>
          </a>

          <nav className="hidden items-center gap-1 lg:flex" aria-label="Access page sections">
            {quickLinks.map((link) => (
              <a key={link.href} href={link.href} className="rounded-full px-3 py-2 text-[12px] font-semibold uppercase tracking-[0.12em] text-[#1A1A1A]/70 transition hover:bg-[#EFE6D6] hover:text-[#064E3B]">
                {link.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <Button variant="secondary" size="sm" onClick={() => setLoginOpen(true)} className="h-10 px-4">
              Log in
            </Button>
            <Button variant="primary" size="sm" onClick={() => setSignupOpen(true)} className="h-10 px-4 shadow-[0_10px_24px_-12px_rgba(6,78,59,0.85)]">
              Sign up <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main>
        <section className="relative min-h-[calc(100vh-76px)] overflow-hidden">
          <div className="absolute inset-0 bg-[#042c1c]">
            <img src="/services/buy-property-bg.jpg" alt="Dubai premium real estate skyline" className="h-full w-full object-cover opacity-70" />
            <div className="absolute inset-0 bg-[linear-gradient(115deg,rgba(6,78,59,0.92)_0%,rgba(4,44,28,0.78)_43%,rgba(0,0,0,0.82)_100%)]" />
          </div>
          <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 px-5 py-16 sm:px-8 lg:grid-cols-[1.05fr_0.95fr] lg:px-12">
            <div className="max-w-3xl pt-4 text-white">
              <span className="mb-6 inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.28em] text-[#D9C292]">
                <ShieldCheck className="h-4 w-4" /> Premium gated access
              </span>
              <h1 className="font-serif text-5xl leading-[1.02] text-white sm:text-6xl lg:text-7xl">JBJ Global Real Estate</h1>
              <p className="mt-6 max-w-2xl text-lg leading-relaxed text-white/86 sm:text-xl">
                Enter a curated property platform for featured projects, new launches, investor books, pricing packages, and broker education.
              </p>
              <div className="mt-9 flex flex-wrap gap-3">
                <Button variant="primary" size="lg" onClick={() => setSignupOpen(true)}>
                  Create your account <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <Button variant="hero" size="lg" onClick={() => setLeadOpen(true)}>
                  Talk to an advisor
                </Button>
              </div>
            </div>

            <div className="hidden lg:block">
              <div className="ml-auto max-w-md border border-white/20 bg-white/10 p-4 shadow-[0_30px_90px_-30px_rgba(0,0,0,0.72)] backdrop-blur-md">
                <div className="grid gap-3">
                  {quickLinks.map((link, index) => (
                    <a key={link.href} href={link.href} className="group flex items-center justify-between border border-white/16 bg-white/[0.08] px-4 py-4 text-white transition hover:border-[#D9C292]/70 hover:bg-white/[0.13]">
                      <span className="flex items-center gap-3">
                        <span className="font-serif text-2xl text-[#D9C292]">0{index + 1}</span>
                        <span className="font-semibold">{link.label}</span>
                      </span>
                      <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="border-b border-[#B89555]/25 bg-[#FDFBF7]">
          <div className="mx-auto grid max-w-7xl gap-5 px-5 py-14 sm:px-8 md:grid-cols-4 lg:px-12">
            {[
              ["Featured", "handpicked listings"],
              ["New launch", "off-plan releases"],
              ["Books", "premium learning"],
              ["Pricing", "membership packages"],
            ].map(([value, label]) => (
              <div key={value} className="border-l border-[#B89555]/45 pl-5">
                <p className="font-serif text-3xl text-[#064E3B]">{value}</p>
                <p className="mt-1 text-sm font-semibold uppercase tracking-[0.16em] text-[#1A1A1A]/55">{label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="featured" className="bg-[#F7F2EA] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#B89555]">Featured properties</span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">See what is inside before you enter.</h2>
              </div>
              <Link to="/properties" className="inline-flex items-center gap-2 text-sm font-bold text-[#064E3B] hover:text-[#042c1c]">
                Browse properties <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {featuredProperties.map((item) => {
                const Icon = item.icon;
                return (
                  <article key={item.title} className="group overflow-hidden border border-[#B89555]/30 bg-[#FDFBF7] shadow-[0_24px_60px_-38px_rgba(26,26,26,0.55)]">
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#042c1c]">
                      <img src={item.image} alt={item.title} className="h-full w-full object-cover transition duration-700 group-hover:scale-105" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                      <div className="absolute bottom-4 left-4 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[image:var(--jj-emerald-ombre)] text-white shadow-lg">
                        <Icon className="h-5 w-5" />
                      </div>
                    </div>
                    <div className="p-6">
                      <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#B89555]">{item.meta}</p>
                      <h3 className="mt-2 font-serif text-2xl text-[#0d3a2b]">{item.title}</h3>
                      <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]/72">{item.body}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="new-launch" className="relative overflow-hidden bg-[image:var(--jj-emerald-ombre)] px-5 py-20 text-white sm:px-8 lg:px-12">
          <div className="absolute inset-0 opacity-28">
            <img src="/services/property-management-bg.jpg" alt="Premium new launch property interior" className="h-full w-full object-cover" />
          </div>
          <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
            <div>
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-[#D9C292]">New launch</span>
              <h2 className="mt-3 font-serif text-4xl text-white sm:text-5xl">A controlled preview for new projects.</h2>
              <p className="mt-5 text-white/78">Access launch materials, payment-plan notes, location intelligence, and advisory support after sign in.</p>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                [Home, "Launch inventory", "Availability snapshots and release highlights."],
                [CreditCard, "Payment plans", "Down payment, construction, handover and post-handover structure."],
                [KeyRound, "Access control", "Premium details stay gated until the user is registered."],
                [Lock, "Private documents", "Books, PDFs, factsheets and investment documents."],
              ].map(([Icon, title, body]) => {
                const TypedIcon = Icon as typeof Home;
                return (
                  <div key={title as string} className="border border-white/16 bg-white/[0.08] p-5 backdrop-blur-sm">
                    <TypedIcon className="h-5 w-5 text-[#D9C292]" />
                    <h3 className="mt-4 font-serif text-2xl text-white">{title as string}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-white/72">{body as string}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        <section id="books" className="bg-[#FDFBF7] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#B89555]">Books and documents</span>
              <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Premium library access.</h2>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5">
              {books.map((book) => (
                <Link key={book.title} to={book.href} className="group block">
                  <div className="aspect-[3/4] overflow-hidden border border-[#B89555]/35 bg-[#EFE6D6] shadow-[0_22px_50px_-36px_rgba(26,26,26,0.72)]">
                    <img src={book.image} alt={`${book.title} book cover`} className="h-full w-full object-cover transition duration-500 group-hover:scale-105" />
                  </div>
                  <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.2em] text-[#B89555]">{book.eyebrow}</p>
                  <h3 className="mt-1 font-serif text-xl text-[#0d3a2b]">{book.title}</h3>
                </Link>
              ))}
            </div>
          </div>
        </section>

        <section id="pricing" className="bg-[#F7F2EA] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 text-center">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#B89555]">Packages pricing</span>
              <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Choose your access level.</h2>
            </div>
            <div className="grid gap-6 lg:grid-cols-3">
              {pricing.map((plan) => {
                const Icon = plan.icon;
                return (
                  <article key={plan.name} className="border border-[#B89555]/35 bg-[#FDFBF7] p-6 shadow-[0_24px_60px_-42px_rgba(26,26,26,0.55)]">
                    <div className="flex items-center justify-between gap-4">
                      <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-[image:var(--jj-emerald-ombre)] text-white">
                        <Icon className="h-5 w-5" />
                      </div>
                      <p className="rounded-full border border-[#B89555]/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.14em] text-[#064E3B]">Access</p>
                    </div>
                    <h3 className="mt-6 font-serif text-3xl text-[#0d3a2b]">{plan.name}</h3>
                    <div className="mt-5 flex items-end gap-2">
                      <span className="font-serif text-4xl text-[#1A1A1A]">{plan.price}</span>
                      <span className="pb-1 text-sm text-[#1A1A1A]/62">/{plan.cadence}</span>
                    </div>
                    <ul className="mt-6 space-y-3">
                      {plan.features.map((feature) => (
                        <li key={feature} className="flex gap-2 text-sm text-[#1A1A1A]/74">
                          <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[#064E3B]" /> {feature}
                        </li>
                      ))}
                    </ul>
                    <Link to={plan.href} className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-[image:var(--jj-emerald-ombre)] px-4 py-3 text-sm font-bold text-white shadow-[0_12px_26px_-16px_rgba(6,78,59,0.8)]">
                      View package <ArrowRight className="h-4 w-4" />
                    </Link>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <section id="education" className="bg-[#FDFBF7] px-5 py-20 sm:px-8 lg:px-12">
          <div className="mx-auto max-w-7xl">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-[#B89555]">Education</span>
                <h2 className="mt-3 font-serif text-4xl text-[#0d3a2b] sm:text-5xl">Learn before you commit.</h2>
              </div>
              <Link to="/library" className="inline-flex items-center gap-2 text-sm font-bold text-[#064E3B] hover:text-[#042c1c]">
                Open library <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
              {educationCards.map((card) => {
                const Icon = card.icon;
                return (
                  <Link key={card.title} to={card.href} className="group border border-[#B89555]/30 bg-[#F7F2EA] p-6 transition hover:border-[#064E3B]/45 hover:bg-[#EFE6D6]/70">
                    <Icon className="h-6 w-6 text-[#064E3B]" />
                    <h3 className="mt-5 font-serif text-2xl text-[#0d3a2b]">{card.title}</h3>
                    <p className="mt-3 text-sm leading-relaxed text-[#1A1A1A]/72">{card.body}</p>
                    <span className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-[#064E3B]">
                      Enter <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>

        <section className="bg-[image:var(--jj-emerald-ombre)] px-5 py-20 text-center text-white sm:px-8 lg:px-12">
          <div className="mx-auto max-w-4xl">
            <BookOpen className="mx-auto h-9 w-9 text-[#D9C292]" />
            <h2 className="mt-5 font-serif text-4xl text-white sm:text-5xl">Ready to enter the JBJ platform?</h2>
            <p className="mx-auto mt-4 max-w-2xl text-white/78">Create an account to unlock the full website, or request a callback if you want an advisor to guide you first.</p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button variant="primary" size="lg" onClick={() => setSignupOpen(true)}>
                Create account <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <Button variant="hero" size="lg" onClick={() => setLeadOpen(true)}>
                Request a call back
              </Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[#B89555]/25 bg-[#F7F2EA] px-5 py-8 sm:px-8 lg:px-12">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-sm text-[#1A1A1A]/65 sm:flex-row">
          <div className="flex items-center gap-3">
            <JJLogoImage size="xs" showText={false} className="!items-start" />
            <span className="font-serif text-base text-[#0d3a2b]">JBJ Global Real Estate</span>
          </div>
          <p>© {new Date().getFullYear()} JBJ Global Real Estate. Dubai · UAE.</p>
        </div>
      </footer>

      <button
        onClick={() => setLeadOpen(true)}
        className="fixed bottom-5 right-5 z-30 inline-flex items-center gap-2 rounded-full bg-[image:var(--jj-emerald-ombre)] px-5 py-3 text-sm font-bold text-white shadow-[0_14px_34px_-16px_rgba(6,78,59,0.85)]"
      >
        <span className="h-1.5 w-1.5 rounded-full bg-[#D9C292]" /> Speak to an advisor
      </button>

      <LeadFormDialog open={leadOpen} onOpenChange={setLeadOpen} sourcePage="/access" />
      <SignupDialog open={signupOpen} onOpenChange={setSignupOpen} />
      <LoginDialog open={loginOpen} onOpenChange={setLoginOpen} />
    </div>
  );
}