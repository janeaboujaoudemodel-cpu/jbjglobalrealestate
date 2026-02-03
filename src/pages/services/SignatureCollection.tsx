import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PenTool,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Clock,
  Search,
  Send,
  Eye,
  Shield,
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

const statusTimeline = [
  { stage: 1, label: "Submitted", description: "Request received and logged" },
  { stage: 2, label: "Under Review", description: "Document being reviewed" },
  { stage: 3, label: "Signed", description: "Signature applied" },
  { stage: 4, label: "Completed", description: "Ready for collection/delivery" },
];

const faqData = [
  {
    question: "What types of documents can be signed?",
    answer: "Letters, internal approvals, client documents, and other official JBJ correspondence requiring authorized signatures.",
  },
  {
    question: "How long does the signature process take?",
    answer: "Standard requests are processed within 2-3 business days. Priority requests may be expedited based on urgency and document type.",
  },
  {
    question: "Who can submit a signature request?",
    answer: "JBJ team members and authorized clients can submit signature requests through this portal.",
  },
  {
    question: "How do I track my request?",
    answer: "Use the 'Track Request' feature with your request ID and email to check the current status of your submission.",
  },
  {
    question: "Can I cancel or modify a request?",
    answer: "Requests can be modified or cancelled before entering the 'Signed' stage. Contact support for assistance.",
  },
  {
    question: "Is there a limit on document size?",
    answer: "Documents should be PDF format and under 10MB. For larger files, please contact support.",
  },
  {
    question: "Are signatures legally binding?",
    answer: "Yes, authorized signatures from JBJ Global Real Estate are legally binding for official company documents.",
  },
  {
    question: "What if my request is rejected?",
    answer: "You'll receive notification with the reason for rejection and guidance on how to resubmit if applicable.",
  },
];

const SignatureCollection = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    requestType: "",
    priority: "normal",
    notes: "",
  });

  const [trackingId, setTrackingId] = useState("");
  const [trackingEmail, setTrackingEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Signature request submitted successfully! You will receive a confirmation email shortly.");
    setFormData({
      name: "",
      email: "",
      phone: "",
      requestType: "",
      priority: "normal",
      notes: "",
    });
  };

  const handleTrack = (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingId || !trackingEmail) {
      toast.error("Please enter both request ID and email");
      return;
    }
    toast.info("Tracking feature coming soon. Please contact support for status updates.");
  };

  return (
    <>
      <SEOHead
        title="Signature Collection | JBJ Global Real Estate"
        description="Internal signature request workflow for JBJ documents. Submit, track, and manage signature requests with full audit trail."
        canonicalPath="/services/signature-collection"
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
              <PenTool className="w-4 h-4 text-gold" />
              <span className="text-gold font-semibold text-xs uppercase tracking-[0.2em]">
                Services
              </span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Signature Collection (JBJ)
            </h1>
            
            <p className="text-zinc-300 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A controlled internal signature-request workflow for JBJ documents — tracked, timestamped, and auditable.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <PremiumHeroButton href="#submit-request">
                Submit Signature Request
              </PremiumHeroButton>
              <PremiumHeroButton href="#track-request">
                Track a Request
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

      {/* SIGNATURE REQUEST FORM */}
      <section id="submit-request" className="bg-black py-20">
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
              Submit Signature Request
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-none">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-black">Requester Name *</Label>
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
                        <Label htmlFor="requestType" className="text-black">Request Type *</Label>
                        <Select
                          value={formData.requestType}
                          onValueChange={(value) => setFormData({ ...formData, requestType: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="letter">Letter</SelectItem>
                            <SelectItem value="internal-approval">Internal Approval</SelectItem>
                            <SelectItem value="client-document">Client Document</SelectItem>
                            <SelectItem value="other">Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="priority" className="text-black">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document" className="text-black">Document Upload (PDF) *</Label>
                      <Input
                        id="document"
                        type="file"
                        accept=".pdf"
                        required
                        className="cursor-pointer"
                      />
                      <p className="text-xs text-zinc-500">Maximum file size: 10MB</p>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-black">Notes</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Any additional information..."
                        rows={4}
                      />
                    </div>

                    <Button type="submit" variant="primary" size="lg" className="w-full">
                      <Send className="w-4 h-4 mr-2" />
                      Submit Request
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* STATUS TIMELINE */}
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
              Request Status Timeline
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statusTimeline.map((step, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <div className="jj-card-inner text-center h-full">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-black flex items-center justify-center border-2 border-gold">
                        <span className="text-gold font-bold">{step.stage}</span>
                      </div>
                      <h3 className="font-semibold text-black mb-2">{step.label}</h3>
                      <p className="text-sm text-zinc-600">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRACK REQUEST */}
      <section id="track-request" className="bg-black py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="max-w-xl mx-auto"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-black text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Track Your Request
            </motion.h2>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-none">
                <CardContent className="p-6">
                  <form onSubmit={handleTrack} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId" className="text-black">Request ID *</Label>
                      <Input
                        id="trackingId"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="e.g., SIG-2024-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trackingEmail" className="text-black">Email *</Label>
                      <Input
                        id="trackingEmail"
                        type="email"
                        value={trackingEmail}
                        onChange={(e) => setTrackingEmail(e.target.value)}
                        placeholder="your@email.com"
                        required
                      />
                    </div>
                    <Button type="submit" variant="outline" size="lg" className="w-full">
                      <Search className="w-4 h-4 mr-2" />
                      Track Request
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
              Need Assistance?
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-zinc-600 mb-8">
              Contact our team for help with signature requests.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <a href="#submit-request">
                  <PenTool className="w-4 h-4 mr-2" />
                  Submit New Request
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/contact">
                  <Phone className="w-4 h-4 mr-2" />
                  Contact Support
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

export default SignatureCollection;
