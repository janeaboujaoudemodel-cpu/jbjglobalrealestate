import { useInfiniteQuery } from "@tanstack/react-query";
 
 const PAGE_SIZE = 24;
 
 export interface ReellyProjectImage {
   image_url: string;
   alt_text: string;
 }
 
 export interface ReellyProject {
   id: number;
   name: string;
   slug: string;
   developer_name: string;
   construction_status: string | null;
   sale_status: string | null;
   status_label: string | null;
   description: string | null;
   handover_date: string | null;
   location: string | null;
   emirate: string | null;
   latitude: number | null;
   longitude: number | null;
   price_from: number | null;
   price_to: number | null;
   size_min: number | null;
   size_max: number | null;
   thumbnail: string | null;
   gallery: string[];
   images: ReellyProjectImage[];
 }
 
 interface ReellyProjectsResponse {
   success: boolean;
   data?: {
     projects: ReellyProject[];
     pagination: {
       total: number;
       limit: number;
       offset: number;
       hasMore: boolean;
     };
   };
   error?: string;
 }
 
export interface ReellyFilters {
    search?: string;
    emirate?: string;
    developerName?: string;
    saleStatus?: string;
    constructionStatus?: string;
  }
  
 async function fetchReellyProjects(
   offset: number,
   filters?: ReellyFilters
 ): Promise<ReellyProjectsResponse> {
   const params = new URLSearchParams({
     limit: String(PAGE_SIZE),
     offset: String(offset),
   });
 
   if (filters?.search) params.set('search', filters.search);
   if (filters?.emirate) params.set('emirate', filters.emirate);
   if (filters?.saleStatus) params.set('sale_status', filters.saleStatus);
   if (filters?.constructionStatus) params.set('construction_status', filters.constructionStatus);
   if (filters?.developerName) params.set('developer_name', filters.developerName);

  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reelly-projects?${params.toString()}`,
    {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch projects: ${response.status}`);
  }

  return response.json();
}
 
 export function useReellyProjects(filters?: ReellyFilters) {
   return useInfiniteQuery({
     queryKey: ['reelly-projects', filters],
     queryFn: async ({ pageParam = 0 }) => {
       const result = await fetchReellyProjects(pageParam as number, filters);
       if (!result.success) {
         throw new Error(result.error || 'Failed to fetch projects');
       }
       return result.data!;
     },
     getNextPageParam: (lastPage) => {
       if (lastPage.pagination.hasMore) {
         return lastPage.pagination.offset + lastPage.pagination.limit;
       }
       return undefined;
     },
     initialPageParam: 0,
     staleTime: 2 * 60 * 1000, // Cache for 2 minutes
   });
 }
 
 // Helper to flatten pages into single array
 export function flattenReellyProjects(
   data: ReturnType<typeof useReellyProjects>['data']
 ): ReellyProject[] {
   if (!data?.pages) return [];
   return data.pages.flatMap(page => page.projects);
 }
 
 // Get total count from the query
 export function getReellyProjectsTotal(
   data: ReturnType<typeof useReellyProjects>['data']
 ): number {
   if (!data?.pages?.length) return 0;
   return data.pages[0].pagination.total;
 }