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
import { Link } from "react-router-dom";

const newsletterSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

/**
 * Newsletter subscription section matching Provident's "Stay in the loop" section.
 * Appears before the footer on project detail pages.
 */
export function NewsletterSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true);
    try {
      // Save to leads table for newsletter subscriptions
      const { error } = await supabase
        .from("leads")
        .insert({
          email: data.email,
          source: "newsletter-project-detail",
          lead_type: "newsletter",
        });

      if (error && error.code !== "23505") { // Ignore duplicate email error
        throw error;
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
                          className="bg-card border-border focus:border-gold h-12"
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
