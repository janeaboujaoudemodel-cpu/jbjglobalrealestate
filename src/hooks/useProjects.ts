import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Project {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  price_from: number | null;
  price_to: number | null;
  bedrooms_min: number | null;
  bedrooms_max: number | null;
  floors: number | null;
  handover_date: string | null;
  service_charge: string | null;
  payment_plan: string | null;
  amenities: string[] | null;
  facilities: string[] | null;
  views: string[] | null;
  furnished_status: string | null;
  emirate: string | null;
  status: string | null;
  is_featured: boolean | null;
  developer: {
    id: string;
    name: string;
    slug: string;
  } | null;
  community: {
    id: string;
    name: string;
    slug: string;
  } | null;
  images: {
    id: string;
    image_url: string;
    alt_text: string | null;
    display_order: number;
  }[];
  documents: {
    id: string;
    document_type: string;
    file_url: string;
    file_name: string;
  }[];
}

export interface Community {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  location: string | null;
}

export interface Developer {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo_url: string | null;
  rank: number;
}

export interface TrendingArea {
  id: string;
  name: string;
  slug: string;
  emirate: string;
  image_url: string | null;
  is_trending: boolean;
}

export function useCommunities() {
  return useQuery({
    queryKey: ["communities"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .order("name");
      
      if (error) throw error;
      return data as Community[];
    },
  });
}

export function useDevelopers() {
  return useQuery({
    queryKey: ["developers"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .order("rank");
      
      if (error) throw error;
      return data as Developer[];
    },
  });
}

export function useTrendingAreas() {
  return useQuery({
    queryKey: ["trending-areas"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("trending_areas")
        .select("*")
        .eq("is_trending", true)
        .order("name");
      
      if (error) throw error;
      return data as TrendingArea[];
    },
  });
}

export function useProjects() {
  return useQuery({
    queryKey: ["projects"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
  });
}

export function useProjectsByCommunity(communitySlug: string) {
  return useQuery({
    queryKey: ["projects", "community", communitySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          community:communities!inner(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name)
        `)
        .eq("community.slug", communitySlug)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!communitySlug,
  });
}

export function useProjectsByDeveloper(developerSlug: string) {
  return useQuery({
    queryKey: ["projects", "developer", developerSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers!inner(id, name, slug),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name)
        `)
        .eq("developer.slug", developerSlug)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data as Project[];
    },
    enabled: !!developerSlug,
  });
}

export function useProject(projectSlug: string) {
  return useQuery({
    queryKey: ["project", projectSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("projects")
        .select(`
          *,
          developer:developers(id, name, slug),
          community:communities(id, name, slug),
          images:project_images(id, image_url, alt_text, display_order),
          documents:project_documents(id, document_type, file_url, file_name)
        `)
        .eq("slug", projectSlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Project | null;
    },
    enabled: !!projectSlug,
  });
}

export function useCommunity(communitySlug: string) {
  return useQuery({
    queryKey: ["community", communitySlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("communities")
        .select("*")
        .eq("slug", communitySlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Community | null;
    },
    enabled: !!communitySlug,
  });
}

export function useDeveloper(developerSlug: string) {
  return useQuery({
    queryKey: ["developer", developerSlug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developers")
        .select("*")
        .eq("slug", developerSlug)
        .maybeSingle();
      
      if (error) throw error;
      return data as Developer | null;
    },
    enabled: !!developerSlug,
  });
}
