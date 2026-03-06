import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Mail, Loader2, CheckCircle, User, Phone } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { PhoneInput } from "@/components/ui/phone-input";

const newsletterSchema = z.object({
  fullName: z.string().min(2, "Please enter your full name"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().optional(),
});

type NewsletterFormData = z.infer<typeof newsletterSchema>;

export function NewsletterSection() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [phone, setPhone] = useState("");
  const location = useLocation();

  const form = useForm<NewsletterFormData>({
    resolver: zodResolver(newsletterSchema),
    defaultValues: {
      fullName: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = async (data: NewsletterFormData) => {
    setIsSubmitting(true);
    try {
      const normalizedEmail = data.email.toLowerCase().trim();
      
      const subscribePromise = supabase.functions.invoke('newsletter-subscribe', {
        body: {
          email: normalizedEmail,
          full_name: data.fullName.trim(),
          phone: phone || undefined,
          source: 'project_detail',
          page_source: location.pathname,
        },
      });

      supabase.functions.invoke('capture-lead', {
        body: {
          email: normalizedEmail,
          fullName: data.fullName.trim(),
          phone: phone || null,
          source: 'newsletter',
          subSource: 'Project Detail',
          pageSource: location.pathname,
          contactType: 'client',
        },
      }).catch(err => console.warn('Lead capture warning:', err));

      const { data: result, error } = await subscribePromise;

      if (error) {
        console.error("Newsletter subscription failed:", error);
        toast.error("Something went wrong. Please try again.");
        setIsSubmitting(false);
        return;
      }

      setIsSuccess(true);
      toast.success("You're subscribed! We'll keep you updated on the latest projects.");
      form.reset();
      setPhone("");
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
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3 max-w-md mx-auto">
                {/* Full Name */}
                <FormField
                  control={form.control}
                  name="fullName"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input 
                            placeholder="Full Name *"
                            {...field}
                            className="bg-zinc-900 border-2 border-gold/50 hover:border-gold focus:border-gold h-12 text-white placeholder:text-zinc-400 pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-left" />
                    </FormItem>
                  )}
                />

                {/* Email */}
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                          <Input 
                            type="email"
                            placeholder="Email Address *"
                            {...field}
                            className="bg-zinc-900 border-2 border-gold/50 hover:border-gold focus:border-gold h-12 text-white placeholder:text-zinc-400 pl-10"
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-left" />
                    </FormItem>
                  )}
                />

                {/* Phone */}
                <div>
                  <PhoneInput
                    value={phone}
                    onChange={(val) => setPhone(val || "")}
                    placeholder="Phone Number (optional)"
                    variant="dark"
                  />
                </div>

                <Button 
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  className="w-full h-12 px-6"
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
