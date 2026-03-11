import { BrandedLoader } from "@/components/ui/BrandedLoader";

/**
 * PageLoader - Global loading fallback for lazy-loaded pages
 * Displays the JBJ monogram with a gold fill animation
 */
const PageLoader = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <BrandedLoader text="Loading..." className="min-h-screen" />
  </div>
);

/**
 * InlinePageLoader - Layout-safe loader for use inside MainLayout
 * Does NOT replace the entire screen — keeps header/sidebar stable
 */
export const InlinePageLoader = () => (
  <div className="flex items-center justify-center py-32 min-h-[60vh]">
    <BrandedLoader text="Loading..." variant="light" className="min-h-0" />
  </div>
);

export default PageLoader;
