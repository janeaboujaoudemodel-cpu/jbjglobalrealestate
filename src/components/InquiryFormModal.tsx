import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Loader2, Send, CheckCircle, Crown, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useLeadCapture } from '@/hooks/useLeadCapture';
import { getCountryList, getLanguageList } from '@/constants/localeOptions';
import { useLanguage } from '@/contexts/LanguageContext';

const inquirySchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address'),
  phone: z.string().min(5, 'Phone number is required').max(30),
  nationality: z.string().min(1, 'Please select your nationality'),
  language: z.string().min(1, 'Please select your preferred language'),
  message: z.string().max(1000).optional(),
});

type InquiryFormData = z.infer<typeof inquirySchema>;

interface InquiryFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  source?: string;
  propertyName?: string;
  context?: Record<string, string>;
}

const InquiryFormModal = ({ isOpen, onClose, source = 'general', propertyName, context }: InquiryFormModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { captureLead, leadData } = useLeadCapture();
  const { t, isRTL } = useLanguage();
  
  const countries = getCountryList();
  const languages = getLanguageList();

  const form = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      fullName: leadData?.fullName || '',
      email: leadData?.email || '',
      phone: leadData?.phone || '',
      nationality: leadData?.nationality || '',
      language: leadData?.language || '',
      message: '',
    },
  });

  const onSubmit = async (data: InquiryFormData) => {
    setIsSubmitting(true);
    try {
      // Capture lead locally
      await captureLead({
        email: data.email,
        fullName: data.fullName,
        phone: data.phone,
        nationality: data.nationality,
        language: data.language,
      }, source);

      // Send email via edge function
      const { error } = await supabase.functions.invoke('send-inquiry-email', {
        body: {
          ...data,
          source,
          propertyName,
          context,
        },
      });

      if (error) throw error;

      setIsSuccess(true);
      toast.success(t('inquiry.success'));
      
      setTimeout(() => {
        setIsSuccess(false);
        onClose();
        form.reset();
      }, 2000);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      toast.error(t('inquiry.error'));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent 
        className="bg-black border border-zinc-800 text-white max-w-lg p-0 overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* Premium top gradient glow */}
        <div
          className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, hsl(40 32% 51% / 0.25) 0%, transparent 70%)',
          }}
        />

        {/* Gold accent line at top */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-gold to-transparent" />

        {isSuccess ? (
          <div className="relative px-8 py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-green-500 to-green-600 flex items-center justify-center mx-auto mb-6 shadow-2xl">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-3">{t('inquiry.success')}</h3>
            <p className="text-zinc-400">Our team will reach out to you shortly.</p>
          </div>
        ) : (
          <div className="relative px-6 pt-8 pb-6">
            <DialogHeader className="mb-6">
              {/* Premium Icon */}
              <div className="text-center mb-4">
                <div className="relative inline-flex">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold via-gold-light to-gold-dark flex items-center justify-center shadow-2xl shadow-gold/30">
                    <Crown className="w-8 h-8 text-black" />
                  </div>
                  <Sparkles className="absolute -top-1 -right-1 w-5 h-5 text-gold animate-pulse" />
                </div>
              </div>
              
              <DialogTitle 
                className="text-2xl font-bold text-center"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  background: 'linear-gradient(135deg, #ffffff 0%, hsl(40 32% 51%) 50%, #ffffff 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                }}
              >
                {propertyName ? `Inquire About ${propertyName}` : t('inquiry.title')}
              </DialogTitle>
              <p className="text-zinc-400 text-sm text-center mt-2">{t('inquiry.subtitle')}</p>
            </DialogHeader>

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-sm">{t('inquiry.fullName')}</FormLabel>
                      <FormControl>
                        <Input 
                          {...field} 
                          className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
                          placeholder="John Doe"
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-sm">{t('inquiry.email')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="email"
                            className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
                            placeholder="email@example.com"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-sm">{t('inquiry.phone')}</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="tel"
                            className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg"
                            placeholder="+971 50 000 0000"
                          />
                        </FormControl>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="nationality"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-sm">{t('inquiry.nationality')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                            {countries.map((country) => (
                              <SelectItem key={country} value={country} className="text-white hover:bg-zinc-800">
                                {country}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-zinc-400 text-sm">{t('inquiry.language')}</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="h-12 bg-zinc-900/80 border-zinc-700/50 text-white rounded-lg">
                              <SelectValue placeholder="Select" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent className="bg-zinc-900 border-zinc-700 max-h-60">
                            {languages.map((lang) => (
                              <SelectItem key={lang} value={lang} className="text-white hover:bg-zinc-800">
                                {lang}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage className="text-red-400" />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="message"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-zinc-400 text-sm">{t('inquiry.message')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          {...field} 
                          className="min-h-[80px] bg-zinc-900/80 border-zinc-700/50 text-white placeholder:text-zinc-500 focus:border-gold rounded-lg resize-none"
                          placeholder="Tell us about your requirements..."
                        />
                      </FormControl>
                      <FormMessage className="text-red-400" />
                    </FormItem>
                  )}
                />

                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-12 bg-gradient-to-r from-gold via-gold-light to-gold text-black hover:opacity-90 font-semibold text-base shadow-xl shadow-gold/20 rounded-lg mt-4"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Send className="w-5 h-5 mr-2" />
                      {t('inquiry.submit')}
                    </>
                  )}
                </Button>
              </form>
            </Form>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default InquiryFormModal;
