import { useEffect, useState } from "react";
import { Check, Plug, Link as LinkIcon, Copy } from "lucide-react";
import { cn } from "@/lib/utils";

const EMERALD_PILL: React.CSSProperties = {
  background: "linear-gradient(180deg, #0B5F46 0%, #064E3B 55%, #043528 100%)",
  border: "1px solid #10B981",
  boxShadow: "inset 0 1px 0 rgba(110,231,183,0.55), inset 0 -1px 0 rgba(0,0,0,0.35), 0 1px 2px rgba(0,0,0,0.35)",
  color: "#FFFFFF",
};

type Integration = {
  id: string; name: string; group: string; description: string; connected?: boolean;
};

const INTEGRATIONS: Integration[] = [
  { id: "zoho",     name: "Zoho CRM",         group: "CRM",     description: "Live sync of Leads, Contacts, Accounts, Deals, Tasks, Cases, Products, Quotes, Invoices.", connected: true },
  { id: "dev_api",  name: "Developer Upload API", group: "Developers", description: "Per-developer API key so their site can post new projects directly into JBJ." },
  { id: "pm",       name: "Property Monitor", group: "Portals", description: "Push listings and pull comparables from Property Monitor." },
  { id: "bayut",    name: "Bayut",            group: "Portals", description: "Auto-publish listings on Bayut with per-listing on/off." },
  { id: "pf",       name: "Property Finder",  group: "Portals", description: "Auto-publish listings on Property Finder." },
  { id: "dubizzle", name: "Dubizzle",         group: "Portals", description: "Auto-publish listings on Dubizzle." },
  { id: "pguru",    name: "Property Guru",    group: "Portals", description: "Auto-publish listings on Property Guru." },
  { id: "dxb",      name: "DXB Interact",     group: "Portals", description: "Sync verified transaction data from DXB Interact." },
  { id: "dld",      name: "DLD",              group: "Portals", description: "Sync developer + transaction records from Dubai Land Department." },
  { id: "fb",       name: "Facebook",         group: "Social",  description: "Publish campaigns and capture lead-form submissions." },
  { id: "ig",       name: "Instagram",        group: "Social",  description: "Publish posts and reels; capture DMs as leads." },
  { id: "tt",       name: "TikTok",           group: "Social",  description: "Publish shorts and capture leads." },
  { id: "li",       name: "LinkedIn",         group: "Social",  description: "Publish company posts and B2B lead-gen forms." },
];

const STORAGE_KEY = "jbj_crm_integration_toggles";

export default function JbjCrmIntegrations() {
  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    try { setToggles(JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}")); } catch { /* noop */ }
  }, []);

  const setToggle = (id: string, v: boolean) => {
    const next = { ...toggles, [id]: v };
    setToggles(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* noop */ }
  };

  const groups = Array.from(new Set(INTEGRATIONS.map((i) => i.group)));

  return (
    <div className="p-6">
      <div className="mb-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-[#5A5346]">Configure</p>
        <h1 className="text-[22px] font-semibold text-[#1A1A1A]">Integrations</h1>
        <p className="text-[13px] text-[#5A5346] mt-1">Everything that talks to JBJ CRM lives here.</p>
      </div>

      {groups.map((group) => (
        <section key={group} className="mb-6">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8A7F6A] mb-2">{group}</p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {INTEGRATIONS.filter((i) => i.group === group).map((i) => {
              const on = toggles[i.id] ?? !!i.connected;
              return (
                <div key={i.id} className="rounded-2xl bg-white border border-[#E7DDC8] p-4">
                  <div className="flex items-start gap-3">
                    <div className="h-9 w-9 rounded-lg inline-flex items-center justify-center shrink-0" style={EMERALD_PILL}>
                      {on ? <Check className="h-4 w-4" /> : <Plug className="h-4 w-4" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="text-[13px] font-semibold text-[#1A1A1A]">{i.name}</p>
                        {i.connected ? (
                          <span className="text-[10px] font-semibold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">LIVE</span>
                        ) : null}
                      </div>
                      <p className="text-[12px] text-[#5A5346] mt-0.5">{i.description}</p>
                    </div>
                    <button
                      onClick={() => setToggle(i.id, !on)}
                      className={cn(
                        "shrink-0 h-6 w-11 rounded-full relative transition-colors",
                        on ? "" : "bg-[#EFE6D6]"
                      )}
                      style={on ? { background: "#064E3B" } : undefined}
                      aria-label={`Toggle ${i.name}`}
                    >
                      <span
                        className={cn(
                          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
                          on ? "translate-x-[22px]" : "translate-x-0.5"
                        )}
                      />
                    </button>
                  </div>

                  {i.id === "dev_api" && on ? (
                    <div className="mt-3 rounded-lg bg-[#F7F2EA] border border-[#E7DDC8] p-2.5">
                      <p className="text-[10.5px] font-semibold uppercase tracking-[0.18em] text-[#8A7F6A] mb-1">Endpoint</p>
                      <div className="flex items-center gap-1.5">
                        <code className="text-[11px] text-[#1A1A1A] flex-1 truncate">
                          POST https://jbj.ae/api/dev/projects
                        </code>
                        <button
                          onClick={() => navigator.clipboard.writeText("POST https://jbj.ae/api/dev/projects")}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded text-[11px] font-semibold text-[#1A1A1A] bg-white border border-[#E7DDC8]"
                        >
                          <Copy className="h-3 w-3" /> Copy
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </section>
      ))}

      <p className="text-[11px] text-[#5A5346] mt-4 flex items-center gap-1.5">
        <LinkIcon className="h-3 w-3" /> Toggles are saved locally per operator. Live push/pull for portals + social lands in Phase 2.
      </p>
    </div>
  );
}
