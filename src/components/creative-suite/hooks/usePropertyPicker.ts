import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { PropertySnapshot } from '../types';

interface Property {
  id: string;
  name: string;
  slug: string;
  developer_name?: string;
  area_name?: string;
  emirate?: string;
  location?: string;
  price_from?: number;
  price_to?: number;
  bedrooms_min?: number;
  bedrooms_max?: number;
  payment_plan?: string;
  expected_completion?: string;
  cover_image_url?: string;
  description?: string;
  amenities?: string[];
  latitude?: number;
  longitude?: number;
}

export function usePropertyPicker() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    emirate: '',
    priceMin: 0,
    priceMax: 0,
    bedrooms: '',
  });

  const searchProperties = useCallback(async (term: string = searchTerm) => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('projects')
        .select(`
          id,
          name,
          slug,
          developer_name,
          area_name,
          emirate,
          location,
          price_from,
          price_to,
          bedrooms_min,
          bedrooms_max,
          payment_plan,
          expected_completion,
          cover_image_url,
          description,
          amenities,
          latitude,
          longitude
        `)
        .eq('is_published', true)
        .order('name');

      // Apply search term
      if (term) {
        query = query.or(`name.ilike.%${term}%,developer_name.ilike.%${term}%,area_name.ilike.%${term}%`);
      }

      // Apply filters
      if (filters.emirate) {
        query = query.eq('emirate', filters.emirate);
      }
      if (filters.priceMin > 0) {
        query = query.gte('price_from', filters.priceMin);
      }
      if (filters.priceMax > 0) {
        query = query.lte('price_to', filters.priceMax);
      }

      const { data, error } = await query.limit(50);

      if (error) throw error;
      setProperties(data || []);
    } catch (err) {
      console.error('Failed to search properties:', err);
    } finally {
      setIsLoading(false);
    }
  }, [searchTerm, filters]);

  const getPropertyAssets = useCallback(async (propertyId: string) => {
    try {
      // Get images
      const { data: images } = await supabase
        .from('project_images')
        .select('image_url, alt_text, display_order')
        .eq('project_id', propertyId)
        .order('display_order');

      // Get documents
      const { data: documents } = await supabase
        .from('project_documents')
        .select('file_url, file_name, document_type')
        .eq('project_id', propertyId);

      return {
        images: images?.map((i) => i.image_url) || [],
        documents: documents || [],
      };
    } catch (err) {
      console.error('Failed to get property assets:', err);
      return { images: [], documents: [] };
    }
  }, []);

  const createPropertySnapshot = useCallback((property: Property): PropertySnapshot => {
    return {
      id: property.id,
      name: property.name,
      slug: property.slug,
      developer_name: property.developer_name,
      area_name: property.area_name,
      emirate: property.emirate,
      location: property.location,
      price_from: property.price_from,
      price_to: property.price_to,
      bedrooms_min: property.bedrooms_min,
      bedrooms_max: property.bedrooms_max,
      payment_plan: property.payment_plan,
      expected_completion: property.expected_completion,
      cover_image_url: property.cover_image_url,
      description: property.description,
      amenities: property.amenities,
      latitude: property.latitude,
      longitude: property.longitude,
    };
  }, []);

  return {
    properties,
    isLoading,
    searchTerm,
    setSearchTerm,
    filters,
    setFilters,
    searchProperties,
    getPropertyAssets,
    createPropertySnapshot,
  };
}
