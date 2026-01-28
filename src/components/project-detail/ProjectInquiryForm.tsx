import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MessageCircle, Phone, Send, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getWhatsAppUrl, getCallUrl } from "@/constants/stats";

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
    <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl p-6 border-2 border-gold/40">
      <h3 className="text-xl font-semibold text-black mb-2">
        The best deals are our expertise
      </h3>
      <p className="text-zinc-600 text-sm mb-6">Register now!</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Name */}
        <div>
          <Label htmlFor="name" className="text-zinc-700">Full Name *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="Your full name"
            className="mt-1 bg-white border-zinc-300"
            required
          />
        </div>

        {/* Email */}
        <div>
          <Label htmlFor="email" className="text-zinc-700">Email *</Label>
          <Input
            id="email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="your@email.com"
            className="mt-1 bg-white border-zinc-300"
            required
          />
        </div>

        {/* Phone */}
        <div>
          <Label htmlFor="phone" className="text-zinc-700">Phone Number *</Label>
          <Input
            id="phone"
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            placeholder="+971 XX XXX XXXX"
            className="mt-1 bg-white border-zinc-300"
            required
          />
        </div>

        {/* Bedrooms (Optional) */}
        <div>
          <Label htmlFor="bedrooms" className="text-zinc-700">Number of Bedrooms</Label>
          <Select
            value={formData.bedrooms}
            onValueChange={(value) => setFormData({ ...formData, bedrooms: value })}
          >
            <SelectTrigger className="mt-1 bg-white border-zinc-300">
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
          <Label htmlFor="size" className="text-zinc-700">Preferred Size (sqft)</Label>
          <Input
            id="size"
            type="number"
            value={formData.size}
            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
            placeholder="e.g., 1500"
            className="mt-1 bg-white border-zinc-300"
          />
        </div>

        {/* Location (Optional) */}
        <div>
          <Label htmlFor="location" className="text-zinc-700">Preferred Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="e.g., Downtown Dubai"
            className="mt-1 bg-white border-zinc-300"
          />
        </div>

        {/* Preferred Developer (Optional) */}
        <div>
          <Label htmlFor="developer" className="text-zinc-700">Preferred Developer</Label>
          <Input
            id="developer"
            value={formData.preferredDeveloper}
            onChange={(e) => setFormData({ ...formData, preferredDeveloper: e.target.value })}
            placeholder="e.g., Emaar, Damac"
            className="mt-1 bg-white border-zinc-300"
          />
        </div>

        {/* Message (Optional) */}
        <div>
          <Label htmlFor="message" className="text-zinc-700">Additional Notes</Label>
          <Textarea
            id="message"
            value={formData.message}
            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
            placeholder="Any specific requirements or questions..."
            className="mt-1 bg-white border-zinc-300"
            rows={3}
          />
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-3"
        >
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

      {/* Alternative Contact Methods */}
      <div className="mt-6 pt-6 border-t border-zinc-200">
        <p className="text-center text-zinc-500 text-sm mb-4">Or contact us directly</p>
        <div className="grid grid-cols-2 gap-3">
          <a
            href={getWhatsAppUrl(whatsappMessage)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium transition-colors"
          >
            <MessageCircle className="w-5 h-5" />
            Chat on WhatsApp
          </a>
          <a
            href={getCallUrl()}
            className="flex items-center justify-center gap-2 py-3 px-4 rounded-lg bg-black hover:bg-zinc-800 text-white font-medium transition-colors"
          >
            <Phone className="w-5 h-5" />
            Request Callback
          </a>
        </div>
      </div>
    </div>
  );
}

export default ProjectInquiryForm;
