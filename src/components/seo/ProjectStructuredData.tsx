import { useEffect } from "react";
import type { ProjectDetailData } from "@/components/project-detail/ProjectDetailLayout";

interface Props {
  project: ProjectDetailData;
  slug: string;
}

const BASE_URL = "https://jbj.ae";

/**
 * Injects schema.org structured data for a real estate project listing.
 * Renders Product + RealEstateListing + FAQPage (when faqs present).
 */
export const ProjectStructuredData = ({ project, slug }: Props) => {
  useEffect(() => {
    const url = `${BASE_URL}/project/${slug}`;
    const firstImage = project.images && project.images[0];
    const image = project.cover_image_url || (firstImage ? firstImage.url : `${BASE_URL}/og-image.jpg`);
    const description = (project.description || `${project.name} — premium Dubai real estate listing.`)
      .replace(/<[^>]+>/g, "")
      .slice(0, 500);

    const schemas: object[] = [];

    // Product / RealEstateListing schema
    schemas.push({
      "@context": "https://schema.org",
      "@type": ["Product", "Residence"],
      name: project.name,
      description,
      image,
      url,
      brand: project.developer?.name
        ? { "@type": "Organization", name: project.developer.name }
        : undefined,
      offers:
        project.price_from || project.price_to
          ? {
              "@type": "Offer",
              priceCurrency: "AED",
              price: project.price_from || project.price_to,
              availability: "https://schema.org/InStock",
              url,
              seller: {
                "@type": "RealEstateAgent",
                name: "JBJ Global Real Estate",
                url: BASE_URL,
              },
            }
          : undefined,
    });

    // FAQ schema if present
    if (project.faqs && project.faqs.length > 0) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: project.faqs.map((f) => ({
          "@type": "Question",
          name: f.question,
          acceptedAnswer: { "@type": "Answer", text: f.answer },
        })),
      });
    }

    const injected: HTMLScriptElement[] = [];
    schemas.forEach((schema, i) => {
      const s = document.createElement("script");
      s.type = "application/ld+json";
      s.setAttribute("data-project-schema", String(i));
      s.textContent = JSON.stringify(schema);
      document.head.appendChild(s);
      injected.push(s);
    });

    return () => {
      injected.forEach((s) => s.remove());
    };
  }, [project, slug]);

  return null;
};

export default ProjectStructuredData;
