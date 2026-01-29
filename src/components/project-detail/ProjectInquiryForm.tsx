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

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-foreground">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="mt-1"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-foreground">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="mt-1"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-foreground">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+971 XX XXX XXXX"
            className="mt-1"
            required
          />
        </div>

        {/* Bedrooms (Optional) */}
        <div>
          <Label htmlFor="bedrooms" className="text-foreground">Number of Bedrooms</Label>
          <Select
            value={formData.bedrooms}
            onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
          >
            <SelectTrigger className="mt-1">
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
        <div>
          <Label htmlFor="size" className="text-foreground">Preferred Size (sqft)</Label>
          <Input
            id="size"
            type="number"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            placeholder="e.g., 1500"
            className="mt-1"
          />
        </div>

        {/* Location (Optional) */}
        <div>
          <Label htmlFor="location" className="text-foreground">Preferred Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Downtown Dubai"
            className="mt-1"
          />
        </div>

        {/* Preferred Developer (Optional) */}
        <div>
          <Label htmlFor="developer" className="text-foreground">Preferred Developer</Label>
          <Input
            id="developer"
            value={formData.preferredDeveloper}
            onChange={(e) => setFormData({ ...formData, preferredDeveloper: e.target.value })}
            placeholder="e.g., Emaar, Damac"
            className="mt-1"
          />
        </div>

        {/* Message (Optional) */}
        <div>
          <Label htmlFor="message" className="text-foreground">Additional Notes</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Any specific requirements or questions..."
            className="mt-1"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full">
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              Register Your Interest
            </>
          )}
        </Button>
      </form>

    </div>
  );
}

export default ProjectInquiryForm;
