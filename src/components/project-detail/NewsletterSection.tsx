import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

/**
 * Newsletter subscription section - "Stay in the loop".
 * Appears before the footer on project detail pages.
 * Uses backend edge function for secure lead capture.
 */
export function NewsletterSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const location = useLocation();

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true);
    try {
      const normalizedEmail = data.email.toLowerCase().trim();
      
      // Use backend edge function to capture lead (bypasses RLS)
      const { data: result, error } = await supabase.functions.invoke('capture-lead', {
        body: {
          email: normalizedEmail,
          source: 'newsletter',
          subSource: 'Project Detail',
          pageSource: location.pathname,
          contactType: 'client',
        },
      });

      if (error) {
        console.error("Newsletter subscription failed:", error);
        toast.error("Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      if ((result as any)?.error) {
        console.error("Newsletter subscription failed:", (result as any).error);
        toast.error("Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      // Also try to sync with Brevo (best effort - don't block on failure)
      try {
        await supabase.functions.invoke('newsletter-subscribe', {
          body: {
            email: normalizedEmail,
            source: 'project_detail',
            source_page: location.pathname,
          },
        });
      } catch (brevoError) {
        console.warn('Brevo sync warning:', brevoError);
        // Don't fail the overall flow if Brevo sync fails
      }

      setIsSuccess(true);
      toast.success("You're subscribed! We'll keep you updated on the latest projects.");
      form.reset();
    } catch (error) {
      console.error("Newsletter subscription failed:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="py-12 md:py-16 bg-premium-bg">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="w-12 h-12 rounded-full bg-gold/20 flex items-center justify-center mx-auto mb-4">
            <Mail className="w-6 h-6 text-gold" />
          </div>
          
          <h2 className="text-2xl md:text-3xl font-bold text-white mb-3">
            Stay in the Loop
          </h2>
          <p className="text-muted-foreground mb-6">
            Subscribe to receive exclusive updates on new projects, market insights, and investment opportunities.
          </p>

          {isSuccess ? (
            <div className="flex items-center justify-center gap-2 text-emerald-400">
              <CheckCircle className="w-5 h-5" />
              <span>You're subscribed! Check your inbox.</span>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormControl>
                        <Input 
                          type="email"
                          placeholder="Enter your email address"
                          {...field}
                          className="bg-zinc-900 border-2 border-gold/50 hover:border-gold focus:border-gold h-12 text-white placeholder:text-zinc-400"
                        />
                      </FormControl>
                      <FormMessage className="text-left" />
                    </FormItem>
                  )}
                />
                <Button 
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="h-12 px-6"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </form>
            </Form>
          )}

          {/* Terms & Privacy links */}
          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to our{" "}
            <Link to="/terms" className="text-gold hover:underline">Terms of Service</Link>
            {" "}and{" "}
            <Link to="/privacy" className="text-gold hover:underline">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </section>
  );
}

export default NewsletterSection;
