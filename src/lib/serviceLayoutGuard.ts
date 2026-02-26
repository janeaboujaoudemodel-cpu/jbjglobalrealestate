export const MIN_VISIBLE_SECTION_HEIGHT = 120;

export type SectionMeasurement = {
  id: string;
  offsetHeight: number;
  scrollHeight: number;
};

export type ServiceLayoutSnapshot = {
  pathname: string;
  scrollPercent: number;
  mainHeight: number;
  heroSections: SectionMeasurement[];
  bodySections: SectionMeasurement[];
};

const EMPTY_SNAPSHOT: ServiceLayoutSnapshot = {
  pathname: "",
  scrollPercent: 0,
  mainHeight: 0,
  heroSections: [],
  bodySections: [],
};

function toSectionMeasurement(section: Element, index: number): SectionMeasurement {
  if (!(section instanceof HTMLElement)) {
    return {
      id: `section-${index + 1}`,
      offsetHeight: 0,
      scrollHeight: 0,
    };
  }

  return {
    id: section.id || `section-${index + 1}`,
    offsetHeight: section.offsetHeight,
    scrollHeight: section.scrollHeight,
  };
}

export function getServiceLayoutSnapshot(
  rootDocument: Document = document,
): ServiceLayoutSnapshot {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return EMPTY_SNAPSHOT;
  }

  const sections = Array.from(rootDocument.querySelectorAll("main section"));
  const [heroSection, ...bodySections] = sections.map(toSectionMeasurement);
  const mainEl = rootDocument.querySelector("main");
  const mainHeight = mainEl instanceof HTMLElement ? mainEl.offsetHeight : 0;

  const scrollableHeight = Math.max(
    1,
    rootDocument.documentElement.scrollHeight - window.innerHeight,
  );
  const scrollPercent = Math.max(
    0,
    Math.min(100, Math.round((window.scrollY / scrollableHeight) * 100)),
  );

  return {
    pathname: window.location.pathname,
    scrollPercent,
    mainHeight,
    heroSections: heroSection ? [heroSection] : [],
    bodySections,
  };
}

export function hasVisibleServiceBody(
  snapshot: ServiceLayoutSnapshot,
  minHeight: number = MIN_VISIBLE_SECTION_HEIGHT,
): boolean {
  return snapshot.bodySections.some(
    (section) =>
      section.offsetHeight > minHeight && section.scrollHeight > minHeight,
  );
}
