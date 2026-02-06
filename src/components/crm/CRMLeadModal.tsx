import { useState } from "react";
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
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface CRMLeadModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  userId: string;
}

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ar", label: "Arabic" },
  { value: "ru", label: "Russian" },
  { value: "zh", label: "Chinese" },
  { value: "hi", label: "Hindi" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "es", label: "Spanish" },
  { value: "fa", label: "Farsi" },
];

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
      
      // Reset form
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
      <DialogContent className="sm:max-w-lg mt-8 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
        <DialogHeader className="pt-2">
          <DialogTitle className="text-black">Add New Lead</DialogTitle>
          <DialogDescription className="text-zinc-600">
            Create a new lead in "My Own Leads" (Source: Manual Entry)
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Required Fields */}
          <div className="space-y-4">
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

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Demographics */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nationality">Nationality</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="British"
              />
            </div>
            <div>
              <Label htmlFor="language">Preferred Language</Label>
              <Select
                value={formData.preferred_language}
                onValueChange={(value) => setFormData({ ...formData, preferred_language: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang.value} value={lang.value}>
                      {lang.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Location */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                value={formData.current_location_country}
                onChange={(e) => setFormData({ ...formData, current_location_country: e.target.value })}
                placeholder="UAE"
              />
            </div>
            <div>
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                value={formData.current_location_city}
                onChange={(e) => setFormData({ ...formData, current_location_city: e.target.value })}
                placeholder="Dubai"
              />
            </div>
          </div>

          {/* Optional Fields */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="gender">Gender</Label>
              <Select
                value={formData.gender}
                onValueChange={(value) => setFormData({ ...formData, gender: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
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
                <SelectContent>
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
            <Label htmlFor="birthday" className="flex items-center gap-2">
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
          <div className="grid grid-cols-2 gap-4">
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

          <div className="flex gap-3 pt-4">
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
