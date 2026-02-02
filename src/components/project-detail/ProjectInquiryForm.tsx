import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ProjectInquiryFormProps {
  projectId: string;
  projectName: string;
  projectLocation?: string;
  developerName?: string;
}

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
    location: projectLocation || "",
    message: ""
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);

    try {
      // Insert into CRM leads table
      const { error } = await supabase.from("crm_leads").insert({
        full_name: formData.name,
        email: formData.email,
        phone: formData.phone,
        source: "project_inquiry",
        source_details: projectName,
        preferred_bedrooms: formData.bedrooms || null,
        preferred_size_sqft: formData.size ? parseInt(formData.size) : null,
        preferred_developer: formData.preferredDeveloper || null,
        preferred_location: formData.location || null,
        notes: formData.message || null,
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
        location: projectLocation || "",
        message: ""
      });

    } catch (error) {
      console.error("Error submitting inquiry:", error);
      toast.error("Failed to submit inquiry. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const whatsappMessage = `Hi, I'm interested in ${projectName}${projectLocation ? ` at ${projectLocation}` : ''}. Please share more details.`;

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

      <form onSubmit={handleSubmit} className="max-w-xl mx-auto space-y-5">
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="name" className="text-foreground text-sm font-medium">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="h-14 text-base px-5"
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
            className="h-14 text-base px-5"
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
            className="h-14 text-base px-5"
            required
          />
        </div>

        {/* Two Column Grid for Optional Fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Bedrooms (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="bedrooms" className="text-foreground text-sm font-medium">Bedrooms</Label>
            <Select
              value={formData.bedrooms}
              onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
            >
              <SelectTrigger className="h-14 text-base px-5">
                <SelectValue placeholder="Select bedrooms" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="studio">Studio</SelectItem>
                <SelectItem value="1">1 Bedroom</SelectItem>
                <SelectItem value="2">2 Bedrooms</SelectItem>
                <SelectItem value="3">3 Bedrooms</SelectItem>
                <SelectItem value="4">4 Bedrooms</SelectItem>
                <SelectItem value="5+">5+ Bedrooms</SelectItem>
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
              className="h-14 text-base px-5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Location (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="location" className="text-foreground text-sm font-medium">Location</Label>
            <Input
              id="location"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              placeholder="e.g., Downtown Dubai"
              className="h-14 text-base px-5"
            />
          </div>

          {/* Preferred Developer (Optional) */}
          <div className="space-y-2">
            <Label htmlFor="developer" className="text-foreground text-sm font-medium">Developer</Label>
            <Input
              id="developer"
              value={formData.preferredDeveloper}
              onChange={(e) => setFormData({ ...formData, preferredDeveloper: e.target.value })}
              placeholder="e.g., Emaar, Damac"
              className="h-14 text-base px-5"
            />
          </div>
        </div>

        {/* Message (Optional) */}
        <div className="space-y-2">
          <Label htmlFor="message" className="text-foreground text-sm font-medium">Additional Notes</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Any specific requirements or questions..."
            className="min-h-[100px] text-base px-5 py-4"
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
