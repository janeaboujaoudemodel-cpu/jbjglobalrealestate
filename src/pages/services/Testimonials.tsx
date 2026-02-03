import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  Quote,
  Video,
  CheckCircle2,
  HelpCircle,
  Phone,
  Send,
  MessageSquare,
  User,
  Building2,
} from "lucide-react";
import Footer from "@/components/Footer";
import DirectContactCTA from "@/components/DirectContactCTA";
import { SEOHead } from "@/components/SEOHead";
import { Button } from "@/components/ui/button";
import { PremiumHeroButton } from "@/components/ui/premium-hero-button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
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

const featuredTestimonials = [
  {
    name: "Ahmed K.",
    role: "First-Time Buyer",
    location: "Dubai Marina",
    content: "The buying process was incredibly smooth. The team guided me through every step, from initial viewing to handover. Professional and responsive throughout.",
    rating: 5,
  },
  {
    name: "Sarah M.",
    role: "Investor",
    location: "Downtown Dubai",
    content: "As an overseas investor, I needed a team I could trust. JBJ provided transparent advice, regular updates, and handled the entire transaction remotely.",
    rating: 5,
  },
  {
    name: "Michael R.",
    role: "Landlord",
    location: "JVC",
    content: "Property management has been excellent. Monthly reports, quick tenant coordination, and proactive maintenance handling. My property is in good hands.",
    rating: 5,
  },
  {
    name: "Fatima A.",
    role: "Seller",
    location: "Palm Jumeirah",
    content: "Sold my apartment above asking price within 3 weeks. The marketing, photography, and negotiation were all top-tier. Highly recommend.",
    rating: 5,
  },
];

const videoTestimonials = [
  { id: 1, title: "Investment Success Story", client: "International Investor", placeholder: true },
  { id: 2, title: "First Home Purchase", client: "Young Professionals", placeholder: true },
  { id: 3, title: "Landlord Experience", client: "Property Owner", placeholder: true },
];

const faqData = [
  {
    question: "Can I submit a testimonial anonymously?",
    answer: "Yes. You can choose to display your testimonial with your first name only or as 'Verified Client'.",
  },
  {
    question: "Will my testimonial be edited?",
    answer: "We may edit for clarity or length while preserving your message. You'll be contacted if significant changes are needed.",
  },
  {
    question: "Can I include photos or videos?",
    answer: "Yes! Video testimonials are especially valued. Contact us to arrange a video recording session.",
  },
  {
    question: "How long before my testimonial appears?",
    answer: "Testimonials are reviewed within 5 business days. Approved submissions appear on our website shortly after.",
  },
  {
    question: "Can I update or remove my testimonial?",
    answer: "Yes. Contact us anytime to update or remove your testimonial from our website.",
  },
  {
    question: "Do I need to be a current client?",
    answer: "We welcome testimonials from both current and past clients who have completed transactions with JBJ.",
  },
];

const Testimonials = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    transactionType: "",
    testimonial: "",
    consentToPublish: false,
    anonymous: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.consentToPublish) {
      toast.error("Please consent to publishing your testimonial");
      return;
    }
    toast.success("Thank you! Your testimonial has been submitted for review.");
    setFormData({
      name: "",
      email: "",
      transactionType: "",
      testimonial: "",
      consentToPublish: false,
      anonymous: false,
    });
  };

  return (
    <>
      <SEOHead
        title="Client Testimonials | JBJ Global Real Estate"
        description="Verified client feedback and success stories from property transactions in Dubai. Read real experiences from buyers, sellers, landlords, and investors."
        canonicalPath="/services/testimonials"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
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
              Verified client feedback and outcomes — presented with clarity and respect for privacy.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#submit-testimonial">
                Submit a Testimonial
              </PremiumHeroButton>
              <PremiumHeroButton href="#featured">
                Read Stories
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

      {/* FEATURED TESTIMONIALS */}
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
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Featured Testimonials
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto">
              {featuredTestimonials.map((testimonial, index) => (
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
              ))}
            </div>
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
              className="text-3xl md:text-4xl font-bold text-black text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Video Testimonials
            </motion.h2>
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
              Share Your Experience
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-none">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-black">Name</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Your name (optional)"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-black">Email *</Label>
                        <Input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                          placeholder="your@email.com"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="transactionType" className="text-black">Transaction Type</Label>
                      <Input
                        id="transactionType"
                        value={formData.transactionType}
                        onChange={(e) => setFormData({ ...formData, transactionType: e.target.value })}
                        placeholder="e.g., Buying, Selling, Renting, Investing"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="testimonial" className="text-black">Your Testimonial *</Label>
                      <Textarea
                        id="testimonial"
                        value={formData.testimonial}
                        onChange={(e) => setFormData({ ...formData, testimonial: e.target.value })}
                        required
                        placeholder="Share your experience working with JBJ..."
                        rows={5}
                      />
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="anonymous"
                          checked={formData.anonymous}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, anonymous: checked as boolean })
                          }
                        />
                        <Label htmlFor="anonymous" className="text-sm text-zinc-600">
                          Display anonymously (show as "Verified Client")
                        </Label>
                      </div>

                      <div className="flex items-start gap-3">
                        <Checkbox
                          id="consent"
                          checked={formData.consentToPublish}
                          onCheckedChange={(checked) => 
                            setFormData({ ...formData, consentToPublish: checked as boolean })
                          }
                        />
                        <Label htmlFor="consent" className="text-sm text-zinc-600">
                          I consent to having my testimonial published on the JBJ website and marketing materials *
                        </Label>
                      </div>
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
                    className="jj-card-inner border-none"
                  >
                    <AccordionTrigger className="text-left text-black hover:text-gold">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-gold shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-zinc-600 pl-8">
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
            variants={staggerContainer}
            className="text-center max-w-3xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Ready to Share Your Story?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Your feedback helps us improve and helps others make informed decisions.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <a href="#submit-testimonial">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  Submit Testimonial
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Us
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default Testimonials;
