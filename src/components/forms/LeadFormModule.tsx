/**
 * LeadFormModule Component - Master Blueprint Specification
 * Standardized lead capture form with validation and routing
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Send, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/contexts/LanguageContext";
import type { LeadFormType, LeadTimeline, FormFieldConfig } from "@/types/blueprint";
import { supabase } from "@/integrations/supabase/client";

interface LeadFormModuleProps {
  formType: LeadFormType;
  title?: string;
  subtitle?: string;
  fields: FormFieldConfig[];
  listingId?: string;
  listingRef?: string;
  area?: string;
  successRedirect?: string;
  onSuccess?: () => void;
  compact?: boolean;
}

const LeadFormModule = ({
  formType,
  title,
  subtitle,
  fields,
  listingId,
  listingRef,
  area,
  successRedirect,
  onSuccess,
  compact = false,
}: LeadFormModuleProps) => {
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [marketingOptIn, setMarketingOptIn] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const { toast } = useToast();
  const navigate = useNavigate();
  const { t } = useLanguage();

  // Capture UTM parameters
  const getUTMParams = () => {
    if (typeof window === 'undefined') return {};
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get('utm_source'),
      utmMedium: params.get('utm_medium'),
      utmCampaign: params.get('utm_campaign'),
      referrer: document.referrer || null,
    };
  };

  const validateField = (field: FormFieldConfig, value: string): string | null => {
    if (field.required && !value?.trim()) {
      return `${field.label} is required`;
    }
    if (field.type === 'email' && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        return 'Please enter a valid email address';
      }
    }
    if (field.type === 'tel' && value) {
      // Accept UAE numbers and international formats
      const phoneRegex = /^[\+]?[0-9\s\-\(\)]{8,}$/;
      if (!phoneRegex.test(value.replace(/\s/g, ''))) {
        return 'Please enter a valid phone number';
      }
    }
    if (field.validation?.pattern && value) {
      if (!field.validation.pattern.test(value)) {
        return field.validation.message || 'Invalid format';
      }
    }
    return null;
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};
    
    fields.forEach((field) => {
      const error = validateField(field, formData[field.name] || '');
      if (error) {
        newErrors[field.name] = error;
      }
    });

    if (!privacyAccepted) {
      newErrors.privacy = 'You must accept the Privacy Policy';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: t('form.validationError', 'Please check the form'),
        description: t('form.fixErrors', 'Please fix the highlighted errors'),
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const utmParams = getUTMParams();
      
      // Prepare lead data matching the Lead schema
      const leadData = {
        form_type: formType,
        name: formData.name || '',
        phone: formData.phone || '',
        email: formData.email || null,
        preferred_contact: 'whatsapp' as const,
        message: formData.message || null,
        listing_id: listingId || null,
        area: area || formData.area || null,
        budget: formData.budget || formData.budgetRange || null,
        bedrooms: formData.bedrooms || null,
        timeline: (formData.timeline as LeadTimeline) || 'immediate',
        privacy_accepted: privacyAccepted,
        marketing_opt_in: marketingOptIn,
        utm_source: utmParams.utmSource,
        utm_medium: utmParams.utmMedium,
        utm_campaign: utmParams.utmCampaign,
        referrer: utmParams.referrer,
        metadata: {
          ...formData,
          listingRef,
        },
      };

      // Insert into leads table
      const { error } = await supabase
        .from('crm_leads')
        .insert([{
          full_name: leadData.name,
          phone: leadData.phone,
          email: leadData.email,
          message: leadData.message,
          source: `website_${formType}`,
          status: 'new',
          budget: leadData.budget,
          bedrooms: leadData.bedrooms ? parseInt(leadData.bedrooms) : null,
          timeline: leadData.timeline,
          privacy_consent: leadData.privacy_accepted,
          marketing_consent: leadData.marketing_opt_in,
          utm_source: leadData.utm_source,
          utm_medium: leadData.utm_medium,
          utm_campaign: leadData.utm_campaign,
        }] as any);

      if (error) throw error;

      // Track event
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', `${formType}_submit`, {
          form_type: formType,
          listing_id: listingId,
        });
      }

      setIsSuccess(true);
      toast({
        title: t('form.success', 'Thank you!'),
        description: t('form.successMessage', 'We\'ll be in touch shortly.'),
      });

      // Redirect or callback
      if (successRedirect) {
        setTimeout(() => {
          navigate(`${successRedirect}?type=${formType}${listingId ? `&listing=${listingId}` : ''}`);
        }, 1500);
      } else if (onSuccess) {
        setTimeout(onSuccess, 1500);
      }

    } catch (error) {
      console.error('Form submission error:', error);
      toast({
        title: t('form.error', 'Something went wrong'),
        description: t('form.tryAgain', 'Please try again or contact us directly.'),
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error on change
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (isSuccess) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center py-8"
      >
        <div className="w-16 h-16 rounded-full jj-emerald-soft flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-[color:var(--emerald-1)]" />
        </div>
        <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
          {t('form.thankYou', 'Thank You!')}
        </h3>
        <p className="text-[#1A1A1A]/70 text-sm">
          {t('form.weWillContact', 'We\'ll be in touch with you shortly.')}
        </p>
      </motion.div>
    );
  }

  return (
    <div className={compact ? '' : 'bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] rounded-xl border-2 border-[#B89555]/30 p-6 md:p-8'}>
      {title && (
        <div className="text-center mb-6">
          <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">
            {title}
          </h3>
          {subtitle && (
            <p className="text-[#1A1A1A]/70 text-sm">{subtitle}</p>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map((field) => (
          <div key={field.name}>
            <Label htmlFor={field.name} className="text-[#1A1A1A] text-sm font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </Label>
            
            {field.type === 'select' && field.options ? (
              <Select
                value={formData[field.name] || ''}
                onValueChange={(value) => handleInputChange(field.name, value)}
              >
                <SelectTrigger className="mt-1.5 bg-[#FDFBF7] border-[#B89555]/30 focus:border-[#B89555]">
                  <SelectValue placeholder={field.placeholder || `Select ${field.label}`} />
                </SelectTrigger>
                <SelectContent>
                  {field.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : field.type === 'textarea' ? (
              <Textarea
                id={field.name}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="mt-1.5 bg-[#FDFBF7] border-[#B89555]/30 focus:border-[#B89555] min-h-[100px]"
              />
            ) : (
              <Input
                id={field.name}
                type={field.type}
                value={formData[field.name] || ''}
                onChange={(e) => handleInputChange(field.name, e.target.value)}
                placeholder={field.placeholder}
                className="mt-1.5 bg-[#FDFBF7] border-[#B89555]/30 focus:border-[#B89555]"
              />
            )}
            
            {errors[field.name] && (
              <p className="text-red-500 text-xs mt-1">{errors[field.name]}</p>
            )}
          </div>
        ))}

        {/* Consents */}
        <div className="space-y-3 pt-2">
          <div className="flex items-start gap-2">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
              className="mt-0.5"
            />
            <label htmlFor="privacy" className="text-xs text-[#1A1A1A]/70 leading-tight cursor-pointer">
              {t('form.privacyConsent', 'I agree to the')}{' '}
              <a href="/privacy" target="_blank" className="text-[#1A1A1A] hover:underline">
                {t('form.privacyPolicy', 'Privacy Policy')}
              </a>
              <span className="text-red-500 ml-1">*</span>
            </label>
          </div>
          {errors.privacy && (
            <p className="text-red-500 text-xs">{errors.privacy}</p>
          )}

          <div className="flex items-start gap-2">
            <Checkbox
              id="marketing"
              checked={marketingOptIn}
              onCheckedChange={(checked) => setMarketingOptIn(checked as boolean)}
              className="mt-0.5"
            />
            <label htmlFor="marketing" className="text-xs text-[#1A1A1A]/70 leading-tight cursor-pointer">
              {t('form.marketingConsent', 'I\'d like to receive market updates and property alerts')}
            </label>
          </div>
        </div>

        {/* Submit Button */}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]-dark text-[#1A1A1A] font-medium py-3 rounded-lg transition-all duration-300"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t('form.submitting', 'Submitting...')}
            </>
          ) : (
            <>
              <Send className="w-4 h-4 mr-2" />
              {t('form.submit', 'Submit')}
            </>
          )}
        </Button>
      </form>
    </div>
  );
};

export default LeadFormModule;
