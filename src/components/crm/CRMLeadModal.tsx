import { useState, useMemo } from "react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { COUNTRIES, LANGUAGES_WITH_FLAGS, ALL_NATIONALITIES, getCitiesForCountry } from "@/data/countries";

interface CRMLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const AGE_RANGES = [
  "18-25", "25-30", "30-40", "40-50", "50-60", "60+"
];

const CRMLeadModal = ({ open, onClose, onSuccess, userId }: CRMLeadModalProps) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    nationality: "",
    preferred_language: "en",
    current_location_country: "",
    current_location_city: "",
    gender: "",
    age_range: "",
    birthday: "",
    source: "manual",
    tags: ""
  });

  // Popover open states
  const [nationalityOpen, setNationalityOpen] = useState(false);
  const [languageOpen, setLanguageOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [cityOpen, setCityOpen] = useState(false);

  const cities = useMemo(() => getCitiesForCountry(formData.current_location_country), [formData.current_location_country]);

  const normalizePhone = (phone: string): string | null => {
    if (!phone) return null;
    let normalized = phone.replace(/[^\d+]/g, "");
    if (!normalized.startsWith("+")) {
      if (normalized.startsWith("0")) {
        normalized = "+971" + normalized.slice(1);
      } else if (normalized.length <= 10) {
        normalized = "+971" + normalized;
      } else {
        normalized = "+" + normalized;
      }
    }
    if (/^\+[1-9]\d{1,14}$/.test(normalized)) {
      return normalized;
    }
    return null;
  };

  const normalizeEmail = (email: string): string | null => {
    if (!email) return null;
    const normalized = email.toLowerCase().trim();
    if (/^[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}$/i.test(normalized)) {
      return normalized;
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.full_name.trim()) {
      toast.error("Full name is required");
      return;
    }

    const phone = normalizePhone(formData.phone);
    const email = normalizeEmail(formData.email);

    if (formData.phone && !phone) {
      toast.error("Invalid phone number format. Use E.164 format (e.g., +971501234567)");
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
        email_lower: email,
        phone_e164: phone,
        nationality: formData.nationality || null,
        preferred_language: formData.preferred_language,
        current_location_country: formData.current_location_country || null,
        current_location_city: formData.current_location_city || null,
        gender: formData.gender || null,
        age_range: formData.age_range || null,
        birthday: formData.birthday || null,
        source: formData.source || "manual",
        tags: formData.tags ? formData.tags.split(",").map(t => t.trim()) : [],
        owner_type: "broker_owned",
        owner_user_id: userId,
        created_by_user_id: userId
      });

      if (error) throw error;

      toast.success("Lead created successfully");
      onSuccess();
      onClose();
      
      setFormData({
        full_name: "",
        email: "",
        phone: "",
        nationality: "",
        preferred_language: "en",
        current_location_country: "",
        current_location_city: "",
        gender: "",
        age_range: "",
        birthday: "",
        source: "manual",
        tags: ""
      });
    } catch (err: any) {
      console.error("Failed to create lead:", err);
      toast.error(err.message || "Failed to create lead");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <DialogHeader className="pt-2">
          <DialogTitle className="text-black">Add New Lead</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Create a new lead in "My Own Leads" (Source: Manual Entry)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-3">
          {/* Full Name */}
          <div>
            <Label htmlFor="full_name">Full Name *</Label>
            <Input
              id="full_name"
              value={formData.full_name}
              onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              placeholder="John Doe"
              required
            />
          </div>

          {/* Email & Phone */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="john@example.com"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (E.164)</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+971501234567"
              />
            </div>
          </div>

          {/* Nationality & Language - Searchable with flags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Nationality</Label>
              <Popover open={nationalityOpen} onOpenChange={setNationalityOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black hover:bg-gold/10">
                    {formData.nationality
                      ? `${ALL_NATIONALITIES.find(n => n.nationality === formData.nationality)?.flag || ''} ${formData.nationality}`
                      : "Select nationality"}
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 z-[200] bg-white border-gold/40" align="start">
                  <Command>
                    <CommandInput placeholder="Search nationality..." className="text-black" />
                    <CommandList>
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
                            className="text-black"
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
              <Label>Preferred Language</Label>
              <Popover open={languageOpen} onOpenChange={setLanguageOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black hover:bg-gold/10">
                    {formData.preferred_language
                      ? `${LANGUAGES_WITH_FLAGS.find(l => l.code === formData.preferred_language)?.flag || ''} ${LANGUAGES_WITH_FLAGS.find(l => l.code === formData.preferred_language)?.name || ''}`
                      : "Select language"}
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 z-[200] bg-white border-gold/40" align="start">
                  <Command>
                    <CommandInput placeholder="Search language..." className="text-black" />
                    <CommandList>
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
                            className="text-black"
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
          </div>

          {/* Country & City - Searchable with flags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Country</Label>
              <Popover open={countryOpen} onOpenChange={setCountryOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black hover:bg-gold/10">
                    {formData.current_location_country
                      ? `${COUNTRIES.find(c => c.name === formData.current_location_country)?.flag || ''} ${formData.current_location_country}`
                      : "Select country"}
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[260px] p-0 z-[200] bg-white border-gold/40" align="start">
                  <Command>
                    <CommandInput placeholder="Search country..." className="text-black" />
                    <CommandList>
                      <CommandEmpty>No country found.</CommandEmpty>
                      <CommandGroup>
                        {COUNTRIES.map((c) => (
                          <CommandItem
                            key={c.code}
                            value={c.name}
                            onSelect={() => {
                              setFormData({ ...formData, current_location_country: c.name, current_location_city: "" });
                              setCountryOpen(false);
                            }}
                            className="text-black"
                          >
                            <Check className={cn("mr-2 h-3.5 w-3.5", formData.current_location_country === c.name ? "opacity-100" : "opacity-0")} />
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
            <div>
              <Label>City</Label>
              <Popover open={cityOpen} onOpenChange={setCityOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" role="combobox" className="w-full justify-between h-10 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black hover:bg-gold/10">
                    {formData.current_location_city || "Select city"}
                    <ChevronsUpDown className="ml-1 h-3.5 w-3.5 shrink-0 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[240px] p-0 z-[200] bg-white border-gold/40" align="start">
                  <Command>
                    <CommandInput placeholder="Search city..." className="text-black" />
                    <CommandList>
                      <CommandEmpty>No city found. Type to add custom.</CommandEmpty>
                      <CommandGroup>
                        {cities.map((city) => (
                          <CommandItem
                            key={city}
                            value={city}
                            onSelect={() => {
                              setFormData({ ...formData, current_location_city: city });
                              setCityOpen(false);
                            }}
                            className="text-black"
                          >
                            <Check className={cn("mr-2 h-3.5 w-3.5", formData.current_location_city === city ? "opacity-100" : "opacity-0")} />
                            {city}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </CommandList>
                  </Command>
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Gender & Age Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent className="bg-white z-[200]">
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="age_range">Age Range</Label>
              <Select
                value={formData.age_range}
                onValueChange={(value) => setFormData({ ...formData, age_range: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select age range" />
                </SelectTrigger>
                <SelectContent className="bg-white z-[200]">
                  {AGE_RANGES.map(range => (
                    <SelectItem key={range} value={range}>
                      {range}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Birthday */}
          <div>
            <Label htmlFor="birthday" className="flex items-center gap-2 mb-1.5">
              Birthday (Optional)
              <span className="text-xs text-muted-foreground">🎁 For birthday offers</span>
            </Label>
            <Input
              id="birthday"
              type="date"
              value={formData.birthday}
              onChange={(e) => setFormData({ ...formData, birthday: e.target.value })}
            />
          </div>

          {/* Source and Tags */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                value={formData.source}
                onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                placeholder="website, referral, etc."
              />
            </div>
            <div>
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags}
                onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                placeholder="investor, premium"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-3">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
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
