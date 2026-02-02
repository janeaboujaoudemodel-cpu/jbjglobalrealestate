import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/useProjects";
import PropertyReportModal from "@/components/PropertyReportModal";
import ProjectDetailLayout, { type ProjectDetailData } from "@/components/project-detail/ProjectDetailLayout";
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

const ProjectDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { data: project, isLoading } = useProject(slug || "");
  const [showReportModal, setShowReportModal] = useState(false);

  const mapped = useMemo<ProjectDetailData | null>(() => {
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
      developer: project.developer ? { name: project.developer.name, slug: project.developer.slug } : null,
      price_from: project.price_from,
      price_to: project.price_to,
      bedrooms_min: project.bedrooms_min,
      bedrooms_max: project.bedrooms_max,
      size_min: project.size_min,
      size_max: project.size_max,
      handover_date: project.handover_date,
      payment_plan: project.payment_plan,
      property_type_label: project.property_type_label,
      status_label: project.status_label,
      amenities: project.amenities,
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
    };
  }, [project]);

  if (isLoading) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 bg-black">
        <div className="container mx-auto px-4">
          <Skeleton className="h-8 w-48 bg-zinc-800 mb-8" />
          <Skeleton className="aspect-[16/9] w-full rounded-lg bg-zinc-800 mb-8" />
          <Skeleton className="h-12 w-64 bg-zinc-800 mb-4" />
          <Skeleton className="h-6 w-full max-w-2xl bg-zinc-800" />
        </div>
      </section>
    );
  }

  if (!project || !mapped) {
    return (
      <section className="relative w-full min-h-screen py-16 md:py-24 flex items-center justify-center bg-premium-bg">
        <div className="text-center">
          <h1 className="text-primary-foreground text-2xl mb-4">Project not found</h1>
          <Link to="/properties">
            <Button variant="secondary">Back to Properties</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <ProjectDetailLayout project={mapped} onRequestReport={() => setShowReportModal(true)} />

      <PropertyReportModal
        open={showReportModal}
        onOpenChange={setShowReportModal}
        project={project}
      />
    </>
  );
};

export default ProjectDetail;