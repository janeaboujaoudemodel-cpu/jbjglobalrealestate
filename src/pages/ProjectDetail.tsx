import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/useProjects";
import { useReellyProjectBySlug } from "@/hooks/useReellyProjects";
import type { ReellyProject } from "@/hooks/useReellyProjects";
import PropertyReportModal from "@/components/PropertyReportModal";
import ProjectDetailLayout, { type ProjectDetailData } from "@/components/project-detail/ProjectDetailLayout";
import { BrandedLoader } from "@/components/ui/BrandedLoader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

const asStringArray = (value: unknown): string[] | null => {
  if (!Array.isArray(value)) return null;
  const out = value.filter((v): v is string => typeof v === "string" && v.trim().length > 0);
  return out.length ? out : null;
};

const asFaqs = (value: unknown): Array<{ question: string; answer: string }> | null => {
  if (!Array.isArray(value)) return null;
  const out = value
    .map((v) => {
      const o = v as Record<string, unknown>;
      const q = typeof o.question === "string" ? o.question : typeof o.q === "string" ? o.q : "";
      const a = typeof o.answer === "string" ? o.answer : typeof o.a === "string" ? o.a : "";
      return { question: q.trim(), answer: a.trim() };
    })
    .filter((v) => v.question && v.answer);
  return out.length ? out : null;
};

const asLocationDistances = (value: unknown): Array<{ label: string; time: string }> | null => {
  if (!Array.isArray(value)) return null;
  const out = value
    .map((v) => {
      const o = v as Record<string, unknown>;
      const label =
        typeof o.label === "string"
          ? o.label
          : typeof o.place === "string"
            ? o.place
            : typeof o.name === "string"
              ? o.name
              : "";
      const time =
        typeof o.time === "string"
          ? o.time
          : typeof o.distance === "string"
            ? o.distance
            : typeof o.value === "string"
              ? o.value
              : "";
      return { label: label.trim(), time: time.trim() };
    })
    .filter((v) => v.label && v.time);
  return out.length ? out : null;
};

const asPaymentBreakdown = (value: unknown): { down_payment?: string; during_construction?: string; on_completion?: string } | null => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const o = value as Record<string, unknown>;

  const down_payment = typeof o.down_payment === "string" ? o.down_payment : undefined;
  const during_construction = typeof o.during_construction === "string" ? o.during_construction : undefined;
  const on_completion = typeof o.on_completion === "string" ? o.on_completion : undefined;

  if (!down_payment && !during_construction && !on_completion) return null;
  return { down_payment, during_construction, on_completion };
};

const asFloorPlanTypes = (value: unknown): Array<{ label: string; pdfUrl?: string }> | null => {
  if (!Array.isArray(value)) return null;
  const out = value
    .map((v) => {
      const o = v as Record<string, unknown>;
      const label = typeof o.label === "string" ? o.label : typeof o.type === "string" ? o.type : "";
      const pdfUrl = typeof o.pdfUrl === "string" ? o.pdfUrl : typeof o.url === "string" ? o.url : undefined;
      return { label: label.trim(), pdfUrl };
    })
    .filter((v) => v.label);
  return out.length ? out : null;
};

const asUnitTypes = (
  value: unknown,
): Array<{ type: string; size_from?: number; size_to?: number; price_from?: number; price_to?: number; available_units?: number; total_units?: number; status?: "available" | "limited" | "sold_out" }> | null => {
  if (!Array.isArray(value) || value.length === 0) return null;

  // Group raw entries by bedroom count — only use exact data from Reelly API
  const grouped = new Map<string, { count: number; sizes: number[]; prices: number[] }>();
  
  for (const v of value) {
    const o = v as Record<string, unknown>;
    const bedrooms = typeof o.bedrooms === "number" ? o.bedrooms : null;
    const rawType = typeof o.type === "string" ? o.type : null;
    
    let label: string;
    if (bedrooms !== null) {
      label = bedrooms === 0 ? "Studio" : bedrooms === 1 ? "1 Bedroom" : `${bedrooms} Bedrooms`;
    } else if (rawType && rawType !== "Unit") {
      label = rawType;
    } else {
      label = "Unit";
    }
    
    const entry = grouped.get(label) || { count: 0, sizes: [], prices: [] };
    entry.count++;
    
    const sizeFrom = typeof o.size_from === "number" ? o.size_from : (typeof o.size_min === "number" ? o.size_min : (typeof o.size === "number" ? o.size : null));
    const sizeTo = typeof o.size_to === "number" ? o.size_to : (typeof o.size_max === "number" ? o.size_max : null);
    const priceFrom = typeof o.price_from === "number" ? o.price_from : (typeof o.price === "number" ? o.price : null);
    const priceTo = typeof o.price_to === "number" ? o.price_to : null;
    
    if (sizeFrom) entry.sizes.push(sizeFrom);
    if (sizeTo) entry.sizes.push(sizeTo);
    if (priceFrom) entry.prices.push(priceFrom);
    if (priceTo) entry.prices.push(priceTo);
    
    grouped.set(label, entry);
  }

  const out = Array.from(grouped.entries()).map(([type, data]) => ({
    type,
    size_from: data.sizes.length ? Math.min(...data.sizes) : undefined,
    size_to: data.sizes.length ? Math.max(...data.sizes) : undefined,
    price_from: data.prices.length ? Math.min(...data.prices) : undefined,
    price_to: data.prices.length ? Math.max(...data.prices) : undefined,
    total_units: data.count > 1 ? data.count : undefined,
    available_units: undefined,
    status: undefined as "available" | "limited" | "sold_out" | undefined,
  }));

  return out.length ? out : null;
};

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useProject(slug || "");
  const { data: reellyProject, isLoading: reellyLoading } = useReellyProjectBySlug(slug, !project && !isLoading);
  const [showReportModal, setShowReportModal] = useState(false);

  // Map from local DB project
  const mappedFromDb = useMemo<ProjectDetailData | null>(() => {
    if (!project) return null;

    const images = (project.images || [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((img) => ({ id: img.id, url: img.image_url, alt: img.alt_text }));

    const documents = (project.documents || [])
      .slice()
      .sort((a, b) => (a.display_order ?? 0) - (b.display_order ?? 0))
      .map((d) => ({ id: d.id, type: d.document_type, url: d.file_url, name: d.file_name }));

    return {
      id: project.id,
      name: project.name,
      slug: project.slug,
      description: project.description,
      location: project.location,
      developer: project.developer ? { 
        name: project.developer.name, 
        slug: project.developer.slug,
        logo_url: (project.developer as any).logo_url ?? null,
        founded_year: (project.developer as any).founded_year ?? null,
        completed_projects: (project.developer as any).completed_projects ?? null,
        offplan_projects: (project.developer as any).offplan_projects ?? null,
        description: (project.developer as any).description ?? null,
        headquarters: (project.developer as any).headquarters ?? null,
      } : null,
      price_from: project.price_from,
      price_to: project.price_to,
      bedrooms_min: project.bedrooms_min,
      bedrooms_max: project.bedrooms_max,
      size_min: project.size_min,
      size_max: project.size_max,
      floors: project.floors,
      handover_date: project.handover_date,
      payment_plan: project.payment_plan,
      property_type_label: project.property_type_label,
      status_label: project.status_label,
      amenities: project.amenities,
      amenity_images: project.amenity_images ? (project.amenity_images as Record<string, string>) : null,
      images,
      documents,
      usp_headline: project.usp_headline ?? null,
      usp_bullets: asStringArray(project.usp_bullets),
      usp_image_url: project.usp_image_url ?? null,
      location_headline: project.location_headline ?? null,
      location_description: project.location_description ?? null,
      location_distances: asLocationDistances(project.location_distances),
      location_image_url: project.location_image_url ?? null,
      floor_plan_types: asFloorPlanTypes(project.floor_plan_types),
      faqs: asFaqs(project.faqs),
      payment_breakdown: asPaymentBreakdown(project.payment_breakdown),
      unit_types: asUnitTypes(project.unit_types),
      construction_progress: project.construction_progress ?? null,
      construction_start_date: project.construction_start_date ?? null,
      expected_completion: project.expected_completion ?? null,
      availability_status: project.availability_status ?? null,
      total_units: project.total_units ?? null,
      available_units: project.available_units ?? null,
      down_payment_percent: project.down_payment_percent ?? null,
      video_url: project.video_url ?? null,
      virtual_tour_url: project.virtual_tour_url ?? null,
      roi_estimate: project.roi_estimate ?? null,
      rental_yield_estimate: project.rental_yield_estimate ?? null,
      service_charge: project.service_charge ?? null,
      finishing_standard: undefined,
      ceiling_height: undefined,
      master_plan_image_url: undefined,
      community_highlights: undefined,
      updated_at: project.updated_at ?? null,
      import_source: project.import_source ?? null,
      external_id: project.external_id ?? null,
      cover_image_url: project.cover_image_url ?? null,
      area_name: project.area_name ?? null,
    };
  }, [project]);

  // Map from Reelly API fallback
  const mappedFromReelly = useMemo<ProjectDetailData | null>(() => {
    if (!reellyProject || project) return null;
    const rp = reellyProject as ReellyProject;
    const images = (rp.images || []).map((img, i) => ({
      id: `reelly-${i}`,
      url: img.image_url,
      alt: img.alt_text || rp.name,
    }));
    if (!images.length && rp.thumbnail) {
      images.push({ id: 'thumb', url: rp.thumbnail, alt: rp.name });
    }
    (rp.gallery || []).forEach((url, i) => {
      if (!images.find(img => img.url === url)) {
        images.push({ id: `gallery-${i}`, url, alt: rp.name });
      }
    });
    return {
      id: String(rp.id),
      name: rp.name,
      slug: rp.slug,
      description: rp.description,
      location: rp.location,
      developer: rp.developer_name ? { name: rp.developer_name, slug: rp.developer_name.toLowerCase().replace(/[^a-z0-9]+/g, '-') } : null,
      price_from: rp.price_from,
      price_to: rp.price_to,
      size_min: rp.size_min,
      size_max: rp.size_max,
      handover_date: rp.handover_date,
      status_label: rp.status_label,
      sale_status: rp.sale_status,
      emirate: rp.emirate,
      construction_status: rp.construction_status,
      images,
      documents: [],
      cover_image_url: rp.thumbnail,
    } as ProjectDetailData;
  }, [reellyProject, project]);

  const mapped = mappedFromDb || mappedFromReelly;

  if (isLoading || reellyLoading) {
    return (
      <section className="relative w-full min-h-screen bg-premium-bg flex items-center justify-center">
        <BrandedLoader text="Loading project..." />
      </section>
    );
  }

  if (!mapped) {
    return (
      <section className="relative w-full min-h-screen pt-32 pb-16 flex items-center justify-center bg-premium-bg">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-6 rounded-full border-2 border-gold/50 flex items-center justify-center bg-black/5">
            <span className="text-gold font-bold text-2xl" style={{ fontFamily: "serif" }}>J</span>
          </div>
          <h1 className="text-foreground text-2xl font-bold mb-2">Project not found</h1>
          <p className="text-muted-foreground mb-6">This project may have been removed or the link is incorrect.</p>
          <Link to="/properties">
            <Button variant="primary" className="px-8">Back to Properties</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <ProjectDetailLayout project={mapped} onRequestReport={() => setShowReportModal(true)} />

      {project && (
        <PropertyReportModal
          open={showReportModal}
          onOpenChange={setShowReportModal}
          project={project}
        />
      )}
    </>
  );
};

export default ProjectDetail;