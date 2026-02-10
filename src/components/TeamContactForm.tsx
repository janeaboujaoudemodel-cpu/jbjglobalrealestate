import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { TeamMember } from '@/config/team-members';

interface TeamContactFormProps {
  member: TeamMember | null;
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  'English', 'Arabic', 'French', 'Spanish', 'Chinese', 
  'Russian', 'German', 'Italian', 'Portuguese', 'Hindi',
  'Japanese', 'Korean', 'Turkish', 'Persian', 'Urdu'
];

const NATIONALITIES = [
  'United Arab Emirates', 'Saudi Arabia', 'United Kingdom', 'United States',
  'India', 'Pakistan', 'China', 'Russia', 'France', 'Germany',
  'Italy', 'Spain', 'Canada', 'Australia', 'Lebanon', 'Egypt',
  'Jordan', 'Kuwait', 'Qatar', 'Bahrain', 'Oman', 'Other'
];

const SERVICES = [
  { value: 'buy', label: 'Buy Property' },
  { value: 'sell', label: 'Sell Property' },
  { value: 'rent', label: 'Rent Property' },
  { value: 'investment', label: 'Investment Advisory' },
  { value: 'mortgage', label: 'Mortgage Support' },
  { value: 'legal', label: 'Legal / Law Firm Support' },
  { value: 'valuation', label: 'Property Valuation' },
  { value: 'management', label: 'Property Management' },
  { value: 'consultation', label: 'General Consultation' },
];

const TeamContactForm = ({ member, isOpen, onClose }: TeamContactFormProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    preferredLanguage: '',
    nationality: '',
    currentLocation: '',
    service: '',
    inquiry: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.service) {
      toast.error('Please fill in required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: result, error } = await supabase.functions.invoke('capture-lead', {
        body: {
          email: formData.email,
          fullName: formData.name,
          phone: formData.phone || undefined,
          source: 'team_contact_form',
          subSource: member?.name || 'Team Page',
          pageSource: typeof window !== 'undefined' ? window.location.pathname : null,
          contactType: 'client',
          nationality: formData.nationality || undefined,
          language: formData.preferredLanguage || undefined,
          currentLocation: formData.currentLocation || undefined,
        },
      });

      if (error || (result as any)?.error) {
        throw new Error('Failed to submit inquiry');
      }

      toast.success("Thank you. Your inquiry has been sent to JBJ Global Real Estate.");
      setFormData({
        name: '',
        email: '',
        phone: '',
        preferredLanguage: '',
        nationality: '',
        currentLocation: '',
        service: '',
        inquiry: '',
      });
      onClose();
    } catch (err) {
      console.error('Team contact form error:', err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold text-black max-h-[90vh] overflow-y-auto shadow-[0_8px_40px_rgba(200,167,102,0.4),0_4px_20px_rgba(0,0,0,0.2)]">
        <DialogHeader className="pb-4 border-b border-gold/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] border border-gold/40 flex items-center justify-center shadow-md">
              <MessageSquare className="w-5 h-5 text-gold" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-black">
                Contact Us
              </DialogTitle>
              <DialogDescription className="text-zinc-600">
                Fill in your details and our team will get back to you shortly.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-black font-medium">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black placeholder:text-zinc-500 focus:border-gold focus:ring-gold/30"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black font-medium">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black placeholder:text-zinc-500 focus:border-gold focus:ring-gold/30"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-black font-medium">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 50 XXX XXXX"
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black placeholder:text-zinc-500 focus:border-gold focus:ring-gold/30"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-black font-medium">Preferred Language</Label>
              <Select value={formData.preferredLanguage} onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLanguage: v }))}>
                <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-black font-medium">Nationality</Label>
              <Select value={formData.nationality} onValueChange={(v) => setFormData(prev => ({ ...prev, nationality: v }))}>
                <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {NATIONALITIES.map(nat => (
                    <SelectItem key={nat} value={nat}>
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-black font-medium">Current Location</Label>
              <Input
                value={formData.currentLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                placeholder="City, Country"
                className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black placeholder:text-zinc-500 focus:border-gold focus:ring-gold/30"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-black font-medium">Service Interested In *</Label>
            <Select value={formData.service} onValueChange={(v) => setFormData(prev => ({ ...prev, service: v }))}>
              <SelectTrigger className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent>
                {SERVICES.map(svc => (
                  <SelectItem key={svc.value} value={svc.value}>
                    {svc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-black font-medium">Your Inquiry / Message</Label>
            <Textarea
              value={formData.inquiry}
              onChange={(e) => setFormData(prev => ({ ...prev, inquiry: e.target.value }))}
              placeholder="Tell us about your requirements, budget, preferred areas, or any questions..."
              className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-gold/30 text-black placeholder:text-zinc-500 min-h-[100px] resize-none focus:border-gold focus:ring-gold/30"
            />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gold/20">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              className="flex-1"
            >
              Cancel
            </Button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="relative flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 text-sm font-bold rounded-xl transition-all duration-300 group overflow-hidden disabled:opacity-50 hover:scale-[1.02] transform active:scale-95"
              style={{
                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                border: '2px solid rgba(200,167,102,0.6)',
                boxShadow: `
                  0 8px 20px rgba(200,167,102,0.35),
                  0 4px 10px rgba(0,0,0,0.15),
                  inset 0 2px 4px rgba(255,255,255,0.9),
                  inset 0 -2px 4px rgba(200,167,102,0.2)
                `,
              }}
            >
              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
              <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
              <span className="relative flex items-center justify-center gap-2">
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin text-gold" />
                    <span className="text-black">Sending</span>
                    <span className="text-gold">...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 text-gold group-hover:text-black transition-colors" />
                    <span className="text-black group-hover:text-gold transition-colors">Send</span>
                    <span className="text-gold group-hover:text-black transition-colors">Inquiry</span>
                  </>
                )}
              </span>
            </button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamContactForm;