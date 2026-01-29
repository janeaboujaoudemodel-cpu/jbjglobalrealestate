import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useProject } from "@/hooks/useProjects";
import PropertyReportModal from "@/components/PropertyReportModal";
import ProjectDetailLayout, { type ProjectDetailData } from "@/components/project-detail/ProjectDetailLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";

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