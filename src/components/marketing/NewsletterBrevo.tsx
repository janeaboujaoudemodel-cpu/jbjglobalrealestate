import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import SubscriptionSuccessModal from '@/components/marketing/SubscriptionSuccessModal';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Use backend edge function to save lead (bypasses RLS) with retry logic
      let retryCount = 0;
      const maxRetries = 2;
      let success = false;

      while (retryCount <= maxRetries && !success) {
        try {
          const { data: captureResult, error: captureError } = await supabase.functions.invoke('capture-lead', {
            body: {
              email: normalizedEmail,
              fullName: name || null,
              source: 'newsletter',
              subSource: source.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
              pageSource: window.location.pathname,
              contactType: 'client',
            },
          });

          if (!captureError && !(captureResult as any)?.error) {
            success = true;
          } else {
            throw captureError || new Error((captureResult as any)?.error);
          }
        } catch (err) {
          retryCount++;
          console.warn(`Lead capture attempt ${retryCount} failed:`, err);
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000 * retryCount));
          }
        }
      }

      if (!success) {
        toast.error('Something went wrong. Please try again.');
        setIsSubmitting(false);
        return;
      }

      // Call Brevo integration edge function (best effort - don't block on failure)
      try {
        await supabase.functions.invoke('newsletter-subscribe', {
          body: {
            email,
            name,
            listId,
            source,
            attributes: {
              SIGNUP_DATE: new Date().toISOString(),
              SIGNUP_PAGE: window.location.pathname,
            },
          },
        });
      } catch (brevoError) {
        console.warn('Brevo subscription warning:', brevoError);
      }

      setIsSuccess(true);
      setShowSuccessModal(true);
      setEmail('');
      setName('');

      // Reset success state after 5 seconds
      setTimeout(() => setIsSuccess(false), 5000);
    } catch (error: any) {
      console.error('Newsletter subscription error:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className={`text-center ${className}`}>
        <div className="inline-flex items-center gap-2 text-emerald-400">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">You're subscribed!</span>
        </div>
      </div>
    );
  }

  if (variant === 'compact') {
    return (
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
    );
  }

  if (variant === 'hero') {
    return (
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
          {isSubmitting ? 'Subscribing...' : 'Join the Inner Circle'}
        </Button>
      </form>
    );
  }

  // Default variant
  return (
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
      <SubscriptionSuccessModal 
        isOpen={showSuccessModal} 
        onClose={() => setShowSuccessModal(false)} 
      />
    </form>
  );
};

export default NewsletterBrevo;
