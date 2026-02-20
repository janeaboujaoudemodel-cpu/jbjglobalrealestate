import { motion } from "framer-motion";
import {
  Star,
  Quote,
  Video,
  HelpCircle,
  Send,
  User,
  Shield,
  Eye,
  Lock,
} from "lucide-react";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState } from "react";
import { toast } from "sonner";

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const serviceTypes = [
  "Buying",
  "Selling",
  "Renting",
  "Investing",
  "Property Management",
  "Advisory",
  "Broker Partnership",
  "Other",
];

// Testimonials organized by category
const testimonialsByCategory = {
  buyers: [
    {
      name: "Ahmed K.",
      role: "First-Time Buyer",
      location: "Dubai Marina",
      content: "The buying process was incredibly smooth. The team guided me through every step, from initial viewing to handover. Professional and responsive throughout.",
      rating: 5,
    },
    {
      name: "Verified Client",
      role: "Buyer",
      location: "Downtown Dubai",
      content: "Found my dream apartment with JBJ's help. The attention to detail and understanding of my requirements made all the difference.",
      rating: 5,
    },
  ],
  sellers: [
    {
      name: "Fatima A.",
      role: "Property Seller",
      location: "Palm Jumeirah",
      content: "Sold my apartment above asking price within 3 weeks. The marketing, photography, and negotiation were all top-tier. Highly recommend.",
      rating: 5,
    },
    {
      name: "Verified Client",
      role: "Seller",
      location: "Business Bay",
      content: "Professional valuation and marketing strategy led to a quick sale at an excellent price. Very satisfied with the entire process.",
      rating: 5,
    },
  ],
  investors: [
    {
      name: "Sarah M.",
      role: "International Investor",
      location: "Dubai",
      content: "As an overseas investor, I needed a team I could trust. JBJ provided transparent advice, regular updates, and handled the entire transaction remotely.",
      rating: 5,
    },
    {
      name: "Verified Client",
      role: "Portfolio Investor",
      location: "UAE",
      content: "Excellent market insights and ROI analysis. The team helped me build a diverse property portfolio aligned with my investment goals.",
      rating: 5,
    },
  ],
  landlords: [
    {
      name: "Michael R.",
      role: "Landlord",
      location: "JVC",
      content: "Property management has been excellent. Monthly reports, quick tenant coordination, and proactive maintenance handling. My property is in good hands.",
      rating: 5,
    },
    {
      name: "Verified Client",
      role: "Property Owner",
      location: "Dubai Hills",
      content: "Reliable tenant screening and hassle-free rental management. Highly recommend their landlord services.",
      rating: 5,
    },
  ],
  partners: [
    {
      name: "Verified Partner",
      role: "Broker Partner",
      location: "Dubai",
      content: "Working with JBJ has elevated our service standards. The training, support, and collaborative approach have been invaluable.",
      rating: 5,
    },
    {
      name: "Verified Client",
      role: "Agency Partner",
      location: "UAE",
      content: "Professional partnership with clear communication and mutual respect. A pleasure to collaborate with.",
      rating: 5,
    },
  ],
};

const videoTestimonials = [
  { id: 1, title: "Investment Success Story", client: "International Investor", placeholder: true },
  { id: 2, title: "First Home Purchase", client: "Young Professionals", placeholder: true },
  { id: 3, title: "Landlord Experience", client: "Property Owner", placeholder: true },
];

const faqData = [
  {
    question: "Can I submit anonymously?",
    answer: "You can request anonymization. Verification email is still required.",
  },
  {
    question: "Will you edit my words?",
    answer: "Only for clarity and removal of sensitive/private information, not meaning.",
  },
  {
    question: "Do you publish every testimonial?",
    answer: "We publish verified, relevant testimonials that meet quality and privacy standards.",
  },
  {
    question: "Can I remove my testimonial later?",
    answer: "Yes, request removal via the Happiness Center.",
  },
  {
    question: "Do you accept broker partner testimonials?",
    answer: "Yes—those appear under Brokers & Partners.",
  },
  {
    question: "Can I submit a video testimonial?",
    answer: "Yes—submit a request and our team will coordinate.",
  },
];

const Testimonials = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    serviceType: "",
    testimonial: "",
    rating: "",
    consentToPublish: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentToPublish) {
      toast.error("Please confirm your consent to publish the testimonial");
      return;
    }
    if (!formData.email || !formData.testimonial) {
      toast.error("Please fill in required fields");
      return;
    }
    toast.success("Thank you! Your testimonial has been submitted for review.");
    setFormData({
      name: "",
      email: "",
      serviceType: "",
      testimonial: "",
      rating: "",
      consentToPublish: false,
    });
  };

  const renderTestimonialCard = (testimonial: typeof testimonialsByCategory.buyers[0], index: number) => (
    <motion.div key={index} variants={fadeInUp}>
      <Card className="jj-card-inner h-full">
        <CardContent className="p-6">
          <Quote className="w-8 h-8 text-gold/30 mb-4" />
          <p className="text-zinc-700 mb-6 italic">
            "{testimonial.content}"
          </p>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-black flex items-center justify-center">
                <User className="w-5 h-5 text-gold" />
              </div>
              <div>
                <p className="font-semibold text-black">{testimonial.name}</p>
                <p className="text-sm text-zinc-500">{testimonial.role} • {testimonial.location}</p>
              </div>
            </div>
            <div className="flex gap-1">
              {[...Array(testimonial.rating)].map((_, i) => (
                <Star key={i} className="w-4 h-4 fill-gold text-gold" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  return (
    <>
      <SEOHead
        title="Testimonials | JBJ Global Real Estate"
        description="Real feedback, presented with premium formatting and privacy respect—because trust is built with receipts, not hype."
        canonicalPath="/services/testimonials"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          {/* Video placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <Star className="w-12 h-12 text-gold/60" />
              </div>
              <p className="text-gold/60 text-sm tracking-widest uppercase">Client Stories</p>
              <p className="text-zinc-500 text-xs mt-2">Video placeholder only</p>
            </div>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-gold/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-gold/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6 border border-gold/40 bg-black/30 backdrop-blur-md">
              <Star className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Testimonials
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Real feedback, presented with premium formatting and privacy respect—because trust is built with receipts, not hype.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#submit-testimonial">
                Submit a Testimonial
              </PremiumHeroButton>
              <PremiumHeroButton href="#featured">
                Read Client Stories
              </PremiumHeroButton>
            </div>
          </motion.div>
        </div>
        
        <motion.div 
          className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <span className="text-gold/60 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* FEATURED TESTIMONIALS INTRO */}
      <section id="featured" className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Featured Testimonials
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-zinc-600 text-center max-w-3xl mx-auto mb-12"
            >
              A selection of verified client experiences across buying, selling, rentals, and advisory support. Testimonials may be anonymized upon request.
            </motion.p>

            {/* Category Tabs */}
            <motion.div variants={fadeInUp}>
              <Tabs defaultValue="buyers" className="max-w-5xl mx-auto">
                <TabsList className="w-full flex flex-wrap justify-center gap-2 bg-transparent mb-8">
                  <TabsTrigger 
                    value="buyers" 
                    className="px-6 py-3 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] text-black data-[state=active]:bg-black data-[state=active]:text-gold data-[state=active]:border-gold"
                  >
                    Buyers
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sellers"
                    className="px-6 py-3 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] text-black data-[state=active]:bg-black data-[state=active]:text-gold data-[state=active]:border-gold"
                  >
                    Sellers
                  </TabsTrigger>
                  <TabsTrigger 
                    value="investors"
                    className="px-6 py-3 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] text-black data-[state=active]:bg-black data-[state=active]:text-gold data-[state=active]:border-gold"
                  >
                    Investors
                  </TabsTrigger>
                  <TabsTrigger 
                    value="landlords"
                    className="px-6 py-3 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] text-black data-[state=active]:bg-black data-[state=active]:text-gold data-[state=active]:border-gold"
                  >
                    Landlords
                  </TabsTrigger>
                  <TabsTrigger 
                    value="partners"
                    className="px-6 py-3 rounded-full border-2 border-gold/30 bg-gradient-to-br from-[#F5EBD7] to-[#E8DCC8] text-black data-[state=active]:bg-black data-[state=active]:text-gold data-[state=active]:border-gold"
                  >
                    Brokers & Partners
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="buyers">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonialsByCategory.buyers.map((t, i) => renderTestimonialCard(t, i))}
                  </div>
                </TabsContent>

                <TabsContent value="sellers">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonialsByCategory.sellers.map((t, i) => renderTestimonialCard(t, i))}
                  </div>
                </TabsContent>

                <TabsContent value="investors">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonialsByCategory.investors.map((t, i) => renderTestimonialCard(t, i))}
                  </div>
                </TabsContent>

                <TabsContent value="landlords">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonialsByCategory.landlords.map((t, i) => renderTestimonialCard(t, i))}
                  </div>
                </TabsContent>

                <TabsContent value="partners">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {testimonialsByCategory.partners.map((t, i) => renderTestimonialCard(t, i))}
                  </div>
                </TabsContent>
              </Tabs>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* VIDEO TESTIMONIALS */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-6"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Video Testimonials
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-zinc-600 text-center max-w-2xl mx-auto mb-12"
            >
              Video testimonials appear here.
            </motion.p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {videoTestimonials.map((video, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="jj-card-inner overflow-hidden">
                    <div className="aspect-video bg-zinc-200 flex items-center justify-center">
                      <div className="text-center">
                        <Video className="w-12 h-12 text-gold mx-auto mb-2" />
                        <p className="text-sm text-zinc-500">Video Coming Soon</p>
                      </div>
                    </div>
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-black">{video.title}</h3>
                      <p className="text-sm text-zinc-600">{video.client}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* SUBMIT TESTIMONIAL FORM */}
      <section id="submit-testimonial" className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-2xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Submit a Testimonial
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-2 border-gold/30">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-black">Full Name (optional if anonymized)</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Your name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="email" className="text-black">Email (required for verification, not public) *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        placeholder="your@email.com"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="serviceType" className="text-black">Service Type</Label>
                      <Select
                        value={formData.serviceType}
                        onValueChange={(value) => setFormData({ ...formData, serviceType: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select service type" />
                        </SelectTrigger>
                        <SelectContent>
                          {serviceTypes.map((type) => (
                            <SelectItem key={type} value={type.toLowerCase().replace(/\s+/g, "-")}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="testimonial" className="text-black">Testimonial *</Label>
                      <Textarea
                        id="testimonial"
                        value={formData.testimonial}
                        onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                        required
                        placeholder="Share your experience working with JBJ Global Real Estate..."
                        rows={5}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="rating" className="text-black">Rating (optional)</Label>
                      <Select
                        value={formData.rating}
                        onValueChange={(value) => setFormData({ ...formData, rating: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select rating" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="5">5 Stars — Excellent</SelectItem>
                          <SelectItem value="4">4 Stars — Great</SelectItem>
                          <SelectItem value="3">3 Stars — Good</SelectItem>
                          <SelectItem value="2">2 Stars — Fair</SelectItem>
                          <SelectItem value="1">1 Star — Poor</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-start gap-3 p-4 rounded-xl bg-black/5 border border-gold/20">
                      <Checkbox
                        id="consent"
                        checked={formData.consentToPublish}
                        onCheckedChange={(checked) => 
                          setFormData({ ...formData, consentToPublish: checked as boolean })
                        }
                      />
                      <Label htmlFor="consent" className="text-sm text-zinc-700 leading-relaxed">
                        I confirm this testimonial reflects my genuine experience and I allow JBJ Global Real Estate to publish it on the website. I understand personal details can be anonymized upon request. *
                      </Label>
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Testimonial
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* PRIVACY & PUBLISHING STANDARD */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Privacy & Publishing Standard
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center shrink-0">
                  <Lock className="w-7 h-7 text-gold" />
                </div>
                <div>
                  <p className="text-zinc-700 leading-relaxed">
                    We verify submissions for authenticity and remove sensitive data. If you request anonymization, your testimonial can be published without identifying details.
                  </p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Frequently Asked Questions
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Accordion type="single" collapsible className="space-y-4">
                {faqData.map((faq, index) => (
                  <AccordionItem
                    key={index}
                    value={`item-${index}`}
                    className="border-2 border-gold/30 rounded-lg bg-gradient-to-br from-[#F5EBD7] via-[#E8DCC8] to-[#D4C4A8] overflow-hidden"
                  >
                    <AccordionTrigger className="px-6 py-4 text-left hover:no-underline hover:bg-gold/10">
                      <span className="text-black font-medium">{faq.question}</span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pb-4 text-zinc-600">
                      {faq.answer}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA BLOCK */}
      <section className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="max-w-3xl mx-auto text-center"
          >
            <div className="jj-card-inner border-2 border-gold/30">
              <Star className="w-12 h-12 text-gold mx-auto mb-6" />
              <h2
                className="text-3xl md:text-4xl font-bold text-black mb-4"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Share Your Experience
              </h2>
              <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                Submit a testimonial and help future clients choose with confidence.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="#submit-testimonial">
                  Submit a Testimonial
                </PremiumHeroButton>
                <PremiumHeroButton href="/contact?type=support">
                  Contact Support
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </>
  );
};

export default Testimonials;