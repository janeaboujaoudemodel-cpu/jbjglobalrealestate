/**
 * SELLER LISTINGS HOOK
 * Manages property sale listings with unified 4-step approval workflow
 * 
 * Workflow: Admin → Leadership → Executive Assistant → Founder
 */

import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { 
  UNIFIED_APPROVAL_WORKFLOW, 
  APPROVAL_WORKFLOW,
  type ApprovalStep 
} from '@/config/listing-approval-workflow';

// Re-export for backwards compatibility
export { APPROVAL_WORKFLOW };

export interface SellerListing {
  id: string;
  user_id: string;
  seller_full_name: string;
  seller_phone: string;
  seller_email: string;
  preferred_language: string | null;
  preferred_contact_method: string | null;
  seller_type: string;
  property_type: string;
  property_location: string;
  community_building: string | null;
  bedrooms: number | null;
  property_size_sqft: number | null;
  property_status: string | null;
  property_notes: string | null;
  purchase_price: number | null;
  target_selling_price: number;
  minimum_acceptable_price: number | null;
  selling_urgency: string | null;
  estimated_value_range: any | null;
  is_furnished: boolean | null;
  has_upgrades: boolean | null;
  upgrade_details: string | null;
  key_highlights: string[] | null;
  photo_urls: string[] | null;
  video_urls: string[] | null;
  floor_plan_urls: string[] | null;
  title_deed_url: string | null;
  passport_url: string | null;
  poa_url: string | null;
  additional_doc_urls: string[] | null;
  ai_generated_description: string | null;
  listing_description: string | null;
  status: string;
  submission_confirmed: boolean | null;
  submitted_at: string | null;
  reviewed_at: string | null;
  reviewed_by: string | null;
  review_notes: string | null;
  rejection_reason: string | null;
  // 4-step approval workflow columns
  admin_approved_at: string | null;
  admin_approved_by: string | null;
  leadership_approved_at: string | null;
  leadership_approved_by: string | null;
  assistant_approved_at: string | null;
  assistant_approved_by: string | null;
  founder_approved_at: string | null;
  founder_approved_by: string | null;
  went_live_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SellerListingApproval {
  id: string;
  listing_id: string;
  listing_type: string;
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

export interface SellerListingNotification {
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

export function useSellerListings() {
  const { user } = useAuth();
  const [listings, setListings] = useState<SellerListing[]>([]);
  const [currentListing, setCurrentListing] = useState<SellerListing | null>(null);
  const [approvals, setApprovals] = useState<SellerListingApproval[]>([]);
  const [notifications, setNotifications] = useState<SellerListingNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch user's seller listings
  const fetchListings = useCallback(async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('seller_listings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setListings((data as unknown as SellerListing[]) || []);
    } catch (error) {
      console.error('Error fetching seller listings:', error);
      toast.error('Failed to fetch your seller listings');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // Fetch a specific listing with approvals
  const fetchListing = useCallback(async (listingId: string) => {
    setIsLoading(true);
    try {
      const { data: listingData, error: listingError } = await supabase
        .from('seller_listings')
        .select('*')
        .eq('id', listingId)
        .single();

      if (listingError) throw listingError;
      setCurrentListing(listingData as unknown as SellerListing);

      const { data: approvalsData, error: approvalsError } = await supabase
        .from('listing_approvals')
        .select('*')
        .eq('listing_id', listingId)
        .eq('listing_type', 'sale')
        .order('step_number', { ascending: true });

      if (approvalsError) throw approvalsError;
      setApprovals((approvalsData as unknown as SellerListingApproval[]) || []);

      return listingData as unknown as SellerListing;
    } catch (error) {
      console.error('Error fetching seller listing:', error);
      toast.error('Failed to fetch listing details');
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Create approval workflow entries for a listing
  const createApprovalWorkflow = useCallback(async (listingId: string) => {
    try {
      const approvalEntries = UNIFIED_APPROVAL_WORKFLOW.map((step) => ({
        listing_id: listingId,
        listing_type: 'sale',
        step_number: step.step,
        step_name: step.name,
        approver_role: step.role,
        approver_name: step.approverName,
        approver_email: step.approverEmail,
        approver_photo: step.approverPhoto,
        approver_title: step.approverTitle,
        approver_department: step.approverDepartment,
        status: 'pending',
      }));

      const { error } = await supabase.from('listing_approvals').insert(approvalEntries);
      if (error) throw error;
    } catch (error) {
      console.error('Error creating approval workflow:', error);
    }
  }, []);

  // Create initial notification for a listing
  const createInitialNotification = useCallback(async (listingId: string, propertyInfo: string) => {
    if (!user) return;
    try {
      await supabase.from('listing_notifications').insert({
        listing_id: listingId,
        listing_type: 'sale',
        user_id: user.id,
        notification_type: 'submission',
        title: 'Listing Submitted Successfully',
        message: `Your property listing "${propertyInfo}" has been submitted for review. Track your application status in your dashboard.`,
        step_completed: 'submission',
      });
    } catch (error) {
      console.error('Error creating notification:', error);
    }
  }, [user]);

  // Fetch notifications
  const fetchNotifications = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('listing_notifications')
        .select('*')
        .eq('user_id', user.id)
        .eq('listing_type', 'sale')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setNotifications((data as unknown as SellerListingNotification[]) || []);
      setUnreadCount((data as unknown as SellerListingNotification[])?.filter((n) => !n.is_read).length || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  }, [user]);

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await supabase
        .from('listing_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
      await fetchNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }, [fetchNotifications]);

  // Get approval status for a listing (4-step unified workflow)
  const getApprovalStatus = useCallback((listing: SellerListing) => {
    const steps = [
      {
        step: 1,
        name: 'Admin Review',
        completed: !!listing.admin_approved_at,
        approvedAt: listing.admin_approved_at,
        approvedBy: listing.admin_approved_by,
        ...UNIFIED_APPROVAL_WORKFLOW[0],
      },
      {
        step: 2,
        name: 'Leadership Review',
        completed: !!listing.leadership_approved_at,
        approvedAt: listing.leadership_approved_at,
        approvedBy: listing.leadership_approved_by,
        ...UNIFIED_APPROVAL_WORKFLOW[1],
      },
      {
        step: 3,
        name: 'Executive Review',
        completed: !!listing.assistant_approved_at,
        approvedAt: listing.assistant_approved_at,
        approvedBy: listing.assistant_approved_by,
        ...UNIFIED_APPROVAL_WORKFLOW[2],
      },
      {
        step: 4,
        name: 'Final Approval',
        completed: !!listing.founder_approved_at,
        approvedAt: listing.founder_approved_at,
        approvedBy: listing.founder_approved_by,
        ...UNIFIED_APPROVAL_WORKFLOW[3],
      },
    ];

    const currentStep = steps.findIndex((s) => !s.completed) + 1 || 5;
    const isLive = listing.status === 'live';
    const isRejected = listing.status === 'rejected';

    return { steps, currentStep, isLive, isRejected };
  }, []);

  // Subscribe to realtime notifications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('seller-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'listing_notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          const notification = payload.new as unknown as SellerListingNotification;
          if (notification) {
            setNotifications((prev) => [notification, ...prev]);
            setUnreadCount((prev) => prev + 1);
            toast.success(notification.title, {
              description: notification.message,
            });
          }
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
    createApprovalWorkflow,
    createInitialNotification,
    fetchNotifications,
    markNotificationRead,
    getApprovalStatus,
    APPROVAL_WORKFLOW: UNIFIED_APPROVAL_WORKFLOW,
  };
}

export default useSellerListings;
