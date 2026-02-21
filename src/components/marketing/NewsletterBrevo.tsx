import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionSuccessModal from '@/components/marketing/SubscriptionSuccessModal';
import NewsletterDetailModal from '@/components/marketing/NewsletterDetailModal';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      setSubmittedEmail(normalizedEmail);

      // Call the smart newsletter-subscribe endpoint
      const { data, error } = await supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: normalizedEmail,
          name: name || undefined,
          source,
          page_source: window.location.pathname,
          listId,
          gdpr_consent: true,
        },
      });

      if (error) throw error;

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

      if (data?.requiresDetails) {
        // Unknown user — show detail collection modal
        setShowDetailModal(true);
      } else {
        // Known user — show success immediately
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
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="flex-1 bg-card border-2 border-gold/50 text-foreground placeholder:text-muted-foreground focus:border-gold focus:ring-gold/30 hover:shadow-[0_4px_15px_rgba(200,167,102,0.3)] focus:shadow-[0_4px_15px_rgba(200,167,102,0.3)] transition-shadow"
            required
            disabled={isSubmitting}
          />
          <Button
            type="submit"
            disabled={isSubmitting}
            className="relative overflow-hidden px-5 text-primary-foreground font-semibold bg-gold hover:bg-gold-light transition-all duration-300"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin text-primary-foreground" />
            ) : (
              <Send className="w-4 h-4 text-primary-foreground" />
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
              className="flex-1 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold/50 focus:ring-gold/20 h-12"
              disabled={isSubmitting}
            />
            <Input
              type="email"
              placeholder="Your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold/50 focus:ring-gold/20 h-12"
              required
              disabled={isSubmitting}
            />
          </div>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gold hover:bg-gold-light text-black font-semibold h-12 text-base"
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
          className="bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold/50 focus:ring-gold/20"
          required
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-gold hover:bg-gold-light text-black font-semibold"
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
