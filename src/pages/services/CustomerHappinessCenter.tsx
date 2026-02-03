import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Heart,
  MessageSquare,
  Phone,
  Mail,
  Clock,
  CheckCircle2,
  HelpCircle,
  Ticket,
  Send,
  Users,
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

const contactOptions = [
  {
    icon: Mail,
    title: "Email Support",
    value: "happiness@jbjglobalrealestate.com",
    description: "For detailed inquiries and documentation",
    action: "mailto:happiness@jbjglobalrealestate.com",
    cta: "Send Email",
  },
  {
    icon: Phone,
    title: "Call Us",
    value: "+971 4 XXX XXXX",
    description: "Direct line during business hours",
    action: "tel:+97143334411",
    cta: "Call Now",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    value: "+971 XX XXX XXXX",
    description: "Quick responses for urgent matters",
    action: "https://wa.me/97143334411",
    cta: "Message Us",
  },
];

const supportCategories = [
  "General Inquiry",
  "Transaction Support",
  "Document Request",
  "Appointment Scheduling",
  "Service Information",
  "Technical Support",
  "Feedback",
  "Other",
];

const faqData = [
  {
    question: "What are your support hours?",
    answer: "Our support team is available Sunday to Thursday, 9:00 AM to 6:00 PM GST. Urgent matters can be submitted anytime and will be addressed during business hours.",
  },
  {
    question: "How quickly will I get a response?",
    answer: "Email inquiries receive a response within 24 business hours. Phone and WhatsApp during business hours typically get immediate or same-day responses.",
  },
  {
    question: "Can I track my support ticket?",
    answer: "Yes. When you submit a ticket, you'll receive a ticket ID via email. You can inquire about status by referencing this ID.",
  },
  {
    question: "What if I need help outside business hours?",
    answer: "Submit your request via email or the ticket form. Urgent transaction-related matters can also be sent via WhatsApp for priority handling the next business day.",
  },
  {
    question: "Is there a different channel for complaints?",
    answer: "Yes. For formal complaints, please use our Complaint Procedures page which has a dedicated escalation process.",
  },
  {
    question: "Can you help with partner services (mortgage, legal, etc.)?",
    answer: "We can provide information and introductions to our partner network. Direct service queries should be directed to the respective partners.",
  },
  {
    question: "Do you offer in-person support?",
    answer: "Yes. Office visits can be scheduled through our appointment system. Please contact us to arrange a meeting.",
  },
  {
    question: "What information should I include in my request?",
    answer: "Include your name, contact details, the nature of your inquiry, and any relevant reference numbers (transaction ID, property reference, etc.) for faster resolution.",
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
        description="Fast routing, clear answers, and structured support. Create tickets, reach us directly, and track your inquiries with transparency."
        canonicalPath="/services/customer-happiness-center"
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
              <Heart className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Customer Happiness Center
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              Fast routing, clear answers, and structured support — with ticket tracking and direct contact options.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#create-ticket">
                Create Support Ticket
              </PremiumHeroButton>
              <PremiumHeroButton href="#contact-options">
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

      {/* DIRECT CONTACT OPTIONS */}
      <section id="contact-options" className="bg-black py-20">
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
              Reach Us Directly
            </motion.h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {contactOptions.map((option, index) => (
                <motion.div key={index} variants={fadeInUp}>
                  <Card className="jj-card-inner h-full">
                    <CardContent className="p-6 text-center">
                      <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-black flex items-center justify-center">
                        <option.icon className="w-7 h-7 text-gold" />
                      </div>
                      <h3 className="font-semibold text-black mb-2">{option.title}</h3>
                      <p className="text-gold font-medium mb-2">{option.value}</p>
                      <p className="text-sm text-zinc-600 mb-4">{option.description}</p>
                      <Button variant="outline" size="sm" asChild className="w-full">
                        <a href={option.action} target={option.action.startsWith("http") ? "_blank" : undefined}>
                          {option.cta}
                        </a>
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Email Alias Display */}
            <motion.div variants={fadeInUp} className="mt-8 text-center">
              <div className="inline-flex items-center gap-3 px-6 py-4 rounded-xl bg-gold/10 border border-gold/30">
                <Mail className="w-6 h-6 text-gold" />
                <div className="text-left">
                  <p className="text-sm text-zinc-600">Happiness Team Email</p>
                  <a 
                    href="mailto:happiness@jbjglobalrealestate.com" 
                    className="text-gold font-semibold hover:underline"
                  >
                    happiness@jbjglobalrealestate.com
                  </a>
                </div>
              </div>
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
              <Card className="jj-card-inner border-none">
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
              We're Here to Help
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Our happiness team is committed to making your experience seamless.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <a href="#create-ticket">
                  <Ticket className="w-4 h-4 mr-2" />
                  Create New Ticket
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

export default CustomerHappinessCenter;
