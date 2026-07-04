import { useState } from 'react';
import { Search, Send, CheckCircle, Loader2, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionSuccessModal from '@/components/marketing/SubscriptionSuccessModal';
import NewsletterDetailModal from '@/components/marketing/NewsletterDetailModal';
import { useTypewriter } from '@/hooks/useTypewriter';

const NEWSLETTER_TYPEWRITER_PHRASES = [
  'Enter your email for early listings',
  'Get new launches before the market',
  'Receive off-market listing alerts',
  'Market moves & insider property intel',
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
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  // Pause typewriter when the user focuses the field or has typed something.
  const animatedPlaceholder = useTypewriter(NEWSLETTER_TYPEWRITER_PHRASES, {
    paused: isEmailFocused || email.length > 0,
  });

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

      const { error } = await subscribePromise;

      if (error) throw error;

      // SECURITY: the API no longer tells us whether the email already
      // existed. Decide locally whether we still need to collect name/phone.
      const needsDetails = !name || name.trim().length === 0;
      if (needsDetails) {
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
        <form onSubmit={handleSubmit} className={className}>
          {/* ONE unified emerald pill — input + button share the SAME surface,
              wrapped by a single 1px emerald hairline (no triple borders,
              no halo, no overflowing placeholder). */}
          <div className="jj-emerald-glow-wrap jj-emerald-pill jj-hero-search-premium jj-newsletter-emerald relative rounded-[28px]">
          <div
            data-no-contrast-guard
            data-surface="dark"
            data-ink-emerald
            className="allow-white jj-hero-search-bar relative flex items-stretch h-16 sm:h-[68px] rounded-[28px] overflow-hidden pl-1 pr-1.5 sm:pr-2 gap-1.5 sm:gap-2"
            style={{ backgroundImage: 'var(--jj-emerald-ombre)' }}
          >
            <div role="search" className="relative flex flex-1 items-center pl-5 sm:pl-6 pr-3 min-w-0 cursor-text">
              <Search
                aria-hidden="true"
                className="hidden sm:block absolute left-5 top-1/2 -translate-y-1/2 w-[18px] h-[18px] opacity-80 pointer-events-none"
                style={{ color: '#FFFFFF' }}
                strokeWidth={2.2}
              />
              {!email && !isEmailFocused && (
                <span
                  className="allow-white pointer-events-none absolute left-5 sm:left-[52px] top-1/2 -translate-y-1/2 text-[15px] sm:text-[15.5px] font-normal tracking-[-0.005em] whitespace-nowrap overflow-hidden z-[1]"
                  aria-hidden="true"
                  style={{ color: 'rgba(255,255,255,0.78)', WebkitTextFillColor: 'rgba(255,255,255,0.78)', maxWidth: 'calc(100% - 16px)' }}
                >
                  {animatedPlaceholder}
                  <span className="jj-type-caret" aria-hidden="true">|</span>
                </span>
              )}
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setIsEmailFocused(true)}
                onBlur={() => setIsEmailFocused(false)}
                aria-label="Email address"
                required
                disabled={isSubmitting}
                className="allow-white jj-hero-search-input relative z-10 flex-1 min-w-0 h-full bg-transparent text-[15px] sm:text-[15.5px] tracking-[-0.005em] font-normal cursor-text sm:pl-[34px]"
                style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF', caretColor: '#FFFFFF', pointerEvents: 'auto', border: 'none', outline: 'none', boxShadow: 'none', background: 'transparent' }}
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              aria-label="Get listing alerts"
              data-variant="primary"
              className="allow-white jj-hero-search-action relative self-center flex items-center justify-center gap-2 h-[44px] py-0 leading-none rounded-full px-5 sm:px-6 text-[13.5px] sm:text-sm font-semibold tracking-[-0.005em] flex-shrink-0 disabled:cursor-wait transition-all duration-200 hover:brightness-[1.06] active:scale-[0.98]"
              style={{
                color: '#FFFFFF',
                WebkitTextFillColor: '#FFFFFF',
                border: 0,
                backgroundImage: 'linear-gradient(135deg, #064E3B 0%, #042C1C 58%, #000000 100%)',
                boxShadow: '0 10px 24px -14px rgba(6,78,59,0.92), inset 0 1px 0 rgba(255,255,255,0.14)',
              }}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" style={{ color: '#FFFFFF' }} />
              ) : (
                <Bell className="w-4 h-4" style={{ color: '#FFFFFF' }} />
              )}
              <span className="hidden sm:inline" style={{ color: '#FFFFFF', WebkitTextFillColor: '#FFFFFF' }}>
                {isSubmitting ? 'Joining…' : 'Get Alerts'}
              </span>
            </button>
          </div>
          </div>
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
            <div className="animated-border flex-1 rounded-lg">
              <Input
                type="text"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="bg-[#FDFBF7]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]/50 focus:ring-gold/20 h-12"
                disabled={isSubmitting}
              />
            </div>
            <div className="animated-border flex-1 rounded-lg">
              <Input
                type="email"
                placeholder="Your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-[#FDFBF7]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]/50 focus:ring-gold/20 h-12"
                required
                disabled={isSubmitting}
              />
            </div>
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
        <div className="animated-border rounded-lg">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="bg-[#FDFBF7]/50 border-[#1A1A1A] text-white placeholder:text-[#1A1A1A]/70 focus:border-[#B89555]/50 focus:ring-gold/20"
            required
            disabled={isSubmitting}
          />
        </div>
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
