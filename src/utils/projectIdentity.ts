export interface ProjectIdentityInput {
  id?: string | null;
  slug?: string | null;
  name?: string | null;
  developerName?: string | null;
}

const CANONICAL_PROJECT_ALIASES: Record<string, { id: string; slug: string; name: string }> = {
  "36517cf3-bcab-436e-9f99-e5ff0de05ddd": {
    id: "d37d6d63-bb7c-458b-9fb8-50574c7291e2",
    slug: "agua",
    name: "Agua",
  },
  "agua-residences-citi-developers-2314": {
    id: "d37d6d63-bb7c-458b-9fb8-50574c7291e2",
    slug: "agua",
    name: "Agua",
  },
  "898c26d1-a22b-4c58-b802-65853609c885": {
    id: "9a7e228e-7023-42eb-8b90-1dcd86698049",
    slug: "arya",
    name: "Arya",
  },
  "arya-residences-citi-developers-dubai-islands": {
    id: "9a7e228e-7023-42eb-8b90-1dcd86698049",
    slug: "arya",
    name: "Arya",
  },
};

export const canonicalizeProjectIdentity = <T extends ProjectIdentityInput>(project: T): T => {
  const alias = CANONICAL_PROJECT_ALIASES[project.id || ""] || CANONICAL_PROJECT_ALIASES[project.slug || ""];
  return alias ? { ...project, ...alias } : project;
};

export const getCanonicalProjectKey = (project: ProjectIdentityInput): string => {
  const canonical = canonicalizeProjectIdentity(project);
  const normalizedName = (canonical.name || canonical.slug || "")
    .toLowerCase()
    .replace(/\b(residences?|residential|towers?|apartments?|villas?)\b/g, " ")
    .replace(/[^a-z0-9]+/g, "");
  const developer = (canonical.developerName || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
  return `${developer}:${normalizedName}`;
};