import { useMemo, useState } from "react";
import {
  Blocks,
  Search,
  Star,
  Download,
  Check,
  Sparkles,
  Mail,
  Phone,
  MessageSquare,
  BarChart3,
  Calendar,
  FileText,
  CreditCard,
  Cloud,
  Bot,
  Share2,
  Building2,
  Workflow,
  Shield,
  Zap,
  type LucideIcon,
} from "lucide-react";

/**
 * JBJ CRM — Phase 16: Marketplace (Extensions & Integrations)
 * Zoho-parity layout: category rail (left), featured banner + grid (right).
 * All content is presentational scaffold; installs are local state only.
 */

type Extension = {
  id: string;
  name: string;
  publisher: string;
  category: string;
  icon: LucideIcon;
  description: string;
  rating: number;
  installs: string;
  featured?: boolean;
  price?: "Free" | "Paid" | "Freemium";
};

const CATEGORIES: { id: string; label: string; icon: LucideIcon }[] = [
  { id: "all", label: "All Extensions", icon: Blocks },
  { id: "telephony", label: "Telephony", icon: Phone },
  { id: "email", label: "Email & Messaging", icon: Mail },
  { id: "productivity", label: "Productivity", icon: Calendar },
  { id: "analytics", label: "Analytics & BI", icon: BarChart3 },
  { id: "finance", label: "Finance & Payments", icon: CreditCard },
  { id: "storage", label: "Storage & Docs", icon: Cloud },
  { id: "ai", label: "AI & Automation", icon: Bot },
  { id: "social", label: "Social & Ads", icon: Share2 },
  { id: "realestate", label: "Real Estate", icon: Building2 },
  { id: "workflow", label: "Workflow", icon: Workflow },
  { id: "security", label: "Security & Compliance", icon: Shield },
];

const EXTENSIONS: Extension[] = [
  { id: "jbj-signals", name: "JBJ SalesSignals+", publisher: "JBJ Labs", category: "ai", icon: Sparkles, description: "Real-time buyer intent scoring for luxury off-plan pipelines.", rating: 4.9, installs: "12k", featured: true, price: "Freemium" },
  { id: "zia-forecast", name: "Zia Forecast Studio", publisher: "JBJ Labs", category: "ai", icon: Bot, description: "AI-driven quarterly revenue forecasts with confidence bands.", rating: 4.8, installs: "9.4k", featured: true, price: "Paid" },
  { id: "twilio-voice", name: "Twilio Voice", publisher: "Twilio", category: "telephony", icon: Phone, description: "Click-to-call, IVR, call recording — natively inside CRM.", rating: 4.7, installs: "42k", price: "Freemium" },
  { id: "resend-mail", name: "Resend Mail Sync", publisher: "Resend", category: "email", icon: Mail, description: "Two-way sync of transactional and outbound campaigns.", rating: 4.6, installs: "18k", price: "Free" },
  { id: "whatsapp-biz", name: "WhatsApp Business", publisher: "Meta", category: "email", icon: MessageSquare, description: "Send templates, capture inbound leads to the CRM inbox.", rating: 4.8, installs: "55k", price: "Paid", featured: true },
  { id: "google-cal", name: "Google Calendar", publisher: "Google", category: "productivity", icon: Calendar, description: "Two-way meeting sync with conflict detection.", rating: 4.9, installs: "120k", price: "Free" },
  { id: "office365", name: "Microsoft 365", publisher: "Microsoft", category: "productivity", icon: FileText, description: "Outlook, Teams and OneDrive bidirectional bridge.", rating: 4.7, installs: "88k", price: "Free" },
  { id: "tableau", name: "Tableau Live", publisher: "Salesforce", category: "analytics", icon: BarChart3, description: "Embed live Tableau workbooks into any CRM dashboard.", rating: 4.5, installs: "6.2k", price: "Paid" },
  { id: "stripe-pay", name: "Stripe Payments", publisher: "Stripe", category: "finance", icon: CreditCard, description: "Attach payment links and reservations to deals & quotes.", rating: 4.9, installs: "31k", price: "Free" },
  { id: "dropbox", name: "Dropbox Sign", publisher: "Dropbox", category: "storage", icon: Cloud, description: "E-signature envelopes on contracts and offer letters.", rating: 4.6, installs: "14k", price: "Paid" },
  { id: "dubizzle", name: "Property Portal Bridge", publisher: "JBJ Labs", category: "realestate", icon: Building2, description: "Push approved listings to whitelisted UAE portals.", rating: 4.8, installs: "3.1k", price: "Paid" },
  { id: "meta-ads", name: "Meta Lead Ads", publisher: "Meta", category: "social", icon: Share2, description: "Instantly ingest Facebook & Instagram lead forms.", rating: 4.4, installs: "27k", price: "Free" },
  { id: "blueprint-pro", name: "Blueprint Pro", publisher: "JBJ Labs", category: "workflow", icon: Workflow, description: "Advanced state-machine designer with SLA guardrails.", rating: 4.7, installs: "5.9k", price: "Paid" },
  { id: "audit-shield", name: "Audit Shield", publisher: "JBJ Labs", category: "security", icon: Shield, description: "Immutable audit trails with export to SIEM tools.", rating: 4.8, installs: "2.4k", price: "Paid" },
  { id: "zapier", name: "Zapier", publisher: "Zapier", category: "workflow", icon: Zap, description: "Connect JBJ CRM to 6,000+ apps with no-code triggers.", rating: 4.6, installs: "70k", price: "Freemium" },
];

export default function CrmMarketplace() {
  const [category, setCategory] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [installed, setInstalled] = useState<Record<string, boolean>>({
    "google-cal": true,
    "resend-mail": true,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXTENSIONS.filter((e) => {
      if (category !== "all" && e.category !== category) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        e.publisher.toLowerCase().includes(q) ||
        e.description.toLowerCase().includes(q)
      );
    });
  }, [category, query]);

  const featured = useMemo(
    () => EXTENSIONS.filter((e) => e.featured).slice(0, 3),
    []
  );

  return (
    <div className="jc-market" data-no-contrast-guard>
      <aside className="jc-market-rail" aria-label="Marketplace categories">
        <div className="jc-market-rail-title">Categories</div>
        <nav>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const active = c.id === category;
            return (
              <button
                key={c.id}
                type="button"
                className={`jc-market-rail-item ${active ? "is-active" : ""}`}
                onClick={() => setCategory(c.id)}
              >
                <Icon size={15} strokeWidth={1.8} />
                <span>{c.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="jc-market-main">
        <header className="jc-market-header">
          <div>
            <h1 className="jc-market-title">Marketplace</h1>
            <p className="jc-market-sub">
              Extend JBJ CRM with verified integrations, AI extensions and workflow packs.
            </p>
          </div>
          <div className="jc-market-search">
            <Search size={15} strokeWidth={1.8} />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search extensions, publishers, categories…"
              aria-label="Search marketplace"
            />
          </div>
        </header>

        {category === "all" && !query && (
          <section className="jc-market-featured" aria-label="Featured">
            <div className="jc-market-featured-head">
              <Sparkles size={14} strokeWidth={2} />
              <span>Featured this week</span>
            </div>
            <div className="jc-market-featured-grid">
              {featured.map((ext) => {
                const Icon = ext.icon;
                return (
                  <article key={ext.id} className="jc-market-featured-card">
                    <div className="jc-market-featured-icon">
                      <Icon size={22} strokeWidth={1.8} />
                    </div>
                    <div className="jc-market-featured-body">
                      <div className="jc-market-featured-name">{ext.name}</div>
                      <div className="jc-market-featured-pub">{ext.publisher}</div>
                      <p>{ext.description}</p>
                    </div>
                    <button
                      type="button"
                      className="jc-market-cta"
                      onClick={() =>
                        setInstalled((s) => ({ ...s, [ext.id]: !s[ext.id] }))
                      }
                    >
                      {installed[ext.id] ? <><Check size={13} /> Installed</> : <><Download size={13} /> Install</>}
                    </button>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <section className="jc-market-grid-wrap" aria-label="All extensions">
          <div className="jc-market-grid-head">
            <span className="jc-market-grid-title">
              {CATEGORIES.find((c) => c.id === category)?.label ?? "All Extensions"}
            </span>
            <span className="jc-market-grid-count">{filtered.length} extensions</span>
          </div>

          <div className="jc-market-grid">
            {filtered.map((ext) => {
              const Icon = ext.icon;
              const isInstalled = !!installed[ext.id];
              return (
                <article key={ext.id} className="jc-market-card">
                  <div className="jc-market-card-top">
                    <div className="jc-market-card-icon">
                      <Icon size={18} strokeWidth={1.8} />
                    </div>
                    <span className={`jc-market-price jc-market-price--${(ext.price ?? "Free").toLowerCase()}`}>
                      {ext.price ?? "Free"}
                    </span>
                  </div>
                  <div className="jc-market-card-name">{ext.name}</div>
                  <div className="jc-market-card-pub">by {ext.publisher}</div>
                  <p className="jc-market-card-desc">{ext.description}</p>
                  <div className="jc-market-card-meta">
                    <span className="jc-market-rating">
                      <Star size={12} strokeWidth={2} /> {ext.rating.toFixed(1)}
                    </span>
                    <span className="jc-market-installs">{ext.installs} installs</span>
                  </div>
                  <button
                    type="button"
                    className={`jc-market-card-cta ${isInstalled ? "is-installed" : ""}`}
                    onClick={() =>
                      setInstalled((s) => ({ ...s, [ext.id]: !s[ext.id] }))
                    }
                  >
                    {isInstalled ? <><Check size={13} /> Installed</> : <><Download size={13} /> Install</>}
                  </button>
                </article>
              );
            })}

            {filtered.length === 0 && (
              <div className="jc-market-empty">
                No extensions match your search.
              </div>
            )}
          </div>
        </section>
      </section>
    </div>
  );
}
