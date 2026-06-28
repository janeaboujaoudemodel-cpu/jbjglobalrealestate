 import { useState } from "react";
 import { Link } from "react-router-dom";
 import type { ReellyProject } from "@/hooks/useReellyProjects";
 import FavoriteButton from "./FavoriteButton";
 import ShortlistBadgeButton from "./ShortlistBadgeButton";
 import { ChevronLeft, ChevronRight, MapPin, Mail, Phone, MessageCircle } from "lucide-react";
 import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
import { VerifiedMedia } from "@/components/ui/verified-media";
import { DeveloperLink } from "@/components/ui/developer-link";
import { sanitizeForDisplay } from "@/utils/contentSanitizer";
import { deriveHandover } from "@/utils/handoverDerivation";
import { CardBadge, resolveSaleStatusLabel } from "@/components/ui/card-badge";
import { CardPricePaymentRow } from "@/components/ui/card-price-payment-row";
 
interface ReellyProjectCardProps {
  project: ReellyProject;
  showFavorite?: boolean;
  showBadgeButton?: boolean;
 currency?: 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';
  sizeUnit?: 'sqft' | 'sqm';
  compact?: boolean;
}
 
// Currency conversion rates - 10 unified currencies
 const CURRENCY_RATES: Record<string, number> = {
   AED: 1,
   USD: 0.27,
   EUR: 0.25,
   GBP: 0.21,
   INR: 22.5,
  SAR: 1.02,
  CNY: 1.98,
  RUB: 24.5,
  CAD: 0.37,
  AUD: 0.42,
 };
 
 const CURRENCY_SYMBOLS: Record<string, string> = {
   AED: 'AED',
   USD: '$',
   EUR: '€',
   GBP: '£',
   INR: '₹',
  SAR: 'SAR',
  CNY: '¥',
  RUB: '₽',
  CAD: 'C$',
  AUD: 'A$',
 };
 
 // Helper to format price with currency conversion
 const formatPriceWithCurrency = (price: number, currency: string = 'AED'): string => {
   const converted = Math.round(price * CURRENCY_RATES[currency]);
   const symbol = CURRENCY_SYMBOLS[currency];
   if (converted >= 1000000) {
     return `${symbol} ${(converted / 1000000).toFixed(1)}M`;
   }
   if (converted >= 1000) {
     return `${symbol} ${Math.round(converted / 1000)}K`;
   }
   return `${symbol} ${converted.toLocaleString('en-US')}`;
 };
 
// Sale status label resolver — visual style owned by <CardBadge variant="status" />.
const getSaleStatusLabel = resolveSaleStatusLabel;
 
const ReellyProjectCard = ({ 
  project, 
  showFavorite = true, 
  showBadgeButton = true, 
  currency = 'AED', 
  sizeUnit = 'sqft',
  compact = false,
}: ReellyProjectCardProps) => {
   const [currentImageIndex, setCurrentImageIndex] = useState(0);
   const images = project.images || [];
   const primaryImageUrl = images[currentImageIndex]?.image_url || project.thumbnail || project.gallery?.[0] || null;
 
   const handlePrevImage = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setCurrentImageIndex(prev => prev === 0 ? images.length - 1 : prev - 1);
   };
 
   const handleNextImage = (e: React.MouseEvent) => {
     e.preventDefault();
     e.stopPropagation();
     setCurrentImageIndex(prev => prev === images.length - 1 ? 0 : prev + 1);
   };
 
   const whatsappMessage = `Hello JBJ Global Real Estate,\n\nI am interested in ${project.name} located in ${project.location || 'UAE'}.\n\nPlease provide more details about this property.\n\nThank you.`;
   const whatsappHref = getWhatsAppUrl(whatsappMessage);
   const callHref = getCallUrl();
 
   // Get size range text
   const getSizeText = () => {
     if (!project.size_min) return null;
     const min = project.size_min.toLocaleString();
     const max = project.size_max?.toLocaleString();
     if (min === max || !max) return `${min} ${sizeUnit}`;
     return `${min}-${max} ${sizeUnit}`;
   };
 
   // Truncate description - strip markdown/headers + HTML + competitor refs
     const getTruncatedDescription = () => {
       if (!project.description) return null;
       let clean = sanitizeForDisplay(project.description)
         .replace(/#{1,6}\s*/g, '')
         .replace(/\*{1,3}/g, '')
         .replace(/project\s*general\s*facts/gi, '')
         .trim();
       const maxLength = 80;
       if (clean.length <= maxLength) return clean;
       return clean.substring(0, maxLength).trim();
     };
 
   const saleStatusLabel = getSaleStatusLabel(project.sale_status);
 
   return (
      <div
        className={
          "group relative overflow-hidden rounded-xl border-[3px] border-[#B89555] transition-all duration-200 flex flex-col " +
          "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
          "shadow-[0_8px_32px_rgba(200,167,102,0.25),0_4px_16px_rgba(0,0,0,0.15)] " +
          "hover:shadow-[0_12px_40px_rgba(200,167,102,0.3),0_8px_24px_rgba(0,0,0,0.2)] " +
          "hover:-translate-y-1"
        }
      >
       {/* Top-right card actions — hover-revealed via PASS 97 */}
       {(showFavorite || showBadgeButton) && (
         <div
           className="absolute top-3 right-3 z-20 flex flex-col gap-1.5"
           data-card-actions-overlay=""
         >
           {showFavorite && (
             <FavoriteButton projectId={String(project.id)} size="md" />
           )}
           {showBadgeButton && (
             <ShortlistBadgeButton projectId={String(project.id)} size="md" showBadgeIndicator={true} />
           )}
         </div>
       )}

 
       <Link to={`/project/${project.slug}`} className="flex-1 flex flex-col">
         {/* Image with Carousel */}
          <div className="aspect-[16/10] overflow-hidden relative bg-[#EFE6D6]">
              <VerifiedMedia
                src={primaryImageUrl}
                alt={images[currentImageIndex]?.alt_text || project.name}
                className="object-cover w-full h-full"
                placeholderLabel=""
              />
            
           
             {/* Top-Left: Sale Status Badge */}
              {(() => {
                const isSold = project.sale_status?.toLowerCase().includes('sold') || project.status_label?.toLowerCase().includes('sold');
                return (
                  <>
                    {saleStatusLabel && !isSold && (
                       <CardBadge variant="status" className="absolute top-3 left-3 z-10">
                        {saleStatusLabel}
                      </CardBadge>
                    )}
                    {isSold && (
                       <CardBadge variant="sold" className="absolute top-3 left-3 z-10">
                        Sold Out
                      </CardBadge>
                    )}
                  </>
                );
              })()}
           
          {/* Price moved out of image overlay into the Reelly-style bottom row below. */}
        </div>

         
         {/* Content */}
         <div className="p-4 flex-1 flex flex-col">
           {/* Project Name */}
           <h4 className="text-[#1A1A1A] text-lg font-bold mb-1 whitespace-normal break-words leading-tight hover:text-[#1A1A1A] transition-colors">
             {project.name}
           </h4>
           
           {/* Location with icon */}
           {project.location && (
             <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
               <MapPin className="w-3.5 h-3.5 text-[#1A1A1A]/70 flex-shrink-0" />
               <span className="truncate">{project.location}</span>
             </div>
           )}
           
          {/* Premium gold divider between location/header and developer */}
          <div className="h-px bg-gradient-to-r from-transparent via-[#B89555]/60 to-transparent my-2" />

           {/* Payment Plan removed from cards — shown only on details page */}
           
           {/* Size info - hidden in compact mode */}
           {!compact && (
             <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3 flex-wrap">
               {getSizeText() && (
                 <span>{getSizeText()}</span>
               )}
               {project.emirate && (
                 <>
                   <span className="text-[#1A1A1A]/70">|</span>
                   <span>{project.emirate}</span>
                 </>
               )}
             </div>
           )}
           
           {/* Developer - Clickable, directly after title/header area, above description */}
           {project.developer_name && (
             <DeveloperLink
               name={project.developer_name}
               slug={(project as any).developer?.slug || null}
               className="text-sm mb-3 block"
               showPrefix={true}
             />
           )}

           {/* Description - hidden in compact mode */}
           {!compact && (
             <p className="text-muted-foreground text-sm leading-relaxed mb-3">
                {getTruncatedDescription() || "Discover this exceptional property opportunity..."}
                 <span className="text-[#1A1A1A] font-bold hover:text-[#1A1A1A] cursor-pointer ml-1">
                   ...more
                 </span>
             </p>
           )}

            {/* Premium full-width divider — before bottom row */}
            <div className="w-full border-t border-[#B89555]/45" />

            {/* Spacer pushes bottom row to the very bottom */}
            <div className="flex-1" />

            {/* Reelly-style bottom row: Price from (left) + Payment plan (right) */}
            <div className="pt-2">
              <CardPricePaymentRow
                price={project.price_from}
                currency={currency}
                project={project as any}
              />
            </div>

            {deriveHandover(project) && (
              <div className="flex justify-end mt-1">
                <span
                  data-surface="emerald"
                  data-emerald="true"
                  data-emerald-ok="badge"
                  className="jj-emerald-metallic inline-flex items-center px-2 py-1 rounded-md text-[11px] font-semibold tabular-nums tracking-wide text-white [&_*]:text-white"
                >
                  {deriveHandover(project)}
                </span>
              </div>
            )}
         </div>
       </Link>

 
       {/* CTA Buttons - hidden in compact mode */}
       {!compact && (
         <div className="px-4 pb-4 pt-0">
           <div className="grid grid-cols-3 gap-2 border-t border-[#B89555]/20 pt-3">
              <a
                href={`mailto:${CONTACT_INFO.email}?subject=Inquiry: ${encodeURIComponent(project.name)}&body=${encodeURIComponent(`Hello JBJ Global Real Estate,\n\nI am interested in ${project.name}${project.location ? ` located in ${project.location}` : ''}.\n\nPlease provide more details.\n\nThank you.`)}`}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Email about ${project.name}`}
                 data-surface="emerald"
                 data-emerald-ok="button"
                 className="jj-emerald-metallic w-full min-w-0 overflow-hidden h-9 px-2 flex items-center justify-center gap-1.5 rounded-lg"
              >
                <Mail className="w-4 h-4" />
                <span>Email</span>
              </a>
              <a
                href={callHref}
                onClick={(e) => e.stopPropagation()}
                aria-label={`Call about ${project.name}`}
                 data-surface="emerald"
                 data-emerald-ok="button"
                 className="jj-emerald-metallic w-full min-w-0 overflow-hidden h-9 px-2 flex items-center justify-center gap-1.5 rounded-lg"
              >
                <Phone className="w-4 h-4" />
                <span>Call</span>
              </a>
              <a
                href={whatsappHref}
                onClick={(e) => e.stopPropagation()}
                aria-label={`WhatsApp about ${project.name}`}
                 data-surface="emerald"
                 data-emerald-ok="button"
                 className="jj-emerald-metallic w-full min-w-0 overflow-hidden h-9 px-2 flex items-center justify-center gap-1.5 rounded-lg"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Chat</span>
              </a>
           </div>
         </div>
       )}
     </div>
   );
 };
 
 export default ReellyProjectCard;