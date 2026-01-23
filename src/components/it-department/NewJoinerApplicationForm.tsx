import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, User, Mail, Phone, Globe, Languages, 
  Briefcase, Building2, Upload, UserCheck,
  Loader2, Camera, Mic, MicOff
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { allTeamMembers } from '@/config/team-members';

// List of departments
const DEPARTMENTS = [
  'Leadership',
  'Sales',
  'After Sales',
  'Marketing & Content',
  'Client Relations',
  'VIP Client Relations',
  'Human Resources',
  'Creative & Media',
  'Finance',
  'Operations',
  'Software Engineering',
  'Project Management',
  'IT',
  'Administration',
  'Customer Happiness',
  'Legal'
];

// CRM Roles
const CRM_ROLES = [
  { value: 'broker_member', label: 'Broker Member' },
  { value: 'sales_director', label: 'Sales Director' },
  { value: 'admin', label: 'Admin' },
  { value: 'owner_admin', label: 'Owner Admin' },
  { value: 'founder', label: 'Founder' }
];

// Common nationalities
const NATIONALITIES = [
  'Emirati', 'British', 'American', 'Indian', 'Pakistani', 'Filipino',
  'Egyptian', 'Lebanese', 'Syrian', 'Jordanian', 'Moroccan', 'Saudi',
  'Chinese', 'Russian', 'French', 'German', 'Italian', 'Spanish',
  'Brazilian', 'Australian', 'Canadian', 'South African', 'Nigerian',
  'Kenyan', 'Other'
];

// Common languages
const LANGUAGES = [
  'English', 'Arabic', 'Hindi', 'Urdu', 'Tagalog', 'French',
  'German', 'Spanish', 'Portuguese', 'Russian', 'Chinese (Mandarin)',
  'Chinese (Cantonese)', 'Japanese', 'Korean', 'Italian', 'Dutch',
  'Turkish', 'Persian', 'Bengali', 'Indonesian', 'Malay', 'Thai'
];

interface NewJoinerApplicationFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const NewJoinerApplicationForm: React.FC<NewJoinerApplicationFormProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    languages: [] as string[],
    jobTitle: '',
    department: '',
    crmRole: 'broker_member',
    reportsTo: '',
    notes: ''
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Preview
    const reader = new FileReader();
    reader.onload = (event) => {
      setPhotoPreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleLanguageToggle = (language: string) => {
    setFormData(prev => ({
      ...prev,
      languages: prev.languages.includes(language)
        ? prev.languages.filter(l => l !== language)
        : [...prev.languages, language]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to submit an application');
        return;
      }

      // Validate required fields
      if (!formData.fullName || !formData.nationality || !formData.jobTitle || !formData.department) {
        toast.error('Please fill in all required fields');
        setIsSubmitting(false);
        return;
      }

      // Generate email if not provided
      const email = formData.email || 
        `${formData.fullName.toLowerCase().replace(/\s+/g, '.')}@jbj.ae`;

      // Insert the application
      const { error } = await supabase
        .from('new_joiner_applications')
        .insert({
          full_name: formData.fullName,
          email,
          phone: formData.phone,
          nationality: formData.nationality,
          languages: formData.languages,
          job_title: formData.jobTitle,
          department: formData.department,
          crm_role: formData.crmRole,
          reports_to: formData.reportsTo,
          photo_url: photoPreview,
          requested_by: user.id,
          status: 'pending_review'
        });

      if (error) throw error;

      // Create IT task for the application
      await supabase
        .from('it_department_tasks')
        .insert({
          task_type: 'new_joiner_account',
          title: `Create CRM Account: ${formData.fullName}`,
          description: `New joiner application submitted for ${formData.fullName} - ${formData.jobTitle} in ${formData.department}`,
          priority: 'high',
          requested_by: user.id,
          status: 'open'
        });

      onSuccess();
      resetForm();
    } catch (error: any) {
      console.error('Error submitting application:', error);
      toast.error(error.message || 'Failed to submit application');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      fullName: '',
      email: '',
      phone: '',
      nationality: '',
      languages: [],
      jobTitle: '',
      department: '',
      crmRole: 'broker_member',
      reportsTo: '',
      notes: ''
    });
    setPhotoPreview(null);
  };

  // Get potential managers based on department
  const potentialManagers = allTeamMembers.filter(m => 
    m.department === formData.department && 
    (m.hierarchyLevel || 5) <= 3
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40 text-black max-w-3xl max-h-[85vh] overflow-y-auto mt-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-black flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gold/20 border border-gold/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-gold" />
            </div>
            New Joiner Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Photo Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-zinc-800 border-2 border-gold/30 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-12 h-12 text-zinc-500" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-gold rounded-full flex items-center justify-center cursor-pointer hover:bg-gold/90 transition-colors">
                <Upload className="w-5 h-5 text-black" />
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Personal Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                Full Name *
              </Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                className="bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-gold" />
                Email (Auto-generated if empty)
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@jbj.ae"
                className="bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-gold" />
                Phone Number
              </Label>
              <Input
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="+971 XX XXX XXXX"
                className="bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-gold" />
                Nationality *
              </Label>
              <Select
                value={formData.nationality}
                onValueChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
              >
                <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                  <SelectValue placeholder="Select nationality" className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
                  {NATIONALITIES.map(nat => (
                    <SelectItem key={nat} value={nat} className="text-black hover:bg-gold/20 focus:bg-gold/20">
                      {nat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label className="text-black font-medium flex items-center gap-2">
              <Languages className="w-4 h-4 text-gold" />
              Languages Spoken
            </Label>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map(lang => (
                <Button
                  key={lang}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleLanguageToggle(lang)}
                  className={`border-2 border-gold/30 ${
                    formData.languages.includes(lang)
                      ? 'bg-gold text-black hover:bg-gold/90 border-gold'
                      : 'text-black hover:bg-gold/10 hover:border-gold'
                  }`}
                >
                  {lang}
                </Button>
              ))}
            </div>
          </div>

          {/* Position Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-gold" />
                Job Title *
              </Label>
              <Input
                value={formData.jobTitle}
                onChange={(e) => setFormData(prev => ({ ...prev, jobTitle: e.target.value }))}
                placeholder="e.g., Property Consultant"
                className="bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-gold" />
                Department *
              </Label>
              <Select
                value={formData.department}
                onValueChange={(value) => setFormData(prev => ({ ...prev, department: value, reportsTo: '' }))}
              >
                <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                  <SelectValue placeholder="Select department" className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
                  {DEPARTMENTS.map(dept => (
                    <SelectItem key={dept} value={dept} className="text-black hover:bg-gold/20 focus:bg-gold/20">
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-gold" />
                CRM Role
              </Label>
              <Select
                value={formData.crmRole}
                onValueChange={(value) => setFormData(prev => ({ ...prev, crmRole: value }))}
              >
                <SelectTrigger className="bg-white border-2 border-gold/30 text-black">
                  <SelectValue placeholder="Select CRM role" className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
                  {CRM_ROLES.map(role => (
                    <SelectItem key={role.value} value={role.value} className="text-black hover:bg-gold/20 focus:bg-gold/20">
                      {role.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-black font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-gold" />
                Reports To
              </Label>
              <Select
                value={formData.reportsTo}
                onValueChange={(value) => setFormData(prev => ({ ...prev, reportsTo: value }))}
                disabled={!formData.department}
              >
                <SelectTrigger className="bg-white border-2 border-gold/30 text-black disabled:opacity-60">
                  <SelectValue placeholder={formData.department ? "Select manager" : "Select department first"} className="text-black" />
                </SelectTrigger>
                <SelectContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border-2 border-gold/40">
                  {potentialManagers.map(manager => (
                    <SelectItem key={manager.id} value={manager.id} className="text-black hover:bg-gold/20 focus:bg-gold/20">
                      {manager.name} - {manager.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-black font-medium">Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information about the new joiner..."
              className="bg-white border-2 border-gold/30 text-black placeholder:text-black/40 focus:border-gold min-h-[100px]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gold/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-gold/30 text-black hover:bg-gold/10 hover:border-gold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-gold text-black hover:bg-gold/90"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <UserCheck className="w-4 h-4 mr-2" />
                  Submit Application
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default NewJoinerApplicationForm;
