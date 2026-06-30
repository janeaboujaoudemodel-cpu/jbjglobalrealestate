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
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { allTeamMembers } from '@/config/team-members';
import PhoneInputWithCountry from '@/components/crm/pickers/PhoneInputWithCountry';
import NationalityPicker from '@/components/crm/pickers/NationalityPicker';
import LanguageMultiPicker from '@/components/crm/pickers/LanguageMultiPicker';
import { SearchableSelectWithOther } from '@/components/ui/searchable-select-with-other';

// List of departments
const DEPARTMENTS = [
  { value: 'Leadership', label: 'Leadership' },
  { value: 'Sales', label: 'Sales' },
  { value: 'After Sales', label: 'After Sales' },
  { value: 'Marketing & Content', label: 'Marketing & Content' },
  { value: 'Client Relations', label: 'Client Relations' },
  { value: 'VIP Client Relations', label: 'VIP Client Relations' },
  { value: 'Human Resources', label: 'Human Resources' },
  { value: 'Creative & Media', label: 'Creative & Media' },
  { value: 'Finance', label: 'Finance' },
  { value: 'Operations', label: 'Operations' },
  { value: 'Software Engineering', label: 'Software Engineering' },
  { value: 'Project Management', label: 'Project Management' },
  { value: 'IT', label: 'IT' },
  { value: 'Administration', label: 'Administration' },
  { value: 'Customer Happiness', label: 'Customer Happiness' },
  { value: 'Legal', label: 'Legal' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Research & Development', label: 'Research & Development' },
  { value: 'Training', label: 'Training' },
  { value: 'Quality Assurance', label: 'Quality Assurance' },
  { value: 'Business Development', label: 'Business Development' },
  { value: 'Partnerships', label: 'Partnerships' },
  { value: 'Analytics', label: 'Analytics' },
  { value: 'Design', label: 'Design' },
  { value: 'Content', label: 'Content' },
  { value: 'Social Media', label: 'Social Media' },
  { value: 'PR & Communications', label: 'PR & Communications' },
  { value: 'Procurement', label: 'Procurement' },
  { value: 'Facilities', label: 'Facilities' },
  { value: 'Security', label: 'Security' },
];

// CRM Roles - comprehensive list
const CRM_ROLES = [
  { value: 'broker_member', label: 'Broker Member' },
  { value: 'senior_broker', label: 'Senior Broker' },
  { value: 'team_lead', label: 'Team Lead' },
  { value: 'sales_manager', label: 'Sales Manager' },
  { value: 'sales_director', label: 'Sales Director' },
  { value: 'department_head', label: 'Department Head' },
  { value: 'division_manager', label: 'Division Manager' },
  { value: 'associate', label: 'Associate' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'specialist', label: 'Specialist' },
  { value: 'analyst', label: 'Analyst' },
  { value: 'consultant', label: 'Consultant' },
  { value: 'executive', label: 'Executive' },
  { value: 'officer', label: 'Officer' },
  { value: 'assistant', label: 'Assistant' },
  { value: 'intern', label: 'Intern' },
  { value: 'trainee', label: 'Trainee' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'admin', label: 'Admin' },
  { value: 'hr_manager', label: 'HR Manager' },
  { value: 'hr_officer', label: 'HR Officer' },
  { value: 'finance_manager', label: 'Finance Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'marketing_manager', label: 'Marketing Manager' },
  { value: 'content_manager', label: 'Content Manager' },
  { value: 'designer', label: 'Designer' },
  { value: 'developer', label: 'Developer' },
  { value: 'it_support', label: 'IT Support' },
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'driver', label: 'Driver' },
  { value: 'owner_admin', label: 'Owner Admin' },
  { value: 'founder', label: 'Founder' },
  { value: 'ceo', label: 'CEO' },
  { value: 'coo', label: 'COO' },
  { value: 'cfo', label: 'CFO' },
  { value: 'cto', label: 'CTO' },
  { value: 'cmo', label: 'CMO' },
  { value: 'vp', label: 'Vice President' },
  { value: 'director', label: 'Director' },
  { value: 'partner', label: 'Partner' },
  { value: 'contractor', label: 'Contractor' },
  { value: 'freelancer', label: 'Freelancer' },
];

// Common job titles
const JOB_TITLES = [
  { value: 'Property Consultant', label: 'Property Consultant' },
  { value: 'Senior Property Consultant', label: 'Senior Property Consultant' },
  { value: 'Real Estate Agent', label: 'Real Estate Agent' },
  { value: 'Sales Executive', label: 'Sales Executive' },
  { value: 'Sales Manager', label: 'Sales Manager' },
  { value: 'Sales Director', label: 'Sales Director' },
  { value: 'Business Development Manager', label: 'Business Development Manager' },
  { value: 'Account Manager', label: 'Account Manager' },
  { value: 'Client Relations Manager', label: 'Client Relations Manager' },
  { value: 'Marketing Manager', label: 'Marketing Manager' },
  { value: 'Marketing Coordinator', label: 'Marketing Coordinator' },
  { value: 'Content Creator', label: 'Content Creator' },
  { value: 'Social Media Manager', label: 'Social Media Manager' },
  { value: 'Graphic Designer', label: 'Graphic Designer' },
  { value: 'Video Editor', label: 'Video Editor' },
  { value: 'Photographer', label: 'Photographer' },
  { value: 'HR Manager', label: 'HR Manager' },
  { value: 'HR Officer', label: 'HR Officer' },
  { value: 'Recruiter', label: 'Recruiter' },
  { value: 'Finance Manager', label: 'Finance Manager' },
  { value: 'Accountant', label: 'Accountant' },
  { value: 'Administrative Assistant', label: 'Administrative Assistant' },
  { value: 'Office Manager', label: 'Office Manager' },
  { value: 'Receptionist', label: 'Receptionist' },
  { value: 'IT Manager', label: 'IT Manager' },
  { value: 'IT Support Specialist', label: 'IT Support Specialist' },
  { value: 'Software Developer', label: 'Software Developer' },
  { value: 'Project Manager', label: 'Project Manager' },
  { value: 'Operations Manager', label: 'Operations Manager' },
  { value: 'Quality Assurance', label: 'Quality Assurance' },
  { value: 'Training Manager', label: 'Training Manager' },
  { value: 'Customer Service Representative', label: 'Customer Service Representative' },
  { value: 'Legal Counsel', label: 'Legal Counsel' },
  { value: 'Compliance Officer', label: 'Compliance Officer' },
  { value: 'Executive Assistant', label: 'Executive Assistant' },
  { value: 'Personal Assistant', label: 'Personal Assistant' },
  { value: 'Driver', label: 'Driver' },
  { value: 'Security Officer', label: 'Security Officer' },
  { value: 'Intern', label: 'Intern' },
  { value: 'Trainee', label: 'Trainee' },
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
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    phone: '',
    nationality: '',
    languages: [] as string[],
    jobTitle: '',
    department: '',
    employmentType: '',
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
          employment_type: formData.employmentType || null,
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
      employmentType: '',
      crmRole: 'broker_member',
      reportsTo: '',
      notes: ''
    });
    setPhotoPreview(null);
  };

  // Get potential managers based on department
  const potentialManagers = allTeamMembers
    .filter(m => 
      m.department === formData.department && 
      (m.hierarchyLevel || 5) <= 3
    )
    .map(m => ({ value: m.id, label: `${m.name} - ${m.role}` }));

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border-2 border-[#B89555]/40 text-[#1A1A1A] max-w-3xl max-h-[85vh] overflow-y-auto mt-8">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[#1A1A1A] flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#EFE6D6]/20 border border-[#B89555]/30 flex items-center justify-center">
              <UserCheck className="w-5 h-5 text-[#1A1A1A]" />
            </div>
            New Joiner Application
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* Photo Upload */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="w-32 h-32 rounded-full bg-[#1A1A1A] border-2 border-[#B89555]/30 overflow-hidden flex items-center justify-center">
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover"  loading="lazy" decoding="async" />
                ) : (
                  <Camera className="w-12 h-12 text-[#1A1A1A]/70" />
                )}
              </div>
              <label className="absolute bottom-0 right-0 w-10 h-10 bg-[#EFE6D6] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#EFE6D6]/90 transition-colors">
                <Upload className="w-5 h-5 text-[#1A1A1A]" />
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
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-[#1A1A1A]" />
                Full Name *
              </Label>
              <Input
                value={formData.fullName}
                onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                placeholder="Enter full name"
                className="bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
                required
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <Mail className="w-4 h-4 text-[#1A1A1A]" />
                Email (Auto-generated if empty)
              </Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                placeholder="name@jbj.ae"
                className="bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555]"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <Phone className="w-4 h-4 text-[#1A1A1A]" />
                Phone Number
              </Label>
              <PhoneInputWithCountry
                value={formData.phone}
                onChange={(value) => setFormData(prev => ({ ...prev, phone: value }))}
                placeholder="XX XXX XXXX"
              />
            </div>

            <div className="space-y-2 md:col-span-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <Globe className="w-4 h-4 text-[#1A1A1A]" />
                Nationality *
              </Label>
              <NationalityPicker
                value={formData.nationality}
                onChange={(value) => setFormData(prev => ({ ...prev, nationality: value }))}
              />
            </div>
          </div>

          {/* Languages */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
              <Languages className="w-4 h-4 text-[#1A1A1A]" />
              Languages Spoken
            </Label>
            <LanguageMultiPicker
              value={formData.languages}
              onChange={(value) => setFormData(prev => ({ ...prev, languages: value }))}
            />
          </div>

          {/* Position Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-[#1A1A1A]" />
                Job Title *
              </Label>
              <SearchableSelectWithOther
                value={formData.jobTitle}
                onChange={(value) => setFormData(prev => ({ ...prev, jobTitle: value }))}
                options={JOB_TITLES}
                placeholder="Select or type job title"
                allowOther={true}
                otherPlaceholder="Type custom job title..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <Building2 className="w-4 h-4 text-[#1A1A1A]" />
                Department *
              </Label>
              <SearchableSelectWithOther
                value={formData.department}
                onChange={(value) => setFormData(prev => ({ ...prev, department: value, reportsTo: '' }))}
                options={DEPARTMENTS}
                placeholder="Select or type department"
                allowOther={true}
                otherPlaceholder="Type custom department..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#1A1A1A]" />
                CRM Role
              </Label>
              <SearchableSelectWithOther
                value={formData.crmRole}
                onChange={(value) => setFormData(prev => ({ ...prev, crmRole: value }))}
                options={CRM_ROLES}
                placeholder="Select or type role"
                allowOther={true}
                otherPlaceholder="Type custom role..."
              />
            </div>

            <div className="space-y-2">
              <Label className="text-[#1A1A1A] font-medium flex items-center gap-2">
                <User className="w-4 h-4 text-[#1A1A1A]" />
                Reports To
              </Label>
              <SearchableSelectWithOther
                value={formData.reportsTo}
                onChange={(value) => setFormData(prev => ({ ...prev, reportsTo: value }))}
                options={potentialManagers}
                placeholder={formData.department ? "Select manager" : "Select department first"}
                allowOther={true}
                otherPlaceholder="Type manager name..."
              />
            </div>
          </div>

          {/* Employment Type */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A] font-medium">Employment Type</Label>
            <div className="flex flex-wrap gap-2">
              {[
                { v: 'full_time', l: 'Full-time' },
                { v: 'part_time', l: 'Part-time' },
                { v: 'freelancer', l: 'Freelancer' },
                { v: 'referral', l: 'Referral' },
                { v: 'intern', l: 'Intern' },
                { v: 'contractor', l: 'Contractor' },
              ].map(opt => (
                <button
                  key={opt.v}
                  type="button"
                  onClick={() => setFormData(prev => ({ ...prev, employmentType: prev.employmentType === opt.v ? '' : opt.v }))}
                  className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                    formData.employmentType === opt.v
                      ? 'bg-[#EFE6D6] border-[#B89555] text-[#1A1A1A] font-semibold'
                      : 'bg-[#FDFBF7] border-[#B89555]/30 text-[#1A1A1A]/80 hover:border-[#B89555]'
                  }`}
                >
                  {opt.l}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label className="text-[#1A1A1A] font-medium">Additional Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
              placeholder="Any additional information about the new joiner..."
              className="bg-[#FDFBF7] border-2 border-[#B89555]/30 text-[#1A1A1A] placeholder:text-[#1A1A1A]/40 focus:border-[#B89555] min-h-[100px]"
            />
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-3 pt-4 border-t border-[#B89555]/30">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="border-2 border-[#B89555]/30 text-[#1A1A1A] hover:bg-[#EFE6D6]/10 hover:border-[#B89555]"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#EFE6D6] text-[#1A1A1A] hover:bg-[#EFE6D6]/90"
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
