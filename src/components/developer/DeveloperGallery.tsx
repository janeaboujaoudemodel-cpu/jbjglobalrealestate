import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getHighResImageUrl } from "@/lib/imageUtils";
import { Images, X, ChevronLeft, ChevronRight } from "lucide-react";

type GalleryItem = { id: string; url: string; caption: string | null };

const DeveloperGallery = ({ developerId, developerName }: { developerId: string; developerName: string }) => {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [broken, setBroken] = useState<Record<string, boolean>>({});

  const { data } = useQuery({
    queryKey: ["developer-public-gallery", developerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("developer_media")
        .select("id, url, caption")
        .eq("developer_id", developerId)
        .eq("kind", "photo")
        .eq("is_public", true)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as GalleryItem[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const items = useMemo(() => (data || []).filter((item) => item.url && !broken[item.id]), [data, broken]);

  useEffect(() => {
    if (lightboxIndex === null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setLightboxIndex(null);
      if (event.key === "ArrowRight") setLightboxIndex((index) => (index === null ? null : (index + 1) % items.length));
      if (event.key === "ArrowLeft") setLightboxIndex((index) => (index === null ? null : (index - 1 + items.length) % items.length));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightboxIndex, items.length]);

  if (!items.length) return null;

  const active = lightboxIndex === null ? null : items[lightboxIndex];

  return (
    <section
      id="developer-gallery"
      data-developer-gallery
      className="mt-8 rounded-2xl overflow-hidden bg-gradient-to-br from-[#FDFBF7] via-[#F7F2EA] to-[#EFE6D6] border border-[#B89555]/70 shadow-[0_20px_60px_-36px_rgba(184,149,85,0.42)]"
    >
      <div
        data-no-contrast-guard
        className="jj-shimmer-champagne-live px-5 md:px-7 py-5"
        style={{ borderBottom: "1px solid rgba(184,149,85,0.7)" }}
      >
        <div className="flex items-center gap-3">
          <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black">
            <Images className="w-4 h-4 text-white" />
          </span>
          <div>
            <h2 className="font-cormorant text-2xl md:text-3xl leading-tight text-[#064E3B]">Project Gallery</h2>
            <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#1A1A1A]/70">
              {items.length} verified images from {developerName}
            </p>
          </div>
        </div>
      </div>

      <div className="p-4 md:p-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setLightboxIndex(index)}
            className="group flex w-full flex-col items-stretch overflow-hidden rounded-xl border border-[#B89555]/40 bg-white/70 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#064E3B]"
          >
            <span className="block w-full aspect-[4/3] shrink-0 overflow-hidden bg-[#F7F2EA]">
              <img
                src={getHighResImageUrl(item.url)}
                alt={item.caption || `${developerName} development`}
                loading="lazy"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={() => setBroken((prev) => ({ ...prev, [item.id]: true }))}
              />
            </span>
            {item.caption && (
              <span className="block w-full break-words bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black px-2.5 py-2 text-[11px] font-semibold leading-[1.4] text-white">
                {item.caption}
              </span>
            )}
          </button>
        ))}
      </div>

      {active && (
        <div
          className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 p-4"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
        >
          <button
            type="button"
            aria-label="Close gallery"
            onClick={() => setLightboxIndex(null)}
            className="absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black text-white"
          >
            <X className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Previous image"
            onClick={(event) => { event.stopPropagation(); setLightboxIndex((index) => (index === null ? null : (index - 1 + items.length) % items.length)); }}
            className="absolute left-3 md:left-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={(event) => { event.stopPropagation(); setLightboxIndex((index) => (index === null ? null : (index + 1) % items.length)); }}
            className="absolute right-3 md:right-6 inline-flex h-11 w-11 items-center justify-center rounded-full bg-gradient-to-br from-[#064E3B] via-[#042c1c] to-black text-white"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
          <figure className="max-h-full max-w-5xl" onClick={(event) => event.stopPropagation()}>
            <img
              src={getHighResImageUrl(active.url)}
              alt={active.caption || `${developerName} development`}
              className="max-h-[78vh] w-auto rounded-xl object-contain"
            />
            {active.caption && (
              <figcaption className="mt-3 text-center text-sm font-semibold text-white">{active.caption}</figcaption>
            )}
          </figure>
        </div>
      )}
    </section>
  );
};

export default DeveloperGallery;
