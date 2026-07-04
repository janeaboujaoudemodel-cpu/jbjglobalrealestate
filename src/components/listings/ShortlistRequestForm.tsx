/**
 * Shortlist Request Form - Master Blueprint Compliant
 * Captures: name, phone, budget, bedrooms, preferredAreas, timeline
 * Event: buy_shortlist_submit / rent_shortlist_submit
 */

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Send, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { trackingEvents, type LeadTimeline } from '@/types/blueprint';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ShortlistRequestFormProps {
  transactionType: 'buy' | 'rent';
  prefilledBudget?: string;
  prefilledBedrooms?: string;
  prefilledAreas?: string;
  className?: string;
}

const TIMELINE_OPTIONS = [
  { value: 'immediate', label: 'Immediately' },
  { value: '1_3_months', label: '1-3 Months' },
  { value: '3_6_months', label: '3-6 Months' },
  { value: '6_plus', label: '6+ Months' },
];

export const ShortlistRequestForm = ({
  transactionType,
  prefilledBudget = '',
  prefilledBedrooms = '',
  prefilledAreas = '',
  className = '',
}: ShortlistRequestFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    budget: prefilledBudget,
    bedrooms: prefilledBedrooms,
    preferredAreas: prefilledAreas,
    timeline: '' as LeadTimeline | '',
    privacyAccepted: false,
    marketingOptIn: false,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.phone) {
      toast.error('Please provide your name and phone number');
      return;
    }

    if (!formData.privacyAccepted) {
      toast.error('Please accept the privacy policy to continue');
      return;
    }

    setIsSubmitting(true);

    try {
      // Capture UTM parameters
      const urlParams = new URLSearchParams(window.location.search);
      const source = {
        utmSource: urlParams.get('utm_source'),
        utmMedium: urlParams.get('utm_medium'),
        utmCampaign: urlParams.get('utm_campaign'),
        referrer: document.referrer || null,
      };

      const leadEmail = `phone-${formData.phone.replace(/\D/g, '').slice(-14) || Date.now()}@lead.jbj.local`;
      const { error } = await supabase.functions.invoke('capture-lead', {
        body: {
          email: leadEmail,
          fullName: formData.name,
          phone: formData.phone,
          source: transactionType === 'buy' ? 'buy_shortlist' : 'rent_shortlist',
          pageSource: window.location.pathname,
          contactType: 'client',
          message: `${transactionType === 'buy' ? 'Buy' : 'Rent'} shortlist request`,
          context: {
            budget: formData.budget || null,
            bedrooms: formData.bedrooms || null,
            preferredAreas: formData.preferredAreas || null,
            timeline: formData.timeline || null,
            marketingOptIn: formData.marketingOptIn,
          },
        },
      });

      if (error) throw error;

      // Track event per Blueprint
      const eventName = transactionType === 'buy' 
        ? trackingEvents.buy_shortlist_submit 
        : trackingEvents.rent_shortlist_submit;
      
      console.log(`[Tracking] ${eventName}`, { 
        budget: formData.budget,
        bedrooms: formData.bedrooms,
        areas: formData.preferredAreas,
        timeline: formData.timeline,
      });

      setIsSuccess(true);
      toast.success('Request submitted! Our team will curate a personalized shortlist for you.');
    } catch (error) {
      console.error('Shortlist form error:', error);
      toast.error('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-2xl p-8 text-center ${className}`}
      >
        <div className="w-16 h-16 bg-[#EFE6D6]/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[#1A1A1A]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          Request Received!
        </h3>
        <p className="text-[#1A1A1A]/70">
          Our team will curate a personalized shortlist and reach out within 24 hours.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className={`bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555] rounded-2xl p-6 md:p-8 shadow-[0_8px_30px_rgba(200,167,102,0.35),0_4px_15px_rgba(0,0,0,0.15)] ${className}`}
    >
      {/* Header */}
      <div className="text-center mb-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EFE6D6]/10 border border-[#B89555]/30 rounded-full text-xs uppercase tracking-wider text-[#1A1A1A] mb-3">
          <Sparkles className="w-3 h-3" />
          {transactionType === 'buy' ? 'Property Shortlist' : 'Rental Shortlist'}
        </div>
        <h3 className="text-xl md:text-2xl font-semibold text-[#1A1A1A]">
          Get a <span className="text-[#1A1A1A]">Curated Shortlist</span>
        </h3>
        <p className="text-[#1A1A1A]/70 text-sm mt-2">
          Tell us what you're looking for and we'll send you matching properties.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          placeholder="Full Name *"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="h-12 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70"
          required
        />
        
        <Input
          type="tel"
          placeholder="Phone Number *"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="h-12 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70"
          required
        />

        <div className="grid grid-cols-2 gap-3">
          <Input
            placeholder={transactionType === 'buy' ? 'Budget (AED)' : 'Max Rent (AED)'}
            value={formData.budget}
            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
            className="h-12 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70"
          />
          <Input
            placeholder="Bedrooms (e.g. 2-3)"
            value={formData.bedrooms}
            onChange={(e) => setFormData({ ...formData, bedrooms: e.target.value })}
            className="h-12 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70"
          />
        </div>

        <Input
          placeholder="Preferred Areas (e.g. Downtown, Marina)"
          value={formData.preferredAreas}
          onChange={(e) => setFormData({ ...formData, preferredAreas: e.target.value })}
          className="h-12 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/70"
        />

        <Select
          value={formData.timeline}
          onValueChange={(value) => setFormData({ ...formData, timeline: value as LeadTimeline })}
        >
          <SelectTrigger className="h-12 bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]/70">
            <SelectValue placeholder={transactionType === 'buy' ? 'When do you want to buy?' : 'When do you need to move?'} />
          </SelectTrigger>
          <SelectContent className="bg-[#FDFBF7] border-[#B89555]/30">
            {TIMELINE_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value} className="text-[#1A1A1A] hover:bg-[#EFE6D6]/10">
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Consents */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-3">
            <Checkbox
              id="privacy"
              checked={formData.privacyAccepted}
              onCheckedChange={(checked) => setFormData({ ...formData, privacyAccepted: !!checked })}
              className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
            />
            <label htmlFor="privacy" className="text-[#1A1A1A] text-sm leading-tight">
              I agree to the <a href="/privacy" className="text-[#1A1A1A] underline">Privacy Policy</a> *
            </label>
          </div>
          <div className="flex items-start gap-3">
            <Checkbox
              id="marketing"
              checked={formData.marketingOptIn}
              onCheckedChange={(checked) => setFormData({ ...formData, marketingOptIn: !!checked })}
              className="border-[#B89555]/30 data-[state=checked]:bg-[#EFE6D6] data-[state=checked]:border-[#B89555] mt-0.5"
            />
            <label htmlFor="marketing" className="text-[#1A1A1A] text-sm leading-tight">
              Send me property updates and market insights
            </label>
          </div>
        </div>

        {/* Submit */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full h-14 text-base font-bold relative overflow-hidden group"
          style={{
            background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F7F2EA 50%, #E8DFD0 75%, #B89555 100%)',
            border: '2px solid rgba(200,167,102,0.6)',
            boxShadow: '0 10px 30px rgba(200,167,102,0.4), 0 6px 15px rgba(0,0,0,0.2)',
          }}
        >
          {isSubmitting ? (
            <span className="flex items-center gap-2 text-[#1A1A1A]">
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Request</span>
              <span className="text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors">Shortlist</span>
              <Send className="w-4 h-4 text-[#1A1A1A] group-hover:text-[#1A1A1A] transition-colors" />
            </span>
          )}
        </Button>
      </form>
    </motion.div>
  );
};

export default ShortlistRequestForm;
