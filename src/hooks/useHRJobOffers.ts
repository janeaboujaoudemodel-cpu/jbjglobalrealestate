import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface JobOffer {
  id: string;
  department: string;
  position_title: string;
  document_url: string | null;
  document_name: string | null;
  description: string | null;
  salary_range_min: number | null;
  salary_range_max: number | null;
  commission_structure: string | null;
  benefits: string[] | null;
  is_active: boolean;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface JobApplicant {
  id: string;
  job_offer_id: string | null;
  department: string;
  full_name: string;
  email: string;
  phone: string | null;
  cv_url: string | null;
  status: string;
  interview_date: string | null;
  notes: string | null;
  job_offer_sent_at: string | null;
  job_offer_signed_at: string | null;
  created_at: string;
}

// Department list for categorization
export const DEPARTMENTS = [
  'Leadership & Legal',
  'Sales',
  'After Sales',
  'Marketing & Content',
  'Client Relations',
  'Human Resources',
  'Creative & Media Center',
  'Finance',
  'Operations',
  'Software Engineering',
  'Project Management',
  'IT',
  'Administration',
  'Customer Happiness'
] as const;

export const useHRJobOffers = () => {
  const { user } = useAuth();
  const [jobOffers, setJobOffers] = useState<JobOffer[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchJobOffers = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hr_job_offers')
        .select('*')
        .order('department', { ascending: true })
        .order('created_at', { ascending: false });

      if (error) throw error;
      setJobOffers(data || []);
    } catch (error) {
      console.error('Error fetching job offers:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchJobOffers();
  }, [fetchJobOffers]);

  const createJobOffer = async (offer: Partial<JobOffer>) => {
    if (!user) return null;

    try {
      const { data, error } = await supabase
        .from('hr_job_offers')
        .insert({
          department: offer.department!,
          position_title: offer.position_title!,
          description: offer.description,
          salary_range_min: offer.salary_range_min,
          salary_range_max: offer.salary_range_max,
          commission_structure: offer.commission_structure,
          benefits: offer.benefits,
          document_url: offer.document_url,
          document_name: offer.document_name,
          is_active: offer.is_active ?? true
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success('Job offer created successfully');
      await fetchJobOffers();
      return data;
    } catch (error) {
      console.error('Error creating job offer:', error);
      toast.error('Failed to create job offer');
      return null;
    }
  };

  const updateJobOffer = async (id: string, updates: Partial<JobOffer>) => {
    try {
      const { error } = await supabase
        .from('hr_job_offers')
        .update(updates)
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Job offer updated');
      await fetchJobOffers();
      return true;
    } catch (error) {
      console.error('Error updating job offer:', error);
      toast.error('Failed to update job offer');
      return false;
    }
  };

  const deleteJobOffer = async (id: string) => {
    try {
      const { error } = await supabase
        .from('hr_job_offers')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success('Job offer deleted');
      await fetchJobOffers();
      return true;
    } catch (error) {
      console.error('Error deleting job offer:', error);
      toast.error('Failed to delete job offer');
      return false;
    }
  };

  const uploadJobOfferDocument = async (file: File, department: string) => {
    if (!user) return null;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${department.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}.${fileExt}`;
      const filePath = `job-offers/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('hr-documents')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('hr-documents')
        .getPublicUrl(filePath);

      return {
        url: urlData.publicUrl,
        name: file.name
      };
    } catch (error) {
      console.error('Error uploading document:', error);
      toast.error('Failed to upload document');
      return null;
    }
  };

  const getOffersByDepartment = (department: string) => {
    return jobOffers.filter(offer => offer.department === department && offer.is_active);
  };

  return {
    jobOffers,
    isLoading,
    createJobOffer,
    updateJobOffer,
    deleteJobOffer,
    uploadJobOfferDocument,
    getOffersByDepartment,
    refreshJobOffers: fetchJobOffers,
    departments: DEPARTMENTS
  };
};

export const useHRApplicants = () => {
  const { user } = useAuth();
  const [applicants, setApplicants] = useState<JobApplicant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApplicants = useCallback(async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hr_job_applicants')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplicants(data || []);
    } catch (error) {
      console.error('Error fetching applicants:', error);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchApplicants();
  }, [fetchApplicants]);

  const sendJobOffer = async (applicantId: string, jobOfferId: string) => {
    try {
      const { error } = await supabase
        .from('hr_job_applicants')
        .update({
          job_offer_id: jobOfferId,
          job_offer_sent_at: new Date().toISOString(),
          status: 'offer_sent'
        })
        .eq('id', applicantId);

      if (error) throw error;
      
      toast.success('Job offer sent to applicant');
      await fetchApplicants();
      return true;
    } catch (error) {
      console.error('Error sending job offer:', error);
      toast.error('Failed to send job offer');
      return false;
    }
  };

  const updateApplicantStatus = async (applicantId: string, status: string) => {
    try {
      const { error } = await supabase
        .from('hr_job_applicants')
        .update({ status })
        .eq('id', applicantId);

      if (error) throw error;
      
      toast.success('Applicant status updated');
      await fetchApplicants();
      return true;
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
      return false;
    }
  };

  return {
    applicants,
    isLoading,
    sendJobOffer,
    updateApplicantStatus,
    refreshApplicants: fetchApplicants
  };
};
