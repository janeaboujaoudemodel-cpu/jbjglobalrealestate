 import { Skeleton } from "@/components/ui/skeleton";
 
 /**
  * Loading skeleton for ProjectCard - matches the exact layout
  */
 export function ProjectCardSkeleton() {
   return (
     <div
       className={
         "relative overflow-hidden rounded-xl border-2 border-[#B89555]/20 flex flex-col " +
         "bg-[linear-gradient(135deg,hsl(var(--pearl-1)),hsl(var(--pearl-2)),hsl(var(--pearl-3)))]"
       }
     >
       {/* Image skeleton - matches aspect-[16/10] */}
       <div className="aspect-[16/10] relative">
         <Skeleton className="absolute inset-0 bg-[#EFE6D6]/10" />
         {/* Handover badge skeleton */}
         <div className="absolute bottom-3 right-3">
           <Skeleton className="h-6 w-20 rounded bg-[#EFE6D6]/20" />
         </div>
       </div>
       
       {/* Content skeleton */}
       <div className="p-4 flex-1 flex flex-col">
         {/* Title */}
         <Skeleton className="h-6 w-3/4 mb-2 bg-[#EFE6D6]/10" />
         
         {/* Location */}
         <div className="flex items-center gap-1.5 mb-2">
           <Skeleton className="h-3.5 w-3.5 rounded-full bg-[#EFE6D6]/10" />
           <Skeleton className="h-4 w-1/2 bg-[#EFE6D6]/10" />
         </div>
         
         {/* Divider */}
         <div className="h-px bg-[#EFE6D6]/10 my-2" />
         
         {/* Price */}
         <Skeleton className="h-6 w-2/5 mb-2 bg-[#EFE6D6]/10" />
         
         {/* Developer */}
         <Skeleton className="h-4 w-1/3 mb-3 bg-[#EFE6D6]/10" />
         
         {/* Unit types */}
         <div className="flex items-center gap-2 mb-3">
           <Skeleton className="h-3 w-16 bg-[#EFE6D6]/10" />
           <Skeleton className="h-3 w-20 bg-[#EFE6D6]/10" />
         </div>
         
         {/* Description */}
         <Skeleton className="h-4 w-full mb-1 bg-[#EFE6D6]/10" />
         <Skeleton className="h-4 w-4/5 mb-3 bg-[#EFE6D6]/10" />
       </div>
 
       {/* CTA Buttons skeleton */}
       <div className="px-4 pb-4 pt-0">
         <div className="grid grid-cols-3 gap-2 border-t border-[#B89555]/10 pt-3">
           <Skeleton className="h-8 rounded bg-[#EFE6D6]/10" />
           <Skeleton className="h-8 rounded bg-[#EFE6D6]/10" />
           <Skeleton className="h-8 rounded bg-[#EFE6D6]/10" />
         </div>
       </div>
     </div>
   );
 }
 
 export function ProjectGridSkeleton({ count = 6 }: { count?: number }) {
   return (
     <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8 p-4">
       {Array.from({ length: count }).map((_, i) => (
         <ProjectCardSkeleton key={i} />
       ))}
     </div>
   );
 }