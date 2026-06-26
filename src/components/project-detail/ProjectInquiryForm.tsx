import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Send, Loader2, Check, ChevronsUpDown, Building2, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useDevelopers, useCommunities, useTrendingAreas } from "@/hooks/useProjects";
import { cn } from "@/lib/utils";

interface ProjectInquiryFormProps {
  projectId: string;
  projectName: string;
  projectLocation?: string;
  developerName?: string;
  /** Called after a successful submission. Receives the document URL to download, if any. */
  onSuccess?: (documentUrl?: string) => void;
  /** Optional document URL the user will receive after submitting (e.g. brochure). */
  documentUrl?: string;
  /** Optional context label for the submitted lead, e.g. "Download Brochure". */
  intent?: string;
  /** Compact mode (used inside a modal). Hides the big heading/subtitle. */
  compact?: boolean;
}

const TIMELINE_OPTIONS = [
  { value: "1_month", label: "Within 1 month" },
  { value: "1_3_months", label: "1 – 3 months" },
  { value: "3_6_months", label: "3 – 6 months" },
  { value: "6_12_months", label: "6 – 12 months" },
  { value: "exploring", label: "Just exploring" },
];

const CONTACT_METHOD_OPTIONS = [
  { value: "whatsapp", label: "WhatsApp" },
  { value: "phone", label: "Phone call" },
  { value: "email", label: "Email" },
  { value: "any", label: "Any of the above" },
];

const CONTACT_TIME_OPTIONS = [
  { value: "morning", label: "Morning (9am – 12pm)" },
  { value: "afternoon", label: "Afternoon (12pm – 5pm)" },
  { value: "evening", label: "Evening (5pm – 9pm)" },
  { value: "anytime", label: "Anytime" },
];

// UAE Emirates list
const UAE_EMIRATES = [
  { value: "dubai", label: "Dubai" },
  { value: "abu-dhabi", label: "Abu Dhabi" },
  { value: "sharjah", label: "Sharjah" },
  { value: "ajman", label: "Ajman" },
  { value: "ras-al-khaimah", label: "Ras Al Khaimah" },
  { value: "fujairah", label: "Fujairah" },
  { value: "umm-al-quwain", label: "Umm Al Quwain" },
];

// Bedroom options with 6 and 7+
const BEDROOM_OPTIONS = [
  { value: "studio", label: "Studio" },
  { value: "1", label: "1 Bedroom" },
  { value: "2", label: "2 Bedrooms" },
  { value: "3", label: "3 Bedrooms" },
  { value: "4", label: "4 Bedrooms" },
  { value: "5", label: "5 Bedrooms" },
  { value: "6", label: "6 Bedrooms" },
  { value: "7+", label: "7+ Bedrooms" },
];

export function ProjectInquiryForm({ 
  projectId, 
  projectName, 
  projectLocation,
  developerName,
  onSuccess,
  documentUrl,
  intent,
  compact = false,
}: ProjectInquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bedrooms: "",
    sizeMin: "",
    sizeMax: "",
    preferredDeveloper: developerName || "",
    selectedEmirate: "",
    location: projectLocation || "",
    timeline: "",
    contactTime: "",
    contactMethod: "",
    message: ""
  });

  // Developer combobox state
  const [developerOpen, setDeveloperOpen] = useState(false);
  const [developerSearch, setDeveloperSearch] = useState("");
  const [isOtherDeveloper, setIsOtherDeveloper] = useState(false);
  const [otherDeveloperName, setOtherDeveloperName] = useState("");

  // Location combobox state
  const [locationOpen, setLocationOpen] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [isOtherLocation, setIsOtherLocation] = useState(false);
  const [otherLocationName, setOtherLocationName] = useState("");

  // Fetch developers and locations
  const { data: developers } = useDevelopers();
  const { data: communities } = useCommunities();
  const { data: trendingAreas } = useTrendingAreas();

  // Build developer options
  const developerOptions = useMemo(() => {
    const options: { value: string; label: string; isSpecial?: boolean }[] = [
      { value: "any", label: "Any Developer", isSpecial: true },
    ];
    
    if (developers) {
      developers.forEach(dev => {
        options.push({ value: dev.id, label: dev.name });
      });
    }
    
    options.push({ value: "other", label: "Other...", isSpecial: true });
    
    return options;
  }, [developers]);

  // Build location options filtered by selected emirate
  const locationOptions = useMemo(() => {
    const options: { value: string; label: string; isSpecial?: boolean }[] = [
      { value: "any", label: "Any Location", isSpecial: true },
    ];
    
    // Add communities
    if (communities) {
      communities.forEach(comm => {
        options.push({ value: comm.id, label: comm.name });
      });
    }
    
    // Add trending areas filtered by emirate
    if (trendingAreas) {
      const filtered = formData.selectedEmirate 
        ? trendingAreas.filter(area => area.emirate?.toLowerCase() === formData.selectedEmirate.toLowerCase())
        : trendingAreas;
      
      filtered.forEach(area => {
        if (!options.find(o => o.label === area.name)) {
          options.push({ value: `area-${area.id}`, label: area.name });
        }
      });
    }
    
    options.push({ value: "other", label: "Other...", isSpecial: true });
    
    return options;
  }, [communities, trendingAreas, formData.selectedEmirate]);

  // Filter developers by search
  const filteredDevelopers = useMemo(() => {
    if (!developerSearch) return developerOptions;
    return developerOptions.filter(dev => 
      dev.label.toLowerCase().includes(developerSearch.toLowerCase())
    );
  }, [developerOptions, developerSearch]);

  // Filter locations by search
  const filteredLocations = useMemo(() => {
    if (!locationSearch) return locationOptions;
    return locationOptions.filter(loc => 
      loc.label.toLowerCase().includes(locationSearch.toLowerCase())
    );
  }, [locationOptions, locationSearch]);

  const handleDeveloperSelect = (value: string) => {
    if (value === "other") {
      setIsOtherDeveloper(true);
      setFormData({ ...formData, preferredDeveloper: "" });
    } else if (value === "any") {
      setIsOtherDeveloper(false);
      setFormData({ ...formData, preferredDeveloper: "Any Developer" });
    } else {
      setIsOtherDeveloper(false);
      const dev = developerOptions.find(d => d.value === value);
      setFormData({ ...formData, preferredDeveloper: dev?.label || "" });
    }
    setDeveloperOpen(false);
  };

  const handleLocationSelect = (value: string) => {
    if (value === "other") {
      setIsOtherLocation(true);
      setFormData({ ...formData, location: "" });
    } else if (value === "any") {
      setIsOtherLocation(false);
      setFormData({ ...formData, location: "Any Location" });
    } else {
      setIsOtherLocation(false);
      const loc = locationOptions.find(l => l.value === value);
      setFormData({ ...formData, location: loc?.label || "" });
    }
    setLocationOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Determine final developer name
      const finalDeveloper = isOtherDeveloper ? otherDeveloperName : formData.preferredDeveloper;
      const finalLocation = isOtherLocation ? otherLocationName : formData.location;

      // Build extended note with timeline + preferred contact time so nothing is lost
      const timelineLabel = TIMELINE_OPTIONS.find(o => o.value === formData.timeline)?.label;
      const contactTimeLabel = CONTACT_TIME_OPTIONS.find(o => o.value === formData.contactTime)?.label;
      const contactMethodLabel = CONTACT_METHOD_OPTIONS.find(o => o.value === formData.contactMethod)?.label;
      // sizeMin is now a comma-separated list of bucket keys (e.g. "800-1200,1800-2500" or "any").
      const sizeBucketsSel = (formData.sizeMin || "")
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s && s !== "any");
      const sizeRange = sizeBucketsSel.length ? sizeBucketsSel.join(", ") : "";
      const parsedSizeMin = (() => {
        const nums = sizeBucketsSel
          .map((k) => parseInt((k.match(/^(\d+)/) || [])[1] || "0", 10))
          .filter((n) => n > 0);
        return nums.length ? Math.min(...nums) : null;
      })();
      const extras: string[] = [];
      if (timelineLabel) extras.push(`Purchase timeline: ${timelineLabel}`);
      if (contactTimeLabel) extras.push(`Preferred contact time: ${contactTimeLabel}`);
      if (contactMethodLabel) extras.push(`Preferred contact method: ${contactMethodLabel}`);
      if (sizeRange) extras.push(`Preferred size buckets: ${sizeRange} sqft`);
      if (intent) extras.push(`Intent: ${intent}`);
      const meta = `[Source: ${window.location.pathname} | Project: ${projectName} | Developer: ${developerName || 'N/A'}]`;
      const composedNotes = [formData.message, extras.join(" · "), meta]
        .filter(Boolean)
        .join("\n\n");

      // Insert into CRM leads table
      const { error } = await supabase.from("crm_leads").insert({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: "project_inquiry",
        source_details: projectName,
        source_page: window.location.pathname,
        preferred_bedrooms: formData.bedrooms || null,
        preferred_size_sqft: parsedSizeMin,
        preferred_developer: finalDeveloper || null,
        preferred_location: finalLocation || null,
        notes: composedNotes,
        status: "new",
        lead_score: 80 // High intent lead from project page
      } as any);

      if (error) throw error;

      // Play notification sound
      const audio = new Audio('/notification.mp3');
      audio.play().catch(() => {});

      toast.success("Thank you! Our team will contact you shortly.", {
        description: "Your inquiry has been submitted successfully."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        phone: "",
        bedrooms: "",
        sizeMin: "",
        sizeMax: "",
        preferredDeveloper: developerName || "",
        selectedEmirate: "",
        location: projectLocation || "",
        timeline: "",
        contactTime: "",
        contactMethod: "",
        message: ""
      });
      setIsOtherDeveloper(false);
      setOtherDeveloperName("");
      setIsOtherLocation(false);
      setOtherLocationName("");

      // Trigger optional document download via same-tab anchor click (avoids Chrome popup blocker)
      if (documentUrl && typeof window !== "undefined") {
        try {
          const link = document.createElement("a");
          link.href = documentUrl;
          link.rel = "noopener";
          link.download = "";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        } catch (downloadErr) {
          console.warn("Document download fallback failed:", downloadErr);
        }
      }

      onSuccess?.(documentUrl);

    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      {!compact && (
        <div className="text-center mb-8">
          <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
            Register Your Interest
          </h3>
          <p className="text-muted-foreground text-base max-w-md mx-auto">
            Get exclusive access to project details, pricing, and personalized consultation.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className={cn("space-y-4", compact ? "w-full" : "max-w-md mx-auto")}>

        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground text-sm font-medium">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="h-12 text-base px-4"
            required
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="email" className="text-foreground text-sm font-medium">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="h-12 text-base px-4"
            required
          />
        </div>

        {/* Phone */}
        <div className="space-y-2">
          <Label htmlFor="phone" className="text-foreground text-sm font-medium">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+971 XX XXX XXXX"
            className="h-12 text-base px-4"
            required
          />
        </div>

        {/* Bedrooms — multi-select pill row (real-estate standard) */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">
            Bedrooms <span className="text-foreground/55 font-normal">(select one or more)</span>
          </Label>
          {(() => {
            const selected = (formData.bedrooms || "")
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean);
            const toggle = (v: string) => {
              const next = selected.includes(v)
                ? selected.filter((x) => x !== v)
                : [...selected, v];
              setFormData({ ...formData, bedrooms: next.join(",") });
            };
            return (
              <div className="flex flex-wrap gap-2">
                {BEDROOM_OPTIONS.map((b) => {
                  const active = selected.includes(b.value);
                  return (
                    <button
                      key={b.value}
                      type="button"
                      onClick={() => toggle(b.value)}
                      data-cta={active ? "champagne-active" : undefined}
                      className={
                        active
                          ? "h-10 px-4 rounded-full text-sm font-medium bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555] transition-all"
                          : "h-10 px-4 rounded-full text-sm font-medium bg-transparent text-[#1A1A1A]/80 border border-[#B89555]/40 hover:border-[#B89555] hover:bg-[#EFE6D6]/60 transition-all"
                      }
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}
        </div>

        {/* Preferred Size — multi-select bucket pills */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">
            Preferred Size <span className="text-foreground/55 font-normal">(select one or more)</span>
          </Label>
          {(() => {
            const SIZE_BUCKETS: { key: string; label: string; min: string; max: string }[] = [
              { key: "any", label: "Any", min: "", max: "" },
              { key: "lt-800", label: "< 800", min: "", max: "800" },
              { key: "800-1200", label: "800 – 1,200", min: "800", max: "1200" },
              { key: "1200-1800", label: "1,200 – 1,800", min: "1200", max: "1800" },
              { key: "1800-2500", label: "1,800 – 2,500", min: "1800", max: "2500" },
              { key: "2500-plus", label: "2,500+ sqft", min: "2500", max: "" },
            ];
            const sel = (formData.sizeMin || "").split(",").filter(Boolean);
            // Encode multi-select via sizeMin field as comma-separated keys.
            const selectedKeys = sel.length ? sel : ["any"];
            const toggle = (key: string) => {
              if (key === "any") {
                setFormData({ ...formData, sizeMin: "any", sizeMax: "" });
                return;
              }
              const without = selectedKeys.filter((x) => x !== "any");
              const next = without.includes(key)
                ? without.filter((x) => x !== key)
                : [...without, key];
              const final = next.length ? next : ["any"];
              // Pick numeric envelope for legacy fields
              const buckets = SIZE_BUCKETS.filter((b) => final.includes(b.key) && b.key !== "any");
              const minNum = buckets.length
                ? Math.min(...buckets.map((b) => parseInt(b.min || "0", 10)))
                : 0;
              const maxNum = buckets.length
                ? Math.max(...buckets.map((b) => parseInt(b.max || "999999", 10)))
                : 0;
              setFormData({
                ...formData,
                sizeMin: final.join(","),
                sizeMax: maxNum && maxNum !== 999999 ? String(maxNum) : "",
              });
              void minNum;
            };
            return (
              <div className="flex flex-wrap gap-2">
                {SIZE_BUCKETS.map((b) => {
                  const active = selectedKeys.includes(b.key);
                  return (
                    <button
                      key={b.key}
                      type="button"
                      onClick={() => toggle(b.key)}
                      data-cta={active ? "champagne-active" : undefined}
                      className={
                        active
                          ? "h-10 px-4 rounded-full text-sm font-medium bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555] transition-all"
                          : "h-10 px-4 rounded-full text-sm font-medium bg-transparent text-[#1A1A1A]/80 border border-[#B89555]/40 hover:border-[#B89555] hover:bg-[#EFE6D6]/60 transition-all"
                      }
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>
            );
          })()}
          <p className="text-foreground/55 text-xs">Optional — helps us match you to the right unit mix.</p>
        </div>

        {/* Developer Selection - Searchable Combobox */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[#1A1A1A]" />
            Developer
          </Label>
          {isOtherDeveloper ? (
            <div className="flex gap-2">
              <Input
                value={otherDeveloperName}
                onChange={(e) => setOtherDeveloperName(e.target.value)}
                placeholder="Enter developer name"
                className="h-12 text-base px-4 flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="h-12"
                onClick={() => {
                  setIsOtherDeveloper(false);
                  setOtherDeveloperName("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Popover open={developerOpen} onOpenChange={setDeveloperOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={developerOpen}
                  className="w-full h-12 justify-between text-base px-4 font-normal text-[#1A1A1A]"
                >
                  {formData.preferredDeveloper || "Select developer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border-border" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search developers..." 
                    value={developerSearch}
                    onValueChange={setDeveloperSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No developer found.</CommandEmpty>
                    <CommandGroup>
                      {filteredDevelopers.map((dev) => (
                        <CommandItem
                          key={dev.value}
                          value={dev.value}
                          onSelect={() => handleDeveloperSelect(dev.value)}
                          className={cn(
                            "cursor-pointer items-start",
                            dev.isSpecial && "font-semibold text-[#1A1A1A]"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 mt-0.5 h-4 w-4 flex-shrink-0",
                              formData.preferredDeveloper === dev.label ? "opacity-100" : "opacity-0"
                            )}
                          />
                          <span data-developer-name className="min-w-0 flex-1 whitespace-normal break-words [overflow-wrap:anywhere] leading-snug overflow-visible">
                            {dev.label}
                          </span>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Emirate Selection */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1A1A1A]" />
            Select Emirate
          </Label>
          <Select
            value={formData.selectedEmirate}
            onValueChange={(value) => setFormData({ ...formData, selectedEmirate: value, location: "" })}
          >
            <SelectTrigger className="h-12 text-base px-4 text-[#1A1A1A]">
              <SelectValue placeholder="Select emirate..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {UAE_EMIRATES.map(emirate => (
                <SelectItem key={emirate.value} value={emirate.value}>
                  {emirate.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Location Selection - Searchable Combobox */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#1A1A1A]" />
            Location
          </Label>
          {isOtherLocation ? (
            <div className="flex gap-2">
              <Input
                value={otherLocationName}
                onChange={(e) => setOtherLocationName(e.target.value)}
                placeholder="Enter location name"
                className="h-12 text-base px-4 flex-1"
              />
              <Button 
                type="button" 
                variant="outline" 
                className="h-12"
                onClick={() => {
                  setIsOtherLocation(false);
                  setOtherLocationName("");
                }}
              >
                Cancel
              </Button>
            </div>
          ) : (
            <Popover open={locationOpen} onOpenChange={setLocationOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={locationOpen}
                  className="w-full h-12 justify-between text-base px-4 font-normal text-[#1A1A1A]"
                >
                  {formData.location || "Select location..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0 bg-background border-border" align="start">
                <Command>
                  <CommandInput 
                    placeholder="Search locations..." 
                    value={locationSearch}
                    onValueChange={setLocationSearch}
                  />
                  <CommandList>
                    <CommandEmpty>No location found.</CommandEmpty>
                    <CommandGroup>
                      {filteredLocations.map((loc) => (
                        <CommandItem
                          key={loc.value}
                          value={loc.value}
                          onSelect={() => handleLocationSelect(loc.value)}
                          className={cn(
                            "cursor-pointer",
                            loc.isSpecial && "font-semibold text-[#1A1A1A]"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.location === loc.label ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {loc.label}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          )}
        </div>

        {/* Timeline + Preferred contact time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="timeline" className="text-foreground text-sm font-medium">When are you looking to buy?</Label>
            <Select
              value={formData.timeline}
              onValueChange={(value) => setFormData({ ...formData, timeline: value })}
            >
              <SelectTrigger className="h-12 text-base px-4">
                <SelectValue placeholder="Select timeline" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {TIMELINE_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="contactTime" className="text-foreground text-sm font-medium">Preferred contact time</Label>
            <Select
              value={formData.contactTime}
              onValueChange={(value) => setFormData({ ...formData, contactTime: value })}
            >
              <SelectTrigger className="h-12 text-base px-4">
                <SelectValue placeholder="Select time" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border">
                {CONTACT_TIME_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Preferred contact method — dropdown, not a checkbox */}
        <div className="space-y-2">
          <Label htmlFor="contactMethod" className="text-foreground text-sm font-medium">Preferred contact method</Label>
          <Select
            value={formData.contactMethod}
            onValueChange={(value) => setFormData({ ...formData, contactMethod: value })}
          >
            <SelectTrigger className="h-12 text-base px-4">
              <SelectValue placeholder="How should we reach out?" />
            </SelectTrigger>
            <SelectContent className="bg-background border-border">
              {CONTACT_METHOD_OPTIONS.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Message (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-foreground text-sm font-medium">Additional Notes</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Any specific requirements or questions..."
            className="min-h-[100px] text-base px-4 py-4"
            rows={4}
          />
        </div>

        {/* Submit — metallic gold CTA (inside-page primary) */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="jj-cta-gold-metallic w-full h-16 text-lg font-semibold inline-flex items-center justify-center gap-2"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5" />
              Register Your Interest
            </>
          )}
        </button>
      </form>

    </div>
  );
}

export default ProjectInquiryForm;
