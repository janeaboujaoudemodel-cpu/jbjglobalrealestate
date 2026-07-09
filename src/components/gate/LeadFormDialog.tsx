import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem } from "@/components/ui/command";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { ArrowRight, Check, ChevronsUpDown, Loader2 } from "lucide-react";
import Field from "@/components/signup/Field";
import PillGroup from "@/components/signup/PillGroup";
import NationalityPicker from "@/components/crm/pickers/NationalityPicker";
import PhoneInputWithCountry from "@/components/crm/pickers/PhoneInputWithCountry";
import { LANGUAGES } from "@/data/languages";

export const SERVICES = [
  "Buy Property", "Sell Property", "Rent Property", "List My Property",
  "Off-Plan Projects", "Property Management", "Investment Advisory",
  "Golden Visa", "Mortgage Support", "Interior Design", "Company Setup",
];
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
      <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[240px] bg-[#FDFBF7] border-[#B89555]/40 z-[10200]">
        <Command>
          <CommandInput placeholder="Search language…" className="text-[#1A1A1A]" />
          <CommandList className="max-h-72 overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()}>
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {LANGUAGES.map((l) => (
                <CommandItem
                  key={l.code}
                  value={`${l.name} ${l.code}`}
                  onSelect={() => { onChange(l.name); setOpen(false); }}
                  className="flex items-center gap-2 cursor-pointer data-[selected=true]:!bg-[#064E3B] data-[selected=true]:!text-white data-[selected=true]:[&_*]:!text-white data-[selected=true]:[&_svg]:!stroke-white"
                >
                  <span className="text-base leading-none">{l.flag}</span>
                  <span className="flex-1 truncate">{l.name}</span>
                  {l.name === value && <Check className="w-4 h-4 text-[#064E3B]" />}
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
      <PopoverContent align="start" className="p-0 w-[var(--radix-popover-trigger-width)] min-w-[220px] bg-[#FDFBF7] border-[#B89555]/40 z-[10200]">
        <Command>
          <CommandInput placeholder="Search role…" className="text-[#1A1A1A]" />
          <CommandList className="max-h-72 overflow-y-auto">
            <CommandEmpty>No match.</CommandEmpty>
            <CommandGroup>
              {USER_TYPES.map((t) => (
                <CommandItem
                  key={t}
                  value={t}
                  onSelect={() => { onChange(t); setOpen(false); }}
                  className="capitalize cursor-pointer"
                >
                  {t}
                  {t === value && <Check className="ml-auto w-4 h-4 text-[#064E3B]" />}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
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
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto bg-[#FDFBF7] text-[#1A1A1A] border-[#B89555]/30 shadow-[0_20px_60px_-20px_rgba(6,78,59,0.35)]">
        <DialogHeader>
          <DialogTitle className="font-serif text-3xl text-[#0d3a2b]">Speak to a JBJ advisor</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            Share a few details and we'll reach out — no account required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} autoComplete="on" className="grid gap-5 mt-2">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Full name" required>
              <Input required autoComplete="name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <Input required type="email" autoComplete="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </Field>
            <Field label="Phone" required>
              <PhoneInputWithCountry value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} placeholder="Mobile number" />
            </Field>
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
            <PillGroup options={SERVICES} value={services} onChange={setServices} />
          </div>

          <Field label="Notes">
            <Textarea rows={3} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Anything specific we should know?" />
          </Field>

          {/* Metallic emerald submit — animated shine on hover */}
          <button
            type="submit"
            disabled={loading}
            className="relative overflow-hidden inline-flex w-full h-12 items-center justify-center gap-2 rounded-md text-sm font-bold uppercase tracking-[0.14em] !text-white [&_svg]:!text-white bg-[linear-gradient(135deg,#064E3B_0%,#042c1c_55%,#000_100%)] shadow-[0_16px_30px_-14px_rgba(6,78,59,0.85)] hover:brightness-110 transition disabled:opacity-70 before:pointer-events-none before:absolute before:inset-y-0 before:-left-1/2 before:w-1/2 before:bg-gradient-to-r before:from-transparent before:via-white/30 before:to-transparent hover:before:translate-x-[300%] before:transition before:duration-[900ms]"
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
