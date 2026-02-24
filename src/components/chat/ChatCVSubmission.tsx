import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Upload, CheckCircle, AlertCircle, ArrowLeft, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { T } from '@/components/ui/T';
import { validateEmail, validateE164Phone } from './types';
import { useAuth } from '@/contexts/AuthContext';

interface ChatCVSubmissionProps {
  userInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  onUserInfoChange: (field: string, value: string) => void;
  conversationId: string | null;
  onSubmitSuccess: () => void;
  onBack: () => void;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ChatCVSubmission = ({ 
  userInfo, 
  onUserInfoChange, 
  conversationId, 
  onSubmitSuccess,
  onBack 
}: ChatCVSubmissionProps) => {
  const { user } = useAuth();
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    
    if (!userInfo.firstName.trim()) errors.firstName = 'First name is required';
    if (!userInfo.lastName.trim()) errors.lastName = 'Last name is required';
    if (!userInfo.email.trim()) {
      errors.email = 'Email is required';
    } else if (!validateEmail(userInfo.email)) {
      errors.email = 'Please enter a valid email';
    }
    if (!userInfo.phone.trim()) {
      errors.phone = 'Phone is required';
    } else if (!validateE164Phone(userInfo.phone)) {
      errors.phone = 'Use international format (e.g., +971501234567)';
    }
    if (!cvFile) errors.cv = 'Please upload your CV';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
      if (!allowedTypes.includes(file.type)) {
        toast.error('Please upload a PDF or Word document');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setCvFile(file);
      setFormErrors(prev => ({ ...prev, cv: '' }));
    }
  };

  const handleSubmit = async () => {
    if (!validateForm() || !cvFile) return;

    setIsUploading(true);

    try {
      const fileExt = cvFile.name.split('.').pop();
      const fileName = `cv_${Date.now()}_${userInfo.firstName}_${userInfo.lastName}.${fileExt}`;
      const filePath = `cv-submissions/${fileName}`;

      let uploadedBucket: 'documents' | 'public' = 'documents';

      const { error: uploadError } = await supabase.storage
        .from('documents')
        .upload(filePath, cvFile);

      if (uploadError) {
        const { error: publicUploadError } = await supabase.storage
          .from('public')
          .upload(filePath, cvFile);
        
        if (publicUploadError) {
          throw new Error('Failed to upload CV. Please try again.');
        }
        uploadedBucket = 'public';
      }

      const { data: urlData } = supabase.storage
        .from(uploadedBucket)
        .getPublicUrl(filePath);

      const cvUrl = urlData?.publicUrl || filePath;

      const { error: insertError } = await supabase
        .from('hr_cv_submissions')
        .insert({
          full_name: `${userInfo.firstName} ${userInfo.lastName}`,
          email: userInfo.email.toLowerCase().trim(),
          phone: userInfo.phone,
          cv_url: cvUrl,
          source: 'chat_widget',
          chat_session_id: conversationId,
          status: 'pending'
        });

      if (insertError) {
        console.error('CV submission error:', insertError);
        throw new Error('Failed to submit CV. Please try again.');
      }

      // Notify the submitter if logged in
      if (user?.id) {
        await supabase.from('user_notifications').insert({
          user_id: user.id,
          type: 'cv_application',
          title: 'CV received - Under review',
          message: 'Your CV has been received. JBJ Global Real Estate HR team is reviewing your profile.',
          is_read: false,
          metadata: { status: 'under_review' },
        });
      }

      // Always notify the Owner about new CV
      const ownerId = '72ca2405-b4ca-48df-9b47-623ee260a3cc';
      
      // Don't double-notify if the submitter IS the owner
      if (ownerId !== user?.id) {
        await Promise.allSettled([
          supabase.from('user_notifications').insert({
            user_id: ownerId,
            type: 'cv_application',
            title: `New CV Received: ${userInfo.firstName} ${userInfo.lastName}`,
            message: `A new CV has been submitted by ${userInfo.firstName} ${userInfo.lastName} (${userInfo.email}). Please review in the CV Center.`,
            is_read: false,
            metadata: { cv_name: `${userInfo.firstName} ${userInfo.lastName}`, cv_email: userInfo.email, status: 'pending_review' } as any,
          }),
          supabase.from('admin_tasks').insert({
            user_id: ownerId,
            title: `Review CV: ${userInfo.firstName} ${userInfo.lastName}`,
            description: `New CV received from ${userInfo.firstName} ${userInfo.lastName} (${userInfo.email}). Review in the CV Center.`,
            category: 'cv_application',
            status: 'pending',
            priority: 'high',
          }),
        ]);
      }

      setSubmitted(true);
      toast.success('CV submitted successfully!');

      setTimeout(() => {
        onSubmitSuccess();
      }, 800);

    } catch (error) {
      console.error('CV submission error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit CV');
    } finally {
      setIsUploading(false);
    }
  };

  if (submitted) {
    return (
      <div className="flex-1 p-4 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h4 className="text-black text-lg font-semibold mb-2">
          <T>CV Submitted Successfully!</T>
        </h4>
        <p className="text-zinc-600 text-sm">
          <T>Thank you for your interest in joining JBJ Global. Our HR team will review your application and contact you soon.</T>
        </p>
      </div>
    );
  }

  return (
    <ScrollArea className="flex-1 p-4">
      <div className="mb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gold hover:text-gold-dark transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <T>Back to options</T>
        </button>
      </div>

      <div className="text-center mb-4">
        <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-gradient-to-r from-blue-500/20 to-blue-500/10 flex items-center justify-center">
          <FileText className="w-7 h-7 text-blue-500" />
        </div>
        <h4 className="text-black text-lg font-semibold mb-1"><T>Submit Your CV</T></h4>
        <p className="text-zinc-600 text-sm"><T>Join our growing team at JBJ Global</T></p>
      </div>

      <div className="space-y-3">
        {/* Name Row */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <Label className="text-black text-xs mb-1 block"><T>First Name</T> *</Label>
            <input
              value={userInfo.firstName}
              onChange={(e) => onUserInfoChange('firstName', e.target.value)}
              placeholder="First"
              inputMode="text"
              autoComplete="off"
              className={`w-full bg-white border-2 border-gold/40 text-black placeholder:text-zinc-400 h-9 text-sm rounded-xl px-4 outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold ${formErrors.firstName ? 'border-red-500' : ''}`}
            />
            {formErrors.firstName && <p className="text-red-500 text-xs mt-0.5">{formErrors.firstName}</p>}
          </div>
          <div>
            <Label className="text-black text-xs mb-1 block"><T>Last Name</T> *</Label>
            <input
              value={userInfo.lastName}
              onChange={(e) => onUserInfoChange('lastName', e.target.value)}
              placeholder="Last"
              inputMode="text"
              autoComplete="off"
              className={`w-full bg-white border-2 border-gold/40 text-black placeholder:text-zinc-400 h-9 text-sm rounded-xl px-4 outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold ${formErrors.lastName ? 'border-red-500' : ''}`}
            />
            {formErrors.lastName && <p className="text-red-500 text-xs mt-0.5">{formErrors.lastName}</p>}
          </div>
        </div>

        {/* Email */}
        <div>
          <Label className="text-black text-xs mb-1 block"><T>Email Address</T> *</Label>
          <input
            type="email"
            value={userInfo.email}
            onChange={(e) => onUserInfoChange('email', e.target.value)}
            placeholder="your@email.com"
            inputMode="email"
            autoComplete="off"
            className={`w-full bg-white border-2 border-gold/40 text-black placeholder:text-zinc-400 h-9 text-sm rounded-xl px-4 outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold ${formErrors.email ? 'border-red-500' : ''}`}
          />
          {formErrors.email && <p className="text-red-500 text-xs mt-0.5">{formErrors.email}</p>}
        </div>

        {/* Phone */}
        <div>
          <Label className="text-black text-xs mb-1 block"><T>Phone Number</T> *</Label>
          <input
            type="tel"
            value={userInfo.phone}
            onChange={(e) => onUserInfoChange('phone', e.target.value)}
            placeholder="+971 50 123 4567"
            inputMode="tel"
            autoComplete="off"
            className={`w-full bg-white border-2 border-gold/40 text-black placeholder:text-zinc-400 h-9 text-sm rounded-xl px-4 outline-none focus:ring-2 focus:ring-gold/50 focus:border-gold ${formErrors.phone ? 'border-red-500' : ''}`}
          />
          {formErrors.phone && <p className="text-red-500 text-xs mt-0.5">{formErrors.phone}</p>}
        </div>

        {/* CV Upload */}
        <div>
          <Label className="text-black text-xs mb-1 block"><T>Upload Your CV</T> *</Label>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.doc,.docx"
            onChange={handleFileChange}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className={`w-full p-4 border-2 border-dashed rounded-xl transition-all duration-300 flex flex-col items-center justify-center gap-2 ${
              cvFile 
                ? 'border-green-500 bg-green-50' 
                : formErrors.cv 
                  ? 'border-red-500 bg-red-50'
                  : 'border-gold/40 hover:border-gold bg-white'
            }`}
          >
            {cvFile ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-500" />
                <span className="text-green-700 text-sm font-medium truncate max-w-full px-2">{cvFile.name}</span>
                <span className="text-green-600 text-xs">{formatFileSize(cvFile.size)} · Click to change file</span>
              </>
            ) : (
              <>
                <Upload className="w-6 h-6 text-gold" />
                <span className="text-black text-sm font-medium"><T>Click to upload</T></span>
                <span className="text-zinc-500 text-xs">PDF or Word (max 5MB)</span>
              </>
            )}
          </button>
          {formErrors.cv && (
            <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" />
              {formErrors.cv}
            </p>
          )}
        </div>

        {/* Indeterminate spinner during upload */}
        {isUploading && (
          <div className="flex items-center justify-center gap-2 py-2">
            <Loader2 className="w-5 h-5 text-gold animate-spin" />
            <span className="text-sm text-black/70 font-medium">Uploading your CV...</span>
          </div>
        )}

        <Button
          onClick={handleSubmit}
          disabled={isUploading}
          className="w-full bg-gold hover:bg-gold-light text-black font-bold py-3 rounded-xl shadow-lg shadow-gold/20"
        >
          {isUploading ? (
            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /><T>Uploading...</T></>
          ) : (
            <T>Submit CV</T>
          )}
        </Button>

        <p className="text-center text-zinc-500 text-xs">
          <T>Your information will be securely stored and reviewed by our HR team</T>
        </p>
      </div>
    </ScrollArea>
  );
};

export default ChatCVSubmission;
