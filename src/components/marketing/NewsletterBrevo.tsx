import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionSuccessModal from '@/components/marketing/SubscriptionSuccessModal';
import NewsletterDetailModal from '@/components/marketing/NewsletterDetailModal';
import { useTypewriter } from '@/hooks/useTypewriter';

const NEWSLETTER_TYPEWRITER_PHRASES = [
  'Enter Your Email',
  'Get listings first',
  'Free weekly insights',
];


interface NewsletterBrevoProps {
  className?: string;
  variant?: 'default' | 'compact' | 'hero';
  listId?: number;
  source?: string;
}

export const NewsletterBrevo = ({
  className = '',
  variant = 'default',
  listId,
  source = 'website_footer',
}: NewsletterBrevoProps) => {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');
  const animatedPlaceholder = useTypewriter(NEWSLETTER_TYPEWRITER_PHRASES);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      setSubmittedEmail(normalizedEmail);

      // Fire BOTH calls in parallel for speed — don't wait for capture-lead
      const subscribePromise = supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: normalizedEmail,
          name: name || undefined,
          source,
          page_source: window.location.pathname,
          listId,
          gdpr_consent: true,
        },
      });

      // Fire capture-lead in background (non-blocking)
      supabase.functions.invoke('capture-lead', {
        body: {
          email: normalizedEmail,
          fullName: name || null,
          source: 'newsletter',
          subSource: source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
          pageSource: window.location.pathname,
          contactType: 'client',
        },
      }).catch(err => console.warn('Lead capture warning:', err));

      const { data, error } = await subscribePromise;

      if (error) throw error;

      if (data?.requiresDetails) {
        setShowDetailModal(true);
      } else {
        setIsSuccess(true);
        setShowSuccessModal(true);
        setEmail('');
        setName('');
        setTimeout(() => setIsSuccess(false), 5000);
      }
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDetailComplete = async (fullName: string, phone: string) => {
    try {
      await supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: submittedEmail,
          full_name: fullName,
          phone,
          source,
          page_source: window.location.pathname,
          gdpr_consent: true,
        },
      });
    } catch (err) {
      console.warn('Detail update warning:', err);
    }
    setShowDetailModal(false);
    setIsSuccess(true);
    setShowSuccessModal(true);
    setEmail('');
    setName('');
    setTimeout(() => setIsSuccess(false), 5000);
  };

  if (isSuccess) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">You're subscribed! Check your inbox.</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <>
        <form onSubmit={handleSubmit} className={`flex gap-2 ${className}`}>
          <div className="jj-newsletter-emerald jj-emerald-glow-wrap relative flex-1">
            <Input
              type="email"
              placeholder=" "
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              data-no-contrast-guard
              className="h-12 w-full rounded-xl border-0 px-4 pr-4 font-semibold tracking-wide focus-visible:ring-0"
              style={{
                backgroundImage: 'var(--jj-emerald-ombre)',
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.10)',
              }}
              required
              disabled={isSubmitting}
            />
            {!email && (
              <span
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold tracking-wide whitespace-nowrap"
                aria-hidden="true"
                style={{ color: 'rgba(255,255,255,0.85)', WebkitTextFillColor: 'rgba(255,255,255,0.85)' }}
              >
                {animatedPlaceholder}
                <span className="jj-type-caret" aria-hidden="true">|</span>
              </span>
            )}
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            data-no-contrast-guard
            className="jj-newsletter-emerald jj-emerald-glow-wrap relative h-12 overflow-hidden rounded-xl px-5 font-semibold transition-all duration-300 hover:brightness-110"
            style={{
              backgroundImage: 'var(--jj-emerald-ombre)',
              border: '0',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14)',
              color: '#FFFFFF',
            }}
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFFFFF' }} />
            ) : (
              <Send className="w-4 h-4" style={{ color: '#FFFFFF' }} />
            )}
          </Button>
        </form>
        <NewsletterDetailModal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setShowSuccessModal(true); setIsSuccess(true); setTimeout(() => setIsSuccess(false), 5000); }}
          onComplete={handleDetailComplete}
          email={submittedEmail}
        />
        <SubscriptionSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />
      </>
    );
  }

  if (variant === 'hero') {
    return (
      <>
        <form onSubmit={handleSubmit} className={`space-y-4 ${className}`}>
          <div className="flex flex-col sm:flex-row gap-3">
            <Input
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="flex-1 bg-[#FDFBF7]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]/50 focus:ring-gold/20 h-12"
              disabled={isSubmitting}
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-[#FDFBF7]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]/50 focus:ring-gold/20 h-12"
              required
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] font-semibold h-12 text-base"
          >
            {isSubmitting ? (
              <Loader2 className="w-5 h-5 animate-spin mr-2" />
            ) : (
              <Send className="w-5 h-5 mr-2" />
            )}
            {isSubmitting ? 'Subscribing...' : 'Join Stay in the Loop'}
          </Button>
        </form>
        <NewsletterDetailModal
          isOpen={showDetailModal}
          onClose={() => { setShowDetailModal(false); setShowSuccessModal(true); setIsSuccess(true); setTimeout(() => setIsSuccess(false), 5000); }}
          onComplete={handleDetailComplete}
          email={submittedEmail}
        />
        <SubscriptionSuccessModal
          isOpen={showSuccessModal}
          onClose={() => setShowSuccessModal(false)}
        />
      </>
    );
  }

  // Default variant
  return (
    <>
      <form onSubmit={handleSubmit} className={`space-y-3 ${className}`}>
        <Input
          type="email"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-[#FDFBF7]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]/50 focus:ring-gold/20"
          required
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-[#EFE6D6] hover:bg-[#EFE6D6]-light text-[#1A1A1A] font-semibold"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Send className="w-4 h-4 mr-2" />
          )}
          {isSubmitting ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>
      <NewsletterDetailModal
        isOpen={showDetailModal}
        onClose={() => { setShowDetailModal(false); setShowSuccessModal(true); setIsSuccess(true); setTimeout(() => setIsSuccess(false), 5000); }}
        onComplete={handleDetailComplete}
        email={submittedEmail}
      />
      <SubscriptionSuccessModal
        isOpen={showSuccessModal}
        onClose={() => setShowSuccessModal(false)}
      />
    </>
  );
};

export default NewsletterBrevo;
