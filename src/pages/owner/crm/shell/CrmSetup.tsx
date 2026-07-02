import { useMemo, useState } from "react";
import {
  Users, Shield, UserCog, Building2, Layers, Settings2, Boxes,
  Workflow, Zap, GitBranch, Database, Upload, Download, Trash2,
  Mail, MessageSquare, Phone, Share2, Globe2, Puzzle, Store,
  Code2, KeyRound, Webhook, Sparkles, Search, ChevronRight,
} from "lucide-react";

type SetupItem = { label: string; desc: string; icon: any };
type SetupGroup = { title: string; items: SetupItem[] };
type SetupCategory = { id: string; label: string; icon: any; groups: SetupGroup[] };

const CATEGORIES: SetupCategory[] = [
  {
    id: "general", label: "General", icon: Settings2,
    groups: [
      { title: "Personal Settings", items: [
        { label: "Personal Settings", desc: "Language, time zone, signature, theme.", icon: UserCog },
        { label: "Company Details", desc: "Business name, logo, address, currency.", icon: Building2 },
      ]},
      { title: "Localization", items: [
        { label: "Fiscal Year", desc: "Configure fiscal year for reports & forecasts.", icon: Layers },
        { label: "Business Hours", desc: "Define working hours per team & region.", icon: Sparkles },
        { label: "Currencies", desc: "Add multi-currency support for deals.", icon: Boxes },
      ]},
    ],
  },
  {
    id: "users", label: "Users and Control", icon: Users,
    groups: [
      { title: "Users & Permissions", items: [
        { label: "Users", desc: "Add, deactivate & assign licenses.", icon: Users },
        { label: "Security Control", desc: "Profiles, roles, sharing rules, groups.", icon: Shield },
        { label: "Territory Management", desc: "Organize records by geography.", icon: Globe2 },
      ]},
      { title: "Compliance", items: [
        { label: "Audit Log", desc: "Track every user action across the CRM.", icon: Database },
        { label: "Data Privacy", desc: "GDPR, consent, retention & anonymization.", icon: Shield },
      ]},
    ],
  },
  {
    id: "channels", label: "Channels", icon: Share2,
    groups: [
      { title: "Communication", items: [
        { label: "Email", desc: "IMAP / SMTP mailboxes, templates & tracking.", icon: Mail },
        { label: "Telephony", desc: "Connect call providers & log conversations.", icon: Phone },
        { label: "Chat", desc: "Live chat, WhatsApp & Instagram DMs.", icon: MessageSquare },
      ]},
      { title: "Social & Web", items: [
        { label: "Social", desc: "Publish & monitor Facebook, LinkedIn, X.", icon: Share2 },
        { label: "Web Forms", desc: "Capture leads from public JBJ pages.", icon: Globe2 },
      ]},
    ],
  },
  {
    id: "customization", label: "Customization", icon: Layers,
    groups: [
      { title: "Modules & Fields", items: [
        { label: "Modules and Fields", desc: "Reorder, hide & add custom fields.", icon: Boxes },
        { label: "Page Layouts", desc: "Design different layouts per team.", icon: Layers },
        { label: "Templates", desc: "Email, inventory & mail merge templates.", icon: Mail },
      ]},
      { title: "Copy & Rebrand", items: [
        { label: "Rename Tabs", desc: "Rename modules to match JBJ vocabulary.", icon: Sparkles },
        { label: "Translations", desc: "Manage multi-language labels & picklists.", icon: Globe2 },
      ]},
    ],
  },
  {
    id: "automation", label: "Automation", icon: Zap,
    groups: [
      { title: "Process Flow", items: [
        { label: "Workflow Rules", desc: "Trigger email, task & field updates.", icon: Workflow },
        { label: "Blueprint", desc: "Enforce sales stages with mandatory steps.", icon: GitBranch },
        { label: "Approval Process", desc: "Multi-step approvals for discounts, contracts.", icon: Shield },
      ]},
      { title: "AI", items: [
        { label: "Zia · JBJ Copilot", desc: "AI scoring, next-best-action & summaries.", icon: Sparkles },
        { label: "Assignment Rules", desc: "Round-robin & smart lead routing.", icon: Zap },
      ]},
    ],
  },
  {
    id: "data", label: "Data Administration", icon: Database,
    groups: [
      { title: "Data", items: [
        { label: "Import", desc: "Bulk-import records from CSV or XLSX.", icon: Upload },
        { label: "Export", desc: "Download modules & reports for backup.", icon: Download },
        { label: "Data Backup", desc: "Schedule encrypted backups of all data.", icon: Database },
        { label: "Recycle Bin", desc: "Recover deleted records within 60 days.", icon: Trash2 },
      ]},
    ],
  },
  {
    id: "marketplace", label: "Marketplace", icon: Store,
    groups: [
      { title: "Integrations", items: [
        { label: "All Extensions", desc: "Browse the JBJ CRM marketplace.", icon: Store },
        { label: "Installed", desc: "Manage installed extensions & upgrades.", icon: Puzzle },
        { label: "Suggested", desc: "Recommended integrations for your plan.", icon: Sparkles },
      ]},
    ],
  },
  {
    id: "developer", label: "Developer Space", icon: Code2,
    groups: [
      { title: "APIs", items: [
        { label: "API Credentials", desc: "OAuth clients, scopes & rate limits.", icon: KeyRound },
        { label: "Webhooks", desc: "Push events to your external systems.", icon: Webhook },
        { label: "Functions", desc: "Serverless functions in Deluge / JS.", icon: Code2 },
      ]},
      { title: "Widgets", items: [
        { label: "Client Scripts", desc: "Custom logic inside record layouts.", icon: Code2 },
        { label: "Widgets", desc: "Embed custom UI within CRM pages.", icon: Puzzle },
      ]},
    ],
  },
];

export default function CrmSetup() {
  const [activeId, setActiveId] = useState<string>(CATEGORIES[0].id);
  const [query, setQuery] = useState("");
  const active = useMemo(() => CATEGORIES.find((c) => c.id === activeId)!, [activeId]);

  const filtered = useMemo(() => {
    if (!query.trim()) return active.groups;
    const q = query.toLowerCase();
    return active.groups
      .map((g) => ({ ...g, items: g.items.filter((i) => i.label.toLowerCase().includes(q) || i.desc.toLowerCase().includes(q)) }))
      .filter((g) => g.items.length > 0);
  }, [active, query]);

  return (
    <div className="jc-setup">
      <aside className="jc-setup__rail" aria-label="Setup categories">
        <div className="jc-setup__rail-title">Setup</div>
        <nav>
          {CATEGORIES.map((c) => {
            const Icon = c.icon;
            const isActive = c.id === activeId;
            return (
              <button
                key={c.id}
                type="button"
                className="jc-setup__cat"
                data-active={isActive}
                onClick={() => setActiveId(c.id)}
              >
                <Icon size={17} strokeWidth={1.9} />
                <span>{c.label}</span>
                <ChevronRight size={14} className="jc-setup__cat-caret" />
              </button>
            );
          })}
        </nav>
      </aside>

      <section className="jc-setup__main">
        <header className="jc-setup__header">
          <div>
            <h2 className="jc-setup__h">{active.label}</h2>
            <p className="jc-setup__sub">Configure {active.label.toLowerCase()} for JBJ CRM.</p>
          </div>
          <label className="jc-setup__search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Search in ${active.label}`}
            />
          </label>
        </header>

        <div className="jc-setup__body">
          {filtered.map((g) => (
            <div className="jc-setup__group" key={g.title}>
              <h3 className="jc-setup__group-title">{g.title}</h3>
              <div className="jc-setup__cards">
                {g.items.map((i) => {
                  const Icon = i.icon;
                  return (
                    <button type="button" className="jc-setup__card" key={i.label}>
                      <span className="jc-setup__card-icon"><Icon size={20} strokeWidth={1.9} /></span>
                      <span className="jc-setup__card-body">
                        <span className="jc-setup__card-title">{i.label}</span>
                        <span className="jc-setup__card-desc">{i.desc}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="jc-setup__empty">No setup entries match “{query}”.</div>
          )}
        </div>
      </section>
    </div>
  );
}
