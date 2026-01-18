import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Headphones,
  Upload,
  Send,
  User,
  Mail,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle,
  X,
  Image,
  Video,
  Copy,
  Check
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SERVICE_CATEGORIES = [
  "Property Listings",
  "Account & Login Issues",
  "Payment & Transactions",
  "Broker Portal",
  "AI Tools & Features",
  "Website Navigation",
  "Mobile App",
  "Document Management",
  "Communication (Email/WhatsApp)",
  "Technical Bug (Website/App)",
  "Other"
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "text-zinc-500", description: "Minor issue, no urgency" },
  { value: "normal", label: "Normal", color: "text-blue-500", description: "Standard priority" },
  { value: "high", label: "High", color: "text-orange-500", description: "Significant impact" },
  { value: "critical", label: "Critical", color: "text-red-500", description: "Blocking/Urgent" },
];

const SupportTicketBox = () => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    serviceCategory: "",
    subject: "",
    description: "",
    priority: "normal",
    escalateToTech: false,
  });
  const [attachments, setAttachments] = useState<File[]>([]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter(file => {
      const isValid = file.size <= 10 * 1024 * 1024; // 10MB limit
      if (!isValid) {
        toast.error(`${file.name} is too large. Max 10MB per file.`);
      }
      return isValid;
    });
    setAttachments(prev => [...prev, ...validFiles].slice(0, 5)); // Max 5 files
  };

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index));
  };

  const copyTicketNumber = () => {
    navigator.clipboard.writeText(ticketNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Ticket number copied!");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.serviceCategory || !formData.subject || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!formData.fullName || !formData.email) {
      toast.error("Please provide your name and email");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload attachments to storage (if any)
      const attachmentUrls: string[] = [];
      
      for (const file of attachments) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `support-tickets/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);

        if (!uploadError) {
          const { data: { publicUrl } } = supabase.storage
            .from('documents')
            .getPublicUrl(filePath);
          attachmentUrls.push(publicUrl);
        }
      }

      // Submit ticket via edge function
      const { data, error } = await supabase.functions.invoke('submit-support-ticket', {
        body: {
          fullName: formData.fullName,
          email: formData.email,
          phone: formData.phone || null,
          serviceCategory: formData.serviceCategory,
          subject: formData.subject,
          description: formData.description,
          priority: formData.priority,
          escalateToTech: formData.escalateToTech,
          attachmentUrls
        }
      });

      if (error) throw error;

      setTicketNumber(data.ticketNumber);
      setIsSubmitted(true);
      toast.success("Support ticket created successfully!");

    } catch (error) {
      console.error("Error submitting ticket:", error);
      toast.error("Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setTicketNumber("");
    setFormData({
      fullName: user?.email?.split('@')[0] || "",
      email: user?.email || "",
      phone: "",
      serviceCategory: "",
      subject: "",
      description: "",
      priority: "normal",
      escalateToTech: false,
    });
    setAttachments([]);
    setIsOpen(false);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <section className="py-16 md:py-20 bg-gradient-to-br from-zinc-900 via-black to-zinc-900">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-4xl mx-auto"
        >
          {/* Main Card */}
          <div className="bg-gradient-to-br from-white via-[#FDFBF7] to-[#F5F0E6] rounded-2xl border-2 border-gold/30 shadow-[0_0_40px_rgba(200,167,102,0.2)] overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="p-8 md:p-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left - Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Headphones className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <span className="text-xs uppercase tracking-[0.2em] text-red-500 font-semibold">24/7 Support</span>
                      <h2 className="text-2xl md:text-3xl font-bold text-black" style={{ fontFamily: "Poppins, sans-serif" }}>
                        Need Help?
                      </h2>
                    </div>
                  </div>

                  <p className="text-zinc-700 mb-6 leading-relaxed">
                    Experiencing an issue with our services? Create a support ticket and our team will 
                    assist you promptly. You can attach screenshots or screen recordings to help us 
                    understand the problem better.
                  </p>

                  {/* Support Promise */}
                  <div className="bg-black rounded-xl p-6 mb-6 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-gold/10 to-transparent" />
                    <div className="relative z-10">
                      <div className="flex items-center gap-2 mb-3">
                        <AlertCircle className="w-5 h-5 text-gold" />
                        <span className="text-gold font-semibold">Our Commitment</span>
                      </div>
                      <ul className="space-y-2 text-sm text-zinc-300">
                        <li className="flex items-center gap-2">
                          <span className="text-gold">✓</span>
                          Response within 24 hours
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-gold">✓</span>
                          Unique ticket number for tracking
                        </li>
                        <li className="flex items-center gap-2">
                          <span className="text-gold">✓</span>
                          Email confirmation with updates
                        </li>
                      </ul>
                    </div>
                  </div>

                  <p className="text-xs text-zinc-500">
                    All tickets are reviewed by our support team and forwarded to the relevant department.
                  </p>
                </div>

                {/* Right - CTA */}
                <div className="text-center md:text-right">
                  <Dialog open={isOpen} onOpenChange={setIsOpen}>
                    <DialogTrigger asChild>
                      <Button
                        className="bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0 px-8 py-6 text-lg font-semibold shadow-[0_0_20px_rgba(239,68,68,0.3)] hover:shadow-[0_0_30px_rgba(239,68,68,0.5)] transition-all duration-300"
                      >
                        <Headphones className="w-5 h-5 mr-2" />
                        Create Support Ticket
                      </Button>
                    </DialogTrigger>

                    <DialogContent className="bg-white border-zinc-200 max-w-lg max-h-[90vh] overflow-y-auto">
                      <DialogHeader>
                        <DialogTitle className="text-black text-xl font-bold flex items-center gap-2">
                          <Headphones className="w-5 h-5 text-red-500" />
                          {isSubmitted ? "Ticket Created!" : "Create Support Ticket"}
                        </DialogTitle>
                      </DialogHeader>

                      <AnimatePresence mode="wait">
                        {isSubmitted ? (
                          <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="py-8 text-center"
                          >
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                              <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>
                            <h3 className="text-xl font-bold text-black mb-2">We've Got Your Ticket!</h3>
                            <p className="text-zinc-600 mb-6">
                              We're sorry you're experiencing issues. Our team is on it!
                            </p>

                            {/* Ticket Number Box */}
                            <div className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/40 rounded-xl p-6 mb-6">
                              <p className="text-sm text-zinc-600 mb-2">Your Ticket Number</p>
                              <div className="flex items-center justify-center gap-3">
                                <span className="text-2xl font-bold text-gold tracking-wider">{ticketNumber}</span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={copyTicketNumber}
                                  className="hover:bg-gold/10"
                                >
                                  {copied ? (
                                    <Check className="w-5 h-5 text-green-500" />
                                  ) : (
                                    <Copy className="w-5 h-5 text-gold" />
                                  )}
                                </Button>
                              </div>
                            </div>

                            <p className="text-sm text-zinc-500 mb-4">
                              A confirmation email has been sent to <strong>{formData.email}</strong>
                            </p>

                            <Button
                              onClick={resetForm}
                              className="bg-black text-white hover:bg-zinc-800"
                            >
                              Close
                            </Button>
                          </motion.div>
                        ) : (
                          <motion.form
                            key="form"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onSubmit={handleSubmit}
                            className="space-y-4 py-4"
                          >
                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div>
                                <Label className="text-zinc-700 flex items-center gap-2">
                                  <User className="w-4 h-4 text-gold" />
                                  Full Name *
                                </Label>
                                <Input
                                  placeholder="John Doe"
                                  value={formData.fullName}
                                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                                  className="mt-1 border-zinc-300 focus:border-gold"
                                  required
                                />
                              </div>
                              <div>
                                <Label className="text-zinc-700 flex items-center gap-2">
                                  <Mail className="w-4 h-4 text-gold" />
                                  Email *
                                </Label>
                                <Input
                                  type="email"
                                  placeholder="john@example.com"
                                  value={formData.email}
                                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                  className="mt-1 border-zinc-300 focus:border-gold"
                                  required
                                />
                              </div>
                            </div>

                            <div>
                              <Label className="text-zinc-700 flex items-center gap-2">
                                <Phone className="w-4 h-4 text-gold" />
                                Phone Number (Optional)
                              </Label>
                              <Input
                                type="tel"
                                placeholder="+971 50 123 4567"
                                value={formData.phone}
                                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                className="mt-1 border-zinc-300 focus:border-gold"
                              />
                            </div>

                            {/* Service Category */}
                            <div>
                              <Label className="text-zinc-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-red-500" />
                                Service with Issue *
                              </Label>
                              <Select
                                value={formData.serviceCategory}
                                onValueChange={(value) => setFormData({ ...formData, serviceCategory: value })}
                              >
                                <SelectTrigger className="mt-1 border-zinc-300 focus:border-gold">
                                  <SelectValue placeholder="Select the service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {SERVICE_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Subject */}
                            <div>
                              <Label className="text-zinc-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gold" />
                                Subject *
                              </Label>
                              <Input
                                placeholder="Brief description of the issue"
                                value={formData.subject}
                                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                className="mt-1 border-zinc-300 focus:border-gold"
                                required
                              />
                            </div>

                            {/* Priority Selection */}
                            <div>
                              <Label className="text-zinc-700 flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 text-orange-500" />
                                Priority Level
                              </Label>
                              <Select
                                value={formData.priority}
                                onValueChange={(value) => setFormData({ ...formData, priority: value })}
                              >
                                <SelectTrigger className="mt-1 border-zinc-300 focus:border-gold">
                                  <SelectValue placeholder="Select priority" />
                                </SelectTrigger>
                                <SelectContent>
                                  {PRIORITY_LEVELS.map((level) => (
                                    <SelectItem key={level.value} value={level.value}>
                                      <span className={`font-medium ${level.color}`}>{level.label}</span>
                                      <span className="text-zinc-400 text-xs ml-2">- {level.description}</span>
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            {/* Description */}
                            <div>
                              <Label className="text-zinc-700">
                                Detailed Description *
                              </Label>
                              <Textarea
                                placeholder="Please describe the issue in detail. Include steps to reproduce, expected behavior, and what actually happened..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 min-h-[120px] border-zinc-300 focus:border-gold"
                                required
                              />
                            </div>

                            {/* Escalate to Tech Team Option */}
                            {(formData.serviceCategory === "Technical Bug (Website/App)" || formData.serviceCategory === "AI Tools & Features") && (
                              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-zinc-50 rounded-lg border border-blue-200">
                                <input
                                  type="checkbox"
                                  id="escalate-tech"
                                  checked={formData.escalateToTech}
                                  onChange={(e) => setFormData({ ...formData, escalateToTech: e.target.checked })}
                                  className="w-5 h-5 rounded border-blue-300 text-blue-500 focus:ring-blue-500"
                                />
                                <label htmlFor="escalate-tech" className="text-sm text-zinc-700">
                                  <span className="font-medium text-blue-600">Escalate to Web Developer / Lovable AI</span>
                                  <span className="block text-xs text-zinc-500">For direct technical fix</span>
                                </label>
                              </div>
                            )}

                            {/* File Upload */}
                            <div>
                              <Label className="text-zinc-700 flex items-center gap-2">
                                <Upload className="w-4 h-4 text-gold" />
                                Attachments (Optional)
                              </Label>
                              <div className="mt-1 border-2 border-dashed border-zinc-300 rounded-lg p-4 text-center hover:border-gold transition-colors">
                                <input
                                  type="file"
                                  id="file-upload"
                                  className="hidden"
                                  multiple
                                  accept="image/*,video/*,.pdf,.doc,.docx"
                                  onChange={handleFileChange}
                                />
                                <label
                                  htmlFor="file-upload"
                                  className="cursor-pointer flex flex-col items-center gap-2"
                                >
                                  <Upload className="w-8 h-8 text-zinc-400" />
                                  <span className="text-sm text-zinc-600">
                                    Click to upload screenshots, videos, or documents
                                  </span>
                                  <span className="text-xs text-zinc-400">
                                    Max 10MB per file, up to 5 files
                                  </span>
                                </label>
                              </div>

                              {/* Attachment List */}
                              {attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {attachments.map((file, index) => (
                                    <div
                                      key={index}
                                      className="flex items-center justify-between bg-zinc-50 rounded-lg px-3 py-2"
                                    >
                                      <div className="flex items-center gap-2">
                                        {getFileIcon(file)}
                                        <span className="text-sm text-zinc-700 truncate max-w-[200px]">
                                          {file.name}
                                        </span>
                                        <span className="text-xs text-zinc-400">
                                          ({(file.size / 1024 / 1024).toFixed(2)}MB)
                                        </span>
                                      </div>
                                      <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6"
                                        onClick={() => removeAttachment(index)}
                                      >
                                        <X className="w-4 h-4" />
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 border-0 py-6"
                            >
                              {isSubmitting ? (
                                <>Submitting...</>
                              ) : (
                                <>
                                  <Send className="w-4 h-4 mr-2" />
                                  Create Ticket & Notify Support
                                </>
                              )}
                            </Button>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </DialogContent>
                  </Dialog>

                  <p className="text-sm text-zinc-500 mt-4">
                    Email: <span className="text-gold font-medium">Support@JBJ.ae</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default SupportTicketBox;
