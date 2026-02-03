import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MessageSquare,
  Phone,
  Mail,
  CheckCircle2,
  HelpCircle,
  Ticket,
  Send,
  Shield,
  FileText,
  KeyRound,
  Folder,
  Users,
  ArrowUpCircle,
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

const whatWeCanHelp = [
  { icon: Shield, text: "Website support and login issues" },
  { icon: Send, text: "Service requests routing" },
  { icon: Ticket, text: "Complaint ticket creation and updates" },
  { icon: FileText, text: "Document submission guidance" },
  { icon: KeyRound, text: "Portal access questions" },
];

const supportCategories = [
  "Website Support",
  "Login Issues",
  "Service Request",
  "Complaint",
  "Document Submission",
  "Portal Access",
  "General Inquiry",
  "Other",
];

const faqData = [
  {
    question: "Will I always get a ticket ID?",
    answer: "Yes—support is handled through tracked tickets.",
  },
  {
    question: "How do I reference my case?",
    answer: "Use the ticket ID in all messages.",
  },
  {
    question: "What's the fastest way to get help?",
    answer: "Create a ticket, then email the ticket ID if it's urgent.",
  },
  {
    question: "Can I request a callback?",
    answer: "Yes—include preferred time and number.",
  },
  {
    question: "Do you support WhatsApp?",
    answer: "If WhatsApp support exists on the site, you can use the same existing contact method displayed in the Direct Contact section.",
  },
  {
    question: "Can you help with partner services?",
    answer: "We can route you to the right partner introduction pathway.",
  },
  {
    question: "Do you store my documents?",
    answer: "Documents submitted through forms are stored within platform workflows visible to authorized staff.",
  },
  {
    question: "Can I escalate a ticket?",
    answer: "Yes—escalation options apply for unresolved tickets.",
  },
];

const CustomerHappinessCenter = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    category: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Support ticket created successfully! You will receive a confirmation email with your ticket ID.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      category: "",
      message: "",
    });
  };

  return (
    <>
      <SEOHead
        title="Customer Happiness Center | JBJ Global Real Estate"
        description="Fast routing, clear answers, and structured support—built around ticket tracking and professional resolution."
        canonicalPath="/services/customer-happiness-center"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-black">
          {/* Video placeholder */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center">
                <Heart className="w-12 h-12 text-gold/60" />
              </div>
              <p className="text-gold/60 text-sm tracking-widest uppercase">Support That Actually Works</p>
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
              <Heart className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Customer Happiness Center
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Fast routing, clear answers, and structured support—built around ticket tracking and professional resolution.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#create-ticket">
                Create Support Ticket
              </PremiumHeroButton>
              <PremiumHeroButton href="#direct-contact">
                Reach Us Directly
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

      {/* WHAT THIS CENTER DOES */}
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
              What This Center Does
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-zinc-700 leading-relaxed text-center">
                The Happiness Center exists to ensure support requests don't get lost. Every request becomes a tracked ticket with clear routing and accountability.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SUPPORT TICKET FORM */}
      <section id="create-ticket" className="bg-black py-20">
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
              Create Support Ticket
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-2 border-gold/30">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-black">Full Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Your full name"
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-black">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+971 XX XXX XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category" className="text-black">Category *</Label>
                        <Select
                          value={formData.category}
                          onValueChange={(value) => setFormData({ ...formData, category: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {supportCategories.map((cat) => (
                              <SelectItem key={cat} value={cat.toLowerCase().replace(/\s+/g, "-")}>
                                {cat}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-black">How can we help? *</Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        required
                        placeholder="Describe your inquiry or issue..."
                        rows={5}
                      />
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Ticket
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* DIRECT CONTACT */}
      <section id="direct-contact" className="bg-black py-20">
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
              Direct Contact
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner text-center">
              <div className="flex items-center justify-center gap-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-black flex items-center justify-center">
                  <Mail className="w-7 h-7 text-gold" />
                </div>
                <div className="text-left">
                  <p className="text-sm text-zinc-600">Happiness Center Email</p>
                  <a 
                    href="mailto:HAPPINESS@JBJGLOBALREALESTATE.COM" 
                    className="text-gold font-semibold text-lg hover:underline"
                  >
                    HAPPINESS@JBJGLOBALREALESTATE.COM
                  </a>
                </div>
              </div>
              <p className="text-zinc-600 mt-4">
                For urgent routing, email the Happiness Center with your ticket ID in the subject line.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* WHAT WE CAN HELP WITH */}
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
              What We Can Help With
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <ul className="space-y-4">
                {whatWeCanHelp.map((item, idx) => (
                  <li key={idx} className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-black flex items-center justify-center shrink-0">
                      <item.icon className="w-5 h-5 text-gold" />
                    </div>
                    <span className="text-zinc-700">{item.text}</span>
                  </li>
                ))}
              </ul>
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
              <Ticket className="w-12 h-12 text-gold mx-auto mb-6" />
              <h2
                className="text-3xl md:text-4xl font-bold text-black mb-4"
                style={{ fontFamily: "Playfair Display, serif" }}
              >
                Get Support in One Workflow
              </h2>
              <p className="text-zinc-600 mb-8 max-w-xl mx-auto">
                Create a ticket to get routed and tracked properly.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <PremiumHeroButton href="#create-ticket">
                  Create Support Ticket
                </PremiumHeroButton>
                <PremiumHeroButton href="mailto:HAPPINESS@JBJGLOBALREALESTATE.COM">
                  Email Happiness Center
                </PremiumHeroButton>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <DirectContactCTA />
      <Footer />
    </>
  );
};

export default CustomerHappinessCenter;
