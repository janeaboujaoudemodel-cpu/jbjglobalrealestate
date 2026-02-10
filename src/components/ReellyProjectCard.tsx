 import { useState } from "react";
 import { Link } from "react-router-dom";
 import type { ReellyProject } from "@/hooks/useReellyProjects";
 import FavoriteButton from "./FavoriteButton";
 import ShortlistBadgeButton from "./ShortlistBadgeButton";
 import { ChevronLeft, ChevronRight, MapPin, Mail, Phone, MessageCircle } from "lucide-react";
 import { CONTACT_INFO, getWhatsAppUrl, getCallUrl } from "@/constants/stats";
 import { VerifiedMedia } from "@/components/ui/verified-media";
 import { Button } from "@/components/ui/button";
 
 interface ReellyProjectCardProps {
   project: ReellyProject;
   showFavorite?: boolean;
   showBadgeButton?: boolean;
  currency?: 'AED' | 'USD' | 'EUR' | 'GBP' | 'INR' | 'SAR' | 'CNY' | 'RUB' | 'CAD' | 'AUD';
   sizeUnit?: 'sqft' | 'sqm';
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
 
 // Get sale status badge styling
 const getSaleStatusBadge = (status?: string | null) => {
   if (!status) return null;
   
   const normalizedStatus = status.toLowerCase();
   
   if (normalizedStatus.includes('on sale') || normalizedStatus.includes('start')) {
     return { label: 'On Sale', className: 'bg-emerald-500 text-white' };
   }
   if (normalizedStatus.includes('sold') || normalizedStatus.includes('out of stock')) {
     return { label: 'Sold Out', className: 'bg-destructive text-destructive-foreground' };
   }
   if (normalizedStatus.includes('announced')) {
     return { label: 'Announced', className: 'bg-gold text-black' };
   }
   if (normalizedStatus.includes('presale') || normalizedStatus.includes('eoi')) {
     return { label: 'Presale', className: 'bg-amber-500 text-black' };
   }
   
   return null;
 };
 
 const ReellyProjectCard = ({ 
   project, 
   showFavorite = true, 
   showBadgeButton = true, 
   currency = 'AED', 
   sizeUnit = 'sqft' 
 }: ReellyProjectCardProps) => {
   const [currentImageIndex, setCurrentImageIndex] = useState(0);
   const images = project.images || [];
 
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
 
   // Truncate description
   const getTruncatedDescription = () => {
     if (!project.description) return null;
     const maxLength = 80;
     if (project.description.length <= maxLength) return project.description;
     return project.description.substring(0, maxLength).trim();
   };
 
   const saleStatusBadge = getSaleStatusBadge(project.sale_status);
 
   return (
     <div
       className={
         "group relative overflow-hidden rounded-xl border-2 border-gold/40 transition-all duration-300 flex flex-col " +
         "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
         "shadow-[0_0_18px_hsl(var(--gold)/0.14),0_18px_55px_hsl(0_0%_0%/0.16)] hover:border-gold/70 " +
         "hover:shadow-[0_0_26px_hsl(var(--gold)/0.18),0_26px_75px_hsl(0_0%_0%/0.20)]"
       }
     >
       {/* Favorite Button */}
       {showFavorite && (
         <div className="absolute top-3 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
           <FavoriteButton projectId={String(project.id)} size="sm" />
         </div>
       )}
 
       {/* Badge Button */}
       {showBadgeButton && (
         <div className="absolute top-12 right-3 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
           <ShortlistBadgeButton projectId={String(project.id)} size="sm" showBadgeIndicator={true} />
         </div>
       )}
 
       <Link to={`/project/${project.slug}`} className="flex-1 flex flex-col">
         {/* Image with Carousel */}
          <div className="aspect-[16/10] overflow-hidden relative">
            {/* Developer Logo Overlay - Top Left */}
            {(project as any).developer?.logo_url && (
              <div className="absolute top-3 left-3 z-15 w-12 h-12 rounded-lg bg-white shadow-lg border border-gold/30 flex items-center justify-center overflow-hidden">
                <img 
                  src={(project as any).developer.logo_url} 
                  alt={project.developer_name || ''}
                  className="w-full h-full object-contain p-1"
                />
              </div>
            )}

            <VerifiedMedia
              src={images[currentImageIndex]?.image_url || project.thumbnail}
              alt={images[currentImageIndex]?.alt_text || project.name}
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              placeholderLabel="Media pending verification"
            />
           
           {/* Navigation Arrows */}
           {images.length > 1 && (
             <>
               <button
                 onClick={handlePrevImage}
                 className={
                   "absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all " +
                   "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
                   "border border-gold/70 text-gold " +
                   "shadow-[0_10px_24px_hsl(0_0%_0%/0.20),inset_0_1px_0_hsl(0_0%_100%/0.55)] " +
                   "hover:bg-gold hover:text-black hover:border-gold"
                 }
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>
               <button
                 onClick={handleNextImage}
                 className={
                   "absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full z-10 flex items-center justify-center transition-all " +
                   "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))] " +
                   "border border-gold/70 text-gold " +
                   "shadow-[0_10px_24px_hsl(0_0%_0%/0.20),inset_0_1px_0_hsl(0_0%_100%/0.55)] " +
                   "hover:bg-gold hover:text-black hover:border-gold"
                 }
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
               
               {/* Image Dots Indicator */}
               <div className="absolute bottom-14 left-1/2 -translate-x-1/2 flex gap-1 z-10">
                 {images.slice(0, 5).map((_, idx) => (
                   <span
                     key={idx}
                     className={`w-1.5 h-1.5 rounded-full transition-colors ${
                       idx === currentImageIndex
                         ? 'bg-gold shadow-[0_0_10px_hsl(var(--gold)/0.55)]'
                         : 'bg-gold/35'
                     }`}
                   />
                 ))}
               </div>
             </>
           )}
           
            {/* Top-Left: Sale Status Badge - offset below dev logo if present */}
             {saleStatusBadge && (
               <div className={`absolute ${(project as any).developer?.logo_url ? 'top-[60px]' : 'top-3'} left-3 z-10 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${saleStatusBadge.className}`}>
                 {saleStatusBadge.label}
               </div>
             )}
           
           {/* Bottom-Right: Handover Year */}
           {project.handover_date && (
             <div className="absolute bottom-3 right-3 z-10 bg-handover text-handover-foreground px-2.5 py-1 rounded text-xs font-bold shadow-[0_10px_25px_hsl(0_0%_0%/0.25)]">
               {project.handover_date}
             </div>
           )}
         </div>
         
         {/* Content */}
         <div className="p-4 flex-1 flex flex-col">
           {/* Project Name */}
           <h4 className="text-foreground text-lg font-bold mb-1 line-clamp-1 hover:text-gold transition-colors">
             {project.name}
           </h4>
           
           {/* Location with icon */}
           {project.location && (
             <div className="flex items-center gap-1.5 text-muted-foreground text-sm mb-2">
               <MapPin className="w-3.5 h-3.5 text-gold/70 flex-shrink-0" />
               <span className="truncate">{project.location}</span>
             </div>
           )}
           
           {/* Divider */}
           <div className="h-px bg-gold/20 my-2" />
           
         {/* Starting Price */}
         <p className="text-sm mb-2">
           {project.price_from ? (
             <>
               <span className="text-muted-foreground">Starting from </span>
               <span className="text-handover font-bold text-lg">
                 {formatPriceWithCurrency(project.price_from, currency)}
               </span>
             </>
           ) : (project.sale_status?.toLowerCase().includes('sold') || project.status_label?.toLowerCase().includes('sold')) ? (
             <span className="text-red-500 font-bold text-lg">Sold</span>
           ) : (
             <span className="text-gold font-medium">Price on Request</span>
           )}
         </p>
           
           {/* Developer - Gold styled */}
           {project.developer_name && (
             <p className="text-sm mb-3">
               <span className="text-muted-foreground">by </span>
               <span className="text-gold font-medium">{project.developer_name}</span>
             </p>
           )}
           
           {/* Size info */}
           <div className="flex items-center gap-2 text-muted-foreground text-xs mb-3 flex-wrap">
             {getSizeText() && (
               <span>{getSizeText()}</span>
             )}
             {project.emirate && (
               <>
                 <span className="text-gold/50">|</span>
                 <span>{project.emirate}</span>
               </>
             )}
           </div>
           
           {/* Description with ...more link */}
           <p className="text-muted-foreground text-sm leading-relaxed mb-3 flex-1 line-clamp-2">
              {getTruncatedDescription() || "Discover this exceptional property opportunity..."}
              <span 
                className="bg-gradient-to-r from-gold via-handover to-gold bg-clip-text text-transparent hover:opacity-80 cursor-pointer ml-1 font-semibold inline-block"
              >
                ...more
              </span>
           </p>
         </div>
       </Link>
 
       {/* CTA Buttons */}
       <div className="px-4 pb-4 pt-0">
         <div className="grid grid-cols-3 gap-2 border-t border-gold/20 pt-3">
           <Button asChild variant="secondary" size="sm" className="w-full">
             <a
               href={`mailto:${CONTACT_INFO.email}?subject=Inquiry: ${encodeURIComponent(project.name)}&body=${encodeURIComponent(`Hello JBJ Global Real Estate,\n\nI am interested in ${project.name}${project.location ? ` located in ${project.location}` : ''}.\n\nPlease provide more details.\n\nThank you.`)}`}
               onClick={(e) => e.stopPropagation()}
               aria-label={`Email about ${project.name}`}
             >
               <Mail className="w-4 h-4" />
               <span>Email</span>
             </a>
           </Button>
           <Button asChild variant="secondary" size="sm" className="w-full">
             <a href={callHref} onClick={(e) => e.stopPropagation()} aria-label={`Call about ${project.name}`}>
               <Phone className="w-4 h-4" />
               <span>Call</span>
             </a>
           </Button>
           <Button asChild variant="secondary" size="sm" className="w-full">
             <a href={whatsappHref} onClick={(e) => e.stopPropagation()} aria-label={`WhatsApp about ${project.name}`}>
               <MessageCircle className="w-4 h-4" />
               <span>WhatsApp</span>
             </a>
           </Button>
         </div>
       </div>
     </div>
   );
 };
 
 export default ReellyProjectCard;