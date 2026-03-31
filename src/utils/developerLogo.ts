/**
 * Safely extract developer logo_url from a Supabase join result.
 * Supabase joins return arrays (not objects), so we need to handle both cases.
 * 
 * LOCKED: Developer logos must ALWAYS come from the logo_url field.
 * Never use feature_image_url, cover_image_url, or any photo as a logo substitute.
 */
export function getDeveloperLogoUrl(developer: unknown): string | null {
  if (!developer) return null;
  
  // If it's an array (Supabase join), take the first element
  const dev = Array.isArray(developer) ? developer[0] : developer;
  if (!dev) return null;
  
  return (dev as any).logo_url || null;
}

export function getDeveloperLogoBgColor(developer: unknown): string | null {
  if (!developer) return null;
  const dev = Array.isArray(developer) ? developer[0] : developer;
  if (!dev) return null;
  return (dev as any).logo_bg_color || null;
}

export function getDeveloperSlug(developer: unknown): string | null {
  if (!developer) return null;
  const dev = Array.isArray(developer) ? developer[0] : developer;
  if (!dev) return null;
  return (dev as any).slug || null;
}

export function getDeveloperName(developer: unknown): string | null {
  if (!developer) return null;
  const dev = Array.isArray(developer) ? developer[0] : developer;
  if (!dev) return null;
  return (dev as any).name || null;
}
