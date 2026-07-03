import { useEffect } from "react";
import { COMMUNITIES, DEVELOPERS, CANONICAL_HOST, toPlaceNode, toDeveloperNode, resolveDeveloperKey, resolveCommunityKey, type EntityRef } from "@/seo/entityRegistry";

/**
 * Drop-in schema emitter for entity-scoped pages. When a page is about a
 * developer, community, or place we already know in the registry, this
 * component emits the canonical @id node PLUS a WebPage node that binds
 * this route to the entity via `mainEntity` / `about`.
 *
 * This is what makes Google Knowledge Graph, Perplexity, Gemini and
 * ChatGPT recognize the route as the authoritative page for that entity.
 *
 * Usage on a developer page:
 *   <SchemaEntity kind="developer" slug="emaar" pageTitle="Emaar Properties — Live Projects" />
 *
 * Usage on a community/area page:
 *   <SchemaEntity kind="community" slug="palmJumeirah" pageTitle="Palm Jumeirah Villas & Apartments" />
 *
 * Falls back gracefully when the slug is not in the registry (emits
 * nothing rather than a broken node).
 */
type Kind = "developer" | "community";

interface Props {
  kind: Kind;
  /** Key from DEVELOPERS or COMMUNITIES registry. */
  slug: string;
  /** Human page title (falls back to entity name). */
  pageTitle?: string;
  /** Absolute URL of the page (falls back to entity.url or window.location.href). */
  pageUrl?: string;
}

export function SchemaEntity({ kind, slug, pageTitle, pageUrl }: Props) {
  useEffect(() => {
    const registry = kind === "developer" ? DEVELOPERS : COMMUNITIES;
    const resolvedKey =
      (kind === "developer" ? resolveDeveloperKey(slug) : resolveCommunityKey(slug)) ?? slug;
    const entity: EntityRef | undefined = registry[resolvedKey];
    if (!entity) return;

    const url = pageUrl || entity.url || (typeof window !== "undefined" ? window.location.href : CANONICAL_HOST);
    const title = pageTitle || entity.name;

    const entityNode = kind === "developer" ? toDeveloperNode(entity) : toPlaceNode(entity, "AdministrativeArea");

    const webPage = {
      "@type": "WebPage",
      "@id": `${url}#webpage`,
      url,
      name: title,
      inLanguage: "en",
      isPartOf: { "@id": `${CANONICAL_HOST}/#website` },
      about: { "@id": entity.id },
      mainEntity: { "@id": entity.id },
      primaryImageOfPage: entity.url ? undefined : undefined,
      publisher: { "@id": `${CANONICAL_HOST}/#organization` },
    };

    const graph = {
      "@context": "https://schema.org",
      "@graph": [entityNode, webPage],
    };

    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.setAttribute("data-schema-entity", `${kind}:${slug}`);
    script.textContent = JSON.stringify(graph);
    document.head.appendChild(script);
    return () => script.remove();
  }, [kind, slug, pageTitle, pageUrl]);

  return null;
}

export default SchemaEntity;
