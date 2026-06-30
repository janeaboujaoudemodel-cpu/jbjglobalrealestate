import { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown, Crown, Users2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, LANGUAGES_WITH_FLAGS, ALL_NATIONALITIES, getCitiesForCountry } from "@/data/countries";
import { BrokerCombobox } from "@/components/crm/BrokerCombobox";
import { PIPELINE_STATUSES } from "@/components/crm/LeadStatusBadge";
import PhoneInputWithCountry from "@/components/crm/pickers/PhoneInputWithCountry";

interface CRMLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const LEAD_TYPES = ["Buyer", "Investor", "Seller", "Tenant", "Landlord", "Broker", "Other"];
// Unified premium source list — must match LeadSourceFilter
const LEAD_SOURCES = [
  { value: "manual", label: "Manual Entry" },
  { value: "imported", label: "Database (DLD)" },
  { value: "website", label: "Website Form" },
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone Call" },
  { value: "walkin", label: "Walk-in" },
  { value: "referral", label: "Referral" },
  { value: "broker", label: "Broker" },
  { value: "bayut", label: "Bayut" },
  { value: "propertyfinder", label: "Property Finder" },
  { value: "dubizzle", label: "Dubizzle" },
  { value: "facebook", label: "Facebook" },
  { value: "instagram", label: "Instagram" },
  { value: "google_ads", label: "Google Ads" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "campaign", label: "Email Campaign" },
  { value: "event", label: "Event" },
  { value: "partner", label: "Partner" },
  { value: "third_party", label: "Third-party Platform" },
  { value: "other", label: "Other" },
];
const PROPERTY_TYPES = ["Apartment", "Villa", "Townhouse", "Penthouse", "Commercial", "Land", "Other"];
const BEDROOMS = ["Studio", "1", "2", "3", "4", "5+"];
const BUYING_PURPOSE = ["Investment", "End Use", "Holiday Home", "Other"];
const PRIORITY = ["low", "medium", "high"];
const SCORE_BAND = ["hot", "warm", "cold"];

const CRMLeadModal = ({ open, onClose, onSuccess, userId }: CRMLeadModalProps) => {
  const [loading, setLoading] = useState(false);
  const initial = {
    full_name: "",
    lead_type: "Buyer",
    email: "",
    phone: "",
    whatsapp: "",
    nationality: "",
    preferred_language: "en",
    country_of_residence: "",
    current_location_country: "",
    current_location_city: "",
    budget_min: "",
    budget_max: "",
    budget_currency: "AED",
    preferred_location: "",
    preferred_project: "",
    property_type: "",
    bedroom_requirement: "",
    buying_purpose: "",
    source: "manual",
    pipeline_stage: "new",
    priority: "medium",
    lead_score_band: "warm",
    next_followup_at: "",
    notes: "",
    internal_comments: "",
    tags: "",
    broker_name_text: "",
    assigned_broker_id: null as string | null,
    tier: "standard" as "standard" | "vip",
    pool: "nonpool" as "pool" | "nonpool",
  };
  const [formData, setFormData] = useState(initial);
  const [activeTab, setActiveTab] = useState<"contact" | "requirements" | "pipeline" | "notes">("contact");
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [residenceOpen, setResidenceOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);
  const [tagDraft, setTagDraft] = useState("");

  const tagList = useMemo(
    () => formData.tags.split(",").map((t) => t.trim()).filter(Boolean),
    [formData.tags],
  );
  const addTag = (raw: string) => {
    const v = raw.trim().replace(/,$/, "");
    if (!v) return;
    if (tagList.some((t) => t.toLowerCase() === v.toLowerCase())) return;
    setFormData({ ...formData, tags: [...tagList, v].join(", ") });
  };
  const removeTag = (t: string) => {
    setFormData({
      ...formData,
      tags: tagList.filter((x) => x.toLowerCase() !== t.toLowerCase()).join(", "),
    });
  };

  const resetState = () => {
    setFormData(initial);
    setActiveTab("contact");
    setNationalityOpen(false);
    setLanguageOpen(false);
    setCountryOpen(false);
    setResidenceOpen(false);
    setCityOpen(false);
    setTagDraft("");
    setLoading(false);
  };

  const handleClose = () => {
    onClose();
  };

  // Reset form whenever the dialog is closed externally and unlock body
  // pointer-events as a safety net against any stuck Radix overlay state.
  useEffect(() => {
    if (!open) {
      resetState();
      // Defensive: if Radix left the body locked (rare race with portals),
      // restore interactivity after the close animation finishes.
      const t = window.setTimeout(() => {
        if (document.body.style.pointerEvents === "none") {
          document.body.style.pointerEvents = "";
        }
      }, 250);
      return () => window.clearTimeout(t);
    }
  }, [open]);


  const cities = useMemo(
    () => getCitiesForCountry(formData.current_location_country),
    [formData.current_location_country],
  );


  const normalizePhone = (phone: string): string | null => {
    if (!phone) return null;
    let normalized = phone.replace(/[^\d+]/g, "");
    if (!normalized.startsWith("+")) {
      if (normalized.startsWith("0")) normalized = "+971" + normalized.slice(1);
      else if (normalized.length <= 10) normalized = "+971" + normalized;
      else normalized = "+" + normalized;
    }
    if (/^\+[1-9]\d{1,14}$/.test(normalized)) return normalized;
    return null;
  };

  const normalizeEmail = (email: string): string | null => {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) return normalized;
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      toast.error("Lead name is required");
      return;
    }
    const phone = normalizePhone(formData.phone);
    const whatsapp = normalizePhone(formData.whatsapp);
    const email = normalizeEmail(formData.email);
    if (formData.phone && !phone) {
      toast.error("Invalid phone format. Use E.164 (e.g., +971501234567)");
      return;
    }
    if (formData.whatsapp && !whatsapp) {
      toast.error("Invalid WhatsApp number format");
      return;
    }
    if (formData.email && !email) {
      toast.error("Invalid email format");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("crm_leads").insert({
        full_name: formData.full_name.trim(),
        lead_type: formData.lead_type || null,
        email_lower: email,
        phone_e164: phone,
        whatsapp_e164: whatsapp,
        nationality: formData.nationality || null,
        preferred_language: formData.preferred_language,
        country_of_residence: formData.country_of_residence || null,
        current_location_country: formData.current_location_country || null,
        current_location_city: formData.current_location_city || null,
        budget_min: formData.budget_min ? Number(formData.budget_min) : null,
        budget_max: formData.budget_max ? Number(formData.budget_max) : null,
        budget_currency: formData.budget_currency || "AED",
        preferred_location: formData.preferred_location || null,
        preferred_project: formData.preferred_project || null,
        property_type: formData.property_type || null,
        bedroom_requirement: formData.bedroom_requirement || null,
        buying_purpose: formData.buying_purpose || null,
        source: formData.source || "manual",
        pipeline_stage: formData.pipeline_stage || "new",
        priority: formData.priority || "medium",
        lead_score_band: formData.lead_score_band || "warm",
        next_followup_at: formData.next_followup_at || null,
        notes: formData.notes || null,
        internal_comments: formData.internal_comments || null,
        tags: (() => {
          const base = formData.tags ? formData.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
          // Independent tier and pool tags
          if (formData.tier === "vip") base.push("tier:vip"); else base.push("tier:standard");
          if (formData.pool === "pool") base.push("pool:pool"); else base.push("pool:nonpool");
          return Array.from(new Set(base));
        })(),
        assigned_broker_id: formData.assigned_broker_id,
        owner_type: "broker_owned",
        owner_user_id: userId,
        created_by_user_id: userId,
      } as any);

      if (error) throw error;

      toast.success("Lead created");
      onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Failed to create lead:", err);
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  const submitWithValidation = (e: React.FormEvent) => {
    if (!formData.full_name.trim()) {
      e.preventDefault();
      setActiveTab("contact");
      toast.error("Lead Name is required");
      return;
    }
    handleSubmit(e);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose(); }}>
      <DialogContent className="w-[calc(100vw-1rem)] sm:max-w-[960px] max-h-[calc(100dvh-1rem)] overflow-hidden bg-[#FDFBF7] border border-[#B89555]/35 p-0 shadow-[0_28px_80px_-42px_rgba(26,26,26,0.75)]">
        <DialogHeader className="px-6 pt-5 pb-3 border-b border-[#B89555]/20">
          <DialogTitle className="text-[#1A1A1A] text-lg">Add Lead / Client</DialogTitle>
          <DialogDescription className="text-[#1A1A1A]/70">
            One unified record &mdash; works for buyers, investors, sellers, tenants, landlords, brokers and clients.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={submitWithValidation} className="flex max-h-[calc(100dvh-8rem)] min-h-0 flex-col">
          <div className="flex-1 min-h-0 overflow-y-auto px-4 sm:px-6 pb-4 pt-4 jj-scrollbar-gold">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="min-w-0">
            <TabsList className="bg-[#F7F2EA] border border-[#B89555]/25 p-1 rounded-xl h-auto flex flex-wrap justify-start gap-1">
              <TabsTrigger value="contact">Contact</TabsTrigger>
              <TabsTrigger value="requirements">Requirements</TabsTrigger>
              <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
            </TabsList>



            {/* CONTACT */}
            <TabsContent value="contact" className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Lead Name *</Label>
                  <Input
                    value={formData.full_name}
                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                    placeholder="Full name"
                    required
                  />
                </div>
                <div>
                  <Label>Lead Type</Label>
                  <Select value={formData.lead_type} onValueChange={(v) => setFormData({ ...formData, lead_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {LEAD_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Phone</Label>
                  <PhoneInputWithCountry
                    value={formData.phone}
                    onChange={(v) => setFormData({ ...formData, phone: v })}
                    placeholder="50 123 4567"
                  />
                </div>
                <div>
                  <Label>WhatsApp Number</Label>
                  <PhoneInputWithCountry
                    value={formData.whatsapp}
                    onChange={(v) => setFormData({ ...formData, whatsapp: v })}
                    placeholder="50 123 4567"
                  />
                </div>
                <div>
                  <Label>Email</Label>
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Preferred Language</Label>
                  <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-[#FDFBF7] border border-[#1A1A1A]/15 text-[#1A1A1A] hover:bg-[#1A1A1A]/5">
                        {formData.preferred_language
                          ? `${LANGUAGES_WITH_FLAGS.find((l) => l.code === formData.preferred_language)?.flag || ""} ${LANGUAGES_WITH_FLAGS.find((l) => l.code === formData.preferred_language)?.name || ""}`
                          : "Select language"}
                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0 bg-[#FDFBF7] border border-[#1A1A1A]/15" align="start" side="bottom" sideOffset={6} avoidCollisions={false}>
                      <Command>
                        <CommandInput placeholder="Search language..." className="text-[#1A1A1A]" />
                        <CommandList className="max-h-72 overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                          <CommandEmpty>No language found.</CommandEmpty>
                          <CommandGroup>
                            {LANGUAGES_WITH_FLAGS.map((l) => (
                              <CommandItem
                                key={l.code}
                                value={l.name}
                                onSelect={() => {
                                  setFormData({ ...formData, preferred_language: l.code });
                                  setLanguageOpen(false);
                                }}
                                className="text-[#1A1A1A]"
                              >
                                <Check className={cn("mr-2 h-3.5 w-3.5", formData.preferred_language === l.code ? "opacity-100" : "opacity-0")} />
                                <span className="mr-2">{l.flag}</span>
                                {l.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Nationality</Label>
                  <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-[#FDFBF7] border border-[#1A1A1A]/15 text-[#1A1A1A] hover:bg-[#1A1A1A]/5">
                        {formData.nationality
                          ? `${ALL_NATIONALITIES.find((n) => n.nationality === formData.nationality)?.flag || ""} ${formData.nationality}`
                          : "Select"}
                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0 bg-[#FDFBF7] border border-[#1A1A1A]/15" align="start" side="bottom" sideOffset={6} avoidCollisions={false}>
                      <Command>
                        <CommandInput placeholder="Search nationality..." className="text-[#1A1A1A]" />
                        <CommandList className="max-h-72 overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                          <CommandEmpty>No nationality found.</CommandEmpty>
                          <CommandGroup>
                            {ALL_NATIONALITIES.map((n) => (
                              <CommandItem
                                key={n.nationality}
                                value={n.nationality}
                                onSelect={() => {
                                  setFormData({ ...formData, nationality: n.nationality });
                                  setNationalityOpen(false);
                                }}
                                className="text-[#1A1A1A]"
                              >
                                <Check className={cn("mr-2 h-3.5 w-3.5", formData.nationality === n.nationality ? "opacity-100" : "opacity-0")} />
                                <span className="mr-2">{n.flag}</span>
                                {n.nationality}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label>Country of Residence</Label>
                  <Popover open={residenceOpen} onOpenChange={setResidenceOpen}>
                    <PopoverTrigger asChild>
                      <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-[#FDFBF7] border border-[#1A1A1A]/15 text-[#1A1A1A] hover:bg-[#1A1A1A]/5">
                        {formData.country_of_residence
                          ? `${COUNTRIES.find((c) => c.name === formData.country_of_residence)?.flag || ""} ${formData.country_of_residence}`
                          : "Select"}
                        <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[260px] p-0 bg-[#FDFBF7] border border-[#1A1A1A]/15" align="start" side="bottom" sideOffset={6} avoidCollisions={false}>
                      <Command>
                        <CommandInput placeholder="Search country..." className="text-[#1A1A1A]" />
                        <CommandList className="max-h-72 overflow-y-auto overscroll-contain" onWheel={(e) => e.stopPropagation()} onTouchMove={(e) => e.stopPropagation()}>
                          <CommandEmpty>No country found.</CommandEmpty>
                          <CommandGroup>
                            {COUNTRIES.map((c) => (
                              <CommandItem
                                key={c.code}
                                value={c.name}
                                onSelect={() => {
                                  setFormData({ ...formData, country_of_residence: c.name });
                                  setResidenceOpen(false);
                                }}
                                className="text-[#1A1A1A]"
                              >
                                <Check className={cn("mr-2 h-3.5 w-3.5", formData.country_of_residence === c.name ? "opacity-100" : "opacity-0")} />
                                <span className="mr-2">{c.flag}</span>
                                {c.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </TabsContent>

            {/* REQUIREMENTS */}
            <TabsContent value="requirements" className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Budget Min</Label>
                  <Input
                    type="number"
                    value={formData.budget_min}
                    onChange={(e) => setFormData({ ...formData, budget_min: e.target.value })}
                    placeholder="500000"
                  />
                </div>
                <div>
                  <Label>Budget Max</Label>
                  <Input
                    type="number"
                    value={formData.budget_max}
                    onChange={(e) => setFormData({ ...formData, budget_max: e.target.value })}
                    placeholder="2000000"
                  />
                </div>
                <div>
                  <Label>Currency</Label>
                  <Select value={formData.budget_currency} onValueChange={(v) => setFormData({ ...formData, budget_currency: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {["AED", "USD", "EUR", "GBP", "SAR"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Preferred Location</Label>
                  <Input
                    value={formData.preferred_location}
                    onChange={(e) => setFormData({ ...formData, preferred_location: e.target.value })}
                    placeholder="Dubai Marina, Downtown..."
                  />
                </div>
                <div>
                  <Label>Preferred Project</Label>
                  <Input
                    value={formData.preferred_project}
                    onChange={(e) => setFormData({ ...formData, preferred_project: e.target.value })}
                    placeholder="Project name"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Property Type</Label>
                  <Select value={formData.property_type} onValueChange={(v) => setFormData({ ...formData, property_type: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {PROPERTY_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Bedrooms</Label>
                  <Select value={formData.bedroom_requirement} onValueChange={(v) => setFormData({ ...formData, bedroom_requirement: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {BEDROOMS.map((b) => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Buying Purpose</Label>
                  <Select value={formData.buying_purpose} onValueChange={(v) => setFormData({ ...formData, buying_purpose: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {BUYING_PURPOSE.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </TabsContent>

            {/* PIPELINE */}
            <TabsContent value="pipeline" className="space-y-3 pt-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label>Lead Source</Label>
                  <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7] max-h-80">
                      {LEAD_SOURCES.map((s) => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={formData.pipeline_stage} onValueChange={(v) => setFormData({ ...formData, pipeline_stage: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent
                      position="popper"
                      side="bottom"
                      align="start"
                      sideOffset={6}
                      avoidCollisions={false}
                      className="bg-[#FDFBF7] max-h-96 border border-[#B89555]/30 rounded-xl"
                    >
                      {(['positive','neutral','negative'] as const).map((cat) => {
                        const items = PIPELINE_STATUSES.filter(s => s.category === cat);
                        if (!items.length) return null;
                        const dot = cat === 'negative' ? 'bg-red-500' : 'jj-surface-emerald';
                        const label = cat === 'positive' ? 'Positive' : cat === 'negative' ? 'Negative' : 'Neutral';
                        return (
                          <div key={cat}>
                            <div className="px-2 py-1.5 text-[10px] font-bold text-[#1A1A1A]/60 uppercase tracking-wider border-t border-[#B89555]/20 first:border-t-0 mt-1 first:mt-0 flex items-center gap-2">
                              <span className={cn("w-2 h-2 rounded-full", dot)} />
                              {label}
                            </div>
                            {items.map(s => (
                              <SelectItem key={s.value} value={s.value} className="pl-4">
                                <div className="flex items-center gap-2">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: s.dotColor }} />
                                  {s.label}
                                </div>
                              </SelectItem>
                            ))}
                          </div>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Broker assignment */}
              <BrokerCombobox
                label="Assigned Broker"
                placeholder="Search or type broker name…"
                value={formData.broker_name_text}
                brokerId={formData.assigned_broker_id}
                onChange={({ value, brokerId }) =>
                  setFormData({ ...formData, broker_name_text: value, assigned_broker_id: brokerId })
                }
              />

              {/* Tier (Standard / VIP) and Pool (Pool / Non-pool) — independent */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 mb-0">
                    <Crown className="h-3.5 w-3.5 text-amber-500" />
                    Tier
                  </Label>
                  <div className="inline-flex w-full rounded-lg border border-[#1A1A1A]/15 overflow-hidden bg-[#FDFBF7]">
                    {(['standard','vip'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setFormData({ ...formData, tier: t })}
                        className={cn(
                          "flex-1 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors",
                          formData.tier === t
                            ? t === 'vip'
                              ? "jj-surface-emerald allow-white text-white border-r border-white/20"
                              : "jj-surface-emerald allow-white text-white border-r border-white/20"
                            : "text-[#1A1A1A]/60 hover:bg-[#F7F2EA] border-r border-[#1A1A1A]/10 last:border-r-0"
                        )}
                      >
                        {t === 'vip' ? 'VIP' : 'Standard'}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="flex items-center gap-1.5 mb-0">
                    <Users2 className="h-3.5 w-3.5 text-[color:var(--emerald-1)]" />
                    Pool
                  </Label>
                  <div className="inline-flex w-full rounded-lg border border-[#1A1A1A]/15 overflow-hidden bg-[#FDFBF7]">
                    {(['pool','nonpool'] as const).map(p => (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setFormData({ ...formData, pool: p })}
                        className={cn(
                          "flex-1 px-3 py-2.5 text-xs font-bold uppercase tracking-wide transition-colors",
                          formData.pool === p
                            ? p === 'pool'
                              ? "jj-surface-emerald allow-white text-white border-r border-white/20"
                              : "jj-surface-emerald allow-white text-white border-r border-white/20"
                            : "text-[#1A1A1A]/60 hover:bg-[#F7F2EA] border-r border-[#1A1A1A]/10 last:border-r-0"
                        )}
                      >
                        {p === 'pool' ? 'Pool' : 'Non-pool'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>


              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <Label>Priority</Label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {PRIORITY.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Lead Score</Label>
                  <Select value={formData.lead_score_band} onValueChange={(v) => setFormData({ ...formData, lead_score_band: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent className="bg-[#FDFBF7]">
                      {SCORE_BAND.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Next Follow-up</Label>
                  <Input
                    type="datetime-local"
                    value={formData.next_followup_at}
                    onChange={(e) => setFormData({ ...formData, next_followup_at: e.target.value })}
                  />
                </div>
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-1.5 items-center min-h-[40px] rounded-md border border-[#1A1A1A]/15 bg-[#FDFBF7] px-2 py-1.5 focus-within:border-[#B89555]/60 focus-within:ring-2 focus-within:ring-[#B89555]/20">
                  {tagList.map((t) => (
                    <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#EFE6D6] border border-[#B89555]/40 text-xs text-[#1A1A1A]">
                      {t}
                      <button type="button" onClick={() => removeTag(t)} aria-label={`Remove ${t}`} className="rounded-full hover:bg-[#FDFBF7] px-1 leading-none">×</button>
                    </span>
                  ))}
                  <input
                    value={tagDraft}
                    onChange={(e) => {
                      const v = e.target.value;
                      if (v.endsWith(",")) { addTag(v); setTagDraft(""); }
                      else setTagDraft(v);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") { e.preventDefault(); addTag(tagDraft); setTagDraft(""); }
                      else if (e.key === "Backspace" && !tagDraft && tagList.length) { removeTag(tagList[tagList.length - 1]); }
                    }}
                    onBlur={() => { if (tagDraft.trim()) { addTag(tagDraft); setTagDraft(""); } }}
                    placeholder={tagList.length ? "" : "investor, premium, urgent…"}
                    className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 py-1"
                  />
                </div>
                <p className="text-[11px] text-[#1A1A1A]/60 mt-1">Press Enter or comma to add</p>
              </div>

            </TabsContent>

            {/* NOTES */}
            <TabsContent value="notes" className="space-y-3 pt-3">
              <div>
                <Label>Notes (visible to assignees)</Label>
                <Textarea
                  rows={3}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  placeholder="What does this lead want, when, and why?"
                />
              </div>
              <div>
                <Label>Internal Comments (private)</Label>
                <Textarea
                  rows={3}
                  value={formData.internal_comments}
                  onChange={(e) => setFormData({ ...formData, internal_comments: e.target.value })}
                  placeholder="Private notes for the team only"
                />
              </div>
              <p className="text-xs text-[#1A1A1A]/70">
                Documents &amp; attachments can be uploaded from the lead profile after creation.
              </p>
            </TabsContent>
          </Tabs>

          </div>
          <div className="shrink-0 px-4 sm:px-6 pt-3 pb-3 bg-[#FDFBF7]/95 backdrop-blur supports-[backdrop-filter]:bg-[#FDFBF7]/85 border-t border-[#B89555]/20 flex flex-col sm:flex-row gap-3">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? "Creating..." : "Create Lead"}
            </Button>
          </div>

        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CRMLeadModal;
