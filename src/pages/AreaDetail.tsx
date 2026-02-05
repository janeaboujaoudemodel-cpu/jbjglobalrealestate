 /**
  * AreaDetail Component - Database-Driven Area Detail Page
  * Displays REAL area data from the database (Reelly-synced)
  */
 
 import { useParams, Link, Navigate } from "react-router-dom";
 import { motion } from "framer-motion";
 import { MapPin, ArrowUpRight, Building2, ChevronRight, Phone, Loader2, ArrowRight, TrendingUp } from "lucide-react";
 import { SEOHead } from "@/components/SEOHead";
 import { Button } from "@/components/ui/button";
 import { useAreaBySlug, useAreas } from "@/hooks/useAreas";
 
 const fadeInUp = {
   hidden: { opacity: 0, y: 30 },
   visible: { opacity: 1, y: 0, transition: { duration: 0.6 } }
 };
 
 const staggerContainer = {
   hidden: { opacity: 0 },
   visible: {
     opacity: 1,
     transition: { staggerChildren: 0.1, delayChildren: 0.1 }
   }
 };
 
 const AreaDetail = () => {
   const { slug } = useParams<{ slug: string }>();
   const { data: area, isLoading } = useAreaBySlug(slug);
   const { data: allAreas } = useAreas({ limit: 6 });
 
   if (isLoading) {
     return (
       <div className="min-h-screen bg-black flex items-center justify-center">
         <div className="text-center">
           <Loader2 className="w-10 h-10 text-gold animate-spin mx-auto mb-4" />
           <p className="text-zinc-400">Loading area...</p>
         </div>
       </div>
     );
   }
 
   if (!area && !isLoading) {
     return <Navigate to="/areas" replace />;
   }
 
   if (!area) return null;
 
   const relatedAreas = allAreas?.filter(a => a.id !== area.id && a.emirate === area.emirate).slice(0, 4) || [];
 
   return (
     <div className="min-h-screen bg-black">
       <SEOHead 
         title={`${area.name} - Real Estate in ${area.emirate} | JBJ`}
         description={area.description || `Explore properties in ${area.name}, ${area.emirate}.`}
         keywords={`${area.name} properties, ${area.emirate} real estate`}
         canonicalPath={`/area/${area.slug}`}
       />
 
       {/* Hero Section */}
       <section className="relative bg-gradient-to-br from-black via-zinc-900 to-black py-20 md:py-32 overflow-hidden">
         <div className="absolute inset-0 opacity-10">
           <div className="absolute top-0 left-0 w-full h-full" style={{
             backgroundImage: `radial-gradient(circle at 25% 25%, rgba(200,167,102,0.3) 0%, transparent 50%)`
           }} />
         </div>
 
         <motion.div 
           className="relative z-10 container mx-auto px-4"
           initial="hidden"
           animate="visible"
           variants={staggerContainer}
         >
           <motion.nav 
             className="flex items-center gap-2 text-sm mb-8"
             variants={fadeInUp}
           >
             <Link to="/" className="text-zinc-400 hover:text-white transition-colors">Home</Link>
             <ChevronRight className="w-4 h-4 text-zinc-600" />
             <Link to="/areas" className="text-zinc-400 hover:text-white transition-colors">Areas</Link>
             <ChevronRight className="w-4 h-4 text-zinc-600" />
             <span className="text-gold">{area.name}</span>
           </motion.nav>
 
           <motion.div className="flex items-center gap-2 mb-4" variants={fadeInUp}>
             <MapPin className="w-5 h-5 text-gold" />
             <span className="text-gold text-sm uppercase tracking-wider">{area.emirate}, UAE</span>
             {area.is_trending && (
               <span className="ml-2 inline-flex items-center gap-1 px-2 py-0.5 bg-amber-500/20 text-amber-400 text-xs rounded-full">
                 <TrendingUp className="w-3 h-3" />
                 Trending
               </span>
             )}
           </motion.div>
           
           <motion.h1 
             className="text-white text-4xl md:text-5xl lg:text-6xl font-bold mb-6 max-w-3xl"
             style={{ fontFamily: "Poppins, sans-serif" }}
             variants={fadeInUp}
           >
             {area.name}
           </motion.h1>
           
           {area.description && (
             <motion.p 
               className="text-zinc-300 text-lg md:text-xl max-w-2xl leading-relaxed"
               variants={fadeInUp}
             >
               {area.description}
             </motion.p>
           )}
 
           <motion.div className="flex flex-wrap gap-6 mt-8" variants={fadeInUp}>
             {(area.property_count ?? 0) > 0 && (
               <div className="bg-white/5 border border-gold/30 rounded-xl px-6 py-4">
                 <div className="text-2xl md:text-3xl font-bold text-gold">{area.property_count}</div>
                 <div className="text-zinc-400 text-sm">Properties</div>
               </div>
             )}
           </motion.div>
         </motion.div>
       </section>
 
       {/* CTA Section */}
       <section className="py-16 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3]">
         <div className="container mx-auto px-4">
           <motion.div 
             className="max-w-4xl mx-auto text-center bg-white rounded-3xl p-10 md:p-12 border border-gold/30 shadow-lg"
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
           >
             <h2 
               className="text-black text-2xl md:text-3xl font-bold mb-4"
               style={{ fontFamily: "Poppins, sans-serif" }}
             >
               Explore Properties in {area.name}
             </h2>
             <p className="text-zinc-600 text-lg mb-8 max-w-2xl mx-auto">
               Browse our collection of verified properties in this area.
             </p>
             <div className="flex flex-wrap justify-center gap-4">
               <Link to={`/properties?area=${area.slug}`}>
                 <Button variant="dark" className="px-8 py-6 text-base">
                   View Properties
                   <ArrowUpRight className="w-5 h-5 ml-2" />
                 </Button>
               </Link>
               <Link to="/contact">
                 <Button variant="secondary" className="border-black text-black hover:bg-black hover:text-white px-8 py-6 text-base">
                   <Phone className="w-5 h-5 mr-2" />
                   Contact Us
                 </Button>
               </Link>
             </div>
           </motion.div>
         </div>
       </section>
 
       {/* Related Areas */}
       {relatedAreas.length > 0 && (
         <section className="py-16 bg-black">
           <div className="container mx-auto px-4">
             <motion.div
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               viewport={{ once: true }}
             >
               <h2 
                 className="text-white text-2xl md:text-3xl font-bold mb-8 text-center"
                 style={{ fontFamily: "Poppins, sans-serif" }}
               >
                 Other Areas in {area.emirate}
               </h2>
               
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
                 {relatedAreas.map((relatedArea) => (
                   <Link 
                     key={relatedArea.slug}
                     to={`/area/${relatedArea.slug}`}
                     className="group p-4 bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] border border-gold/30 rounded-xl hover:border-gold hover:shadow-xl transition-all"
                   >
                     <h3 className="text-black font-semibold text-sm group-hover:text-gold transition-colors mb-1">
                       {relatedArea.name}
                     </h3>
                     <div className="flex items-center gap-1 text-xs text-zinc-500">
                       <MapPin className="w-3 h-3" />
                       <span>{relatedArea.emirate}</span>
                     </div>
                     {(relatedArea.property_count ?? 0) > 0 && (
                       <div className="mt-2 text-xs text-gold">
                         {relatedArea.property_count} properties
                       </div>
                     )}
                   </Link>
                 ))}
               </div>
               
               <div className="text-center mt-8">
                 <Link 
                   to="/areas"
                   className="text-gold hover:text-gold-light transition-colors inline-flex items-center gap-2"
                 >
                   View All Areas
                   <ArrowRight className="w-4 h-4" />
                 </Link>
               </div>
             </motion.div>
           </div>
         </section>
       )}
     </div>
   );
 };
 
 export default AreaDetail;