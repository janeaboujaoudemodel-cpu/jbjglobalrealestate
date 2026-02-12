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

export default PageLoader;
