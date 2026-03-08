/**
 * Premium Pricing Page
 * 3-tier subscription system with monthly/yearly toggle and USD/AED currency
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Check,
  Sparkles,
  Crown,
  Zap,
  Building2,
  ArrowRight,
  Shield,
  Clock,
  Users,
  Star,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useSubscription, formatSubscriptionPrice, calculateYearlySavings } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import SEOHead from "@/components/SEOHead";

const TIER_ICONS: Record<string, React.ReactNode> = {
  starter: <Zap className="w-6 h-6" />,
  professional: <Crown className="w-6 h-6" />,
  enterprise: <Building2 className="w-6 h-6" />,
};

const TIER_COLORS: Record<string, string> = {
  starter: "from-blue-500/20 to-blue-600/5",
  professional: "from-primary/20 to-primary/5",
  enterprise: "from-purple-500/20 to-purple-600/5",
};

export default function Pricing() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { tiers, subscription, isLoading } = useSubscription();
  
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "yearly">("monthly");
  const [currency, setCurrency] = useState<"USD" | "AED">("USD");

  const handleSelectPlan = (tierId: string) => {
    if (!user) {
      toast.info("Please sign in to subscribe");
      navigate("/auth");
      return;
    }

    // For now, show coming soon message (Stripe integration later)
    toast.info("Payment integration coming soon! Your selection has been noted.", {
      description: `Selected: ${tierId} plan (${billingPeriod})`,
    });
  };

  const getPrice = (tier: any) => {
    if (billingPeriod === "yearly") {
      return currency === "USD" ? tier.yearly_price_usd : tier.yearly_price_aed;
    }
    return currency === "USD" ? tier.price_usd : tier.price_aed;
  };

  const getMonthlyEquivalent = (tier: any) => {
    if (billingPeriod === "yearly") {
      const yearlyPrice = currency === "USD" ? tier.yearly_price_usd : tier.yearly_price_aed;
      return Math.round(yearlyPrice / 12);
    }
    return currency === "USD" ? tier.price_usd : tier.price_aed;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <>
      <SEOHead
        title="Pricing | JBJ Global Real Estate AI Tools"
        description="Choose the perfect plan for your real estate business. Access powerful AI tools with our flexible subscription options."
        canonicalPath="/pricing"
      />

      <div className="min-h-screen bg-background">
        {/* Hero Section */}
        <section className="relative py-20 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-10 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />

          <div className="container relative z-10 mx-auto px-4 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-4">
                <Sparkles className="w-3 h-3 mr-1" />
                Premium AI Tools
              </Badge>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                Choose Your <span className="text-primary">Plan</span>
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                Unlock powerful AI tools designed specifically for real estate professionals.
                Start free, upgrade when you're ready.
              </p>

              {/* Billing Toggle */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-6 mb-8">
                <div className="flex items-center gap-3 bg-muted/50 rounded-full p-1 px-4">
                  <span className={billingPeriod === "monthly" ? "font-semibold" : "text-muted-foreground"}>
                    Monthly
                  </span>
                  <Switch
                    checked={billingPeriod === "yearly"}
                    onCheckedChange={(checked) => setBillingPeriod(checked ? "yearly" : "monthly")}
                  />
                  <span className={billingPeriod === "yearly" ? "font-semibold" : "text-muted-foreground"}>
                    Yearly
                  </span>
                  {billingPeriod === "yearly" && (
                    <Badge variant="default" className="bg-green-500 text-white">
                      2 Months Free
                    </Badge>
                  )}
                </div>

                <Tabs value={currency} onValueChange={(v) => setCurrency(v as "USD" | "AED")}>
                  <TabsList>
                    <TabsTrigger value="USD">USD $</TabsTrigger>
                    <TabsTrigger value="AED">AED د.إ</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Pricing Cards */}
        <section className="py-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
              {tiers?.map((tier, index) => {
                const isCurrentPlan = subscription?.tier_id === tier.id;
                const savings = calculateYearlySavings(
                  currency === "USD" ? tier.price_usd : tier.price_aed,
                  currency === "USD" ? tier.yearly_price_usd : tier.yearly_price_aed
                );

                return (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      className={`relative h-full overflow-hidden transition-all duration-300 hover:shadow-xl ${
                        tier.is_popular
                          ? "border-primary shadow-lg scale-105 z-10"
                          : "border-border hover:border-primary/50"
                      }`}
                    >
                      {tier.is_popular && (
                        <div className="absolute top-0 left-0 right-0 bg-gradient-to-r from-primary to-primary/80 text-primary-foreground text-center py-1 text-sm font-medium">
                          <Star className="w-3 h-3 inline mr-1" />
                          Most Popular
                        </div>
                      )}

                      <div className={`absolute inset-0 bg-gradient-to-br ${TIER_COLORS[tier.id] || TIER_COLORS.starter} opacity-50`} />

                      <CardHeader className={`relative ${tier.is_popular ? "pt-10" : ""}`}>
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                            {TIER_ICONS[tier.id] || <Zap className="w-6 h-6" />}
                          </div>
                          <div>
                            <CardTitle className="text-xl">{tier.name}</CardTitle>
                            <p className="text-sm text-muted-foreground">{tier.description}</p>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-baseline gap-1">
                            <span className="text-4xl font-bold">
                              {currency === "USD" ? "$" : "AED "}
                              {getMonthlyEquivalent(tier)}
                            </span>
                            <span className="text-muted-foreground">/month</span>
                          </div>
                          {billingPeriod === "yearly" && (
                            <p className="text-sm text-muted-foreground mt-1">
                              Billed {formatSubscriptionPrice(getPrice(tier), currency, "yearly")}
                            <Badge variant="outline" className="ml-2 text-emerald-600 border-emerald-600">
                                Save {savings.percentage}%
                              </Badge>
                            </p>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="relative space-y-6">
                        <Button
                          className="w-full"
                          size="lg"
                          variant={tier.is_popular ? "default" : "outline"}
                          onClick={() => handleSelectPlan(tier.id)}
                          disabled={isCurrentPlan}
                        >
                          {isCurrentPlan ? (
                            "Current Plan"
                          ) : (
                            <>
                              Get Started
                              <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                          )}
                        </Button>

                        <div className="space-y-3">
                          <p className="text-sm font-medium">What's included:</p>
                          <ul className="space-y-2">
                            {(tier.features as string[]).map((feature, idx) => (
                              <li key={idx} className="flex items-start gap-2 text-sm">
                                <Check className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                                <span>{feature}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Free Tools Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-4xl text-center">
            <h2 className="text-2xl font-bold mb-4">Always Free Tools</h2>
            <p className="text-muted-foreground mb-8">
              These powerful tools are available to all users, no subscription required.
            </p>
            <div className="grid sm:grid-cols-3 gap-4">
              {[
                { name: "AI Home Finder", description: "Find your perfect property with AI", icon: "—" },
                { name: "Business Card Scanner", description: "Digitize contacts instantly", icon: "—" },
                { name: "CRM Access", description: "Manage your leads effectively", icon: "—" },
              ].map((tool, idx) => (
                <Card key={idx} className="bg-background">
                  <CardContent className="p-6 text-center">
                    <div className="text-4xl mb-3">{tool.icon}</div>
                    <h3 className="font-semibold mb-1">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                    <Badge variant="secondary" className="mt-3">Free Forever</Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Trust Badges */}
        <section className="py-16 px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              <div className="space-y-2">
                <Shield className="w-10 h-10 mx-auto text-primary" />
                <h3 className="font-semibold">Secure Payments</h3>
                <p className="text-sm text-muted-foreground">SSL encrypted & PCI compliant</p>
              </div>
              <div className="space-y-2">
                <Clock className="w-10 h-10 mx-auto text-primary" />
                <h3 className="font-semibold">Cancel Anytime</h3>
                <p className="text-sm text-muted-foreground">No lock-in, no hidden fees</p>
              </div>
              <div className="space-y-2">
                <Users className="w-10 h-10 mx-auto text-primary" />
                <h3 className="font-semibold">Trusted by 500+ Brokers</h3>
                <p className="text-sm text-muted-foreground">Join the JBJ community</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-16 px-4 bg-muted/30">
          <div className="container mx-auto max-w-3xl">
            <h2 className="text-2xl font-bold text-center mb-8">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {[
                {
                  q: "Can I switch plans later?",
                  a: "Yes! You can upgrade or downgrade your plan at any time. Changes take effect at your next billing cycle.",
                },
                {
                  q: "What payment methods do you accept?",
                  a: "We accept all major credit cards, debit cards, and bank transfers. Payment processing is handled securely through Stripe.",
                },
                {
                  q: "Is there a free trial?",
                  a: "We offer free tools (AI Home Finder, Business Card Scanner, CRM) that you can use without any subscription. Try them out before upgrading!",
                },
                {
                  q: "What's the refund policy?",
                  a: "We offer a 14-day money-back guarantee. If you're not satisfied, contact us for a full refund.",
                },
              ].map((faq, idx) => (
                <Card key={idx}>
                  <CardContent className="p-6">
                    <h3 className="font-semibold mb-2">{faq.q}</h3>
                    <p className="text-muted-foreground">{faq.a}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
