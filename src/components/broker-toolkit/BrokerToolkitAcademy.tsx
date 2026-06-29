import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { GraduationCap, ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { BookCard } from "@/components/books/BookCard";
import { BROKER_BOOKS } from "@/data/bookCollections";

// BROKER_BOOKS already merges broker-specific titles (Training Manual,
// Certification Guide, Broker FAQ) with the investor-facing books a broker
// needs (Investor Education, Market Intelligence, Golden Visa, all
// Buyer/Seller/Landlord/Tenant guides + FAQs). Drop Company Profile here —
// it lives elsewhere — and keep everything else.
const SHELF = BROKER_BOOKS.filter((b) => b.title !== "Company Profile");

export function BrokerToolkitAcademy() {
  return (
    <section
      id="section-academy"
      className="jj-band jj-band--surface py-16 md:py-24"
    >
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center max-w-2xl mx-auto mb-12"
        >
          <Badge className="bg-[#EFE6D6] text-[#1A1A1A] border border-[#B89555]/40 mb-3">
            <GraduationCap className="w-3 h-3 mr-1.5" />
            JBJ Academy
          </Badge>
          <h2 className="text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight text-[#1A1A1A] mb-3">
            The Broker & Investor Library
          </h2>
          <p className="text-[#1A1A1A]/70 text-base md:text-lg">
            Everything a JBJ broker needs to sell with confidence — training,
            certification, market intelligence and the same guides your
            investors read before they buy.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-12 max-w-5xl mx-auto mb-14">
          {SHELF.map((book, i) => (
            <motion.div
              key={book.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.035, 0.4), duration: 0.45 }}
              viewport={{ once: true }}
              className="flex justify-center"
            >
              <BookCard book={book} size="md" href={book.href} />
            </motion.div>
          ))}
        </div>

        <div className="flex justify-center">
          <Link
            to="/jbj-academy"
            data-cta="academy-open"
            data-surface="emerald"
            className="jj-pill-emerald-metallic inline-flex items-center gap-2 h-11 px-6 rounded-full text-sm font-medium"
          >
            Open JBJ Academy
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
