import type { ReellyProject } from "@/hooks/useReellyProjects";

/**
 * Convert a database project row to ReellyProject format.
 * Used by both useLocalProjectSearch and PropertiesReelly (DB fallback).
 */
export function mapDbProjectToReellyProject(p: any): ReellyProject {
  const slug = p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const devName = p.developer_name || (p.developer?.name ?? '');
  const devSlug = p.developer?.slug || p.developer_slug || devName?.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return {
    id: p.reelly_id || p.id,
    name: p.name,
    slug,
    developer_name: devName,
    construction_status: p.construction_status,
    sale_status: p.sale_status,
    status_label: p.status_label || p.sale_status,
    description: p.description || p.short_description,
    handover_date: p.handover_date || p.expected_completion,
    location: p.location || p.area_name,
    emirate: p.emirate,
    latitude: p.latitude ? Number(p.latitude) : null,
    longitude: p.longitude ? Number(p.longitude) : null,
    price_from: p.price_from ? Number(p.price_from) : null,
    price_to: p.price_to ? Number(p.price_to) : null,
    size_min: p.size_min ? Number(p.size_min) : null,
    size_max: p.size_max ? Number(p.size_max) : null,
    thumbnail: p.cover_image_url,
    gallery: [],
    images: [],
    developer: devName ? { name: devName, slug: devSlug, logo_url: p.developer?.logo_url || null, logo_bg_color: p.developer?.logo_bg_color || null } : undefined,
  } as ReellyProject;
}
