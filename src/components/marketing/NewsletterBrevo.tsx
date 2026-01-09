import { useState } from 'react';
import { Send, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsSubmitting(true);

    try {
      const normalizedEmail = email.toLowerCase().trim();
      
      // Save to leads table for tracking
      const { error: leadError } = await supabase
        .from('leads')
        .upsert({
          email: normalizedEmail,
          full_name: name || null,
          source: `newsletter_${source}`,
          page_source: window.location.pathname,
        }, {
          onConflict: 'email',
        });

      if (leadError) {
        console.error('Lead save error:', leadError);
      }

      // Also save to crm_leads for CRM dashboard tracking
      const { error: crmError } = await supabase
        .from('crm_leads')
        .insert({
          full_name: name || normalizedEmail.split('@')[0],
          email_lower: normalizedEmail,
          source: `newsletter_${source}`,
          owner_type: 'company_assigned' as const,
          lead_source_type: 'website',
          contact_type: 'client' as const,
          tags: ['newsletter', source.replace(/_/g, '-')],
        });

      if (crmError && crmError.code !== '23505') {
        console.warn('CRM lead save warning:', crmError);
      }

      // Call Brevo integration edge function
      const { error: brevoError } = await supabase.functions.invoke('newsletter-subscribe', {
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

      if (brevoError) {
        // Still show success if lead was saved - Brevo might not be configured
        console.warn('Brevo subscription warning:', brevoError);
      }

      setIsSuccess(true);
      toast.success('Welcome to the JJ Global Capital inner circle!', {
        description: "You'll receive exclusive updates and insights.",
      });
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
          className="flex-1 bg-zinc-900/50 border-zinc-700 text-white placeholder:text-zinc-500 focus:border-gold/50 focus:ring-gold/20"
          required
          disabled={isSubmitting}
        />
        <Button
          type="submit"
          disabled={isSubmitting}
          className="bg-gold hover:bg-gold-light text-black font-semibold px-4"
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
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
    </form>
  );
};

export default NewsletterBrevo;
