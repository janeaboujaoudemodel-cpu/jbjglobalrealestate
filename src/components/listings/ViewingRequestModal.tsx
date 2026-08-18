/**
 * Viewing Request Modal - Master Blueprint Compliant
 * Form for booking property viewings
 * Event: viewing_form_submit
 */

import { useState } from 'react';
import { Calendar, Clock, Loader2, CheckCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { trackingEvents } from '@/types/blueprint';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { HoneypotField, useHoneypot } from '@/components/forms/HoneypotField';

interface ViewingRequestModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingName: string;
  listingLocation?: string;
}

export const ViewingRequestModal = ({
  isOpen,
  onClose,
  listingId,
  listingName,
  listingLocation,
}: ViewingRequestModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    preferredDate: '',
    preferredTime: '',
    message: '',
    privacyAccepted: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { honeypot, setHoneypot } = useHoneypot();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Please provide your name and phone number');
      return;
    }
    if (!formData.email) {
      toast.error('Please provide your email address');
      return;
    }
    if (!formData.privacyAccepted) {
      toast.error('Please accept the privacy policy');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('capture-lead', {
        body: {
          honeypot,
          email: formData.email.trim(),
          fullName: formData.name.trim(),
          phone: formData.phone.trim(),
          source: 'viewing_request',
          pageSource: typeof window !== 'undefined' ? window.location.pathname : null,
          subSource: listingName,
          message: formData.message?.trim() || null,
          context: {
            requestType: 'Property viewing',
            listingId,
            listingName,
            listingLocation: listingLocation || null,
            preferredDate: formData.preferredDate || null,
            preferredTime: formData.preferredTime || null,
            notes: formData.message?.trim() || null,
            privacyAccepted: true,
          },
        },
      });

      if (error) throw error;
      if ((data as { error?: string } | null)?.error) throw new Error((data as { error: string }).error);

      console.log(`[Tracking] ${trackingEvents.viewing_form_submit}`, { listingId, listingName });
      setIsSuccess(true);
      toast.success("Viewing request submitted! We'll confirm your appointment shortly.");
    } catch (error) {
      console.error('Viewing request error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData({ name: '', phone: '', email: '', preferredDate: '', preferredTime: '', message: '', privacyAccepted: false });
    setIsSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg font-semibold text-[#1A1A1A]">
            Book a Viewing
          </DialogTitle>
          <DialogDescription className="text-sm text-[#1A1A1A]/70 truncate max-w-[280px]">
            {listingName}
          </DialogDescription>
        </DialogHeader>

        {isSuccess ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-[#EFE6D6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle className="w-8 h-8 text-[#1A1A1A]" />
            </div>
            <h4 className="text-xl font-semibold text-[#1A1A1A] mb-2">Request Submitted!</h4>
            <p className="text-[#1A1A1A]/70 mb-6">
              Our team will confirm your viewing appointment within 24 hours.
            </p>
            <Button onClick={handleClose} variant="primary">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <HoneypotField value={honeypot} onChange={setHoneypot} name="viewing_company_website" />
            <Input placeholder="Full Name *" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="h-12 bg-[#FDFBF7] border-[#B89555]/30" required />
            <Input type="tel" placeholder="Phone Number *" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} className="h-12 bg-[#FDFBF7] border-[#B89555]/30" required />
            <Input type="email" placeholder="Email Address *" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} className="h-12 bg-[#FDFBF7] border-[#B89555]/30" required />

            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
                <Input type="date" value={formData.preferredDate} onChange={(e) => setFormData({ ...formData, preferredDate: e.target.value })} className="h-12 bg-[#FDFBF7] border-[#B89555]/30 pl-10" min={new Date().toISOString().split('T')[0]} />
              </div>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1A1A1A]/70" />
                <Input placeholder="Time (e.g. 2pm)" value={formData.preferredTime} onChange={(e) => setFormData({ ...formData, preferredTime: e.target.value })} className="h-12 bg-[#FDFBF7] border-[#B89555]/30 pl-10" />
              </div>
            </div>

            <textarea
              placeholder="Any special requests or questions?"
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#FDFBF7] border border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70 rounded-lg resize-none focus:outline-none focus:border-[#B89555]"
            />

            <div className="flex items-start gap-3">
              <Checkbox id="viewing-privacy" checked={formData.privacyAccepted} onCheckedChange={(checked) => setFormData({ ...formData, privacyAccepted: !!checked })} className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5" />
              <label htmlFor="viewing-privacy" className="text-[#1A1A1A] text-sm">
                I agree to the <a href="/privacy" className="text-[#1A1A1A] underline">Privacy Policy</a>
              </label>
            </div>

            <Button type="submit" disabled={isSubmitting} variant="primary" className="w-full h-12 text-base font-semibold">
              {isSubmitting ? (
                <span className="flex items-center gap-2"><Loader2 className="w-5 h-5 animate-spin" />Submitting...</span>
              ) : (
                <span className="flex items-center gap-2"><Calendar className="w-5 h-5" />Request Viewing</span>
              )}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default ViewingRequestModal;
