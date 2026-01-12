import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { LucideIcon, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface TOCItem {
  id: string;
  title: string;
  icon?: LucideIcon;
}

interface GuideTableOfContentsProps {
  items: TOCItem[];
  title?: string;
  sticky?: boolean;
}

export const GuideTableOfContents = ({ 
  items, 
  title = "In This Guide",
  sticky = true 
}: GuideTableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-100px 0px -50% 0px" }
    );

    items.forEach((item) => {
      const element = document.getElementById(item.id);
      if (element) observer.observe(element);
    });

    return () => observer.disconnect();
  }, [items]);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl p-6",
        sticky && "sticky top-24"
      )}
    >
      <div className="flex items-center gap-2 mb-4">
        <List className="w-5 h-5 text-gold" />
        <h3 className="text-white font-semibold">{title}</h3>
      </div>
      
      <nav className="space-y-1">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => scrollToSection(item.id)}
            className={cn(
              "w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left text-sm transition-all",
              activeId === item.id
                ? "bg-gold/20 text-gold border border-gold/30"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800"
            )}
          >
            <span className="w-6 h-6 rounded-full bg-zinc-800 flex items-center justify-center text-xs font-medium">
              {index + 1}
            </span>
            {item.icon && <item.icon className="w-4 h-4" />}
            <span className="flex-1">{item.title}</span>
          </button>
        ))}
      </nav>
    </motion.div>
  );
};

export default GuideTableOfContents;
