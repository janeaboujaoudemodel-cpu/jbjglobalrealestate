/**
 * TestimonialsSection Component - Master Blueprint Specification
 * 3 testimonials slider with name and area + CTA to testimonials page
 */

import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Quote, ChevronLeft, ChevronRight, Star, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";

interface Testimonial {
  id: string;
  text: string;
  name: string;
  area: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    id: "1",
    text: "JBJ made the entire buying process seamless. From the first viewing to handover, they were professional, responsive, and genuinely cared about finding us the right home.",
    name: "Ahmed K.",
    area: "Downtown Dubai",
    rating: 5,
  },
  {
    id: "2",
    text: "Sold my apartment in just 3 weeks! The team's market knowledge and marketing strategy exceeded my expectations. Highly recommend for anyone looking to sell.",
    name: "Sarah M.",
    area: "Dubai Marina",
    rating: 5,
  },
  {
    id: "3",
    text: "As an investor, I appreciate their data-driven approach. They provided clear ROI analysis and helped me build a portfolio of 4 properties. True professionals.",
    name: "James L.",
    area: "Business Bay",
    rating: 5,
  },
];

const TestimonialsSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const { t } = useLanguage();

  // Auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  const goToPrev = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length);
  };

  const currentTestimonial = testimonials[currentIndex];

  return (
    <section className="bg-black">
      <div className="jj-layer-2">
        {/* Section Header */}
        <div className="text-center mb-10">
          <h2 
            className="text-2xl md:text-3xl font-bold text-black mb-3"
            style={{ fontFamily: "Poppins, sans-serif" }}
          >
            {t('testimonials.title', 'What Our Clients Say')}
          </h2>
          <p className="text-zinc-600 text-sm">
            {t('testimonials.subtitle', 'Real experiences from real clients')}
          </p>
        </div>

        {/* Testimonial Card */}
        <div className="max-w-3xl mx-auto">
          <div className="relative bg-gradient-to-br from-[#FDFBF7] via-[#F5F0E6] to-[#EDE4D3] rounded-2xl border-2 border-gold/30 p-8 md:p-12">
            {/* Quote Icon */}
            <div className="absolute -top-4 left-8">
              <div className="w-10 h-10 rounded-full bg-gold flex items-center justify-center shadow-lg">
                <Quote className="w-5 h-5 text-black" />
              </div>
            </div>

            {/* Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentTestimonial.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.4 }}
                className="text-center"
              >
                {/* Rating */}
                <div className="flex items-center justify-center gap-1 mb-4">
                  {Array.from({ length: currentTestimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-gold fill-gold" />
                  ))}
                </div>

                {/* Quote Text */}
                <p className="text-black text-lg md:text-xl leading-relaxed mb-6 italic">
                  "{currentTestimonial.text}"
                </p>

                {/* Attribution */}
                <div>
                  <p className="text-black font-semibold text-base">
                    {currentTestimonial.name}
                  </p>
                  <p className="text-zinc-500 text-sm">
                    {currentTestimonial.area}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>

            {/* Navigation */}
            <div className="absolute left-4 right-4 top-1/2 -translate-y-1/2 flex items-center justify-between pointer-events-none">
              <button
                onClick={goToPrev}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-gold border border-gold/30 flex items-center justify-center shadow-md transition-colors pointer-events-auto"
              >
                <ChevronLeft className="w-5 h-5 text-black" />
              </button>
              <button
                onClick={goToNext}
                className="w-10 h-10 rounded-full bg-white/80 hover:bg-gold border border-gold/30 flex items-center justify-center shadow-md transition-colors pointer-events-auto"
              >
                <ChevronRight className="w-5 h-5 text-black" />
              </button>
            </div>

          </div>

          {/* CTA to Testimonials Page */}
          <div className="text-center mt-8">
            <Link to="/services/testimonials">
              <Button variant="tertiary" size="lg" className="group">
                <span>{t('testimonials.readAll', 'Read All Testimonials')}</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
