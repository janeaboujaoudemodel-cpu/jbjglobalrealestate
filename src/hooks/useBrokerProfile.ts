import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface BrokerProfile {
  id: string;
  user_id: string;
  display_name: string;
  title: string | null;
  bio: string | null;
  photo_url: string | null;
  email: string | null;
  phone: string | null;
  is_public: boolean;
  is_active: boolean;
  specializations: string[];
  languages: string[];
  years_experience: number;
  broker_type: 'internal' | 'external';
  current_tier: string;
  total_points: number;
  custom_title: string | null;
  custom_label: string | null;
  performance_rating: string;
  verification_status: string;
  rera_expiry_date: string | null;
  id_expiry_date: string | null;
  probation_end: string | null;
  probation_skipped: boolean;
  show_contact_public: boolean;
  show_last_name_public: boolean;
}

export function useBrokerProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<BrokerProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }

    const fetchProfile = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from("broker_profiles")
          .select("*")
          .eq("user_id", user.id)
          .maybeSingle();

        if (fetchError) throw fetchError;

        if (data) {
          setProfile({
            ...data,
            broker_type: (data.broker_type as 'internal' | 'external') || 'external',
            specializations: data.specializations || [],
            languages: data.languages || ['en'],
            years_experience: data.years_experience || 0,
            is_public: data.is_public ?? false,
            is_active: data.is_active ?? true,
          });
        } else {
          setProfile(null);
        }
      } catch (err) {
        console.error("Error fetching broker profile:", err);
        setError("Failed to load broker profile");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const isInternalBroker = profile?.broker_type === 'internal';
  const isExternalBroker = profile?.broker_type === 'external';

  return {
    profile,
    loading,
    error,
    isInternalBroker,
    isExternalBroker,
    hasBrokerProfile: !!profile,
  };
}
