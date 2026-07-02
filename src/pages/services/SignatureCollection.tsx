import { SectionEyebrow } from "@/components/ui/SectionEyebrow";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  PenTool,
  FileText,
  CheckCircle2,
  HelpCircle,
  Phone,
  Search,
  Send,
  Eye,
  ArrowRight,
  Upload,
  AlertCircle,
} from "lucide-react";
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
  { stage: 1, label: "Submitted", description: "Your request is received and queued.", icon: Send },
  { stage: 2, label: "Under Review", description: "Document verification and routing in progress.", icon: Eye },
  { stage: 3, label: "Signed", description: "Signature completed and being packaged.", icon: PenTool },
  { stage: 4, label: "Completed", description: "Final document is ready for secure delivery.", icon: CheckCircle2 },
];

const formHelperItems = [
  { icon: Upload, text: "Upload PDF only" },
  { icon: FileText, text: "Provide clear notes for what requires signature" },
  { icon: AlertCircle, text: "Ensure the document is final before submission" },
];

const faqData = [
  {
    question: "What documents can be submitted?",
    answer: "Only documents related to JBJ internal workflows and approved signature pathways.",
  },
  {
    question: "Can I submit a non-PDF document?",
    answer: "No. Convert to PDF before submission.",
  },
  {
    question: "Can I change the document after submission?",
    answer: "Submit a new request. The signed copy must match the approved version.",
  },
  {
    question: "How do I know it's signed?",
    answer: "Status will update to \"Signed\" then \"Completed.\"",
  },
  {
    question: "Can I request urgent signature?",
    answer: "Use the priority field and explain urgency in notes.",
  },
  {
    question: "Who can see my request?",
    answer: "Only authorized JBJ administrators and the relevant approvers.",
  },
  {
    question: "Can I delete a request?",
    answer: "Requests are tracked for audit. If a request is invalid, it can be closed with reason.",
  },
  {
    question: "Where do I receive the signed copy?",
    answer: "Delivery method is shown in your completion status and secure messaging flow.",
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
    toast.success("Signature request submitted successfully! You will receive a request ID and status timeline.");
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
    <div data-brand-emerald-page data-marketing-page style={{ background: "#010806" }}>
      <SEOHead
        title="Signature Collection | JBJ Global Real Estate"
        description="A controlled internal signature request workflow—tracked, timestamped, and audit-ready."
        canonicalPath="/services/signature-collection"
      />

      {/* HERO SECTION */}
      <section className="jj-hero-fullscreen jj-hero-compact relative flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-[#1A1A1A]">
          {/* Video placeholder - Controlled Approvals in One Workflow */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-gold/10 via-transparent to-transparent" />
        </div>
        
        <div className="absolute top-1/4 left-10 w-64 h-64 bg-[#EFE6D6]/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-10 w-96 h-96 bg-[#EFE6D6]/15 rounded-full blur-[120px] pointer-events-none" />

        <div className="container mx-auto px-4 relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center max-w-4xl mx-auto"
          >
                        <SectionEyebrow icon={PenTool} className="mb-6">Services</SectionEyebrow>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-6 tracking-[-0.02em]">
              Signature Collection (JBJ)
            </h1>
            
            <p className="text-white/85 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-10">
              A controlled internal signature request workflow—tracked, timestamped, and audit-ready.
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
          <span className="text-[#1A1A1A]/70 text-xs tracking-widest uppercase">Explore</span>
          <div className="w-[1px] h-12 bg-gradient-to-b from-gold/60 to-transparent" />
        </motion.div>
      </section>

      {/* WHAT THIS PAGE IS FOR */}
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-8"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              What This Page Is For
            </motion.h2>
            <motion.div variants={fadeInUp} className="jj-card-inner">
              <p className="text-[#1A1A1A]/70 text-lg leading-relaxed">
                This page is for signature requests tied to JBJ workflows where authorization, traceability, and document control matter.
              </p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* SIGNATURE REQUEST FORM */}
      <section id="submit-request" className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Submit Signature Request
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8">
              Submit your request with the document attached. You will receive a request ID and status timeline.
            </motion.p>
            
            {/* Form Helper Text */}
            <motion.div variants={fadeInUp} className="mb-8">
              <div className="jj-card-inner !bg-[#1A1A1A]/5 border border-[#B89555]/20">
                <div className="flex flex-col gap-3">
                  {formHelperItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm text-[#1A1A1A]/70">
                      <item.icon className="w-4 h-4 text-[#1A1A1A] shrink-0" />
                      <span>{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-none">
                <CardContent className="p-6">
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-[#1A1A1A]">Requester Name *</Label>
                        <Input
                          id="name"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          required
                          placeholder="Your full name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-[#1A1A1A]">Email *</Label>
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
                        <Label htmlFor="phone" className="text-[#1A1A1A]">Phone</Label>
                        <Input
                          id="phone"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+971 XX XXX XXXX"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="requestType" className="text-[#1A1A1A]">Request Type *</Label>
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
                      <Label htmlFor="priority" className="text-[#1A1A1A]">Priority</Label>
                      <Select
                        value={formData.priority}
                        onValueChange={(value) => setFormData({ ...formData, priority: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">High (Explain urgency in notes)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="document" className="text-[#1A1A1A]">Document Upload (PDF Only) *</Label>
                      <Input
                        id="document"
                        type="file"
                        accept=".pdf"
                        required
                        className="cursor-pointer"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes" className="text-[#1A1A1A]">Notes (What requires signature) *</Label>
                      <Textarea
                        id="notes"
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        placeholder="Provide clear notes for what requires signature..."
                        rows={4}
                        required
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
      <section className="bg-[#1A1A1A] py-20">
        <div className="jj-layer-2">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Status Timeline
            </motion.h2>
            <div className="max-w-4xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {statusTimeline.map((step, index) => (
                  <motion.div key={index} variants={fadeInUp}>
                    <div className="jj-card-inner text-center h-full">
                      <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[#1A1A1A] flex items-center justify-center border-2 border-[#B89555]">
                        <step.icon className="w-5 h-5 text-[#1A1A1A]" />
                      </div>
                      <h3 className="font-semibold text-[#1A1A1A] mb-2">{step.label}</h3>
                      <p className="text-sm text-[#1A1A1A]/70">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* TRACK REQUEST */}
      <section id="track-request" className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Track a Request
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 text-center mb-8">
              Enter your request ID and email to view the current status and any required actions.
            </motion.p>
            <motion.div variants={fadeInUp}>
              <Card className="jj-card-inner border-none">
                <CardContent className="p-6">
                  <form onSubmit={handleTrack} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="trackingId" className="text-[#1A1A1A]">Request ID *</Label>
                      <Input
                        id="trackingId"
                        value={trackingId}
                        onChange={(e) => setTrackingId(e.target.value)}
                        placeholder="e.g., SIG-2024-001"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="trackingEmail" className="text-[#1A1A1A]">Email *</Label>
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
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] text-center mb-12"
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
                    <AccordionTrigger className="text-left text-[#1A1A1A] hover:text-[#1A1A1A]">
                      <div className="flex items-center gap-3">
                        <HelpCircle className="w-5 h-5 text-[#1A1A1A] shrink-0" />
                        {faq.question}
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="text-[#1A1A1A]/70 pl-8">
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
      <section className="bg-[#1A1A1A] py-20">
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
              className="text-3xl md:text-4xl font-bold text-[#1A1A1A] mb-4"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Submit a signature request
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-[#1A1A1A]/70 mb-8">
              Upload your document and track status end-to-end.
            </motion.p>
            <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button variant="primary" size="lg" asChild>
                <a href="#submit-request">
                  Submit Signature Request
                  <ArrowRight className="w-4 h-4 ml-2" />
                </a>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <a href="#track-request">
                  <Search className="w-4 h-4 mr-2" />
                  Track a Request
                </a>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default SignatureCollection;
