import React, { useState } from 'react';
import { AlertCircle, X, Send, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ReportProblemButtonProps {
  toolName: string;
  variant?: 'floating' | 'inline';
}

const ISSUE_CATEGORIES = [
  { value: 'bug', label: 'Bug / Error' },
  { value: 'performance', label: 'Performance Issue' },
  { value: 'design', label: 'Design Problem' },
  { value: 'feature', label: 'Feature Request' },
  { value: 'data', label: 'Data Issue' },
  { value: 'other', label: 'Other' },
];

const ReportProblemButton: React.FC<ReportProblemButtonProps> = ({ 
  toolName, 
  variant = 'inline' 
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    category: '',
    description: '',
  });

  const handleSubmit = async () => {
    if (!formData.description.trim() || !formData.category) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const { error } = await supabase.from('jbj_issue_reports').insert({
        user_id: user?.id || null,
        user_name: formData.name || null,
        user_email: formData.email || user?.email || null,
        user_phone: formData.phone || null,
        tool_name: toolName,
        issue_category: formData.category,
        issue_description: formData.description,
        status: 'pending',
      });

      if (error) throw error;

      setIsSubmitted(true);
      toast.success('Report submitted successfully');
      
      // Reset after 2 seconds
      setTimeout(() => {
        setIsSubmitted(false);
        setIsOpen(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          category: '',
          description: '',
        });
      }, 2000);

    } catch (error) {
      console.error('Failed to submit report:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const buttonContent = (
    <Button
      variant={variant === 'floating' ? 'default' : 'outline'}
      size="sm"
      className={variant === 'floating' 
        ? 'fixed bottom-6 left-6 z-[7000] bg-red-600 hover:bg-red-500 text-white'
        : 'text-red-400 border-red-400/30 hover:bg-red-400/10'
      }
      onClick={() => setIsOpen(true)}
    >
      <AlertCircle className="w-4 h-4 mr-2" />
      Report a Problem
    </Button>
  );

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {buttonContent}
      </DialogTrigger>
      <DialogContent className="bg-[#FDFBF7] border-[#1A1A1A] text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-red-400" />
            Report a Problem
          </DialogTitle>
          <DialogDescription className="text-white/70">
            Help us improve by reporting issues with {toolName}
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {isSubmitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-8 text-center"
            >
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">Report Submitted!</h3>
              <p className="text-white/70">Thank you for helping us improve.</p>
            </motion.div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-white/85">Your Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="John Doe"
                    className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  />
                </div>
                <div>
                  <Label className="text-white/85">Phone</Label>
                  <Input
                    value={formData.phone}
                    onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="+971 50 123 4567"
                    className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
                  />
                </div>
              </div>

              <div>
                <Label className="text-white/85">Email</Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="you@example.com"
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white"
                />
              </div>

              <div>
                <Label className="text-white/85">Issue Category *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, category: value }))}
                >
                  <SelectTrigger className="bg-[#1A1A1A] border-[#1A1A1A] text-white">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1A1A1A] border-[#1A1A1A]">
                    {ISSUE_CATEGORIES.map(cat => (
                      <SelectItem key={cat.value} value={cat.value} className="text-white">
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-white/85">Describe the Issue *</Label>
                <Textarea
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Please describe what happened, what you expected, and any steps to reproduce..."
                  className="bg-[#1A1A1A] border-[#1A1A1A] text-white min-h-[120px]"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setIsOpen(false)}
                  className="flex-1 border-[#1A1A1A] text-white/85"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !formData.description.trim() || !formData.category}
                  className="flex-1 bg-red-600 hover:bg-red-500"
                >
                  {isSubmitting ? (
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default ReportProblemButton;
