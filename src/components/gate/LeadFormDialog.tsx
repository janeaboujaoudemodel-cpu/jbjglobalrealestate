import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Building2, Check, ChevronsUpDown, Home, Loader2, ShieldCheck, Wallet, Scale, Megaphone, Sparkles } from "lucide-react";
import Field from "@/components/signup/Field";
import NationalityPicker from "@/components/crm/pickers/NationalityPicker";
import PhoneInputWithCountry from "@/components/crm/pickers/PhoneInputWithCountry";
import { LANGUAGES } from "@/data/languages";

const ADVISOR_FORM_STYLE = `
html body [data-advisor-popover],
html body [data-advisor-popover] [cmdk-root] {
  background: #FDFBF7 !important;
  color: #1A1A1A !important;
  -webkit-text-fill-color: #1A1A1A !important;
}
html body [data-advisor-popover] [cmdk-item] {
  color: #1A1A1A !important;
  -webkit-text-fill-color: #1A1A1A !important;
  border-radius: 10px !important;
}
html body [data-advisor-popover] [cmdk-item] * {
  color: inherit !important;
  -webkit-text-fill-color: currentColor !important;
  opacity: 1 !important;
}
html body [data-advisor-popover] [cmdk-item][data-selected="true"],
html body [data-advisor-popover] [cmdk-item]:hover,
html body [data-advisor-popover] [cmdk-item][aria-selected="true"] {
  background: linear-gradient(135deg,#064E3B 0%,#042c1c 58%,#000 100%) !important;
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
}
html body [data-advisor-popover] [cmdk-item][data-selected="true"] *,
html body [data-advisor-popover] [cmdk-item]:hover *,
html body [data-advisor-popover] [cmdk-item][aria-selected="true"] * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  stroke: #FFFFFF !important;
}
html body [data-advisor-form] [data-service-chip="active"],
html body [data-advisor-form] [data-service-chip="active"] * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  stroke: #FFFFFF !important;
}
html body [data-advisor-submit],
html body [data-advisor-submit] * {
  color: #FFFFFF !important;
  -webkit-text-fill-color: #FFFFFF !important;
  stroke: #FFFFFF !important;
}
html body [data-advisor-submit]::before {
  content: "";
  position: absolute;
  inset: 0;
  pointer-events: none;
  background: linear-gradient(115deg, transparent 0%, transparent 36%, rgba(255,255,255,0.14) 44%, rgba(255,255,255,0.58) 50%, rgba(255,255,255,0.14) 56%, transparent 66%, transparent 100%);
  background-size: 240% 100%;
  animation: advisor-submit-metal 2.8s linear infinite;
}
@keyframes advisor-submit-metal {
  0% { background-position: 180% 0; }
  100% { background-position: -80% 0; }
}
`;

const SERVICE_CATEGORIES = [
  {
    title: "Real Estate",
    icon: Home,
    services: ["Buy Property", "Sell Property", "Lease / Rent Property", "List My Property", "Off-Plan Projects"],
  },
  {
    title: "Investment",
    icon: Wallet,
    services: ["Investment Advisory", "Portfolio Wallet", "Cross-Market Strategy", "Exit & Resale Strategy"],
  },
  {
    title: "Ownership Support",
    icon: ShieldCheck,
    services: ["Property Management", "Mortgage Support", "Legal Coordination", "Holiday Home Operations"],
  },
  {
    title: "Residency & Corporate",
    icon: Building2,
    services: ["Golden Visa", "Company Setup", "Business Development", "Relocation / PRO Services", "Insurance Advisory", "Concierge Services"],
  },
];
export const SERVICES = SERVICE_CATEGORIES.flatMap((category) => category.services);
export const USER_TYPES = ["buyer", "seller", "investor", "tenant", "landlord", "broker", "developer"];

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  sourcePage?: string;
}

function LanguagePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const selected = LANGUAGES.find((l) => l.name === value);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-10 flex items-center justify-between gap-2 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/25"
        >
          <span className="flex items-center gap-2 truncate">
            {selected ? (
              <>
                <span className="text-base leading-none">{selected.flag}</span>
                <span className="truncate">{selected.name}</span>
              </>
            ) : (
              <span className="text-[#1A1A1A]/50">Select language</span>
            )}
          </span>
          <ChevronsUpDown className="w-4 h-4 text-[#1A1A1A]/50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent data-advisor-popover align="start" className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px] bg-[#FDFBF7] border-[#B89555]/40 z-[10200]">
        <Command>
          <CommandInput placeholder="Search language…" className="text-[#1A1A1A]" />
          <CommandList className="max-h-72 overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()}>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {LANGUAGES.map((l) => (
                <CommandItem
                  key={l.code}
                  value={`${l.name} ${l.code}`}
                  data-no-contrast-guard
                  onSelect={() => { onChange(l.name); setOpen(false); }}
                  className="flex items-center gap-2 cursor-pointer data-[selected=true]:!bg-[#064E3B] data-[selected=true]:!text-white data-[selected=true]:[&_*]:!text-white data-[selected=true]:[&_svg]:!stroke-white"
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1 truncate">{l.name}</span>
                  {l.name === value && <Check className="w-4 h-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function UserTypePicker({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className="w-full h-10 flex items-center justify-between gap-2 rounded-md border border-[#B89555]/30 bg-[#FDFBF7] px-3 text-sm text-[#1A1A1A] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]/25"
        >
          <span className="capitalize truncate">{value || "Select role"}</span>
          <ChevronsUpDown className="w-4 h-4 text-[#1A1A1A]/50 shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent data-advisor-popover align="start" className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[220px] bg-[#FDFBF7] border-[#B89555]/40 z-[10200]">
        <Command>
          <CommandInput placeholder="Search role…" className="text-[#1A1A1A]" />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {USER_TYPES.map((t) => (
                <CommandItem
                  key={t}
                  value={t}
                  data-no-contrast-guard
                  onSelect={() => { onChange(t); setOpen(false); }}
                  className="capitalize cursor-pointer data-[selected=true]:!bg-[#064E3B] data-[selected=true]:!text-white data-[selected=true]:[&_*]:!text-white data-[selected=true]:[&_svg]:!stroke-white"
                >
                  {t}
                  {t === value && <Check className="ml-auto w-4 h-4" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

function ServiceCategorySelector({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  const [openCategory, setOpenCategory] = useState(SERVICE_CATEGORIES[0].title);
  const toggle = (service: string) => {
    onChange(value.includes(service) ? value.filter((item) => item !== service) : [...value, service]);
  };

  return (
    <div className="rounded-2xl border border-[#B89555]/35 bg-white p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)]">
      <div className="grid gap-2">
        {SERVICE_CATEGORIES.map((category) => {
          const Icon = category.icon;
          const isOpen = openCategory === category.title;
          const selectedCount = category.services.filter((service) => value.includes(service)).length;
          return (
            <div key={category.title} className="overflow-hidden rounded-xl border border-[#B89555]/25 bg-[#FDFBF7]">
              <button
                type="button"
                onClick={() => setOpenCategory(isOpen ? "" : category.title)}
                className="flex min-h-12 w-full items-center justify-between gap-3 px-4 text-left transition hover:bg-[#F3EEE4]"
              >
                <span className="flex min-w-0 items-center gap-3">
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#0d3a2b]/20 bg-white text-[#0d3a2b]">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate font-serif text-[17px] leading-tight text-[#0d3a2b]">{category.title}</span>
                    <span className="block text-[10px] font-bold uppercase tracking-[0.18em] text-[#1A1A1A]/52">
                      {selectedCount ? `${selectedCount} selected` : "Choose services"}
                    </span>
                  </span>
                </span>
                <ChevronsUpDown className="h-4 w-4 shrink-0 text-[#1A1A1A]/48" />
              </button>

              {isOpen && (
                <div className="flex flex-wrap gap-2 border-t border-[#B89555]/20 bg-white p-3">
                  {category.services.map((service) => {
                    const active = value.includes(service);
                    return (
                      <button
                        key={service}
                        type="button"
                        onClick={() => toggle(service)}
                        data-service-chip={active ? "active" : "inactive"}
                        {...(active ? { "data-no-contrast-guard": true, "data-surface": "dark" } : {})}
                        style={active ? { color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" } : undefined}
                        className={
                          "inline-flex min-h-9 items-center gap-2 rounded-full border px-3.5 text-[12px] font-semibold transition " +
                          (active
                            ? "allow-white border-[#064E3B] bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_58%,#000_100%)] text-white shadow-[0_8px_18px_-12px_rgba(6,78,59,0.85)]"
                            : "border-[#B89555]/45 bg-white text-[#1A1A1A] hover:border-[#064E3B] hover:bg-[#FDFBF7]")
                        }
                      >
                        {active && <Check className="h-3.5 w-3.5" />}
                        {service}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function LeadFormDialog({ open, onOpenChange, sourcePage }: Props) {
  const [form, setForm] = useState({
    full_name: "", email: "", phone: "", nationality: "",
    preferred_language: "English", user_type: "buyer", notes: "",
  });
  const [services, setServices] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("submit-lead", {
        body: { ...form, services, source_page: sourcePage ?? window.location.pathname },
      });
      if (error || (data && (data as any).error)) {
        throw new Error((data as any)?.error ?? error?.message ?? "Submission failed");
      }
      toast.success("Thank you — an advisor will contact you shortly.");
      onOpenChange(false);
      setForm({ full_name: "", email: "", phone: "", nationality: "", preferred_language: "English", user_type: "buyer", notes: "" });
      setServices([]);
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <style>{ADVISOR_FORM_STYLE}</style>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 shadow-[0_20px_60px_-20px_rgba(6,78,59,0.35)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#0d3a2b]">Speak to a JBJ advisor</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Share a few details and we'll reach out — no account required.
          </DialogDescription>
        </DialogHeader>
        <form data-advisor-form onSubmit={submit} autoComplete="on" className="grid gap-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input required autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <div className="sm:col-span-2">
            <Field label="Phone" required>
              <PhoneInputWithCountry value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Mobile" className="sm:grid-cols-2" />
            </Field>
            </div>
            <Field label="Nationality">
              <NationalityPicker value={form.nationality} onChange={(v) => setForm({ ...form, nationality: v })} placeholder="Select nationality" />
            </Field>
            <Field label="Preferred language">
              <LanguagePicker value={form.preferred_language} onChange={(v) => setForm({ ...form, preferred_language: v })} />
            </Field>
            <Field label="I am a">
              <UserTypePicker value={form.user_type} onChange={(v) => setForm({ ...form, user_type: v })} />
            </Field>
          </div>

          {/* Services — edge to edge, no inner card, header sits above the grid */}
          <div>
            <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#064E3B] mb-3">
              Services you're interested in
            </p>
            <ServiceCategorySelector value={services} onChange={setServices} />
          </div>

          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything specific we should know?" />
          </Field>

          {/* Metallic emerald submit — animated shine on hover */}
          <button
            type="submit"
            disabled={loading}
            data-advisor-submit
            data-no-contrast-guard
            data-surface="dark"
            style={{ color: "#FFFFFF", WebkitTextFillColor: "#FFFFFF" }}
            className="allow-white relative isolate inline-flex h-12 w-full overflow-hidden rounded-md items-center justify-center gap-2 bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] text-sm font-bold uppercase tracking-[0.14em] !text-white shadow-[0_16px_30px_-14px_rgba(6,78,59,0.85)] transition hover:brightness-110 disabled:opacity-70 [&_svg]:!text-white"
          >
            {loading ? (
              <><Loader2 className="w-4 h-4 animate-spin" />Sending…</>
            ) : (
              <>Submit request <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
