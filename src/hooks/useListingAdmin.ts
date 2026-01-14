import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ListingAdmin {
  id: string;
  user_id: string;
  display_name: string;
  email: string;
  is_active: boolean;
  assigned_by_user_id: string | null;
  assigned_at: string;
  last_active_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export const useListingAdmin = () => {
  const [isListingAdmin, setIsListingAdmin] = useState(false);
  const [adminData, setAdminData] = useState<ListingAdmin | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      checkListingAdminStatus();
    } else {
      setIsListingAdmin(false);
      setAdminData(null);
      setIsLoading(false);
    }
  }, [user]);

  const checkListingAdminStatus = async () => {
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from("listing_admins")
        .select("*")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .single();

      if (error && error.code !== "PGRST116") {
        console.error("Error checking listing admin status:", error);
      }

      if (data) {
        setIsListingAdmin(true);
        setAdminData(data as ListingAdmin);

        // Update last_active_at
        await supabase
          .from("listing_admins")
          .update({ last_active_at: new Date().toISOString() })
          .eq("id", data.id);
      } else {
        setIsListingAdmin(false);
        setAdminData(null);
      }
    } catch (err) {
      console.error("Error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isListingAdmin,
    adminData,
    isLoading,
    refreshStatus: checkListingAdminStatus,
  };
};

export const useListingAdminManagement = () => {
  const [listingAdmins, setListingAdmins] = useState<ListingAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchListingAdmins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("listing_admins")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setListingAdmins((data as ListingAdmin[]) || []);
    } catch (err) {
      console.error("Error fetching listing admins:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const addListingAdmin = async (userId: string, displayName: string, email: string, notes?: string) => {
    const { data: sessionData } = await supabase.auth.getSession();
    const assignedBy = sessionData?.session?.user?.id;

    const { data, error } = await supabase
      .from("listing_admins")
      .insert({
        user_id: userId,
        display_name: displayName,
        email,
        notes,
        assigned_by_user_id: assignedBy,
      })
      .select()
      .single();

    if (error) throw error;
    await fetchListingAdmins();
    return data as ListingAdmin;
  };

  const toggleListingAdminStatus = async (adminId: string, isActive: boolean) => {
    const { error } = await supabase
      .from("listing_admins")
      .update({ is_active: isActive })
      .eq("id", adminId);

    if (error) throw error;
    await fetchListingAdmins();
  };

  const removeListingAdmin = async (adminId: string) => {
    const { error } = await supabase
      .from("listing_admins")
      .delete()
      .eq("id", adminId);

    if (error) throw error;
    await fetchListingAdmins();
  };

  useEffect(() => {
    fetchListingAdmins();
  }, []);

  return {
    listingAdmins,
    isLoading,
    fetchListingAdmins,
    addListingAdmin,
    toggleListingAdminStatus,
    removeListingAdmin,
  };
};
