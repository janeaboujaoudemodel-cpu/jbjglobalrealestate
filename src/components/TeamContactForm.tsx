import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2 } from 'lucide-react';
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
  { value: 'rent', label: 'Rent / Lease Property' },
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast.success(`Your inquiry has been sent to ${member?.name}. We'll get back to you soon!`);
    setIsSubmitting(false);
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-lg bg-zinc-900 border-zinc-800 text-white max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-white flex items-center gap-3">
            {member?.avatar && (
              <img 
                src={member.avatar} 
                alt={member.name} 
                className="w-12 h-12 rounded-full object-cover border-2 border-gold"
              />
            )}
            <div>
              <span>Contact {member?.name}</span>
              <p className="text-sm font-normal text-gold mt-0.5">{member?.role}</p>
            </div>
          </DialogTitle>
          <DialogDescription className="text-zinc-400">
            Fill in your details and we'll connect you with {member?.name?.split(' ')[0]} shortly.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Full Name *</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Your full name"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Email *</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="your@email.com"
                className="bg-zinc-800 border-zinc-700 text-white"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Phone Number</Label>
              <Input
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 50 XXX XXXX"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Preferred Language</Label>
              <Select value={formData.preferredLanguage} onValueChange={(v) => setFormData(prev => ({ ...prev, preferredLanguage: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700">
                  {LANGUAGES.map(lang => (
                    <SelectItem key={lang} value={lang} className="text-white hover:bg-zinc-700">
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-zinc-300">Nationality</Label>
              <Select value={formData.nationality} onValueChange={(v) => setFormData(prev => ({ ...prev, nationality: v }))}>
                <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                  <SelectValue placeholder="Select nationality" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-zinc-700 max-h-60">
                  {NATIONALITIES.map(nat => (
                    <SelectItem key={nat} value={nat} className="text-white hover:bg-zinc-700">
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-zinc-300">Current Location</Label>
              <Input
                value={formData.currentLocation}
                onChange={(e) => setFormData(prev => ({ ...prev, currentLocation: e.target.value }))}
                placeholder="City, Country"
                className="bg-zinc-800 border-zinc-700 text-white"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Service Interested In *</Label>
            <Select value={formData.service} onValueChange={(v) => setFormData(prev => ({ ...prev, service: v }))}>
              <SelectTrigger className="bg-zinc-800 border-zinc-700 text-white">
                <SelectValue placeholder="Select a service" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-800 border-zinc-700">
                {SERVICES.map(svc => (
                  <SelectItem key={svc.value} value={svc.value} className="text-white hover:bg-zinc-700">
                    {svc.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-zinc-300">Your Inquiry / Message</Label>
            <Textarea
              value={formData.inquiry}
              onChange={(e) => setFormData(prev => ({ ...prev, inquiry: e.target.value }))}
              placeholder="Tell us about your requirements, budget, preferred areas, or any questions..."
              className="bg-zinc-800 border-zinc-700 text-white min-h-[100px] resize-none"
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-zinc-700 text-zinc-300 hover:bg-zinc-800"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 bg-gold hover:bg-gold-dark text-black font-semibold"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Send Inquiry
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TeamContactForm;
