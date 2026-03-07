import React, { useState, useEffect } from "react";
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
  Check,
  Mic,
  Plus,
  Loader2,
  RefreshCw,
  AlertTriangle,
  MailCheck,
  MessageCircle
} from "lucide-react";
import { useResendTicketConfirmation } from "@/hooks/useResendTicketConfirmation";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import VoiceNoteRecorder from "@/components/crm/VoiceNoteRecorder";
import { CONTACT_INFO } from "@/constants/stats";

const SERVICE_CATEGORIES = [
  "Inquiry Request",
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
  "Property Search Issues",
  "Viewing & Appointments",
  "Dashboard & Reports",
  "Notifications & Alerts",
  "Profile & Settings",
  "CRM Features",
  "Marketing Tools",
  "Analytics & Insights",
  "Integration Issues",
  "Performance & Speed",
  "Other"
];

const PRIORITY_LEVELS = [
  { value: "low", label: "Low", color: "text-green-500", description: "Minor issue, no urgency" },
  { value: "normal", label: "Normal", color: "text-blue-500", description: "Standard priority" },
  { value: "high", label: "High", color: "text-orange-500", description: "Significant impact" },
  { value: "critical", label: "Critical", color: "text-red-500", description: "Blocking/Urgent" },
];

type SubmissionStep = 'idle' | 'uploading' | 'creating' | 'confirming';
type UploadStatus = 'pending' | 'uploading' | 'done' | 'error';

const STEP_MESSAGES: Record<SubmissionStep, string> = {
  idle: '',
  uploading: 'Uploading attachments...',
  creating: 'Creating your ticket...',
  confirming: 'Sending confirmation...'
};

const SupportTicketBox = () => {
  const { user } = useAuth();
  const { resendConfirmation, isResending } = useResendTicketConfirmation();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [ticketNumber, setTicketNumber] = useState("");
  const [copied, setCopied] = useState(false);
  const [emailWasSent, setEmailWasSent] = useState(true);
  const [emailResent, setEmailResent] = useState(false);
  
  // Enhanced loading states
  const [submissionStep, setSubmissionStep] = useState<SubmissionStep>('idle');
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [uploadStatuses, setUploadStatuses] = useState<Record<number, UploadStatus>>({});
  
  // Get user metadata for pre-filling
  const userMeta = (user?.user_metadata ?? {}) as Record<string, unknown>;
  const userName = (typeof userMeta.full_name === "string" ? userMeta.full_name : null) ||
                   (typeof userMeta.name === "string" ? userMeta.name : null) ||
                   (user?.email ? user.email.split("@")[0] : "");
  
  const [formData, setFormData] = useState({
    fullName: userName,
    email: user?.email || "",
    phone: "",
    serviceCategory: "",
    otherCategoryDetail: "",
    subject: "",
    description: "",
    priority: "normal",
    escalateToTech: false,
  });
  const [attachments, setAttachments] = useState<File[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Pre-fill form when user logs in or dialog opens
  React.useEffect(() => {
    if (user && isOpen) {
      setFormData(prev => ({
        ...prev,
        fullName: prev.fullName || userName,
        email: prev.email || user.email || "",
      }));
    }
  }, [user, isOpen, userName]);

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

  const handleVoiceTranscript = (text: string, field: 'subject' | 'description') => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field] ? `${prev[field]} ${text}` : text
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous error
    setSubmissionError(null);

    // Validate all required fields with inline error messages
    const errors: Record<string, string> = {};
    
    if (!formData.serviceCategory) {
      errors.serviceCategory = "Please select a service category";
    }
    if (!formData.subject) {
      errors.subject = "Subject is required";
    }
    if (!formData.description) {
      errors.description = "Description is required";
    }
    if (!formData.fullName) {
      errors.fullName = "Full name is required";
    }
    if (!formData.email) {
      errors.email = "Email is required";
    }
    if (formData.serviceCategory === "Other" && !formData.otherCategoryDetail.trim()) {
      errors.otherCategoryDetail = "Please specify the type of issue";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});

    setIsSubmitting(true);
    
    // Initialize upload statuses
    if (attachments.length > 0) {
      const initialStatuses: Record<number, UploadStatus> = {};
      attachments.forEach((_, idx) => {
        initialStatuses[idx] = 'pending';
      });
      setUploadStatuses(initialStatuses);
      setSubmissionStep('uploading');
    } else {
      setSubmissionStep('creating');
    }

    try {
      // Upload attachments to storage (if any)
      const attachmentUrls: string[] = [];
      
      for (let i = 0; i < attachments.length; i++) {
        const file = attachments[i];
        setUploadStatuses(prev => ({ ...prev, [i]: 'uploading' }));
        
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${fileName}`;

        try {
          // Use secure support-attachments bucket with proper RLS
          const { error: uploadError } = await supabase.storage
            .from('support-attachments')
            .upload(filePath, file);

          if (!uploadError) {
            const { data: { publicUrl } } = supabase.storage
              .from('support-attachments')
              .getPublicUrl(filePath);
            attachmentUrls.push(publicUrl);
            setUploadStatuses(prev => ({ ...prev, [i]: 'done' }));
          } else {
            setUploadStatuses(prev => ({ ...prev, [i]: 'error' }));
          }
        } catch {
          setUploadStatuses(prev => ({ ...prev, [i]: 'error' }));
        }
      }

      // Update step to creating
      setSubmissionStep('creating');

      // Build category with "Other" detail
      const fullCategory = formData.serviceCategory === "Other" 
        ? `Other: ${formData.otherCategoryDetail}`
        : formData.serviceCategory;

      // Submit ticket via edge function with retry logic
      let response;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          response = await supabase.functions.invoke('submit-support-ticket', {
            body: {
              fullName: formData.fullName,
              email: formData.email,
              phone: formData.phone || null,
              serviceCategory: fullCategory,
              subject: formData.subject,
              description: formData.description,
              priority: formData.priority,
              escalateToTech: formData.escalateToTech,
              attachmentUrls
            }
          });

          if (!response.error) break;
          retryCount++;
          if (retryCount <= maxRetries) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        } catch (fetchError) {
          retryCount++;
          if (retryCount > maxRetries) throw fetchError;
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (response?.error) throw response.error;

      // Update step to confirming (no artificial delay)
      setSubmissionStep('confirming');

      const responseData = response?.data;
      setTicketNumber(responseData?.ticketNumber || "");
      setEmailWasSent(responseData?.customerEmailSent ?? false);
      setEmailResent(false);
      setIsSubmitted(true);
      setSubmissionStep('idle');

      // If this was an Inquiry Request, also save to inquiries table
      if (formData.serviceCategory === "Inquiry Request") {
        try {
          await supabase.from('inquiries').insert({
            full_name: formData.fullName,
            email: formData.email,
            phone: formData.phone || null,
            inquiry_type: 'General Inquiry',
            subject: formData.subject,
            message: formData.description,
            source: 'Support Ticket',
            status: 'pending',
          });
        } catch (inquiryErr) {
          console.warn('Inquiry hub insert from ticket failed:', inquiryErr);
        }
      }
      
      // Show success with accurate email status
      if (responseData?.customerEmailSent) {
        toast.success("Support ticket created! Confirmation email sent.");
      } else {
        toast.warning("Ticket created, but email failed", {
          description: responseData?.customerEmailError || "Please save your ticket number. You can resend the email below."
        });
      }

    } catch (error) {
      console.error("Error submitting ticket:", error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to submit ticket. Please try again.";
      setSubmissionError(errorMessage);
      setSubmissionStep('idle');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRetry = () => {
    setSubmissionError(null);
    // Create a synthetic form event for retry
    const syntheticEvent = { preventDefault: () => {} } as React.FormEvent;
    handleSubmit(syntheticEvent);
  };

  const resetForm = () => {
    setIsSubmitted(false);
    setTicketNumber("");
    setSubmissionError(null);
    setSubmissionStep('idle');
    setUploadStatuses({});
    setFieldErrors({});
    setEmailWasSent(true);
    setEmailResent(false);
    setFormData({
      fullName: user?.email?.split('@')[0] || "",
      email: user?.email || "",
      phone: "",
      serviceCategory: "",
      otherCategoryDetail: "",
      subject: "",
      description: "",
      priority: "normal",
      escalateToTech: false,
    });
    setAttachments([]);
    setIsOpen(false);
  };

  const submitAnotherTicket = () => {
    setIsSubmitted(false);
    setTicketNumber("");
    setSubmissionError(null);
    setSubmissionStep('idle');
    setUploadStatuses({});
    setFieldErrors({});
    setEmailWasSent(true);
    setEmailResent(false);
    setFormData({
      fullName: formData.fullName,
      email: formData.email,
      phone: formData.phone,
      serviceCategory: "",
      otherCategoryDetail: "",
      subject: "",
      description: "",
      priority: "normal",
      escalateToTech: false,
    });
    setAttachments([]);
  };

  const getUploadStatusIcon = (index: number) => {
    const status = uploadStatuses[index];
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 text-gold animate-spin" />;
      case 'done':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return <Image className="w-4 h-4" />;
    if (file.type.startsWith('video/')) return <Video className="w-4 h-4" />;
    return <FileText className="w-4 h-4" />;
  };

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          {/* Main Card - Full width inside champagne layer, no max-w constraint */}
          <div className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-xl md:rounded-2xl border border-gold/40 md:border-2 md:border-gold shadow-[0_8px_30px_rgba(200,167,102,0.35),0_4px_15px_rgba(0,0,0,0.15)] overflow-hidden relative">
            {/* Decorative elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-red-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gold/10 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />

            <div className="p-8 md:p-12 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
                {/* Left - Info */}
                <div>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-red-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                       <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 64 64" fill="none" className="text-white">
                         {/* Headband */}
                         <path d="M10 32 C10 14, 54 14, 54 32" stroke="currentColor" strokeWidth="4.5" strokeLinecap="round" fill="none"/>
                         {/* Headband inner highlight */}
                         <path d="M14 32 C14 18, 50 18, 50 32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.3" fill="none"/>
                         {/* Left arm */}
                         <path d="M10 32 L10 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                         {/* Right arm */}
                         <path d="M54 32 L54 40" stroke="currentColor" strokeWidth="4" strokeLinecap="round"/>
                         {/* Left ear cup */}
                         <rect x="2" y="36" width="16" height="22" rx="8" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5"/>
                         <rect x="5" y="39" width="10" height="16" rx="5" fill="currentColor" opacity="0.12"/>
                         {/* Right ear cup */}
                         <rect x="46" y="36" width="16" height="22" rx="8" fill="currentColor" opacity="0.2" stroke="currentColor" strokeWidth="2.5"/>
                         <rect x="49" y="39" width="10" height="16" rx="5" fill="currentColor" opacity="0.12"/>
                         {/* Crown highlight */}
                         <ellipse cx="32" cy="15" rx="7" ry="2" fill="currentColor" opacity="0.18"/>
                       </svg>
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
                        <li className="flex items-center gap-2">
                          <span className="text-gold">✓</span>
                          Voice note support for convenience
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
                        className="relative bg-gradient-to-r from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] text-black border-2 border-gold/50 px-10 py-7 text-lg font-bold rounded-xl transition-all duration-300 hover:scale-105 transform active:scale-95 group"
                        style={{
                          textShadow: 'none',
                          boxShadow: `
                            0 10px 30px rgba(200,167,102,0.4),
                            0 6px 15px rgba(0,0,0,0.2),
                            inset 0 2px 4px rgba(255,255,255,0.9),
                            inset 0 -2px 4px rgba(200,167,102,0.2),
                            0 0 20px rgba(200,167,102,0.3)
                          `,
                        }}
                      >
                        {/* 3D Top highlight */}
                        <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                        {/* 3D Bottom shadow */}
                        <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                        {/* Glow effect on hover */}
                        <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                        <span className="relative flex items-center gap-2">
                          <Headphones className="w-6 h-6 text-gold" />
                          <span className="text-gold">Create</span>
                          <span className="text-black">Support Ticket</span>
                        </span>
                      </Button>
                    </DialogTrigger>

                      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold max-w-2xl max-h-[90vh] z-[10050] flex flex-col overflow-hidden shadow-[0_8px_40px_rgba(200,167,102,0.4),0_4px_20px_rgba(0,0,0,0.2)] p-0 fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                      <DialogHeader className="flex-shrink-0 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] z-10 pb-4 px-6 pt-6 border-b border-gold/20">
                        <DialogTitle className="text-black text-xl font-bold flex items-center gap-2">
                          <Headphones className="w-5 h-5 text-red-500" />
                          {isSubmitted ? "Ticket Created!" : "Create Support Ticket"}
                        </DialogTitle>
                      </DialogHeader>

                      <div ref={(el) => { if (el && isSubmitted) el.scrollTop = 0; }} className={`px-6 pb-6 ${isSubmitted ? '' : 'flex-1 overflow-y-auto pr-4 -webkit-overflow-scrolling-touch'}`}>
                        <AnimatePresence mode="wait">
                          {isSubmitted ? (
                            <motion.div
                              key="success"
                              initial={{ opacity: 0, scale: 0.8, y: 20 }}
                              animate={{ opacity: 1, scale: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ type: "spring", stiffness: 200, damping: 20 }}
                              className="py-4 text-center"
                            >
                              {/* Animated success icon with pulsing glow */}
                              <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
                                className="relative w-24 h-24 mx-auto mb-6"
                              >
                                {/* Pulsing glow ring */}
                                <motion.div
                                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.2, 0.5] }}
                                  transition={{ duration: 2, repeat: Infinity }}
                                  className="absolute inset-0 bg-green-400/30 rounded-full"
                                />
                                <div className="relative w-full h-full bg-gradient-to-br from-green-100 to-green-200 rounded-full flex items-center justify-center shadow-lg">
                                  <motion.div
                                    initial={{ scale: 0, rotate: -180 }}
                                    animate={{ scale: 1, rotate: 0 }}
                                    transition={{ delay: 0.4, type: "spring", stiffness: 200 }}
                                  >
                                    <CheckCircle className="w-12 h-12 text-green-500" />
                                  </motion.div>
                                </div>
                              </motion.div>

                              <motion.h3 
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 }}
                                className="text-xl font-bold text-black mb-2"
                              >
                                We've Got Your Ticket!
                              </motion.h3>
                              <motion.p 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: 0.4 }}
                                className="text-zinc-600 mb-6"
                              >
                                We're sorry you're experiencing issues. Our team is on it!
                              </motion.p>

                               {/* Ticket Number Box */}
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: 0.5 }}
                                 className="bg-gradient-to-r from-gold/10 via-gold/5 to-gold/10 border border-gold/40 rounded-xl p-6 mb-4"
                               >
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
                               </motion.div>

                               {/* Ticket Summary Card */}
                               <motion.div
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: 0.55 }}
                                 className="bg-white border border-gold/30 rounded-xl p-4 mb-4 text-left"
                               >
                                 <p className="text-sm font-bold text-black mb-3 flex items-center gap-2">
                                   <FileText className="w-4 h-4 text-gold" />
                                   Ticket Summary
                                 </p>
                                 <div className="space-y-2 text-xs">
                                   <div className="flex justify-between">
                                     <span className="text-zinc-500">Ticket #</span>
                                     <span className="text-black font-semibold">{ticketNumber}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-zinc-500">Category</span>
                                     <span className="text-black font-medium">{formData.serviceCategory}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-zinc-500">Subject</span>
                                     <span className="text-black font-medium truncate max-w-[180px]">{formData.subject}</span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-zinc-500">Priority</span>
                                     <span className={`font-medium ${
                                       formData.priority === 'critical' ? 'text-red-500' :
                                       formData.priority === 'high' ? 'text-orange-500' :
                                       formData.priority === 'normal' ? 'text-blue-500' : 'text-green-500'
                                     }`}>
                                       {formData.priority.charAt(0).toUpperCase() + formData.priority.slice(1)}
                                     </span>
                                   </div>
                                   <div className="flex justify-between">
                                     <span className="text-zinc-500">Submitted</span>
                                     <span className="text-black font-medium">{new Date().toLocaleDateString()}</span>
                                   </div>
                                   {attachments.length > 0 && (
                                     <div className="flex justify-between">
                                       <span className="text-zinc-500">Attachments</span>
                                       <span className="text-black font-medium">{attachments.length} file(s)</span>
                                     </div>
                                   )}
                                 </div>
                                 <Button
                                   variant="ghost"
                                   size="sm"
                                   onClick={() => {
                                     const summary = `Ticket: ${ticketNumber}\nCategory: ${formData.serviceCategory}\nSubject: ${formData.subject}\nPriority: ${formData.priority}\nDate: ${new Date().toLocaleDateString()}`;
                                     navigator.clipboard.writeText(summary);
                                     toast.success("Ticket summary copied!");
                                   }}
                                   className="mt-3 w-full text-gold hover:bg-gold/10 text-xs"
                                 >
                                   <Copy className="w-3 h-3 mr-1" /> Copy Full Summary
                                 </Button>
                               </motion.div>

                               {/* Email Status & Resend Button */}
                               <motion.div 
                                 initial={{ opacity: 0 }}
                                 animate={{ opacity: 1 }}
                                 transition={{ delay: 0.6 }}
                                 className="mb-4"
                               >
                                 {emailWasSent || emailResent ? (
                                   <p className="text-sm text-zinc-500 flex items-center justify-center gap-2">
                                     <MailCheck className="w-4 h-4 text-green-500" />
                                     Confirmation email {emailResent ? "resent" : "sent"} to <strong>{formData.email}</strong>
                                   </p>
                                 ) : (
                                   <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
                                     <div className="flex items-center justify-center gap-2 text-amber-700 mb-2">
                                       <AlertTriangle className="w-4 h-4" />
                                       <span className="text-sm font-medium">Email delivery failed</span>
                                     </div>
                                     <p className="text-xs text-amber-600 mb-3">
                                       We couldn't send the confirmation email. Please save your ticket number above.
                                     </p>
                                     <Button
                                       onClick={async () => {
                                         const result = await resendConfirmation(ticketNumber, formData.email);
                                         if (result.success) {
                                           setEmailResent(true);
                                         }
                                       }}
                                       disabled={isResending}
                                       variant="outline"
                                       size="sm"
                                       className="border-amber-400 text-amber-700 hover:bg-amber-100"
                                     >
                                       {isResending ? (
                                         <>
                                           <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                           Sending...
                                         </>
                                       ) : (
                                         <>
                                           <RefreshCw className="w-4 h-4 mr-2" />
                                           Resend Confirmation Email
                                         </>
                                       )}
                                     </Button>
                                   </div>
                                 )}
                               </motion.div>

                               {/* Quick Actions - Explore while waiting */}
                               <motion.div
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: 0.65 }}
                                 className="bg-gradient-to-br from-[#FDFBF7] to-[#F5F0E6] border border-gold/30 rounded-xl p-4 mb-4"
                               >
                                 <p className="text-sm font-bold text-black mb-3 text-center">⏳ Explore While You Wait</p>
                                 <div className="grid grid-cols-2 gap-2">
                                   <a href="/properties" className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white border border-gold/30 rounded-lg text-xs font-semibold text-black hover:border-gold transition-colors">
                                     🏠 Properties
                                   </a>
                                   <a href="/ai-hub" className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white border border-gold/30 rounded-lg text-xs font-semibold text-black hover:border-gold transition-colors">
                                     🤖 AI Tools
                                   </a>
                                   <a href="/buyer-guide" className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white border border-gold/30 rounded-lg text-xs font-semibold text-black hover:border-gold transition-colors">
                                     📖 Guides
                                   </a>
                                   <a href="/careers" className="flex items-center justify-center gap-1 px-3 py-2.5 bg-white border border-gold/30 rounded-lg text-xs font-semibold text-black hover:border-gold transition-colors">
                                     💼 Careers
                                   </a>
                                 </div>
                               </motion.div>

                               {/* Action Buttons */}
                               <motion.div 
                                 initial={{ opacity: 0, y: 10 }}
                                 animate={{ opacity: 1, y: 0 }}
                                 transition={{ delay: 0.7 }}
                                 className="space-y-3"
                               >
                                 <Button
                                   onClick={submitAnotherTicket}
                                   variant="secondary"
                                   className="w-full"
                                 >
                                   <Plus className="w-4 h-4 mr-2" />
                                   Have Another Problem? Submit Another Ticket
                                 </Button>
                                 <Button
                                   onClick={resetForm}
                                   variant="dark"
                                   className="w-full"
                                 >
                                   Close
                                 </Button>
                               </motion.div>
                            </motion.div>
                          ) : (
                            <motion.form
                              key="form"
                              initial={{ opacity: 0 }}
                              animate={{ opacity: 1 }}
                              exit={{ opacity: 0 }}
                              onSubmit={handleSubmit}
                              className="space-y-4 py-4 relative"
                            >
                              {/* Form Overlay During Submission - Fixed centered, non-scrollable */}
                              <AnimatePresence>
                                {isSubmitting && (
                                  <motion.div
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[10100] flex items-center justify-center"
                                  >
                                    <motion.div
                                      initial={{ scale: 0.8, opacity: 0 }}
                                      animate={{ scale: 1, opacity: 1 }}
                                      className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl p-10 shadow-[0_8px_40px_rgba(200,167,102,0.4)] border-2 border-gold text-center flex flex-col items-center max-w-sm mx-4"
                                    >
                                      <img 
                                        src="/jbj-monogram-dark-on-light.png" 
                                        alt="JBJ" 
                                        className="w-20 h-20 object-contain animate-pulse mb-6"
                                        style={{ filter: 'drop-shadow(0 0 12px rgba(200,167,102,0.5))' }}
                                      />
                                      
                                      {/* Upload progress for each file */}
                                      {attachments.length > 0 && submissionStep === 'uploading' && (
                                        <div className="w-full mb-4 space-y-2">
                                          {attachments.map((file, idx) => (
                                            <div key={idx} className="flex items-center gap-2 text-xs">
                                              {getUploadStatusIcon(idx)}
                                              <span className="text-zinc-600 truncate flex-1 text-left">{file.name}</span>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                      
                                      <motion.p
                                        key={submissionStep}
                                        initial={{ opacity: 0, y: 5 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="text-base font-semibold text-black"
                                      >
                                        {STEP_MESSAGES[submissionStep]}
                                      </motion.p>
                                      <p className="text-sm text-zinc-500 mt-2">Please wait...</p>
                                      
                                      {/* Animated progress bar */}
                                      <div className="w-full mt-4 h-1.5 bg-gold/20 rounded-full overflow-hidden">
                                        <motion.div
                                          className="h-full bg-gradient-to-r from-gold to-gold/70 rounded-full"
                                          animate={{ width: ['0%', '100%'] }}
                                          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                        />
                                      </div>
                                    </motion.div>
                                  </motion.div>
                                )}
                              </AnimatePresence>

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
                                  className="mt-1 bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg"
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
                                  className="mt-1 bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg"
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
                                className="mt-1 bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg"
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
                                onValueChange={(value) => {
                                  setFormData({ ...formData, serviceCategory: value, otherCategoryDetail: value !== "Other" ? "" : formData.otherCategoryDetail });
                                  if (fieldErrors.serviceCategory) {
                                    setFieldErrors(prev => ({ ...prev, serviceCategory: '' }));
                                  }
                                }}
                              >
                                <SelectTrigger className={`mt-1 bg-white border-2 ${fieldErrors.serviceCategory ? 'border-red-500' : 'border-gold/40'} focus:border-gold text-black rounded-lg cursor-pointer`}>
                                  <SelectValue placeholder="Select the service" />
                                </SelectTrigger>
                                <SelectContent className="max-h-60">
                                  {SERVICE_CATEGORIES.map((category) => (
                                    <SelectItem key={category} value={category}>
                                      {category}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                              {fieldErrors.serviceCategory && (
                                <p className="text-red-500 text-xs mt-1">{fieldErrors.serviceCategory}</p>
                              )}
                            </div>

                            {/* Inquiry Request Inline Form */}
                            {formData.serviceCategory === "Inquiry Request" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-gradient-to-br from-gold/5 to-gold/10 border border-gold/30 rounded-xl p-4 space-y-3"
                              >
                                <p className="text-sm font-semibold text-black flex items-center gap-2">
                                  <MessageCircle className="w-4 h-4 text-gold" />
                                  Inquiry Details
                                </p>
                                <p className="text-xs text-zinc-500">
                                  This inquiry will be tracked in the Inquiry Management Hub for follow-up.
                                </p>
                              </motion.div>
                            )}

                            {/* Other Category Detail */}
                            {formData.serviceCategory === "Other" && (
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                              >
                                <Label className="text-zinc-700 flex items-center gap-2">
                                  <FileText className="w-4 h-4 text-gold" />
                                  Please Specify Your Issue *
                                </Label>
                                <Input
                                  placeholder="Describe what service or feature the issue relates to..."
                                  value={formData.otherCategoryDetail}
                                  onChange={(e) => setFormData({ ...formData, otherCategoryDetail: e.target.value })}
                                  className="mt-1 bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg"
                                  required
                                />
                                <p className="text-xs text-zinc-500 mt-1">
                                  This helps us route your ticket to the right team.
                                </p>
                              </motion.div>
                            )}

                            {/* Subject with Voice Note */}
                            <div>
                              <Label className="text-zinc-700 flex items-center gap-2">
                                <FileText className="w-4 h-4 text-gold" />
                                Subject *
                              </Label>
                              <div className="flex gap-2 mt-1">
                                <Input
                                  placeholder="Brief description of the issue"
                                  value={formData.subject}
                                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                                  className="flex-1 bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg"
                                  required
                                />
                                <VoiceNoteRecorder
                                  onTranscript={(text) => handleVoiceTranscript(text, 'subject')}
                                  onTranscriptResult={(result) => {
                                    if (result.translated && !result.isEnglish) {
                                      const combined = `${result.original} [EN: ${result.translated}]`;
                                      handleVoiceTranscript(combined, 'subject');
                                    }
                                  }}
                                />
                              </div>
                              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                <Mic className="w-3 h-3" /> 🎙️ Speak in any language — auto-translated
                              </p>
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
                                <SelectTrigger className="mt-1 bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg cursor-pointer">
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
                              <p className="text-xs text-zinc-400 mt-1">
                                Our AI will verify and adjust priority based on issue analysis.
                              </p>
                            </div>

                            {/* Description with Voice Note */}
                            <div>
                              <Label className="text-zinc-700 flex items-center justify-between">
                                <span>Detailed Description *</span>
                                <VoiceNoteRecorder
                                  onTranscript={(text) => handleVoiceTranscript(text, 'description')}
                                  onTranscriptResult={(result) => {
                                    if (result.translated && !result.isEnglish) {
                                      const combined = `[${result.languageName || 'Original'}]: ${result.original}\n[English]: ${result.translated}`;
                                      setFormData(prev => ({
                                        ...prev,
                                        description: prev.description ? `${prev.description}\n\n${combined}` : combined
                                      }));
                                    }
                                  }}
                                />
                              </Label>
                              <Textarea
                                placeholder="Please describe the issue in detail. Include steps to reproduce, expected behavior, and what actually happened..."
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="mt-1 min-h-[120px] bg-white border-2 border-gold/40 focus:border-gold text-black rounded-lg"
                                required
                              />
                              <p className="text-xs text-zinc-400 mt-1 flex items-center gap-1">
                                <Mic className="w-3 h-3" /> 🎙️ Speak in any language — auto-translated to English
                              </p>
                            </div>

                            {/* Escalate option removed - handled internally by admins */}

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

                              {/* Attachment List with preview & quick view */}
                              {attachments.length > 0 && (
                                <div className="mt-3 space-y-2">
                                  {attachments.map((file, index) => {
                                    const isImage = file.type.startsWith('image/');
                                    const previewUrl = isImage ? URL.createObjectURL(file) : null;
                                    return (
                                      <div
                                        key={index}
                                        className={`flex items-center justify-between rounded-lg px-3 py-2 transition-colors ${
                                          uploadStatuses[index] === 'error' 
                                            ? 'bg-red-50 border border-red-200' 
                                            : uploadStatuses[index] === 'done'
                                            ? 'bg-green-50 border border-green-200'
                                            : 'bg-zinc-50'
                                        }`}
                                      >
                                        <div className="flex items-center gap-2 min-w-0">
                                          {/* Thumbnail preview for images */}
                                          {previewUrl ? (
                                            <img src={previewUrl} alt={file.name} className="w-10 h-10 rounded object-cover border border-zinc-200 flex-shrink-0" />
                                          ) : (
                                            getFileIcon(file)
                                          )}
                                          <div className="min-w-0">
                                            <span className="text-sm text-zinc-700 truncate block max-w-[140px]">
                                              {file.name}
                                            </span>
                                            <span className="text-xs text-zinc-400">
                                              {(file.size / 1024 / 1024).toFixed(2)}MB
                                            </span>
                                          </div>
                                          {isSubmitting && getUploadStatusIcon(index)}
                                        </div>
                                        <div className="flex items-center gap-1 flex-shrink-0">
                                          {/* Quick View Button */}
                                          <Dialog>
                                            <DialogTrigger asChild>
                                              <Button
                                                type="button"
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-gold hover:bg-gold/10"
                                                title="Quick View"
                                              >
                                                <FileText className="w-4 h-4" />
                                              </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto bg-white z-[10060]">
                                              <DialogHeader>
                                                <DialogTitle className="text-sm truncate">{file.name}</DialogTitle>
                                              </DialogHeader>
                                              <div className="mt-2">
                                                {isImage && previewUrl ? (
                                                  <img src={previewUrl} alt={file.name} className="w-full rounded-lg" />
                                                ) : file.type === 'application/pdf' ? (
                                                  <iframe
                                                    src={URL.createObjectURL(file)}
                                                    className="w-full h-[60vh] rounded-lg border"
                                                    title={file.name}
                                                  />
                                                ) : file.type.startsWith('video/') ? (
                                                  <video controls className="w-full rounded-lg">
                                                    <source src={URL.createObjectURL(file)} type={file.type} />
                                                  </video>
                                                ) : (
                                                  <div className="text-center py-10 text-zinc-500">
                                                    <FileText className="w-12 h-12 mx-auto mb-3 text-zinc-300" />
                                                    <p className="text-sm">Preview not available for this file type</p>
                                                    <p className="text-xs mt-1">{file.type || 'Unknown type'} • {(file.size / 1024 / 1024).toFixed(2)}MB</p>
                                                  </div>
                                                )}
                                              </div>
                                            </DialogContent>
                                          </Dialog>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="h-6 w-6"
                                            onClick={() => removeAttachment(index)}
                                            disabled={isSubmitting}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>

                            {/* Security Notice */}
                            <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                              <p className="text-xs text-green-700 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4" />
                                Your information is encrypted and securely stored. Only authorized support staff can access your ticket.
                              </p>
                            </div>

                            {/* Error Display */}
                            <AnimatePresence>
                              {submissionError && (
                                <motion.div
                                  initial={{ opacity: 0, height: 0 }}
                                  animate={{ opacity: 1, height: "auto" }}
                                  exit={{ opacity: 0, height: 0 }}
                                >
                                  <Alert variant="destructive" className="border-red-300 bg-red-50">
                                    <AlertTriangle className="h-4 w-4" />
                                    <AlertDescription className="ml-2">
                                      <div className="flex flex-col gap-2">
                                        <span>{submissionError}</span>
                                        <div className="flex gap-2">
                                          <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            onClick={handleRetry}
                                            className="text-xs"
                                          >
                                            <RefreshCw className="w-3 h-3 mr-1" />
                                            Retry
                                          </Button>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => setSubmissionError(null)}
                                            className="text-xs"
                                          >
                                            Dismiss
                                          </Button>
                                        </div>
                                      </div>
                                    </AlertDescription>
                                  </Alert>
                                </motion.div>
                              )}
                            </AnimatePresence>

                            <button
                              type="submit"
                              disabled={isSubmitting}
                              className="w-full relative inline-flex items-center justify-center gap-2 py-5 font-bold rounded-xl transition-all duration-300 hover:scale-[1.02] transform active:scale-95 group disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100"
                              style={{
                                background: 'linear-gradient(135deg, #FFFFFF 0%, #FDFBF7 25%, #F5F0E6 50%, #E8DFD0 75%, #C8A766 100%)',
                                border: '2px solid rgba(200,167,102,0.6)',
                                boxShadow: `
                                  0 10px 30px rgba(200,167,102,0.4),
                                  0 6px 15px rgba(0,0,0,0.2),
                                  inset 0 2px 4px rgba(255,255,255,0.9),
                                  inset 0 -2px 4px rgba(200,167,102,0.2),
                                  0 0 20px rgba(200,167,102,0.3)
                                `,
                              }}
                            >
                              {/* 3D Top highlight */}
                              <span className="absolute inset-x-0 top-0 h-1/2 rounded-t-xl bg-gradient-to-b from-white/80 to-transparent pointer-events-none" />
                              {/* 3D Bottom shadow */}
                              <span className="absolute inset-x-0 bottom-0 h-1/3 rounded-b-xl bg-gradient-to-t from-gold/10 to-transparent pointer-events-none" />
                              {/* Glow effect on hover */}
                              <span className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: '0 0 40px rgba(200,167,102,0.6), inset 0 0 20px rgba(200,167,102,0.1)' }} />
                              
                              {isSubmitting ? (
                                <span className="relative flex items-center justify-center gap-3 text-gold">
                                  <Loader2 className="w-5 h-5 animate-spin" />
                                  <motion.span
                                    key={submissionStep}
                                    initial={{ opacity: 0, y: 5 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="font-medium"
                                  >
                                    {STEP_MESSAGES[submissionStep]}
                                  </motion.span>
                                </span>
                              ) : (
                                <span className="relative flex items-center justify-center gap-2">
                                  <Send className="w-5 h-5 text-gold group-hover:text-black transition-colors" />
                                  <span className="text-black group-hover:text-gold transition-colors">Create Ticket</span>
                                  <span className="text-gold group-hover:text-black transition-colors">& Notify Support</span>
                                </span>
                              )}
                            </button>
                          </motion.form>
                        )}
                      </AnimatePresence>
                    </div>
                    </DialogContent>
                  </Dialog>

                  <p className="text-sm text-zinc-500 mt-4">
                    Email:{" "}
                    <a
                      href={`mailto:${CONTACT_INFO.supportEmail}`}
                      className="text-gold font-medium hover:underline"
                    >
                      {CONTACT_INFO.supportEmail}
                    </a>
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
