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
}

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
  developerName 
}: ProjectInquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    bedrooms: "",
    size: "",
    preferredDeveloper: developerName || "",
    selectedEmirate: "",
    location: projectLocation || "",
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

      // Insert into CRM leads table
      const { error } = await supabase.from("crm_leads").insert({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: "project_inquiry",
        source_details: projectName,
        source_page: window.location.pathname,
        preferred_bedrooms: formData.bedrooms || null,
        preferred_size_sqft: formData.size ? parseInt(formData.size) : null,
        preferred_developer: finalDeveloper || null,
        preferred_location: finalLocation || null,
        notes: formData.message ? `${formData.message}\n\n[Source: ${window.location.pathname} | Project: ${projectName} | Developer: ${developerName || 'N/A'}]` : `[Source: ${window.location.pathname} | Project: ${projectName} | Developer: ${developerName || 'N/A'}]`,
        status: "new",
        lead_score: 80 // High intent lead from project page
      });

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
        size: "",
        preferredDeveloper: developerName || "",
        selectedEmirate: "",
        location: projectLocation || "",
        message: ""
      });
      setIsOtherDeveloper(false);
      setOtherDeveloperName("");
      setIsOtherLocation(false);
      setOtherLocationName("");

    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div>
      <div className="text-center mb-8">
        <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3" style={{ fontFamily: "Poppins, sans-serif" }}>
          Register Your Interest
        </h3>
        <p className="text-muted-foreground text-base max-w-md mx-auto">
          Get exclusive access to project details, pricing, and personalized consultation.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="max-w-md mx-auto space-y-4">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground text-sm font-medium">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold"
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
            className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold"
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
            className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Bedrooms with 6 and 7+ */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-foreground text-sm font-medium">Bedrooms</Label>
            <Select
              value={formData.bedrooms}
              onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
            >
              <SelectTrigger className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold">
                <SelectValue placeholder="Select bedrooms" />
              </SelectTrigger>
              <SelectContent className="bg-background border-border z-[9999]">
                {BEDROOM_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Size (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="size" className="text-foreground text-sm font-medium">Size (sqft)</Label>
            <Input
              id="size"
              type="number"
              value={formData.size}
              onChange={(e) => setFormData({ ...formData, size: e.target.value })}
              placeholder="e.g., 1500"
              className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold"
            />
          </div>
        </div>

        {/* Developer Selection - Searchable Combobox */}
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium flex items-center gap-2">
            <Building2 className="w-4 h-4 text-gold" />
            Developer
          </Label>
          {isOtherDeveloper ? (
            <div className="flex gap-2">
              <Input
                value={otherDeveloperName}
                onChange={(e) => setOtherDeveloperName(e.target.value)}
                placeholder="Enter developer name"
                className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold flex-1"
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
                  className="w-full h-12 justify-between text-base px-4 font-normal border-2 border-gold/50 hover:border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black"
                >
                  {formData.preferredDeveloper || "Select developer..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-[9999] bg-background border-border" align="start">
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
                            "cursor-pointer",
                            dev.isSpecial && "font-semibold text-gold"
                          )}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              formData.preferredDeveloper === dev.label ? "opacity-100" : "opacity-0"
                            )}
                          />
                          {dev.label}
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
            <MapPin className="w-4 h-4 text-gold" />
            Select Emirate
          </Label>
          <Select
            value={formData.selectedEmirate}
            onValueChange={(value) => setFormData({ ...formData, selectedEmirate: value, location: "" })}
          >
            <SelectTrigger className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black">
              <SelectValue placeholder="Select emirate..." />
            </SelectTrigger>
            <SelectContent className="bg-background border-border z-[9999]">
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
            <MapPin className="w-4 h-4 text-gold" />
            Location
          </Label>
          {isOtherLocation ? (
            <div className="flex gap-2">
              <Input
                value={otherLocationName}
                onChange={(e) => setOtherLocationName(e.target.value)}
                placeholder="Enter location name"
                className="h-12 text-base px-4 border-2 border-gold/50 hover:border-gold focus:border-gold flex-1"
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
                  className="w-full h-12 justify-between text-base px-4 font-normal border-2 border-gold/50 hover:border-gold bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black"
                >
                  {formData.location || "Select location..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0 z-[9999] bg-background border-border" align="start">
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
                            loc.isSpecial && "font-semibold text-gold"
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

        {/* Message (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-foreground text-sm font-medium">Additional Notes</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Any specific requirements or questions..."
            className="min-h-[100px] text-base px-4 py-4 border-2 border-gold/50 hover:border-gold focus:border-gold"
            rows={4}
          />
        </div>

        {/* Submit Button - Large Primary with premium hover */}
        <Button 
          type="submit" 
          disabled={isSubmitting} 
          variant="primary" 
          size="lg"
          className="w-full h-16 text-lg font-semibold shadow-lg hover:shadow-[0_14px_45px_rgba(200,167,102,0.4)] hover:-translate-y-1 transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-5 h-5 mr-2" />
              Register Your Interest
            </>
          )}
        </Button>
      </form>

    </div>
  );
}

export default ProjectInquiryForm;
