/**
 * RENTAL LISTINGS HOOK
 * Manages landlord rental property listings with approval workflow
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// Approval workflow configuration
export const APPROVAL_WORKFLOW = [
  {
    step: 1,
    name: 'Admin Review',
    role: 'admin',
    approverName: 'Sarah Mitchell',
    approverTitle: 'Operations Manager',
    approverDepartment: 'Operations',
    approverPhoto: '/team/sarah-mitchell.jpg',
    approverEmail: 'sarah@jbj.ae',
    approverLanguages: ['English', 'Arabic'],
    approverNationality: 'British',
    approverExperience: '8 years in real estate operations',
    approverBio: 'Sarah leads our operations team with a focus on ensuring quality and compliance across all property listings.',
    joinedDate: '2019-03-15',
  },
  {
    step: 2,
    name: 'Executive Review',
    role: 'executive_assistant',
    approverName: 'Amanda Clarke',
    approverTitle: 'Executive Assistant to the Founder',
    approverDepartment: 'Executive Office',
    approverPhoto: '/team/amanda-clarke.jpg',
    approverEmail: 'amanda@jbj.ae',
    approverLanguages: ['English', 'French', 'Arabic'],
    approverNationality: 'Australian',
    approverExperience: '12 years in executive administration',
    approverBio: 'Amanda serves as the bridge between operations and executive leadership, ensuring all strategic decisions are properly vetted.',
    joinedDate: '2018-01-10',
  },
  {
    step: 3,
    name: 'Final Approval',
    role: 'founder',
    approverName: 'Jane Abou Jaoude',
    approverTitle: 'Founder & CEO',
    approverDepartment: 'Executive',
    approverPhoto: '/team/jane-abou-jaoude.jpg',
    approverEmail: 'janeabujaudenails@gmail.com',
    approverLanguages: ['English', 'Arabic', 'French', 'Lebanese'],
    approverNationality: 'Lebanese',
    approverExperience: '15+ years in luxury real estate',
    approverBio: 'Jane founded JBJ Global Real Estate with a vision to revolutionize the luxury property market in the UAE.',
    joinedDate: '2017-01-01',
  },
];

export interface RentalListing {
  id: string;
  user_id: string;
  property_title: string;
  property_type: string;
  bedrooms: number | null;
  bathrooms: number | null;
  size_sqft: number | null;
  furnished: string;
  emirate: string;
  community: string | null;
  building_name: string | null;
  address: string | null;
  annual_rent: number;
  payment_terms: string;
  security_deposit: number | null;
  landlord_name: string;
  landlord_email: string;
  landlord_phone: string;
  landlord_nationality: string | null;
  ownership_type: string;
  images: string[] | null;
  documents: string[] | null;
  video_url: string | null;
  description: string | null;
  amenities: string[] | null;
  status: string;
  rejection_reason: string | null;
  admin_approved_at: string | null;
  admin_approved_by: string | null;
  assistant_approved_at: string | null;
  assistant_approved_by: string | null;
  founder_approved_at: string | null;
  founder_approved_by: string | null;
  went_live_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface RentalListingApproval {
  id: string;
  listing_id: string;
  step_number: number;
  step_name: string;
  approver_role: string;
  approver_name: string | null;
  approver_email: string | null;
  approver_photo: string | null;
  approver_title: string | null;
  approver_department: string | null;
  status: string;
  notes: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface RentalListingNotification {
  id: string;
  listing_id: string;
  user_id: string;
  notification_type: string;
  title: string;
  message: string;
  step_completed: string | null;
  is_read: boolean;
  created_at: string;
}

export interface CreateRentalListingRequest {
  property_title: string;
  property_type: string;
  bedrooms?: number;
  bathrooms?: number;
  size_sqft?: number;
  furnished?: string;
  emirate: string;
  community?: string;
  building_name?: string;
  address?: string;
  annual_rent: number;
  payment_terms?: string;
  security_deposit?: number;
  landlord_name: string;
  landlord_email: string;
  landlord_phone: string;
  landlord_nationality?: string;
  ownership_type?: string;
  images?: string[];
  documents?: string[];
  video_url?: string;
  description?: string;
  amenities?: string[];
}

export function useRentalListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<RentalListing[]>([]);
  const [currentListing, setCurrentListing] = useState<RentalListing | null>(null);
  const [approvals, setApprovals] = useState<RentalListingApproval[]>([]);
  const [notifications, setNotifications] = useState<RentalListingNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user's rental listings
  const fetchListings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('rental_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings((data as unknown as RentalListing[]) || []);
    } catch (error) {
      console.error('Error fetching rental listings:', error);
      toast.error('Failed to fetch your rental listings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch a specific listing with approvals
  const fetchListing = useCallback(async (listingId: string) => {
    setIsLoading(true);
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('rental_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;
      setCurrentListing(listingData as unknown as RentalListing);

      const { data: approvalsData, error: approvalsError } = await supabase
        .from('rental_listing_approvals')
        .select('*')
        .eq('listing_id', listingId)
        .order('step_number', { ascending: true });

      if (approvalsError) throw approvalsError;
      setApprovals((approvalsData as unknown as RentalListingApproval[]) || []);

      return listingData as unknown as RentalListing;
    } catch (error) {
      console.error('Error fetching rental listing:', error);
      toast.error('Failed to fetch listing details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create a new rental listing
  const createListing = useCallback(async (data: CreateRentalListingRequest): Promise<RentalListing | null> => {
    if (!user) {
      toast.error('Please sign in to create a listing');
      return null;
    }

    setIsLoading(true);
    try {
      const { data: listing, error } = await supabase
        .from('rental_listings')
        .insert({
          ...data,
          user_id: user.id,
          status: 'pending_review',
        })
        .select()
        .single();

      if (error) throw error;

      // Create approval workflow entries
      const approvalEntries = APPROVAL_WORKFLOW.map((step) => ({
        listing_id: listing.id,
        step_number: step.step,
        step_name: step.name,
        approver_role: step.role,
        approver_name: step.approverName,
        approver_email: step.approverEmail,
        approver_photo: step.approverPhoto,
        approver_title: step.approverTitle,
        approver_department: step.approverDepartment,
        status: step.step === 1 ? 'pending' : 'pending',
      }));

      await supabase.from('rental_listing_approvals').insert(approvalEntries);

      // Create initial notification
      await supabase.from('rental_listing_notifications').insert({
        listing_id: listing.id,
        user_id: user.id,
        notification_type: 'submission',
        title: 'Listing Submitted Successfully',
        message: `Your rental listing "${data.property_title}" has been submitted for review. Track your application status in your dashboard.`,
        step_completed: 'submission',
      });

      toast.success('Rental listing submitted successfully!', {
        description: 'Your application is now pending review.',
      });

      await fetchListings();
      return listing as unknown as RentalListing;
    } catch (error) {
      console.error('Error creating rental listing:', error);
      toast.error('Failed to submit rental listing');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [user, fetchListings]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('rental_listing_notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data as unknown as RentalListingNotification[]) || []);
      setUnreadCount((data as unknown as RentalListingNotification[])?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('rental_listing_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchNotifications]);

  // Get approval status for a listing
  const getApprovalStatus = useCallback((listing: RentalListing) => {
    const steps = [
      {
        step: 1,
        name: 'Admin Review',
        completed: !!listing.admin_approved_at,
        approvedAt: listing.admin_approved_at,
        approvedBy: listing.admin_approved_by,
        ...APPROVAL_WORKFLOW[0],
      },
      {
        step: 2,
        name: 'Executive Review',
        completed: !!listing.assistant_approved_at,
        approvedAt: listing.assistant_approved_at,
        approvedBy: listing.assistant_approved_by,
        ...APPROVAL_WORKFLOW[1],
      },
      {
        step: 3,
        name: 'Final Approval',
        completed: !!listing.founder_approved_at,
        approvedAt: listing.founder_approved_at,
        approvedBy: listing.founder_approved_by,
        ...APPROVAL_WORKFLOW[2],
      },
    ];

    const currentStep = steps.findIndex((s) => !s.completed) + 1 || 4;
    const isLive = listing.status === 'live';
    const isRejected = listing.status === 'rejected';

    return { steps, currentStep, isLive, isRejected };
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('rental-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'rental_listing_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as unknown as RentalListingNotification;
          setNotifications((prev) => [notification, ...prev]);
          setUnreadCount((prev) => prev + 1);
          toast.success(notification.title, {
            description: notification.message,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  // Initial fetch
  useEffect(() => {
    if (user) {
      fetchListings();
      fetchNotifications();
    }
  }, [user, fetchListings, fetchNotifications]);

  return {
    listings,
    currentListing,
    approvals,
    notifications,
    unreadCount,
    isLoading,
    fetchListings,
    fetchListing,
    createListing,
    fetchNotifications,
    markNotificationRead,
    getApprovalStatus,
    APPROVAL_WORKFLOW,
  };
}

export default useRentalListings;
